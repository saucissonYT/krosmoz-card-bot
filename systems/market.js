const { data, markMarketDirty } = require("./dataManager")
const { getUser, save: saveUserData } = require("./userSystem")
const { getCardsById } = require("./cardRegistry")
const { isSecretCard, getSecretCardById } = require("./secretCard")
const {
 recordMarketListing,
 recordMarketBuy,
 recordMarketSale,
 recordMarketRemove
} = require("./achievementProgressTracker")

if (!data.market) data.market = []
if (!data.marketHistory) data.marketHistory = []

const FRAGMENT_MIN_PRICE = 250

function generateId() {
 return Date.now() + Math.floor(Math.random() * 1000)
}

function getListingType(listing) {
 return listing?.type || "card"
}

function getAveragePrices() {
 const prices = {}

 for (const sale of data.marketHistory) {
  const key = sale.type === "fragment"
   ? `fragment:${sale.card}:${sale.fragmentNumber}`
   : `card:${sale.card}`

  if (!prices[key]) prices[key] = []
  prices[key].push(sale.price)
 }

 const averages = {}

 for (const key in prices) {
  const list = prices[key]
  const sum = list.reduce((a, b) => a + b, 0)
  averages[key] = Math.floor(sum / list.length)
 }

 return averages
}

function getCardAveragePrice(cardId, averages = getAveragePrices()) {
 return averages[`card:${cardId}`]
}

function getFragmentAveragePrice(cardId, fragmentNumber, averages = getAveragePrices()) {
 return averages[`fragment:${cardId}:${fragmentNumber}`]
}

function getFragmentMinimumPrice(cardId, fragmentNumber, averages = getAveragePrices()) {
 const average = getFragmentAveragePrice(cardId, fragmentNumber, averages)
 if (average) return Math.max(FRAGMENT_MIN_PRICE, Math.floor(average * 0.25))
 return FRAGMENT_MIN_PRICE
}

function validatePrice(price) {
 if (!Number.isFinite(price) || price <= 0) return "Prix invalide"
 return null
}

function persistUsers(...userIds) {
 const uniqueIds = [...new Set(userIds.map((id) => String(id || "")).filter(Boolean))]
 for (const id of uniqueIds) {
  saveUserData(id)
 }
}

function getCardForListing(cardId) {
 const cardsById = getCardsById()
 return cardsById[String(cardId)] || getSecretCardById(cardId)
}

function isSecretListing(listing) {
 if (getListingType(listing) !== "card") return false
 const card = getCardForListing(listing.card)
 return isSecretCard(card)
}

function addListing(sellerId, cardId, price) {
 const market = data.market
 const seller = getUser(sellerId)

 if (!sellerId || !cardId || !price) return { error: "Parametres invalides" }
 if (!seller) return { error: "Utilisateur introuvable" }
 if (!seller.cards || !seller.cards[cardId] || seller.cards[cardId] <= 0) return { error: "Tu ne possedes pas cette carte" }
 const listedCard = getCardForListing(cardId)
 if (isSecretCard(listedCard)) return { error: "La carte SECRET ne peut pas etre vendue au market." }

 const priceError = validatePrice(price)
 if (priceError) return { error: priceError }

 const averages = getAveragePrices()
 const avg = getCardAveragePrice(cardId, averages)

 if (avg) {
  const minPrice = Math.floor(avg * 0.25)
  const maxPrice = Math.floor(avg * 4)

  if (price < minPrice) return { error: `Prix trop bas (min ${minPrice})` }
  if (price > maxPrice) return { error: `Prix trop eleve (max ${maxPrice})` }
 }

 const id = generateId()
 const listing = {
  id,
  type: "card",
  seller: sellerId,
  card: cardId,
  price,
  timestamp: Date.now()
 }

 seller.cards[cardId]--
 if (seller.cards[cardId] <= 0) delete seller.cards[cardId]

 if (!seller.stats) seller.stats = {}
 seller.stats.cardsSold = (seller.stats.cardsSold || 0) + 1
 recordMarketListing(seller, cardId, Date.now())

 const cardsById = getCardsById()
 const card = cardsById[String(cardId)]
 if (card?.rarity === "SSR") {
  seller.stats.marketSSRListed = (seller.stats.marketSSRListed || 0) + 1
 }

 market.push(listing)
 markMarketDirty()
 persistUsers(sellerId)
 return listing
}

