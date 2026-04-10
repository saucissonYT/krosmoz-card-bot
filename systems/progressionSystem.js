/* ===============================================
   PROGRESSION SYSTEM - XP & Level

   - Level cap: 200
   - XP formula: 100 + level * 35
   - Level rewards: 4 to 5 slots per level
   - Reward families: kamas, packs, cards, fragments, titles, badges
=============================================== */

const { MAX_PLAYER_LEVEL } = require("./constants")
const { getCards } = require("./cardRegistry")

const RARITY_ORDER = ["C", "U", "R", "S", "SR", "SSR", "UR"]

const LEVEL_TITLES = Object.freeze({
 10: "Aspirant du Krosmoz",
 20: "Eclaireur des Douze",
 30: "Gardien des Portails",
 40: "Traqueur des Reliques",
 50: "Maitre des Etincelles",
 60: "Sentinelle Astrale",
 70: "Passeur de Dimensions",
 80: "Archiviste Arcane",
 90: "Veilleur des Constellations",
 100: "Champion du Krosmoz",
 110: "Seigneur des Fragments",
 120: "Strategue des Arcanes",
 130: "Commandeur des Cartes",
 140: "Oracle des Douze",
 150: "Heroe des Mondes",
 160: "Regent des Portails",
 170: "Legat Celeste",
 180: "Maitre des Legendes",
 190: "Parangon du Nexus",
 200: "Legende Eternelle"
})

/* ================= XP REQUIRED ================= */

function getXPRequired(level){
 if(level >= MAX_PLAYER_LEVEL) return Infinity
 return 100 + level * 35
}

/* ================= REWARD HELPERS ================= */

function clampLevel(level){
 const safe = Math.max(1, Math.floor(Number(level || 1)))
 return Math.min(MAX_PLAYER_LEVEL, safe)
}

function scaleLinear(level, levelMin, levelMax, valueMin, valueMax){
 const safeLevel = Math.max(levelMin, Math.min(levelMax, Number(level || levelMin)))
 const spanLevel = Math.max(1, levelMax - levelMin)
 const t = (safeLevel - levelMin) / spanLevel
 return Math.round(valueMin + ((valueMax - valueMin) * t))
}

function getKamasRewardAmount(level){
 const safeLevel = clampLevel(level)
 if(safeLevel <= 1) return 0
 return scaleLinear(safeLevel, 2, 200, 100, 100000)
}

function getPackRewardAmount(level){
 const safeLevel = clampLevel(level)
 if(safeLevel <= 1) return 0
 if(safeLevel <= 189){
  return scaleLinear(safeLevel, 2, 189, 1, 10)
 }
 return scaleLinear(safeLevel, 190, 200, 11, 30)
}

function getFragmentRewardAmount(level){
 const safeLevel = clampLevel(level)
 if(safeLevel <= 1) return 0
 if(safeLevel <= 189){
  return scaleLinear(safeLevel, 2, 189, 1, 10)
 }
 return scaleLinear(safeLevel, 190, 200, 11, 30)
}

function getCardRewardProfile(level){
 const safeLevel = clampLevel(level)

 if(safeLevel === 200) return { rarity: "UR", amount: 6 }
 if(safeLevel >= 195) return { rarity: "UR", amount: 4 }
 if(safeLevel >= 190) return { rarity: "SSR", amount: 6 }
 if(safeLevel >= 180) return { rarity: "SSR", amount: 5 }
 if(safeLevel >= 170) return { rarity: "SR", amount: 4 }
 if(safeLevel >= 150) return { rarity: "S", amount: 4 }
 if(safeLevel >= 130) return { rarity: "S", amount: 3 }
 if(safeLevel >= 100) return { rarity: "R", amount: 3 }
 if(safeLevel >= 80) return { rarity: "R", amount: 2 }
 if(safeLevel >= 50) return { rarity: "U", amount: 2 }
 return { rarity: "C", amount: 1 }
}

