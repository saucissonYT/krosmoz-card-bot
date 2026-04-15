/* Routes: /api/battlepass/* */

const { getUser, save } = require("../../systems/userSystem")
const { achievementCheck } = require("../../systems/achievementCheck")
const {
 buyPremium,
 claimBattlePassLevelReward,
 claimAllBattlePassRewards,
 getBattlePassOverview,
 getBattlePassRewardsView
} = require("../../systems/battlePassService")
const { ensureCurrentSeason, getSeasonTemplate } = require("../../systems/seasonService")

module.exports = function mount(app, ctx) {
 const {
  requireSession, resolveDiscordUser,
  buildMePayload, countUnlockedAchievements
 } = ctx

 app.get("/api/battlepass/season", (req, res) => {
  try {
   const current = ensureCurrentSeason()
   const tpl = getSeasonTemplate(current.activeSeason)
   const now = new Date()
   const end = current?.endDate ? new Date(`${current.endDate}T23:59:59.999Z`) : null
   const daysRemaining = end ? Math.max(0, Math.ceil((end.getTime() - now.getTime()) / 86400000)) : null

   res.json({
    id: String(current.activeSeason || ""),
    name: String(tpl?.name || current.activeSeason || "Saison"),
    subtitle: String(tpl?.subtitle || ""),
    bonusDescription: String(tpl?.passiveBonus?.description || ""),
    emoji: String(tpl?.emoji || "🎟️"),
    startDate: current.startDate || null,
    endDate: current.endDate || null,
    daysRemaining
   })
  } catch (e) {
   console.error("[WEB] /api/battlepass/season:", e)
   res.status(500).json({ error: "Erreur serveur" })
  }
 })

 app.get("/api/battlepass/me", async (req, res) => {
  try {
   const session = requireSession(req, res)
   if (!session) return

   const overview = getBattlePassOverview(session.userId)
   const seasonLevels = Math.max(1, Number(overview?.seasonTemplate?.totalLevels || 40))
   const rewardsView = getBattlePassRewardsView(session.userId, 1, seasonLevels)
   const xpInLevel = Math.max(0, Number(overview?.xpInLevel || 0))
   const xpToNextLevel = Math.max(0, Number(overview?.xpToNextLevel || 0))
   const xpLevelMax = Math.max(1, xpInLevel + xpToNextLevel)
   const discord = await resolveDiscordUser(session.userId)

   res.json({
    me: buildMePayload(session.userId),
    discord,
    season: {
     id: String(overview?.currentSeason?.activeSeason || ""),
     name: String(overview?.seasonTemplate?.name || overview?.currentSeason?.activeSeason || "Saison"),
     subtitle: String(overview?.seasonTemplate?.subtitle || ""),
     bonusDescription: String(overview?.seasonTemplate?.passiveBonus?.description || ""),
     emoji: String(overview?.seasonTemplate?.emoji || "🎟️"),
     startDate: overview?.currentSeason?.startDate || null,
     endDate: overview?.currentSeason?.endDate || null,
     premiumPrice: Number(overview?.seasonTemplate?.premiumPrice || 18000),
     totalLevels: seasonLevels
    },
    progress: {
     totalXP: Number(overview?.progress?.totalXP || 0),
     currentLevel: Number(overview?.progress?.currentLevel || 1),
     hasPremium: Boolean(overview?.progress?.hasPremium),
     xpInLevel,
     xpToNextLevel,
     xpLevelMax,
     xpPercent: Math.min(100, Math.round((xpInLevel / xpLevelMax) * 100)),
     claimableCount: Number(overview?.claimableCount || 0)
    },
    stats: overview?.progress?.stats || {},
    rewards: (rewardsView?.rows || []).map((row) => ({
     level: Number(row.level || 0),
     freeRewards: Array.isArray(row.freeRewards) ? row.freeRewards : [],
     premiumRewards: Array.isArray(row.premiumRewards) ? row.premiumRewards : [],
     claimedFree: Boolean(row.claimedFree),
     claimedPremium: Boolean(row.claimedPremium),
     claimedFreeAt: row?.claimedFreeAt || null,
     claimedPremiumAt: row?.claimedPremiumAt || null
    }))
   })
  } catch (e) {
   console.error("[WEB] /api/battlepass/me:", e)
   res.status(500).json({ error: "Erreur serveur" })
  }
 })

 app.post("/api/battlepass/claim", async (req, res) => {
  try {
   const session = requireSession(req, res)
   if (!session) return

   const result = await claimAllBattlePassRewards(session.userId)
   if (!result?.ok) return res.status(400).json({ error: result?.error || "Impossible de reclamer." })

   const user = getUser(session.userId)
   const unlocked = user ? achievementCheck(user, "progression") : []
   if (user) save(session.userId)

   const overview = getBattlePassOverview(session.userId)
   res.json({
    ok: true,
    result,
    claimableCount: Number(overview?.claimableCount || 0),
    currentLevel: Number(overview?.progress?.currentLevel || 1),
    totalXP: Number(overview?.progress?.totalXP || 0),
    unlockedAchievements: countUnlockedAchievements(unlocked)
   })
  } catch (e) {
   console.error("[WEB] /api/battlepass/claim:", e)
   res.status(500).json({ error: "Erreur serveur" })
  }
 })

 app.post("/api/battlepass/claim-level", async (req, res) => {
  try {
   const session = requireSession(req, res)
   if (!session) return

   const level = Math.max(1, Math.floor(Number(req.body?.level || 0)))
   if (!Number.isFinite(level) || level <= 0) {
    return res.status(400).json({ error: "Palier invalide." })
   }

   const result = await claimBattlePassLevelReward(session.userId, level)
   if (!result?.ok) return res.status(400).json({ error: result?.error || "Impossible de reclamer ce palier." })

   const user = getUser(session.userId)
   const unlocked = user ? achievementCheck(user, "progression") : []
   if (user) save(session.userId)

   const overview = getBattlePassOverview(session.userId)
   res.json({
    ok: true,
    level,
    result,
    claimableCount: Number(overview?.claimableCount || 0),
    currentLevel: Number(overview?.progress?.currentLevel || 1),
    totalXP: Number(overview?.progress?.totalXP || 0),
    unlockedAchievements: countUnlockedAchievements(unlocked)
   })
  } catch (e) {
   console.error("[WEB] /api/battlepass/claim-level:", e)
   res.status(500).json({ error: "Erreur serveur" })
  }
 })

 app.post("/api/battlepass/premium", async (req, res) => {
  try {
   const session = requireSession(req, res)
   if (!session) return

   const result = await buyPremium(session.userId)
   if (!result?.ok) return res.status(400).json({ error: result?.error || "Achat premium impossible." })

   const user = getUser(session.userId)
   const unlocked = user ? achievementCheck(user, "economy") : []
   if (user) save(session.userId)

   const overview = getBattlePassOverview(session.userId)
   res.json({
    ok: true,
    result,
    hasPremium: Boolean(overview?.progress?.hasPremium),
    kamas: Number(getUser(session.userId)?.kamas || 0),
    unlockedAchievements: countUnlockedAchievements(unlocked)
   })
  } catch (e) {
   console.error("[WEB] /api/battlepass/premium:", e)
   res.status(500).json({ error: "Erreur serveur" })
  }
 })
}
