let currentEvent = null
let timeout = null
let midTimeout = null

const EVENTS = require("./eventRegistry")
const { getCards } = require("./cardRegistry")

function randomTickets(){
 return Math.floor(Math.random()*2)+2
}

function pickRandomEvent(){
 const keys = Object.keys(EVENTS)
 return keys[Math.floor(Math.random()*keys.length)]
}

/* ---------------- END EVENT ---------------- */

function endEvent(channel){

 if(!currentEvent) return

 if(channel){
  channel.send(
`# ⚡ **${currentEvent.name.toUpperCase()} — TERMINÉ**

${currentEvent.end}

━━━━━━━━━━━━━━━━━━━━━━━
📦 **Packs ouverts :** **${currentEvent.stats.packs}**
🌈 **SSR obtenues :** **${currentEvent.stats.ssr}**
🎴 **Cartes obtenues :** **${currentEvent.stats.totalCards}**
━━━━━━━━━━━━━━━━━━━━━━━`
  )
 }

 console.log("🏁 EVENT END:", currentEvent.key, currentEvent.stats)

 try { require("../web/Server").pushActivity({ kind: "event_end", eventName: currentEvent.name }) } catch(_) {}

 currentEvent = null
}

/* ---------------- START EVENT ---------------- */

function startEvent(channel, forced=null){

 if(currentEvent && !forced){
  console.log("⚠️ Event déjà actif, lancement ignoré")
  return false
 }

 if(timeout) clearTimeout(timeout)
 if(midTimeout) clearTimeout(midTimeout)

 const key = forced || pickRandomEvent()
 const event = EVENTS[key]

 if(!event){
  console.error("❌ Event introuvable :", key)
  return false
 }

 const tickets = randomTickets()

 const data = {}

 if(event.needsTarget){
  const sCards = getCards().filter(c=>c.rarity==="S")
  const target = sCards[Math.floor(Math.random()*sCards.length)]

  if(target){
   data.targetId = target.id
   data.targetName = target.name
  }
 }

 currentEvent = {
  key,
  uid: Date.now(),
  name: event.name,
  start: event.start,
  mid: event.mid,
  end: event.end,
  needsTarget: event.needsTarget,
  allowMultiSSR: event.allowMultiSSR || false,
  tickets,
  data,
  voiceLines: event.voiceLines,
  firstPackTaken: false,
  stats:{
   packs:0,
   ssr:0,
   totalCards:0
  },
  endTime: Date.now() + (15 * 60000)
 }

 console.log("🎰 EVENT START:", key, "| Tickets:", tickets)

 try { require("../web/Server").pushActivity({ kind: "event_start", eventName: event.name }) } catch(_) {}

 if(channel){
  channel.send(
`# 🎰 **${event.name.toUpperCase()}**

${event.start}

${event.needsTarget && data.targetName ?
`> 🎯 **Cible : ${data.targetName}**\n` : ""}
━━━━━━━━━━━━━━━━━━━━━━━
🎟️ Chaque joueur reçoit **${tickets} tickets**
👉 Utilisez \`/eventpack\`
━━━━━━━━━━━━━━━━━━━━━━━`
  )
 }

 /* ---------- MID ---------- */

 midTimeout = setTimeout(()=>{
  if(channel && currentEvent){
   channel.send(
`## ⏳ **${currentEvent.name} — TOUJOURS EN COURS**

${currentEvent.mid}

> 🎟️ **Il vous reste des tickets !**`
   )
  }
 }, (15 * 60000)/2)

 /* ---------- END ---------- */

 timeout = setTimeout(()=>{
  endEvent(channel)
 }, 15 * 60000)

 return true
}

/* ---------------- STOP ---------------- */

function stopEvent(channel){

 if(timeout) clearTimeout(timeout)
 if(midTimeout) clearTimeout(midTimeout)

 endEvent(channel)

 console.log("🛑 EVENT STOP:", currentEvent?.key)
}

/* ---------------- GETTERS ---------------- */

function getEvent(){ return currentEvent }
function isEventActive(){ return currentEvent !== null }

/* ---------------- USER INIT ---------------- */

function initUserEvent(user){

 const event = getEvent()
 if(!event) return

 if(
  !user.event ||
  user.event.uid !== event.uid
 ){
  user.event = {
   id: event.key,
   uid: event.uid,
   tickets: event.tickets,
   used: 0,
   startTime: Date.now()
  }
 }
}

/* ---------------- CAN USE ---------------- */

function canUseEventPack(user){

 const event = getEvent()

 if(!event) return {ok:false,error:"Aucun event actif"}
 if(!user.event) return {ok:false,error:"Pas de tickets"}
 if(user.event.uid !== event.uid) return {ok:false,error:"Tickets expirés"}
 if(user.event.used >= user.event.tickets) return {ok:false,error:"Plus de tickets"}

 return {ok:true}
}

/* ---------------- STATS ---------------- */

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

/* ---------------- FIRST PACK FLAG ---------------- */

function claimFirstPack(){
 if(!currentEvent) return false
 if(currentEvent.firstPackTaken) return false
 currentEvent.firstPackTaken = true
 return true
}

/* ---------------- EXPORT ---------------- */

module.exports = {
 startEvent,
 stopEvent,
 getEvent,
 isEventActive,
 initUserEvent,
 canUseEventPack,
 registerEventPack,
 claimFirstPack
}