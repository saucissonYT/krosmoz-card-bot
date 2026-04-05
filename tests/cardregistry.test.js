/* ═══════════════════════════════════════════════
   TESTS — systems/cardRegistry.js
   Couvre : getCards, getCard, getCardsBySet,
            getCardsById, resetRegistry
═══════════════════════════════════════════════ */

const assert = require("assert")

const dataManager = require("../systems/dataManager")

const RARITIES = ["C","U","R","SR","HR","UR","S","SSR"]
const SETS = ["incarnam", "astrub", "amakna"]
const mockCards = []
let cardId = 1
for (const set of SETS) {
 for (const rarity of RARITIES) {
  for (let i = 0; i < 3; i++) {
   mockCards.push({ id: cardId++, name: `${set}_${rarity}_${i}`, set, rarity })
  }
 }
}
dataManager.data.cards = mockCards

const {
 getCards, getCard, getCardsBySet, getCardsById, resetRegistry
} = require("../systems/cardRegistry")

resetRegistry()

let passed = 0, failed = 0

function test(name, fn) {
 try { fn(); console.log(`  ✅ ${name}`); passed++ }
 catch (e) { console.error(`  ❌ ${name}\n     ${e.message}`); failed++ }
}

console.log("\n══════ TESTS cardRegistry.js ══════\n")

test("getCards retourne toutes les cartes", () => {
 const cards = getCards()
 assert.ok(Array.isArray(cards))
 assert.strictEqual(cards.length, mockCards.length)
})

test("getCard retourne une carte par id", () => {
 const card = getCard(1)
 assert.ok(card)
 assert.strictEqual(card.id, 1)
})

test("getCard retourne undefined pour un id inexistant", () => {
 const card = getCard(99999)
 assert.strictEqual(card, undefined)
})

test("getCardsBySet filtre par set", () => {
 const cards = getCardsBySet("incarnam")
 assert.ok(cards.length > 0)
 cards.forEach(c => assert.strictEqual(c.set, "incarnam"))
})

test("getCardsBySet retourne [] pour un set inexistant", () => {
 const cards = getCardsBySet("set_inexistant")
 assert.strictEqual(cards.length, 0)
})

test("getCardsById retourne un objet indexé par id", () => {
 const byId = getCardsById()
 assert.ok(typeof byId === "object")
 assert.ok(byId["1"], "carte id=1 présente")
 assert.strictEqual(byId["1"].id, 1)
})

test("getCardsById contient toutes les cartes", () => {
 const byId = getCardsById()
 assert.strictEqual(Object.keys(byId).length, mockCards.length)
})

test("chaque carte a id, name, set, rarity", () => {
 const cards = getCards()
 for (const card of cards) {
  assert.ok(card.id !== undefined, "id défini")
  assert.ok(card.name, "name défini")
  assert.ok(card.set, "set défini")
  assert.ok(card.rarity, "rarity défini")
 }
})

test("resetRegistry recharge les cartes", () => {
 const before = getCards().length
 resetRegistry()
 const after = getCards().length
 assert.strictEqual(before, after, "même nombre après reset")
})

test("les 3 sets mock ont le bon nombre de cartes", () => {
 for (const set of SETS) {
  const cards = getCardsBySet(set)
  assert.strictEqual(cards.length, RARITIES.length * 3,
   `${set} : ${RARITIES.length * 3} cartes attendues`)
 }
})

console.log(`\n══════ Résultats : ${passed} passed, ${failed} failed ══════\n`)
process.exit(failed > 0 ? 1 : 0)