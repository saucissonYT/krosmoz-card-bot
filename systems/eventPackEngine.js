const { getCards, getCardsBySet } = require("./cardRegistry")
const handlers = require("./eventHandlerRegistry")
const { getEvent } = require("./eventSystem")

/* ================================================
   EVENT PACK ENGINE — v2
   ------------------------------------------------
   • Taux boostés par rapport aux packs normaux
   • ZERO pity (pas de compteur, pas de hard pity)
   • Chaque event handler reçoit un basePack boosté
   • limitSSR toujours appliqué sauf allowMultiSSR
================================================ */

/* ---------- TAUX EVENT (BOOSTÉS) ---------- */

const EVENT_RATES = {
 SSR: 0.02,   // 2%  (vs 0.05% normal)
 S:   0.05,   // 5%  (vs 0.15% normal)
 UR:  0.10,   // 10% (vs ~3% normal)
 HR:  0.18,   // 18%
 SR:  0.25,   // 25%
 R:   0.22,   // 22%
 U:   0.13,   // 13%
 C:   0.05    // 5%
}

const RARITY_ORDER = ["C","U","R","SR","HR","UR","S","SSR"]

/* ---------- ROLL AVEC TAUX EVENT ---------- */

function rollEventRarity(){

 const r = Math.random()
 let cumulative = 0

 for(const rarity of RARITY_ORDER){

  cumulative += EVENT_RATES[rarity]

  if(r <= cumulative)
   return rarity
 }

 return "C"
}

/* ---------- GENERATE EVENT BASE PACK ---------- */
/*
 * Génère un pack de 5 cartes avec les taux event boostés.
 * PAS de pity. PAS de lucky pack.
 * Utilise le lastSet du joueur ou un set disponible.
 */

function generateEventBasePack(user){

 /* ---- Déterminer le set ---- */

 let setId = user.lastSet

 if(!setId && user.pity){
  const keys = Object.keys(user.pity)
  if(keys.length) setId = keys[0]
 }

 if(!setId){
  console.error("❌ generateEventBasePack : aucun setId trouvable")
  return []
 }

 const setCards = getCardsBySet(setId)

 if(!setCards || setCards.length === 0){
  console.error("❌ generateEventBasePack : set vide pour", setId)
  return []
 }

 const pack = []

 for(let i = 0; i < 5; i++){

  const rarity = rollEventRarity()

  let pool = setCards.filter(c => c.rarity === rarity)

  /* Fallback : si pas de cartes de cette rareté dans le set,
     chercher dans TOUTES les cartes */
  if(pool.length === 0){
   const allCards = getCards()
   pool = allCards.filter(c => c.rarity === rarity)
  }

  /* Fallback ultime : carte random du set */
  if(pool.length === 0){
   pool = setCards
  }

  const card = pool[Math.floor(Math.random() * pool.length)]

  if(!card) continue

  /* Shiny SSR : 0.5% sur une SSR */
  if(card.rarity === "SSR" && Math.random() < 0.005){
   pack.push({ ...card, shiny: true })
  } else {
   pack.push(card)
  }
 }

 return pack
}

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

 /* ---- Base pack avec taux boostés, ZERO pity ---- */

 const basePack = generateEventBasePack(user)

 if(!basePack.length){
  console.error("❌ generateEventPack : basePack vide")
  return { pack: [], meta: {} }
 }

 /* ---- Handler spécifique ---- */

 const handler = handlers[event.key]

 if(!handler){
  const safePack = event.allowMultiSSR ? basePack : limitSSR(basePack)
  return { pack: safePack, meta: {} }
 }

 let handlerResult = {}

 try {
  handlerResult = handler.generate(user, basePack, event)
 } catch(e) {
  console.error(`❌ Handler error [${event.key}]:`, e)
  handlerResult = { pack: basePack, meta: {} }
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
 generateEventBasePack,
 limitSSR,
 rollEventRarity,
 EVENT_RATES
}