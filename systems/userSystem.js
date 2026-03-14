const { data, save } = require("./dataManager")

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
   changed = true

  }

  if(user.cards["[object Object]"]){

   delete user.cards["[object Object]"]
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

 for(const id in users){

  const user = users[id]

  if(!user.cards){
   user.cards = {}
   changed = true
  }

  if(user.kamas === undefined){
   user.kamas = 0
   changed = true
  }

  if(user.lastPack === undefined){
   user.lastPack = 0
   changed = true
  }

  if(user.lastClaim === undefined){
   user.lastClaim = 0
   changed = true
  }

  if(!user.pity){
   user.pity = {}
   changed = true
  }

  if(!user.achievements){
   user.achievements = []
   changed = true
  }

  if(!user.titles){
   user.titles = ["Nouveau"]
   changed = true
  }

  if(!user.title){
   user.title = "Nouveau"
   changed = true
  }

  if(!user.progression){
   user.progression={
    level:1,
    xp:0,
    totalXp:0
   }
   changed = true
  }

  if(!user.stats){
   user.stats = {
    cardsSold:0,
    ssrPulled:0,
    fusions:0,
    fusionCrit:0,
    fusionDouble:0,
    packsOpened:0,
    packsBought:0
   }
   changed = true
  }

  if(!user.daily){
   user.daily = {
    streak:0,
    lastDaily:0
   }
   changed = true
  }

 }

 if(changed){

  console.log("Migration des utilisateurs effectuée.")
  save()

 }

}

/* LANCEMENT MIGRATIONS */

migrateInventories()
migratePacks()
migrateUsers()

/* ---------------- USER MANAGEMENT ---------------- */

function getUser(id){

 if(!users[id]){

  users[id] = {
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
    packsOpened:0,
    packsBought:0
   },
   daily:{
    streak:0,
    lastDaily:0
   }
  }

  save()

 }

 return users[id]

}

function getUsers(){
 return users
}

module.exports = {
 getUser,
 getUsers,
 save
}