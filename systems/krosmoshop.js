const fs = require("fs")
const path = require("path")

const { getCardsById } = require("./cardRegistry")
const { data, save } = require("./dataManager")

const cardsById = getCardsById()

const SHOP_PATH = path.join(__dirname, "../data/krosmoshop.json")

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

function initShop(){

 if(!fs.existsSync(SHOP_PATH)){
  fs.writeFileSync(
   SHOP_PATH,
   JSON.stringify({
    rotation:0,
    cards:[]
   },null,2)
  )
 }

}

function loadShop(){
 initShop()
 return JSON.parse(fs.readFileSync(SHOP_PATH))
}

function saveShop(shop){
 fs.writeFileSync(SHOP_PATH,JSON.stringify(shop,null,2))
}

function randomFrom(array){
 return array[Math.floor(Math.random()*array.length)]
}

function getCardsByRarity(rarity){
 return Object.values(cardsById).filter(c=>c.rarity===rarity)
}

function generateShop(){

 const shop={
  rotation:Date.now()+86400000,
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

function getShop(){

 let shop=loadShop()

 if(Date.now()>shop.rotation){
  shop=generateShop()
 }

 return shop

}

function buyFromShop(userId,cardId){

 const shop=getShop()

 const users=data.users
 const user=users[userId]

 if(!user) return {error:"Utilisateur introuvable"}

 const entry=shop.cards.find(c=>String(c.card)===String(cardId))

 if(!entry) return {error:"Carte introuvable dans le shop"}

 if(!user.krosmoshop) user.krosmoshop={}
 if(user.krosmoshop[cardId])
  return {error:"Tu as déjà acheté cette carte aujourd'hui."}

 if(user.kamas<entry.price)
  return {error:"Kamas insuffisants"}

 user.kamas-=entry.price

 if(!user.cards) user.cards={}
 user.cards[entry.card]=(user.cards[entry.card]||0)+1

 user.krosmoshop[entry.card]=true

 /* -------- STATS SHOP -------- */

 if(!user.krosmoshopStats)
  user.krosmoshopStats={
   cardsBought:0,
   ssrBought:0
  }

 user.krosmoshopStats.cardsBought++

 if(entry.rarity==="SSR")
  user.krosmoshopStats.ssrBought++

 save()

 return {success:true,rarity:entry.rarity}

}

module.exports={
 getShop,
 buyFromShop
}