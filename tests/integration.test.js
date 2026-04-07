/* ═══════════════════════════════════════════════
   TESTS — Intégration E2E
   Simule un parcours joueur complet :
     1. Création du joueur
     2. Ouverture de pack
     3. Vente de carte sur le market
     4. Achat sur le market
     5. Fusion de doublons
     6. Fragments
     7. Création de guilde + XP
     8. Achievements
     9. Progression / Level up
    10. Battle Pass XP
═══════════════════════════════════════════════ */

const assert = require("assert")

/* ── Setup ── */
const dataManager = require("../systems/dataManager")

const mockCards = []
let cardId = 1
const RARITIES = ["C","U","R","SR","HR","UR","S","SSR"]
for (const set of ["incarnam", "astrub"]) {
 for (const rarity of RARITIES) {
  for (let i = 0; i < 5; i++) {
   mockCards.push({ id: cardId++, name: `${set}_${rarity}_${i}`, set, rarity })
  }
 }
}
dataManager.data.cards = mockCards

const { resetRegistry } = require("../systems/cardRegistry")
resetRegistry()

const { getUser, save }     = require("../systems/userSystem")
const { generatePack }      = require("../systems/pack")
const { rewardKamas }       = require("../systems/economy")
const { checkAchievements } = require("../systems/achievementEngine")
const { addXP }             = require("../systems/progressionSystem")
const { addListing, buyCard, getMarket } = require("../systems/market")
const {
 addFragmentToInventory, hasAllFragments,
 getMissingFragmentNumbers, getDistinctFragmentNumbers
} = require("../systems/fragmentService")
const {
 createGuild, joinGuild, disbandGuild,
 getUserGuild, addGuildXP
} = require("../systems/guildSystem")

const RUN = Date.now().toString(36).slice(-5)
function uid(base) { return `e2e_${base}_${RUN}` }

let passed = 0, failed = 0

function test(name, fn) {
 try { fn(); console.log(`  ✅ ${name}`); passed++ }
 catch (e) { console.error(`  ❌ ${name}\n     ${e.message}`); failed++ }
}

console.log("\n══════ TESTS E2E — Parcours joueur complet ══════\n")

/* ═══════════════════════════════════════════════
   1. CRÉATION DU JOUEUR
═══════════════════════════════════════════════ */

const PLAYER = uid("player")
const BUYER  = uid("buyer")

test("1. Joueur créé avec structure complète", () => {
 const user = getUser(PLAYER)
 assert.ok(user, "user existe")
 assert.ok(typeof user.kamas === "number", "kamas est un nombre")
 assert.ok(typeof user.cards === "object", "cards est un objet")
 assert.ok(Array.isArray(user.achievements), "achievements est un tableau")

 /* Donner des kamas pour la suite */
 user.kamas = 50000
 save(PLAYER)
})

test("1b. Second joueur (acheteur) créé", () => {
 const user = getUser(BUYER)
 user.kamas = 50000
 save(BUYER)
 assert.ok(user)
})

/* ═══════════════════════════════════════════════
   2. OUVERTURE DE PACK
═══════════════════════════════════════════════ */

test("2. Pack ouvert avec 5-6 cartes valides", () => {
 const user = getUser(PLAYER)
 const result = generatePack(user, "incarnam")
 assert.ok(result.pack.length >= 5, "au moins 5 cartes")

 /* Ajouter les cartes au joueur manuellement (comme openPack) */
 for (const card of result.pack) {
  user.cards[card.id] = (user.cards[card.id] || 0) + 1
 }
 save(PLAYER)

 const totalCards = Object.values(user.cards).reduce((a, b) => a + b, 0)
 assert.ok(totalCards >= 5, `${totalCards} cartes en inventaire`)
})

test("2b. Pity incrémenté après le pack", () => {
 const user = getUser(PLAYER)
 assert.ok(user.pity, "pity existe")
 assert.ok(user.pity.incarnam, "pity incarnam initialisé")
})

/* ═══════════════════════════════════════════════
   3. ÉCONOMIE — KAMAS REWARD
═══════════════════════════════════════════════ */

test("3. rewardKamas fonctionne et met à jour les stats", () => {
 const user = getUser(PLAYER)
 const before = user.kamas
 const gain = rewardKamas(user, "C")
 assert.ok(gain > 0, "gain > 0")
 assert.ok(user.kamas > before, "kamas augmentés")
 save(PLAYER)
})

/* ═══════════════════════════════════════════════
   4. MARKET — VENTE + ACHAT
═══════════════════════════════════════════════ */

test("4. Mise en vente d'une carte sur le market", () => {
 const user = getUser(PLAYER)
 /* Trouver une carte que le joueur possède en double */
 let cardToSell = null
 for (const [id, qty] of Object.entries(user.cards)) {
  if (qty >= 2) { cardToSell = id; break }
 }

 /* Si pas de double, donner un double */
 if (!cardToSell) {
  const firstCard = Object.keys(user.cards)[0]
  user.cards[firstCard] = (user.cards[firstCard] || 0) + 2
  cardToSell = firstCard
  save(PLAYER)
 }

 const listing = addListing(PLAYER, cardToSell, 500)
 assert.ok(listing.id, "listing créé avec id")
 assert.strictEqual(listing.price, 500)
})

test("4b. Acheteur achète la carte", () => {
 const market = getMarket()
 const listing = market.find(l => l.seller === PLAYER)
 assert.ok(listing, "annonce trouvée")

 const buyer = getUser(BUYER)
 const kamasBefore = buyer.kamas
 const result = buyCard(BUYER, listing.id)
 assert.ok(result.success, "achat réussi")
 assert.ok(buyer.kamas < kamasBefore, "kamas déduits")
})

