const fs   = require("fs")
const path = require("path")

const { getUser, save } = require("./userSystem")

/* ════════════════════════════════════════════════════════════
   GUILD SYSTEM — systems/guildSystem.js

   v0.38 : Backend migré de guilds.json → SQLite.
   Le cache mémoire (objet `guilds`) fonctionne exactement pareil.
   - loadGuilds() charge depuis SQLite → cache mémoire
   - saveGuilds() écrit du cache mémoire → SQLite
   - Toutes les fonctions, exports, constantes conservés à l'identique
════════════════════════════════════════════════════════════ */

const { getBasePath }    = require("./paths")
const { createLogger }   = require("./logger")
const {
 dbLoadAllGuilds,
 dbSaveGuild,
 dbDeleteGuild,
 dbCountGuilds,
 dbListUserIds,
 dbLoadUser
} = require("./database")

const log = createLogger("GUILD")

/* ================= STORAGE (cache mémoire) ================= */

let guilds = {}

function loadGuilds() {
 try {
  guilds = dbLoadAllGuilds()
  log.info("Guildes chargées depuis SQLite", { count: Object.keys(guilds).length })
 } catch (err) {
  log.error("Erreur chargement guilds SQLite", { err })
  guilds = {}

  /* Fallback : tenter de lire l'ancien guilds.json */
  try {
   const GUILD_PATH = path.join(getBasePath(), "guilds.json")
   if (fs.existsSync(GUILD_PATH)) {
    const raw = fs.readFileSync(GUILD_PATH, "utf8")
    if (raw && raw.trim() !== "" && raw.trim() !== "{}") {
     guilds = JSON.parse(raw)
     log.info("Fallback guilds.json chargé", { count: Object.keys(guilds).length })
     /* Sauvegarder dans SQLite */
     for (const guild of Object.values(guilds)) {
      try { dbSaveGuild(guild) } catch (_) {}
     }
    }
   }
  } catch (_) {}
 }
 return guilds
}

function saveGuilds() {
 try {
  for (const guild of Object.values(guilds)) {
   dbSaveGuild(guild)
  }
 } catch (err) {
  log.error("Erreur sauvegarde guilds SQLite", { err })
 }
}

/* ================= INIT ================= */

loadGuilds()

/* ================= ORPHAN CLEANUP ================= */

function cleanOrphanedGuildIds() {

 let cleaned = 0

 try {
  const userIds = dbListUserIds()

  for (const userId of userIds) {
   try {
    const userData = dbLoadUser(userId)

    if (userData && userData.guildId && !guilds[userData.guildId]) {
     log.info("Nettoyage orphelin", { userId, guildId: userData.guildId })

     /* Nettoyer via userSystem pour la cohérence cache */
     const memUser = getUser(userId)
     if (memUser && memUser.guildId && !guilds[memUser.guildId]) {
      delete memUser.guildId
      save(userId)
     }

     cleaned++
    }
   } catch (err) {
    log.warn("Erreur user pendant cleanup", { userId, err: err.message })
   }
  }
 } catch (err) {
  log.error("Erreur nettoyage orphelins", { err })
 }

 if (cleaned > 0)
  log.info("Orphelins nettoyés", { cleaned })

 return cleaned
}

/* ================= EMOJIS ALEATOIRES ================= */

const GUILD_EMOJIS = [
 "🐉","🦁","🐺","🦅","🐲","🦊","🐻","🦇","🐍","🦈",
 "🔥","⚡","❄️","🌊","🌪️","☀️","🌙","⭐","💫","🌟",
 "⚔️","🛡️","🏹","🗡️","💎","👑","🏆","🎯","🎪","🎭",
 "🐾","🦂","🦎","🐙","🦑","🐋","🦬","🦏","🐊","🦖",
 "🌀","🔮","💀","🧿","🪶","🍀","🌸","🌺","🔱","⚜️"
]

function randomEmoji() {
 return GUILD_EMOJIS[Math.floor(Math.random() * GUILD_EMOJIS.length)]
}

/* ================= CONSTANTES ================= */

