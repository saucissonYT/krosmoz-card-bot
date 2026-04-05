/* ═══════════════════════════════════════════════════════════════
   MIGRATE — systems/migrate.js

   Migration automatique des données JSON vers SQLite.
   S'exécute une seule fois au premier boot après la mise à jour.
   Les fichiers JSON originaux sont conservés en backup (.migrated).

   v0.38 : users + market
   v0.39 : + guilds + battlepass progress

   Usage :
     const { runMigration } = require("./migrate")
     runMigration()  // appelé dans dataManager.loadAll()

   Sécurité :
   - Vérifie si la migration a déjà été faite via meta.migrated_at
   - Utilise une transaction SQLite (tout ou rien)
   - Ne supprime JAMAIS les fichiers JSON (renomme en .migrated)
   - Log chaque étape pour debug
═══════════════════════════════════════════════════════════════ */

const fs   = require("fs")
const path = require("path")

const { getBasePath }  = require("./paths")
const { createLogger, createTimer } = require("./logger")
const {
 getDb,
 dbSaveUser,
 dbAddMarketListing,
 dbAddMarketHistory,
 dbSaveGuild,
 dbSaveBattlePassProgress,
 dbGetMeta,
 dbSetMeta
} = require("./database")

const log = createLogger("MIGRATE")

/**
 * Lit un fichier JSON avec fallback.
 */
function readJsonFile(filePath, fallback) {
 try {
  if (!fs.existsSync(filePath)) return fallback
  const raw = fs.readFileSync(filePath, "utf8")
  if (!raw || raw.trim() === "") return fallback
  return JSON.parse(raw)
 } catch (_) {
  return fallback
 }
}

/**
 * Renomme un fichier en .migrated (backup).
 */
function backupFile(filePath) {
 const backup = filePath + ".migrated"
 if (fs.existsSync(filePath) && !fs.existsSync(backup)) {
  fs.renameSync(filePath, backup)
  log.info("Backup créé", { file: path.basename(filePath), backup: path.basename(backup) })
 }
}

/**
 * Lance la migration JSON → SQLite.
 * Ne fait rien si déjà migrée.
 * @param {Array} cardsDefs - Définitions des cartes (pour calcul SSR count)
 */
function runMigration(cardsDefs = []) {

 /* Vérifier si déjà migrée */
 const alreadyMigrated = dbGetMeta("migrated_at")
 if (alreadyMigrated) {
  /* Vérifier si les nouvelles migrations (v0.39) ont été faites */
  runGuildMigration()
  runBattlePassMigration()
  return
 }

 const BASE = getBasePath()
 const timer = createTimer("migration")

 log.info("══════════════════════════════════")
 log.info("   MIGRATION JSON → SQLite")
 log.info("══════════════════════════════════")

 const db = getDb()
 const transaction = db.transaction(() => {

  /* ═══ 1. USERS ═══ */

  const usersDir = path.join(BASE, "users")
  let userCount = 0

  if (fs.existsSync(usersDir)) {
   const files = fs.readdirSync(usersDir).filter(f => f.endsWith(".json"))

   log.info(`Migration de ${files.length} utilisateurs...`)

   for (const file of files) {
    try {
     const userId   = file.replace(".json", "")
     const filePath = path.join(usersDir, file)
     const user     = readJsonFile(filePath, null)

     if (!user) continue

     dbSaveUser(userId, user, cardsDefs)
     userCount++

    } catch (err) {
     log.error("Erreur migration user", { file, err: err.message })
    }
   }

   log.info(`✅ ${userCount} utilisateurs migrés`)
  }

  /* ═══ 2. MARKET ═══ */

  const marketPath = path.join(BASE, "market.json")
  const market = readJsonFile(marketPath, [])
  let marketCount = 0

  if (Array.isArray(market) && market.length > 0) {
   log.info(`Migration de ${market.length} annonces market...`)

   for (const entry of market) {
    try {
     dbAddMarketListing({
      seller:         String(entry.seller || ""),
      card:           String(entry.card || ""),
      price:          Number(entry.price || 0),
      type:           entry.type || "card",
      fragmentNumber: entry.fragmentNumber || null,
      timestamp:      Number(entry.timestamp || Date.now())
     })
     marketCount++
    } catch (err) {
     log.error("Erreur migration market", { err: err.message })
    }
   }

   log.info(`✅ ${marketCount} annonces migrées`)
  }

  /* ═══ 3. MARKET HISTORY ═══ */

  const historyPath = path.join(BASE, "marketHistory.json")
  const history = readJsonFile(historyPath, [])
  let historyCount = 0

  if (Array.isArray(history) && history.length > 0) {
   log.info(`Migration de ${history.length} entrées historique...`)

   for (const entry of history) {
    try {
     dbAddMarketHistory({
      seller:         String(entry.seller || ""),
      buyer:          String(entry.buyer || ""),
      card:           String(entry.card || ""),
      price:          Number(entry.price || 0),
      type:           entry.type || "card",
      fragmentNumber: entry.fragmentNumber || null,
      timestamp:      Number(entry.timestamp || Date.now())
     })
     historyCount++
    } catch (err) {
     log.error("Erreur migration history", { err: err.message })
    }
   }

   log.info(`✅ ${historyCount} entrées historique migrées`)
  }

  /* ═══ 4. MARQUER COMME MIGRÉE ═══ */

  dbSetMeta("migrated_at", new Date().toISOString())
  dbSetMeta("migrated_users", String(userCount))
  dbSetMeta("migrated_market", String(marketCount))
  dbSetMeta("migrated_history", String(historyCount))

 })

 /* Exécuter la transaction (tout ou rien) */
 try {
  transaction()
 } catch (err) {
  log.fatal("ÉCHEC DE LA MIGRATION — les données JSON sont intactes", { err })
  throw err
 }

 /* ═══ 5. BACKUP DES FICHIERS JSON ═══ */

 const usersDir = path.join(BASE, "users")
 if (fs.existsSync(usersDir)) {
  const backupDir = usersDir + ".migrated"
  if (!fs.existsSync(backupDir)) {
   fs.renameSync(usersDir, backupDir)
   fs.mkdirSync(usersDir, { recursive: true }) /* Recréer le dossier vide */
   log.info("Dossier users/ sauvegardé en users.migrated/")
  }
 }

 backupFile(path.join(BASE, "market.json"))
 backupFile(path.join(BASE, "marketHistory.json"))

 const result = timer.end()
 log.info("══════════════════════════════════")
 log.info("   MIGRATION v0.38 TERMINÉE", result)
 log.info("══════════════════════════════════")

 /* Lancer les nouvelles migrations v0.39 */
 runGuildMigration()
 runBattlePassMigration()
}