/* ═══════════════════════════════════════════════
   5. FRAGMENTS
═══════════════════════════════════════════════ */

test("5. Collecte progressive de fragments 1-5", () => {
 const cardIdFrag = "36"
 for (let i = 1; i <= 5; i++) {
  addFragmentToInventory(PLAYER, { cardId: cardIdFrag, fragmentNumber: i, source: "e2e" })
 }

 const user = getUser(PLAYER)
 assert.ok(hasAllFragments(user, cardIdFrag), "tous les fragments collectés")
 assert.deepStrictEqual(getMissingFragmentNumbers(user, cardIdFrag), [], "aucun manquant")
 assert.deepStrictEqual(getDistinctFragmentNumbers(user, cardIdFrag), [1, 2, 3, 4, 5])
})

/* ═══════════════════════════════════════════════
   6. GUILDE — CRÉER + XP + LEVEL UP
═══════════════════════════════════════════════ */

const GNAME = `E2E_${RUN}`
let guildId = null

test("6. Création de guilde", () => {
 const user = getUser(PLAYER)
 user.kamas = 50000
 save(PLAYER)

 const r = createGuild(PLAYER, GNAME)
 assert.ok(!r.error, r.error)
 assert.ok(r.guild)
 guildId = r.guild.id
 assert.strictEqual(r.guild.leaderId, PLAYER)
})

test("6b. Ajout XP guilde + level up", () => {
 const r = addGuildXP(guildId, 99999)
 assert.ok(r, "résultat non null")
 assert.ok(r.leveled, "level up effectué")
 assert.ok(r.newLevel > 1, `nouveau level ${r.newLevel}`)
})

test("6c. Second joueur rejoint la guilde", () => {
 const buyerUser = getUser(BUYER)
 if (buyerUser.guildId) delete buyerUser.guildId
 save(BUYER)

 const r = joinGuild(BUYER, guildId)
 assert.ok(!r.error, r.error)

 const guild = getUserGuild(BUYER)
 assert.ok(guild, "buyer dans une guilde")
 assert.ok(guild.memberIds.includes(BUYER))
})

/* ═══════════════════════════════════════════════
   7. ACHIEVEMENTS
═══════════════════════════════════════════════ */

test("7. Achievements se débloquent", () => {
 const user = getUser(PLAYER)
 user.kamas = 10000

 const unlocked = checkAchievements(user, null)
 assert.ok(Array.isArray(unlocked), "retourne un tableau")
 /* Avec 10000 kamas, au minimum kamas1000 devrait être débloqué */
 assert.ok(user.achievements.length > 0, "au moins 1 achievement")
 save(PLAYER)
})

test("7b. Pas de doublon d'achievement", () => {
 const user = getUser(PLAYER)
 checkAchievements(user, null)
 /* Vérifier unicité */
 const unique = [...new Set(user.achievements)]
 assert.strictEqual(user.achievements.length, unique.length, "pas de doublons")
})

/* ═══════════════════════════════════════════════
   8. PROGRESSION / LEVEL UP
═══════════════════════════════════════════════ */

test("8. addXP fait monter le level", () => {
 const user = getUser(PLAYER)
 const levelBefore = user.progression?.level || 1
 addXP(user, 50000)
 assert.ok(user.progression.level > levelBefore,
  `${user.progression.level} > ${levelBefore}`)
 save(PLAYER)
})

test("8b. totalXp ne diminue jamais", () => {
 const user = getUser(PLAYER)
 const xp1 = user.progression.totalXp
 addXP(user, 100)
 assert.ok(user.progression.totalXp >= xp1)
})

/* ═══════════════════════════════════════════════
   9. COHÉRENCE FINALE
═══════════════════════════════════════════════ */

test("9. État final du joueur est cohérent", () => {
 const user = getUser(PLAYER)

 /* Kamas positifs */
 assert.ok(user.kamas >= 0, "kamas >= 0")

 /* Cartes présentes */
 const totalCards = Object.values(user.cards).reduce((a, b) => a + b, 0)
 assert.ok(totalCards > 0, "a des cartes")

 /* Progression valide */
 assert.ok(user.progression.level >= 1, "level >= 1")
 assert.ok(user.progression.totalXp > 0, "totalXp > 0")
 assert.ok(user.progression.xp >= 0, "xp >= 0")

 /* Guild ID présent */
 assert.ok(user.guildId, "dans une guilde")

 /* Achievements pas vides */
 assert.ok(user.achievements.length > 0, "a des achievements")

 /* Fragments présents */
 assert.ok(user.fragments.length >= 5, "a des fragments")
})

test("9b. Le market est cohérent après les transactions", () => {
 const market = getMarket()
 assert.ok(Array.isArray(market), "market est un tableau")
 /* La carte vendue a été achetée, donc elle n'est plus dans le market */
 const playerListings = market.filter(l => l.seller === PLAYER)
 assert.strictEqual(playerListings.length, 0, "plus d'annonces du joueur")
})

/* ═══════════════════════════════════════════════
   CLEANUP
═══════════════════════════════════════════════ */

try {
 if (guildId) disbandGuild(guildId, PLAYER)
} catch (_) {}

console.log(`\n══════ Résultats E2E : ${passed} passed, ${failed} failed ══════\n`)
process.exit(failed > 0 ? 1 : 0)