const MAX_MEMBERS  = 10
const CREATE_COST  = 5000
const RENAME_COST  = 2000
const MAX_OFFICERS = 3

/* ================= XP / LEVEL ================= */

function xpRequired(level) {
 return 100 + level * 50
}

function getTotalXpForLevel(level) {
 let total = 0
 for (let i = 1; i <= level; i++) total += xpRequired(i)
 return total
}

function addGuildXP(guildId, amount) {

 const guild = guilds[guildId]
 if (!guild) return null

 guild.xp += amount
 guild.stats.totalXpEarned = (guild.stats.totalXpEarned || 0) + amount

 let leveled  = false
 let oldLevel = guild.level

 while (guild.xp >= xpRequired(guild.level) && guild.level < 100) {
  guild.xp -= xpRequired(guild.level)
  guild.level++
  leveled = true
 }

 if (guild.level >= 100) guild.level = 100

 saveGuilds()

 return {
  leveled,
  oldLevel,
  newLevel: guild.level,
  xp:       guild.xp,
  required: xpRequired(guild.level)
 }
}

/* ================= GENERATE ID ================= */

function generateId() {
 return Date.now().toString(36) + Math.random().toString(36).slice(2, 6)
}

/* ================= HELPER : vérifier & nettoyer guildId orphelin ================= */

function validateUserGuild(userId) {
 const user = getUser(userId)
 if (user.guildId && !guilds[user.guildId]) {
  log.info("Auto-nettoyage guildId orphelin", { userId })
  delete user.guildId
  save(userId)
  return false
 }
 return !!user.guildId
}

/* ================= CRUD ================= */

function createGuild(userId, name) {

 const user = getUser(userId)

 if (user.guildId) {
  if (guilds[user.guildId]) {
   return { error: "Tu es déjà dans une guilde." }
  }
  log.info("Nettoyage guildId orphelin avant création", { userId, guildId: user.guildId })
  delete user.guildId
  save(userId)
 }

 if (user.kamas < CREATE_COST)
  return { error: `Il faut ${CREATE_COST} kamas pour créer une guilde.` }

 const existing = Object.values(guilds).find(
  g => g.name.toLowerCase() === name.toLowerCase()
 )
 if (existing)
  return { error: "Ce nom de guilde est déjà pris." }

 if (name.length < 3 || name.length > 24)
  return { error: "Le nom doit faire entre 3 et 24 caractères." }

 user.kamas -= CREATE_COST

 const id    = generateId()
 const emoji = randomEmoji()

 guilds[id] = {
  id,
  name,
  emoji,
  leaderId:   userId,
  officerIds: [],
  memberIds:  [userId],
  level:      1,
  xp:         0,
  createdAt:  new Date().toISOString(),
  questSnapshot:  {},
  questsClaimed:  [],
  questsDayClaimed: [],
  questsWeek: null,
  stats: {
   totalXpEarned:   0,
   questsCompleted: 0
  }
 }

 user.guildId = id
 user.stats = user.stats || {}
 user.stats.guildCreated = (user.stats.guildCreated || 0) + 1

 save(userId)
 saveGuilds()

 try { require("../web/Server").pushActivity({ kind: "guild_create", userId, guildName: name }) } catch(_) {}

 return { guild: guilds[id] }
}

function disbandGuild(guildId, requesterId) {

 const guild = guilds[guildId]
 if (!guild) return { error: "Guilde introuvable." }

 if (guild.leaderId !== requesterId)
  return { error: "Seul le meneur peut dissoudre la guilde." }

 for (const memberId of guild.memberIds) {
  const u = getUser(memberId)
  if (u.guildId === guildId) {
   delete u.guildId
   save(memberId)
  }
 }

 const name = guild.name
 delete guilds[guildId]

 /* Supprimer de SQLite aussi */
 try { dbDeleteGuild(guildId) } catch (_) {}

 saveGuilds()

 try { require("../web/Server").pushActivity({ kind: "guild_disband", guildName: name }) } catch(_) {}

 return { name }
}