function getTitleForLevel(level){
 const safeLevel = clampLevel(level)
 return LEVEL_TITLES[safeLevel] || `Parangon ${safeLevel}`
}

function getBadgeForTitle(title){
 return `Insigne ${String(title || "").trim()}`.trim()
}

function getLevelReward(level){
 const safeLevel = clampLevel(level)
 const kamasAmount = getKamasRewardAmount(safeLevel)
 const packAmount = getPackRewardAmount(safeLevel)
 const fragmentAmount = getFragmentRewardAmount(safeLevel)
 const cardProfile = getCardRewardProfile(safeLevel)
 const isTitleLevel = safeLevel % 10 === 0
 const isThlLevel = safeLevel >= 190

 const slots = [
  { type: "kamas", amount: kamasAmount },
  { type: "packs", amount: packAmount },
  { type: "fragments", amount: fragmentAmount }
 ]

 if(isTitleLevel){
  const title = getTitleForLevel(safeLevel)
  slots.push({ type: "title", value: title })
  slots.push({ type: "badge", value: getBadgeForTitle(title) })
 }else{
  slots.push({ type: "cards", amount: cardProfile.amount, rarity: cardProfile.rarity })

  if(isThlLevel){
   slots.push({
    type: "cards",
    amount: 1 + Math.floor((safeLevel - 190) / 2),
    rarity: safeLevel >= 195 ? "UR" : "SSR"
   })
  }
 }

 const totalKamas = slots.reduce((sum, slot) => {
  if(slot.type !== "kamas") return sum
  return sum + Math.max(0, Number(slot.amount || 0))
 }, 0)

 const totalPacks = slots.reduce((sum, slot) => {
  if(slot.type !== "packs") return sum
  return sum + Math.max(0, Number(slot.amount || 0))
 }, 0)

 let milestoneText = null
 if(isTitleLevel){
  milestoneText = `Niveau ${safeLevel}: ${getTitleForLevel(safeLevel)}`
 }else if(isThlLevel){
  milestoneText = `Niveau ${safeLevel}: recompenses THL renforcees`
 }

 return {
  level: safeLevel,
  slots,
  milestone: Boolean(isTitleLevel || isThlLevel),
  milestoneText,
  kamas: totalKamas,
  packs: totalPacks
 }
}

function getAllLevelRewards(maxLevel = MAX_PLAYER_LEVEL){
 const safeMax = Math.max(1, Math.min(MAX_PLAYER_LEVEL, Math.floor(Number(maxLevel || MAX_PLAYER_LEVEL))))
 const rows = []

 for(let level = 1; level <= safeMax; level += 1){
  rows.push(getLevelReward(level))
 }

 return rows
}

function pickRandom(list){
 if(!Array.isArray(list) || list.length <= 0) return null
 return list[Math.floor(Math.random() * list.length)] || null
}

function getCardPoolByRarity(){
 const cards = getCards()
 const pool = {}

 for(const rarity of RARITY_ORDER){
  pool[rarity] = []
 }

 for(const card of cards){
  const rarity = String(card?.rarity || "").toUpperCase()
  if(!pool[rarity]) pool[rarity] = []
  pool[rarity].push(card)
 }

 return pool
}

function buildRarityFallbackOrder(targetRarity){
 const rarity = String(targetRarity || "C").toUpperCase()
 const idx = Math.max(0, RARITY_ORDER.indexOf(rarity))
 const result = []

 for(let offset = 0; offset < RARITY_ORDER.length; offset += 1){
  const left = idx - offset
  const right = idx + offset

  if(left >= 0){
   const leftRarity = RARITY_ORDER[left]
   if(!result.includes(leftRarity)) result.push(leftRarity)
  }

  if(right < RARITY_ORDER.length){
   const rightRarity = RARITY_ORDER[right]
   if(!result.includes(rightRarity)) result.push(rightRarity)
  }
 }

 return result
}

