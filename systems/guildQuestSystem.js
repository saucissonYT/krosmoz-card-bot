/* ===============================================
   GUILD QUEST SYSTEM — Quêtes hebdomadaires de guilde
   
   3 quêtes par semaine, mêmes pour toutes les guildes.
   Progrès calculé par diff de stats combinées des membres.
   Récompense en XP de guilde.
   
   v0.30 — Scaling dynamique par nombre de membres :
   - Goals de base calibrés pour 8 joueurs actifs
   - Effectif cible = min(8, max(1, floor(membres × 0.8)))
   - Une guilde de 10 est calibrée sur 8 (confortable)
   - Une guilde de 5 est calibrée sur 4
   - Une guilde de 2 est calibrée sur 2
   - Un joueur seul est calibré sur 1
   - XP de récompense fixe (pas de scaling sur l'XP)
=============================================== */

const { getUser } = require("./userSystem")
const { getGuild, addGuildXP, saveGuilds } = require("./guildSystem")

/* ================= CONSTANTES DE SCALING ================= */

const BASE_CALIBRATION = 8  /* Les goals de base sont calibrés pour 8 joueurs */
const MIN_EFFECTIVE = 1     /* Minimum : 1 joueur */
const MAX_EFFECTIVE = 8     /* Maximum : 8 joueurs (une guilde de 10 fait facilement) */

/* ================= POOL DE QUÊTES (25 quêtes) ================= */
/* Les goals sont calibrés pour BASE_CALIBRATION (8) joueurs    */

const QUEST_POOL = [

 /* --- PACKS --- */
 { id:"gq_packs30",     emoji:"📦", name:"Chasseurs de packs",     desc:"Ouvrir {goal} packs",              stat:"packsOpened",       baseGoal:30,   xp:400 },
 { id:"gq_packs60",     emoji:"📦", name:"Ouverture massive",      desc:"Ouvrir {goal} packs",              stat:"packsOpened",       baseGoal:60,   xp:700 },
 { id:"gq_packs120",    emoji:"📦", name:"Avalanche de packs",     desc:"Ouvrir {goal} packs",              stat:"packsOpened",       baseGoal:120,  xp:1200 },
 { id:"gq_packs200",    emoji:"📦", name:"Pluie de cartes",        desc:"Ouvrir {goal} packs",              stat:"packsOpened",       baseGoal:200,  xp:2000 },

 /* --- FUSIONS --- */
 { id:"gq_fusions8",    emoji:"⚗️", name:"Premiers essais",       desc:"Faire {goal} fusions",             stat:"fusions",           baseGoal:8,    xp:400 },
 { id:"gq_fusions20",   emoji:"⚗️", name:"Alchimie de groupe",    desc:"Faire {goal} fusions",             stat:"fusions",           baseGoal:20,   xp:700 },
 { id:"gq_fusions50",   emoji:"⚗️", name:"Laboratoire actif",     desc:"Faire {goal} fusions",             stat:"fusions",           baseGoal:50,   xp:1400 },

 /* --- SSR --- */
 { id:"gq_ssr3",        emoji:"🌈", name:"Éclat arc-en-ciel",      desc:"Obtenir {goal} SSR",               stat:"ssrPulled",         baseGoal:3,    xp:600 },
 { id:"gq_ssr6",        emoji:"🌈", name:"Chasseurs de SSR",       desc:"Obtenir {goal} SSR",               stat:"ssrPulled",         baseGoal:6,    xp:1000 },
 { id:"gq_ssr12",       emoji:"🌈", name:"Moisson arc-en-ciel",    desc:"Obtenir {goal} SSR",               stat:"ssrPulled",         baseGoal:12,   xp:1800 },

 /* --- DAILY --- */
 { id:"gq_daily8",      emoji:"🎁", name:"Habitude matinale",      desc:"Réclamer {goal} daily",            stat:"dailyClaims",       baseGoal:8,    xp:350 },
 { id:"gq_daily20",     emoji:"🎁", name:"Fidélité collective",    desc:"Réclamer {goal} daily",            stat:"dailyClaims",       baseGoal:20,   xp:600 },
 { id:"gq_daily40",     emoji:"🎁", name:"Assiduité exemplaire",   desc:"Réclamer {goal} daily",            stat:"dailyClaims",       baseGoal:40,   xp:1000 },

 /* --- VENTES --- */
 { id:"gq_sell16",      emoji:"💰", name:"Liquidation",            desc:"Vendre {goal} cartes",             stat:"cardsSold",         baseGoal:16,   xp:400 },
 { id:"gq_sell50",      emoji:"💰", name:"Grand déstockage",       desc:"Vendre {goal} cartes",             stat:"cardsSold",         baseGoal:50,   xp:800 },
 { id:"gq_sell100",     emoji:"💰", name:"Soldes totales",         desc:"Vendre {goal} cartes",             stat:"cardsSold",         baseGoal:100,  xp:1300 },

 /* --- MARKET --- */
 { id:"gq_market4",     emoji:"🏪", name:"Premiers achats",        desc:"Acheter {goal} cartes au market",  stat:"marketBought",      baseGoal:4,    xp:500 },
 { id:"gq_market10",    emoji:"🏪", name:"Clients du market",      desc:"Acheter {goal} cartes au market",  stat:"marketBought",      baseGoal:10,   xp:900 },

 /* --- EVENTS --- */
 { id:"gq_event4",      emoji:"🎪", name:"Aventuriers divins",     desc:"Ouvrir {goal} packs d'event",      stat:"eventPacksOpened",  baseGoal:4,    xp:500 },
 { id:"gq_event10",     emoji:"🎪", name:"Festivaliers",           desc:"Ouvrir {goal} packs d'event",      stat:"eventPacksOpened",  baseGoal:10,   xp:900 },

 /* --- DONS --- */
 { id:"gq_gift4",       emoji:"🎁", name:"Partage amical",         desc:"Faire {goal} dons",                stat:"giftsGiven",        baseGoal:4,    xp:400 },
 { id:"gq_gift12",      emoji:"🎁", name:"Généreux ensemble",      desc:"Faire {goal} dons",                stat:"giftsGiven",        baseGoal:12,   xp:800 },
 { id:"gq_gift25",      emoji:"🎁", name:"Philanthropes",          desc:"Faire {goal} dons",                stat:"giftsGiven",        baseGoal:25,   xp:1200 },

 /* --- KAMAS --- */
 { id:"gq_kamas25k",    emoji:"💎", name:"Économie florissante",   desc:"Gagner {goal} kamas",              stat:"totalKamasEarned",  baseGoal:25000,xp:600 },
 { id:"gq_kamas80k",    emoji:"💎", name:"Trésor de guilde",       desc:"Gagner {goal} kamas",              stat:"totalKamasEarned",  baseGoal:80000,xp:1200 },

 /* --- KROSMOSHOP --- */
 { id:"gq_shop4",       emoji:"🛒", name:"Clients du KrosmoShop",  desc:"Acheter {goal} cartes au shop",    stat:"shopBought",        baseGoal:4,    xp:400 },

]

