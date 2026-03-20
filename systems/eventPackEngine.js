const { generatePack } = require("./pack")
const handlers = require("./eventHandlerRegistry")
const { getEvent } = require("./eventSystem")

function limitSSR(pack){
 let found=false
 return pack.map(c=>{
  if(c.rarity==="SSR"){
   if(found){
    return c
   }
   found=true
  }
  return c
 })
}

function generateEventPack(user, event){

 // Fix : récupération du setId depuis le pity du user
 // on prend le premier set disponible dans son pity
 let setId = user.lastSet

 if(!setId && user.pity){
  const keys = Object.keys(user.pity)
  if(keys.length) setId = keys[0]
 }

 if(!setId){
  console.error("❌ generateEventPack : aucun setId trouvable pour cet user")
  return { pack:[], meta:{} }
 }

 const result = generatePack(user, setId)

 const basePack = result?.pack || []

 if(!basePack.length){
  console.error("❌ generateEventPack : basePack vide pour setId", setId)
  return { pack:[], meta:{} }
 }

 const handler = handlers[event.key]

 if(!handler){
  return { pack: basePack, meta:{} }
 }

 const handlerResult = handler.generate(user, basePack, event)

 let pack = handlerResult.pack || basePack
 let meta = handlerResult.meta || {}

 if(!event.allowMultiSSR){
  pack = limitSSR(pack)
 }

 return { pack, meta }
}

module.exports = {
 generateEventPack
}