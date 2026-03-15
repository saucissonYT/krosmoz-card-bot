const { data, save, loadUser } = require("./dataManager")

const users = data.users

/* ---------------- MIGRATION INVENTAIRE ---------------- */

function migrateInventories(){

 let changed = false

 for(const id in users){

  const user = users[id]

  if(!user.cards) continue

  if(Array.isArray(user.cards)){

   const newCards = {}

   for(const cardId of user.cards){

    const key = String(cardId)

    if(!newCards[key])
     newCards[key] = 0

    newCards[key]++

   }

   user.cards = newCards
   user._dirty = true
   changed = true

  }

  if(user.cards["[object Object]"]){

   delete user.cards["[object Object]"]
   user._dirty = true
   changed = true

  }

 }

 if(changed){

  console.log("Migration des inventaires effectuée.")
  save()

 }

}

/* ---------------- MIGRATION PACKS ---------------- */

function migratePacks(){

 let changed = false

 for(const id in users){

  const user = users[id]

  if(user.packs === undefined){

   user.packs = 0
   user._dirty = true
   changed = true

  }

 }

 if(changed){

  console.log("Migration des packs effectuée.")
  save()

 }

}

/* ---------------- MIGRATION USERS ---------------- */

function migrateUsers(){

 let changed = false

 const now = Date.now()

 for(const id in users){

  const user = users[id]

  if(!user.cards){
   user.cards = {}
   user._dirty = true
   changed = true
  }

  if(user.kamas === undefined){
   user.kamas = 0
   user._dirty = true
   changed = true
  }

  if(user.lastPack === undefined){
   user.lastPack = 0
   user._dirty = true
   changed = true
  }

  if(user.lastClaim === undefined){
   user.lastClaim = 0
   user._dirty = true
   changed = true
  }

  if(!user.pity){
   user.pity = {}
   user._dirty = true
   changed = true
  }

  if(!user.achievements){
   user.achievements = []
   user._dirty = true
   changed = true
  }

  if(!user.titles){
   user.titles = ["Nouveau"]
   user._dirty = true
   changed = true
  }

  if(!user.title){
   user.title = "Nouveau"
   user._dirty = true
   changed = true
  }

  if(!user.progression){
   user.progression={
    level:1,
    xp:0,
    totalXp:0
   }
   user._dirty = true
   changed = true
  }

  if(!user.stats){
   user.stats = {
    cardsSold:0,
    ssrPulled:0,
    fusions:0,
    fusionCrit:0,
    fusionDouble:0,
    tripleFusionToday:0,
    lastTripleReset:now,
    packsOpened:0,
    packsBought:0
   }
   user._dirty = true
   changed = true
  }

  if(user.stats.tripleFusionToday === undefined){
   user.stats.tripleFusionToday = 0
   user._dirty = true
   changed = true
  }

  if(user.stats.lastTripleReset === undefined){
   user.stats.lastTripleReset = now
   user._dirty = true
   changed = true
  }

  if(!user.daily){
   user.daily = {
    streak:0,
    lastDaily:0
   }
   user._dirty = true
   changed = true
  }

 }

 if(changed){

  console.log("Migration des utilisateurs effectuée.")
  save()

 }

}

/* ---------------- LANCEMENT MIGRATIONS ---------------- */

migrateInventories()
migratePacks()
migrateUsers()

/* ---------------- USER MANAGEMENT ---------------- */

function getUser(id){

 let user = loadUser(id)

 if(!user){

  const now = Date.now()

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
    ssrPulled:0,
    fusions:0,
    fusionCrit:0,
    fusionDouble:0,
    tripleFusionToday:0,
    lastTripleReset:now,
    packsOpened:0,
    packsBought:0
   },
   daily:{
    streak:0,
    lastDaily:0
   }
  }

  user._dirty = true

  users[id] = user

  save()

 }

 user._dirty = true

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