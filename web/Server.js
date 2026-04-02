const express = require("express")
const path    = require("path")
const fs      = require("fs")

/* ================================================================
   KROSMOZ CARD — WEB SERVER
   Tourne dans le même process que le bot Discord.
   Expose une API JSON + sert les fichiers statiques du site.
================================================================ */

/* -------- DATA PATHS (même logique que dataManager.js) -------- */

let BASE = "/data"
if (!fs.existsSync(BASE)) BASE = path.join(process.cwd(), "data")

const USERS_DIR   = path.join(BASE, "users")
const CARDS_PATH  = path.join(BASE, "cards.json")
const GUILDS_PATH = path.join(BASE, "guilds.json")

/* sets.json peut être dans /data/cards/ ou dans ./cards/ */
function findSetsPath() {
 const candidates = [
  path.join(BASE, "cards", "sets.json"),
  path.join(process.cwd(), "cards", "sets.json")
 ]
 for (const p of candidates) {
  if (fs.existsSync(p)) return p
 }
 return candidates[0]
}

/* ================================================================
   HELPERS LECTURE FICHIERS
================================================================ */

function readJSON(filePath, fallback) {
 try {
  if (!fs.existsSync(filePath)) return fallback
  const raw = fs.readFileSync(filePath, "utf8")
  if (!raw || raw.trim() === "") return fallback
  return JSON.parse(raw)
 } catch {
  return fallback
 }
}

function getAllUserFiles() {
 if (!fs.existsSync(USERS_DIR)) return []
 return fs.readdirSync(USERS_DIR).filter(f => f.endsWith(".json"))
}

function loadUserFile(userId) {
 const filePath = path.join(USERS_DIR, `${userId}.json`)
 return readJSON(filePath, null)
}

/* ================================================================
   CACHE SYSTÈME (évite de tout relire à chaque requête)
================================================================ */

const CACHE_TTL = 30_000 /* 30 secondes */

const cache = {
 stats:        { data: null, expiresAt: 0 },
 leaderboard:  {},
 discordUsers: {},
 sets:         { data: null, expiresAt: 0 },
 cards:        { data: null, expiresAt: 0 }
}

function getCachedCards() {
 const now = Date.now()
 if (cache.cards.data && now < cache.cards.expiresAt) return cache.cards.data
 cache.cards.data = readJSON(CARDS_PATH, [])
 cache.cards.expiresAt = now + CACHE_TTL
 return cache.cards.data
}

function getCachedSets() {
 const now = Date.now()
 if (cache.sets.data && now < cache.sets.expiresAt) return cache.sets.data
 const raw = readJSON(findSetsPath(), [])
 cache.sets.data = Array.isArray(raw) ? raw : raw?.sets || []
 cache.sets.expiresAt = now + CACHE_TTL
 return cache.sets.data
}

/* ================================================================
   DISCORD USER RESOLUTION (via REST API avec le token du bot)
================================================================ */

async function resolveDiscordUser(userId) {
 const cached = cache.discordUsers[userId]
 if (cached && Date.now() < cached.expiresAt) return cached.data

 const fallback = {
  id: userId,
  username: userId,
  displayName: userId,
  avatar: null,
  avatarURL: null
 }

 try {
  const token = process.env.TOKEN
  if (!token) return fallback

  const res = await fetch(`https://discord.com/api/v10/users/${userId}`, {
   headers: { Authorization: `Bot ${token}` }
  })

  if (!res.ok) return fallback

  const data = await res.json()
  const avatarURL = data.avatar
   ? `https://cdn.discordapp.com/avatars/${userId}/${data.avatar}.${data.avatar.startsWith("a_") ? "gif" : "webp"}?size=256`
   : `https://cdn.discordapp.com/embed/avatars/${(BigInt(userId) >> 22n) % 6n}.png`

  const resolved = {
   id:          userId,
   username:    data.username,
   displayName: data.global_name || data.username,
   avatar:      data.avatar,
   avatarURL
  }

  cache.discordUsers[userId] = { data: resolved, expiresAt: Date.now() + 300_000 }
  return resolved
 } catch {
  return fallback
 }
}

/* ================================================================
   RARITY CONSTANTS (miroir de systems/constants.js)
================================================================ */

const RARITY_EMOJI = { C:"⚪", U:"🟢", R:"🔵", SR:"🟣", HR:"🔴", UR:"🟡", S:"✨", SSR:"🌈" }
const RARITY_ORDER = ["C","U","R","SR","HR","UR","S","SSR"]

/* ================================================================
   API — STATS GLOBALES
================================================================ */