function joinGuild(userId, guildId) {

 const user  = getUser(userId)
 const guild = guilds[guildId]

 if (!guild) return { error: "Guilde introuvable." }

 if (user.guildId) {
  if (guilds[user.guildId]) {
   return { error: "Tu es déjà dans une guilde." }
  }
  delete user.guildId
  save(userId)
 }

 if (guild.memberIds.length >= MAX_MEMBERS)
  return { error: `La guilde est pleine (${MAX_MEMBERS}/${MAX_MEMBERS}).` }

 guild.memberIds.push(userId)
 user.guildId = guildId

 save(userId)
 saveGuilds()

 return { guild }
}

function leaveGuild(userId) {

 const user = getUser(userId)
 if (!user.guildId) return { error: "Tu n'es dans aucune guilde." }

 const guild = guilds[user.guildId]
 if (!guild) {
  delete user.guildId
  save(userId)
  return { error: "Guilde introuvable (nettoyé)." }
 }

 if (guild.leaderId === userId)
  return { error: "Le meneur ne peut pas quitter. Utilise /guildmanage pour dissoudre ou transférer." }

 guild.memberIds  = guild.memberIds.filter(id => id !== userId)
 guild.officerIds = guild.officerIds.filter(id => id !== userId)

 delete user.guildId
 save(userId)
 saveGuilds()

 return { guild }
}

function kickMember(guildId, requesterId, targetId) {

 const guild = guilds[guildId]
 if (!guild) return { error: "Guilde introuvable." }

 const isLeader  = guild.leaderId === requesterId
 const isOfficer = guild.officerIds.includes(requesterId)

 if (!isLeader && !isOfficer)
  return { error: "Seuls le meneur et les officiers peuvent exclure." }

 if (targetId === guild.leaderId)
  return { error: "Impossible d'exclure le meneur." }

 if (!isLeader && guild.officerIds.includes(targetId))
  return { error: "Un officier ne peut pas exclure un autre officier." }

 if (!guild.memberIds.includes(targetId))
  return { error: "Ce joueur n'est pas dans la guilde." }

 guild.memberIds  = guild.memberIds.filter(id => id !== targetId)
 guild.officerIds = guild.officerIds.filter(id => id !== targetId)

 const user = getUser(targetId)
 delete user.guildId
 save(targetId)
 saveGuilds()

 return { guild }
}

function promoteOfficer(guildId, requesterId, targetId) {

 const guild = guilds[guildId]
 if (!guild) return { error: "Guilde introuvable." }

 if (guild.leaderId !== requesterId)
  return { error: "Seul le meneur peut promouvoir." }

 if (!guild.memberIds.includes(targetId))
  return { error: "Ce joueur n'est pas dans la guilde." }

 if (guild.officerIds.includes(targetId))
  return { error: "Ce joueur est déjà officier." }

 if (targetId === guild.leaderId)
  return { error: "Le meneur ne peut pas être officier." }

 if (guild.officerIds.length >= MAX_OFFICERS)
  return { error: `Maximum ${MAX_OFFICERS} officiers.` }

 guild.officerIds.push(targetId)

 /* Stats pour achievement */
 const targetUser = getUser(targetId)
 targetUser.stats = targetUser.stats || {}
 targetUser.stats.guildPromoted = (targetUser.stats.guildPromoted || 0) + 1
 save(targetId)

 saveGuilds()

 return { guild }
}

function demoteOfficer(guildId, requesterId, targetId) {

 const guild = guilds[guildId]
 if (!guild) return { error: "Guilde introuvable." }

 if (guild.leaderId !== requesterId)
  return { error: "Seul le meneur peut rétrograder." }

 if (!guild.officerIds.includes(targetId))
  return { error: "Ce joueur n'est pas officier." }

 guild.officerIds = guild.officerIds.filter(id => id !== targetId)
 saveGuilds()

 return { guild }
}

