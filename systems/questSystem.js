/* ===============================================
   QUEST SYSTEM — Quêtes Journalières & Hebdomadaires
   
   • 3 quêtes journalières (reset chaque jour à 1h FR)
   • 5 quêtes hebdomadaires (reset chaque lundi à 1h FR)
   • Même quêtes pour tout le monde
   • Progrès par diff de stats (aucune modif dans les commandes)
   • Bonus si toutes les quêtes d'une catégorie sont terminées
=============================================== */

const { addXP } = require("./progressionSystem")
const { rollFragmentForEvent, grantRolledFragment } = require("./fragmentService")

/* ================= QUEST POOLS ================= */

const DAILY_POOL = [

 /* PACKS */
 { id:"d_pack3",      name:"Ouverture Rapide",   desc:"Ouvrir 3 packs",                stat:"packsOpened",       goal:3,   reward:{ kamas:300, xp:50 },   emoji:"📦" },
 { id:"d_pack5",      name:"Série du Jour",      desc:"Ouvrir 5 packs",                stat:"packsOpened",       goal:5,   reward:{ kamas:500, xp:75 },   emoji:"📦" },
 { id:"d_pack1k",     name:"Pack Krosmoz",       desc:"Ouvrir 1 pack via /krosmoz",    stat:"krosmozOpened",     goal:1,   reward:{ kamas:150, xp:30 },   emoji:"🎴" },
 { id:"d_pack3k",     name:"Fan de Krosmoz",     desc:"Ouvrir 3 packs via /krosmoz",   stat:"krosmozOpened",     goal:3,   reward:{ kamas:400, xp:60 },   emoji:"🎴" },

 /* DROPS */
 { id:"d_ssr1",       name:"Touché !",           desc:"Obtenir 1 SSR",                 stat:"ssrPulled",         goal:1,   reward:{ kamas:1000, xp:100 }, emoji:"🌈" },

 /* FUSION */
 { id:"d_fusion1",    name:"Petit Alchimiste",   desc:"Faire 1 fusion",                stat:"fusions",           goal:1,   reward:{ kamas:200, xp:40 },   emoji:"⚗️" },
 { id:"d_fusion3",    name:"Alchimiste du Jour",desc:"Faire 3 fusions",               stat:"fusions",           goal:3,   reward:{ kamas:500, xp:80 },   emoji:"⚗️" },

 /* VENTES */
 { id:"d_sell3",      name:"Petit Marchand",     desc:"Vendre 3 cartes",               stat:"cardsSold",         goal:3,   reward:{ kamas:200, xp:30 },   emoji:"💰" },
 { id:"d_sell5",      name:"Déstockage",         desc:"Vendre 5 cartes",               stat:"cardsSold",         goal:5,   reward:{ kamas:350, xp:50 },   emoji:"💰" },

 /* DAILY */
 { id:"d_daily1",     name:"Présent !",          desc:"Réclamer ton daily",            stat:"dailyClaims",       goal:1,   reward:{ kamas:150, xp:30 },   emoji:"🎁" },

 /* SHOP */
 { id:"d_shop1",      name:"Client du Jour",     desc:"Acheter 1 carte au KrosmoShop", stat:"_shopBought",       goal:1,   reward:{ kamas:200, xp:40 },   emoji:"🛒" },
 { id:"d_shop2",      name:"Shopping",            desc:"Acheter 2 cartes au KrosmoShop",stat:"_shopBought",       goal:2,   reward:{ kamas:400, xp:60 },   emoji:"🛒" },

 /* SOCIAL */
 { id:"d_lb1",        name:"Curieux",             desc:"Consulter le leaderboard",      stat:"leaderboardViews",  goal:1,   reward:{ kamas:100, xp:20 },   emoji:"🏆" },
 { id:"d_profil2",    name:"Narcissique",         desc:"Consulter ton profil 2 fois",   stat:"profileViews",      goal:2,   reward:{ kamas:100, xp:20 },   emoji:"👤" },
 { id:"d_mention1",   name:"Bavard",              desc:"Mentionner le bot",             stat:"botMentions",       goal:1,   reward:{ kamas:100, xp:20 },   emoji:"💬" },
 { id:"d_inv2",       name:"Inventaire Check",    desc:"Ouvrir ton inventaire 2 fois",  stat:"inventoryOpen",     goal:2,   reward:{ kamas:100, xp:20 },   emoji:"🎒" },

 /* KAMAS */
 { id:"d_earn1k",     name:"Petit Bénéfice",     desc:"Gagner 1000 kamas",             stat:"_kamasEarned",      goal:1000,reward:{ kamas:200, xp:40 },   emoji:"🪙" },
 { id:"d_bal3",       name:"Vérificateur",        desc:"Consulter ton solde 3 fois",    stat:"balanceCheck",      goal:3,   reward:{ kamas:100, xp:20 },   emoji:"💰" },

]

