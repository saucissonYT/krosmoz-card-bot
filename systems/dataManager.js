const fs = require("fs")
const path = require("path")

/* ---------------- BASE PATH ---------------- */

const BASE = process.env.RAILWAY ? "/data" : "./database"

if(!fs.existsSync(BASE)){
 fs.mkdirSync(BASE,{recursive:true})
}

/* ---------------- FILE PATHS ---------------- */

const paths = {
 users: path.join(BASE,"users.json"),
 market: path.join(BASE,"market.json"),
 devs: path.join(BASE,"devs.json")
}

/* ---------------- DATA CACHE ---------------- */

const data = {
 users:{},
 market:[],
 devs:{ owners:[], devs:[] }
}

/* ---------------- LOAD FILE ---------------- */

function loadFile(file,defaultValue){

 if(!fs.existsSync(file)){

  fs.writeFileSync(file,JSON.stringify(defaultValue,null,2))
  return JSON.parse(JSON.stringify(defaultValue))

 }

 try{

  const raw = fs.readFileSync(file,"utf8")

  if(!raw) return defaultValue

  return JSON.parse(raw)

 }catch(err){

  console.error("Erreur lecture :",file,err)
  return JSON.parse(JSON.stringify(defaultValue))

 }

}

/* ---------------- LOAD ALL ---------------- */

function loadAll(){

 data.users = loadFile(paths.users,{})
 data.market = loadFile(paths.market,[])
 data.devs = loadFile(paths.devs,{owners:[],devs:[]})

 console.log("DataManager chargé")

}

/* ---------------- SAVE ---------------- */

function save(){

 try{

  fs.writeFileSync(paths.users,JSON.stringify(data.users,null,2))
  fs.writeFileSync(paths.market,JSON.stringify(data.market,null,2))
  fs.writeFileSync(paths.devs,JSON.stringify(data.devs,null,2))

 }catch(err){

  console.error("Erreur sauvegarde DataManager",err)

 }

}

/* ---------------- AUTOSAVE ---------------- */

setInterval(save,30000)

/* ---------------- EXPORT ---------------- */

module.exports = {
 data,
 loadAll,
 save,
 paths
}