/* ================= SCALING DYNAMIQUE ================= */

/**
 * Calcule l'effectif cible pour le scaling des quêtes.
 * - 10 membres → 8 (confortable, les quêtes sont faciles)
 * - 8 membres → 6
 * - 5 membres → 4
 * - 3 membres → 2
 * - 2 membres → 2
 * - 1 membre → 1
 */
function getEffectiveMembers(memberCount){
 if(memberCount <= 2) return Math.max(MIN_EFFECTIVE, memberCount)
 return Math.max(MIN_EFFECTIVE, Math.min(MAX_EFFECTIVE, Math.floor(memberCount * 0.8)))
}

/**
 * Calcule le goal adapté au nombre de membres.
 * Le goal de base est calibré pour BASE_CALIBRATION (8) joueurs.
 * On scale linéairement selon l'effectif cible.
 */
function getScaledGoal(baseGoal, memberCount){
 const effective = getEffectiveMembers(memberCount)
 const scaled = Math.max(1, Math.ceil(baseGoal * effective / BASE_CALIBRATION))
 return scaled
}

/* ================= SEMAINE COURANTE ================= */

function getCurrentWeek(){
 const now = new Date()
 const jan1 = new Date(now.getFullYear(), 0, 1)
 const days = Math.floor((now - jan1) / 86400000)
 const week = Math.ceil((days + jan1.getDay() + 1) / 7)
 return `${now.getFullYear()}-W${String(week).padStart(2, "0")}`
}

/* ================= SÉLECTION DÉTERMINISTE ================= */

