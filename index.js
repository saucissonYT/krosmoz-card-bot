/* ════════════════════════════════════════════════════════════
   MODIFICATIONS :
   1. Ajout du logger structuré
   2. Ajout handlers unhandledRejection / uncaughtException
   3. Le reste (lock file, bootstrap) est inchangé
════════════════════════════════════════════════════════════ */

const fs   = require("fs")
const path = require("path")

const { createLogger } = require("./systems/logger")
const { bootstrap }    = require("./app/bootstrap")

const log = createLogger("PROCESS")

/* ─── LOCK FILE (inchangé) ─── */

const LOCK_FILE = path.join(process.cwd(), ".bot.lock")

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
 try {
  fs.rmSync(LOCK_FILE, { force: true })
 } catch (_) {}
}

acquireLock()
process.on("exit",    releaseLock)
process.on("SIGINT",  () => process.exit(0))
process.on("SIGTERM", () => process.exit(0))

/* ─── GLOBAL ERROR HANDLERS (NOUVEAU) ─── */

process.on("unhandledRejection", (reason, promise) => {
 log.error("Unhandled Promise Rejection", {
  reason: reason instanceof Error ? reason : String(reason)
 })
})

process.on("uncaughtException", (err) => {
 log.fatal("Uncaught Exception — le bot va redémarrer", { err })
 process.exit(1)
})

/* ─── BOOTSTRAP ─── */

bootstrap().catch((error) => {
 log.fatal("Fatal bootstrap error", { err: error })
 process.exit(1)
})