const fs = require("fs")

const MARKET_PATH = process.env.RAILWAY
 ? "/data/market.json"
 : "./database/market.json"

const USERS_PATH = process.env.RAILWAY
 ? "/data/users.json"
 : "./database/users.json"

/* ---------- CREATE FILE IF MISSING ---------- */

if(!fs.existsSync(MARKET_PATH)){

 const dir = MARKET_PATH.split("/").slice(0,-1).join("/")

 if(!fs.existsSync(dir))
  fs.mkdirSync(dir,{recursive:true})

 fs.writeFileSync(MARKET_PATH,"[]")

}

/* LOAD */

function loadMarket(){
 return JSON.parse(fs.readFileSync(MARKET_PATH,"utf8"))
}

function loadUsers(){
 return JSON.parse(fs.readFileSync(USERS_PATH,"utf8"))
}

/* SAVE */

function saveMarket(data){
 fs.writeFileSync(MARKET_PATH,JSON.stringify(data,null,2))
}

function saveUsers(data){
 fs.writeFileSync(USERS_PATH,JSON.stringify(data,null,2))
}

/* ADD LISTING */

function addListing(sellerId,cardId,price){

 const market = loadMarket()
 const users = loadUsers()

 const seller = users[sellerId]

 if(!seller)
  return {error:"Utilisateur introuvable"}

 if(!seller.cards || !seller.cards[cardId] || seller.cards[cardId] <= 0)
  return {error:"Tu ne possèdes pas cette carte"}

 const id = Date.now()

 const listing={
  id,
  seller:sellerId,
  card:cardId,
  price,
  timestamp:id
 }

 seller.cards[cardId]--

 if(seller.cards[cardId] <= 0)
  delete seller.cards[cardId]

 market.push(listing)

 saveMarket(market)
 saveUsers(users)

 return listing
}

/* BUY CARD */

function buyCard(buyerId,listingId){

 const market = loadMarket()
 const users = loadUsers()

 const listing = market.find(l=>l.id===listingId)

 if(!listing)
  return {error:"Annonce introuvable"}

 if(listing.seller === buyerId)
  return {error:"Tu ne peux pas acheter ta propre carte"}

 const seller = users[listing.seller]
 const buyer = users[buyerId]

 if(!seller || !buyer)
  return {error:"Utilisateur introuvable"}

 if(buyer.kamas < listing.price)
  return {error:"Kamas insuffisants"}

 const tax = Math.floor(listing.price * 0.05)

 buyer.kamas -= listing.price
 seller.kamas += listing.price - tax

 if(!buyer.cards) buyer.cards={}

 buyer.cards[listing.card]=(buyer.cards[listing.card]||0)+1

 const newMarket = market.filter(l=>l.id!==listingId)

 saveMarket(newMarket)
 saveUsers(users)

 return {success:true}
}

/* REMOVE LISTING */

function removeListing(userId,listingId){

 const market = loadMarket()
 const users = loadUsers()

 const listing = market.find(l=>l.id===listingId)

 if(!listing)
  return {error:"Annonce introuvable"}

 if(listing.seller !== userId)
  return {error:"Cette annonce ne t'appartient pas"}

 const user = users[userId]

 if(!user.cards) user.cards={}

 user.cards[listing.card]=(user.cards[listing.card]||0)+1

 const newMarket = market.filter(l=>l.id!==listingId)

 saveMarket(newMarket)
 saveUsers(users)

 return {success:true}
}

/* GET MARKET */

function getMarket(){
 return loadMarket()
}

/* USER LISTINGS */

function getUserListings(userId){

 const market = loadMarket()

 return market.filter(l=>l.seller === userId)
}

module.exports={
 addListing,
 buyCard,
 getMarket,
 removeListing,
 getUserListings
}