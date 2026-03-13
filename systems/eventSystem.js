let ssrEvent = {
 active:false,
 multiplier:1,
 endTime:0
}

let timeout=null

function startSSREvent(channel,multiplier=2,duration=10){

 if(timeout)
  clearTimeout(timeout)

 ssrEvent.active=true
 ssrEvent.multiplier=multiplier
 ssrEvent.endTime=Date.now()+(duration*60000)

 if(channel){

  channel.send(
`🌈 **EVENT SSR ACTIVÉ**

Multiplicateur : x${multiplier}
Durée : ${duration} minutes`
  )

 }

 timeout=setTimeout(()=>{

  ssrEvent.active=false
  ssrEvent.multiplier=1
  ssrEvent.endTime=0

  if(channel)
   channel.send("🌈 Event SSR terminé.")

 },duration*60000)

}

function stopSSREvent(){

 if(timeout)
  clearTimeout(timeout)

 ssrEvent.active=false
 ssrEvent.multiplier=1
 ssrEvent.endTime=0

}

function isSSREvent(){

 return ssrEvent.active

}

function getSSRMultiplier(){

 return ssrEvent.active ? ssrEvent.multiplier : 1

}

function getEventRemaining(){

 if(!ssrEvent.active)
  return 0

 return Math.max(0,ssrEvent.endTime-Date.now())

}

module.exports={
 startSSREvent,
 stopSSREvent,
 isSSREvent,
 getSSRMultiplier,
 getEventRemaining
}