function transferLeader(guildId, requesterId, targetId) {

 const guild = guilds[guildId]
 if (!guild) return { error: "Guilde introuvable." }

 if (guild.leaderId !== requesterId)
  return { error: "Seul le meneur peut transférer." }

 if (!guild.memberIds.includes(targetId))
  return { error: "Ce joueur n'est pas dans la guilde." }

 if (targetId === requesterId)
  return { error: "Tu es déjà le meneur." }

 /* Ancien meneur → officier (s'il reste de la place) */
 guild.officerIds = guild.officerIds.filter(id => id !== targetId)
 if (guild.officerIds.length < MAX_OFFICERS) {
  guild.officerIds.push(requesterId)
 }

 guild.leaderId = targetId

 /* Stats pour achievement */
 const requesterUser = getUser(requesterId)
 requesterUser.stats = requesterUser.stats || {}
 requesterUser.stats.guildTransferred = (requesterUser.stats.guildTransferred || 0) + 1
 save(requesterId)

 saveGuilds()

 return { guild }
}

function renameGuild(guildId, requesterId, newName) {

 const guild = guilds[guildId]
 if (!guild) return { error: "Guilde introuvable." }

 if (guild.leaderId !== requesterId)
  return { error: "Seul le meneur peut renommer." }

 if (newName.length < 3 || newName.length > 24)
  return { error: "Le nom doit faire entre 3 et 24 caractères." }

 const existing = Object.values(guilds).find(
  g => g.id !== guildId && g.name.toLowerCase() === newName.toLowerCase()
 )
 if (existing) return { error: "Ce nom est déjà pris." }

 const user = getUser(requesterId)
 if (user.kamas < RENAME_COST)
  return { error: `Il faut ${RENAME_COST} kamas pour renommer.` }

 user.kamas -= RENAME_COST
 guild.name  = newName
 guild.emoji = randomEmoji()

 /* Stats pour achievement */
 user.stats = user.stats || {}
 user.stats.guildRenamed = (user.stats.guildRenamed || 0) + 1

 save(requesterId)
 saveGuilds()

 return { guild }
}

/* ================= GETTERS ================= */

function getGuild(guildId) {
 return guilds[guildId] || null
}

function getUserGuild(userId) {
 const user = getUser(userId)
 if (!user.guildId) return null

 const guild = guilds[user.guildId]

 if (!guild) {
  log.info("getUserGuild: nettoyage orphelin", { userId })
  delete user.guildId
  save(userId)
  return null
 }

 return guild
}

function getAllGuilds() {
 return Object.values(guilds)
}

function getGuildRank(guildId, memberId) {
 const guild = guilds[guildId]
 if (!guild) return "membre"
 if (guild.leaderId === memberId) return "meneur"
 if (guild.officerIds.includes(memberId)) return "officier"
 return "membre"
}

/* ================= DEV TOOLS ================= */

function devSetLevel(guildId, level) {
 const guild = guilds[guildId]
 if (!guild) return { error: "Guilde introuvable." }
 guild.level = Math.max(1, Math.min(100, level))
 guild.xp = 0
 saveGuilds()
 return { guild }
}

function devAddXP(guildId, amount) {
 return addGuildXP(guildId, amount)
}

function devForceJoin(userId, guildId) {
 const user  = getUser(userId)
 const guild = guilds[guildId]
 if (!guild) return { error: "Guilde introuvable." }
 if (user.guildId) delete user.guildId
 guild.memberIds = guild.memberIds.filter(id => id !== userId)
 guild.memberIds.push(userId)
 user.guildId = guildId
 save(userId)
 saveGuilds()
 return { guild }
}

/* ================= EXPORT ================= */

module.exports = {
 loadGuilds,
 saveGuilds,
 createGuild,
 disbandGuild,
 joinGuild,
 leaveGuild,
 kickMember,
 promoteOfficer,
 demoteOfficer,
 transferLeader,
 renameGuild,
 getGuild,
 getUserGuild,
 getAllGuilds,
 getGuildRank,
 addGuildXP,
 xpRequired,
 devSetLevel,
 devAddXP,
 devForceJoin,
 cleanOrphanedGuildIds,
 validateUserGuild,
 MAX_MEMBERS,
 CREATE_COST,
 RENAME_COST,
 MAX_OFFICERS
}