const fs = require("fs")
const path = require("path")

const { USERS_DIR } = require("./dataManager")
const { getUser } = require("./userSystem")
const { getCardsById } = require("./cardRegistry")

let cache = null
let lastBuild = 0

const CACHE_TIME = 30000

function buildLeaderboard(){

 const cardsById = getCardsById()

 const boards={
  collection:[],
  wealth:[],
  ssr:[],
  packs:[],
  achievements:[],
  level:[],
  guilds:[]
 }

 /*
  * FIX: On scanne TOUS les fichiers users sur disque,
  * pas seulement ceux chargés en mémoire.
  * Avant, les joueurs inactifs (non chargés depuis le restart)
  * n'apparaissaient pas dans le leaderboard.
  */

 let userIds = []

 try{

  if(fs.existsSync(USERS_DIR)){
   userIds = fs.readdirSync(USERS_DIR)
    .filter(f => f.endsWith(".json"))
    .map(f => f.replace(".json",""))
  }

 }catch(err){
  console.error("Erreur lecture users dir pour leaderboard:",err)
 }

 for(const id of userIds){

  let u

  try{
   u = getUser(id)
  }catch(err){
   console.error("Erreur chargement user leaderboard:",id,err)
   continue
  }

  if(!u) continue

  /* ---- COLLECTION ---- */

  const cards = Object.values(u.cards || {})
   .reduce((a,b)=>a+b,0)

  /* ---- SSR COUNT ---- */

  let ssr = 0

  for(const [cardId, count] of Object.entries(u.cards || {})){
   const card = cardsById[String(cardId)]
   if(card && card.rarity === "SSR"){
    ssr += count
   }
  }

  /* ---- PUSH ---- */

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

 /* ---- GUILDES ---- */

 try{

  const { getAllGuilds } = require("./guildSystem")
  const guilds = getAllGuilds()

  boards.guilds = guilds.map(g => ({
   id: g.id,
   name: g.name,
   emoji: g.emoji,
   value: g.level,
   xp: g.xp,
   members: g.memberIds.length,
   leaderId: g.leaderId,
   isGuild: true
  }))

 }catch(err){
  /* guildSystem pas encore chargé, on skip */
  boards.guilds = []
 }

 /* ---- TRI DESCENDANT ---- */

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