function pickCardByRarity(pool, targetRarity){
 const fallbackOrder = buildRarityFallbackOrder(targetRarity)

 for(const rarity of fallbackOrder){
  const cards = pool[rarity]
  if(Array.isArray(cards) && cards.length > 0){
   return pickRandom(cards)
  }
 }

 const allCards = Object.values(pool).flat()
 return pickRandom(allCards)
}

function getFragmentPool(){
 const cards = getCards()
 const craftableSSR = cards.filter((card) => {
  if(String(card?.rarity || "").toUpperCase() !== "SSR") return false
  if(card?.fragments?.craftable === false) return false
  return true
 })

 if(craftableSSR.length > 0) return craftableSSR
 return cards
}

function ensureRewardStructures(user){
 if(!user.cards || typeof user.cards !== "object") user.cards = {}
 if(!Array.isArray(user.fragments)) user.fragments = []
 if(!Array.isArray(user.titles)) user.titles = ["Nouveau"]
 if(!user.title) user.title = "Nouveau"
 if(!Array.isArray(user.badges)) user.badges = []
 if(user.packs === undefined) user.packs = 0
 if(user.kamas === undefined) user.kamas = 0
 if(!user.stats || typeof user.stats !== "object") user.stats = {}
 if(user.stats.fragmentsFound === undefined) user.stats.fragmentsFound = 0
 if(user.stats.fragmentsCollected === undefined) user.stats.fragmentsCollected = 0
}

function grantKamasSlot(user, slot){
 const amount = Math.max(0, Number(slot?.amount || 0))
 user.kamas += amount
 return { type: "kamas", amount }
}

function grantPackSlot(user, slot){
 const amount = Math.max(0, Number(slot?.amount || 0))
 user.packs += amount
 return { type: "packs", amount }
}

function grantCardSlot(user, slot, cardPool){
 const amount = Math.max(0, Number(slot?.amount || 0))
 const rarity = String(slot?.rarity || "C").toUpperCase()
 const granted = {}

 for(let i = 0; i < amount; i += 1){
  const card = pickCardByRarity(cardPool, rarity)
  if(!card?.id) continue

  const cardId = String(card.id)
  user.cards[cardId] = (user.cards[cardId] || 0) + 1
  granted[cardId] = (granted[cardId] || 0) + 1
 }

 return {
  type: "cards",
  rarity,
  amount: Object.values(granted).reduce((sum, value) => sum + Number(value || 0), 0),
  cards: Object.entries(granted).map(([cardId, qty]) => ({ cardId, qty }))
 }
}

function grantFragmentSlot(user, slot, fragmentPool){
 const amount = Math.max(0, Number(slot?.amount || 0))
 let granted = 0

 for(let i = 0; i < amount; i += 1){
  const card = pickRandom(fragmentPool)
  if(!card?.id) continue

  user.fragments.push({
   cardId: String(card.id),
   fragmentNumber: 1 + Math.floor(Math.random() * 5),
   source: "level_up",
   obtainedAt: new Date().toISOString()
  })

  granted += 1
 }

 user.stats.fragmentsFound = Number(user.stats.fragmentsFound || 0) + granted
 user.stats.fragmentsCollected = Number(user.stats.fragmentsCollected || 0) + granted

 return { type: "fragments", amount: granted }
}

function grantTitleSlot(user, slot){
 const title = String(slot?.value || "").trim()
 if(!title) return { type: "title", value: "", granted: false }

 let granted = false
 if(!user.titles.includes(title)){
  user.titles.push(title)
  granted = true
 }

 return { type: "title", value: title, granted }
}

function grantBadgeSlot(user, slot){
 const badge = String(slot?.value || "").trim()
 if(!badge) return { type: "badge", value: "", granted: false }

 let granted = false
 if(!user.badges.includes(badge)){
  user.badges.push(badge)
  granted = true
 }

 return { type: "badge", value: badge, granted }
}

