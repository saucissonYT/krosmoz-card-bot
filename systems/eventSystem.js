let currentEvent = null
let timeout = null
let midTimeout = null

const EVENTS = require("./eventRegistry")

function randomTickets(){
 return Math.floor(Math.random()*4)+2 // 2 → 5
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

 const tickets = randomTickets()

 currentEvent = {
  key,
  ...event,
  tickets,
  endTime: Date.now() + (15 * 60000)
 }

 /* START MESSAGE */

 if(channel){
  channel.send(
`🎰 **${event.name}**

${event.start}

🎟️ Chaque joueur reçoit **${tickets} tickets**
👉 Utilisez \`/eventpack\``
  )
 }

 /* MID MESSAGE */

 midTimeout = setTimeout(()=>{
  if(channel && currentEvent){
   channel.send(
`⏳ **${event.name} en cours**

${event.mid}

🎟️ Il vous reste des tickets !
👉 \`/eventpack\``
   )
  }
 }, (15 * 60000) / 2)

 /* END MESSAGE */

 timeout = setTimeout(()=>{

  if(channel && currentEvent){
   channel.send(
`📊 **${event.name} terminé**

${event.end}`
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
  channel.send(currentEvent.end)
 }

 currentEvent = null
}

/* ---------------- GET EVENT ---------------- */

function getEvent(){
 return currentEvent
}

/* ---------------- CHECK ---------------- */

function isEventActive(){
 return currentEvent !== null
}

/* ---------------- USER INIT ---------------- */

function initUserEvent(user){

 const event = getEvent()
 if(!event) return

 if(!user.event || user.event.id !== event.key){

  user.event = {
   id:event.key,
   tickets:event.tickets,
   used:0
  }

 }

}

/* ---------------- CAN USE ---------------- */

function canUseEventPack(user){

 const event = getEvent()

 if(!event) return {ok:false,error:"Aucun event actif"}

 if(!user.event || user.event.id !== event.key)
  return {ok:false,error:"Pas de tickets"}

 if(user.event.used >= user.event.tickets)
  return {ok:false,error:"Plus de tickets"}

 return {ok:true}
}

module.exports = {
 startEvent,
 stopEvent,
 getEvent,
 isEventActive,
 initUserEvent,
 canUseEventPack
}