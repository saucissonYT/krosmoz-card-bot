/* Routes: /api/achievements, /api/achievements/claim */

const { getUser, save } = require("../../systems/userSystem")
const { achievementCheck } = require("../../systems/achievementCheck")
const { getAchievementReward, formatReward } = require("../../systems/achievementRewards")
const {
 ensureAchievementClaimState,
 getPendingAchievementIds,
 getPendingAchievementCategoryCounts,
 claimAchievementRewards
} = require("../../systems/achievementClaimService")

module.exports = function mount(app, ctx) {
 const {
  requireSession, resolveSession,
  getAchievementsByCategory, getAchievementCategoryStats,
  computeAchievementProgress,
  normalizeUiText, normalizeUiEmoji,
  ACHIEVEMENT_CATEGORIES, invalidateUserCaches
 } = ctx

 app.get("/api/achievements", (req, res) => {
  try {
    const session = resolveSession(req)
    const connected = Boolean(session)
    const user = connected ? getUser(session.userId) : null
    if (user) ensureAchievementClaimState(user)
    let unlockedSet = new Set((user?.achievements || []).map((id) => String(id)))

    const category = String(req.query.category || "all")
    const safeCategory = ACHIEVEMENT_CATEGORIES.includes(category) ? category : "all"
    if (connected && user && safeCategory === "secret") {
     user.stats = user.stats || {}
     user.stats.viewedSecretAchievements = true
     user.stats.viewedSecretAchievementsCount = Number(user.stats.viewedSecretAchievementsCount || 0) + 1
     achievementCheck(user, "secret")
     save(session.userId)
     invalidateUserCaches([session.userId], { invalidateLeaderboard: false })
     unlockedSet = new Set((user.achievements || []).map((id) => String(id)))
    }
    const pendingSet = new Set(getPendingAchievementIds(user))

    let entries = getAchievementsByCategory(safeCategory)
    if (safeCategory === "all") {
     entries = entries.filter(([id, ach]) => !Boolean(ach?.secret) || unlockedSet.has(String(id)))
    }

    const items = entries
    .map(([id, ach]) => {
      const unlocked = unlockedSet.has(String(id))
      const hidden = Boolean(ach?.secret && !unlocked)
      const reward = getAchievementReward(String(id), ach || {})
      const hintTitle = normalizeUiText(String(ach?.title || ach?.name || "Succès secret")).trim() || "Succès secret"
      const badge = normalizeUiEmoji(ach?.badge, "🏅")
      const progress = hidden ? { current: 0, goal: 1, percent: 0 } : computeAchievementProgress(user, ach, unlocked)

      return {
       id: String(id),
       trigger: hidden ? "secret" : String(ach?.trigger || "other"),
       secret: Boolean(ach?.secret),
       hidden,
       unlocked,
       pendingClaim: !hidden && pendingSet.has(String(id)),
       badge: hidden ? "🔒" : badge,
       name: hidden ? hintTitle : normalizeUiText(String(ach?.name || "Succès")),
       description: hidden ? "Indice: succès secret à découvrir." : normalizeUiText(String(ach?.description || "")),
       title: hidden ? hintTitle : normalizeUiText(String(ach?.title || "")),
       progressCurrent: Math.max(0, Number(progress?.current || 0)),
       progressGoal: Math.max(1, Number(progress?.goal || 1)),
       progressPercent: Math.max(0, Math.min(100, Number(progress?.percent || 0))),
       rewardText: hidden ? "" : normalizeUiText(formatReward(reward)),
       reward: hidden ? null : reward
      }
     })
     .sort((a, b) =>
      Number(b.unlocked) - Number(a.unlocked) ||
      a.trigger.localeCompare(b.trigger, "fr") ||
      a.name.localeCompare(b.name, "fr")
     )

    const unlockedCount = items.filter((x) => x.unlocked).length
    const categories = getAchievementCategoryStats(unlockedSet)
    const pendingByCategory = getPendingAchievementCategoryCounts(user)
    for (const categoryId of Object.keys(categories)) {
     categories[categoryId].pending = Number(pendingByCategory?.[categoryId] || 0)
    }
    if (categories?.secret) {
     categories.secret.total = categories.secret.unlocked
    }

    res.json({
     connected,
     category: safeCategory,
     total: items.length,
     unlocked: unlockedCount,
     pending: pendingSet.size,
     categories,
     items
    })
   } catch (e) {
    console.error("[WEB] /api/achievements:", e)
    res.status(500).json({ error: "Erreur serveur" })
  }
 })

 app.post("/api/achievements/claim", (req, res) => {
  try {
   const session = requireSession(req, res)
   if (!session) return

   const user = getUser(session.userId)
   ensureAchievementClaimState(user)
   const requestedCategory = String(req.body?.category || "").trim().toLowerCase()
   const safeCategory = ACHIEVEMENT_CATEGORIES.includes(requestedCategory) && requestedCategory !== "all"
    ? requestedCategory
    : null
   if (!safeCategory) {
    return res.status(400).json({ error: "Categorie invalide pour le claim." })
   }

   const claim = claimAchievementRewards(user, { category: safeCategory })

   let newlyUnlocked = []
   if (claim.claimedCount > 0) {
    newlyUnlocked = achievementCheck(user, null)
   }

   const pendingAfter = getPendingAchievementIds(user).length
   save(session.userId)
   invalidateUserCaches([session.userId])

   res.json({
    ok: true,
    claimedCount: claim.claimedCount,
    claimedIds: claim.claimedIds,
    totals: claim.totals,
    baseTotals: claim.baseTotals,
    levelUpTotals: claim.levelUpTotals,
    levelUps: claim.levelUps,
    newlyUnlocked,
    category: safeCategory,
    pending: pendingAfter,
    kamas: Number(user.kamas || 0),
    packs: Number(user.packs || 0)
   })
  } catch (e) {
   console.error("[WEB] /api/achievements/claim:", e)
   res.status(500).json({ error: "Erreur serveur" })
  }
 })
}
