const fs = require("fs")

let devs = require("../database/devs.json")

function save(){

 fs.writeFileSync(
  "./database/devs.json",
  JSON.stringify(devs,null,2)
 )

}

function isOwner(id){

 return devs.owners.includes(id)

}

function isDev(id){

 return devs.devs.includes(id) || isOwner(id)

}

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