function addFragmentListing(sellerId, cardId, fragmentNumber, price) {
 const seller = getUser(sellerId)

 if (!sellerId || !cardId || !fragmentNumber || !price) return { error: "Parametres invalides" }
 if (!seller) return { error: "Utilisateur introuvable" }

 const priceError = validatePrice(price)
 if (priceError) return { error: priceError }

 const safeNumber = Number(fragmentNumber)
 if (!Number.isInteger(safeNumber) || safeNumber < 1 || safeNumber > 5) {
  return { error: "Numero de fragment invalide" }
 }

 if (!Array.isArray(seller.fragments)) seller.fragments = []
 const index = seller.fragments.findIndex((fragment) =>
  String(fragment.cardId) === String(cardId) &&
  Number(fragment.fragmentNumber) === safeNumber
 )

 if (index === -1) return { error: "Tu ne possedes pas ce fragment" }

 const minPrice = getFragmentMinimumPrice(cardId, safeNumber)
 if (price < minPrice) return { error: `Prix trop bas (min ${minPrice})` }

 const listing = {
  id: generateId(),
  type: "fragment",
  seller: sellerId,
  card: String(cardId),
  fragmentNumber: safeNumber,
  price,
  timestamp: Date.now()
 }

 seller.fragments.splice(index, 1)
 if (!seller.stats) seller.stats = {}
 seller.stats.fragmentsSold = (seller.stats.fragmentsSold || 0)

 data.market.push(listing)
 markMarketDirty()
 persistUsers(sellerId)
 return listing
}

function buyCard(buyerId, listingId) {
 const listing = data.market.find((entry) => entry.id === listingId)
 if (!listing) return { error: "Annonce introuvable" }
 if (listing.seller === buyerId) return { error: "Tu ne peux pas acheter ta propre annonce" }
 if (isSecretListing(listing)) return { error: "Les cartes SECRET ne sont pas echangeables au market." }

 const seller = getUser(listing.seller)
 const buyer = getUser(buyerId)
 if (!seller || !buyer) return { error: "Utilisateur introuvable" }
 if ((buyer.kamas || 0) < listing.price) return { error: "Kamas insuffisants" }

 const tax = Math.floor(listing.price * 0.05)
 buyer.kamas -= listing.price
 seller.kamas += listing.price - tax

 if (!buyer.cards) buyer.cards = {}
 if (!buyer.fragments) buyer.fragments = []
 if (!buyer.stats) buyer.stats = {}
 if (!seller.stats) seller.stats = {}

 if (getListingType(listing) === "fragment") {
  buyer.fragments.push({
   cardId: String(listing.card),
   fragmentNumber: Number(listing.fragmentNumber),
   source: "market",
   obtainedAt: new Date().toISOString()
  })
  seller.stats.fragmentsSold = (seller.stats.fragmentsSold || 0) + 1
 } else {
  buyer.cards[listing.card] = (buyer.cards[listing.card] || 0) + 1
  buyer.stats.cardsBought = (buyer.stats.cardsBought || 0) + 1
  buyer.stats.marketBought = (buyer.stats.marketBought || 0) + 1
  recordMarketBuy(buyer, listing.card, Date.now())
  recordMarketSale(seller, listing, listing.price - tax, Date.now())

  try {
   const { getUserGuild } = require("./guildSystem")
   const sellerGuild = getUserGuild(String(listing.seller || ""))
   const buyerGuild = getUserGuild(String(buyerId || ""))
   if (sellerGuild && buyerGuild && String(sellerGuild.id) === String(buyerGuild.id)) {
    seller.stats.guildMemberTrades = (seller.stats.guildMemberTrades || 0) + 1
    buyer.stats.guildMemberTrades = (buyer.stats.guildMemberTrades || 0) + 1
   }
  } catch (_) {}
 }

 data.market = data.market.filter((entry) => entry.id !== listingId)
 data.marketHistory.push({
  type: getListingType(listing),
  card: listing.card,
  fragmentNumber: listing.fragmentNumber || null,
  price: listing.price,
  seller: listing.seller,
  buyer: buyerId,
  timestamp: Date.now()
 })

 if (data.marketHistory.length > 5000) data.marketHistory.shift()

 markMarketDirty()
 persistUsers(buyerId, listing.seller)
 return { success: true, listing }
}

function removeListing(userId, listingId) {
 const listing = data.market.find((entry) => entry.id === listingId)
 if (!listing) return { error: "Annonce introuvable" }
 if (listing.seller !== userId) return { error: "Cette annonce ne t'appartient pas" }

 const user = getUser(userId)
 if (!user.cards) user.cards = {}
 if (!Array.isArray(user.fragments)) user.fragments = []

 if (getListingType(listing) === "fragment") {
  user.fragments.push({
   cardId: String(listing.card),
   fragmentNumber: Number(listing.fragmentNumber),
   source: "market_return",
   obtainedAt: new Date().toISOString()
  })
 } else {
  user.cards[listing.card] = (user.cards[listing.card] || 0) + 1
 }

 data.market = data.market.filter((entry) => entry.id !== listingId)
 markMarketDirty()
 recordMarketRemove(user, Date.now())
 persistUsers(userId)
 return { success: true }
}

function getMarket() {
 return (data.market || []).filter((entry) => !isSecretListing(entry))
}

function getUserListings(userId) {
 return (data.market || []).filter((entry) => entry.seller === userId)
}

module.exports = {
 FRAGMENT_MIN_PRICE,
 addFragmentListing,
 addListing,
 buyCard,
 getAveragePrices,
 getCardAveragePrice,
 getFragmentAveragePrice,
 getFragmentMinimumPrice,
 getListingType,
 getMarket,
 getUserListings,
 removeListing
}
