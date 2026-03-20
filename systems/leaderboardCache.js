const { getUsers } = require("./userSystem")
const { getCardsById } = require("./cardRegistry")

let cache = null
let lastBuild = 0

const CACHE_TIME = 30000

function buildLeaderboard(){

 const users = getUsers()
 const cardsById = getCardsById()

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

  // Fix : on récupère la rareté via le registre, pas via l'ID
  let ssr = 0

  for(const [cardId, count] of Object.entries(u.cards || {})){
   const card = cardsById[String(cardId)]
   if(card && card.rarity === "SSR"){
    ssr += count
   }
  }

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