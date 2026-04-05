/* ═══════════════════════════════════════════════
   TESTS — systems/economy.js
   Couvre : rewardKamas, prix par rareté, stats
═══════════════════════════════════════════════ */

const assert = require("assert")

const { rewardKamas } = require("../systems/economy")
const { RARITY_PRICE, SELL_PRICE, FUSION_COST, RARITY_ORDER } = require("../systems/constants")

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

console.log("\n══════ TESTS economy.js ══════\n")

/* ── rewardKamas ── */

test("rewardKamas ajoute les kamas au user", () => {
 const user = { kamas: 0, stats: {} }
 const gain = rewardKamas(user, "C")
 assert.ok(gain > 0, "gain positif")
 assert.strictEqual(user.kamas, gain, "kamas ajoutés")
})

test("rewardKamas accumule les kamas", () => {
 const user = { kamas: 100, stats: {} }
 rewardKamas(user, "SSR")
 assert.ok(user.kamas > 100, "kamas accumulés")
})

test("rewardKamas met à jour les stats", () => {
 const user = { kamas: 0, stats: {} }
 rewardKamas(user, "R")
 assert.ok(user.stats.kamasEarned > 0, "kamasEarned mis à jour")
})

test("rewardKamas retourne 0 pour rareté invalide", () => {
 const user = { kamas: 0, stats: {} }
 const gain = rewardKamas(user, "INEXISTANT")
 assert.strictEqual(gain, 0, "gain = 0 pour rareté inconnue")
 assert.strictEqual(user.kamas, 0, "kamas inchangés")
})

test("rewardKamas crée user.stats si absent", () => {
 const user = { kamas: 0 }
 rewardKamas(user, "C")
 assert.ok(user.stats, "stats créé")
})

/* ── Constants cohérence ── */

test("RARITY_PRICE existe pour chaque rareté", () => {
 for (const r of RARITY_ORDER) {
  assert.ok(RARITY_PRICE[r] !== undefined, `RARITY_PRICE[${r}] défini`)
  assert.ok(RARITY_PRICE[r] > 0, `RARITY_PRICE[${r}] > 0`)
 }
})

test("SELL_PRICE <= RARITY_PRICE pour chaque rareté", () => {
 for (const r of RARITY_ORDER) {
  assert.ok(SELL_PRICE[r] <= RARITY_PRICE[r],
   `SELL_PRICE[${r}] (${SELL_PRICE[r]}) <= RARITY_PRICE[${r}] (${RARITY_PRICE[r]})`)
 }
})

test("RARITY_PRICE est croissant par rareté", () => {
 for (let i = 1; i < RARITY_ORDER.length; i++) {
  const prev = RARITY_PRICE[RARITY_ORDER[i - 1]]
  const curr = RARITY_PRICE[RARITY_ORDER[i]]
  assert.ok(curr >= prev,
   `${RARITY_ORDER[i]} (${curr}) >= ${RARITY_ORDER[i-1]} (${prev})`)
 }
})

test("FUSION_COST existe pour C à S (pas SSR)", () => {
 const fusable = ["C","U","R","SR","HR","UR","S"]
 for (const r of fusable) {
  assert.ok(FUSION_COST[r] !== undefined, `FUSION_COST[${r}] défini`)
  assert.ok(FUSION_COST[r] >= 1, `FUSION_COST[${r}] >= 1`)
 }
 assert.strictEqual(FUSION_COST["SSR"], undefined, "pas de fusion SSR")
})

test("FUSION_COST est croissant", () => {
 const fusable = ["C","U","R","SR","HR","UR","S"]
 for (let i = 1; i < fusable.length; i++) {
  assert.ok(FUSION_COST[fusable[i]] >= FUSION_COST[fusable[i-1]],
   `${fusable[i]} >= ${fusable[i-1]}`)
 }
})

/* ── Résultats ── */

console.log(`\n══════ Résultats : ${passed} passed, ${failed} failed ══════\n`)
process.exit(failed > 0 ? 1 : 0)