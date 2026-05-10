const fs = require("fs")
const path = require("path")

const { getCardsById } = require("./cardRegistry")
const { getUser, save } = require("./userSystem")
const { achievementCheck } = require("./achievementCheck")
const { recordShopBuy } = require("./achievementProgressTracker")

let DATA_DIR = "/data"
if(!fs.existsSync(DATA_DIR)){
 DATA_DIR = path.join(process.cwd(), "data")
}
const SHOP_PATH = path.join(DATA_DIR, "krosmoshop.json")
const CARDS_PATH = path.join(DATA_DIR, "cards.json")
const LOCAL_CARDS_PATH = path.join(process.cwd(), "data", "cards.json")

/*
 * v0.29 — Prix rééquilibrés
 * Avant : SSR:3000, S:1800, UR:900, HR:450, SR:200
 * Principe : le shop est premium (~2.5x le market price)
 */
const PRICES = {
 SSR:12000,  /* avant: 3000 — SSR au shop = investissement majeur */
 S:5000,     /* avant: 1800 */
 UR:2000,    /* avant: 900 */
 HR:750,     /* avant: 450 */
 SR:300      /* avant: 200 */
}

const DISTRIBUTION = {
 SSR:1,
 S:2,
 UR:3,
 HR:4,
 SR:5
}
const SHOP_SIZE = Object.values(DISTRIBUTION).reduce((sum,count)=>sum+Number(count||0),0)

/* ---------------- DATE FR ---------------- */

function getTodayFR(){
 return new Date().toLocaleDateString("fr-FR", {
  timeZone:"Europe/Paris"
 })
}

/* ---------------- INIT ---------------- */

function initShop(){

 if(!fs.existsSync(DATA_DIR)){
  fs.mkdirSync(DATA_DIR,{recursive:true})
 }

 if(!fs.existsSync(SHOP_PATH)){
  fs.writeFileSync(
   SHOP_PATH,
   JSON.stringify({
    lastReset:null,
    cards:[]
   },null,2)
  )
 }

}

/* ---------------- LOAD / SAVE ---------------- */

function loadShop(){
 initShop()
 return JSON.parse(fs.readFileSync(SHOP_PATH))
}

function saveShop(shop){
 fs.writeFileSync(SHOP_PATH,JSON.stringify(shop,null,2))
}

/* ---------------- UTILS ---------------- */

function randomFrom(array){
 return array[Math.floor(Math.random()*array.length)]
}

function getShopCardsById(){
 try{
  const cardsPath = fs.existsSync(LOCAL_CARDS_PATH) ? LOCAL_CARDS_PATH : CARDS_PATH
  if(fs.existsSync(cardsPath)){
   const cards = JSON.parse(fs.readFileSync(cardsPath,"utf8"))
   if(Array.isArray(cards)){
    const byId = Object.fromEntries(
     cards
      .filter(c=>c && c.id !== undefined && c.id !== null)
      .map(c=>[String(c.id),c])
    )
    if(Object.keys(byId).length > 0) return byId
   }
  }
 }catch(_){}

 const registryCards = getCardsById()
 const registryValues = registryCards && typeof registryCards === "object" ? Object.values(registryCards) : []
 const hasValidRegistryCards = registryValues.some(c=>c && c.id !== undefined && c.id !== null && c.rarity)
 if(hasValidRegistryCards)
  return registryCards

 return {}
}

function getCardsByRarity(rarity){
 const cardsById = getShopCardsById()
 return Object.values(cardsById).filter(c=>c && c.id !== undefined && c.id !== null && c.rarity===rarity)
}

/* ---------------- GENERATE ---------------- */

function generateShop(){

 console.log("[KROSMOSHOP] Génération du shop")

 const shop={
  lastReset:getTodayFR(),
  cards:[]
 }

 const used = new Set()

 Object.entries(DISTRIBUTION).forEach(([rarity,count])=>{

 const pool=getCardsByRarity(rarity)
  if(!pool.length){
   console.warn(`[KROSMOSHOP] Aucun pool disponible pour la rarete ${rarity}`)
   return
  }

  for(let i=0;i<count;i++){

   let card
   let attempts = 0

   do{
    card = randomFrom(pool)
    attempts++
   }while(card && used.has(card.id) && attempts < 50)

   if(!card || card.id === undefined || card.id === null){
    console.warn(`[KROSMOSHOP] Carte invalide ignoree pour ${rarity}`)
    continue
   }

   used.add(card.id)

   shop.cards.push({
    card:card.id,
    rarity,
    price:PRICES[rarity]
   })

  }

 })

 saveShop(shop)

 return shop
}

