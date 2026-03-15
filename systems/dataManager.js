const fs = require("fs")
const path = require("path")

/* ---------------- BASE PATH ---------------- */

let BASE = "/data"

if(!fs.existsSync(BASE)){
 BASE = path.join(process.cwd(),"data")
}

if(!fs.existsSync(BASE)){
 fs.mkdirSync(BASE,{recursive:true})
}

console.log("Data path :",BASE)

/* ---------------- DIRECTORIES ---------------- */

const USERS_DIR = path.join(BASE,"users")

if(!fs.existsSync(USERS_DIR)){
 fs.mkdirSync(USERS_DIR,{recursive:true})
}

/* ---------------- FILE PATHS ---------------- */

const paths = {
 users: path.join(BASE,"users.json"), // legacy migration
 market: path.join(BASE,"market.json"),
 marketHistory: path.join(BASE,"marketHistory.json"),
 devs: path.join(BASE,"devs.json"),
 cards: path.join(BASE,"cards.json")
}

/* ---------------- DATA CACHE ---------------- */

const data = {
 users:{}, // cache
 market:[],
 marketHistory:[],
 devs:{ owners:[], devs:[] },
 cards:[]
}

/* ---------------- LOAD FILE ---------------- */

function loadFile(file,defaultValue){

 if(!fs.existsSync(file)){
  fs.writeFileSync(file,JSON.stringify(defaultValue,null,2))
  return JSON.parse(JSON.stringify(defaultValue))
 }

 try{

  const raw = fs.readFileSync(file,"utf8")

  if(!raw || raw.trim()==="")
   return JSON.parse(JSON.stringify(defaultValue))

  return JSON.parse(raw)

 }catch(err){

  console.error("Erreur lecture :",file,err)
  return JSON.parse(JSON.stringify(defaultValue))

 }

}

/* ---------------- USER FILE ---------------- */

function getUserFile(id){
 return path.join(USERS_DIR,`${id}.json`)
}

function loadUser(id){

 if(data.users[id])
  return data.users[id]

 const file = getUserFile(id)

 if(!fs.existsSync(file))
  return null

 try{

  const raw = fs.readFileSync(file,"utf8")

  const user = JSON.parse(raw)

  user._dirty = false

  data.users[id] = user

  return user

 }catch(err){

  console.error("Erreur lecture user :",id,err)
  return null

 }

}

function saveUser(id){

 const user = data.users[id]

 if(!user || !user._dirty)
  return

 const file = getUserFile(id)

 const clone = JSON.parse(JSON.stringify(user))

 delete clone._dirty

 fs.writeFileSync(file,JSON.stringify(clone,null,2))

 user._dirty = false

}

/* ---------------- MIGRATION USERS.JSON ---------------- */

function migrateUsersJson(){

 if(!fs.existsSync(paths.users))
  return

 console.log("Migration users.json → users/")

 const legacy = loadFile(paths.users,{})

 for(const id in legacy){

  const file = getUserFile(id)

  if(!fs.existsSync(file)){

   fs.writeFileSync(
    file,
    JSON.stringify(legacy[id],null,2)
   )

  }

 }

 fs.renameSync(paths.users, paths.users + ".migrated")

 console.log("Migration terminée")

}

/* ---------------- LOAD ALL ---------------- */

function loadAll(){

 migrateUsersJson()

 data.market = loadFile(paths.market,[])
 data.marketHistory = loadFile(paths.marketHistory,[])
 data.devs = loadFile(paths.devs,{owners:[],devs:[]})
 data.cards = loadFile(paths.cards,[])

 console.log("DataManager chargé")

}

/* ---------------- SAVE STATIC DATA ---------------- */

function save(){

 try{

  fs.writeFileSync(paths.market,JSON.stringify(data.market,null,2))
  fs.writeFileSync(paths.marketHistory,JSON.stringify(data.marketHistory,null,2))
  fs.writeFileSync(paths.devs,JSON.stringify(data.devs,null,2))
  fs.writeFileSync(paths.cards,JSON.stringify(data.cards,null,2))

 }catch(err){

  console.error("Erreur sauvegarde DataManager",err)

 }

}

/* ---------------- AUTOSAVE DIRTY USERS ---------------- */

setInterval(()=>{

 for(const id in data.users){

  const user = data.users[id]

  if(user._dirty)
   saveUser(id)

 }

 save()

},30000)

/* ---------------- EXPORT ---------------- */

module.exports = {
 data,
 loadAll,
 save,
 loadUser,
 saveUser,
 USERS_DIR
}