function computeGlobalStats() {
 const now = Date.now()
 if (cache.stats.data && now < cache.stats.expiresAt) return cache.stats.data

 const userFiles = getAllUserFiles()
 const cards     = getCachedCards()
 const guilds    = readJSON(GUILDS_PATH, [])
 const sets      = getCachedSets()

 let totalPlayers    = userFiles.length
 let totalCardsOwned = 0
 let totalKamas      = 0
 let totalPacks      = 0
 let totalFusions    = 0
 let totalSSR        = 0
 let totalAch        = 0

 for (const file of userFiles) {
  const user = readJSON(path.join(USERS_DIR, file), null)
  if (!user) continue

  if (user.cards) {
   for (const id in user.cards) {
    totalCardsOwned += user.cards[id]
    const card = cards.find(c => String(c.id) === String(id))
    if (card?.rarity === "SSR") totalSSR += user.cards[id]
   }
  }

  totalKamas  += user.kamas || 0
  totalPacks  += user.stats?.packsOpened || 0
  totalFusions += user.stats?.fusions || 0
  totalAch    += user.achievements?.length || 0
 }

 const result = {
  players:       totalPlayers,
  totalCards:    cards.length,
  totalSets:     sets.length,
  cardsOwned:    totalCardsOwned,
  ssrOwned:      totalSSR,
  totalKamas:    totalKamas,
  packsOpened:   totalPacks,
  fusions:       totalFusions,
  achievements:  totalAch,
  guilds:        Array.isArray(guilds) ? guilds.length : Object.keys(guilds).length
 }

 cache.stats = { data: result, expiresAt: now + CACHE_TTL }
 return result
}

/* ================================================================
   API — LEADERBOARD
================================================================ */

function computeLeaderboard(category) {
 const cacheKey = category
 const cached   = cache.leaderboard[cacheKey]
 if (cached && Date.now() < cached.expiresAt) return cached.data

 const userFiles = getAllUserFiles()
 const cards     = getCachedCards()
 const entries   = []

 for (const file of userFiles) {
  const userId = file.replace(".json", "")
  const user   = readJSON(path.join(USERS_DIR, file), null)
  if (!user) continue

  let value = 0

  switch (category) {
   case "cards": {
    let total = 0
    if (user.cards) for (const id in user.cards) total += user.cards[id]
    value = total
    break
   }
   case "unique": {
    value = user.cards ? Object.keys(user.cards).length : 0
    break
   }
   case "kamas":
    value = user.kamas || 0
    break
   case "level":
    value = user.progression?.level || 1
    break
   case "achievements":
    value = user.achievements?.length || 0
    break
   case "ssr": {
    let count = 0
    if (user.cards) {
     for (const id in user.cards) {
      const card = cards.find(c => String(c.id) === String(id))
      if (card?.rarity === "SSR") count += user.cards[id]
     }
    }
    value = count
    break
   }
   case "packs":
    value = user.stats?.packsOpened || 0
    break
   default:
    value = 0
  }

  if (value > 0) {
   entries.push({ userId, value, level: user.progression?.level || 1, title: user.title || "Nouveau" })
  }
 }

 entries.sort((a, b) => b.value - a.value)
 const top100 = entries.slice(0, 100)

 cache.leaderboard[cacheKey] = { data: top100, expiresAt: Date.now() + CACHE_TTL }
 return top100
}

/* ================================================================
   API — PROFIL JOUEUR
================================================================ */

