/* ═══════════════════════════════════════════════
   TESTS — systems/progressionSystem.js
   Couvre : addXP, level up, cap 200,
            XP requis, progression structure
═══════════════════════════════════════════════ */

const assert = require("assert")

const { addXP } = require("../systems/progressionSystem")

let passed = 0, failed = 0

function test(name, fn) {
 try { fn(); console.log(`  ✅ ${name}`); passed++ }
 catch (e) { console.error(`  ❌ ${name}\n     ${e.message}`); failed++ }
}

function makeUser(overrides = {}) {
 return {
  progression: { level: 1, xp: 0, totalXp: 0 },
  stats: {},
  ...overrides
 }
}

console.log("\n══════ TESTS progressionSystem.js ══════\n")

test("addXP ajoute de l'XP au user", () => {
 const user = makeUser()
 addXP(user, 50)
 assert.ok(user.progression.xp > 0 || user.progression.level > 1, "XP ajouté ou level up")
 assert.strictEqual(user.progression.totalXp, 50, "totalXp = 50")
})

test("addXP cumule correctement", () => {
 const user = makeUser()
 addXP(user, 100)
 addXP(user, 200)
 assert.strictEqual(user.progression.totalXp, 300)
})

test("addXP provoque un level up quand assez d'XP", () => {
 const user = makeUser()
 addXP(user, 100000) /* assez pour dépasser le level 1 */
 assert.ok(user.progression.level > 1, `level ${user.progression.level} > 1`)
})

test("addXP ne dépasse pas le cap 200", () => {
 const user = makeUser()
 addXP(user, 99999999) /* énormément d'XP */
 assert.ok(user.progression.level <= 200, `level ${user.progression.level} <= 200`)
})

test("addXP avec 0 ne change rien", () => {
 const user = makeUser()
 const before = { ...user.progression }
 addXP(user, 0)
 assert.strictEqual(user.progression.xp, before.xp)
 assert.strictEqual(user.progression.totalXp, before.totalXp)
})

test("addXP crée user.progression si absent", () => {
 const user = { stats: {} }
 addXP(user, 100)
 assert.ok(user.progression, "progression créée")
 assert.ok(user.progression.totalXp > 0)
})

test("progression.level est toujours >= 1", () => {
 const user = makeUser()
 assert.ok(user.progression.level >= 1)
 addXP(user, 1)
 assert.ok(user.progression.level >= 1)
})

test("progression.totalXp ne diminue jamais", () => {
 const user = makeUser()
 addXP(user, 500)
 const after1 = user.progression.totalXp
 addXP(user, 500)
 const after2 = user.progression.totalXp
 assert.ok(after2 >= after1, "totalXp ne diminue pas")
})

test("level augmente progressivement avec l'XP", () => {
 const user = makeUser()
 const levels = []
 for (let i = 0; i < 50; i++) {
  addXP(user, 500)
  levels.push(user.progression.level)
 }
 /* Le level ne doit jamais diminuer */
 for (let i = 1; i < levels.length; i++) {
  assert.ok(levels[i] >= levels[i - 1], `level[${i}] >= level[${i-1}]`)
 }
})

test("progression.xp est l'XP dans le level courant (jamais négatif)", () => {
 const user = makeUser()
 for (let i = 0; i < 20; i++) {
  addXP(user, 300)
  assert.ok(user.progression.xp >= 0, `xp >= 0 (itération ${i})`)
 }
})

console.log(`\n══════ Résultats : ${passed} passed, ${failed} failed ══════\n`)
process.exit(failed > 0 ? 1 : 0)