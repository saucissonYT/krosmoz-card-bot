const { generatePack } = require("./pack")
const handlers = require("./eventHandlerRegistry")
const { getEvent } = require("./eventSystem")

/* ---------------- LIMIT SSR ---------------- */
// 1 SSR max par pack (sauf allowMultiSSR)
// SSR en excès → dégradées en S
// S en excès (> 2 au total) → dégradées en UR

function limitSSR(pack){

 // Passe 1 : garder 1 SSR max, les autres → S
 let ssrCount = 0

 const pass1 = pack.map(c => {

  if(c.rarity === "SSR"){

   if(ssrCount >= 1)
    return { ...c, rarity: "S" }

   ssrCount++
  }

  return c
 })

 // Passe 2 : garder 2 S max (natives + dégradées), les autres → UR
 let sKept = 0

 return pass1.map(c => {

  if(c.rarity === "S"){

   if(sKept >= 2)
    return { ...c, rarity: "UR" }

   sKept++
  }

  return c
 })
}

/* ---------------- GENERATE EVENT PACK ---------------- */

function generateEventPack(user, event){

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