function computeProfile(userId) {
 const user = loadUserFile(userId)
 if (!user) return null

 const cards = getCachedCards()
 const sets  = getCachedSets()
 const guilds = readJSON(GUILDS_PATH, [])

 /* Stats de base */
 const totalCards = user.cards
  ? Object.values(user.cards).reduce((a, b) => a + b, 0) : 0
 const uniqueCards = user.cards ? Object.keys(user.cards).length : 0

 /* Breakdown par rareté */
 const rarityBreakdown = {}
 for (const r of RARITY_ORDER) rarityBreakdown[r] = 0

 if (user.cards) {
  for (const id in user.cards) {
   const card = cards.find(c => String(c.id) === String(id))
   if (card) rarityBreakdown[card.rarity] = (rarityBreakdown[card.rarity] || 0) + user.cards[id]
  }
 }

 /* Complétion par set */
 const setProgress = sets.map(set => {
  const setCards = cards.filter(c => c.set === set.id)
  const owned = setCards.filter(c => user.cards?.[c.id] > 0).length
  return {
   id:    set.id,
   name:  set.name,
   owned,
   total: setCards.length,
   pct:   setCards.length > 0 ? Math.round((owned / setCards.length) * 100) : 0
  }
 })

 /* Guilde */
 let guild = null
 if (user.guildId) {
  const guildList = Array.isArray(guilds) ? guilds : Object.values(guilds)
  guild = guildList.find(g => g.id === user.guildId)
  if (guild) {
   guild = {
    id:    guild.id,
    name:  guild.name,
    emoji: guild.emoji,
    level: guild.level || 1
   }
  }
 }

 /* XP curve */
 const level    = user.progression?.level || 1
 const xp       = user.progression?.xp || 0
 const totalXp  = user.progression?.totalXp || 0
 const required  = level < 200 ? 100 + (level * 15) : 0

 return {
  level,
  xp,
  totalXp,
  xpRequired: required,
  xpPercent:  required > 0 ? Math.min(100, Math.round((xp / required) * 100)) : 100,
  kamas:        user.kamas || 0,
  totalCards,
  uniqueCards,
  maxCards:     cards.length,
  title:        user.title || "Nouveau",
  titles:       user.titles || ["Nouveau"],
  achievements: user.achievements?.length || 0,
  guild,
  rarityBreakdown,
  setProgress,
  stats: {
   packsOpened:    user.stats?.packsOpened || 0,
   fusions:        user.stats?.fusions || 0,
   fusionCrit:     user.stats?.fusionCrit || 0,
   cardsSold:      user.stats?.cardsSold || 0,
   cardsBought:    user.stats?.cardsBought || 0,
   ssrPulled:      user.stats?.ssrPulled || 0,
   shinySSR:       user.stats?.shinySSR || 0,
   eventPacksOpened: user.stats?.eventPacksOpened || 0,
   dailyStreak:    user.daily?.streak || 0,
   activityStreak: user.stats?.activityStreak || 0,
   createdAt:      user.stats?.createdAt || null
  }
 }
}

/* ================================================================
   EXPRESS APP
================================================================ */

function createWebApp() {
 const app = express()

 /* ---- Static files ---- */
 app.use(express.static(path.join(__dirname, "public")))

 /* ---- API Routes ---- */

 app.get("/api/stats", (req, res) => {
  try {
   res.json(computeGlobalStats())
  } catch (err) {
   console.error("[WEB] /api/stats error:", err)
   res.status(500).json({ error: "Erreur serveur" })
  }
 })

 app.get("/api/leaderboard/:category", async (req, res) => {
  try {
   const category = req.params.category
   const valid = ["cards", "unique", "kamas", "level", "achievements", "ssr", "packs"]
   if (!valid.includes(category)) return res.status(400).json({ error: "Catégorie invalide" })

   const entries = computeLeaderboard(category)

   /* Résoudre les noms Discord (top 50 seulement pour limiter les appels) */
   const resolved = await Promise.all(
    entries.slice(0, 50).map(async (entry, index) => {
     const discord = await resolveDiscordUser(entry.userId)
     return { ...entry, rank: index + 1, discord }
    })
   )

   res.json(resolved)
  } catch (err) {
   console.error("[WEB] /api/leaderboard error:", err)
   res.status(500).json({ error: "Erreur serveur" })
  }
 })

 app.get("/api/profile/:id", async (req, res) => {
  try {
   const userId = req.params.id
   if (!/^\d{16,22}$/.test(userId)) return res.status(400).json({ error: "ID invalide" })

   const profile = computeProfile(userId)
   if (!profile) return res.status(404).json({ error: "Joueur introuvable" })

   const discord = await resolveDiscordUser(userId)

   res.json({ ...profile, discord })
  } catch (err) {
   console.error("[WEB] /api/profile error:", err)
   res.status(500).json({ error: "Erreur serveur" })
  }
 })

 app.get("/api/sets", (req, res) => {
  try {
   res.json(getCachedSets())
  } catch (err) {
   res.status(500).json({ error: "Erreur serveur" })
  }
 })

 /* ---- SPA Fallback : toutes les routes non-API servent index.html ---- */
 app.get("/leaderboard", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "leaderboard.html"))
 })

 app.get("/profile/:id", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "profile.html"))
 })

 /* Fallback 404 → page d'accueil */
 app.get("*", (req, res) => {
  if (req.path.startsWith("/api/")) return res.status(404).json({ error: "Route introuvable" })
  res.sendFile(path.join(__dirname, "public", "index.html"))
 })

 return app
}

/* ================================================================
   START SERVER
================================================================ */

function startWebServer(port) {
 const app = createWebApp()
 const p = port || process.env.PORT || 3000

 app.listen(p, "0.0.0.0", () => {
  console.log(`\n==============================`)
  console.log(`   WEB SERVER`)
  console.log(`   http://localhost:${p}`)
  console.log(`   krosmozcard.fr`)
  console.log(`==============================\n`)
 })

 return app
}

module.exports = { startWebServer, createWebApp }
