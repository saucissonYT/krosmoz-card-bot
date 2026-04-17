/* Routes: /api/game/*, /api/krosmoshop/* */

const fs = require("fs")
const path = require("path")
const { getUser, save } = require("../../systems/userSystem")
const { achievementCheck } = require("../../systems/achievementCheck")
const { addBattlePassXP } = require("../../systems/battlePassService")
const { PACK_PRICE, FUSION_COST, SELL_PRICE } = require("../../systems/constants")
const { addXP } = require("../../systems/progressionSystem")
const { buyFromShop } = require("../../systems/krosmoshop")
const { openPack } = require("../../systems/packEngine")
const { isSecretCard, getSecretCardById } = require("../../systems/secretCard")
const { craftFromFragments } = require("../../systems/fragmentService")
const { isSetUnlocked } = require("../../systems/setUnlockSystem")
const { getSeasonSellMultiplier, getSellBonusPercent, computeSellPrice } = require("../../systems/sellHelper")
const { recordShopView } = require("../../systems/achievementProgressTracker")

module.exports = function mount(app, ctx) {
 const {
  requireSession, resolveSession, parsePagination,
  getCards, getSets, getCardSetNameMap,
  buildKrosmoshopStatePayload,
  buildRecruitHistoryPayload, appendRecruitHistoryEntries,
  normalizeRarity, getNextRarity, countUnlockedAchievements,
  consumeDuplicatesForFusion,
  RARITY_ORDER, invalidateUserCaches,
  PUBLIC_DIR
 } = ctx

 app.get("/api/game/craft-test-cards", (req, res) => {
  try {
   const session = requireSession(req, res)
   if (!session) return

   const folder = path.join(PUBLIC_DIR, "assets", "ui", "cartes test")
   let files = []
   try {
    files = fs.readdirSync(folder, { withFileTypes: true })
     .filter((entry) => entry && entry.isFile && entry.isFile())
     .map((entry) => String(entry.name || "").trim())
     .filter((name) => /\.(png|jpe?g|webp|gif)$/i.test(name))
   } catch (_) {
    files = []
   }

   files.sort((a, b) => a.localeCompare(b, "fr", { sensitivity: "base", numeric: true }))
   return res.json({ ok: true, items: files })
  } catch (e) {
   console.error("[WEB] /api/game/craft-test-cards:", e)
   return res.status(500).json({ error: "Erreur serveur" })
  }
 })

 app.get("/api/game/craft-illustrations", (req, res) => {
  try {
   const session = requireSession(req, res)
   if (!session) return

   const folder = path.join(PUBLIC_DIR, "assets", "ui", "illustration craft")
   let items = []
   try {
    items = fs.readdirSync(folder, { withFileTypes: true })
     .filter((entry) => entry && entry.isFile && entry.isFile())
     .map((entry) => String(entry.name || "").trim())
     .filter((name) => /\.(png|jpe?g|webp)$/i.test(name))
     .map((name) => String(name).replace(/\.[^.]+$/i, ""))
     .filter(Boolean)
   } catch (_) {
    items = []
   }

   items.sort((a, b) => a.localeCompare(b, "fr", { sensitivity: "base", numeric: true }))
   return res.json({ ok: true, items })
  } catch (e) {
   console.error("[WEB] /api/game/craft-illustrations:", e)
   return res.status(500).json({ error: "Erreur serveur" })
  }
 })

 app.get("/api/game/meta", (req, res) => {
  try {
   const session = requireSession(req, res)
   if (!session) return

   const user = getUser(session.userId)
   const cards = getCards()
   const sets = getSets()

   const unlockedSets = (sets || [])
    .filter((set) => isSetUnlocked(user, set.id, cards))
    .map((set) => ({ id: String(set.id), name: String(set.name || set.id) }))

   const fusion = ["C", "U", "R", "SR", "HR", "UR", "S"].map((rarity) => ({
    rarity,
    cost: Number(FUSION_COST[rarity] || 0)
   }))
   const pityBySet = Object.fromEntries((sets || []).map((set) => {
    const setId = String(set.id)
    const p = user.pity?.[setId] || {}
    const ur = Number(p?.UR || 0)
    const s = Number(p?.S || 0)
    const ssr = Number(p?.SSR || 0)
    return [setId, {
     UR: ur,
     S: s,
     SSR: ssr,
     toGuaranteed: {
      UR: Math.max(0, 10 - ur),
      S: Math.max(0, 30 - s),
      SSR: Math.max(0, 50 - ssr)
     }
    }]
   }))

   res.json({
    packPrice: Number(PACK_PRICE || 0),
    packStock: Number(user.packs || 0),
    kamas: Number(user.kamas || 0),
    unlockedSets,
    fusion,
    pityBySet
   })
  } catch (e) {
   console.error("[WEB] /api/game/meta:", e)
   res.status(500).json({ error: "Erreur serveur" })
  }
 })

 app.get("/api/game/recruit-history", (req, res) => {
  try {
   const session = requireSession(req, res)
   if (!session) return

   const user = getUser(session.userId)
   const { page, limit } = parsePagination(req, 10, 100)
   const setId = String(req.query?.setId || req.query?.set || "").trim().toLowerCase()
   const payload = buildRecruitHistoryPayload(user, { setId, page, limit })

   if (payload.changed) {
    save(session.userId)
    invalidateUserCaches([session.userId], { invalidateLeaderboard: false })
   }

   res.json({
    ok: true,
    windowDays: 7,
    timezone: "UTC+2",
    setId: setId || null,
    total: payload.total,
    page: payload.page,
    pages: payload.pages,
    limit: payload.limit,
    items: payload.items
   })
  } catch (e) {
   console.error("[WEB] /api/game/recruit-history:", e)
   res.status(500).json({ error: "Erreur serveur" })
  }
 })

 app.get("/api/krosmoshop/state", (req, res) => {
  try {
   const session = resolveSession(req)
   const userId = session?.userId || null
   if (userId) {
    const user = getUser(String(userId))
    if (user) {
     recordShopView(user, Date.now())
     save(String(userId))
    }
   }
   const payload = buildKrosmoshopStatePayload(userId)
   res.json(payload)
  } catch (e) {
   console.error("[WEB] /api/krosmoshop/state:", e)
   res.status(500).json({ error: "Erreur serveur" })
  }
 })

 app.post("/api/krosmoshop/buy", (req, res) => {
  try {
   const session = requireSession(req, res)
   if (!session) return

   const cardId = String(req.body?.cardId || "").trim()
   if (!cardId) return res.status(400).json({ error: "cardId manquant." })

   const result = buyFromShop(session.userId, cardId)
   if (result?.error) return res.status(400).json({ error: String(result.error) })

   const user = getUser(session.userId)
   invalidateUserCaches([session.userId])

   res.json({
    ok: true,
    result: {
     cardId: String(cardId),
     rarity: String(result?.rarity || ""),
     price: Number(result?.price || 0),
     originalPrice: Number(result?.originalPrice || 0),
     isNew: Boolean(result?.isNew),
     cardInfo: result?.cardInfo || null
    },
    kamas: Number(user?.kamas || 0),
    unlockedAchievements: countUnlockedAchievements(result?.unlocked || []),
    state: buildKrosmoshopStatePayload(session.userId)
   })
  } catch (e) {
   console.error("[WEB] /api/krosmoshop/buy:", e)
   res.status(500).json({ error: "Erreur serveur" })
  }
 })

 app.post("/api/game/buy-packs", (req, res) => {
  try {
   const session = requireSession(req, res)
   if (!session) return

   const quantity = Math.max(1, Math.min(50, Number(req.body?.quantity || 1)))
   if (!Number.isInteger(quantity)) return res.status(400).json({ error: "Quantite invalide." })

   const user = getUser(session.userId)
   const totalCost = Number(PACK_PRICE || 0) * quantity
   if (Number(user.kamas || 0) < totalCost) {
    return res.status(400).json({ error: `Pas assez de kamas (${totalCost.toLocaleString("fr-FR")} requis).` })
   }

   user.kamas -= totalCost
   user.packs = Number(user.packs || 0) + quantity
   if (!user.stats) user.stats = {}
   user.stats.packsBought = Number(user.stats.packsBought || 0) + quantity
   user.stats.lastBulkBuy = quantity
   user.stats.maxBulkBuy = Math.max(Number(user.stats.maxBulkBuy || 0), quantity)
   if (quantity >= 2) {
    user.stats.multiPackBuys = Number(user.stats.multiPackBuys || 0) + 1
   }

   const unlocked = achievementCheck(user, "economy")
   save(session.userId)
   invalidateUserCaches([session.userId])

   res.json({
    ok: true,
    quantity,
    totalCost,
    packStock: Number(user.packs || 0),
    kamas: Number(user.kamas || 0),
    unlockedAchievements: countUnlockedAchievements(unlocked)
   })
  } catch (e) {
   console.error("[WEB] /api/game/buy-packs:", e)
   res.status(500).json({ error: "Erreur serveur" })
  }
 })

 app.post("/api/game/sell-card", (req, res) => {
  try {
   const session = requireSession(req, res)
   if (!session) return

   const cardId = String(req.body?.cardId || "").trim()
   if (!cardId) return res.status(400).json({ error: "cardId manquant." })

   const user = getUser(session.userId)
   const cards = getCards()
   const card = cards.find((row) => String(row.id) === cardId) || getSecretCardById(cardId)
   if (!card) return res.status(404).json({ error: "Carte introuvable." })
   if (isSecretCard(card)) return res.status(400).json({ error: "La carte SECRET ne peut pas etre vendue." })

   const qtyBefore = Number(user.cards?.[cardId] || 0)
   if (qtyBefore <= 0) return res.status(400).json({ error: "Tu ne possedes plus cette carte." })

   const rarity = String(card.rarity || "C").toUpperCase()
   const baseSellPrice = Number(SELL_PRICE[rarity] || 1)
   const sellMultiplier = getSeasonSellMultiplier()
   const sellBonusPercent = getSellBonusPercent(sellMultiplier)
   const gain = computeSellPrice(baseSellPrice, sellMultiplier)

   user.cards[cardId] = qtyBefore - 1
   if (user.cards[cardId] <= 0) delete user.cards[cardId]

   const kamasBefore = Number(user.kamas || 0)
   user.kamas = kamasBefore + gain

   if (!user.stats) user.stats = {}
   user.stats.cardsSold = Number(user.stats.cardsSold || 0) + 1

   const unlocked = achievementCheck(user, "economy")
   save(session.userId)
   invalidateUserCaches([session.userId])

   res.json({
    ok: true,
    sold: {
     cardId,
     cardName: String(card.name || `Carte ${cardId}`),
     rarity,
     gain,
     sellBonusPercent,
     remainingQty: Math.max(0, Number(user.cards?.[cardId] || 0)),
     kamasBefore,
     kamasAfter: Number(user.kamas || 0)
    },
    kamas: Number(user.kamas || 0),
    unlockedAchievements: countUnlockedAchievements(unlocked)
   })
  } catch (e) {
   console.error("[WEB] /api/game/sell-card:", e)
   res.status(500).json({ error: "Erreur serveur" })
  }
 })

 app.post("/api/game/open-packs", async (req, res) => {
  try {
   const session = requireSession(req, res)
   if (!session) return

   const quantity = Math.max(1, Math.min(25, Number(req.body?.quantity || 1)))
   const setId = String(req.body?.setId || "").trim()
   if (!Number.isInteger(quantity)) return res.status(400).json({ error: "Quantite invalide." })
   if (!setId) return res.status(400).json({ error: "setId manquant." })

   const user = getUser(session.userId)
   const cards = getCards()
   const sets = getSets()
   const setNames = getCardSetNameMap(sets)
   const activeSetName = String(setNames.get(setId) || setId)
   const validSetIds = new Set((sets || []).map((set) => String(set.id)))
   if (!validSetIds.has(setId)) return res.status(400).json({ error: "Set invalide." })
   if (!isSetUnlocked(user, setId, cards)) return res.status(400).json({ error: "Set verrouille pour ce profil." })

   const stock = Number(user.packs || 0)
   if (stock < quantity) return res.status(400).json({ error: "Packs insuffisants." })

   user.packs = stock - quantity
   if (!user.stats) user.stats = {}
   user.stats.packsOpened = Number(user.stats.packsOpened || 0) + quantity
   user.stats.krosmozOpened = Number(user.stats.krosmozOpened || 0) + quantity
   user.stats.lastBulkOpen = quantity
   user.stats.maxBulkOpen = Math.max(Number(user.stats.maxBulkOpen || 0), quantity)
   if (quantity >= 2) user.stats.multiPackOpens = Number(user.stats.multiPackOpens || 0) + 1

   const pulls = []
   let kamasGain = 0
   let xpGain = 0
   const rarityCount = {}
   const grouped = new Map()
   const fragments = []
   const discoveredCardIds = new Set()
   const revealCards = []

   for (let i = 0; i < quantity; i++) {
    const result = openPack(user, setId, session.userId, { isSimpleCommandOpen: quantity === 1 })
    kamasGain += Number(result?.kamasGain || 0)
    xpGain += Number(result?.xpGain || 0)
    if (result?.fragment) fragments.push(result.fragment)
    const discoveredThisPull = new Set((result?.discovered || []).map((card) => String(card?.id || "")))
    for (const discovered of (result?.discovered || [])) {
     if (!discovered?.id) continue
     discoveredCardIds.add(String(discovered.id))
    }

    for (const card of (result?.pack || [])) {
     if (isSecretCard(card)) continue
     const cardId = String(card?.id || "")
     const rarity = String(card?.rarity || "C")
     rarityCount[rarity] = Number(rarityCount[rarity] || 0) + 1
     const key = `${card.id}:${card.shiny ? 1 : 0}`
     revealCards.push({
      cardId,
      cardName: String(card?.name || `Carte ${card?.id}`),
      rarity,
      set: String(card?.set || setId),
      image: card?.image ? `/assets/cards/${encodeURIComponent(String(card.set || setId))}/${encodeURIComponent(String(card.image))}` : null,
      shiny: Boolean(card?.shiny),
      isNew: discoveredThisPull.has(cardId)
     })
     if (!grouped.has(key)) {
      grouped.set(key, {
       cardId,
       cardName: String(card.name || `Carte ${card.id}`),
       rarity,
       set: String(card.set || setId),
       image: card?.image ? `/assets/cards/${encodeURIComponent(String(card.set || setId))}/${encodeURIComponent(String(card.image))}` : null,
       shiny: Boolean(card?.shiny),
       isNew: false,
       qty: 0
      })
     }
     grouped.get(key).qty += 1
     if (discoveredCardIds.has(String(card.id))) grouped.get(key).isNew = true
    }

    pulls.push({
     luckyPack: Boolean(result?.luckyPack),
     best: result?.best ? {
      cardId: String(result.best.id),
      cardName: String(result.best.name || `Carte ${result.best.id}`),
      rarity: String(result.best.rarity || "C")
     } : null
    })
   }

   await addBattlePassXP(session.userId, "pack_open")
   appendRecruitHistoryEntries(user, [...grouped.values()].map((row) => ({
    setId,
    setName: activeSetName,
    itemName: String(row.cardName || `Carte ${row.cardId}`),
    recruitmentName: activeSetName,
    rarity: String(row.rarity || "C"),
    qty: Math.max(1, Number(row.qty || 1)),
    imageUrl: row.image ? String(row.image) : null
   })))
   const unlocked = [
    ...achievementCheck(user, "pack"),
    ...achievementCheck(user, "rng"),
    ...achievementCheck(user, "collection"),
    ...achievementCheck(user, "fragment")
   ]
   save(session.userId)
   invalidateUserCaches([session.userId])

   const pity = user.pity?.[setId] || { UR: 0, S: 0, SSR: 0 }
   const pityCounters = {
    UR: Number(pity?.UR || 0),
    S: Number(pity?.S || 0),
    SSR: Number(pity?.SSR || 0)
   }

   res.json({
    ok: true,
    quantity,
    setId,
    packStock: Number(user.packs || 0),
    kamas: Number(user.kamas || 0),
    totals: {
     kamasGain,
     xpGain,
     rarityCount,
     fragments: fragments.length
    },
    cards: [...grouped.values()].sort((a, b) =>
     RARITY_ORDER.indexOf(String(b.rarity)) - RARITY_ORDER.indexOf(String(a.rarity)) ||
     String(a.cardName).localeCompare(String(b.cardName), "fr")
    ),
    revealCards,
    pity: {
     counters: pityCounters,
     toGuaranteed: {
      UR: Math.max(0, 10 - pityCounters.UR),
      S: Math.max(0, 30 - pityCounters.S),
      SSR: Math.max(0, 50 - pityCounters.SSR)
     }
    },
    pulls,
    unlockedAchievements: countUnlockedAchievements(unlocked)
   })
  } catch (e) {
   console.error("[WEB] /api/game/open-packs:", e)
   res.status(500).json({ error: "Erreur serveur" })
  }
 })

 app.post("/api/game/fuse", async (req, res) => {
  try {
   const session = requireSession(req, res)
   if (!session) return

   const setId = String(req.body?.setId || "").trim()
   const rarity = normalizeRarity(req.body?.rarity)
   if (!setId) return res.status(400).json({ error: "setId manquant." })
   if (!rarity || rarity === "SSR") return res.status(400).json({ error: "Rareté invalide pour fusion." })

   const cost = Number(FUSION_COST[rarity] || 0)
   if (!cost) return res.status(400).json({ error: "Fusion indisponible pour cette rarete." })
   const targetRarity = getNextRarity(rarity)
   if (!targetRarity) return res.status(400).json({ error: "Rareté cible introuvable." })

   const user = getUser(session.userId)
   const cards = getCards()
   const sets = getSets()
   const validSetIds = new Set((sets || []).map((set) => String(set.id)))
   if (!validSetIds.has(setId)) return res.status(400).json({ error: "Set invalide." })
   if (!isSetUnlocked(user, setId, cards)) return res.status(400).json({ error: "Set verrouille pour ce profil." })

   const consumed = consumeDuplicatesForFusion(user, cards, setId, rarity, cost)
   if (!consumed.ok) {
    return res.status(400).json({
     error: "Doublons insuffisants pour fusion.",
     required: cost,
     available: consumed.available || 0
    })
   }

   const rewardPool = cards.filter((card) => String(card.set) === setId && String(card.rarity) === targetRarity)
   if (!rewardPool.length) {
    return res.status(400).json({ error: `Aucune carte ${targetRarity} dans ce set.` })
   }
   const reward = rewardPool[Math.floor(Math.random() * rewardPool.length)]

   if (!user.cards) user.cards = {}
   user.cards[reward.id] = Number(user.cards[reward.id] || 0) + 1

   if (!user.stats) user.stats = {}
   user.stats.fusions = Number(user.stats.fusions || 0) + 1

   const xp = 15
   try {
    addXP(user, xp)
   } catch (_) {}
   await addBattlePassXP(session.userId, "fusion")

   const unlocked = [
    ...achievementCheck(user, "fusion"),
    ...achievementCheck(user, "collection"),
    ...achievementCheck(user, "rng")
   ]
   save(session.userId)
   invalidateUserCaches([session.userId])

   res.json({
    ok: true,
    setId,
    fromRarity: rarity,
    toRarity: targetRarity,
    cost,
    reward: {
     cardId: String(reward.id),
     cardName: String(reward.name || `Carte ${reward.id}`),
     rarity: String(reward.rarity || targetRarity),
     set: String(reward.set || setId),
     imageUrl: reward?.image ? `/assets/cards/${encodeURIComponent(String(reward.set || setId))}/${encodeURIComponent(String(reward.image))}` : null
    },
    remainingDuplicates: Number(consumed.availableAfter || 0),
    xpGain: xp,
    unlockedAchievements: countUnlockedAchievements(unlocked)
   })
  } catch (e) {
   console.error("[WEB] /api/game/fuse:", e)
   res.status(500).json({ error: "Erreur serveur" })
  }
 })

 app.post("/api/game/craft", async (req, res) => {
  try {
   const session = requireSession(req, res)
   if (!session) return

   const cardId = String(req.body?.cardId || "").trim()
   if (!cardId) return res.status(400).json({ error: "cardId manquant." })

   const result = await craftFromFragments(session.userId, cardId)
   if (!result?.ok) {
    return res.status(400).json({
     error: result?.error || "Craft impossible.",
     progress: result?.progress || null
    })
   }

   const user = getUser(session.userId)
   const unlocked = [
    ...achievementCheck(user, "fragment"),
    ...achievementCheck(user, "collection"),
    ...achievementCheck(user, "rng")
   ]
   save(session.userId)
   invalidateUserCaches([session.userId])

   const crafted = result.card || {}
   res.json({
    ok: true,
    card: {
     cardId: String(crafted.id || cardId),
     cardName: String(crafted.name || `Carte ${cardId}`),
     rarity: String(crafted.rarity || "SSR"),
     set: String(crafted.set || "unknown"),
     imageUrl: crafted?.image ? `/assets/cards/${encodeURIComponent(String(crafted.set || "unknown"))}/${encodeURIComponent(String(crafted.image))}` : null
    },
    titleUnlocked: result.titleUnlocked || null,
    unlockedAchievements: countUnlockedAchievements(unlocked)
   })
  } catch (e) {
   console.error("[WEB] /api/game/craft:", e)
   res.status(500).json({ error: "Erreur serveur" })
  }
 })
}
