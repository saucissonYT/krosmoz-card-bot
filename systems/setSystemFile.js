const { data, save } = require("./dataManager")

function loadSets(){

 const sets = data.sets || []

 if(Array.isArray(sets))
  return sets

 if(sets.sets)
  return sets.sets

 return []

}

function saveSets(list){

 data.sets = list
 save()

}

function addSet(name,reward){

 const sets = loadSets()

 const id = name.toLowerCase().replace(/\s+/g,"")

 if(sets.find(s=>s.id===id))
  return {error:"Set déjà existant"}

 const newSet = {
  id,
  name,
  reward
 }

 sets.push(newSet)

 saveSets(sets)

 return newSet

}

function deleteSet(id){

 const sets = loadSets()

 const index = sets.findIndex(s=>s.id===id)

 if(index === -1)
  return {error:"Set introuvable"}

 const removed = sets.splice(index,1)[0]

 saveSets(sets)

 return removed

}

function editSetName(id,newName){

 const sets = loadSets()

 const set = sets.find(s=>s.id===id)

 if(!set)
  return {error:"Set introuvable"}

 set.name = newName

 saveSets(sets)

 return set

}

function editSetReward(id,reward){

 const sets = loadSets()

 const set = sets.find(s=>s.id===id)

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