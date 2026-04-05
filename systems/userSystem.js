/* ═══════════════════════════════════════════════════════════════
   USER SYSTEM — systems/userSystem.js

   Gère le chargement, la création, la migration et la sauvegarde
   des utilisateurs. Toutes les structures user passent par ici.

   MODIFICATIONS :
   - Refactorisation de `ensureStats()` : l'interminable bloc de
     50+ lignes `if(s.x === undefined) s.x = 0` est remplacé par
     un objet `STAT_DEFAULTS` + boucle `for...in` avec détection
     de type (0 / [] / {} / null). Même résultat, 3x moins de code.
   - Refactorisation de `ensureKrosmoShop()` avec `SHOP_STAT_DEFAULTS`
   - Ajout de JSDoc sur toutes les fonctions
   - Utilisation du logger au lieu de `console.log` pour migrateAll
═══════════════════════════════════════════════════════════════ */

const { data, save: dataSave, loadUser, saveUser } = require("./dataManager")
const { createLogger } = require("./logger")

const log   = createLogger("USER")
const users = data.users

/* ═══════════════════════════════════════════════════════════════
   STAT DEFAULTS
   Chaque clé correspond à une stat dans `user.stats`.
   La valeur est le default appliqué si la stat est `undefined`.

   Types supportés :
   - number (0)     → appliqué si `=== undefined`
   - null           → appliqué si `=== undefined`
   - []             → appliqué si falsy (via Array.isArray check)
   - {}             → appliqué si falsy (via typeof check)
   - "NOW"          → remplacé par `Date.now()` au moment de l'appel
═══════════════════════════════════════════════════════════════ */

/** @type {Object<string, number|null|string|Array|Object>} */
const STAT_DEFAULTS = {

 /* ── Stats de base ── */
 cardsSold:          0,
 cardsBought:        0,
 ssrPulled:          0,
 shinySSR:           0,
 ssrStreak:          0,
 fusions:            0,
 fusionCrit:         0,
 fusionDouble:       0,
 tripleFusionToday:  0,
 lastTripleReset:    "NOW",
 packsOpened:        0,
 packsBought:        0,
 multiPackBuys:      0,
 multiPackOpens:     0,
 maxBulkBuy:         0,
 maxBulkOpen:        0,

 /* ── Events ── */
 eventPacksOpened:   0,
 ssrFromEvent:       0,
 ticketsFullyUsed:   0,
 jackpotEnutrof:     0,
 jackpotFeca:        0,
 firstEventPacks:    0,
 eventsParticipated: [],
 ssrByClass:         {},
 eventPacksByClass:  {},

 /* ── Stats spéciales ── */
 krosmozOpened:      0,
 packAtMidnight:     0,
 ssrOnMonday:        0,
 allCPack:           0,
 allUPack:           0,
 palindromeReached:  0,
 dryStreak:          0,
 dryStreakMax:       0,
 hardPityReached:    0,
 sellFast:           0,
 marketBought:       0,
 marketSSRListed:    0,
 fusionSSRResult:    0,
 speedTickets:       0,
 tradePartners:      {},
 tradeBothWaysToday: 0,
 activityStreak:     0,
 lastActivityDay:    null,
 createdAt:          "NOW",

 /* ── Achievements rewards tracking ── */
 achievementKamasEarned: 0,
 achievementXpEarned:    0,
 achievementPacksEarned: 0,

 /* ── Gift stats ── */
 giftsGiven:       0,
 giftsReceived:    0,
 giftsSSRGiven:    0,
 giftsURGiven:     0,
 giftsShinyGiven:  0,
 giftRecipients:   {},
 giftStreak:       0,
 giftBothWays:     0,

 /* ── Guild stats ── */
 guildCreated:       0,
 guildPromoted:      0,
 guildMaxLevel:      0,
 guildQuestsClaimed: 0,
 guildPerfectWeeks:  0,
 guildXpContributed: 0,
 guildGifts:         0,
 guildFirstClaim:    0,
 guildDays:          0,
 guildWasFull:       0,
 guildRenamed:       0,
 guildTransferred:   0,

 /* ── Fragment stats ── */
 fragmentsFound:  0,
 fragmentsSold:   0,
 fragmentsCrafted:0,

 /* ── Profile ── */
 profileViews:    0,
 balanceCheck:    0,

 /* ── Roulette ── */
 rouletteSpins:   0,
 rouletteJackpot: 0,
 rouletteKamas:   0
}