/* ---------------- GET SHOP ---------------- */

function getShop(){

 let shop = loadShop()

 const today = getTodayFR()

 const shopCards = Array.isArray(shop.cards) ? shop.cards : []
 const invalidShop = shopCards.length < SHOP_SIZE || shopCards.some(entry=>!entry || entry.card === undefined || entry.card === null)

 // Regenerer si jour different ou shop incomplet
 if(!shop.lastReset || shop.lastReset !== today || invalidShop){

  console.log("[KROSMOSHOP] RESET JOURNALIER")

  shop = generateShop()
 }

 return shop
}

/* ---------------- BUY ---------------- */

function buyFromShop(userId,cardId){

 const cardsById = getCardsById()

 const shop=getShop()

 const user = getUser(userId)

 if(!user){
  console.log("[KROSMOSHOP] user introuvable",userId)
  return {error:"Utilisateur introuvable"}
 }

 const entry=shop.cards.find(c=>String(c.card)===String(cardId))

 if(!entry)
  return {error:"Carte introuvable dans le shop"}

 if(!user.krosmoshop)
  user.krosmoshop={}

 const today=getTodayFR()

 if(!user.krosmoshop[today])
  user.krosmoshop[today]={}

 if(user.krosmoshop[today][cardId])
  return {error:"Déjà achetée aujourd'hui."}

 /* ---- Réduction via bonus de guilde ---- */
 let finalPrice = entry.price

 try{
  const { getUserGuildBonuses } = require("./guildBonuses")
  const bonuses = getUserGuildBonuses(userId)
  if(bonuses.shopDiscount > 0){
   finalPrice = Math.floor(entry.price * (1 - bonuses.shopDiscount / 100))
  }
 }catch(e){
  /* guildBonuses pas disponible, prix normal */
 }

 /* ---- Réduction via bonus de niveau joueur ---- */
 try{
  const { getPlayerBonuses } = require("./playerbonuses")
  const pBonuses = getPlayerBonuses(user.progression?.level || 1)
  if(pBonuses.shopDiscount > 0){
   finalPrice = Math.floor(finalPrice * (1 - pBonuses.shopDiscount / 100))
  }
 }catch(e){
  /* playerBonuses pas disponible, prix normal */
 }

 if(user.kamas<finalPrice)
  return {error:"Kamas insuffisants"}

 /* -------- DISCOVERED CHECK (avant d'ajouter) -------- */

 if(!user.cards) user.cards={}

 const isNew = !user.cards[entry.card] || user.cards[entry.card] === 0

 /* -------- TRANSACTION -------- */

 user.kamas-=finalPrice

 user.cards[entry.card]=(user.cards[entry.card]||0)+1

 user.krosmoshop[today][cardId]=true

 /* -------- STATS -------- */

 if(!user.krosmoshopStats)
  user.krosmoshopStats={
   cardsBought:0,
   ssrBought:0,
   sBought:0,
   kamasSpent:0,
   daysVisited:0
  }

 user.krosmoshopStats.cardsBought++

 /* Track shopBought pour les quêtes de guilde */
 if(!user.stats) user.stats = {}
 user.stats.shopBought = (user.stats.shopBought || 0) + 1

 if(entry.rarity==="SSR"){
  user.krosmoshopStats.ssrBought++
  user.stats.ssrPulled = (user.stats.ssrPulled || 0) + 1
 }

 if(entry.rarity==="S")
  user.krosmoshopStats.sBought = (user.krosmoshopStats.sBought||0)+1

 user.krosmoshopStats.kamasSpent = (user.krosmoshopStats.kamasSpent||0)+finalPrice

 /* Compteur de jours distincts de visite au shop */
 if(!user.krosmoshopStats._lastDay || user.krosmoshopStats._lastDay !== today){
  user.krosmoshopStats.daysVisited = (user.krosmoshopStats.daysVisited||0)+1
  user.krosmoshopStats._lastDay = today
 }

 recordShopBuy(user, {
  ts: Date.now(),
  rarity: entry.rarity,
  finalPrice,
  originalPrice: entry.price,
  dayKey: today,
  shopSize: Array.isArray(shop.cards) ? shop.cards.length : 15
 })

 /* -------- CARD INFO -------- */

 const cardInfo = cardsById[String(entry.card)] || null

 /* -------- ACHIEVEMENTS -------- */

 const unlocked = achievementCheck(user,"krosmoshop")

 save()

 return {
  success:true,
  rarity:entry.rarity,
  price:finalPrice,
  originalPrice:entry.price,
  isNew,
  cardInfo,
  unlocked
 }
}

module.exports={
 getShop,
 buyFromShop,
 PRICES
}
