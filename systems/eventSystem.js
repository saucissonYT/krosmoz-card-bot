let currentEvent = null
let timeout = null
let midTimeout = null

const EVENTS = require("./eventRegistry")
const { getCards } = require("./cardRegistry")

function randomTickets(){
 return Math.floor(Math.random()*2)+2 // 2 → 3
}

function pickRandomEvent(){
 const keys = Object.keys(EVENTS)
 return keys[Math.floor(Math.random()*keys.length)]
}

/* ---------------- START EVENT ---------------- */

function startEvent(channel, forced=null){

 if(timeout) clearTimeout(timeout)
 if(midTimeout) clearTimeout(midTimeout)

 const key = forced || pickRandomEvent()
 const event = EVENTS[key]

 if(!event){
  console.error("❌ Event introuvable :", key)
  return
 }

 const tickets = randomTickets()

 let data = {}

 /* ---------- TARGET (CRA) ---------- */

 if(event.needsTarget){
  const sCards = getCards().filter(c=>c.rarity==="S")
  const target = sCards[Math.floor(Math.random()*sCards.length)]

  if(target){
   data.targetId = target.id
   data.targetName = target.name
  }
 }

 /* ---------- CREATE EVENT ---------- */

 currentEvent = {
  key, // 🔥 source unique
  name: event.name,
  start: event.start,
  mid: event.mid,
  end: event.end,
  needsTarget: event.needsTarget,
  allowMultiSSR: event.allowMultiSSR || false,
  tickets,
  data,
  stats:{
   packs:0,
   ssr:0,
   totalCards:0
  },
  endTime: Date.now() + (15 * 60000)
 }

 /* ---------- START MESSAGE ---------- */

 if(channel){
  channel.send(
`🎰 **${event.name}**

${event.start}

${event.needsTarget && data.targetName ? `🎯 Cible : **${data.targetName}**\n` : ""}

🎟️ Chaque joueur reçoit **${tickets} tickets**
👉 Utilisez \`/eventpack\``
  )
 }

 /* ---------- MID ---------- */

 midTimeout = setTimeout(()=>{
  if(channel && currentEvent){
   channel.send(
`⏳ **${currentEvent.name} en cours**

${currentEvent.mid}

🎟️ Il vous reste des tickets !`
   )
  }
 }, (15 * 60000)/2)

 /* ---------- END ---------- */

 timeout = setTimeout(()=>{
  if(channel && currentEvent){
   channel.send(
`📊 **${currentEvent.name} terminé**

${currentEvent.end}

📦 Packs ouverts : **${currentEvent.stats.packs}**
🌈 SSR obtenues : **${currentEvent.stats.ssr}**
🎴 Cartes obtenues : **${currentEvent.stats.totalCards}**`
   )
  }

  currentEvent = null

 }, 15 * 60000)
}

/* ---------------- STOP EVENT ---------------- */

function stopEvent(channel){

 if(timeout) clearTimeout(timeout)
 if(midTimeout) clearTimeout(midTimeout)

 if(currentEvent && channel){
  channel.send(currentEvent.end || "Event terminé.")
 }

 currentEvent = null
}

/* ---------------- GETTERS ---------------- */

function getEvent(){
 return currentEvent
}

function isEventActive(){
 return currentEvent !== null
}

/* ---------------- USER INIT ---------------- */

function initUserEvent(user){

 const event = getEvent()
 if(!event) return

 // 🔥 RESET SI EVENT DIFFÉRENT OU CORRUPT
 if(
  !user.event ||
  user.event.id !== event.key ||
  user.event.tickets === undefined
 ){
  user.event = {
   id: event.key,
   tickets: event.tickets,
   used: 0
  }
 }
}

/* ---------------- CAN USE ---------------- */

function canUseEventPack(user){

 const event = getEvent()

 if(!event)
  return {ok:false,error:"Aucun event actif"}

 if(!user.event)
  return {ok:false,error:"Pas de tickets"}

 if(user.event.id !== event.key)
  return {ok:false,error:"Tickets expirés"}

 if(user.event.used >= user.event.tickets)
  return {ok:false,error:"Plus de tickets"}

 return {ok:true}
}

/* ---------------- EVENT STATS ---------------- */

function registerEventPack(pack){

 if(!currentEvent || !Array.isArray(pack)) return

 currentEvent.stats.packs++
 currentEvent.stats.totalCards += pack.length

 for(const c of pack){
  if(c?.rarity === "SSR"){
   currentEvent.stats.ssr++
  }
 }

}

/* ---------------- EXPORT ---------------- */

module.exports = {
 startEvent,
 stopEvent,
 getEvent,
 isEventActive,
 initUserEvent,
 canUseEventPack,
 registerEventPack
}