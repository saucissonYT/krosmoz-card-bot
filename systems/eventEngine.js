let currentEvent = null
let timeout = null
let midTimeout = null

function randomTickets(){
 return Math.floor(Math.random()*4)+2
}

/* 🎭 MESSAGES */

const eventMessages = {

 CRA:{
  start:(data)=>`🎯 Une cible est désignée !
La carte **${data?.targetName || "inconnue"}** est traquée (20% drop)`,
  mid:"🏹 La chasse continue... ne relâchez pas vos efforts !"
 },

 XELOR:{
  start:"⏳ Le temps se fracture...\nLe destin peut être réécrit.",
  mid:"⌛ Les failles temporelles persistent..."
 },

 ENUTROF:{
  start:"💰 Enutrof est d'humeur généreuse...\nLes richesses affluent.",
  mid:"🪙 Le trésor n'est pas encore épuisé..."
 },

 FECA:{
  start:"🛡️ Féca vous protège...\nL'expérience est amplifiée.",
  mid:"🛡️ Le bouclier tient toujours..."
 }

}

/* 🚀 START */

function startEvent(event, channel){

 if(timeout) clearTimeout(timeout)
 if(midTimeout) clearTimeout(midTimeout)

 /* 🎯 DATA EVENT (CRA target) */

 if(event.id === "CRA"){
  const cards = require("./cardRegistry").getCards()
  const sCards = cards.filter(c=>c.rarity==="S")

  const target = sCards[Math.floor(Math.random()*sCards.length)]

  event.data = {
   targetId: target?.id,
   targetName: target?.name
  }
 }

 const msg = eventMessages[event.id]

 currentEvent = {
  ...event,
  startTime: Date.now(),
  endTime: Date.now()+event.duration,
  stats:{
   packsOpened:0,
   ssr:0,
   ur:0,
   totalCards:0
  }
 }

 if(channel){

  const startMsg = msg?.start
   ? (typeof msg.start === "function" ? msg.start(event.data) : msg.start)
   : `🎰 ${event.name} démarre !`

  channel.send(
`🎰 **${event.name}**

${startMsg}

🎟️ Vous avez reçu entre **2 et 5 tickets**
👉 \`/eventpack\` pour ouvrir vos packs`
  )
 }

 midTimeout = setTimeout(()=>{
  if(currentEvent && channel){
   channel.send(
`⏳ **${event.name} en cours**

${msg?.mid || "L'event continue..."}

👉 \`/eventpack\` !`
   )
  }
 }, event.duration/2)

 timeout = setTimeout(()=>{
  stopEvent(channel)
 }, event.duration)

}

/* 🛑 STOP */

function stopEvent(channel){

 if(!currentEvent) return

 const s = currentEvent.stats

 if(channel){
  channel.send(
`📊 **Event terminé : ${currentEvent.name}**

📦 Packs : ${s.packsOpened}
🌈 SSR : ${s.ssr}
🟡 UR : ${s.ur}
🎴 Cartes : ${s.totalCards}`
  )
 }

 currentEvent = null
}

/* 📌 */

function getEvent(){ return currentEvent }

/* 🎟️ */

function initUserEvent(user){

 const event = getEvent()
 if(!event) return

 if(!user.event || user.event.id !== event.id){
  user.event = {
   id:event.id,
   tickets:randomTickets(),
   used:0
  }
 }

}

/* 🔒 */

function canUseEventPack(user){

 const event = getEvent()

 if(!event) return {ok:false,error:"Aucun event actif"}
 if(!user.event || user.event.id !== event.id)
  return {ok:false,error:"Pas de tickets"}
 if(user.event.used >= user.event.tickets)
  return {ok:false,error:"Plus de tickets"}

 return {ok:true}
}

/* 📊 */

function registerPackStats(pack){

 if(!currentEvent) return

 currentEvent.stats.packsOpened++
 currentEvent.stats.totalCards += pack.length

 for(const c of pack){
  if(c.rarity==="SSR") currentEvent.stats.ssr++
  if(c.rarity==="UR") currentEvent.stats.ur++
 }

}

module.exports = {
 startEvent,
 stopEvent,
 getEvent,
 initUserEvent,
 canUseEventPack,
 registerPackStats
}