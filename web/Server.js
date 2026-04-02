const express = require("express")
const fs = require("fs")
const path = require("path")
const { MAX_PLAYER_LEVEL } = require("../systems/constants")

let BASE = "/data"
if (!fs.existsSync(BASE)) BASE = path.join(process.cwd(), "data")

const USERS_DIR = path.join(BASE, "users")
const CARDS_PATH = path.join(BASE, "cards.json")
const GUILDS_PATH = path.join(BASE, "guilds.json")
const PUBLIC_DIR = path.join(__dirname, "public")

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

function readJSON(filePath, fallback) {
 try {
  if (!fs.existsSync(filePath)) return fallback
  const raw = fs.readFileSync(filePath, "utf8")
  if (!raw || raw.trim() === "") return fallback
  return JSON.parse(raw)
 } catch (_) {
  return fallback
 }
}

function listUserFiles() {
 if (!fs.existsSync(USERS_DIR)) return []
 return fs.readdirSync(USERS_DIR).filter((f) => f.endsWith(".json"))
}

function loadUser(userId) {
 return readJSON(path.join(USERS_DIR, `${userId}.json`), null)
}

function getCards() {
 return readJSON(CARDS_PATH, [])
}

function getSets() {
 const raw = readJSON(findSetsPath(), [])
 if (Array.isArray(raw)) return raw
 return raw?.sets || []
}

function getGuildList() {
 const guilds = readJSON(GUILDS_PATH, [])
 return Array.isArray(guilds) ? guilds : Object.values(guilds || {})
}

async function resolveDiscordUser(userId) {
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

  return {
   id: userId,
   username: data.username,
   displayName: data.global_name || data.username,
   avatar: data.avatar,
   avatarURL
  }
 } catch (_) {
  return fallback
 }
}

function computeGlobalStats() {
 const cards = getCards()
 const sets = getSets()
 const guilds = getGuildList()
 const userFiles = listUserFiles()

 let totalCardsOwned = 0
 let totalKamas = 0
 let totalPacks = 0
 let totalFusions = 0
 let totalSSR = 0
 let totalAchievements = 0

 const byId = new Map(cards.map((c) => [String(c.id), c]))

 for (const file of userFiles) {
  const user = readJSON(path.join(USERS_DIR, file), null)
  if (!user) continue

  for (const [id, qty] of Object.entries(user.cards || {})) {
   totalCardsOwned += qty
   const card = byId.get(String(id))
   if (card?.rarity === "SSR") totalSSR += qty
  }

  totalKamas += user.kamas || 0
  totalPacks += user.stats?.packsOpened || 0
  totalFusions += user.stats?.fusions || 0
  totalAchievements += user.achievements?.length || 0
 }

 return {
  players: userFiles.length,
  totalCards: cards.length,
  totalSets: sets.length,
  cardsOwned: totalCardsOwned,
  ssrOwned: totalSSR,
  totalKamas,
  packsOpened: totalPacks,
  fusions: totalFusions,
  achievements: totalAchievements,
  guilds: guilds.length
 }
}

function computeLeaderboard(category) {
 const valid = ["cards", "unique", "kamas", "level", "achievements", "ssr", "packs"]
 if (!valid.includes(category)) return []

 const cards = getCards()
 const byId = new Map(cards.map((c) => [String(c.id), c]))
 const rows = []

 for (const file of listUserFiles()) {
  const userId = file.replace(".json", "")
  const user = readJSON(path.join(USERS_DIR, file), null)
  if (!user) continue

  let value = 0
  switch (category) {
   case "cards":
    value = Object.values(user.cards || {}).reduce((a, b) => a + b, 0)
    break
   case "unique":
    value = Object.keys(user.cards || {}).length
    break
   case "kamas":
    value = user.kamas || 0
    break
   case "level":
    value = user.progression?.level || 1
    break
   case "achievements":
    value = user.achievements?.length || 0
    break
   case "packs":
    value = user.stats?.packsOpened || 0
    break
   case "ssr": {
    let count = 0
    for (const [id, qty] of Object.entries(user.cards || {})) {
     const card = byId.get(String(id))
     if (card?.rarity === "SSR") count += qty
    }
    value = count
    break
   }
  }

  if (value > 0) {
    rows.push({
     userId,
     value,
     level: user.progression?.level || 1,
     title: user.title || "Nouveau"
    })
  }
 }

 rows.sort((a, b) => b.value - a.value)
 return rows.slice(0, 100)
}

