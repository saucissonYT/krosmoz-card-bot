const { data, save } = require("./dataManager")
const { getUser } = require("./userSystem")
const { getCardsById } = require("./cardRegistry")

/* ---------------- INIT MARKET ---------------- */

if(!data.market) data.market=[]
if(!data.marketHistory) data.marketHistory=[]

/* ---------------- ID ---------------- */

function generateId(){
 return Date.now() + Math.floor(Math.random()*1000)
}

/* ---------------- AVERAGES ---------------- */

function getAveragePrices(){

 const prices={}

 for(const sale of data.marketHistory){
  if(!prices[sale.card]) prices[sale.card]=[]
  prices[sale.card].push(sale.price)
 }

 const averages={}

 for(const card in prices){
  const list=prices[card]
  const sum=list.reduce((a,b)=>a+b,0)
  averages[card]=Math.floor(sum/list.length)
 }

 return averages
}

/* ---------------- ADD LISTING ---------------- */

function addListing(sellerId, cardId, price){

 const market = data.market
 const seller = getUser(sellerId)

 if(!sellerId || !cardId || !price)
  return {error:"Paramètres invalides"}

 if(!seller)
  return {error:"Utilisateur introuvable"}

 if(!seller.cards || !seller.cards[cardId] || seller.cards[cardId] <= 0)
  return {error:"Tu ne possèdes pas cette carte"}

 if(price <= 0)
  return {error:"Prix invalide"}

 const averages = getAveragePrices()

 if(averages[cardId]){
  const avg = averages[cardId]
  const minPrice = Math.floor(avg*0.25)
  const maxPrice = Math.floor(avg*4)

  if(price < minPrice)
   return {error:`Prix trop bas (min ${minPrice})`}

  if(price > maxPrice)
   return {error:`Prix trop élevé (max ${maxPrice})`}
 }

 const id = generateId()

 const listing = {
  id,
  seller: sellerId,
  card: cardId,
  price,
  timestamp: Date.now()
 }

 seller.cards[cardId]--

 if(seller.cards[cardId] <= 0)
  delete seller.cards[cardId]

 if(!seller.stats) seller.stats = {}
 seller.stats.cardsSold = (seller.stats.cardsSold || 0) + 1

 /* ---- TRACKING ACHIEVEMENT MARKET SSR ---- */

 const cardsById = getCardsById()
 const card = cardsById[String(cardId)]

 if(card?.rarity === "SSR"){
  seller.stats.marketSSRListed = (seller.stats.marketSSRListed || 0) + 1
 }

 market.push(listing)
 save()

 return listing
}

/* ---------------- BUY ---------------- */

function buyCard(buyerId, listingId){

 const market = data.market

 const listing = market.find(l=>l.id===listingId)
 if(!listing)
  return {error:"Annonce introuvable"}

 if(listing.seller === buyerId)
  return {error:"Tu ne peux pas acheter ta propre carte"}

 const seller = getUser(listing.seller)
 const buyer = getUser(buyerId)

 if(!seller || !buyer)
  return {error:"Utilisateur introuvable"}

 if(buyer.kamas < listing.price)
  return {error:"Kamas insuffisants"}

 const tax = Math.floor(listing.price * 0.05)

 buyer.kamas -= listing.price
 seller.kamas += listing.price - tax

 if(!buyer.cards) buyer.cards = {}
 if(!buyer.stats) buyer.stats = {}
 if(!seller.stats) seller.stats = {}

 buyer.cards[listing.card] = (buyer.cards[listing.card] || 0) + 1

 /* ---- TRACKING ACHIEVEMENT MARKET BOUGHT ---- */
 buyer.stats.cardsBought = (buyer.stats.cardsBought || 0) + 1
 buyer.stats.marketBought = (buyer.stats.marketBought || 0) + 1

 data.market = market.filter(l=>l.id!==listingId)

 data.marketHistory.push({
  card: listing.card,
  price: listing.price,
  seller: listing.seller,
  buyer: buyerId,
  timestamp: Date.now()
 })

 if(data.marketHistory.length > 5000)
  data.marketHistory.shift()

 save()

 return {success:true}
}

/* ---------------- REMOVE ---------------- */

function removeListing(userId, listingId){

 const market = data.market

 const listing = market.find(l=>l.id===listingId)
 if(!listing)
  return {error:"Annonce introuvable"}

 if(listing.seller !== userId)
  return {error:"Cette annonce ne t'appartient pas"}

 const user = getUser(userId)

 if(!user.cards) user.cards = {}

 user.cards[listing.card] = (user.cards[listing.card] || 0) + 1

 data.market = market.filter(l=>l.id!==listingId)

 save()

 return {success:true}
}

/* ---------------- GET ---------------- */

function getMarket(){
 return data.market || []
}

function getUserListings(userId){
 return (data.market||[]).filter(l=>l.seller === userId)
}

module.exports = {
 addListing,
 buyCard,
 getMarket,
 removeListing,
 getUserListings,
 getAveragePrices
}