const achievementRegistry = require("./achievementRegistry")
const { getAchievementReward } = require("./achievementRewards")
const { addXP } = require("./progressionSystem")

function toSafeNumber(value) {
 const n = Number(value)
 return Number.isFinite(n) ? Math.max(0, Math.floor(n)) : 0
}

function toSafeString(value) {
 return String(value || "").trim()
}

function normalizeTitles(input) {
 if (Array.isArray(input)) {
  return [...new Set(input.map((value) => toSafeString(value)).filter(Boolean))]
 }
 const one = toSafeString(input)
 return one ? [one] : []
}

function normalizePendingRewardSnapshot(achievement, reward = {}) {
 const titles = normalizeTitles([
  ...(Array.isArray(reward?.titles) ? reward.titles : []),
  reward?.title,
  achievement?.title
 ])

 return {
  kamas: toSafeNumber(reward?.kamas),
  xp: toSafeNumber(reward?.xp),
  packs: toSafeNumber(reward?.packs),
  cards: toSafeNumber(reward?.cards),
  fragments: toSafeNumber(reward?.fragments),
  badges: normalizeTitles(reward?.badges),
  titles
 }
}

function ensureAchievementClaimState(user) {
 if (!user || typeof user !== "object") return { pendingIds: [], pendingRewards: {} }

 if (!Array.isArray(user.pendingAchievementClaims)) user.pendingAchievementClaims = []
 if (!user.pendingAchievementRewards || typeof user.pendingAchievementRewards !== "object") {
  user.pendingAchievementRewards = {}
 }

 const unlocked = new Set((user.achievements || []).map((id) => String(id)))
 const seen = new Set()
 const cleaned = []
 for (const rawId of user.pendingAchievementClaims) {
  const id = String(rawId || "").trim()
  if (!id || seen.has(id) || !unlocked.has(id)) continue
  seen.add(id)
  cleaned.push(id)
 }
 user.pendingAchievementClaims = cleaned

 for (const id of Object.keys(user.pendingAchievementRewards)) {
  if (!seen.has(id)) delete user.pendingAchievementRewards[id]
  else {
   user.pendingAchievementRewards[id] = normalizePendingRewardSnapshot(
    achievementRegistry?.[id],
    user.pendingAchievementRewards[id]
   )
  }
 }

 return {
  pendingIds: user.pendingAchievementClaims,
  pendingRewards: user.pendingAchievementRewards
 }
}

function queueAchievementReward(user, achievementId, achievement, rewardInput = null) {
 const id = String(achievementId || "").trim()
 if (!id) return false

 const { pendingIds, pendingRewards } = ensureAchievementClaimState(user)
 if (pendingIds.includes(id)) return false

 const reward = rewardInput || getAchievementReward(id, achievement || achievementRegistry?.[id] || {})
 pendingRewards[id] = normalizePendingRewardSnapshot(achievement || achievementRegistry?.[id], reward)
 pendingIds.push(id)
 return true
}

function getPendingAchievementIds(user) {
 const { pendingIds } = ensureAchievementClaimState(user)
 return [...pendingIds]
}

function getPendingAchievementEntries(user) {
 const { pendingIds, pendingRewards } = ensureAchievementClaimState(user)
 return pendingIds
  .map((id) => {
   const achievement = achievementRegistry?.[id] || null
   return {
    id,
    achievement,
    reward: normalizePendingRewardSnapshot(achievement, pendingRewards?.[id] || {})
   }
  })
  .filter((entry) => Boolean(entry.achievement))
}

function getPendingAchievementCategoryCounts(user) {
 const counts = { all: 0 }
 for (const { achievement } of getPendingAchievementEntries(user)) {
  const category = achievement?.secret
   ? "secret"
   : String(achievement?.trigger || "other")
  counts[category] = Number(counts[category] || 0) + 1
  counts.all += 1
 }
 return counts
}

function ensureRewardStructures(user) {
 if (!user.stats || typeof user.stats !== "object") user.stats = {}
 if (!Array.isArray(user.titles)) user.titles = ["Nouveau"]
 if (!Array.isArray(user.badges)) user.badges = []
 if (user.kamas === undefined) user.kamas = 0
 if (user.packs === undefined) user.packs = 0
 if (!user.cards || typeof user.cards !== "object") user.cards = {}
}

