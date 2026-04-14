const assert = require("assert")

const dataManager = require("../systems/dataManager")
const mockCards = []
let cardId = 1
for (const rarity of ["C", "U", "R", "SR", "HR", "UR", "S", "SSR"]) {
 for (let i = 0; i < 10; i++) {
  mockCards.push({ id: cardId++, name: `card_${rarity}_${i}`, set: "incarnam", rarity })
 }
}
dataManager.data.cards = mockCards
const { resetRegistry } = require("../systems/cardRegistry")
resetRegistry()

const { checkAchievements } = require("../systems/achievementEngine")
const achievementRegistry = require("../systems/achievementRegistry")
const { ensureAchievementClaimState } = require("../systems/achievementClaimService")

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

console.log("\n====== TESTS achievementEngine.js ======\n")

test("checkAchievements returns array", () => {
 const user = makeUser()
 const result = checkAchievements(user, null)
 assert.ok(Array.isArray(result), "result should be an array")
})

test("achievement is not unlocked twice", () => {
 const user = makeUser({ kamas: 2000 })
 const first = checkAchievements(user, null)
 const second = checkAchievements(user, null)

 for (const id of first) {
  assert.ok(!second.includes(id), `${id} must not unlock twice`)
 }
})

test("kamas1000 unlocks at 1000 kamas", () => {
 const user = makeUser({ kamas: 1000 })
 const unlocked = checkAchievements(user, null)
 assert.ok(unlocked.includes("kamas1000"), "kamas1000 unlocked")
})

test("kamas1000 does not unlock at 999 kamas", () => {
 const user = makeUser({ kamas: 999 })
 const unlocked = checkAchievements(user, null)
 assert.ok(!unlocked.includes("kamas1000"), "kamas1000 not unlocked at 999")
})

test("achievement reward waits for claim", () => {
 const user = makeUser({ kamas: 1000 })
 checkAchievements(user, null)
 const claimState = ensureAchievementClaimState(user)
 assert.ok(claimState.pendingIds.includes("kamas1000"), "kamas1000 should be pending")
 assert.ok(!user.titles.includes("Petit Marchand"), "title should not be granted before claim")
})

test("unlocked achievements are in user.achievements", () => {
 const user = makeUser({ kamas: 10000 })
 checkAchievements(user, null)
 assert.ok(user.achievements.includes("kamas1000"), "kamas1000 in achievements")
 assert.ok(user.achievements.includes("kamas10000"), "kamas10000 in achievements")
})

test("checkAchievements initializes user.stats when missing", () => {
 const user = { kamas: 0 }
 checkAchievements(user, null)
 assert.ok(user.stats, "stats created")
 assert.ok(user.achievements, "achievements created")
})

test("secret achievement 666 kamas unlocks", () => {
 const user = makeUser({ kamas: 666 })
 const unlocked = checkAchievements(user, null)
 assert.ok(unlocked.includes("kamas666"), "kamas666 unlocked")
})

test("secret counters do not unlock from non-secret achievements", () => {
 const nonSecretIds = Object.keys(achievementRegistry).filter((id) => !achievementRegistry[id]?.secret)
 const user = makeUser({
  achievements: nonSecretIds.slice(0, 200),
  title: "Nouveau"
 })
 const unlocked = checkAchievements(user, null)
 assert.ok(!unlocked.includes("secretMurmure"), "secretMurmure should not unlock")
 assert.ok(!unlocked.includes("secretEnigmeDouze"), "secretEnigmeDouze should not unlock")
})

test("secretMurmure unlocks with 3 real secret achievements", () => {
 const secretIds = Object.keys(achievementRegistry).filter(
  (id) => achievementRegistry[id]?.secret && id !== "secretMurmure" && id !== "secretEnigmeDouze"
 )
 const user = makeUser({
  achievements: secretIds.slice(0, 3),
  title: "Nouveau"
 })
 const unlocked = checkAchievements(user, null)
 assert.ok(unlocked.includes("secretMurmure"), "secretMurmure should unlock")
 assert.ok(!unlocked.includes("secretEnigmeDouze"), "secretEnigmeDouze should stay locked")
})

test("secretEnigmeDouze unlocks with 12 real secret achievements", () => {
 const secretIds = Object.keys(achievementRegistry).filter(
  (id) => achievementRegistry[id]?.secret && id !== "secretEnigmeDouze"
 )
 const user = makeUser({
  achievements: secretIds.slice(0, 12),
  title: "Nouveau"
 })
 const unlocked = checkAchievements(user, null)
 assert.ok(unlocked.includes("secretEnigmeDouze"), "secretEnigmeDouze should unlock")
})

console.log(`\n====== Results: ${passed} passed, ${failed} failed ======\n`)
process.exit(failed > 0 ? 1 : 0)
