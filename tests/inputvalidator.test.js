/* ═══════════════════════════════════════════════
   TESTS — systems/inputValidator.js
   Couvre : validateUserId, validatePrice,
            validateGuildName, validateSetId,
            validateRarity
═══════════════════════════════════════════════ */

const assert = require("assert")

const {
 validateUserId,
 validatePrice,
 validateGuildName,
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
 assert.strictEqual(validateUserId("12345678901234567"), null)
 assert.strictEqual(validateUserId("123456789012345678"), null)
 assert.strictEqual(validateUserId("12345678901234567890"), null)
})

test("validateUserId refuse un ID trop court", () => {
 assert.ok(validateUserId("123456"))
 assert.ok(validateUserId(""))
})

test("validateUserId refuse null/undefined", () => {
 assert.ok(validateUserId(null))
 assert.ok(validateUserId(undefined))
})

test("validateUserId refuse des lettres", () => {
 assert.ok(validateUserId("abcdefghijklmnopq"))
})

/* ── validatePrice ── */

test("validatePrice accepte un prix positif", () => {
 assert.strictEqual(validatePrice(100), null)
 assert.strictEqual(validatePrice(1), null)
 assert.strictEqual(validatePrice(999999), null)
})

test("validatePrice refuse un prix ≤ 0", () => {
 assert.ok(validatePrice(0))
 assert.ok(validatePrice(-50))
})

test("validatePrice refuse un non-nombre", () => {
 assert.ok(validatePrice("abc"))
 assert.ok(validatePrice(NaN))
 assert.ok(validatePrice(Infinity))
})

/* ── validateGuildName ── */

test("validateGuildName accepte 3-24 caractères", () => {
 assert.strictEqual(validateGuildName("ABC"), null)
 assert.strictEqual(validateGuildName("MaGuildeTestTest12345678"), null)
})

test("validateGuildName refuse < 3 ou > 24 caractères", () => {
 assert.ok(validateGuildName("AB"))
 assert.ok(validateGuildName("A".repeat(25)))
})

test("validateGuildName refuse une chaîne vide", () => {
 assert.ok(validateGuildName(""))
})

/* ── validateRarity ── */

test("validateRarity accepte C, U, R, SR, HR, UR, S, SSR", () => {
 for (const r of ["C","U","R","SR","HR","UR","S","SSR"]) {
  assert.strictEqual(validateRarity(r), null, `${r} devrait être valide`)
 }
})

test("validateRarity refuse une rareté inconnue", () => {
 assert.ok(validateRarity("MEGA"))
 assert.ok(validateRarity(""))
 assert.ok(validateRarity(null))
})

console.log(`\n══════ Résultats : ${passed} passed, ${failed} failed ══════\n`)
process.exit(failed > 0 ? 1 : 0)