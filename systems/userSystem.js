const { data, save: dataSave, loadUser, saveUser } = require("./dataManager")

const users = data.users

/* ================================================
   DEFAULT STRUCTURES
================================================ */

function ensurePity(pity){

 if(!pity) return {}

 for(const setId in pity){

  const p = pity[setId]

  if(!pity[setId])
   pity[setId]={UR:0,S:0,SSR:0}

  if(p.UR === undefined) p.UR = 0
  if(p.S === undefined) p.S = 0
  if(p.SSR === undefined) p.SSR = 0

 }

 return pity
}

function ensureStats(user, now){

 if(!user.stats) user.stats = {}

 const s = user.stats

 /* ---- STATS DE BASE ---- */
 if(s.cardsSold === undefined) s.cardsSold = 0
 if(s.cardsBought === undefined) s.cardsBought = 0
 if(s.ssrPulled === undefined) s.ssrPulled = 0
 if(s.shinySSR === undefined) s.shinySSR = 0
 if(s.ssrStreak === undefined) s.ssrStreak = 0
 if(s.fusions === undefined) s.fusions = 0
 if(s.fusionCrit === undefined) s.fusionCrit = 0
 if(s.fusionDouble === undefined) s.fusionDouble = 0
 if(s.tripleFusionToday === undefined) s.tripleFusionToday = 0
 if(s.lastTripleReset === undefined) s.lastTripleReset = now
 if(s.packsOpened === undefined) s.packsOpened = 0
 if(s.packsBought === undefined) s.packsBought = 0

 /* ---- STATS EVENTS ---- */
 if(s.eventPacksOpened === undefined) s.eventPacksOpened = 0
 if(s.ssrFromEvent === undefined) s.ssrFromEvent = 0
 if(s.ticketsFullyUsed === undefined) s.ticketsFullyUsed = 0
 if(s.jackpotEnutrof === undefined) s.jackpotEnutrof = 0
 if(s.jackpotFeca === undefined) s.jackpotFeca = 0
 if(s.firstEventPacks === undefined) s.firstEventPacks = 0
 if(!s.eventsParticipated) s.eventsParticipated = []
 if(!s.ssrByClass) s.ssrByClass = {}
 if(!s.eventPacksByClass) s.eventPacksByClass = {}

 /* ---- STATS SPÉCIALES ---- */
 if(s.krosmozOpened === undefined) s.krosmozOpened = 0
 if(s.packAtMidnight === undefined) s.packAtMidnight = 0
 if(s.ssrOnMonday === undefined) s.ssrOnMonday = 0
 if(s.allCPack === undefined) s.allCPack = 0
 if(s.allUPack === undefined) s.allUPack = 0
 if(s.palindromeReached === undefined) s.palindromeReached = 0
 if(s.dryStreak === undefined) s.dryStreak = 0
 if(s.dryStreakMax === undefined) s.dryStreakMax = 0
 if(s.hardPityReached === undefined) s.hardPityReached = 0
 if(s.sellFast === undefined) s.sellFast = 0
 if(s.marketBought === undefined) s.marketBought = 0
 if(s.marketSSRListed === undefined) s.marketSSRListed = 0
 if(s.fusionSSRResult === undefined) s.fusionSSRResult = 0
 if(s.speedTickets === undefined) s.speedTickets = 0
 if(!s.tradePartners) s.tradePartners = {}
 if(s.tradeBothWaysToday === undefined) s.tradeBothWaysToday = 0
 if(s.activityStreak === undefined) s.activityStreak = 0
 if(s.lastActivityDay === undefined) s.lastActivityDay = null
 if(s.createdAt === undefined) s.createdAt = now

 return s
}

function ensureEconomy(user){
 if(user.kamas === undefined) user.kamas = 0
 if(user.packs === undefined) user.packs = 0
 return user
}

function ensureAchievements(user){
 if(!user.achievements) user.achievements = []
 if(!user.titles) user.titles = ["Nouveau"]
 if(!user.title) user.title = "Nouveau"
 return user
}

function ensureKrosmoShop(user){

 if(!user.krosmoshop) user.krosmoshop = {}

 if(!user.krosmoshopStats){
  user.krosmoshopStats = { cardsBought:0, ssrBought:0 }
 }

 if(user.krosmoshopStats.cardsBought === undefined) user.krosmoshopStats.cardsBought = 0
 if(user.krosmoshopStats.ssrBought === undefined) user.krosmoshopStats.ssrBought = 0

 return user
}

function ensureProgression(user){
 if(!user.progression){
  user.progression = { level:1, xp:0, totalXp:0 }
 }
 return user
}

function ensureDaily(user){
 if(!user.daily){
  user.daily = { streak:0, lastDaily:0 }
 }
 return user
}

/* ================================================
   ACTIVITY STREAK
================================================ */

