/* ═══════════════════════════════════════════════
   TESTS — systems/pack.js
   Couvre : rollRarity, pity SSR/S/UR, hard pity,
            lucky pack, structure du résultat
═══════════════════════════════════════════════ */

const assert = require("assert")

/* ── Mock cardRegistry ── */
const mockCards = []
const RARITIES = ["C","U","R","SR","HR","UR","S","SSR"]
let cardId = 1
for (const set of ["incarnam","astrub"]) {
 for (const rarity of RARITIES) {
  for (let i = 0; i < 5; i++) {
   mockCards.push({ id: cardId++, name: `${set}_${rarity}_${i}`, set, rarity })
  }
 }
}

/* Inject mock avant le require */
const dataManager = require("../systems/dataManager")
dataManager.data.cards = mockCards
const { resetRegistry } = require("../systems/cardRegistry")
resetRegistry()

const { generatePack } = require("../systems/pack")

let passed = 0
let failed = 0

function test(name, fn) {
 try {
  fn()
  console.log(`  ✅ ${name}`)
  passed++
 } catch (e) {
  console.error(`  ❌ ${name}`)
  console.error(`     ${e.message}`)
  failed++
 }
}

console.log("\n══════ TESTS pack.js ══════\n")

/* ── Structure du résultat ── */

test("generatePack retourne un objet avec pack et luckyPack", () => {
 const user = { pity: {} }
 const result = generatePack(user, "incarnam")
 assert.ok(result, "résultat défini")
 assert.ok(Array.isArray(result.pack), "pack est un tableau")
 assert.strictEqual(typeof result.luckyPack, "boolean", "luckyPack est un booléen")
})

test("pack contient 5 ou 6 cartes (lucky)", () => {
 const user = { pity: {} }
 const result = generatePack(user, "incarnam")
 assert.ok(result.pack.length >= 5, "au moins 5 cartes")
 assert.ok(result.pack.length <= 6, "max 6 cartes (lucky)")
})

test("chaque carte a id, name, set, rarity", () => {
 const user = { pity: {} }
 const result = generatePack(user, "incarnam")
 for (const card of result.pack) {
  assert.ok(card.id, "carte a un id")
  assert.ok(card.name, "carte a un name")
  assert.ok(card.set, "carte a un set")
  assert.ok(card.rarity, "carte a une rarity")
  assert.ok(RARITIES.includes(card.rarity), `rarity valide: ${card.rarity}`)
 }
})

/* ── Pity initialisation ── */

test("pity est initialisé si absent", () => {
 const user = { pity: {} }
 generatePack(user, "incarnam")
 assert.ok(user.pity.incarnam, "pity.incarnam créé")
 assert.strictEqual(typeof user.pity.incarnam.SSR, "number")
 assert.strictEqual(typeof user.pity.incarnam.S, "number")
 assert.strictEqual(typeof user.pity.incarnam.UR, "number")
})

/* ── Hard pity SSR ── */

test("hard pity SSR à 50 packs : une SSR garantie", () => {
 const user = { pity: { incarnam: { SSR: 49, S: 0, UR: 0 } } }
 const result = generatePack(user, "incarnam")
 const hasSSR = result.pack.some(c => c.rarity === "SSR")
 assert.ok(hasSSR, "SSR doit être présente au hard pity 50")
})

test("hard pity SSR reset le compteur à 0", () => {
 const user = { pity: { incarnam: { SSR: 49, S: 10, UR: 5 } } }
 generatePack(user, "incarnam")
 assert.strictEqual(user.pity.incarnam.SSR, 0, "SSR pity reset")
 assert.strictEqual(user.pity.incarnam.S, 0, "S pity reset aussi")
 assert.strictEqual(user.pity.incarnam.UR, 0, "UR pity reset aussi")
})

/* ── Hard pity S ── */

test("hard pity S à 30 packs : une S garantie", () => {
 const user = { pity: { incarnam: { SSR: 10, S: 29, UR: 0 } } }
 const result = generatePack(user, "incarnam")
 const hasSorHigher = result.pack.some(c =>
  ["S","SSR"].includes(c.rarity)
 )
 assert.ok(hasSorHigher, "S ou SSR doit être présente au hard pity S 30")
})

/* ── Hard pity UR ── */

test("hard pity UR à 10 packs : une UR garantie", () => {
 const user = { pity: { incarnam: { SSR: 5, S: 5, UR: 9 } } }
 const result = generatePack(user, "incarnam")
 const hasURorHigher = result.pack.some(c =>
  ["UR","S","SSR"].includes(c.rarity)
 )
 assert.ok(hasURorHigher, "UR+ doit être présente au hard pity UR 10")
})

/* ── Pity incrémente ── */

test("pity SSR incrémente si pas de SSR dans le pack", () => {
 /* On force un pity bas pour quasi-aucune chance de SSR */
 const user = { pity: { incarnam: { SSR: 0, S: 0, UR: 0 } } }
 /* On fait plusieurs packs, au moins un devrait incrémenter */
 let incremented = false
 for (let i = 0; i < 20; i++) {
  const before = user.pity.incarnam.SSR
  generatePack(user, "incarnam")
  if (user.pity.incarnam.SSR > 0) {
   incremented = true
   break
  }
 }
 assert.ok(incremented, "pity SSR devrait incrémenter quand pas de SSR")
})

/* ── Set vide ── */

test("set inexistant retourne pack vide", () => {
 const user = { pity: {} }
 const result = generatePack(user, "set_qui_existe_pas")
 assert.strictEqual(result.pack.length, 0, "pack vide pour set inexistant")
})

/* ── Distribution statistique (smoke test) ── */

test("sur 1000 packs, C est la rareté la plus fréquente", () => {
 const counts = { C:0, U:0, R:0, SR:0, HR:0, UR:0, S:0, SSR:0 }
 for (let i = 0; i < 1000; i++) {
  const user = { pity: {} }
  const result = generatePack(user, "incarnam")
  for (const card of result.pack) {
   counts[card.rarity]++
  }
 }
 assert.ok(counts.C > counts.SSR, `C (${counts.C}) > SSR (${counts.SSR})`)
 assert.ok(counts.C > counts.S, `C (${counts.C}) > S (${counts.S})`)
 assert.ok(counts.U > counts.UR, `U (${counts.U}) > UR (${counts.UR})`)
})

/* ── Pity key custom ── */

test("pityKey custom fonctionne", () => {
 const user = { pity: {} }
 generatePack(user, "incarnam", { pityKey: "custom_key" })
 assert.ok(user.pity.custom_key, "pity créé avec la clé custom")
})

/* ── Résultats ── */

console.log(`\n══════ Résultats : ${passed} passed, ${failed} failed ══════\n`)
process.exit(failed > 0 ? 1 : 0)