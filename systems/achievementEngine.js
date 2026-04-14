const achievements = require("./achievementRegistry")
const { data } = require("./dataManager")
const { getAchievementReward } = require("./achievementRewards")
const { ensureAchievementClaimState, queueAchievementReward } = require("./achievementClaimService")

function checkSetCompletion(user, setId, percent) {
 const cards = data.cards || []
 let total = 0
 let owned = 0

 for (const card of cards) {
  if (card.set !== setId) continue
  total++
  if (user.cards?.[card.id]) owned++
 }

 if (total === 0) return false
 return (owned / total) >= percent
}

function checkAchievements(user, trigger) {
 const unlocked = []

 if (!Array.isArray(user.achievements)) user.achievements = []
 user.achievements = [...new Set(user.achievements)]

 if (!user.stats || typeof user.stats !== "object") user.stats = {}
 ensureAchievementClaimState(user)

 for (const id in achievements) {
  const achievement = achievements[id]
  if (trigger && achievement.trigger !== trigger) continue
  if (user.achievements.includes(id)) continue

  try {
   if (typeof achievement.condition !== "function") continue
   const result = achievement.condition(user, checkSetCompletion)
   if (!result) continue
   if (user.achievements.includes(id)) continue

   user.achievements.push(id)
   unlocked.push(id)

   const reward = getAchievementReward(id, achievement)
   queueAchievementReward(user, id, achievement, reward)
  } catch (error) {
   console.error("Achievement error:", id, error)
  }
 }

 return unlocked
}

module.exports = {
 checkAchievements,
 checkSetCompletion
}
