let currentEvent = null
let timeout = null
let midTimeout = null
let schedulerTimeout = null
let schedulerTickFn = null

const EVENTS = require("./eventRegistry")
const { getCards } = require("./cardRegistry")
const { createLogger } = require("./logger")
const {
 getSchedulerNextRun,
 setSchedulerNextRun
} = require("./schedulerStateStore")

const log = createLogger("EVENT")

const EVENT_DURATION_MS = 15 * 60 * 1000
const EVENT_MIN_INTERVAL_MS = 3 * 60 * 60 * 1000
const EVENT_MAX_INTERVAL_MS = 6 * 60 * 60 * 1000
const NO_ACTIVITY_PENALTY_MS = 3 * 60 * 60 * 1000
const EVENT_SCHEDULER_KEY = "discord_event"
const DEFAULT_EVENT_CHANNELS = [
 "1487121269018329178"
]

function randomTickets(){
 return Math.floor(Math.random()*2)+2
}

function pickRandomEvent(){
 const keys = Object.keys(EVENTS)
 return keys[Math.floor(Math.random()*keys.length)]
}

function randInt(min, max){
 return Math.floor(Math.random() * (max - min + 1)) + min
}

function getNextEventDelay(){
 return randInt(EVENT_MIN_INTERVAL_MS, EVENT_MAX_INTERVAL_MS)
}

async function resolveEventChannel(client, channelIds){
 if(!client) return null
 const id = Array.isArray(channelIds) && channelIds.length > 0 ? channelIds[0] : null
 if(!id) return null
 try{
  const channel = await client.channels.fetch(id)
  if(channel && channel.isTextBased()) return channel
 } catch(_){}
 return null
}

function scheduleNextEventTick(tick, nextAt){
 const safeNextAt = Math.max(Date.now(), Number(nextAt || 0))
 const delay = Math.max(0, safeNextAt - Date.now())
 if(schedulerTimeout) clearTimeout(schedulerTimeout)
 setSchedulerNextRun(EVENT_SCHEDULER_KEY, safeNextAt)
 schedulerTimeout = setTimeout(tick, delay)
 return delay
}

function applyNoActivityPenaltyToEventScheduler(){
 if(typeof schedulerTickFn !== "function") return

 const scheduledAt = getSchedulerNextRun(EVENT_SCHEDULER_KEY)
 if(!Number.isFinite(scheduledAt) || scheduledAt <= 0) return

 const extendedAt = scheduledAt + NO_ACTIVITY_PENALTY_MS
 const delay = scheduleNextEventTick(schedulerTickFn, extendedAt)
 log.info("Bonus anti-spam appliqué (event sans participants)", {
  addedMinutes: Math.round(NO_ACTIVITY_PENALTY_MS / 60000),
  nextInMinutes: Math.round(delay / 60000)
 })
}

/* ---------------- END EVENT ---------------- */

function endEvent(channel){

 if(!currentEvent) return
 const hadNoParticipants = Number(currentEvent?.stats?.packs || 0) <= 0

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
 if(hadNoParticipants){
  applyNoActivityPenaltyToEventScheduler()
 }

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
  endTime: Date.now() + EVENT_DURATION_MS
 }

 console.log("?? EVENT START:", key, "| Tickets:", tickets)

 try { require("../web/Server").pushActivity({ kind: "event_start", eventName: event.name }) } catch(_) {}

 if(channel){
  channel.send(
`# ?? **${event.name.toUpperCase()}**

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
 }, EVENT_DURATION_MS / 2)

 /* ---------- END ---------- */

 timeout = setTimeout(()=>{
  endEvent(channel)
 }, EVENT_DURATION_MS)

 return true
}

/* ---------------- STOP ---------------- */

function stopEvent(channel){

 if(timeout) clearTimeout(timeout)
 if(midTimeout) clearTimeout(midTimeout)

 endEvent(channel)

 console.log("🛑 EVENT STOP:", currentEvent?.key)
}

/* ---------------- AUTO SCHEDULER ---------------- */

function startEventScheduler(client, channelIds){

 const channels = Array.isArray(channelIds) && channelIds.length > 0
  ? channelIds
  : DEFAULT_EVENT_CHANNELS

 if(schedulerTimeout){
  clearTimeout(schedulerTimeout)
  schedulerTimeout = null
 }

 async function tick(){
  try{
   const channel = await resolveEventChannel(client, channels)
   if(!channel){
    log.warn("Aucun salon texte valide pour l'event auto, lancement sans annonce Discord")
   }

   const started = startEvent(channel || null)
   if(!started){
    log.info("Event auto ignoré (event déjà actif)")
   }
  } catch(err){
   log.error("Erreur scheduler event", { err: err?.message || String(err) })
  }

  const nextAt = Date.now() + getNextEventDelay()
  const delay = scheduleNextEventTick(tick, nextAt)
  log.info("Prochain event auto dans", { minutes: Math.round(delay / 60000) })
 }

 schedulerTickFn = tick
 const restoredNextAt = getSchedulerNextRun(EVENT_SCHEDULER_KEY)
 const firstNextAt = restoredNextAt || (Date.now() + getNextEventDelay())
 const firstDelay = scheduleNextEventTick(tick, firstNextAt)
 log.info("Scheduler event initialisé", {
  restored: Boolean(restoredNextAt),
  minutes: Math.round(firstDelay / 60000),
  channels: channels.length
 })
}

function stopEventScheduler(){
 if(schedulerTimeout){
  clearTimeout(schedulerTimeout)
  schedulerTimeout = null
 }
 schedulerTickFn = null
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
 startEventScheduler,
 stopEvent,
 stopEventScheduler,
 getEvent,
 isEventActive,
 initUserEvent,
 canUseEventPack,
 registerEventPack,
 claimFirstPack
}
