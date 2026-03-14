const fs = require("fs")
const path = require("path")

/* TON ID DISCORD ROOT */
const ROOT_OWNER = "231419667179241472"

const PATH = process.env.RAILWAY
 ? "/data/devs.json"
 : "./database/devs.json"

const DIR = path.dirname(PATH)

if(!fs.existsSync(DIR)){
 fs.mkdirSync(DIR,{recursive:true})
}

let devs = {}

try{

 if(fs.existsSync(PATH)){

  devs = JSON.parse(fs.readFileSync(PATH,"utf8"))

 }else{

  devs = {
   owners:[ROOT_OWNER],
   devs:[]
  }

  fs.writeFileSync(PATH,JSON.stringify(devs,null,2))

 }

}catch(err){

 console.error("Erreur lecture devs.json",err)

 devs = {
  owners:[ROOT_OWNER],
  devs:[]
 }

}

/* -------- SAVE -------- */

function save(){

 fs.writeFileSync(
  PATH,
  JSON.stringify(devs,null,2)
 )

}

/* -------- PERMISSIONS -------- */

function isOwner(id){

 return id===ROOT_OWNER || devs.owners.includes(id)

}

function isDev(id){

 return id===ROOT_OWNER || devs.devs.includes(id) || isOwner(id)

}

/* -------- TOGGLE DEV -------- */

function toggleDev(id){

 if(devs.devs.includes(id)){

  devs.devs = devs.devs.filter(d=>d!==id)
  save()

  return false

 }else{

  devs.devs.push(id)
  save()

  return true

 }

}

module.exports = {
 isOwner,
 isDev,
 toggleDev
}