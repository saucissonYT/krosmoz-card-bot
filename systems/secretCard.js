const SECRET_RARITY = "SECRET"
const SECRET_DROP_RATE = 0.00001 // 0.001%

const SECRET_CARDS = [
 {
  id: 990001,
  name: "ZAKI",
  rarity: SECRET_RARITY,
  set: "secret",
  image: "secret_zaki.png"
 },
 {
  id: 990002,
  name: "ToT",
  rarity: SECRET_RARITY,
  set: "secret",
  image: "secret_tot.png"
 }
]

// Compat: certains modules utilisent encore SECRET_CARD (carte secrète "par défaut")
const SECRET_CARD = SECRET_CARDS[0]

function isSecretCard(card){
 return String(card?.rarity || "").toUpperCase() === SECRET_RARITY
}

function getSecretCardById(cardId){
 const found = SECRET_CARDS.find((card) => Number(card?.id) === Number(cardId))
 return found || null
}

function ensureSecretCard(cards = []){
 if(!Array.isArray(cards)) return SECRET_CARDS.map((card) => ({ ...card }))

 const safeCards = [...cards]
 const existingIds = new Set(safeCards.map((card) => String(card?.id || "")))

 for(const secret of SECRET_CARDS){
  if(existingIds.has(String(secret.id))) continue
  safeCards.push({ ...secret })
 }

 return safeCards
}

function pickSecretCard(cards = []){
 if(!Array.isArray(cards)) return null
 const pool = cards.filter(isSecretCard)
 if(pool.length === 0) return null
 const card = pool[Math.floor(Math.random() * pool.length)]
 return card ? { ...card, shiny: false } : null
}

function injectSecretDrop(pack = [], cards = [], chance = SECRET_DROP_RATE){
 if(!Array.isArray(pack) || pack.length === 0) return { pack, dropped: false }
 if(Math.random() >= chance) return { pack, dropped: false }

 const secretCard = pickSecretCard(cards)
 if(!secretCard) return { pack, dropped: false }

 const index = Math.floor(Math.random() * pack.length)
 const nextPack = [...pack]
 nextPack[index] = secretCard

 return {
  pack: nextPack,
  dropped: true,
  secretCard
 }
}

module.exports = {
 SECRET_RARITY,
 SECRET_DROP_RATE,
 SECRET_CARDS,
 SECRET_CARD,
 isSecretCard,
 getSecretCardById,
 ensureSecretCard,
 pickSecretCard,
 injectSecretDrop
}
