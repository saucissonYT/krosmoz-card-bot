let currentEvent = null
let timeout = null
let midTimeout = null

const EVENTS = require("./eventRegistry")

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

 currentEvent = {
  key,
  ...event,
  endTime: Date.now() + (15 * 60000)
 }

 /* START MESSAGE */
 if(channel)
  channel.send(event.start)

 /* MID MESSAGE */
 midTimeout = setTimeout(()=>{
  if(channel && currentEvent)
   channel.send(event.mid)
 }, (15 * 60000) / 2)

 /* END MESSAGE */
 timeout = setTimeout(()=>{

  if(channel && currentEvent)
   channel.send(event.end)

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

module.exports = {
 startEvent,
 stopEvent,
 getEvent,
 isEventActive
}