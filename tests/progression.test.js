/* ═══════════════════════════════════════════════
   TESTS — systems/progressionSystem.js
   Couvre : addXP, level up, cap 200,
            XP requis, progression structure
═══════════════════════════════════════════════ */

const assert = require("assert")

const {
 addXP,
 getLevelReward,
 getAllLevelRewards
} = require("../systems/progressionSystem")

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

test("chaque niveau 1-200 expose entre 4 et 5 slots de récompense", () => {
 const rewards = getAllLevelRewards(200)
 assert.strictEqual(rewards.length, 200, "200 niveaux de récompense")
 for (const reward of rewards) {
  assert.ok(Array.isArray(reward.slots), `slots présents (niveau ${reward.level})`)
  assert.ok(reward.slots.length >= 4, `au moins 4 slots au niveau ${reward.level}`)
  assert.ok(reward.slots.length <= 5, `au plus 5 slots au niveau ${reward.level}`)
 }
})

test("les types de slots sont limités à kamas/packs/cartes/fragments/titre/badge", () => {
 const allowed = new Set(["kamas", "packs", "cards", "fragments", "title", "badge"])
 for (let level = 1; level <= 200; level += 1) {
  const reward = getLevelReward(level)
  for (const slot of reward.slots) {
   assert.ok(allowed.has(String(slot?.type || "")), `type valide au niveau ${level}`)
  }
 }
})

test("les niveaux multiples de 10 donnent titre + badge", () => {
 for (let level = 10; level <= 200; level += 10) {
  const reward = getLevelReward(level)
  const types = reward.slots.map((slot) => String(slot?.type || ""))
  assert.ok(types.includes("title"), `title present au niveau ${level}`)
  assert.ok(types.includes("badge"), `badge present au niveau ${level}`)
  assert.ok(types.includes("kamas"), `kamas present au niveau ${level}`)
  assert.ok(types.includes("packs"), `packs present au niveau ${level}`)
 }
})

test("les niveaux non multiples de 10 donnent kamas + packs + cartes + fragments", () => {
 for (let level = 1; level <= 200; level += 1) {
  if (level % 10 === 0) continue
  const reward = getLevelReward(level)
  const types = reward.slots.map((slot) => String(slot?.type || ""))
  assert.ok(types.includes("kamas"), `kamas present au niveau ${level}`)
  assert.ok(types.includes("packs"), `packs present au niveau ${level}`)
  assert.ok(types.includes("cards"), `cards present au niveau ${level}`)
  assert.ok(types.includes("fragments"), `fragments present au niveau ${level}`)
 }
})

test("la générosité monte au niveau 100, 150 puis 190+", () => {
 const l99 = getLevelReward(99)
 const l100 = getLevelReward(100)
 const l149 = getLevelReward(149)
 const l150 = getLevelReward(150)
 const l189 = getLevelReward(189)
 const l190 = getLevelReward(190)

 assert.ok(Number(l100.kamas || 0) > Number(l99.kamas || 0), "kamas 100 > 99")
 assert.ok(Number(l150.kamas || 0) > Number(l149.kamas || 0), "kamas 150 > 149")
 assert.ok(Number(l190.kamas || 0) > Number(l189.kamas || 0), "kamas 190 > 189")
 assert.ok(Number(l190.packs || 0) > Number(l189.packs || 0), "packs 190 > 189")
})

test("courbe kamas: niveau 2 = 100 et niveau 200 = 100000", () => {
 const l2 = getLevelReward(2)
 const l200 = getLevelReward(200)
 assert.strictEqual(Number(l2.kamas || 0), 100)
 assert.strictEqual(Number(l200.kamas || 0), 100000)
})

test("packs/fragments: 1-10 jusqu'au niveau 189 puis 11-30 au niveau 190+", () => {
 const getSlotAmount = (reward, type) =>
  Number((reward.slots || []).find((slot) => String(slot?.type || "") === type)?.amount || 0)

 const l2 = getLevelReward(2)
 const l189 = getLevelReward(189)
 const l190 = getLevelReward(190)
 const l200 = getLevelReward(200)

 const p2 = getSlotAmount(l2, "packs")
 const p189 = getSlotAmount(l189, "packs")
 const p190 = getSlotAmount(l190, "packs")
 const p200 = getSlotAmount(l200, "packs")
 const f2 = getSlotAmount(l2, "fragments")
 const f189 = getSlotAmount(l189, "fragments")
 const f190 = getSlotAmount(l190, "fragments")
 const f200 = getSlotAmount(l200, "fragments")

 assert.ok(p2 >= 1 && p2 <= 10, "packs niveau 2 dans [1..10]")
 assert.ok(p189 >= 1 && p189 <= 10, "packs niveau 189 dans [1..10]")
 assert.ok(p190 >= 11 && p190 <= 30, "packs niveau 190 dans [11..30]")
 assert.ok(p200 >= 11 && p200 <= 30, "packs niveau 200 dans [11..30]")

 assert.ok(f2 >= 1 && f2 <= 10, "fragments niveau 2 dans [1..10]")
 assert.ok(f189 >= 1 && f189 <= 10, "fragments niveau 189 dans [1..10]")
 assert.ok(f190 >= 11 && f190 <= 30, "fragments niveau 190 dans [11..30]")
 assert.ok(f200 >= 11 && f200 <= 30, "fragments niveau 200 dans [11..30]")
})

console.log(`\n══════ Résultats : ${passed} passed, ${failed} failed ══════\n`)
process.exit(failed > 0 ? 1 : 0)
