/* ════════════════════════════════════════════════════════════
   INDEX.JS — Point d'entrée

   1. Logger structuré
   2. Handlers unhandledRejection / uncaughtException
   3. Graceful shutdown (sauvegarde dirty users + ferme SQLite)
   4. Lock file anti-double instance
════════════════════════════════════════════════════════════ */

const fs   = require("fs")
const path = require("path")

const { createLogger } = require("./systems/logger")
const { bootstrap }    = require("./app/bootstrap")

const log = createLogger("PROCESS")

/* ─── LOCK FILE ─── */

const LOCK_FILE = path.join(process.cwd(), ".bot.lock")
const isRailway = Boolean(
 process.env.RAILWAY_SERVICE_ID ||
 process.env.RAILWAY_PROJECT_ID ||
 process.env.RAILWAY_ENVIRONMENT
)
const shouldUseLock = !isRailway

function acquireLock() {

 if (fs.existsSync(LOCK_FILE)) {

  const raw = fs.readFileSync(LOCK_FILE, "utf8").trim()
  const pid = Number(raw)

  if (Number.isFinite(pid) && pid > 0) {
   try {
    process.kill(pid, 0)
    log.error("Une instance est déjà active", { pid })
    process.exit(1)
   } catch (_) {}
  }

 }

 fs.writeFileSync(LOCK_FILE, String(process.pid), "utf8")

}

function releaseLock() {
 if (!shouldUseLock) return
 try {
  fs.rmSync(LOCK_FILE, { force: true })
 } catch (_) {}
}

if (shouldUseLock) {
 acquireLock()
} else {
 log.info("Lock file desactive sur Railway (non bloquant)")
}

/* ─── GRACEFUL SHUTDOWN ─── */

let isShuttingDown = false

async function gracefulShutdown(signal) {
 if (isShuttingDown) return
 isShuttingDown = true

 log.info(`Signal ${signal} reçu — sauvegarde en cours...`)

 try {
  const dataManager = require("./systems/dataManager")

  /* Sauvegarder tous les dirty users */
  let savedCount = 0
  for (const id in dataManager.data.users) {
   const user = dataManager.data.users[id]
   if (user && user._dirty) {
    dataManager.saveUser(id)
    savedCount++
   }
  }

  /* Sauvegarder les données statiques */
  dataManager.save()

  log.info("Sauvegarde terminée", { usersSaved: savedCount })

  /* Fermer SQLite proprement */
  try {
   const { closeDb } = require("./systems/database")
   closeDb()
  } catch (_) {}

 } catch (err) {
  log.error("Erreur pendant la sauvegarde de shutdown", { err })
 }

 releaseLock()
 process.exit(0)
}

process.on("exit",    releaseLock)
process.on("SIGINT",  () => gracefulShutdown("SIGINT"))
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"))

/* ─── GLOBAL ERROR HANDLERS ─── */

process.on("unhandledRejection", (reason, _promise) => {
 log.error("Unhandled Promise Rejection", {
  reason: reason instanceof Error ? reason : String(reason)
 })
})

process.on("uncaughtException", (err) => {
 log.fatal("Uncaught Exception — le bot va redémarrer", { err })

 /* Tenter une sauvegarde d'urgence avant exit */
 try {
  const dataManager = require("./systems/dataManager")
  for (const id in dataManager.data.users) {
   const user = dataManager.data.users[id]
   if (user && user._dirty) dataManager.saveUser(id)
  }
  dataManager.save()
  log.info("Sauvegarde d'urgence réussie")
 } catch (_) {}

 /* Fermer SQLite */
 try {
  const { closeDb } = require("./systems/database")
  closeDb()
 } catch (_) {}

 releaseLock()
 process.exit(1)
})

/* ─── BOOTSTRAP ─── */

bootstrap().catch((error) => {
 log.fatal("Fatal bootstrap error", { err: error })
 releaseLock()
 process.exit(1)
})
