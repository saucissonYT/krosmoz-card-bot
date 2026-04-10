const { checkAchievements } = require("./achievementEngine")

/*
 * Wrapper central: execute only the requested trigger, then run bounded
 * "progression" cascades so XP rewards can unlock chained level achievements.
 */
function achievementCheck(user, trigger = "pack") {
 const rawTrigger = String(trigger || "").trim().toLowerCase() || null
 const triggerAlias = {
  rarity: "rng",
  pinata: "event",
  quests: "event",
  quest: "event"
 }
 const normalizedTrigger = rawTrigger ? (triggerAlias[rawTrigger] || rawTrigger) : null
 const allUnlocked = []
 const seen = new Set()
 const MAX_PROGRESSION_PASSES = 6

 const addUnlocked = (ids = []) => {
  for (const id of ids) {
   const safeId = String(id || "").trim()
   if (!safeId || seen.has(safeId)) continue
   seen.add(safeId)
   allUnlocked.push(safeId)
  }
 }

 if (normalizedTrigger) addUnlocked(checkAchievements(user, normalizedTrigger))
 else addUnlocked(checkAchievements(user, null))

 for (let pass = 0; pass < MAX_PROGRESSION_PASSES; pass++) {
  const before = seen.size
  addUnlocked(checkAchievements(user, "progression"))
  if (seen.size === before) break
 }

 return allUnlocked
}

module.exports = { achievementCheck }