/**
 * Defaults pour `user.krosmoshopStats`.
 * @type {Object<string, number>}
 */
const SHOP_STAT_DEFAULTS = {
 cardsBought: 0,
 ssrBought:   0,
 sBought:     0,
 kamasSpent:  0,
 daysVisited: 0
}

/* ═══════════════════════════════════════════════════════════════
   ENSURE FUNCTIONS
═══════════════════════════════════════════════════════════════ */

/**
 * Garantit que chaque set dans `user.pity` a les compteurs UR/S/SSR.
 * @param {Object} pity - L'objet pity du user
 * @returns {Object} Le même objet, complété
 */
function ensurePity(pity) {

 if (!pity) return {}

 for (const setId in pity) {
  const p = pity[setId]
  if (!p) { pity[setId] = { UR: 0, S: 0, SSR: 0 }; continue }
  if (p.UR  === undefined) p.UR  = 0
  if (p.S   === undefined) p.S   = 0
  if (p.SSR === undefined) p.SSR = 0
 }

 return pity
}

/**
 * Applique les defaults sur `user.stats` en utilisant `STAT_DEFAULTS`.
 * Remplace le bloc de 50+ lignes `if(s.x === undefined) s.x = 0`.
 *
 * @param {Object} user - L'objet utilisateur
 * @param {number} now  - Timestamp actuel (pour les champs "NOW")
 * @returns {Object} `user.stats` complété
 */
function ensureStats(user, now) {

 if (!user.stats) user.stats = {}

 const s = user.stats

 for (const key in STAT_DEFAULTS) {

  const defaultVal = STAT_DEFAULTS[key]

  /* "NOW" → remplacé par le timestamp courant */
  if (defaultVal === "NOW") {
   if (s[key] === undefined) s[key] = now
   continue
  }

  /* Tableaux : vérifier avec Array.isArray */
  if (Array.isArray(defaultVal)) {
   if (!Array.isArray(s[key])) s[key] = []
   continue
  }

  /* Objets : vérifier avec typeof */
  if (defaultVal !== null && typeof defaultVal === "object") {
   if (!s[key] || typeof s[key] !== "object") s[key] = {}
   continue
  }

  /* Scalaires (number, null) : vérifier avec === undefined */
  if (s[key] === undefined) s[key] = defaultVal
 }

 return s
}

/**
 * Garantit la présence des propriétés économie de base.
 * @param {Object} user
 * @returns {Object}
 */
function ensureEconomy(user) {
 if (user.kamas === undefined) user.kamas = 0
 if (user.packs === undefined) user.packs = 0
 return user
}

/**
 * Garantit la présence du tableau achievements et des titres.
 * @param {Object} user
 * @returns {Object}
 */
function ensureAchievements(user) {
 if (!Array.isArray(user.achievements)) user.achievements = []
 if (!Array.isArray(user.titles))       user.titles = ["Nouveau"]
 if (!user.title)                       user.title = "Nouveau"
 return user
}

/**
 * Garantit la structure de progression (level, xp, totalXp).
 * @param {Object} user
 * @returns {Object}
 */
function ensureProgression(user) {
 if (!user.progression) {
  user.progression = { level: 1, xp: 0, totalXp: 0 }
 }
 return user
}

/**
 * Garantit la structure daily (streak, lastDaily).
 * @param {Object} user
 * @returns {Object}
 */
function ensureDaily(user) {
 if (!user.daily) {
  user.daily = { streak: 0, lastDaily: 0 }
 }
 return user
}

