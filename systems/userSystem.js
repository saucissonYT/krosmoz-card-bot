const fs = require("fs")

const PATH = process.env.RAILWAY
 ? "/data/users.json"
 : "./database/users.json"

let users = {}

/* ---------------- LOAD USERS ---------------- */

try{

 if(fs.existsSync(PATH)){

  const raw = fs.readFileSync(PATH,"utf8")

  users = raw ? JSON.parse(raw) : {}

 }else{

  console.log("users.json absent, création")

  fs.writeFileSync(PATH,JSON.stringify({},null,2))
  users = {}

 }

}catch(err){

 console.error("Erreur lecture users.json",err)

 users = {}

}

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

  fs.writeFileSync(PATH,JSON.stringify(users,null,2))

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

  fs.writeFileSync(PATH,JSON.stringify(users,null,2))

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

  fs.writeFileSync(PATH,JSON.stringify(users,null,2))

 }

}

/* LANCEMENT MIGRATIONS */

migrateInventories()
migratePacks()
migrateUsers()

/* ---------------- SAVE QUEUE ---------------- */

let saveQueue = []
let saving = false

function processQueue(){

 if(saving) return
 if(saveQueue.length === 0) return

 saving = true

 const data = saveQueue.shift()

 fs.writeFile(
  PATH,
  JSON.stringify(data,null,2),
  (err)=>{

   if(err)
    console.error("Save error:",err)

   saving = false
   processQueue()

  }
 )

}

function queueSave(){

 saveQueue.push(JSON.parse(JSON.stringify(users)))
 processQueue()

}

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

  queueSave()

 }

 return users[id]

}

function getUsers(){
 return users
}

/* ---------------- SAVE ---------------- */

function save(){
 queueSave()
}

/* ---------------- EXPORT ---------------- */

module.exports = {
 getUser,
 getUsers,
 save
}