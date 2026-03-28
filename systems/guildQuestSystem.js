/* ===============================================
   GUILD QUEST SYSTEM — Quêtes de guilde
   
   5 quêtes journalières (reset chaque jour à 1h FR)
   5 quêtes hebdomadaires (reset chaque lundi à 1h FR)
   
   Progrès calculé par diff de stats combinées des membres.
   Récompense en XP de guilde.
   
   Scaling dynamique par nombre de membres :
   - Goals calibrés pour 8 joueurs actifs
   - Effectif cible = min(8, max(1, floor(membres × 0.8)))
=============================================== */

const { getUser } = require("./userSystem")
const { getGuild, addGuildXP, saveGuilds } = require("./guildSystem")

/* ================= CONSTANTES ================= */

const BASE_CALIBRATION = 8
const MIN_EFFECTIVE = 1
const MAX_EFFECTIVE = 8

/* ================= POOL JOURNALIER (quêtes légères) ================= */

const DAILY_QUEST_POOL = [

 /* PACKS */
 { id:"gqd_packs5",    emoji:"📦", name:"Ouverture du jour",     desc:"Ouvrir {goal} packs",           stat:"packsOpened",      baseGoal:5,   xp:200 },
 { id:"gqd_packs10",   emoji:"📦", name:"Session packs",         desc:"Ouvrir {goal} packs",           stat:"packsOpened",      baseGoal:10,  xp:350 },
 { id:"gqd_packs20",   emoji:"📦", name:"Ouverture active",      desc:"Ouvrir {goal} packs",           stat:"packsOpened",      baseGoal:20,  xp:500 },

 /* FUSIONS */
 { id:"gqd_fusions2",  emoji:"⚗️", name:"Petit Alchimiste",     desc:"Faire {goal} fusions",          stat:"fusions",          baseGoal:2,   xp:150 },
 { id:"gqd_fusions5",  emoji:"⚗️", name:"Alchimiste du jour",   desc:"Faire {goal} fusions",          stat:"fusions",          baseGoal:5,   xp:300 },

 /* SSR */
 { id:"gqd_ssr1",      emoji:"🌈", name:"Chasseur chanceux",     desc:"Obtenir {goal} SSR",            stat:"ssrPulled",        baseGoal:1,   xp:400 },

 /* DAILY */
 { id:"gqd_daily3",    emoji:"🎁", name:"Présence collective",   desc:"Réclamer {goal} daily",         stat:"dailyClaims",      baseGoal:3,   xp:200 },
 { id:"gqd_daily5",    emoji:"🎁", name:"Discipline du jour",    desc:"Réclamer {goal} daily",         stat:"dailyClaims",      baseGoal:5,   xp:300 },

 /* VENTES */
 { id:"gqd_sell5",     emoji:"💰", name:"Petit Marchand",        desc:"Vendre {goal} cartes",          stat:"cardsSold",        baseGoal:5,   xp:200 },
 { id:"gqd_sell10",    emoji:"💰", name:"Déstockage quotidien",  desc:"Vendre {goal} cartes",          stat:"cardsSold",        baseGoal:10,  xp:350 },

 /* SHOP */
 { id:"gqd_shop2",     emoji:"🛒", name:"Clients du Shop",       desc:"Acheter {goal} cartes au KrosmoShop", stat:"shopBought", baseGoal:2,   xp:250 },

 /* DONS */
 { id:"gqd_gift2",     emoji:"🎁", name:"Partage du jour",       desc:"Faire {goal} dons",             stat:"giftsGiven",       baseGoal:2,   xp:200 },

 /* EVENTPACK */
 { id:"gqd_event2",    emoji:"🎪", name:"Festivaliers",          desc:"Ouvrir {goal} packs d'event",   stat:"eventPacksOpened", baseGoal:2,   xp:300 },

]

/* ================= POOL HEBDOMADAIRE (quêtes costaud) ================= */

