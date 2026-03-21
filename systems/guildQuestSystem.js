/* ===============================================
   GUILD QUEST SYSTEM — Quêtes hebdomadaires de guilde
   
   3 quêtes par semaine, mêmes pour toutes les guildes.
   Progrès calculé par diff de stats combinées des membres.
   Récompense en XP de guilde.
=============================================== */

const { getUser } = require("./userSystem")
const { getGuild, addGuildXP, saveGuilds } = require("./guildSystem")

/* ================= POOL DE QUÊTES ================= */

const QUEST_POOL = [

 { id:"gq_packs50",     emoji:"📦", name:"Ouverture massive",      desc:"Ouvrir 50 packs",              stat:"packsOpened",       goal:50,   xp:500 },
 { id:"gq_packs100",    emoji:"📦", name:"Avalanche de packs",     desc:"Ouvrir 100 packs",             stat:"packsOpened",       goal:100,  xp:1000 },
 { id:"gq_packs200",    emoji:"📦", name:"Pluie de cartes",        desc:"Ouvrir 200 packs",             stat:"packsOpened",       goal:200,  xp:2000 },
 { id:"gq_fusions20",   emoji:"⚗️", name:"Alchimie de groupe",    desc:"Faire 20 fusions",             stat:"fusions",           goal:20,   xp:600 },
 { id:"gq_fusions50",   emoji:"⚗️", name:"Laboratoire actif",     desc:"Faire 50 fusions",             stat:"fusions",           goal:50,   xp:1200 },
 { id:"gq_ssr5",        emoji:"🌈", name:"Chasseurs de SSR",       desc:"Obtenir 5 SSR",                stat:"ssrPulled",         goal:5,    xp:800 },
 { id:"gq_ssr10",       emoji:"🌈", name:"Moisson arc-en-ciel",    desc:"Obtenir 10 SSR",               stat:"ssrPulled",         goal:10,   xp:1500 },
 { id:"gq_daily20",     emoji:"🎁", name:"Fidélité collective",    desc:"Réclamer 20 daily",            stat:"dailyClaims",       goal:20,   xp:400 },
 { id:"gq_daily50",     emoji:"🎁", name:"Assiduité exemplaire",   desc:"Réclamer 50 daily",            stat:"dailyClaims",       goal:50,   xp:900 },
 { id:"gq_sell30",      emoji:"💰", name:"Liquidation",            desc:"Vendre 30 cartes",             stat:"cardsSold",         goal:30,   xp:500 },
 { id:"gq_sell100",     emoji:"💰", name:"Grand déstockage",       desc:"Vendre 100 cartes",            stat:"cardsSold",         goal:100,  xp:1000 },
 { id:"gq_market10",    emoji:"🏪", name:"Clients du market",      desc:"Acheter 10 cartes au market",  stat:"marketBought",      goal:10,   xp:700 },
 { id:"gq_event10",     emoji:"🎪", name:"Festivaliers",           desc:"Ouvrir 10 packs d'event",      stat:"eventPacksOpened",  goal:10,   xp:600 },
 { id:"gq_gift10",      emoji:"🎁", name:"Généreux ensemble",      desc:"Faire 10 dons",                stat:"giftsGiven",        goal:10,   xp:500 },
 { id:"gq_gift25",      emoji:"🎁", name:"Philanthropes",          desc:"Faire 25 dons",                stat:"giftsGiven",        goal:25,   xp:1000 },
 { id:"gq_kamas50k",    emoji:"💎", name:"Économie florissante",   desc:"Gagner 50 000 kamas",          stat:"totalKamasEarned",  goal:50000,xp:800 },
 { id:"gq_shop5",       emoji:"🛒", name:"Clients du KrosmoShop",  desc:"Acheter 5 cartes au shop",     stat:"shopBought",        goal:5,    xp:400 },

]

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

 return shuffled.slice(0, 3)
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

 return quests.map(q => {

  const before = snapshot[q.stat] || 0
  const now = current[q.stat] || 0
  const progress = Math.max(0, now - before)

  return {
   ...q,
   current: Math.min(progress, q.goal),
   done: progress >= q.goal,
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
 QUEST_POOL
}