/* ═══════════════════════════════════════════════════════════════
   MIGRATION v0.39 — GUILDS (guilds.json → SQLite)
═══════════════════════════════════════════════════════════════ */

function runGuildMigration() {

 const already = dbGetMeta("migrated_guilds_at")
 if (already) return

 const BASE      = getBasePath()
 const guildPath = path.join(BASE, "guilds.json")

 if (!fs.existsSync(guildPath)) {
  dbSetMeta("migrated_guilds_at", new Date().toISOString())
  dbSetMeta("migrated_guilds", "0")
  log.debug("Pas de guilds.json à migrer")
  return
 }

 const guilds = readJsonFile(guildPath, {})
 const entries = Object.values(guilds)

 if (entries.length === 0) {
  dbSetMeta("migrated_guilds_at", new Date().toISOString())
  dbSetMeta("migrated_guilds", "0")
  return
 }

 log.info("══════════════════════════════════")
 log.info("   MIGRATION GUILDS → SQLite")
 log.info("══════════════════════════════════")

 const db = getDb()
 let guildCount = 0

 const transaction = db.transaction(() => {
  for (const guild of entries) {
   try {
    if (!guild || !guild.id) continue
    dbSaveGuild(guild)
    guildCount++
   } catch (err) {
    log.error("Erreur migration guild", { guildId: guild?.id, err: err.message })
   }
  }

  dbSetMeta("migrated_guilds_at", new Date().toISOString())
  dbSetMeta("migrated_guilds", String(guildCount))
 })

 try {
  transaction()
  log.info(`✅ ${guildCount} guildes migrées vers SQLite`)
  backupFile(guildPath)
 } catch (err) {
  log.error("ÉCHEC migration guilds — guilds.json intact", { err })
 }
}

/* ═══════════════════════════════════════════════════════════════
   MIGRATION v0.39 — BATTLEPASS PROGRESS (fichiers JSON → SQLite)
═══════════════════════════════════════════════════════════════ */

function runBattlePassMigration() {

 const already = dbGetMeta("migrated_battlepass_at")
 if (already) return

 const BASE        = getBasePath()
 const progressDir = path.join(BASE, "battlepass", "progress")

 if (!fs.existsSync(progressDir)) {
  dbSetMeta("migrated_battlepass_at", new Date().toISOString())
  dbSetMeta("migrated_battlepass", "0")
  log.debug("Pas de dossier battlepass/progress à migrer")
  return
 }

 const files = fs.readdirSync(progressDir).filter(f => f.endsWith(".json"))

 if (files.length === 0) {
  dbSetMeta("migrated_battlepass_at", new Date().toISOString())
  dbSetMeta("migrated_battlepass", "0")
  return
 }

 log.info("══════════════════════════════════")
 log.info("   MIGRATION BATTLEPASS → SQLite")
 log.info("══════════════════════════════════")

 const db = getDb()
 let bpCount = 0

 const transaction = db.transaction(() => {
  for (const file of files) {
   try {
    const filePath = path.join(progressDir, file)
    const progress = readJsonFile(filePath, null)

    if (!progress) continue

    /* S'assurer que userId et seasonId existent */
    if (!progress.userId) {
     progress.userId = file.replace(".json", "")
    }
    if (!progress.seasonId) {
     /* Essayer de lire la saison courante */
     const currentPath = path.join(BASE, "battlepass", "current_season.json")
     const current = readJsonFile(currentPath, {})
     progress.seasonId = current.activeSeason || "emeraude"
    }

    dbSaveBattlePassProgress(progress)
    bpCount++

   } catch (err) {
    log.error("Erreur migration battlepass progress", { file, err: err.message })
   }
  }

  dbSetMeta("migrated_battlepass_at", new Date().toISOString())
  dbSetMeta("migrated_battlepass", String(bpCount))
 })

 try {
  transaction()
  log.info(`✅ ${bpCount} progressions battlepass migrées vers SQLite`)

  /* Backup du dossier progress */
  const backupDir = progressDir + ".migrated"
  if (!fs.existsSync(backupDir)) {
   fs.renameSync(progressDir, backupDir)
   fs.mkdirSync(progressDir, { recursive: true }) /* Recréer vide */
   log.info("Dossier battlepass/progress/ sauvegardé en progress.migrated/")
  }
 } catch (err) {
  log.error("ÉCHEC migration battlepass — fichiers JSON intacts", { err })
 }
}

module.exports = { runMigration }