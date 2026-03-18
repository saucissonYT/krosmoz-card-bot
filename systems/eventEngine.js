let currentEvent = null
let timeout = null
let midTimeout = null

function randomTickets(){
 return Math.floor(Math.random()*4)+2
}

/* 🎭 DESCRIPTIONS EVENTS */

const eventDescriptions = {

 CRA:(data)=>`🎯 Carte ciblée : **${data?.targetName || "?"}**
→ 20% de chance de la drop dans chaque slot`,

 XELOR:`⏳ 33% de chance de relancer complètement le pack`,

 SRAM:`🕶️ Pack caché + 1 carte bonus`,

 IOP:`🔥 Chance d'obtenir une carte UR/S supplémentaire`,

 SACRIEUR:`💀 25% de chance que chaque carte se transforme aléatoirement`,

 ZOBAL:`🎭 Une carte du pack est améliorée d'une rareté`,

 HUPPERMAGE:`🧠 50% de chance d'obtenir une carte bonus`,

 PANDAWA:`🍺 Duplication possible d'une carte du pack`,

 OSAMODAS:`🐉 Pack composé de copies d'une même carte`,

 ECAFLIP:`🎲 Soit un pack nul, soit un pack très puissant`,

 OUGINAK:`🐺 RNG fortement défavorable (majorité C/U)`,

 FECA:`🛡️ Minimum R garanti + bonus XP
🎰 Jackpot XP possible (1% / 0.1%)`,

 ENUTROF:`💰 Bonus kamas
🎰 Jackpot possible (1% / 0.1%)`,

 ROUBLARD:`💣 Packs de 7 cartes au lieu de 5`,

 STEAMER:`⚙️ RNG totalement chaotique`,

 ELIOTROPE:`🌀 Deux packs générés, un seul conservé`,

 ENIRIPSA:`✨ Aucune carte C/U (minimum R)`,

 SADIDA:`🌿 30% de dupliquer une carte (max 2 fois)`,

 FORGELANCE:`⚔️ 30% de chance d'améliorer chaque carte`
}

/* 🚀 START */

function startEvent(event, channel){

 if(timeout) clearTimeout(timeout)
 if(midTimeout) clearTimeout(midTimeout)

 /* 🎯 DATA (CRA) */

 if(event.id === "CRA"){
  const cards = require("./cardRegistry").getCards()
  const sCards = cards.filter(c=>c.rarity==="S")

  const target = sCards[Math.floor(Math.random()*sCards.length)]

  event.data = {
   targetId: target?.id,
   targetName: target?.name
  }
 }

 const tickets = randomTickets()

 currentEvent = {
  ...event,
  tickets, // IMPORTANT
  startTime: Date.now(),
  endTime: Date.now()+event.duration,
  stats:{
   packsOpened:0,
   ssr:0,
   ur:0,
   totalCards:0
  }
 }

 const desc = eventDescriptions[event.id]
  ? (typeof eventDescriptions[event.id] === "function"
     ? eventDescriptions[event.id](event.data)
     : eventDescriptions[event.id])
  : "Un événement mystérieux..."

 if(channel){
  channel.send(
`🎰 **${event.name}**

${desc}

🎟️ Vous avez reçu **${tickets} tickets**
👉 Utilisez \`/eventpack\` pour jouer`
  )
 }

 /* MID */

 midTimeout = setTimeout(()=>{
  if(currentEvent && channel){
   channel.send(
`⏳ **${event.name} en cours**

${desc}

🎟️ Il vous reste des tickets !
👉 \`/eventpack\``
   )
  }
 }, event.duration/2)

 /* END */

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

function getEvent(){
 return currentEvent
}

/* 🎟️ */

function initUserEvent(user){

 const event = getEvent()
 if(!event) return

 if(!user.event || user.event.id !== event.id){

  user.event = {
   id:event.id,
   tickets:event.tickets, // FIX IMPORTANT
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