const WEEKLY_QUEST_POOL = [

 /* PACKS */
 { id:"gq_packs30",    emoji:"📦", name:"Chasseurs de packs",    desc:"Ouvrir {goal} packs",           stat:"packsOpened",      baseGoal:30,  xp:400 },
 { id:"gq_packs60",    emoji:"📦", name:"Ouverture massive",      desc:"Ouvrir {goal} packs",           stat:"packsOpened",      baseGoal:60,  xp:700 },
 { id:"gq_packs120",   emoji:"📦", name:"Avalanche de packs",    desc:"Ouvrir {goal} packs",           stat:"packsOpened",      baseGoal:120, xp:1200 },
 { id:"gq_packs200",   emoji:"📦", name:"Pluie de cartes",       desc:"Ouvrir {goal} packs",           stat:"packsOpened",      baseGoal:200, xp:2000 },

 /* FUSIONS */
 { id:"gq_fusions8",   emoji:"⚗️", name:"Premiers essais",      desc:"Faire {goal} fusions",          stat:"fusions",          baseGoal:8,   xp:400 },
 { id:"gq_fusions20",  emoji:"⚗️", name:"Alchimie de groupe",   desc:"Faire {goal} fusions",          stat:"fusions",          baseGoal:20,  xp:700 },
 { id:"gq_fusions50",  emoji:"⚗️", name:"Laboratoire actif",    desc:"Faire {goal} fusions",          stat:"fusions",          baseGoal:50,  xp:1400 },

 /* SSR */
 { id:"gq_ssr3",       emoji:"🌈", name:"Éclat arc-en-ciel",     desc:"Obtenir {goal} SSR",            stat:"ssrPulled",        baseGoal:3,   xp:600 },
 { id:"gq_ssr6",       emoji:"🌈", name:"Chasseurs de SSR",      desc:"Obtenir {goal} SSR",            stat:"ssrPulled",        baseGoal:6,   xp:1000 },
 { id:"gq_ssr12",      emoji:"🌈", name:"Moisson arc-en-ciel",   desc:"Obtenir {goal} SSR",            stat:"ssrPulled",        baseGoal:12,  xp:1800 },

 /* DAILY */
 { id:"gq_daily8",     emoji:"🎁", name:"Habitude matinale",     desc:"Réclamer {goal} daily",         stat:"dailyClaims",      baseGoal:8,   xp:350 },
 { id:"gq_daily20",    emoji:"🎁", name:"Fidélité collective",   desc:"Réclamer {goal} daily",         stat:"dailyClaims",      baseGoal:20,  xp:600 },
 { id:"gq_daily40",    emoji:"🎁", name:"Assiduité exemplaire",  desc:"Réclamer {goal} daily",         stat:"dailyClaims",      baseGoal:40,  xp:1000 },

 /* VENTES */
 { id:"gq_sell16",     emoji:"💰", name:"Liquidation",           desc:"Vendre {goal} cartes",          stat:"cardsSold",        baseGoal:16,  xp:400 },
 { id:"gq_sell50",     emoji:"💰", name:"Grand déstockage",      desc:"Vendre {goal} cartes",          stat:"cardsSold",        baseGoal:50,  xp:800 },
 { id:"gq_sell100",    emoji:"💰", name:"Soldes totales",        desc:"Vendre {goal} cartes",          stat:"cardsSold",        baseGoal:100, xp:1300 },

 /* EVENTS */
 { id:"gq_event4",     emoji:"🎪", name:"Aventuriers divins",    desc:"Ouvrir {goal} packs d'event",   stat:"eventPacksOpened", baseGoal:4,   xp:500 },
 { id:"gq_event10",    emoji:"🎪", name:"Festivaliers",          desc:"Ouvrir {goal} packs d'event",   stat:"eventPacksOpened", baseGoal:10,  xp:900 },

 /* DONS */
 { id:"gq_gift4",      emoji:"🎁", name:"Partage amical",        desc:"Faire {goal} dons",             stat:"giftsGiven",       baseGoal:4,   xp:400 },
 { id:"gq_gift12",     emoji:"🎁", name:"Généreux ensemble",     desc:"Faire {goal} dons",             stat:"giftsGiven",       baseGoal:12,  xp:800 },
 { id:"gq_gift25",     emoji:"🎁", name:"Philanthropes",         desc:"Faire {goal} dons",             stat:"giftsGiven",       baseGoal:25,  xp:1200 },

 /* KAMAS */
 { id:"gq_kamas25k",   emoji:"💎", name:"Économie florissante",  desc:"Gagner {goal} kamas",           stat:"totalKamasEarned", baseGoal:25000,xp:600 },
 { id:"gq_kamas80k",   emoji:"💎", name:"Trésor de guilde",      desc:"Gagner {goal} kamas",           stat:"totalKamasEarned", baseGoal:80000,xp:1200 },

 /* KROSMOSHOP */
 { id:"gq_shop4",      emoji:"🛒", name:"Clients du KrosmoShop", desc:"Acheter {goal} cartes au shop", stat:"shopBought",       baseGoal:4,   xp:400 },
 { id:"gq_shop10",     emoji:"🛒", name:"Habitués du Shop",      desc:"Acheter {goal} cartes au shop", stat:"shopBought",       baseGoal:10,  xp:700 },

]

