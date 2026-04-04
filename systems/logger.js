/* ═══════════════════════════════════════════════════════════════
   LOGGER STRUCTURÉ — systems/logger.js

   Remplace tous les console.log/console.error artisanaux.

   Usage :
     const { createLogger } = require("./logger")
     const log = createLogger("GUILD")
     log.info("Chargé", { count: 5 })
     log.error("Erreur lecture", { err })

   Config via variables d'environnement :
     LOG_LEVEL=debug|info|warn|error|fatal  (défaut: info)
     LOG_TO_FILE=true|false                 (défaut: false)
═══════════════════════════════════════════════════════════════ */

const fs   = require("fs")
const path = require("path")

/* ─── Niveaux ─── */

const LEVELS = { debug: 0, info: 1, warn: 2, error: 3, fatal: 4 }

/* ─── Config ─── */

const LOG_LEVEL   = process.env.LOG_LEVEL || "info"
const LOG_TO_FILE = process.env.LOG_TO_FILE === "true"
const LOG_DIR     = path.join(process.cwd(), "logs")

if (LOG_TO_FILE && !fs.existsSync(LOG_DIR)) {
 fs.mkdirSync(LOG_DIR, { recursive: true })
}

/* ─── Formatage ─── */

function formatMessage(level, system, message, meta) {

 const ts   = new Date().toISOString()
 const base = `[${ts}] [${level.toUpperCase()}] [${system}] ${message}`

 if (meta && Object.keys(meta).length > 0) {

  const cleaned = {}

  for (const [key, value] of Object.entries(meta)) {

   if (value instanceof Error) {
    cleaned[key] = {
     message: value.message,
     stack:   value.stack,
     code:    value.code || undefined
    }
   } else {
    cleaned[key] = value
   }

  }

  return `${base} ${JSON.stringify(cleaned)}`

 }

 return base
}

/* ─── Écriture fichier (append async — non bloquant) ─── */

function writeToFile(formatted) {

 if (!LOG_TO_FILE) return

 const date     = new Date().toISOString().split("T")[0]
 const filePath = path.join(LOG_DIR, `${date}.log`)

 fs.appendFile(filePath, formatted + "\n", () => {})

}

/* ─── Timer de performance ─── */

function createTimer(label) {

 const start = Date.now()

 return {
  end: (meta) => ({
   label,
   duration: Date.now() - start,
   ...meta
  })
 }

}

/* ─── Factory par système ─── */

function createLogger(system) {

 const log = (level, message, meta) => {

  if (LEVELS[level] < LEVELS[LOG_LEVEL]) return

  const formatted = formatMessage(level, system, message, meta)

  if (level === "error" || level === "fatal") {
   console.error(formatted)
  } else if (level === "warn") {
   console.warn(formatted)
  } else {
   console.log(formatted)
  }

  writeToFile(formatted)

 }

 return {
  debug: (msg, meta) => log("debug", msg, meta),
  info:  (msg, meta) => log("info",  msg, meta),
  warn:  (msg, meta) => log("warn",  msg, meta),
  error: (msg, meta) => log("error", msg, meta),
  fatal: (msg, meta) => log("fatal", msg, meta)
 }

}

/* ─── Export ─── */

module.exports = { createLogger, createTimer }