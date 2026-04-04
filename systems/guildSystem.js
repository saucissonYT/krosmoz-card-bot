const fs   = require("fs")
const path = require("path")

const { getUser, save } = require("./userSystem")

/* ════════════════════════════════════════════════════════════
   MODIFICATIONS :
   1. Utilise paths.js au lieu du pattern basePath dupliqué
   2. Utilise logger.js au lieu de console.log/console.error
   3. Utilise fileUtils.js (writeAtomic, readJsonSafe) pour les écritures/lectures
════════════════════════════════════════════════════════════ */

const { getBasePath }                = require("./paths")
const { createLogger }               = require("./logger")
const { writeAtomic, readJsonSafe }  = require("./fileUtils")

const log = createLogger("GUILD")

/* ================= STORAGE ================= */

const BASE       = getBasePath()
const GUILD_PATH = path.join(BASE, "guilds.json")

log.info("Path initialisé", { path: GUILD_PATH })

let guilds = {}

function loadGuilds() {

 try {

  guilds = readJsonSafe(GUILD_PATH, {})

  const count = Object.keys(guilds).length

  if (count === 0) {
   log.info("guilds.json vide ou absent, initialisation propre")
  } else {
   log.info("Guildes chargées", { count })
  }

  /* Sauvegarder si le fichier n'existait pas */
  if (!fs.existsSync(GUILD_PATH)) {
   saveGuilds()
  }

 } catch (err) {

  log.error("Erreur chargement guilds.json", { err })
  guilds = {}

 }

 return guilds

}

function saveGuilds() {

 try {

  const dir = path.dirname(GUILD_PATH)
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })

  /* FIX : écriture atomique pour éviter la corruption */
  writeAtomic(GUILD_PATH, guilds)

 } catch (err) {

  log.error("Erreur sauvegarde guilds.json", { err })

 }

}

/* ================= INIT ================= */

loadGuilds()

/* ================= ORPHAN CLEANUP ================= */
/* Nettoie les user.guildId qui pointent vers des guildes inexistantes.
   Appelé au démarrage depuis index.js après loadGuilds().              */

function cleanOrphanedGuildIds() {

 const { USERS_DIR } = require("./dataManager")

 if (!fs.existsSync(USERS_DIR)) return 0

 let cleaned = 0

 try {

  const files = fs.readdirSync(USERS_DIR).filter(f => f.endsWith(".json"))

  for (const file of files) {

   const filePath = path.join(USERS_DIR, file)

   try {

    const raw      = fs.readFileSync(filePath, "utf8")
    const userData = JSON.parse(raw)

    if (userData.guildId && !guilds[userData.guildId]) {

     const userId = file.replace(".json", "")
     log.info("Nettoyage orphelin", {
      userId,
      guildId: userData.guildId
     })

     delete userData.guildId
     delete userData._dirty

     fs.writeFileSync(filePath, JSON.stringify(userData, null, 2))
     cleaned++

     /* Si le user est déjà chargé en mémoire, nettoyer aussi */
     const memUser = getUser(userId)

     if (memUser && memUser.guildId && !guilds[memUser.guildId]) {
      delete memUser.guildId
      save(userId)
     }

    }

   } catch (err) {
    /* Fichier corrompu ou illisible — on log et on continue */
    log.warn("Erreur lecture user pendant cleanup", {
     file,
     err: err.message
    })
   }

  }

 } catch (err) {

  log.error("Erreur scan USERS_DIR pendant cleanup", { err })

 }

 if (cleaned > 0) {
  log.info("Nettoyage orphelins terminé", { cleaned })
 }

 return cleaned

}

/* ================= CRUD GUILDS ================= */

function getGuild(id) {
 return guilds[id] || null
}

function getAllGuilds() {
 return guilds
}

function getUserGuild(userId) {
 for (const id in guilds) {
  const g = guilds[id]
  if (!g.members) continue
  if (g.members.includes(userId) || g.leader === userId) return { ...g, id }
 }
 return null
}

function createGuild(id, name, leaderId, emoji) {

 if (guilds[id]) return { error: "ID déjà utilisé." }

 guilds[id] = {
  name,
  emoji:    emoji || "🏰",
  leader:   leaderId,
  officers: [],
  members:  [leaderId],
  level:    1,
  xp:       0,
  stats:    {},
  quests:   {},
  createdAt: Date.now()
 }

 saveGuilds()
 return guilds[id]

}

function disbandGuild(id) {

 if (!guilds[id]) return { error: "Guilde introuvable." }

 const guild   = guilds[id]
 const members = guild.members || []

 /* Nettoyer le guildId de chaque membre */
 for (const userId of members) {
  const user = getUser(userId)
  if (user) {
   delete user.guildId
   save(userId)
  }
 }

 delete guilds[id]
 saveGuilds()

 return { ok: true, disbanded: id, membersCleared: members.length }

}

function addGuildXP(id, amount) {

 if (!guilds[id]) return 0

 guilds[id].xp = (guilds[id].xp || 0) + amount

 /* Level up check */
 let leveled = false

 while (guilds[id].xp >= getXPForLevel(guilds[id].level + 1) && guilds[id].level < 100) {
  guilds[id].xp -= getXPForLevel(guilds[id].level + 1)
  guilds[id].level++
  leveled = true
 }

 if (leveled) saveGuilds()

 return guilds[id].level

}

function getXPForLevel(level) {
 /* Formule progressive : 100 * level^1.5 */
 return Math.floor(100 * Math.pow(level, 1.5))
}

/* ================= EXPORT ================= */

module.exports = {
 loadGuilds,
 saveGuilds,
 cleanOrphanedGuildIds,
 getGuild,
 getAllGuilds,
 getUserGuild,
 createGuild,
 disbandGuild,
 addGuildXP,
 getXPForLevel
}