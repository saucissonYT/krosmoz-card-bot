const fs = require("fs")
const path = require("path")

const { data, save } = require("./dataManager")
const { sortSetsByDisplayOrder } = require("./setOrder")

/*
 * FIX: data.sets n'est jamais initialisé dans dataManager.loadAll().
 * On charge depuis cards/sets.json si data.sets est vide/undefined.
 */

const SETS_PATH = path.join(__dirname, "../cards/sets.json")

function loadSets(){

 /* Si data.sets est déjà chargé et valide, on l'utilise */
 if(data.sets && Array.isArray(data.sets) && data.sets.length > 0){
  data.sets = sortSetsByDisplayOrder(data.sets)
  return data.sets
 }

 /* Sinon, on charge depuis cards/sets.json */
 try{

  if(!fs.existsSync(SETS_PATH)){
   console.error("sets.json introuvable :", SETS_PATH)
   return []
  }

  const raw = fs.readFileSync(SETS_PATH, "utf8")
  const parsed = JSON.parse(raw)

  /* Support des deux formats : tableau direct ou { sets: [...] } */
  if(Array.isArray(parsed)){
   data.sets = parsed
  } else if(parsed.sets && Array.isArray(parsed.sets)){
   data.sets = parsed.sets
  } else {
   data.sets = []
  }

  data.sets = sortSetsByDisplayOrder(data.sets)
  return data.sets

 }catch(err){

  console.error("Erreur lecture sets.json :", err)
  return []

 }

}

function saveSets(list){

 data.sets = sortSetsByDisplayOrder(list)

 /* Sauvegarder aussi dans le fichier sets.json source */
 try{
  fs.writeFileSync(SETS_PATH, JSON.stringify(data.sets, null, 2))
 }catch(err){
  console.error("Erreur sauvegarde sets.json :", err)
 }

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
 saveSets,
 addSet,
 deleteSet,
 editSetName,
 editSetReward
}