function getWeeklyQuests(){

 const week = getCurrentWeek()
 let seed = 0
 for(let i = 0; i < week.length; i++) seed += week.charCodeAt(i) * (i + 1)

 const shuffled = [...QUEST_POOL]
  .map((q, i) => ({ q, sort: Math.sin(seed + i * 9301) }))
  .sort((a, b) => a.sort - b.sort)
  .map(x => x.q)

 /* Éviter 2 quêtes sur la même stat */
 const selected = []
 const usedStats = new Set()

 for(const q of shuffled){
  if(selected.length >= 3) break
  if(usedStats.has(q.stat)) continue
  selected.push(q)
  usedStats.add(q.stat)
 }

 return selected
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

  /* Ajouter les kamas actuels comme source pour totalKamasEarned */
  combined.totalKamasEarned = (combined.totalKamasEarned || 0) + (user.kamas || 0)

  /* Ajouter shopBought depuis krosmoshopStats */
  if(user.krosmoshopStats?.cardsBought){
   combined.shopBought = (combined.shopBought || 0) + user.krosmoshopStats.cardsBought
  }
 }

 return combined
}

/* ================= SNAPSHOT ================= */

function ensureSnapshot(guild){

 const week = getCurrentWeek()

 if(guild.questsWeek !== week){

  /* Nouvelle semaine : prendre un snapshot et reset les claims */
  guild.questSnapshot = getCombinedStats(guild.memberIds)
  guild.questsClaimed = []
  guild.questsWeek = week
  saveGuilds()
 }
}

/* ================= PROGRESSION ================= */

function getGuildQuestProgress(guildId){

 const guild = getGuild(guildId)
 if(!guild) return []

 ensureSnapshot(guild)

 const quests = getWeeklyQuests()
 const current = getCombinedStats(guild.memberIds)
 const snapshot = guild.questSnapshot || {}
 const memberCount = guild.memberIds.length

 return quests.map(q => {

  const scaledGoal = getScaledGoal(q.baseGoal, memberCount)
  const before = snapshot[q.stat] || 0
  const now = current[q.stat] || 0
  const progress = Math.max(0, now - before)

  /* Remplacer {goal} dans la description */
  const desc = q.desc.replace("{goal}", scaledGoal)

  return {
   ...q,
   goal: scaledGoal,
   desc,
   current: Math.min(progress, scaledGoal),
   done: progress >= scaledGoal,
   claimed: guild.questsClaimed?.includes(q.id) || false
  }
 })
}

/* ================= CLAIM ================= */

function claimGuildQuests(guildId, claimerId){

 const guild = getGuild(guildId)
 if(!guild) return { error:"Guilde introuvable." }

 if(guild.leaderId !== claimerId && !guild.officerIds.includes(claimerId))
  return { error:"Seuls le meneur et les officiers peuvent récupérer les récompenses." }

 ensureSnapshot(guild)

 const progress = getGuildQuestProgress(guildId)

 let totalXP = 0
 let claimed = 0

 for(const q of progress){

  if(q.done && !q.claimed){
   guild.questsClaimed.push(q.id)
   totalXP += q.xp
   claimed++
   guild.stats.questsCompleted = (guild.stats.questsCompleted || 0) + 1
  }
 }

 /* Bonus si les 3 quêtes complétées */
 const allDone = progress.every(q => q.done)
 const allClaimed = progress.every(q => q.claimed || (q.done && !q.claimed))
 let bonusXP = 0

 if(allDone && claimed > 0){
  bonusXP = 500
  totalXP += bonusXP
 }

 if(totalXP <= 0)
  return { error:"Aucune quête à récupérer.", claimed:0 }

 const levelResult = addGuildXP(guildId, totalXP)

 saveGuilds()

 return {
  claimed,
  totalXP,
  bonusXP,
  allDone,
  levelResult
 }
}

/* ================= RESET TIMER ================= */

function getNextGuildQuestReset(){

 const now = new Date()
 const day = now.getDay()
 const diff = day === 0 ? 1 : 8 - day

 const next = new Date(now)
 next.setDate(now.getDate() + diff)
 next.setHours(1, 0, 0, 0)

 const ms = next - now
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
 getWeeklyQuests,
 getGuildQuestProgress,
 claimGuildQuests,
 getNextGuildQuestReset,
 getEffectiveMembers,
 getScaledGoal,
 QUEST_POOL,
 BASE_CALIBRATION
}