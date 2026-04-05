/* ═══════════════════════════════════════════════
   TESTS — systems/market.js
   Couvre : addListing, buyCard, removeListing,
            fragments, prix, validations
═══════════════════════════════════════════════ */

const assert = require("assert")

const dataManager = require("../systems/dataManager")
const mockCards = []
let cardId = 1
for (const rarity of ["C","U","R","SR","HR","UR","S","SSR"]) {
 for (let i = 0; i < 5; i++) {
  mockCards.push({ id: cardId++, name: `card_${rarity}_${i}`, set: "incarnam", rarity })
 }
}
dataManager.data.cards = mockCards
const { resetRegistry } = require("../systems/cardRegistry")
resetRegistry()

const {
 addListing, buyCard, removeListing, addFragmentListing,
 getMarket, getUserListings, getListingType, FRAGMENT_MIN_PRICE
} = require("../systems/market")
const { getUser, save } = require("../systems/userSystem")

let passed = 0, failed = 0

function test(name, fn) {
 try { fn(); console.log(`  ✅ ${name}`); passed++ }
 catch (e) { console.error(`  ❌ ${name}\n     ${e.message}`); failed++ }
}

function setupUser(id, o = {}) {
 const u = getUser(id)
 u.kamas = o.kamas ?? 10000; u.cards = o.cards ?? {}
 u.fragments = o.fragments ?? []; u.stats = o.stats ?? {}
 save(id); return u
}

console.log("\n══════ TESTS market.js ══════\n")

test("addListing crée une annonce valide", () => {
 setupUser("s1", { cards: { "1": 3 } })
 const r = addListing("s1", "1", 500)
 assert.ok(r.id); assert.strictEqual(r.seller, "s1"); assert.strictEqual(r.price, 500)
})

test("addListing retire la carte du vendeur", () => {
 const u = setupUser("s2", { cards: { "2": 2 } })
 addListing("s2", "2", 300)
 assert.strictEqual(u.cards["2"], 1)
})

test("addListing refuse si pas de carte", () => {
 setupUser("s3", { cards: {} })
 assert.ok(addListing("s3", "1", 500).error)
})

test("addListing refuse prix ≤ 0", () => {
 setupUser("s4", { cards: { "1": 5 } })
 assert.ok(addListing("s4", "1", 0).error)
 assert.ok(addListing("s4", "1", -10).error)
})

test("buyCard transfère carte et kamas", () => {
 setupUser("bs", { cards: { "3": 2 }, kamas: 5000 })
 const l = addListing("bs", "3", 1000)
 if (l.error) { assert.fail("listing: " + l.error); return }
 setupUser("b1", { kamas: 5000 })
 const r = buyCard("b1", l.id)
 assert.ok(r.success)
 assert.ok(getUser("b1").cards["3"] >= 1)
 assert.ok(getUser("b1").kamas < 5000)
})

test("buyCard refuse si kamas insuffisants", () => {
 setupUser("rs", { cards: { "4": 2 }, kamas: 5000 })
 const l = addListing("rs", "4", 9999)
 if (l.error) { assert.fail("listing failed"); return }
 setupUser("pb", { kamas: 100 })
 assert.ok(buyCard("pb", l.id).error)
})

test("buyCard refuse d'acheter sa propre annonce", () => {
 setupUser("sb", { cards: { "5": 2 }, kamas: 10000 })
 const l = addListing("sb", "5", 500)
 if (l.error) { assert.fail("listing failed"); return }
 assert.ok(buyCard("sb", l.id).error)
})

test("buyCard refuse un id inexistant", () => {
 setupUser("bx", { kamas: 10000 })
 assert.ok(buyCard("bx", 999999).error)
})

test("removeListing restitue la carte au vendeur", () => {
 setupUser("rm1", { cards: { "6": 2 } })
 const l = addListing("rm1", "6", 800)
 if (l.error) { assert.fail("listing failed"); return }
 const before = getUser("rm1").cards["6"] || 0
 assert.ok(removeListing("rm1", l.id).success)
 assert.strictEqual(getUser("rm1").cards["6"], before + 1)
})

test("removeListing refuse si pas le vendeur", () => {
 setupUser("rm2", { cards: { "7": 2 } })
 const l = addListing("rm2", "7", 500)
 if (l.error) { assert.fail("listing failed"); return }
 setupUser("other")
 assert.ok(removeListing("other", l.id).error)
})

test("removeListing refuse un id inexistant", () => {
 assert.ok(removeListing("anyone", 999999).error)
})

test("getMarket retourne un tableau", () => {
 assert.ok(Array.isArray(getMarket()))
})

test("getUserListings filtre par vendeur", () => {
 setupUser("fs", { cards: { "8": 5 } })
 addListing("fs", "8", 100); addListing("fs", "8", 200)
 const list = getUserListings("fs")
 assert.ok(list.length >= 2)
 list.forEach(l => assert.strictEqual(l.seller, "fs"))
})

test("getListingType identifie card vs fragment", () => {
 assert.strictEqual(getListingType({ type: "card" }), "card")
 assert.strictEqual(getListingType({ type: "fragment" }), "fragment")
 assert.strictEqual(getListingType({}), "card")
})

test("addFragmentListing refuse numéro hors 1-5", () => {
 setupUser("frs", { fragments: [{ cardId: "1", fragmentNumber: 1, source: "pack" }] })
 assert.ok(addFragmentListing("frs", "1", 0, 500).error)
 assert.ok(addFragmentListing("frs", "1", 6, 500).error)
})

console.log(`\n══════ Résultats : ${passed} passed, ${failed} failed ══════\n`)
process.exit(failed > 0 ? 1 : 0)