const WEEKLY_POOL = [

 /* PACKS */
 { id:"w_pack15",     name:"Collectionneur",     desc:"Ouvrir 15 packs",               stat:"packsOpened",       goal:15,  reward:{ kamas:1500, xp:200 },          emoji:"📦" },
 { id:"w_pack30",     name:"Dévoreur de Packs",  desc:"Ouvrir 30 packs",               stat:"packsOpened",       goal:30,  reward:{ kamas:2000, xp:300, packs:1 }, emoji:"📦" },
 { id:"w_pack10k",    name:"Fidèle Krosmoz",     desc:"Ouvrir 10 packs via /krosmoz",  stat:"krosmozOpened",     goal:10,  reward:{ kamas:1000, xp:150 },          emoji:"🎴" },
 { id:"w_buy3",       name:"Investisseur",        desc:"Acheter 3 packs",               stat:"packsBought",       goal:3,   reward:{ kamas:800, xp:100 },           emoji:"🛍️" },

 /* SSR */
 { id:"w_ssr1",       name:"Chance de la Semaine",desc:"Obtenir 1 SSR",                stat:"ssrPulled",         goal:1,   reward:{ kamas:2000, xp:200 },          emoji:"🌈" },
 { id:"w_ssr3",       name:"Série Dorée",         desc:"Obtenir 3 SSR",                stat:"ssrPulled",         goal:3,   reward:{ kamas:3000, xp:400, packs:2 }, emoji:"🌈" },
 { id:"w_shiny1",     name:"Éclat Divin",         desc:"Obtenir 1 SSR Shiny",          stat:"shinySSR",          goal:1,   reward:{ kamas:5000, xp:500, packs:3 }, emoji:"✨" },

 /* FUSION */
 { id:"w_fusion5",    name:"Transmutateur",       desc:"Faire 5 fusions",              stat:"fusions",           goal:5,   reward:{ kamas:1200, xp:150 },          emoji:"⚗️" },
 { id:"w_fusion10",   name:"Maître Alchimiste",  desc:"Faire 10 fusions",             stat:"fusions",           goal:10,  reward:{ kamas:2500, xp:300, packs:1 }, emoji:"⚗️" },
 { id:"w_fusionCrit", name:"Coup de Chance",      desc:"Déclencher 1 fusion critique", stat:"fusionCrit",        goal:1,   reward:{ kamas:1500, xp:200 },          emoji:"🔥" },

 /* VENTES */
 { id:"w_sell10",     name:"Marchand",            desc:"Vendre 10 cartes",             stat:"cardsSold",         goal:10,  reward:{ kamas:800, xp:100 },           emoji:"💰" },
 { id:"w_sell25",     name:"Liquidateur",          desc:"Vendre 25 cartes",             stat:"cardsSold",         goal:25,  reward:{ kamas:2000, xp:250 },          emoji:"💰" },

 /* DAILY */
 { id:"w_daily5",     name:"Régulier",            desc:"Réclamer 5 daily",             stat:"dailyClaims",       goal:5,   reward:{ kamas:800, xp:150 },           emoji:"🎁" },
 { id:"w_daily7",     name:"Semaine Parfaite",    desc:"Réclamer 7 daily",             stat:"dailyClaims",       goal:7,   reward:{ kamas:1500, xp:250, packs:2 }, emoji:"🎁" },

 /* SHOP */
 { id:"w_shop5",      name:"Client Fidèle",       desc:"Acheter 5 cartes au KrosmoShop",stat:"_shopBought",      goal:5,   reward:{ kamas:1200, xp:150 },          emoji:"🛒" },
 { id:"w_shopKamas",  name:"Dépensier",            desc:"Dépenser 3000 au KrosmoShop",  stat:"_shopKamasSpent",   goal:3000,reward:{ kamas:800, xp:100 },           emoji:"🛒" },

 /* EVENTS */
 { id:"w_event2",     name:"Participant",          desc:"Ouvrir 2 packs d'event",       stat:"eventPacksOpened",  goal:2,   reward:{ kamas:1000, xp:150 },          emoji:"🎪" },
 { id:"w_event5",     name:"Fanatique",            desc:"Ouvrir 5 packs d'event",       stat:"eventPacksOpened",  goal:5,   reward:{ kamas:2000, xp:300, packs:1 }, emoji:"🎪" },
 { id:"w_eventSSR",   name:"Béni des Dieux",      desc:"Obtenir 1 SSR en event",       stat:"ssrFromEvent",      goal:1,   reward:{ kamas:2500, xp:300 },          emoji:"🎪" },

 /* MARKET */
 { id:"w_market1",    name:"Commerçant",           desc:"Acheter 1 carte au market",    stat:"marketBought",      goal:1,   reward:{ kamas:500, xp:80 },            emoji:"🛍️" },

 /* KAMAS */
 { id:"w_earn5k",     name:"Enrichissement",       desc:"Gagner 5000 kamas",            stat:"_kamasEarned",      goal:5000,reward:{ kamas:500, xp:100, packs:1 },  emoji:"🪙" },
 { id:"w_earn15k",    name:"Fortune",               desc:"Gagner 15000 kamas",           stat:"_kamasEarned",      goal:15000,reward:{ kamas:1000, xp:200, packs:2}, emoji:"🪙" },

 /* SOCIAL */
 { id:"w_lb5",        name:"Observateur",           desc:"Consulter le leaderboard 5 fois",stat:"leaderboardViews",goal:5,  reward:{ kamas:400, xp:60 },            emoji:"🏆" },
 { id:"w_mention5",   name:"Ami du Bot",            desc:"Mentionner le bot 5 fois",     stat:"botMentions",       goal:5,   reward:{ kamas:400, xp:60 },            emoji:"💬" },

]

