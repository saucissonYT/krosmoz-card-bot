/* Routes: /api/cards, /api/cards/:id/image */

const fs = require("fs")
const path = require("path")

module.exports = function mount(app, ctx) {
 const {
  requireSession, parsePagination, computeCardsCatalog,
  getCards, canEditCards, sanitizeCardImageName,
  parseImageDataUrl, splitImageFileName,
  buildUniqueImageFileName, buildRandomImageFileName,
  saveCards, CARD_IMAGES_RUNTIME_DIR, apiCache
 } = ctx

 app.get("/api/cards", (req, res) => {
  try {
   const { page, limit, offset } = parsePagination(req, 24, 100)
   const result = computeCardsCatalog(req.query)
   const items = result.items.slice(offset, offset + limit)
   const pages = Math.max(1, Math.ceil(result.total / limit))

   res.json({
    total: result.total,
    page,
    pages,
    limit,
    items
   })
  } catch (e) {
   console.error("[WEB] /api/cards:", e)
   res.status(500).json({ error: "Erreur serveur" })
  }
 })

 app.post("/api/cards/:id/image", (req, res) => {
  try {
   const session = requireSession(req, res)
   if (!session) return
   if (!canEditCards(session)) {
    return res.status(403).json({ error: "Acces reserve au dev du site." })
   }

   const cardId = String(req.params.id || "").trim()
   if (!cardId) {
    return res.status(400).json({ error: "ID de carte invalide." })
   }

   const cards = getCards()
   const index = cards.findIndex((card) => String(card?.id || "") === cardId)
   if (index < 0) {
    return res.status(404).json({ error: "Carte introuvable." })
   }

   const currentCard = cards[index] || {}
   const setId = String(currentCard?.set || "unknown").trim() || "unknown"
   const safeSetId = (!setId.includes("..") && !/[\\/]/.test(setId)) ? setId : "unknown"
   const setKey = String(safeSetId || "").toLowerCase()
   const isImageUsedByAnotherCard = (imageName) => cards.some((card, idx) => {
    if (idx === index) return false
    const cardSet = String(card?.set || "").toLowerCase()
    const cardImage = String(card?.image || "").toLowerCase()
    return cardSet === setKey && cardImage === String(imageName || "").toLowerCase()
   })
   let image = sanitizeCardImageName(req.body?.image)

   if (!image) {
    const parsedUpload = parseImageDataUrl(req.body?.imageDataUrl)
    if (!parsedUpload) {
     return res.status(400).json({ error: "Nom de fichier ou image upload invalide." })
    }
    if (parsedUpload.buffer.length > (5 * 1024 * 1024)) {
      return res.status(400).json({ error: "Image trop lourde (max 5 Mo)." })
    }

    const setDir = path.join(CARD_IMAGES_RUNTIME_DIR, safeSetId)
    fs.mkdirSync(setDir, { recursive: true })
    image = buildRandomImageFileName(cardId, parsedUpload.ext, (candidate) => (
     isImageUsedByAnotherCard(candidate) || fs.existsSync(path.join(setDir, candidate))
    ))
    fs.writeFileSync(path.join(setDir, image), parsedUpload.buffer)
   } else if (isImageUsedByAnotherCard(image)) {
    const split = splitImageFileName(image)
    const suggestion = split
     ? buildUniqueImageFileName(split.base, split.ext, isImageUsedByAnotherCard)
     : null
    return res.status(409).json({
     error: "Nom de fichier deja utilise par une autre carte du meme set.",
     suggestion
    })
   }

   const nextCards = cards.map((card, idx) => (
    idx === index ? { ...card, image } : card
   ))

   saveCards(nextCards)
   apiCache.invalidatePrefix("inventory:")
   apiCache.invalidatePrefix("profile:")

   return res.json({
    ok: true,
    card: {
     id: String(nextCards[index]?.id || cardId),
     set: String(nextCards[index]?.set || ""),
     image: String(nextCards[index]?.image || ""),
     imageUrl: `/assets/cards/${encodeURIComponent(safeSetId)}/${encodeURIComponent(String(nextCards[index]?.image || ""))}`
     }
    })
  } catch (e) {
   console.error("[WEB] /api/cards/:id/image:", e)
   return res.status(500).json({ error: "Erreur serveur" })
  }
 })

 app.delete("/api/cards/:id/image", (req, res) => {
  try {
   const session = requireSession(req, res)
   if (!session) return
   if (!canEditCards(session)) {
    return res.status(403).json({ error: "Acces reserve au dev du site." })
   }

   const cardId = String(req.params.id || "").trim()
   if (!cardId) {
    return res.status(400).json({ error: "ID de carte invalide." })
   }

   const cards = getCards()
   const index = cards.findIndex((card) => String(card?.id || "") === cardId)
   if (index < 0) {
    return res.status(404).json({ error: "Carte introuvable." })
   }

   const nextCards = cards.map((card, idx) => (
    idx === index ? { ...card, image: "" } : card
   ))

   saveCards(nextCards)
   apiCache.invalidatePrefix("inventory:")
   apiCache.invalidatePrefix("profile:")

   return res.json({
    ok: true,
    card: {
     id: String(nextCards[index]?.id || cardId),
     set: String(nextCards[index]?.set || ""),
     image: "",
     imageUrl: null
    }
   })
  } catch (e) {
   console.error("[WEB] DELETE /api/cards/:id/image:", e)
   return res.status(500).json({ error: "Erreur serveur" })
  }
 })
}
