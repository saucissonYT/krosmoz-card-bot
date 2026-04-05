/* ═══════════════════════════════════════════════
   TESTS — systems/battlePassService.js
   Couvre : computeLevel, getLevelMinXP,
            getEndlessRewardForLevel,
            createDefaultProgress, XP curve
═══════════════════════════════════════════════ */

const assert = require("assert")

const {
 computeLevel,
 getEndlessRewardForLevel
} = require("../systems/battlePassService")

let passed = 0, failed = 0

function test(name, fn) {
 try { fn(); console.log(`  ✅ ${name}`); passed++ }
 catch (e) { console.error(`  ❌ ${name}\n     ${e.message}`); failed++ }
}

/* ── XP curve mock (40 levels) ── */
const xpCurve = []
let cumul = 0
for (let i = 0; i < 40; i++) {
 cumul += 100 + i * 25
 xpCurve.push(cumul)
}

console.log("\n══════ TESTS battlePassService.js ══════\n")

/* ── computeLevel ── */

test("computeLevel retourne 1 avec 0 XP", () => {
 assert.strictEqual(computeLevel(0, xpCurve, 40), 1)
})

test("computeLevel retourne 1 avec XP < premier palier", () => {
 assert.strictEqual(computeLevel(xpCurve[0] - 1, xpCurve, 40), 1)
})

test("computeLevel retourne 2 au premier palier exact", () => {
 assert.strictEqual(computeLevel(xpCurve[0], xpCurve, 40), 2)
})

test("computeLevel retourne le niveau max à la fin de la curve", () => {
 const maxXP = xpCurve[xpCurve.length - 1]
 const level = computeLevel(maxXP, xpCurve, 40)
 assert.strictEqual(level, 40, `devrait être 40 mais est ${level}`)
})

test("computeLevel est monotone croissant", () => {
 let prev = 0
 for (let xp = 0; xp <= xpCurve[xpCurve.length - 1] + 5000; xp += 500) {
  const level = computeLevel(xp, xpCurve, null)
  assert.ok(level >= prev, `level(${xp}) = ${level} >= ${prev}`)
  prev = level
 }
})

test("computeLevel dépasse 40 sans maxLevel (endless)", () => {
 const massiveXP = xpCurve[xpCurve.length - 1] + 50000
 const level = computeLevel(massiveXP, xpCurve, null)
 assert.ok(level > 40, `level ${level} > 40 en endless`)
})

test("computeLevel respecte maxLevel quand défini", () => {
 const massiveXP = xpCurve[xpCurve.length - 1] + 50000
 const level = computeLevel(massiveXP, xpCurve, 40)
 assert.strictEqual(level, 40)
})

test("computeLevel avec curve vide retourne 1", () => {
 assert.strictEqual(computeLevel(1000, [], 40), 1)
})

/* ── getEndlessRewardForLevel ── */

test("getEndlessRewardForLevel retourne null pour level ≤ 40", () => {
 for (let lvl = 1; lvl <= 40; lvl++) {
  assert.strictEqual(getEndlessRewardForLevel(lvl), null, `level ${lvl}`)
 }
})

test("getEndlessRewardForLevel retourne kamas pour level impair > 40", () => {
 const r = getEndlessRewardForLevel(41)
 assert.ok(r)
 assert.strictEqual(r.type, "kamas")
 assert.ok(r.value > 0)
})

test("getEndlessRewardForLevel retourne player_xp pour level pair > 40", () => {
 const r = getEndlessRewardForLevel(42)
 assert.ok(r)
 assert.strictEqual(r.type, "player_xp")
 assert.ok(r.value > 0)
})

test("getEndlessRewardForLevel alterne correctement sur 10 levels", () => {
 let kamasCount = 0, xpCount = 0
 for (let lvl = 41; lvl <= 50; lvl++) {
  const r = getEndlessRewardForLevel(lvl)
  assert.ok(r, `reward défini pour level ${lvl}`)
  if (r.type === "kamas") kamasCount++
  else if (r.type === "player_xp") xpCount++
 }
 assert.strictEqual(kamasCount, 5, "5 kamas sur 10 levels")
 assert.strictEqual(xpCount, 5, "5 XP sur 10 levels")
})

console.log(`\n══════ Résultats : ${passed} passed, ${failed} failed ══════\n`)
process.exit(failed > 0 ? 1 : 0)