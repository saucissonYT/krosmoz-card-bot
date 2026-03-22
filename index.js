const fs = require("fs")
const path = require("path")
const { bootstrap } = require("./app/bootstrap")

const LOCK_FILE = path.join(process.cwd(), ".bot.lock")

function acquireLock() {
 if (fs.existsSync(LOCK_FILE)) {
  const raw = fs.readFileSync(LOCK_FILE, "utf8").trim()
  const pid = Number(raw)

  if (Number.isFinite(pid) && pid > 0) {
   try {
    process.kill(pid, 0)
    console.error(`Une instance est deja active (pid ${pid}).`)
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
process.on("exit", releaseLock)
process.on("SIGINT", () => process.exit(0))
process.on("SIGTERM", () => process.exit(0))

bootstrap().catch((error) => {
 console.error("Fatal bootstrap error:", error)
 process.exit(1)
})
