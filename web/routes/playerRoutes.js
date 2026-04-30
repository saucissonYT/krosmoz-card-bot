/* Routes: /api/profile, /api/me, /api/me/title, /api/me/inventory, /api/daily, /api/oauth/status */

const { getUser, save, updateActivityStreak } = require("../../systems/userSystem")
const { achievementCheck } = require("../../systems/achievementCheck")
const { addBattlePassXP } = require("../../systems/battlePassService")
const { claimDaily, canClaim: canClaimDaily } = require("../../systems/dailySystem")
const { recordProfileView } = require("../../systems/achievementProgressTracker")

module.exports = function mount(app, ctx) {
 const {
  requireSession, resolveSession, resolveDiscordUser, apiCache,
  buildMePayload, buildDailyStatePayload, buildInventoryPayload,
  shouldTrackProfileView, computeProfile, countUnlockedAchievements,
  oauthConfigured, canUseLocalAuth, buildLocalSession,
  BAN_KROSMOZ_IMAGE_PATH, MAINTENANCE_KROSMOZ_IMAGE_PATH,
  isBannedSession, isAdminSession, isMaintenanceSession, invalidateUserCaches
 } = ctx

 app.get("/api/profile/:id", async (req, res) => {
  try {
   const userId = req.params.id
   if (!/^\d{16,22}$/.test(userId)) return res.status(400).json({ error: "ID invalide" })
   const viewerSession = resolveSession(req)
   const canTrack = shouldTrackProfileView(req) && String(viewerSession?.userId || "") === String(userId)
   if (viewerSession?.userId && canTrack) {
    const viewer = getUser(String(viewerSession.userId))
    if (viewer) {
     recordProfileView(viewer)
     achievementCheck(viewer, "social")
     save(String(viewerSession.userId))
     invalidateUserCaches([viewerSession.userId], { invalidateLeaderboard: false })
    }
   }

   const profile = apiCache.getOrCompute(
     `profile:${userId}`,
     () => computeProfile(userId),
     30000
    )
   if (!profile) return res.status(404).json({ error: "Joueur introuvable" })

   const discord = await resolveDiscordUser(userId)
   res.json({ ...profile, discord })
  } catch (e) {
   console.error("[WEB] /api/profile:", e)
   res.status(500).json({ error: "Erreur serveur" })
  }
 })

 app.get("/api/sets", (req, res) => {
  try {
    res.json(ctx.getSetsWithCounts())
   } catch (e) {
    console.error("[WEB] /api/sets:", e)
    res.status(500).json({ error: "Erreur serveur" })
   }
  })

 app.get("/api/oauth/status", (req, res) => {
  const session = resolveSession(req)
  const banned = isBannedSession(session)
  const isAdmin = isAdminSession(session)
  const maintenance = isMaintenanceSession(session)
  const localAuthAvailable = canUseLocalAuth(req)
  const localAuthEnabled = Boolean(buildLocalSession(req))
  res.json({
   enabled: oauthConfigured() || localAuthEnabled,
   clientId: ctx.OAUTH_CLIENT_ID || null,
   connected: Boolean(session),
   userId: session?.userId || null,
   isAdmin,
   banned,
   banImage: banned ? BAN_KROSMOZ_IMAGE_PATH : null,
   maintenance,
   maintenanceImage: maintenance ? MAINTENANCE_KROSMOZ_IMAGE_PATH : null,
   localAuthAvailable,
   localAuthEnabled,
   localAuthSession: Boolean(session?.local)
  })
 })

 app.get("/api/me", async (req, res) => {
  try {
   const session = requireSession(req, res)
   if (!session) return
   const discord = await resolveDiscordUser(session.userId)
   const me = buildMePayload(session.userId)
   res.json({ ...me, discord })
  } catch (e) {
   console.error("[WEB] /api/me:", e)
   res.status(500).json({ error: "Erreur serveur" })
  }
 })

 app.get("/api/daily/state", (req, res) => {
  try {
   const session = resolveSession(req)
   if (!session) {
    return res.json({
     connected: false,
     state: {
      canClaim: false,
      nextClaimAt: 0,
      remainingMs: 0,
      streak: 0,
      lastDaily: 0
     }
    })
   }

   const user = getUser(session.userId)
   if (!user) return res.status(404).json({ error: "Joueur introuvable." })
   return res.json({
    connected: true,
    state: buildDailyStatePayload(user)
   })
  } catch (e) {
   console.error("[WEB] /api/daily/state:", e)
   return res.status(500).json({ error: "Erreur serveur" })
  }
 })

 app.post("/api/daily/claim", async (req, res) => {
  try {
   const session = requireSession(req, res)
   if (!session) return

   const user = getUser(session.userId)
   if (!user) return res.status(404).json({ error: "Joueur introuvable." })

   if (!canClaimDaily(user)) {
    return res.status(400).json({
     error: "Daily déjà récupérée.",
     state: buildDailyStatePayload(user)
    })
   }

   const result = await claimDaily(null, user, session.userId)

   updateActivityStreak(user)

   const streakNow = Math.max(0, Number(result?.streak || user?.daily?.streak || 0))
   const streakDay = Math.max(1, ((Math.max(1, streakNow) - 1) % 7) + 1)
   const xpGained = 25 + ((streakDay - 1) * 10)
   if (!user.progression || typeof user.progression !== "object") {
    user.progression = { level: 1, xp: 0, totalXp: 0 }
   }
   user.progression.xp = Number(user.progression.xp || 0) + xpGained
   user.progression.totalXp = Number(user.progression.totalXp || 0) + xpGained

   if (!user.stats || typeof user.stats !== "object") user.stats = {}
   user.stats.maxDailyStreak = Math.max(Number(user.stats.maxDailyStreak || 0), streakNow)

   let bpAddedXP = 0
   try {
    const bpResult = await addBattlePassXP(session.userId, "daily_claim")
    bpAddedXP = Number(bpResult?.addedXP || 0)
   } catch (_) {}

   const unlocked = [
    ...achievementCheck(user, "daily"),
    ...achievementCheck(user, "economy"),
    ...achievementCheck(user, "progression")
   ]

   save(session.userId)
   invalidateUserCaches([session.userId])

   return res.json({
    ok: true,
    result: {
     reward: result?.reward || null,
     streak: streakNow,
     streakBar: String(result?.streakBar || ""),
     doubleReward: Boolean(result?.doubleReward),
     doubleDailyChance: Number(result?.doubleDailyChance || 0),
     bonusPacksGiven: Number(result?.bonusPacksGiven || 0),
     bonusKamas: Number(result?.bonusKamas || 0),
     xpGained,
     bpAddedXP
    },
    unlockedAchievements: countUnlockedAchievements(unlocked),
    state: buildDailyStatePayload(user)
   })
  } catch (e) {
   console.error("[WEB] /api/daily/claim:", e)
   return res.status(500).json({ error: "Erreur serveur" })
  }
 })

 app.post("/api/me/title", (req, res) => {
  try {
    const session = requireSession(req, res)
    if (!session) return

    const user = getUser(session.userId)
    if (!user) return res.status(404).json({ error: "Joueur introuvable." })

    const nextTitle = String(req.body?.title || "").trim()
    if (!nextTitle) return res.status(400).json({ error: "Titre invalide." })

    if (!Array.isArray(user.titles) || user.titles.length <= 0) {
     user.titles = ["Nouveau"]
    }

    const hasTitle = user.titles.some((title) => String(title) === nextTitle)
    if (!hasTitle) {
     return res.status(400).json({ error: "Tu n'as pas débloqué ce titre." })
    }

   const previousTitle = String(user.title || "Nouveau")
   user.title = nextTitle
   user.stats = user.stats || {}
   if (previousTitle !== nextTitle) {
    user.stats.titleChanges = Number(user.stats.titleChanges || 0) + 1
   }
   save(session.userId)
    invalidateUserCaches([session.userId])

    return res.json({
     ok: true,
     title: String(user.title || "Nouveau"),
     titles: Array.isArray(user.titles) ? user.titles : ["Nouveau"]
    })
   } catch (e) {
    console.error("[WEB] /api/me/title:", e)
    return res.status(500).json({ error: "Erreur serveur" })
   }
  })

 app.get("/api/me/inventory", (req, res) => {
  try {
   const session = requireSession(req, res)
   if (!session) return
   const cacheKey = `inventory:${session.userId}`
   const payload = apiCache.getOrCompute(
    cacheKey,
    () => buildInventoryPayload(session.userId),
    10000
   )
   res.json(payload)
  } catch (e) {
   console.error("[WEB] /api/me/inventory:", e)
   res.status(500).json({ error: "Erreur serveur" })
  }
 })
}