function summarizeLevelUpRewards(levelUps = []) {
 const totals = {
  kamas: 0,
  packs: 0,
  cards: 0,
  fragments: 0,
  titles: 0,
  badges: 0
 }

 for (const levelUp of levelUps) {
  for (const reward of (levelUp?.rewards || [])) {
   const type = String(reward?.type || "").toLowerCase()
   if (type === "kamas") totals.kamas += toSafeNumber(reward?.amount)
   else if (type === "packs") totals.packs += toSafeNumber(reward?.amount)
   else if (type === "cards") totals.cards += toSafeNumber(reward?.amount)
   else if (type === "fragments") totals.fragments += toSafeNumber(reward?.amount)
   else if (type === "title" && reward?.granted) totals.titles += 1
   else if (type === "badge" && reward?.granted) totals.badges += 1
  }
 }

 return totals
}

function claimAllAchievementRewards(user) {
 ensureRewardStructures(user)
 const { pendingIds, pendingRewards } = ensureAchievementClaimState(user)
 if (pendingIds.length <= 0) {
  return {
   claimedCount: 0,
   claimedIds: [],
   totals: {
    kamas: 0,
    xp: 0,
    packs: 0,
    cards: 0,
    fragments: 0,
    titles: 0,
    badges: 0
   },
   levelUps: [],
   pendingCount: 0
  }
 }

 const baseTotals = {
  kamas: 0,
  xp: 0,
  packs: 0,
  cards: 0,
  fragments: 0,
  titles: 0,
  badges: 0
 }

 const claimedIds = []

 for (const id of pendingIds) {
  const snapshot = normalizePendingRewardSnapshot(
   achievementRegistry?.[id],
   pendingRewards?.[id] || {}
  )
  baseTotals.kamas += snapshot.kamas
  baseTotals.xp += snapshot.xp
  baseTotals.packs += snapshot.packs
  baseTotals.cards += snapshot.cards
  baseTotals.fragments += snapshot.fragments
  for (const title of snapshot.titles) {
   if (!user.titles.includes(title)) {
    user.titles.push(title)
    baseTotals.titles += 1
   }
  }
  for (const badge of snapshot.badges) {
   if (!user.badges.includes(badge)) {
    user.badges.push(badge)
    baseTotals.badges += 1
   }
  }
  claimedIds.push(id)
 }

 user.kamas += baseTotals.kamas
 user.packs += baseTotals.packs

 const levelUps = baseTotals.xp > 0 ? addXP(user, baseTotals.xp) : []
 const levelUpTotals = summarizeLevelUpRewards(levelUps)

 user.stats.achievementKamasEarned = toSafeNumber(user.stats.achievementKamasEarned) + baseTotals.kamas
 user.stats.achievementXpEarned = toSafeNumber(user.stats.achievementXpEarned) + baseTotals.xp
 user.stats.achievementPacksEarned = toSafeNumber(user.stats.achievementPacksEarned) + baseTotals.packs
 user.stats.achievementCardsEarned = toSafeNumber(user.stats.achievementCardsEarned) + baseTotals.cards
 user.stats.achievementClaims = toSafeNumber(user.stats.achievementClaims) + claimedIds.length

 user.pendingAchievementClaims = []
 user.pendingAchievementRewards = {}

 const totals = {
  kamas: baseTotals.kamas + levelUpTotals.kamas,
  xp: baseTotals.xp,
  packs: baseTotals.packs + levelUpTotals.packs,
  cards: baseTotals.cards + levelUpTotals.cards,
  fragments: baseTotals.fragments + levelUpTotals.fragments,
  titles: baseTotals.titles + levelUpTotals.titles,
  badges: baseTotals.badges + levelUpTotals.badges
 }

 return {
  claimedCount: claimedIds.length,
  claimedIds,
  baseTotals,
  levelUpTotals,
  totals,
  levelUps,
  pendingCount: 0
 }
}

module.exports = {
 ensureAchievementClaimState,
 queueAchievementReward,
 getPendingAchievementIds,
 getPendingAchievementEntries,
 getPendingAchievementCategoryCounts,
 claimAllAchievementRewards
}