/**
 * Garantit la structure KrosmoShop avec ses stats.
 * Utilise `SHOP_STAT_DEFAULTS` pour compléter les champs manquants.
 * @param {Object} user
 * @returns {Object}
 */
function ensureKrosmoShop(user) {

 if (!user.krosmoshop) user.krosmoshop = {}

 if (!user.krosmoshopStats) {
  user.krosmoshopStats = { ...SHOP_STAT_DEFAULTS }
 } else {
  for (const key in SHOP_STAT_DEFAULTS) {
   if (user.krosmoshopStats[key] === undefined) {
    user.krosmoshopStats[key] = SHOP_STAT_DEFAULTS[key]
   }
  }
 }

 return user
}

/**
 * Garantit la présence de `user.shinyCards`.
 * @param {Object} user
 * @returns {Object}
 */
function ensureShinyCards(user) {
 if (!user.shinyCards) user.shinyCards = {}
 return user
}

/**
 * Garantit que `user.fragments` est un tableau.
 * @param {Object} user
 * @returns {Object}
 */
function ensureFragments(user) {
 if (!Array.isArray(user.fragments)) user.fragments = []
 return user
}

/* ═══════════════════════════════════════════════════════════════
   ACTIVITY STREAK
═══════════════════════════════════════════════════════════════ */

/**
 * Met à jour le streak d'activité quotidienne du joueur.
 * Incrémente si le joueur était actif hier, reset sinon.
 * @param {Object} user
 */
function updateActivityStreak(user) {

 const today = new Date().toDateString()

 if (user.stats.lastActivityDay === today) return

 if (user.stats.lastActivityDay) {

  const last = new Date(user.stats.lastActivityDay)
  const now  = new Date()
  const diff = Math.floor((now - last) / 86400000)

  if (diff === 1) {
   user.stats.activityStreak = (user.stats.activityStreak || 0) + 1
  } else if (diff > 1) {
   user.stats.activityStreak = 1
  }

 } else {
  user.stats.activityStreak = 1
 }

 user.stats.lastActivityDay = today
}

/* ═══════════════════════════════════════════════════════════════
   PALINDROME CHECK
═══════════════════════════════════════════════════════════════ */

/**
 * Vérifie si un nombre est un palindrome (ex: 121, 1331).
 * @param {number} n
 * @returns {boolean}
 */
function isPalindrome(n) {
 const s = String(n)
 return s === s.split("").reverse().join("")
}

/**
 * Vérifie si le total de cartes du joueur est un palindrome
 * et incrémente la stat correspondante.
 * @param {Object} user
 */
function checkPalindrome(user) {
 const total = Object.values(user.cards || {}).reduce((a, b) => a + b, 0)
 if (total > 0 && isPalindrome(total)) {
  user.stats.palindromeReached = (user.stats.palindromeReached || 0) + 1
 }
}

/* ═══════════════════════════════════════════════════════════════
   MIGRATION GLOBALE
   Applique tous les ensure sur les users déjà chargés en mémoire.
═══════════════════════════════════════════════════════════════ */

function migrateAll() {

 let changed = false
 const now   = Date.now()

 for (const id in users) {

  const user = users[id]

  if (!user.cards) { user.cards = {}; changed = true }

  ensureEconomy(user)
  ensureAchievements(user)
  ensureProgression(user)
  ensureDaily(user)
  ensureKrosmoShop(user)
  ensureShinyCards(user)
  ensureFragments(user)
  ensureStats(user, now)

  if (!user.pity) { user.pity = {}; changed = true }

  ensurePity(user.pity)

  if (changed) user._dirty = true
 }

 if (changed) {
  log.info("Migration globale des users effectuée")
 }
}

/* ═══════════════════════════════════════════════════════════════
   INIT
═══════════════════════════════════════════════════════════════ */

migrateAll()

/* ═══════════════════════════════════════════════════════════════
   MARK DIRTY — à appeler quand on modifie un user manuellement
═══════════════════════════════════════════════════════════════ */

