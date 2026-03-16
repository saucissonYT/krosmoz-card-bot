const { getUsers } = require("./userSystem")
const { getCards } = require("./cardRegistry")

let cache = null
let lastBuild = 0

const CACHE_TIME = 30000 // 30s

function build(){

 const users = getUsers()
 const cards = getCards()

 const ssrIds = cards
  .filter(c=>c.rarity==="SSR")
  .map(c=>Number(c.id))

 const rankings={
  collection:[],
  wealth:[],
  ssr:[],
  packs:[],
  achievements:[],
  level:[]
 }

 for(const id in users){

  const user = users[id]

  let uniqueCards=0
  let ssrCount=0

  if(user.cards){

   for(const cid in user.cards){

    if(user.cards[cid]>0)
     uniqueCards++

    if(ssrIds.includes(Number(cid)))
     ssrCount+=user.cards[cid]

   }

  }

  rankings.collection.push({id:String(id),value:uniqueCards})
  rankings.wealth.push({id:String(id),value:user.kamas||0})
  rankings.ssr.push({id:String(id),value:ssrCount})
  rankings.packs.push({id:String(id),value:user.stats?.packsOpened||0})
  rankings.achievements.push({id:String(id),value:user.achievements?.length||0})
  rankings.level.push({id:String(id),value:user.progression?.level||1})

 }

 for(const key in rankings)
  rankings[key].sort((a,b)=>b.value-a.value)

 cache = rankings
 lastBuild = Date.now()
}

function getLeaderboard(){

 if(!cache || Date.now()-lastBuild > CACHE_TIME)
  build()

 return cache
}

module.exports={
 getLeaderboard
}