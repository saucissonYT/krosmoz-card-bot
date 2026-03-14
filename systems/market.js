const { data, save } = require("./dataManager")

function addListing(sellerId,cardId,price){

 const market = data.market
 const users = data.users

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

 save()

 return listing
}

function buyCard(buyerId,listingId){

 const market = data.market
 const users = data.users

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

 data.market = market.filter(l=>l.id!==listingId)

 save()

 return {success:true}
}

function removeListing(userId,listingId){

 const market = data.market
 const users = data.users

 const listing = market.find(l=>l.id===listingId)

 if(!listing)
  return {error:"Annonce introuvable"}

 if(listing.seller !== userId)
  return {error:"Cette annonce ne t'appartient pas"}

 const user = users[userId]

 if(!user.cards) user.cards={}

 user.cards[listing.card]=(user.cards[listing.card]||0)+1

 data.market = market.filter(l=>l.id!==listingId)

 save()

 return {success:true}
}

function getMarket(){
 return data.market
}

function getUserListings(userId){
 return data.market.filter(l=>l.seller === userId)
}

module.exports={
 addListing,
 buyCard,
 getMarket,
 removeListing,
 getUserListings
}