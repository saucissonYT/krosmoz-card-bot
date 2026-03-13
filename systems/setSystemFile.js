const fs = require("fs")

const SETS_PATH = "./cards/sets.json"

function loadSets(){

 return JSON.parse(
  fs.readFileSync(SETS_PATH,"utf8")
 )

}

function saveSets(data){

 fs.writeFileSync(
  SETS_PATH,
  JSON.stringify(data,null,2)
 )

}

function addSet(name,reward){

 const sets = loadSets()

 const id = name.toLowerCase().replace(/\s+/g,"")

 if(sets.sets.find(s=>s.id===id))
  return {error:"Set déjà existant"}

 const newSet = {
  id,
  name,
  reward
 }

 sets.sets.push(newSet)

 saveSets(sets)

 return newSet

}

function deleteSet(id){

 const sets = loadSets()

 const index = sets.sets.findIndex(s=>s.id===id)

 if(index === -1)
  return {error:"Set introuvable"}

 const removed = sets.sets.splice(index,1)[0]

 saveSets(sets)

 return removed

}

function editSetName(id,newName){

 const sets = loadSets()

 const set = sets.sets.find(s=>s.id===id)

 if(!set)
  return {error:"Set introuvable"}

 set.name = newName

 saveSets(sets)

 return set

}

function editSetReward(id,reward){

 const sets = loadSets()

 const set = sets.sets.find(s=>s.id===id)

 if(!set)
  return {error:"Set introuvable"}

 set.reward = reward

 saveSets(sets)

 return set

}

module.exports = {
 loadSets,
 addSet,
 deleteSet,
 editSetName,
 editSetReward
}