function applyLevelReward(user, reward){
 const slots = Array.isArray(reward?.slots) ? reward.slots : []
 const cardPool = getCardPoolByRarity()
 const fragmentPool = getFragmentPool()
 const grants = []

 for(const slot of slots){
  const type = String(slot?.type || "").toLowerCase()

  if(type === "kamas"){
   grants.push(grantKamasSlot(user, slot))
   continue
  }

  if(type === "packs"){
   grants.push(grantPackSlot(user, slot))
   continue
  }

  if(type === "cards"){
   grants.push(grantCardSlot(user, slot, cardPool))
   continue
  }

  if(type === "fragments"){
   grants.push(grantFragmentSlot(user, slot, fragmentPool))
   continue
  }

  if(type === "title"){
   grants.push(grantTitleSlot(user, slot))
   continue
  }

  if(type === "badge"){
   grants.push(grantBadgeSlot(user, slot))
  }
 }

 return grants
}

/* ================= ADD XP ================= */

function addXP(user, amount){
 if(!user.progression){
  user.progression = {
   level: 1,
   xp: 0,
   totalXp: 0
  }
 }

 if(user.progression.level >= MAX_PLAYER_LEVEL){
  user.progression.level = MAX_PLAYER_LEVEL
  user.progression.xp = 0
  return []
 }

 let bonusPercent = 0

 try{
  const { getUserGuildBonuses } = require("./guildBonuses")
  getUserGuildBonuses(user.odemonId || "")
 }catch(e){}

 try{
  const { getPlayerBonuses } = require("./playerbonuses")
  const pBonuses = getPlayerBonuses(user.progression.level)
  bonusPercent += pBonuses.xpBonus || 0
 }catch(e){}

 const finalAmount = Math.floor(amount * (1 + bonusPercent / 100))

 user.progression.xp += finalAmount
 user.progression.totalXp = (user.progression.totalXp || 0) + finalAmount

 const levelUps = []
 ensureRewardStructures(user)

 while(
  user.progression.level < MAX_PLAYER_LEVEL &&
  user.progression.xp >= getXPRequired(user.progression.level)
 ){
  user.progression.xp -= getXPRequired(user.progression.level)
  user.progression.level++

  const lvl = user.progression.level
  const reward = getLevelReward(lvl)
  const rewards = applyLevelReward(user, reward)

  const hour = new Date().getHours()
  if(hour >= 0 && hour < 6){
   if(!user.stats) user.stats = {}
   user.stats.nightLevelUp = (user.stats.nightLevelUp || 0) + 1
  }

  const kamasFromRewards = rewards
   .filter((entry) => entry?.type === "kamas")
   .reduce((sum, entry) => sum + Number(entry?.amount || 0), 0)

  const packsFromRewards = rewards
   .filter((entry) => entry?.type === "packs")
   .reduce((sum, entry) => sum + Number(entry?.amount || 0), 0)

  levelUps.push({
   level: lvl,
   rewards,
   slots: reward.slots,
   kamas: kamasFromRewards,
   packs: packsFromRewards,
   milestone: reward.milestone,
   milestoneText: reward.milestoneText
  })
 }

 if(user.progression.level >= MAX_PLAYER_LEVEL){
  user.progression.level = MAX_PLAYER_LEVEL
  user.progression.xp = 0
 }

 return levelUps
}

/* ================= PROGRESSION INFO ================= */

function getProgression(user){
 if(!user.progression){
  user.progression = {
   level: 1,
   xp: 0,
   totalXp: 0
  }
 }

 const level = user.progression.level
 const xp = user.progression.xp

 const required = level >= MAX_PLAYER_LEVEL
  ? 0
  : getXPRequired(level)

 const isMaxLevel = level >= MAX_PLAYER_LEVEL

 return { level, xp, required, isMaxLevel }
}

/* ================= TOTAL XP FOR LEVEL ================= */

function getTotalXPForLevel(targetLevel){
 let total = 0

 for(let i = 1; i < targetLevel; i++){
  total += getXPRequired(i)
 }

 return total
}

/* ================= EXPORT ================= */

module.exports = {
 addXP,
 getXPRequired,
 getProgression,
 getLevelReward,
 getAllLevelRewards,
 getTotalXPForLevel
}