function computeProfile(userId) {
 const user = loadUser(userId)
 if (!user) return null

 const cards = getCards()
 const sets = getSets()
 const guilds = getGuildList()
 const byId = new Map(cards.map((c) => [String(c.id), c]))

 const totalCards = Object.values(user.cards || {}).reduce((a, b) => a + b, 0)
 const uniqueCards = Object.keys(user.cards || {}).length

 const rarityBreakdown = { C:0, U:0, R:0, SR:0, HR:0, UR:0, S:0, SSR:0 }
 for (const [id, qty] of Object.entries(user.cards || {})) {
  const card = byId.get(String(id))
  if (!card) continue
  rarityBreakdown[card.rarity] = (rarityBreakdown[card.rarity] || 0) + qty
 }

 const setProgress = sets.map((set) => {
  const setCards = cards.filter((c) => c.set === set.id)
  const owned = setCards.filter((c) => (user.cards?.[c.id] || 0) > 0).length
  return {
   id: set.id,
   name: set.name,
   owned,
   total: setCards.length,
   pct: setCards.length > 0 ? Math.round((owned / setCards.length) * 100) : 0
  }
 })

 let guild = null
 if (user.guildId) {
  const g = guilds.find((x) => x.id === user.guildId)
  if (g) {
   guild = { id: g.id, name: g.name, emoji: g.emoji, level: g.level || 1 }
  }
 }

 const level = user.progression?.level || 1
 const xp = user.progression?.xp || 0
 const totalXp = user.progression?.totalXp || 0
 const xpRequired = level < MAX_PLAYER_LEVEL ? 100 + (level * 35) : 0

 return {
  level,
  xp,
  totalXp,
  xpRequired,
  xpPercent: xpRequired > 0 ? Math.min(100, Math.round((xp / xpRequired) * 100)) : 100,
  kamas: user.kamas || 0,
  totalCards,
  uniqueCards,
  maxCards: cards.length,
  title: user.title || "Nouveau",
  titles: user.titles || ["Nouveau"],
  achievements: user.achievements?.length || 0,
  guild,
  rarityBreakdown,
  setProgress,
  stats: {
   packsOpened: user.stats?.packsOpened || 0,
   fusions: user.stats?.fusions || 0,
   fusionCrit: user.stats?.fusionCrit || 0,
   cardsSold: user.stats?.cardsSold || 0,
   cardsBought: user.stats?.cardsBought || 0,
   ssrPulled: user.stats?.ssrPulled || 0,
   shinySSR: user.stats?.shinySSR || 0,
   eventPacksOpened: user.stats?.eventPacksOpened || 0,
   dailyStreak: user.daily?.streak || 0,
   activityStreak: user.stats?.activityStreak || 0,
   createdAt: user.stats?.createdAt || null
  }
 }
}

function createWebApp() {
 const app = express()

 app.use(express.static(PUBLIC_DIR, { index: "Index.html" }))
 app.get("/css/style.css", (req, res) => res.sendFile(path.join(PUBLIC_DIR, "Style.css")))

 app.get("/api/stats", (req, res) => {
  try {
   res.json(computeGlobalStats())
  } catch (e) {
   console.error("[WEB] /api/stats:", e)
   res.status(500).json({ error: "Erreur serveur" })
  }
 })

 app.get("/api/leaderboard/:category", async (req, res) => {
  try {
   const category = req.params.category
   const entries = computeLeaderboard(category)
   if (!entries.length && !["cards","unique","kamas","level","achievements","ssr","packs"].includes(category)) {
    return res.status(400).json({ error: "Categorie invalide" })
   }

   const resolved = await Promise.all(
    entries.slice(0, 50).map(async (entry, index) => {
     const discord = await resolveDiscordUser(entry.userId)
     return { ...entry, rank: index + 1, discord }
    })
   )

   res.json(resolved)
  } catch (e) {
   console.error("[WEB] /api/leaderboard:", e)
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
  } catch (e) {
   console.error("[WEB] /api/profile:", e)
   res.status(500).json({ error: "Erreur serveur" })
  }
 })

 app.get("/api/sets", (req, res) => {
  try {
   res.json(getSets())
  } catch (e) {
   console.error("[WEB] /api/sets:", e)
   res.status(500).json({ error: "Erreur serveur" })
  }
 })

 app.get("/leaderboard", (req, res) => res.sendFile(path.join(PUBLIC_DIR, "Leaderboard.html")))
 app.get("/profile/:id", (req, res) => res.sendFile(path.join(PUBLIC_DIR, "Profile.html")))

 app.use((req, res) => {
  if (req.path.startsWith("/api/")) return res.status(404).json({ error: "Route introuvable" })
  return res.sendFile(path.join(PUBLIC_DIR, "Index.html"))
 })

 return app
}

function startWebServer(port) {
 const app = createWebApp()
 const p = Number(port || process.env.PORT || 3000)

 app.listen(p, "0.0.0.0", () => {
  console.log(`\n==============================`)
  console.log(`   WEB SERVER`)
  console.log(`   http://localhost:${p}`)
  console.log(`==============================\n`)
 })

 return app
}

module.exports = { createWebApp, startWebServer }