/* ================= ROULETTE QUESTS ================= */

DAILY_POOL.push(
 { id:"d_roulette4",  name:"Tour de Chance",      desc:"Jouer 4 fois a la roulette",   stat:"rouletteSpins", goal:4,  reward:{ kamas:450, xp:70 }, emoji:"🎡" }
)

WEEKLY_POOL.push(
 { id:"w_roulette20", name:"Ecaflip en Folie",    desc:"Jouer 20 fois a la roulette",  stat:"rouletteSpins", goal:20, reward:{ kamas:2200, xp:320, packs:1 }, emoji:"🎡" }
)

/* ================= BONUS COMPLETION ================= */

const DAILY_BONUS  = { kamas:700,  xp:120, packs:1, fragments:2 }
const WEEKLY_BONUS = { kamas:6500, xp:650, packs:5, fragments:8 }

const DAILY_COUNT  = 3
const WEEKLY_COUNT = 5

/* ================= TIME UTILS (FRANCE — 1h) ================= */

function getFRNow(){
 const str = new Date().toLocaleString("en-US", { timeZone:"Europe/Paris" })
 return new Date(str)
}

function getDayId(){
 const fr = getFRNow()
 if(fr.getHours() < 1) fr.setDate(fr.getDate() - 1)
 return `${fr.getFullYear()}-${String(fr.getMonth()+1).padStart(2,"0")}-${String(fr.getDate()).padStart(2,"0")}`
}

