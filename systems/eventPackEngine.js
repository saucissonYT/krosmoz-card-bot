const { generatePack } = require("./pack")
const handlers = require("./eventHandlerRegistry")
const { getEvent } = require("./eventSystem")

/* ---------------- LIMIT SSR ---------------- */
// 1 SSR max par pack (sauf allowMultiSSR)
// SSR en excès → dégradées en S
// S en excès (> 2 au total) → dégradées en UR

function limitSSR(pack){

 if(!Array.isArray(pack)) return pack

 // Passe 1 : garder 1 SSR max, les autres → S
 let ssrCount = 0

 const pass1 = pack.map(c => {

  if(!c) return c

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

  if(!c) return c

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
  // Pas de handler → on applique quand même limitSSR sur le basePack
  const safePack = event.allowMultiSSR ? basePack : limitSSR(basePack)
  return { pack: safePack, meta:{} }
 }

 let handlerResult = {}

 try {
  handlerResult = handler.generate(user, basePack, event)
 } catch(e) {
  console.error(`❌ Handler error [${event.key}]:`, e)
  handlerResult = { pack: basePack, meta:{} }
 }

 let pack = handlerResult.pack || basePack
 let meta = handlerResult.meta || {}

 // Sécurité : s'assurer que le pack est bien un tableau propre
 if(!Array.isArray(pack) || pack.length === 0){
  console.error(`❌ Handler [${event.key}] a retourné un pack invalide, fallback basePack`)
  pack = basePack
 }

 // Filtre les cartes nulles/invalides
 pack = pack.filter(c => c && c.id !== undefined)

 // Application de limitSSR — TOUJOURS sauf allowMultiSSR explicite
 if(!event.allowMultiSSR){
  pack = limitSSR(pack)
 }

 // Sécurité finale : vérification du résultat
 const ssrCount = pack.filter(c => c?.rarity === "SSR").length
 if(ssrCount > 1 && !event.allowMultiSSR){
  console.warn(`⚠️ [${event.key}] ${ssrCount} SSR après limitSSR — correction forcée`)
  pack = limitSSR(pack)
 }

 return { pack, meta }
}

module.exports = {
 generateEventPack,
 limitSSR
}