const fs = require("fs")
const path = require("path")

const { getCardsById } = require("./cardRegistry")
const { data, save } = require("./dataManager")
const { achievementCheck } = require("./achievementCheck")

const cardsById = getCardsById()

const DATA_DIR = path.join(__dirname, "../data")
const SHOP_PATH = path.join(DATA_DIR, "krosmoshop.json")

const PRICES = {
 SSR:3000,
 S:1800,
 UR:900,
 HR:450,
 SR:200
}

const DISTRIBUTION = {
 SSR:1,
 S:2,
 UR:3,
 HR:4,
 SR:5
}

/* ---------------- DATE FR ---------------- */

function getTodayFR(){
 return new Date().toLocaleDateString("fr-FR", {
  timeZone:"Europe/Paris"
 })
}

/* ---------------- INIT ---------------- */

function initShop(){

 // 🔥 FIX DOSSIER
 if(!fs.existsSync(DATA_DIR)){
  console.log("[KROSMOSHOP] Création dossier /data")
  fs.mkdirSync(DATA_DIR, { recursive:true })
 }

 // 🔥 FIX FICHIER
 if(!fs.existsSync(SHOP_PATH)){
  console.log("[KROSMOSHOP] Création fichier shop")

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

function getCardsByRarity(rarity){
 return Object.values(cardsById).filter(c=>c.rarity===rarity)
}

/* ---------------- GENERATE ---------------- */

function generateShop(){

 console.log("[KROSMOSHOP] Génération du shop")

 const shop={
  lastReset:getTodayFR(),
  cards:[]
 }

 Object.entries(DISTRIBUTION).forEach(([rarity,count])=>{

  const pool=getCardsByRarity(rarity)

  for(let i=0;i<count;i++){

   const card=randomFrom(pool)

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

 let shop=loadShop()

 const today=getTodayFR()

 if(shop.lastReset !== today){

  console.log("[KROSMOSHOP] Reset journalier")

  shop=generateShop()
 }

 return shop
}

/* ---------------- BUY ---------------- */

function buyFromShop(userId,cardId){

 const shop=getShop()

 const users=data.users
 const user=users[userId]

 if(!user){
  console.log("[KROSMOSHOP] user introuvable",userId)
  return {error:"Utilisateur introuvable"}
 }

 const entry=shop.cards.find(c=>String(c.card)===String(cardId))

 if(!entry){
  console.log("[KROSMOSHOP] carte introuvable",cardId)
  return {error:"Carte introuvable dans le shop"}
 }

 if(!user.krosmoshop)
  user.krosmoshop={}

 const today=getTodayFR()

 if(!user.krosmoshop[today])
  user.krosmoshop[today]={}

 if(user.krosmoshop[today][cardId])
  return {error:"Tu as déjà acheté cette carte aujourd'hui."}

 if(user.kamas<entry.price)
  return {error:"Kamas insuffisants"}

 /* -------- TRANSACTION -------- */

 user.kamas-=entry.price

 if(!user.cards) user.cards={}
 user.cards[entry.card]=(user.cards[entry.card]||0)+1

 user.krosmoshop[today][cardId]=true

 /* -------- STATS -------- */

 if(!user.krosmoshopStats)
  user.krosmoshopStats={
   cardsBought:0,
   ssrBought:0
  }

 user.krosmoshopStats.cardsBought++

 if(entry.rarity==="SSR")
  user.krosmoshopStats.ssrBought++

 /* -------- ACHIEVEMENTS -------- */

 const unlocked = achievementCheck(user,"krosmoshop")

 save()

 console.log("[KROSMOSHOP] achat OK",cardId,userId)

 return {
  success:true,
  rarity:entry.rarity,
  unlocked
 }

}

module.exports={
 getShop,
 buyFromShop
}