function getWeekId(){
 const fr = getFRNow()
 if(fr.getHours() < 1) fr.setDate(fr.getDate() - 1)

 const d = new Date(Date.UTC(fr.getFullYear(), fr.getMonth(), fr.getDate()))
 const dayNum = d.getUTCDay() || 7
 d.setUTCDate(d.getUTCDate() + 4 - dayNum)
 const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1))
 const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7)
 return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2,"0")}`
}

function getNextDailyReset(){
 const fr = getFRNow()
 const next = new Date(fr)
 if(fr.getHours() >= 1) next.setDate(next.getDate() + 1)
 next.setHours(1, 0, 0, 0)
 const diff = next - fr
 const hours = Math.floor(diff / 3600000)
 const minutes = Math.floor((diff % 3600000) / 60000)
 return `${hours}h${String(minutes).padStart(2,"0")}`
}

function getNextWeeklyReset(){
 const fr = getFRNow()
 const adjusted = new Date(fr)
 if(adjusted.getHours() < 1) adjusted.setDate(adjusted.getDate() - 1)

 const day = adjusted.getDay() || 7
 const daysUntilMonday = day === 1 ? 7 : (8 - day)

 const next = new Date(adjusted)
 next.setDate(next.getDate() + daysUntilMonday)
 next.setHours(1, 0, 0, 0)

 const diff = next - fr
 const days = Math.floor(diff / 86400000)
 const hours = Math.floor((diff % 86400000) / 3600000)

 if(days === 0) return `${hours}h`
 return `${days}j ${hours}h`
}

/* ================= DETERMINISTIC SELECTION ================= */

function hashCode(str){
 let hash = 0
 for(let i = 0; i < str.length; i++){
  hash = ((hash << 5) - hash) + str.charCodeAt(i)
  hash |= 0
 }
 return Math.abs(hash)
}

function pickQuests(pool, count, seedStr){
 const seed = hashCode(seedStr)
 const shuffled = [...pool]
 let s = seed

 for(let i = shuffled.length - 1; i > 0; i--){
  s = (s * 1103515245 + 12345) & 0x7fffffff
  const j = s % (i + 1)
  ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
 }

 const selected = []
 const usedStats = new Set()

 for(const quest of shuffled){
  if(selected.length >= count) break
  if(usedStats.has(quest.stat)) continue
  selected.push(quest)
  usedStats.add(quest.stat)
 }

 return selected
}

function getDailyQuests(){
 const dayId = getDayId()
 return { dayId, quests: pickQuests(DAILY_POOL, DAILY_COUNT, "daily-" + dayId) }
}

function getWeeklyQuests(){
 const weekId = getWeekId()
 return { weekId, quests: pickQuests(WEEKLY_POOL, WEEKLY_COUNT, "weekly-" + weekId) }
}

/* ================= STAT VALUE ================= */

function getStatValue(user, stat){
 if(stat === "_shopBought") return user.krosmoshopStats?.cardsBought || 0
 if(stat === "_shopKamasSpent") return user.krosmoshopStats?.kamasSpent || 0
 if(stat === "_kamasEarned") return user.stats?.kamasEarned || 0
 return user.stats?.[stat] || 0
}

function buildQuestReward(quest, type){
 const base = quest?.reward || {}
 const goal = Math.max(1, Number(quest?.goal || 1))
 const safeType = type === "weekly" ? "weekly" : "daily"
 const packsBase = Math.max(0, Number(base.packs || 0))
 const fragmentsBase = Math.max(0, Number(base.fragments || 0))

 const packs = Math.max(
  packsBase,
  safeType === "weekly" ? 1 : (goal >= 5 ? 1 : 0)
 )
 const fragments = Math.max(
  fragmentsBase,
  safeType === "weekly" ? 3 : 1
 )

 return {
  kamas: Math.max(0, Number(base.kamas || 0)),
  xp: Math.max(0, Number(base.xp || 0)),
  packs,
  fragments
 }
}

function grantQuestFragments(userId, amount, source = "quest"){
 const safeAmount = Math.max(0, Number(amount || 0))
 if (!safeAmount || !userId) return 0

 let granted = 0
 for (let i = 0; i < safeAmount; i++) {
  const rolled = rollFragmentForEvent(1)
  if (!rolled) continue
  const fragment = grantRolledFragment(String(userId), rolled, source)
  if (fragment) granted++
 }
 return granted
}

/* ================= USER QUEST STATE ================= */

function ensureUserQuests(user){

 if(!user.quests) user.quests = {}

 const { dayId, quests:dailyQuests } = getDailyQuests()
 const { weekId, quests:weeklyQuests } = getWeeklyQuests()

 if(!user.quests.daily || user.quests.daily.dayId !== dayId){
  const snapshot = {}
  for(const q of dailyQuests) snapshot[q.stat] = getStatValue(user, q.stat)
  user.quests.daily = { dayId, snapshot, claimed:[] }
 }

 if(!user.quests.weekly || user.quests.weekly.weekId !== weekId){
  const snapshot = {}
  for(const q of weeklyQuests) snapshot[q.stat] = getStatValue(user, q.stat)
  user.quests.weekly = { weekId, snapshot, claimed:[] }
 }

 return user.quests
}

/* ================= PROGRESS ================= */

function getQuestProgress(user, quest, type){
 const uq = ensureUserQuests(user)
 const data = type === "daily" ? uq.daily : uq.weekly
 const current = getStatValue(user, quest.stat)
 const baseline = data.snapshot[quest.stat] || 0
 const progress = Math.max(0, current - baseline)

 return {
  current: Math.min(progress, quest.goal),
  goal: quest.goal,
  done: progress >= quest.goal,
  claimed: data.claimed.includes(quest.id)
 }
}

function getAllProgress(user, type){
 const safeType = type === "weekly" ? "weekly" : "daily"
 const { quests } = safeType === "daily" ? getDailyQuests() : getWeeklyQuests()
 ensureUserQuests(user)
 return quests.map((q) => ({
  ...q,
  reward: buildQuestReward(q, safeType),
  ...getQuestProgress(user, q, safeType)
 }))
}

/* ================= CLAIM ================= */

function claimQuest(user, questId, type, options = {}){
 const safeType = type === "weekly" ? "weekly" : "daily"
 const { quests } = safeType === "daily" ? getDailyQuests() : getWeeklyQuests()
 const uq = ensureUserQuests(user)
 const data = safeType === "daily" ? uq.daily : uq.weekly
 const bonus = safeType === "daily" ? DAILY_BONUS : WEEKLY_BONUS
 const maxCount = safeType === "daily" ? DAILY_COUNT : WEEKLY_COUNT
 const safeUserId = String(options?.userId || user?.id || "").trim()

 const quest = quests.find((q) => q.id === questId)
 if(!quest) return { error:"Quete introuvable" }

 const progress = getQuestProgress(user, quest, safeType)
 if(!progress.done) return { error:"Quete pas terminee" }
 if(progress.claimed) return { error:"Deja recuperee" }

 const questReward = buildQuestReward(quest, safeType)

 if(questReward.kamas) user.kamas = (user.kamas || 0) + questReward.kamas
 if(questReward.packs) user.packs = (user.packs || 0) + questReward.packs
 if(questReward.xp) addXP(user, questReward.xp)

 const grantedFragments = grantQuestFragments(safeUserId, questReward.fragments, `quest_${safeType}`)

 if(!user.stats || typeof user.stats !== "object") user.stats = {}
 user.stats.questClaims = (user.stats.questClaims || 0) + 1
 if(safeType === "daily") user.stats.dailyQuestClaims = (user.stats.dailyQuestClaims || 0) + 1
 if(safeType === "weekly") user.stats.weeklyQuestClaims = (user.stats.weeklyQuestClaims || 0) + 1

 data.claimed.push(questId)

 let completionBonus = false
 let bonusGrantedFragments = 0

 if(data.claimed.length >= maxCount){
  if(bonus.kamas) user.kamas = (user.kamas || 0) + bonus.kamas
  if(bonus.packs) user.packs = (user.packs || 0) + bonus.packs
  if(bonus.xp) addXP(user, bonus.xp)
  bonusGrantedFragments = grantQuestFragments(safeUserId, Number(bonus.fragments || 0), `quest_${safeType}_bonus`)
  if(safeType === "daily") user.stats.dailyQuestPerfectDays = (user.stats.dailyQuestPerfectDays || 0) + 1
  if(safeType === "weekly") user.stats.weeklyQuestPerfectWeeks = (user.stats.weeklyQuestPerfectWeeks || 0) + 1
  completionBonus = true
 }

 return {
  success:true,
  quest: {
   ...quest,
   reward: {
    ...questReward,
    fragments: grantedFragments
   }
  },
  grantedFragments,
  bonusGrantedFragments,
  completionBonus
 }
}

function claimAll(user, type, options = {}){
 const safeType = type === "weekly" ? "weekly" : "daily"
 const progress = getAllProgress(user, safeType)
 const bonus = safeType === "daily" ? DAILY_BONUS : WEEKLY_BONUS

 let totalKamas = 0
 let totalPacks = 0
 let totalXp = 0
 let totalFragments = 0
 let claimedCount = 0
 let completionBonus = false

 for(const q of progress){
  if(q.done && !q.claimed){
   const result = claimQuest(user, q.id, safeType, options)
   if(result.success){
    const grantedReward = result?.quest?.reward || {}
    claimedCount++
    totalKamas += Number(grantedReward.kamas || 0)
    totalPacks += Number(grantedReward.packs || 0)
    totalXp += Number(grantedReward.xp || 0)
    totalFragments += Number(result?.grantedFragments || 0)
    if(result.completionBonus){
     completionBonus = true
     totalKamas += Number(bonus.kamas || 0)
     totalPacks += Number(bonus.packs || 0)
     totalXp += Number(bonus.xp || 0)
     totalFragments += Number(result?.bonusGrantedFragments || 0)
    }
   }
  }
 }

 return { claimedCount, totalKamas, totalPacks, totalXp, totalFragments, completionBonus }
}

/* ================= EXPORTS ================= */

module.exports = {
 getDailyQuests,
 getWeeklyQuests,
 ensureUserQuests,
 getQuestProgress,
 getAllProgress,
 claimQuest,
 claimAll,
 getDayId,
 getWeekId,
 getNextDailyReset,
 getNextWeeklyReset,
 DAILY_BONUS,
 WEEKLY_BONUS,
 DAILY_COUNT,
 WEEKLY_COUNT
}
