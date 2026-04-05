/* ═══════════════════════════════════════════════
   TESTS — systems/userDefaults.js
   Couvre : ensureUserStructure, valeurs par défaut,
            préservation des données existantes
═══════════════════════════════════════════════ */

const assert = require("assert")

const { ensureUserStructure } = require("../systems/userDefaults")

let passed = 0, failed = 0

function test(name, fn) {
 try { fn(); console.log(`  ✅ ${name}`); passed++ }
 catch (e) { console.error(`  ❌ ${name}\n     ${e.message}`); failed++ }
}

console.log("\n══════ TESTS userDefaults.js ══════\n")

test("ensureUserStructure initialise un objet vide", () => {
 const user = {}
 ensureUserStructure(user)
 assert.ok(typeof user.kamas === "number")
 assert.ok(typeof user.cards === "object")
 assert.ok(Array.isArray(user.achievements))
 assert.ok(Array.isArray(user.titles))
 assert.ok(typeof user.stats === "object")
 assert.ok(typeof user.pity === "object")
})

test("ensureUserStructure préserve les kamas existants", () => {
 const user = { kamas: 5000 }
 ensureUserStructure(user)
 assert.strictEqual(user.kamas, 5000)
})

test("ensureUserStructure préserve les cartes existantes", () => {
 const user = { cards: { "1": 3, "2": 1 } }
 ensureUserStructure(user)
 assert.strictEqual(user.cards["1"], 3)
 assert.strictEqual(user.cards["2"], 1)
})

test("ensureUserStructure crée la progression si absente", () => {
 const user = {}
 ensureUserStructure(user)
 assert.ok(user.progression)
 assert.strictEqual(user.progression.level, 1)
 assert.strictEqual(user.progression.xp, 0)
})

test("ensureUserStructure préserve la progression existante", () => {
 const user = { progression: { level: 42, xp: 999, totalXp: 12345 } }
 ensureUserStructure(user)
 assert.strictEqual(user.progression.level, 42)
 assert.strictEqual(user.progression.xp, 999)
})

test("ensureUserStructure crée les fragments si absents", () => {
 const user = {}
 ensureUserStructure(user)
 assert.ok(Array.isArray(user.fragments))
})

test("ensureUserStructure préserve les fragments existants", () => {
 const user = { fragments: [{ cardId: "1", fragmentNumber: 3 }] }
 ensureUserStructure(user)
 assert.strictEqual(user.fragments.length, 1)
 assert.strictEqual(user.fragments[0].cardId, "1")
})

test("ensureUserStructure crée les cooldowns si absents", () => {
 const user = {}
 ensureUserStructure(user)
 assert.ok(typeof user.cooldowns === "object")
})

test("ensureUserStructure initialise le titre par défaut", () => {
 const user = {}
 ensureUserStructure(user)
 assert.ok(user.titles.includes("Nouveau"))
})

test("ensureUserStructure ne duplique pas le titre Nouveau", () => {
 const user = { titles: ["Nouveau", "Champion"] }
 ensureUserStructure(user)
 const count = user.titles.filter(t => t === "Nouveau").length
 assert.strictEqual(count, 1)
})

console.log(`\n══════ Résultats : ${passed} passed, ${failed} failed ══════\n`)
process.exit(failed > 0 ? 1 : 0)