/* ================= ROULETTE QUESTS ================= */

DAILY_QUEST_POOL.push(
 { id:"gqd_roulette6", emoji:"🎡", name:"Tours collectifs", desc:"Jouer {goal} fois a la roulette", stat:"rouletteSpins", baseGoal:6, xp:280 }
)

WEEKLY_QUEST_POOL.push(
 { id:"gq_roulette36", emoji:"🎡", name:"Festival d'Ecaflip", desc:"Jouer {goal} fois a la roulette", stat:"rouletteSpins", baseGoal:36, xp:900 }
)

/* ================= SCALING ================= */

function getEffectiveMembers(memberCount){
 if(memberCount <= 2) return Math.max(MIN_EFFECTIVE, memberCount)
 return Math.max(MIN_EFFECTIVE, Math.min(MAX_EFFECTIVE, Math.floor(memberCount * 0.8)))
}

function getScaledGoal(baseGoal, memberCount){
 const effective = getEffectiveMembers(memberCount)
 const scaled = Math.max(1, Math.ceil(baseGoal * effective / BASE_CALIBRATION))
 return scaled
}

/* ================= DATES ================= */

function getCurrentWeek(){
 const now = new Date()
 const jan1 = new Date(now.getFullYear(), 0, 1)
 const days = Math.floor((now - jan1) / 86400000)
 const week = Math.ceil((days + jan1.getDay() + 1) / 7)
 return `${now.getFullYear()}-W${String(week).padStart(2, "0")}`
}

function getCurrentDay(){
 const now = new Date()
 const yyyy = now.getFullYear()
 const mm = String(now.getMonth() + 1).padStart(2, "0")
 const dd = String(now.getDate()).padStart(2, "0")
 return `${yyyy}-${mm}-${dd}`
}

/* ================= SÉLECTION DÉTERMINISTE ================= */

function pickQuests(pool, count, seedStr){
 let seed = 0
 for(let i = 0; i < seedStr.length; i++) seed += seedStr.charCodeAt(i) * (i + 1)

 const shuffled = [...pool]
  .map((q, i) => ({ q, sort: Math.sin(seed + i * 9301) }))
  .sort((a, b) => a.sort - b.sort)
  .map(x => x.q)

 const selected = []
 const usedStats = new Set()

 for(const q of shuffled){
  if(selected.length >= count) break
  if(usedStats.has(q.stat)) continue
  selected.push(q)
  usedStats.add(q.stat)
 }

 return selected
}

function getDailyGuildQuests(){
 return pickQuests(DAILY_QUEST_POOL, 5, "gqd-" + getCurrentDay())
}

function getWeeklyGuildQuests(){
 return pickQuests(WEEKLY_QUEST_POOL, 5, "gq-" + getCurrentWeek())
}

/* ================= STATS COMBINÉES ================= */

function getCombinedStats(memberIds){
 const combined = {}

 for(const id of memberIds){
  const user = getUser(id)
  const stats = user.stats || {}

  for(const key of Object.keys(stats)){
   if(typeof stats[key] === "number"){
    combined[key] = (combined[key] || 0) + stats[key]
   }
  }

  combined.totalKamasEarned = (combined.totalKamasEarned || 0) + (user.kamas || 0)

  if(user.krosmoshopStats?.cardsBought){
   combined.shopBought = (combined.shopBought || 0) + user.krosmoshopStats.cardsBought
  }
 }

 return combined
}

/* ================= SNAPSHOT ================= */

function ensureSnapshot(guild){
 const week = getCurrentWeek()
 const day  = getCurrentDay()

 /* Weekly snapshot */
 if(guild.questsWeek !== week){
  guild.questSnapshot   = getCombinedStats(guild.memberIds)
  guild.questsClaimed   = []
  guild.questsWeek      = week
  saveGuilds()
 }

 /* Daily snapshot */
 if(guild.questsDay !== day){
  guild.questDaySnapshot = getCombinedStats(guild.memberIds)
  guild.questsDayClaimed = []
  guild.questsDay        = day
  saveGuilds()
 }
}