/**
 * Marque un user comme modifié pour l'autosave.
 * @param {string} id - ID Discord
 */
function markDirty(id) {
 if (users[id]) {
  users[id]._dirty = true
 }
}

/* ═══════════════════════════════════════════════════════════════
   SAVE
   L'ancienne version appelait seulement dataSave() qui ne
   sauvegarde que market/cards/devs.
   Maintenant on sauvegarde AUSSI les users modifiés.
═══════════════════════════════════════════════════════════════ */

/**
 * Sauvegarde un ou tous les users + les données statiques.
 * @param {string} [userId] - Si fourni, sauvegarde uniquement ce user
 */
function save(userId) {

 if (userId && users[userId]) {
  users[userId]._dirty = true
  saveUser(userId)
 } else {
  for (const id in users) {
   if (users[id]) {
    users[id]._dirty = true
    saveUser(id)
   }
  }
 }

 dataSave()
}

/* ═══════════════════════════════════════════════════════════════
   USER MANAGEMENT
═══════════════════════════════════════════════════════════════ */

/**
 * Charge ou crée un utilisateur.
 * Applique tous les ensure pour garantir la structure complète.
 *
 * @param {string} id - ID Discord
 * @returns {Object} L'objet user complet et à jour
 */
function getUser(id) {

 let user = loadUser(id)

 const now = Date.now()

 if (!user) {

  user = {
   cards:       {},
   fragments:   [],
   shinyCards:  {},
   kamas:       0,
   packs:       0,
   lastPack:    0,
   lastClaim:   0,
   pity:        {},
   achievements:[],
   titles:      ["Nouveau"],
   title:       "Nouveau",
   progression: { level: 1, xp: 0, totalXp: 0 },
   stats: {
    cardsSold: 0, cardsBought: 0,
    ssrPulled: 0, shinySSR: 0, ssrStreak: 0,
    fusions: 0, fusionCrit: 0, fusionDouble: 0,
    tripleFusionToday: 0, lastTripleReset: now,
    packsOpened: 0, packsBought: 0,
    multiPackBuys: 0, multiPackOpens: 0,
    maxBulkBuy: 0, maxBulkOpen: 0,
    eventPacksOpened: 0, ssrFromEvent: 0,
    ticketsFullyUsed: 0, jackpotEnutrof: 0, jackpotFeca: 0,
    firstEventPacks: 0,
    eventsParticipated: [], ssrByClass: {}, eventPacksByClass: {},
    krosmozOpened: 0,
    packAtMidnight: 0, ssrOnMonday: 0,
    allCPack: 0, allUPack: 0, palindromeReached: 0,
    dryStreak: 0, dryStreakMax: 0, hardPityReached: 0,
    sellFast: 0, marketBought: 0, marketSSRListed: 0,
    fusionSSRResult: 0, speedTickets: 0,
    tradePartners: {}, tradeBothWaysToday: 0,
    activityStreak: 0, lastActivityDay: null,
    createdAt: now
   },
   krosmoshop:      {},
   krosmoshopStats: { ...SHOP_STAT_DEFAULTS },
   daily:           { streak: 0, lastDaily: 0 }
  }

  user._dirty = true
  users[id]   = user
  save(id)
 }

 /* Applique tous les ensure pour les users existants (migration) */
 ensureEconomy(user)
 ensureAchievements(user)
 ensureProgression(user)
 ensureDaily(user)
 ensureKrosmoShop(user)
 ensureShinyCards(user)
 ensureFragments(user)
 ensureStats(user, now)

 if (!user.pity) user.pity = {}
 ensurePity(user.pity)

 return user
}

/**
 * Retourne tous les users chargés en mémoire.
 * @returns {Object<string, Object>}
 */
function getUsers() {
 return users
}

/* ═══════════════════════════════════════════════════════════════
   EXPORTS
═══════════════════════════════════════════════════════════════ */

module.exports = {
 getUser,
 getUsers,
 save,
 markDirty,
 updateActivityStreak,
 checkPalindrome,
 isPalindrome
}