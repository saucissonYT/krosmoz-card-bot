const { getUsers } = require("./userSystem")

let cache = null
let lastBuild = 0

const CACHE_TIME = 30000

function buildLeaderboard(){

 const users = getUsers()

 const boards={
  collection:[],
  wealth:[],
  ssr:[],
  packs:[],
  achievements:[],
  level:[]
 }

 for(const id in users){

  const u = users[id]

  if(!u) continue

  const cards = Object.values(u.cards || {})
   .reduce((a,b)=>a+b,0)

  const ssr = Object.entries(u.cards || {})
   .filter(([id,count])=>{
    const rarity = id.toString().startsWith("SSR")
    return rarity
   })
   .reduce((a,[,count])=>a+count,0)

  boards.collection.push({
   id,
   value:cards
  })

  boards.wealth.push({
   id,
   value:u.kamas || 0
  })

  boards.ssr.push({
   id,
   value:ssr
  })

  boards.packs.push({
   id,
   value:u.stats?.packsOpened || 0
  })

  boards.achievements.push({
   id,
   value:(u.achievements || []).length
  })

  boards.level.push({
   id,
   value:u.progression?.level || 0
  })

 }

 for(const key in boards){

  boards[key].sort((a,b)=>b.value-a.value)

 }

 cache = boards
 lastBuild = Date.now()

}

function getLeaderboard(){

 const now = Date.now()

 if(!cache || now-lastBuild > CACHE_TIME)
  buildLeaderboard()

 return cache

}

module.exports={
 getLeaderboard
}