/* ================= PROGRESSION ================= */

function getGuildQuestProgress(guildId, type = "weekly"){

 const guild = getGuild(guildId)
 if(!guild) return []

 ensureSnapshot(guild)

 const quests    = type === "daily" ? getDailyGuildQuests() : getWeeklyGuildQuests()
 const snapshot  = type === "daily" ? (guild.questDaySnapshot || {}) : (guild.questSnapshot || {})
 const claimed   = type === "daily" ? (guild.questsDayClaimed || []) : (guild.questsClaimed || [])
 const current   = getCombinedStats(guild.memberIds)
 const memberCount = guild.memberIds.length

 return quests.map(q => {
  const scaledGoal = getScaledGoal(q.baseGoal, memberCount)
  const before     = snapshot[q.stat] || 0
  const now        = current[q.stat] || 0
  const progress   = Math.max(0, now - before)
  const desc       = q.desc.replace("{goal}", scaledGoal)

  return {
   ...q,
   goal:    scaledGoal,
   desc,
   current: Math.min(progress, scaledGoal),
   done:    progress >= scaledGoal,
   claimed: claimed.includes(q.id)
  }
 })
}

/* ================= CLAIM ================= */

function claimGuildQuests(guildId, claimerId, type = "weekly"){

 const guild = getGuild(guildId)
 if(!guild) return { error:"Guilde introuvable." }

 if(guild.leaderId !== claimerId && !guild.officerIds.includes(claimerId))
  return { error:"Seuls le meneur et les officiers peuvent récupérer les récompenses." }

 ensureSnapshot(guild)

 const progress = getGuildQuestProgress(guildId, type)
 const claimedArr = type === "daily" ? guild.questsDayClaimed : guild.questsClaimed
 const bonusXpAmount = type === "daily" ? 200 : 500

 let totalXP = 0
 let claimed = 0

 for(const q of progress){
  if(q.done && !q.claimed){
   claimedArr.push(q.id)
   totalXP += q.xp
   claimed++
   guild.stats.questsCompleted = (guild.stats.questsCompleted || 0) + 1
  }
 }

 const allDone = progress.every(q => q.done)
 let bonusXP = 0

 if(allDone && claimed > 0){
  bonusXP  = bonusXpAmount
  totalXP += bonusXP
 }

 if(totalXP <= 0)
  return { error:"Aucune quête à récupérer.", claimed:0 }

 const levelResult = addGuildXP(guildId, totalXP)
 saveGuilds()

 /* Stats semaine parfaite (uniquement pour les hebdo) */
 const isPerfect = type === "weekly" && allDone && claimed > 0

 return {
  claimed,
  totalXP,
  bonusXP,
  allDone,
  isPerfect,
  levelResult
 }
}

/* ================= RESET TIMERS ================= */

function getNextGuildQuestReset(type = "weekly"){

 const now = new Date()

 if(type === "daily"){
  const next = new Date(now)
  next.setDate(now.getDate() + 1)
  next.setHours(1, 0, 0, 0)
  const ms = next - now
  const hours   = Math.floor(ms / 3600000)
  const minutes = Math.floor((ms % 3600000) / 60000)
  return `${hours}h ${minutes}min`
 }

 /* Weekly */
 const day  = now.getDay()
 const diff = day === 0 ? 1 : 8 - day

 const next = new Date(now)
 next.setDate(now.getDate() + diff)
 next.setHours(1, 0, 0, 0)

 const ms    = next - now
 const hours = Math.floor(ms / 3600000)
 const minutes = Math.floor((ms % 3600000) / 60000)

 if(hours >= 24){
  const days = Math.floor(hours / 24)
  return `${days}j ${hours % 24}h`
 }

 return `${hours}h ${minutes}min`
}

/* ================= EXPORT ================= */

module.exports = {
 getDailyGuildQuests,
 getWeeklyGuildQuests,
 getGuildQuestProgress,
 claimGuildQuests,
 getNextGuildQuestReset,
 getEffectiveMembers,
 getScaledGoal,
 DAILY_QUEST_POOL,
 WEEKLY_QUEST_POOL,
 /* Compat avec ancien nom utilisé dans guild.js */
 getWeeklyQuests: getWeeklyGuildQuests,
 BASE_CALIBRATION
}
