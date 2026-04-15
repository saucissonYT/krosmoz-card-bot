const fs   = require("fs")
const path = require("path")

/* ════════════════════════════════════════════════════════════
   DATA MANAGER — SQLite Backend

   Même API publique que l'ancien dataManager JSON :
     data, loadAll, save, loadUser, saveUser, USERS_DIR, CARDS_IMAGES_DIR

   Backend changé : users et market stockés en SQLite.
   Cards, devs, guilds, battlepass restent en JSON (pas d'impact perf).

   Le cache en mémoire (data.users) fonctionne exactement pareil :
   - loadUser() charge depuis SQLite → cache mémoire
   - saveUser() écrit du cache mémoire → SQLite
   - autosave 30s pour les dirty users (inchangé)
════════════════════════════════════════════════════════════ */

const { getBasePath }          = require("./paths")
const { createLogger }         = require("./logger")
const { writeAtomic, readJsonSafe } = require("./fileUtils")
const { ensureUserStructure }  = require("./userDefaults")
const {
 getDb,
 dbLoadUser,
 dbSaveUser,
 dbCountUsers,
 dbLoadMarket,
 dbAddMarketListing,
 dbRemoveMarketListing,
 dbLoadMarketHistory,
 dbAddMarketHistory
} = require("./database")
const { runMigration } = require("./migrate")

const log = createLogger("DATA")

/* ---------------- BASE PATH ---------------- */

const BASE = getBasePath()

log.info("Data path initialisé", { path: BASE })

/* ---------------- DIRECTORIES ---------------- */

const USERS_DIR = path.join(BASE, "users")

if (!fs.existsSync(USERS_DIR)) {
 fs.mkdirSync(USERS_DIR, { recursive: true })
}

/* ---------------- CARD IMAGE DIRECTORIES ---------------- */

const CARDS_DIR        = path.join(BASE, "cards")
const CARDS_IMAGES_DIR = path.join(CARDS_DIR, "images")

if (!fs.existsSync(CARDS_IMAGES_DIR)) {
 fs.mkdirSync(CARDS_IMAGES_DIR, { recursive: true })
}

/* ---------------- FILE PATHS (JSON restants) ---------------- */

const paths = {
 devs:          path.join(BASE, "devs.json"),
 cards:         path.join(BASE, "cards.json")
}

/* ---------------- DATA CACHE (même structure qu'avant) ---------------- */

const data = {
 users:         {},
 market:        [],
 marketHistory: [],
 devs:          { owners: [], devs: [] },
 cards:         []
}

/* Dirty flags pour éviter les syncs inutiles */
let _marketDirty = false
let _staticDirty = false

function markMarketDirty()  { _marketDirty = true }
function markStaticDirty()  { _staticDirty = true }

/* ---------------- LOAD FILE (JSON) ---------------- */

function loadFile(file, defaultValue) {

 if (!fs.existsSync(file)) {
  writeAtomic(file, defaultValue)
  return JSON.parse(JSON.stringify(defaultValue))
 }

 return readJsonSafe(file, defaultValue)

}

/* ---------------- USER (SQLite) ---------------- */

function loadUser(id) {

 /* Cache mémoire d'abord */
 if (data.users[id])
  return data.users[id]

 /* Charger depuis SQLite */
 const user = dbLoadUser(id)

 if (!user) return null

 /* Garantir la structure complète */
 ensureUserStructure(user)

 user._dirty = false

 data.users[id] = user

 return user

}

function saveUser(id) {

 const user = data.users[id]

 if (!user || !user._dirty)
  return

 try {
  dbSaveUser(id, user, data.cards)
 } catch (err) {
  log.error("Erreur sauvegarde user SQLite", { userId: id, err })
 }

 user._dirty = false

}

/* ---------------- MIGRATION LEGACY users.json ---------------- */

