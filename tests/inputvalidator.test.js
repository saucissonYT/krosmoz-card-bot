/* ═══════════════════════════════════════════════
   TESTS — systems/inputValidator.js
   Couvre : validateUserId, validateAmount,
            validateCardId, validateGuildName,
            validateSetId, validateRarity
═══════════════════════════════════════════════ */

const assert = require("assert")

const {
 validateUserId,
 validateCardId,
 validateAmount,
 validateGuildName,
 validateSetId,
 validateRarity
} = require("../systems/inputValidator")

let passed = 0, failed = 0

function test(name, fn) {
 try { fn(); console.log(`  ✅ ${name}`); passed++ }
 catch (e) { console.error(`  ❌ ${name}\n     ${e.message}`); failed++ }
}

console.log("\n══════ TESTS inputValidator.js ══════\n")

/* ── validateUserId ── */

test("validateUserId accepte un ID Discord valide (17-20 chiffres)", () => {
 assert.strictEqual(validateUserId("12345678901234567").valid, true)
 assert.strictEqual(validateUserId("123456789012345678").valid, true)
 assert.strictEqual(validateUserId("12345678901234567890").valid, true)
})

test("validateUserId refuse un ID trop court", () => {
 assert.strictEqual(validateUserId("123456").valid, false)
 assert.strictEqual(validateUserId("").valid, false)
})

test("validateUserId refuse null/undefined", () => {
 assert.strictEqual(validateUserId(null).valid, false)
 assert.strictEqual(validateUserId(undefined).valid, false)
})

test("validateUserId refuse des lettres", () => {
 assert.strictEqual(validateUserId("abcdefghijklmnopq").valid, false)
})

/* ── validateCardId ── */

test("validateCardId accepte un entier positif", () => {
 assert.strictEqual(validateCardId(1).valid, true)
 assert.strictEqual(validateCardId(999).valid, true)
 assert.strictEqual(validateCardId("42").valid, true)
})

test("validateCardId refuse null, 0, négatif", () => {
 assert.strictEqual(validateCardId(null).valid, false)
 assert.strictEqual(validateCardId(0).valid, false)
 assert.strictEqual(validateCardId(-5).valid, false)
})

/* ── validateAmount ── */

test("validateAmount accepte un montant positif", () => {
 assert.strictEqual(validateAmount(100).valid, true)
 assert.strictEqual(validateAmount(1).valid, true)
 assert.strictEqual(validateAmount(999999).valid, true)
})

test("validateAmount refuse un montant ≤ 0", () => {
 assert.strictEqual(validateAmount(0).valid, false)
 assert.strictEqual(validateAmount(-50).valid, false)
})

test("validateAmount refuse un non-nombre", () => {
 assert.strictEqual(validateAmount("abc").valid, false)
 assert.strictEqual(validateAmount(NaN).valid, false)
 assert.strictEqual(validateAmount(Infinity).valid, false)
})

test("validateAmount respecte min/max", () => {
 assert.strictEqual(validateAmount(5, { min: 10 }).valid, false)
 assert.strictEqual(validateAmount(200, { max: 100 }).valid, false)
 assert.strictEqual(validateAmount(50, { min: 10, max: 100 }).valid, true)
})

/* ── validateGuildName ── */

test("validateGuildName accepte 2-32 caractères", () => {
 assert.strictEqual(validateGuildName("AB").valid, true)
 assert.strictEqual(validateGuildName("MaGuilde").valid, true)
 assert.strictEqual(validateGuildName("A".repeat(32)).valid, true)
})

test("validateGuildName refuse < 2 ou > 32 caractères", () => {
 assert.strictEqual(validateGuildName("A").valid, false)
 assert.strictEqual(validateGuildName("A".repeat(33)).valid, false)
})

test("validateGuildName refuse une chaîne vide ou null", () => {
 assert.strictEqual(validateGuildName("").valid, false)
 assert.strictEqual(validateGuildName(null).valid, false)
})

/* ── validateSetId ── */

test("validateSetId accepte un set valide", () => {
 assert.strictEqual(validateSetId("incarnam").valid, true)
 assert.strictEqual(validateSetId("astrub", ["incarnam", "astrub"]).valid, true)
})

test("validateSetId refuse un set inconnu si liste fournie", () => {
 assert.strictEqual(validateSetId("fake", ["incarnam", "astrub"]).valid, false)
})

/* ── validateRarity ── */

test("validateRarity accepte C, U, R, SR, HR, UR, S, SSR", () => {
 for (const r of ["C","U","R","SR","HR","UR","S","SSR"]) {
  assert.strictEqual(validateRarity(r).valid, true, `${r} devrait être valide`)
 }
})

test("validateRarity refuse une rareté inconnue", () => {
 assert.strictEqual(validateRarity("MEGA").valid, false)
 assert.strictEqual(validateRarity("").valid, false)
 assert.strictEqual(validateRarity(null).valid, false)
})

console.log(`\n══════ Résultats : ${passed} passed, ${failed} failed ══════\n`)
process.exit(failed > 0 ? 1 : 0)