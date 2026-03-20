const { data, save, loadUser } = require("./dataManager")

const users = data.users

/* ---------------- DEFAULT STRUCTURES ---------------- */

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

 if(!user.stats){
  user.stats = {}
 }

 const s = user.stats

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

 if(!user.krosmoshop)
  user.krosmoshop = {}

 if(!user.krosmoshopStats){
  user.krosmoshopStats = {
   cardsBought:0,
   ssrBought:0
  }
 }

 if(user.krosmoshopStats.cardsBought === undefined)
  user.krosmoshopStats.cardsBought = 0

 if(user.krosmoshopStats.ssrBought === undefined)
  user.krosmoshopStats.ssrBought = 0

 return user
}

function ensureProgression(user){

 if(!user.progression){
  user.progression={
   level:1,
   xp:0,
   totalXp:0
  }
 }

 return user
}

function ensureDaily(user){

 if(!user.daily){
  user.daily = {
   streak:0,
   lastDaily:0
  }
 }

 return user
}

/* ---------------- MIGRATION GLOBALE ---------------- */

function migrateAll(){

 let changed = false
 const now = Date.now()

 for(const id in users){

  const user = users[id]

  if(!user.cards){
   user.cards={}
   changed = true
  }

  ensureEconomy(user)
  ensureAchievements(user)
  ensureProgression(user)
  ensureDaily(user)
  ensureKrosmoShop(user)
  ensureStats(user, now)

  if(!user.pity){
   user.pity={}
   changed = true
  }

  ensurePity(user.pity)

  // Fix : on marque dirty uniquement si on a vraiment modifié quelque chose
  if(changed)
   user._dirty = true

 }

 if(changed){
  console.log("Migration globale des users effectuée.")
  save()
 }

}

/* ---------------- INIT ---------------- */

migrateAll()

/* ---------------- USER MANAGEMENT ---------------- */

function getUser(id){

 let user = loadUser(id)

 const now = Date.now()

 if(!user){

  // Nouveau user : on le crée et on le marque dirty
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
   progression:{
    level:1,
    xp:0,
    totalXp:0
   },
   stats:{
    cardsSold:0,
    cardsBought:0,
    ssrPulled:0,
    shinySSR:0,
    ssrStreak:0,
    fusions:0,
    fusionCrit:0,
    fusionDouble:0,
    tripleFusionToday:0,
    lastTripleReset:now,
    packsOpened:0,
    packsBought:0
   },
   krosmoshop:{},
   krosmoshopStats:{
    cardsBought:0,
    ssrBought:0
   },
   daily:{
    streak:0,
    lastDaily:0
   }
  }

  // Fix : dirty uniquement à la création
  user._dirty = true
  users[id] = user
  save()

 }

 /* RUNTIME SELF-HEAL sans marquer dirty */

 ensureEconomy(user)
 ensureAchievements(user)
 ensureProgression(user)
 ensureDaily(user)
 ensureKrosmoShop(user)
 ensureStats(user, now)

 if(!user.pity)
  user.pity = {}

 ensurePity(user.pity)

 // Fix : suppression du user._dirty = true systématique
 // Les commandes qui modifient un user appellent save() explicitement

 return user

}

function getUsers(){
 return users
}

module.exports = {
 getUser,
 getUsers,
 save
}