function migrateUsersJson() {

 const legacyPath = path.join(BASE, "users.json")

 if (!fs.existsSync(legacyPath))
  return

 log.info("Migration users.json legacy → SQLite")

 const legacy = loadFile(legacyPath, {})

 for (const id in legacy) {
  try {
   dbSaveUser(id, legacy[id], data.cards)
  } catch (err) {
   log.error("Erreur migration user legacy", { userId: id, err })
  }
 }

 fs.renameSync(legacyPath, legacyPath + ".migrated")

 log.info("Migration users.json terminée")

}

/* ---------------- LOAD ALL ---------------- */

function loadAll() {

 /* 1. Charger les données JSON statiques (cards d'abord, nécessaire pour la migration) */
 data.cards = loadFile(paths.cards, [])
 data.devs  = loadFile(paths.devs, { owners: [], devs: [] })

 /* 2. Initialiser SQLite + migration automatique JSON → SQLite */
 getDb()
 runMigration(data.cards)

 /* 3. Migration legacy users.json (très ancien format) */
 migrateUsersJson()

 /* 4. Charger le market depuis SQLite */
 data.market        = dbLoadMarket()
 data.marketHistory = dbLoadMarketHistory(1000)

 log.info("DataManager chargé (SQLite)", {
  cards:   data.cards.length,
  market:  data.market.length,
  users:   dbCountUsers()
 })

}

/* ---------------- SAVE STATIC DATA ---------------- */

function save() {

 try {

  /* Cards et devs restent en JSON — seulement si modifiés */
  if (_staticDirty) {
   writeAtomic(paths.cards, data.cards)
   writeAtomic(paths.devs, data.devs)
   _staticDirty = false
  }

  /* Market → SQLite — seulement si modifié */
  if (_marketDirty) {
   syncMarketToDb()
   _marketDirty = false
  }

 } catch (err) {

  log.error("Erreur sauvegarde DataManager", { err })

 }

}

/**
 * Synchronise le tableau data.market en mémoire vers SQLite.
 * Stratégie : on compare les IDs et on ajoute/supprime les différences.
 * En pratique, le market est petit (<100 entrées), donc un full sync est OK.
 */
function syncMarketToDb() {
 try {
  const dbMarket = dbLoadMarket()
  const dbIds    = new Set(dbMarket.map(l => l.id))
  const memIds   = new Set(data.market.map(l => l.id))

  /* Supprimer de SQLite les listings retirés en mémoire */
  for (const id of dbIds) {
   if (!memIds.has(id)) {
    dbRemoveMarketListing(id)
   }
  }

  /* Ajouter dans SQLite les nouveaux listings */
  for (const listing of data.market) {
   if (!dbIds.has(listing.id)) {
    const newId = dbAddMarketListing(listing)
    listing.id = newId /* mettre à jour l'ID auto-incrémenté */
   }
  }

  /* Sync historique : ajouter les nouvelles entrées */
  const dbHistoryIds = new Set(
   dbLoadMarketHistory(5000).map(h => `${h.seller}:${h.card}:${h.timestamp}`)
  )
  for (const entry of data.marketHistory) {
   const key = `${entry.seller}:${entry.card}:${entry.timestamp}`
   if (!dbHistoryIds.has(key)) {
    dbAddMarketHistory(entry)
   }
  }

 } catch (err) {
  log.error("Erreur sync market → SQLite", { err })
 }
}

/* ---------------- AUTOSAVE DIRTY USERS (30s) ---------------- */

setInterval(() => {

 for (const id in data.users) {

  const user = data.users[id]

  if (user && user._dirty)
   saveUser(id)

 }

 save()

}, 30000)

/* ---------------- EXPORT (même API qu'avant) ---------------- */

module.exports = {
 data,
 loadAll,
 save,
 loadUser,
 saveUser,
 markMarketDirty,
 markStaticDirty,
 USERS_DIR,
 CARDS_IMAGES_DIR
}
