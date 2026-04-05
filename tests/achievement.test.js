/* ═══════════════════════════════════════════════
   TESTS — systems/achievementEngine.js
   Couvre : checkAchievements, déblocage, doublons,
            récompenses, titres
═══════════════════════════════════════════════ */

const assert = require("assert")

/* ── Mock data ── */
const dataManager = require("../systems/dataManager")
const mockCards = []
let cardId = 1
for (const rarity of ["C","U","R","SR","HR","UR","S","SSR"]) {
 for (let i = 0; i < 10; i++) {
  mockCards.push({ id: cardId++, name: `card_${rarity}_${i}`, set: "incarnam", rarity })
 }
}
dataManager.data.cards = mockCards
const { resetRegistry } = require("../systems/cardRegistry")
resetRegistry()

const { checkAchievements } = require("../systems/achievementEngine")

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

function makeUser(overrides = {}) {
 return {
  cards: {},
  kamas: 0,
  stats: {},
  achievements: [],
  titles: [],
  packs: 0,
  progression: { level: 1, xp: 0, totalXp: 0 },
  ...overrides
 }
}

console.log("\n══════ TESTS achievementEngine.js ══════\n")

/* ── Retourne un tableau ── */

test("checkAchievements retourne un tableau", () => {
 const user = makeUser()
 const result = checkAchievements(user, null)
 assert.ok(Array.isArray(result), "résultat est un tableau")
})

/* ── Pas de doublon ── */

test("un achievement ne se débloque pas deux fois", () => {
 const user = makeUser({ kamas: 2000 })
 const first = checkAchievements(user, null)
 const second = checkAchievements(user, null)

 /* Vérifier qu'aucun ID n'apparaît dans les deux résultats */
 for (const id of first) {
  assert.ok(!second.includes(id), `${id} ne doit pas se débloquer deux fois`)
 }
})

/* ── Achievements kamas ── */

test("achievement kamas1000 se débloque à 1000 kamas", () => {
 const user = makeUser({ kamas: 1000 })
 const unlocked = checkAchievements(user, null)
 assert.ok(unlocked.includes("kamas1000"), "kamas1000 débloqué")
})

test("achievement kamas1000 ne se débloque pas à 999 kamas", () => {
 const user = makeUser({ kamas: 999 })
 const unlocked = checkAchievements(user, null)
 assert.ok(!unlocked.includes("kamas1000"), "kamas1000 non débloqué à 999")
})

/* ── Titres ── */

test("un achievement avec titre ajoute le titre au user", () => {
 const user = makeUser({ kamas: 1000 })
 checkAchievements(user, null)
 /* kamas1000 donne le titre "Petit Marchand" */
 assert.ok(user.titles.includes("Petit Marchand"), "titre ajouté")
})

/* ── Achievements stockés ── */

test("les achievements débloqués sont dans user.achievements", () => {
 const user = makeUser({ kamas: 10000 })
 checkAchievements(user, null)
 assert.ok(user.achievements.includes("kamas1000"), "kamas1000 dans achievements")
 assert.ok(user.achievements.includes("kamas10000"), "kamas10000 dans achievements")
})

/* ── user.stats initialisé ── */

test("checkAchievements initialise user.stats si absent", () => {
 const user = { kamas: 0 }
 checkAchievements(user, null)
 assert.ok(user.stats, "stats créé")
 assert.ok(user.achievements, "achievements créé")
})

/* ── Secret achievement 666 ── */

test("achievement secret 666 kamas se débloque", () => {
 const user = makeUser({ kamas: 666 })
 const unlocked = checkAchievements(user, null)
 assert.ok(unlocked.includes("kamas666"), "kamas666 débloqué")
})

/* ── Résultats ── */

console.log(`\n══════ Résultats : ${passed} passed, ${failed} failed ══════\n`)
process.exit(failed > 0 ? 1 : 0)