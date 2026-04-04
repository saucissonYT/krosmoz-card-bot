const fs   = require("fs")
const path = require("path")

/* ════════════════════════════════════════════════════════════
   MODIFICATIONS :
   1. Utilise paths.js au lieu du pattern basePath dupliqué
   2. Utilise logger.js au lieu de console.log/console.error
   3. Utilise fileUtils.js (writeAtomic) pour les écritures
   4. Utilise userDefaults.js (ensureUserStructure) au loadUser
════════════════════════════════════════════════════════════ */

const { getBasePath }          = require("./paths")
const { createLogger }         = require("./logger")
const { writeAtomic, readJsonSafe } = require("./fileUtils")
const { ensureUserStructure }  = require("./userDefaults")

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

/* ---------------- FILE PATHS ---------------- */

const paths = {
 users:         path.join(BASE, "users.json"),
 market:        path.join(BASE, "market.json"),
 marketHistory: path.join(BASE, "marketHistory.json"),
 devs:          path.join(BASE, "devs.json"),
 cards:         path.join(BASE, "cards.json")
}

/* ---------------- DATA CACHE ---------------- */

const data = {
 users:         {},
 market:        [],
 marketHistory: [],
 devs:          { owners: [], devs: [] },
 cards:         []
}

/* ---------------- LOAD FILE ---------------- */

function loadFile(file, defaultValue) {

 if (!fs.existsSync(file)) {
  writeAtomic(file, defaultValue)
  return JSON.parse(JSON.stringify(defaultValue))
 }

 return readJsonSafe(file, defaultValue)

}

/* ---------------- USER FILE ---------------- */

function getUserFile(id) {
 return path.join(USERS_DIR, `${id}.json`)
}

function loadUser(id) {

 if (data.users[id])
  return data.users[id]

 const file = getUserFile(id)

 if (!fs.existsSync(file))
  return null

 try {

  const raw  = fs.readFileSync(file, "utf8")
  const user = JSON.parse(raw)

  /* FIX : garantir la structure complète au chargement */
  ensureUserStructure(user)

  user._dirty = false

  data.users[id] = user

  return user

 } catch (err) {

  log.error("Erreur lecture user", { userId: id, err })
  return null

 }

}

function saveUser(id) {

 const user = data.users[id]

 if (!user || !user._dirty)
  return

 const file = getUserFile(id)

 const clone = JSON.parse(JSON.stringify(user))

 delete clone._dirty

 /* FIX : écriture atomique pour éviter la corruption */
 try {
  writeAtomic(file, clone)
 } catch (err) {
  log.error("Erreur sauvegarde user", { userId: id, err })
 }

 user._dirty = false

}

/* ---------------- MIGRATION USERS.JSON ---------------- */

function migrateUsersJson() {

 if (!fs.existsSync(paths.users))
  return

 log.info("Migration users.json → users/")

 const legacy = loadFile(paths.users, {})

 for (const id in legacy) {

  const file = getUserFile(id)

  if (!fs.existsSync(file)) {

   writeAtomic(file, legacy[id])

  }

 }

 fs.renameSync(paths.users, paths.users + ".migrated")

 log.info("Migration terminée")

}

/* ---------------- LOAD ALL ---------------- */

function loadAll() {

 migrateUsersJson()

 data.market        = loadFile(paths.market, [])
 data.marketHistory = loadFile(paths.marketHistory, [])
 data.devs          = loadFile(paths.devs, { owners: [], devs: [] })
 data.cards         = loadFile(paths.cards, [])

 log.info("DataManager chargé", {
  cards:  data.cards.length,
  market: data.market.length
 })

}

/* ---------------- SAVE STATIC DATA ---------------- */

function save() {

 try {

  writeAtomic(paths.market, data.market)
  writeAtomic(paths.marketHistory, data.marketHistory)
  writeAtomic(paths.devs, data.devs)
  writeAtomic(paths.cards, data.cards)

 } catch (err) {

  log.error("Erreur sauvegarde DataManager", { err })

 }

}

/* ---------------- AUTOSAVE DIRTY USERS ---------------- */

setInterval(() => {

 for (const id in data.users) {

  const user = data.users[id]

  if (user._dirty)
   saveUser(id)

 }

 save()

}, 30000)

/* ---------------- EXPORT ---------------- */

module.exports = {
 data,
 loadAll,
 save,
 loadUser,
 saveUser,
 USERS_DIR,
 CARDS_IMAGES_DIR
}