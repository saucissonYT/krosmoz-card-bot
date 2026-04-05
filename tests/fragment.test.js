/* ═══════════════════════════════════════════════
   TESTS — systems/fragmentService.js
   Couvre : add, remove, hasAll, getMissing,
            distinct numbers, stats
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
 getFragmentsForCard, getDistinctFragmentNumbers, hasAllFragments,
 getMissingFragmentNumbers, addFragmentToInventory, removeFragment
} = require("../systems/fragmentService")
const { getUser, save } = require("../systems/userSystem")

let passed = 0, failed = 0

function test(name, fn) {
 try { fn(); console.log(`  ✅ ${name}`); passed++ }
 catch (e) { console.error(`  ❌ ${name}\n     ${e.message}`); failed++ }
}

function setupUser(id) {
 const u = getUser(id)
 u.fragments = []; u.stats = {}; u.cards = {}
 save(id); return u
}

console.log("\n══════ TESTS fragmentService.js ══════\n")

test("addFragmentToInventory ajoute un fragment", () => {
 setupUser("fu1")
 const r = addFragmentToInventory("fu1", { cardId: "36", fragmentNumber: 1, source: "pack" })
 assert.ok(r); assert.strictEqual(r.cardId, "36"); assert.strictEqual(r.fragmentNumber, 1)
})

test("addFragmentToInventory incrémente les stats", () => {
 setupUser("fu2")
 addFragmentToInventory("fu2", { cardId: "36", fragmentNumber: 2, source: "pack" })
 assert.ok(getUser("fu2").stats.fragmentsCollected >= 1)
})

test("addFragmentToInventory refuse numéro 0 et 6", () => {
 setupUser("fu3")
 assert.throws(() => addFragmentToInventory("fu3", { cardId: "36", fragmentNumber: 0 }))
 assert.throws(() => addFragmentToInventory("fu3", { cardId: "36", fragmentNumber: 6 }))
})

test("addFragmentToInventory accepte 1-5", () => {
 setupUser("fu4")
 for (let i = 1; i <= 5; i++) {
  const r = addFragmentToInventory("fu4", { cardId: "36", fragmentNumber: i, source: "test" })
  assert.strictEqual(r.fragmentNumber, i)
 }
})

test("getFragmentsForCard filtre par cardId", () => {
 setupUser("ff")
 addFragmentToInventory("ff", { cardId: "36", fragmentNumber: 1 })
 addFragmentToInventory("ff", { cardId: "37", fragmentNumber: 2 })
 addFragmentToInventory("ff", { cardId: "36", fragmentNumber: 3 })
 assert.strictEqual(getFragmentsForCard(getUser("ff"), "36").length, 2)
})

test("getFragmentsForCard retourne [] si aucun", () => {
 setupUser("fe")
 assert.strictEqual(getFragmentsForCard(getUser("fe"), "999").length, 0)
})

test("getDistinctFragmentNumbers retourne uniques triés", () => {
 setupUser("fd")
 addFragmentToInventory("fd", { cardId: "36", fragmentNumber: 3 })
 addFragmentToInventory("fd", { cardId: "36", fragmentNumber: 1 })
 addFragmentToInventory("fd", { cardId: "36", fragmentNumber: 3 })
 addFragmentToInventory("fd", { cardId: "36", fragmentNumber: 5 })
 assert.deepStrictEqual(getDistinctFragmentNumbers(getUser("fd"), "36"), [1, 3, 5])
})

test("hasAllFragments true quand 1-5 complet", () => {
 setupUser("fc")
 for (let i = 1; i <= 5; i++) addFragmentToInventory("fc", { cardId: "36", fragmentNumber: i })
 assert.strictEqual(hasAllFragments(getUser("fc"), "36"), true)
})

test("hasAllFragments false quand incomplet", () => {
 setupUser("fi")
 for (let i = 1; i <= 3; i++) addFragmentToInventory("fi", { cardId: "36", fragmentNumber: i })
 assert.strictEqual(hasAllFragments(getUser("fi"), "36"), false)
})

test("getMissingFragmentNumbers retourne les manquants", () => {
 setupUser("fm")
 addFragmentToInventory("fm", { cardId: "36", fragmentNumber: 1 })
 addFragmentToInventory("fm", { cardId: "36", fragmentNumber: 4 })
 assert.deepStrictEqual(getMissingFragmentNumbers(getUser("fm"), "36"), [2, 3, 5])
})

test("getMissingFragmentNumbers retourne [1,2,3,4,5] si vide", () => {
 setupUser("fn")
 assert.deepStrictEqual(getMissingFragmentNumbers(getUser("fn"), "36"), [1, 2, 3, 4, 5])
})

test("removeFragment retire un fragment spécifique", () => {
 setupUser("fr")
 addFragmentToInventory("fr", { cardId: "36", fragmentNumber: 2 })
 addFragmentToInventory("fr", { cardId: "36", fragmentNumber: 4 })
 const user = getUser("fr")
 removeFragment(user, "36", 2)
 assert.deepStrictEqual(getDistinctFragmentNumbers(user, "36"), [4])
})

console.log(`\n══════ Résultats : ${passed} passed, ${failed} failed ══════\n`)
process.exit(failed > 0 ? 1 : 0)