function updateActivityStreak(user){

 const today = new Date().toDateString()

 if(user.stats.lastActivityDay === today) return

 if(user.stats.lastActivityDay){

  const last = new Date(user.stats.lastActivityDay)
  const now = new Date()
  const diff = Math.floor((now - last) / 86400000)

  if(diff === 1){
   user.stats.activityStreak = (user.stats.activityStreak || 0) + 1
  } else if(diff > 1){
   user.stats.activityStreak = 1
  }

 } else {
  user.stats.activityStreak = 1
 }

 user.stats.lastActivityDay = today
}

/* ================================================
   PALINDROME CHECK
================================================ */

function isPalindrome(n){
 const s = String(n)
 return s === s.split("").reverse().join("")
}

function checkPalindrome(user){
 const total = Object.values(user.cards||{}).reduce((a,b)=>a+b,0)
 if(total > 0 && isPalindrome(total)){
  user.stats.palindromeReached = (user.stats.palindromeReached || 0) + 1
 }
}

/* ================================================
   MIGRATION GLOBALE
================================================ */

function migrateAll(){

 let changed = false
 const now = Date.now()

 for(const id in users){

  const user = users[id]

  if(!user.cards){ user.cards = {}; changed = true }

  ensureEconomy(user)
  ensureAchievements(user)
  ensureProgression(user)
  ensureDaily(user)
  ensureKrosmoShop(user)
  ensureStats(user, now)

  if(!user.pity){ user.pity = {}; changed = true }

  ensurePity(user.pity)

  if(changed) user._dirty = true
 }

 if(changed){
  console.log("Migration globale des users effectuée.")
 }

}

/* ================================================
   INIT
================================================ */

migrateAll()

/* ================================================
   MARK DIRTY — à appeler quand on modifie un user
================================================ */

function markDirty(id){

 if(users[id]){
  users[id]._dirty = true
 }

}

/* ================================================
   SAVE — FIX CRITIQUE
   L'ancienne version appelait seulement dataSave()
   qui ne sauvegarde que market/cards/devs.
   Maintenant on sauvegarde AUSSI les users modifiés.
================================================ */

function save(userId){

 /* Si un userId spécifique est fourni, on save juste ce user */
 if(userId && users[userId]){
  users[userId]._dirty = true
  saveUser(userId)
 } else {
  /* Sinon on sauvegarde TOUS les users chargés en mémoire */
  for(const id in users){
   if(users[id]){
    users[id]._dirty = true
    saveUser(id)
   }
  }
 }

 /* Sauvegarde des données statiques (market, cards, devs, etc.) */
 dataSave()

}

/* ================================================
   USER MANAGEMENT
================================================ */

function getUser(id){

 let user = loadUser(id)

 const now = Date.now()

 if(!user){

  user = {
   cards:{},
   kamas:0,
   packs:0,
   lastPack:0,
   lastClaim:0,
   pity:{},
   achievements:[],
   titles:["Nouveau"],
   title:"Nouveau",
   progression:{ level:1, xp:0, totalXp:0 },
   stats:{
    cardsSold:0, cardsBought:0,
    ssrPulled:0, shinySSR:0, ssrStreak:0,
    fusions:0, fusionCrit:0, fusionDouble:0,
    tripleFusionToday:0, lastTripleReset:now,
    packsOpened:0, packsBought:0,
    /* EVENTS */
    eventPacksOpened:0, ssrFromEvent:0,
    ticketsFullyUsed:0, jackpotEnutrof:0, jackpotFeca:0,
    firstEventPacks:0,
    eventsParticipated:[], ssrByClass:{}, eventPacksByClass:{},
    /* SPÉCIAL */
    krosmozOpened:0,
    packAtMidnight:0, ssrOnMonday:0,
    allCPack:0, allUPack:0, palindromeReached:0,
    dryStreak:0, dryStreakMax:0, hardPityReached:0,
    sellFast:0, marketBought:0, marketSSRListed:0,
    fusionSSRResult:0, speedTickets:0,
    tradePartners:{}, tradeBothWaysToday:0,
    activityStreak:0, lastActivityDay:null,
    createdAt:now
   },
   krosmoshop:{},
   krosmoshopStats:{ cardsBought:0, ssrBought:0 },
   daily:{ streak:0, lastDaily:0 }
  }

  user._dirty = true
  users[id] = user
  save(id)

 }

 ensureEconomy(user)
 ensureAchievements(user)
 ensureProgression(user)
 ensureDaily(user)
 ensureKrosmoShop(user)
 ensureStats(user, now)

 if(!user.pity) user.pity = {}

 ensurePity(user.pity)

 return user

}

function getUsers(){
 return users
}

/* ================================================
   EXPORTS
================================================ */

module.exports = {
 getUser,
 getUsers,
 save,
 markDirty,
 updateActivityStreak,
 checkPalindrome,
 isPalindrome
}