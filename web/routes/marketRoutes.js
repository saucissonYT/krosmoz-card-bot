/* Routes: /api/market, /api/me/listings, /api/market/* */

const { getUser, save } = require("../../systems/userSystem")
const { achievementCheck } = require("../../systems/achievementCheck")
const { addBattlePassXP } = require("../../systems/battlePassService")
const {
 addListing,
 addFragmentListing,
 buyCard,
 getUserListings,
 removeListing
} = require("../../systems/market")

module.exports = function mount(app, ctx) {
 const {
  requireSession, resolveDiscordUser, parsePagination,
  getCards, getSets, getCardSetNameMap, getCardsByIdMap,
  computeMarket, enrichListingWithCardMeta,
  countUnlockedAchievements,
  webHooks, MAX_PRICE, invalidateUserCaches
 } = ctx

 app.get("/api/market", async (req, res) => {
  try {
   const { page, limit, offset } = parsePagination(req, 20, 100)
   const all = await computeMarket(req.query)
   const slice = all.slice(offset, offset + limit)
   const pages = Math.max(1, Math.ceil(all.length / limit))

   const withSellers = await Promise.all(slice.map(async (item) => ({
    ...item,
    sellerProfile: await resolveDiscordUser(item.seller)
   })))

   res.json({
    total: all.length,
    page,
    pages,
    limit,
    items: withSellers
   })
  } catch (e) {
   console.error("[WEB] /api/market:", e)
   res.status(500).json({ error: "Erreur serveur" })
  }
 })

 app.get("/api/me/listings", async (req, res) => {
  try {
   const session = requireSession(req, res)
   if (!session) return

   const cards = getCards()
   const sets = getSets()
   const cardsById = getCardsByIdMap(cards)
   const setNames = getCardSetNameMap(sets)
   const listings = getUserListings(session.userId)
    .map((l) => enrichListingWithCardMeta(l, cardsById, setNames))
    .sort((a, b) => b.timestamp - a.timestamp)

   res.json({ items: listings })
  } catch (e) {
   console.error("[WEB] /api/me/listings:", e)
   res.status(500).json({ error: "Erreur serveur" })
  }
 })

 app.post("/api/market/buy", async (req, res) => {
  try {
   const session = requireSession(req, res)
   if (!session) return

   const listingId = Number(req.body?.listingId)
   if (!Number.isFinite(listingId)) return res.status(400).json({ error: "listingId invalide." })

   const result = buyCard(session.userId, listingId)
   if (result?.error) return res.status(400).json({ error: result.error })
   const sellerId = String(result?.listing?.seller || "")

   const buyer = getUser(session.userId)
   const seller = sellerId ? getUser(sellerId) : null
   const unlocked = [
    ...achievementCheck(buyer, "economy"),
    ...achievementCheck(buyer, "collection"),
    ...achievementCheck(buyer, "pack"),
    ...achievementCheck(buyer, "fragment")
   ]
   const sellerUnlocked = seller
    ? achievementCheck(seller, "economy")
    : []
   if (sellerId) save(sellerId)
   save(session.userId)
   invalidateUserCaches([session.userId, sellerId])

   if (typeof webHooks.onWebMarketBuy === "function") {
    Promise.resolve(webHooks.onWebMarketBuy({
     buyerId: String(session.userId),
     listing: result.listing
    })).catch((error) => {
     console.error("[WEB] onWebMarketBuy hook:", error?.message || error)
    })
   }

   res.json({
    ok: true,
    result,
    unlockedAchievements: countUnlockedAchievements(unlocked),
    sellerUnlockedAchievements: countUnlockedAchievements(sellerUnlocked)
   })
  } catch (e) {
   console.error("[WEB] /api/market/buy:", e)
   res.status(500).json({ error: "Erreur serveur" })
  }
 })

 app.post("/api/market/sell-card", async (req, res) => {
  try {
   const session = requireSession(req, res)
   if (!session) return

   const cardId = String(req.body?.cardId || "").trim()
   const price = Number(req.body?.price)
   if (!cardId) return res.status(400).json({ error: "cardId manquant." })
   if (!Number.isFinite(price) || price <= 0) return res.status(400).json({ error: "Prix invalide." })
   if (price > MAX_PRICE) return res.status(400).json({ error: `Prix max: ${MAX_PRICE.toLocaleString("fr-FR")} kamas.` })

   const result = addListing(session.userId, cardId, price)
   if (result?.error) return res.status(400).json({ error: result.error })

   const user = getUser(session.userId)
   await addBattlePassXP(session.userId, "market_sell")
   const unlocked = achievementCheck(user, "economy")
   save(session.userId)
   invalidateUserCaches([session.userId])

   res.json({
    ok: true,
    listing: result,
    unlockedAchievements: countUnlockedAchievements(unlocked)
   })
  } catch (e) {
   console.error("[WEB] /api/market/sell-card:", e)
   res.status(500).json({ error: "Erreur serveur" })
  }
 })

 app.post("/api/market/sell-fragment", async (req, res) => {
  try {
   const session = requireSession(req, res)
   if (!session) return

   const cardId = String(req.body?.cardId || "").trim()
   const fragmentNumber = Number(req.body?.fragmentNumber)
   const price = Number(req.body?.price)
   if (!cardId) return res.status(400).json({ error: "cardId manquant." })
   if (!Number.isInteger(fragmentNumber) || fragmentNumber < 1 || fragmentNumber > 5) {
    return res.status(400).json({ error: "Numéro de fragment invalide." })
   }
   if (!Number.isFinite(price) || price <= 0) return res.status(400).json({ error: "Prix invalide." })
   if (price > MAX_PRICE) return res.status(400).json({ error: `Prix max: ${MAX_PRICE.toLocaleString("fr-FR")} kamas.` })

   const result = addFragmentListing(session.userId, cardId, fragmentNumber, price)
   if (result?.error) return res.status(400).json({ error: result.error })

   const user = getUser(session.userId)
   await addBattlePassXP(session.userId, "market_sell")
   const unlocked = achievementCheck(user, "fragment")
   save(session.userId)
   invalidateUserCaches([session.userId])

   res.json({
    ok: true,
    listing: result,
    unlockedAchievements: countUnlockedAchievements(unlocked)
   })
  } catch (e) {
   console.error("[WEB] /api/market/sell-fragment:", e)
   res.status(500).json({ error: "Erreur serveur" })
  }
 })

 app.post("/api/market/remove", (req, res) => {
  try {
   const session = requireSession(req, res)
   if (!session) return

   const listingId = Number(req.body?.listingId)
   if (!Number.isFinite(listingId)) return res.status(400).json({ error: "listingId invalide." })

   const result = removeListing(session.userId, listingId)
   if (result?.error) return res.status(400).json({ error: result.error })
   invalidateUserCaches([session.userId])
   res.json({ ok: true })
  } catch (e) {
   console.error("[WEB] /api/market/remove:", e)
   res.status(500).json({ error: "Erreur serveur" })
  }
 })
}
