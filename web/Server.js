const crypto = require("crypto")
const express = require("express")
const fs = require("fs")
const path = require("path")

const { MAX_PLAYER_LEVEL } = require("../systems/constants")
const { getUser } = require("../systems/userSystem")
const {
 addListing,
 addFragmentListing,
 buyCard,
 getUserListings,
 removeListing
} = require("../systems/market")
const achievementRegistry = require("../systems/achievementRegistry")

const RARITY_ORDER = ["C", "U", "R", "SR", "HR", "UR", "S", "SSR"]
const FRAGMENT_MIN_PRICE = 250
const ACHIEVEMENT_CATEGORIES = [
 "all",
 "pack",
 "rng",
 "collection",
 "economy",
 "fusion",
 "daily",
 "social",
 "inventory",
 "krosmoshop",
 "event",
 "guild",
 "gift",
 "progression",
 "secret"
]
const webHooks = {
 onWebMarketBuy: null
}

let BASE = "/data"
if (!fs.existsSync(BASE)) BASE = path.join(process.cwd(), "data")

const USERS_DIR = path.join(BASE, "users")
const CARDS_PATH = path.join(BASE, "cards.json")
const GUILDS_PATH = path.join(BASE, "guilds.json")
const MARKET_PATH = path.join(BASE, "market.json")
const MARKET_HISTORY_PATH = path.join(BASE, "marketHistory.json")
const PUBLIC_DIR = path.join(__dirname, "public")
const CARD_IMAGES_RUNTIME_DIR = path.join(BASE, "cards", "images")
const CARD_IMAGES_REPO_DIR = path.join(process.cwd(), "cards", "images")

const DISCORD_USER_TTL_MS = 5 * 60 * 1000
const discordUserCache = new Map()

const OAUTH_CLIENT_ID = process.env.DISCORD_WEB_CLIENT_ID || process.env.CLIENT_ID || ""
const OAUTH_CLIENT_SECRET = process.env.DISCORD_WEB_CLIENT_SECRET || ""
const OAUTH_REDIRECT_URI = process.env.DISCORD_WEB_REDIRECT_URI || ""
const OAUTH_SCOPE = process.env.DISCORD_WEB_SCOPE || "identify"
const WEB_SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7
const webSessions = new Map()

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

function getSetsWithCounts() {
 const sets = getSets()
 const cards = getCards()
 const counts = new Map()

 for (const card of cards) {
  const setId = String(card.set || "unknown")
  counts.set(setId, (counts.get(setId) || 0) + 1)
 }

 return sets.map((set) => ({
  ...set,
  totalCards: counts.get(String(set.id)) || 0
 }))
}

function getGuildList() {
 const guilds = readJSON(GUILDS_PATH, [])
 return Array.isArray(guilds) ? guilds : Object.values(guilds || {})
}

function parseIntSafe(value, fallback) {
 const n = Number(value)
 if (!Number.isFinite(n)) return fallback
 return Math.floor(n)
}

function parsePagination(req, defaultLimit = 25, maxLimit = 100) {
 const page = Math.max(1, parseIntSafe(req.query.page, 1))
 const limit = Math.max(1, Math.min(maxLimit, parseIntSafe(req.query.limit, defaultLimit)))
 const offset = (page - 1) * limit
 return { page, limit, offset }
}

function normalizeText(value) {
 return String(value || "").trim().toLowerCase()
}

function getCardSetNameMap(sets) {
 const map = new Map()
 for (const set of sets || []) {
  map.set(String(set.id), set.name || set.id)
 }
 return map
}

function parseCookies(req) {
 const header = req.headers.cookie
 if (!header) return {}
 return header.split(";").reduce((acc, chunk) => {
  const idx = chunk.indexOf("=")
  if (idx < 0) return acc
  const k = chunk.slice(0, idx).trim()
  const v = chunk.slice(idx + 1).trim()
  acc[k] = decodeURIComponent(v)
  return acc
 }, {})
}

function sanitizeReturnPath(value) {
 const raw = String(value || "").trim()
 if (!raw) return null
 if (!raw.startsWith("/")) return null
 if (raw.startsWith("//")) return null
 if (raw.startsWith("/auth/")) return null
 return raw
}

function cookieStateOptions() {
 return "HttpOnly; Path=/; Max-Age=600; SameSite=Lax"
}

function isHttpsRequest(req) {
 return req.secure || String(req.headers["x-forwarded-proto"] || "").includes("https")
}

function cookieSessionOptions(req, maxAgeSec = Math.floor(WEB_SESSION_TTL_MS / 1000)) {
 return `HttpOnly; Path=/; Max-Age=${maxAgeSec}; SameSite=Lax${isHttpsRequest(req) ? "; Secure" : ""}`
}

function createWebSession(userId) {
 const token = crypto.randomBytes(32).toString("hex")
 webSessions.set(token, {
  userId: String(userId),
  expiresAt: Date.now() + WEB_SESSION_TTL_MS
 })
 return token
}

function resolveSession(req) {
 const cookies = parseCookies(req)
 const token = cookies.kc_session
 if (!token) return null

 const session = webSessions.get(token)
 if (!session) return null
 if (session.expiresAt < Date.now()) {
  webSessions.delete(token)
  return null
 }

 return { token, userId: session.userId }
}

function clearSession(req, res) {
 const cookies = parseCookies(req)
 const token = cookies.kc_session
 if (token) webSessions.delete(token)
 res.setHeader("Set-Cookie", `kc_session=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax${isHttpsRequest(req) ? "; Secure" : ""}`)
}

function requireSession(req, res) {
 const session = resolveSession(req)
 if (!session) {
  res.status(401).json({ error: "Connexion Discord requise." })
  return null
 }
 return session
}

async function resolveDiscordUser(userId) {
 const now = Date.now()
 const cached = discordUserCache.get(userId)
 if (cached && cached.expiresAt > now) return cached.value

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

  const value = {
   id: userId,
   username: data.username,
   displayName: data.global_name || data.username,
   avatar: data.avatar,
   avatarURL
  }

  discordUserCache.set(userId, { value, expiresAt: now + DISCORD_USER_TTL_MS })
  return value
 } catch (_) {
  return fallback
 }
}

function computeGlobalStats() {
 const cards = getCards()
 const sets = getSets()
 const guilds = getGuildList()
 const userFiles = listUserFiles()
 const cardsById = new Map(cards.map((c) => [String(c.id), c]))

 let totalCardsOwned = 0
 let totalKamas = 0
 let totalPacks = 0
 let totalFusions = 0
 let totalSSR = 0
 let totalAchievements = 0

 for (const file of userFiles) {
  const user = readJSON(path.join(USERS_DIR, file), null)
  if (!user) continue

  for (const [id, qty] of Object.entries(user.cards || {})) {
   totalCardsOwned += qty
   const card = cardsById.get(String(id))
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

async function computeActivityFeed(limit = 12) {
 const cards = getCards()
 const cardsById = new Map(cards.map((c) => [String(c.id), c]))
 const history = readJSON(MARKET_HISTORY_PATH, [])
 const safeLimit = Math.max(1, Math.min(30, Number(limit) || 12))

 const latest = [...history]
  .sort((a, b) => Number(b.timestamp || 0) - Number(a.timestamp || 0))
  .slice(0, safeLimit)

 return Promise.all(latest.map(async (entry) => {
  const card = cardsById.get(String(entry.card))
  const buyer = await resolveDiscordUser(String(entry.buyer || ""))
  const seller = await resolveDiscordUser(String(entry.seller || ""))
  const isFragment = String(entry.type || "card") === "fragment"

  return {
   kind: isFragment ? "market_fragment" : "market_card",
   timestamp: Number(entry.timestamp || 0),
   price: Number(entry.price || 0),
   cardName: card?.name || `Carte ${entry.card}`,
   rarity: card?.rarity || "C",
   fragmentNumber: isFragment ? Number(entry.fragmentNumber || 0) : null,
   buyer: {
    id: String(entry.buyer || ""),
    name: buyer?.displayName || String(entry.buyer || "Joueur")
   },
   seller: {
    id: String(entry.seller || ""),
    name: seller?.displayName || String(entry.seller || "Joueur")
   }
  }
 }))
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

 const rarityBreakdown = { C: 0, U: 0, R: 0, SR: 0, HR: 0, UR: 0, S: 0, SSR: 0 }
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
  const g = guilds.find((x) => String(x.id) === String(user.guildId))
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

function computeCardsCatalog(query) {
 const cards = getCards()
 const sets = getSets()
 const setNames = getCardSetNameMap(sets)

 const q = normalizeText(query.q)
 const rarity = normalizeText(query.rarity).toUpperCase()
 const set = normalizeText(query.set)
 const sort = normalizeText(query.sort) || "id"

 let filtered = cards.filter((card) => {
  if (q && !String(card.name || "").toLowerCase().includes(q)) return false
  if (rarity && String(card.rarity || "").toUpperCase() !== rarity) return false
  if (set && String(card.set || "").toLowerCase() !== set) return false
  return true
 })

 switch (sort) {
  case "name":
   filtered = filtered.sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""), "fr"))
   break
  case "rarity":
   filtered = filtered.sort((a, b) => {
    const left = RARITY_ORDER.indexOf(String(a.rarity || ""))
    const right = RARITY_ORDER.indexOf(String(b.rarity || ""))
    if (left !== right) return left - right
    return String(a.name || "").localeCompare(String(b.name || ""), "fr")
   })
   break
  default:
   filtered = filtered.sort((a, b) => Number(a.id || 0) - Number(b.id || 0))
   break
 }

  return {
   total: filtered.length,
   items: filtered.map((card) => ({
   id: card.id,
   name: card.name || `Carte ${card.id}`,
   rarity: card.rarity || "C",
   set: card.set || "unknown",
   setName: setNames.get(String(card.set || "")) || String(card.set || "Inconnu"),
   imageUrl: card?.image && card?.set
    ? `/assets/cards/${encodeURIComponent(String(card.set))}/${encodeURIComponent(String(card.image))}`
    : null
  }))
 }
}

function computeMarketAverages(history) {
 const buckets = new Map()

 for (const sale of history || []) {
  const key = sale.type === "fragment"
   ? `fragment:${sale.card}:${sale.fragmentNumber}`
   : `card:${sale.card}`
  if (!buckets.has(key)) buckets.set(key, [])
  buckets.get(key).push(Number(sale.price || 0))
 }

 const averages = new Map()
 for (const [key, list] of buckets.entries()) {
  if (!list.length) continue
  const sum = list.reduce((a, b) => a + b, 0)
  averages.set(key, Math.floor(sum / list.length))
 }

 return averages
}

function getFragmentMinimumPrice(cardId, fragmentNumber, averages) {
 const key = `fragment:${cardId}:${fragmentNumber}`
 const avg = averages.get(key)
 if (!avg) return FRAGMENT_MIN_PRICE
 return Math.max(FRAGMENT_MIN_PRICE, Math.floor(avg * 0.25))
}

async function computeMarket(query) {
 const cards = getCards()
 const sets = getSets()
 const market = readJSON(MARKET_PATH, [])
 const history = readJSON(MARKET_HISTORY_PATH, [])
 const setNames = getCardSetNameMap(sets)
 const cardsById = new Map(cards.map((c) => [String(c.id), c]))
 const averages = computeMarketAverages(history)

 const q = normalizeText(query.q)
 const type = normalizeText(query.type) || "all"
 const rarity = normalizeText(query.rarity).toUpperCase()
 const set = normalizeText(query.set)
 const sort = normalizeText(query.sort) || "recent"
 const minPrice = Number(query.minPrice)
 const maxPrice = Number(query.maxPrice)

 let items = (market || []).map((entry) => {
  const card = cardsById.get(String(entry.card))
  const itemType = entry.type || "card"
  const setId = card?.set || "unknown"

  return {
   id: entry.id,
   type: itemType,
   price: Number(entry.price || 0),
   cardId: String(entry.card),
   cardName: card?.name || `Carte ${entry.card}`,
   rarity: card?.rarity || "C",
   set: setId,
   setName: setNames.get(String(setId)) || String(setId),
   imageUrl: card?.image && card?.set
    ? `/assets/cards/${encodeURIComponent(String(card.set))}/${encodeURIComponent(String(card.image))}`
    : null,
   seller: String(entry.seller || ""),
   fragmentNumber: itemType === "fragment" ? Number(entry.fragmentNumber || 0) : null,
   minimumPrice: itemType === "fragment"
    ? getFragmentMinimumPrice(String(entry.card), Number(entry.fragmentNumber || 0), averages)
    : null,
   timestamp: Number(entry.timestamp || 0)
  }
 })

 items = items.filter((item) => {
  if (type !== "all" && item.type !== type) return false
  if (rarity && item.rarity !== rarity) return false
  if (set && normalizeText(item.set) !== set) return false
  if (q && !normalizeText(item.cardName).includes(q)) return false
  if (Number.isFinite(minPrice) && minPrice > 0 && item.price < minPrice) return false
  if (Number.isFinite(maxPrice) && maxPrice > 0 && item.price > maxPrice) return false
  return true
 })

 switch (sort) {
  case "price_asc":
   items.sort((a, b) => a.price - b.price || b.timestamp - a.timestamp)
   break
  case "price_desc":
   items.sort((a, b) => b.price - a.price || b.timestamp - a.timestamp)
   break
  default:
   items.sort((a, b) => b.timestamp - a.timestamp)
   break
 }

 return items
}

function computeGuildSummary(query) {
 const guilds = getGuildList()
 const q = normalizeText(query.q)
 const sort = normalizeText(query.sort) || "level"

 let items = guilds.map((g) => ({
  id: String(g.id),
  name: g.name || "Guilde",
  emoji: g.emoji || "🏰",
  level: Number(g.level || 1),
  xp: Number(g.xp || 0),
  members: Array.isArray(g.memberIds) ? g.memberIds.length : 0,
  createdAt: g.createdAt || null
 }))

 if (q) {
  items = items.filter((g) =>
   normalizeText(g.name).includes(q) || normalizeText(g.id).includes(q)
  )
 }

 switch (sort) {
  case "members":
   items.sort((a, b) => b.members - a.members || b.level - a.level)
   break
  case "name":
   items.sort((a, b) => a.name.localeCompare(b.name, "fr"))
   break
  default:
   items.sort((a, b) => b.level - a.level || b.members - a.members)
   break
 }

 return items
}

async function computeGuildProfile(guildId) {
 const guild = getGuildList().find((g) => String(g.id) === String(guildId))
 if (!guild) return null

 const cards = getCards()
 const cardsById = new Map(cards.map((c) => [String(c.id), c]))
 const memberIds = Array.isArray(guild.memberIds) ? guild.memberIds : []

 const members = await Promise.all(memberIds.map(async (id) => {
  const user = loadUser(id) || {}
  const discord = await resolveDiscordUser(String(id))
  const totalCards = Object.values(user.cards || {}).reduce((a, b) => a + b, 0)
  let ssrOwned = 0
  for (const [cardId, qty] of Object.entries(user.cards || {})) {
   const card = cardsById.get(String(cardId))
   if (card?.rarity === "SSR") ssrOwned += qty
  }

  return {
   id: String(id),
   discord,
   role: String(guild.leaderId) === String(id)
    ? "Meneur"
    : (guild.officerIds || []).includes(id) ? "Officier" : "Membre",
   level: user.progression?.level || 1,
   title: user.title || "Nouveau",
   totalCards,
   ssrOwned,
   contribution: {
    packsOpened: user.stats?.packsOpened || 0,
    fusions: user.stats?.fusions || 0
   }
  }
 }))

 members.sort((a, b) => b.level - a.level || b.totalCards - a.totalCards)

 const totalCards = members.reduce((acc, m) => acc + m.totalCards, 0)
 const totalSSR = members.reduce((acc, m) => acc + m.ssrOwned, 0)
 const totalPacks = members.reduce((acc, m) => acc + m.contribution.packsOpened, 0)
 const totalFusions = members.reduce((acc, m) => acc + m.contribution.fusions, 0)

 return {
  id: String(guild.id),
  name: guild.name || "Guilde",
  emoji: guild.emoji || "🏰",
  level: Number(guild.level || 1),
  xp: Number(guild.xp || 0),
  members,
  maxMembers: 10,
  leaderId: String(guild.leaderId || ""),
  createdAt: guild.createdAt || null,
  stats: {
   questsCompleted: guild.stats?.questsCompleted || 0,
   totalXpEarned: guild.stats?.totalXpEarned || 0,
   totalCards,
   totalSSR,
   totalPacks,
   totalFusions
  }
 }
}

function oauthConfigured() {
 return Boolean(OAUTH_CLIENT_ID && OAUTH_CLIENT_SECRET && OAUTH_REDIRECT_URI)
}

function enrichListingWithCardMeta(listing, cardsById, setNames) {
 const card = cardsById.get(String(listing.card))
 const setId = card?.set || "unknown"
 return {
  id: listing.id,
  type: listing.type || "card",
  price: Number(listing.price || 0),
  cardId: String(listing.card),
  cardName: card?.name || `Carte ${listing.card}`,
  rarity: card?.rarity || "C",
  set: setId,
  setName: setNames.get(String(setId)) || String(setId),
  imageUrl: card?.image && card?.set
   ? `/assets/cards/${encodeURIComponent(String(card.set))}/${encodeURIComponent(String(card.image))}`
   : null,
  seller: String(listing.seller || ""),
  fragmentNumber: listing.type === "fragment" ? Number(listing.fragmentNumber || 0) : null,
  timestamp: Number(listing.timestamp || 0)
 }
}

function buildMePayload(userId) {
 const user = getUser(userId)
 const level = user.progression?.level || 1
 const xp = user.progression?.xp || 0
 const required = level < MAX_PLAYER_LEVEL ? 100 + level * 35 : 0

 return {
  id: String(userId),
  title: user.title || "Nouveau",
  level,
  xp,
  xpRequired: required,
  kamas: user.kamas || 0,
  cardsCount: Object.values(user.cards || {}).reduce((a, b) => a + b, 0),
  uniqueCards: Object.keys(user.cards || {}).length,
  fragmentsCount: Array.isArray(user.fragments) ? user.fragments.length : 0
 }
}

function buildInventoryPayload(userId) {
 const user = getUser(userId)
 const cards = getCards()
 const sets = getSets()
 const cardsById = new Map(cards.map((c) => [String(c.id), c]))
 const setNames = getCardSetNameMap(sets)

 const cardItems = Object.entries(user.cards || {})
  .map(([cardId, qty]) => {
   const card = cardsById.get(String(cardId))
   const setId = card?.set || "unknown"
   return {
    cardId: String(cardId),
    qty: Number(qty || 0),
    cardName: card?.name || `Carte ${cardId}`,
    rarity: card?.rarity || "C",
    set: setId,
    setName: setNames.get(String(setId)) || String(setId),
    imageUrl: card?.image && card?.set
     ? `/assets/cards/${encodeURIComponent(String(card.set))}/${encodeURIComponent(String(card.image))}`
     : null
   }
  })
  .filter((x) => x.qty > 0)
  .sort((a, b) => {
   const ar = RARITY_ORDER.indexOf(a.rarity)
   const br = RARITY_ORDER.indexOf(b.rarity)
   if (ar !== br) return ar - br
   return a.cardName.localeCompare(b.cardName, "fr")
  })

 const fragments = Array.isArray(user.fragments) ? user.fragments : []
 const fragmentItems = fragments
  .map((f, idx) => {
   const card = cardsById.get(String(f.cardId))
   const setId = card?.set || "unknown"
   return {
    inventoryIndex: idx,
    cardId: String(f.cardId),
    fragmentNumber: Number(f.fragmentNumber || 0),
    cardName: card?.name || `Carte ${f.cardId}`,
    rarity: card?.rarity || "SSR",
    set: setId,
    setName: setNames.get(String(setId)) || String(setId),
    imageUrl: card?.image && card?.set
     ? `/assets/cards/${encodeURIComponent(String(card.set))}/${encodeURIComponent(String(card.image))}`
     : null
   }
  })
  .sort((a, b) =>
   a.cardName.localeCompare(b.cardName, "fr") || a.fragmentNumber - b.fragmentNumber
  )

 return {
  cards: cardItems,
  fragments: fragmentItems
 }
}

function getAchievementsByCategory(category) {
 const allEntries = Object.entries(achievementRegistry || {})
 if (category === "all") return allEntries
 if (category === "secret") return allEntries.filter(([, ach]) => ach?.secret)
 return allEntries.filter(([, ach]) => String(ach?.trigger || "") === category && !ach?.secret)
}

function getAchievementCategoryStats(unlockedSet) {
 const stats = {}
 for (const category of ACHIEVEMENT_CATEGORIES) {
  const entries = getAchievementsByCategory(category)
  let unlocked = 0
  for (const [id] of entries) {
   if (unlockedSet.has(String(id))) unlocked++
  }
  stats[category] = { total: entries.length, unlocked }
 }
 return stats
}

function createWebApp() {
 const app = express()
 app.disable("x-powered-by")

 app.use((req, res, next) => {
  const proto = String(req.headers["x-forwarded-proto"] || "")
  const host = String(req.headers.host || "")
  const isProd = String(process.env.NODE_ENV || "").toLowerCase() === "production"
  const isLocal = host.startsWith("localhost") || host.startsWith("127.0.0.1")

  if (isProd && !isLocal && proto && !proto.includes("https")) {
   return res.redirect(301, `https://${host}${req.originalUrl}`)
  }

  if (proto.includes("https")) {
   res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload")
  }

  return next()
 })

 app.use(express.json({ limit: "1mb" }))
 app.use(express.urlencoded({ extended: false }))

 app.use(express.static(PUBLIC_DIR, { index: false }))
 app.get("/css/style.css", (req, res) => res.sendFile(path.join(PUBLIC_DIR, "Style.css")))
 app.use("/assets/cards", express.static(CARD_IMAGES_RUNTIME_DIR, { index: false, fallthrough: true }))
 app.use("/assets/cards", express.static(CARD_IMAGES_REPO_DIR, { index: false, fallthrough: true }))

 app.get("/api/stats", (req, res) => {
  try {
   res.json(computeGlobalStats())
  } catch (e) {
   console.error("[WEB] /api/stats:", e)
   res.status(500).json({ error: "Erreur serveur" })
  }
 })

 app.get("/api/activity", async (req, res) => {
  try {
   const limit = Number(req.query.limit || 12)
   const items = await computeActivityFeed(limit)
   res.json({ items })
  } catch (e) {
   console.error("[WEB] /api/activity:", e)
   res.status(500).json({ error: "Erreur serveur" })
  }
 })

 app.get("/api/leaderboard/:category", async (req, res) => {
  try {
   const category = req.params.category
   const valid = ["cards", "unique", "kamas", "level", "achievements", "ssr", "packs"]
   if (!valid.includes(category)) return res.status(400).json({ error: "Categorie invalide" })

   const entries = computeLeaderboard(category)
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
   res.json(getSetsWithCounts())
  } catch (e) {
   console.error("[WEB] /api/sets:", e)
   res.status(500).json({ error: "Erreur serveur" })
  }
 })

 app.get("/api/cards", (req, res) => {
  try {
   const { page, limit, offset } = parsePagination(req, 24, 100)
   const result = computeCardsCatalog(req.query)
   const items = result.items.slice(offset, offset + limit)
   const pages = Math.max(1, Math.ceil(result.total / limit))

   res.json({
    total: result.total,
    page,
    pages,
    limit,
    items
   })
  } catch (e) {
   console.error("[WEB] /api/cards:", e)
   res.status(500).json({ error: "Erreur serveur" })
  }
 })

 app.get("/api/market", async (req, res) => {
  try {
   const { page, limit, offset } = parsePagination(req, 20, 100)
   const all = await computeMarket(req.query)
   const slice = all.slice(offset, offset + limit)
   const pages = Math.max(1, Math.ceil(all.length / limit))

   const withSellers = await Promise.all(slice.map(async (item) => ({
    ...item,
    sellerProfile: await resolveDiscordUser(item.seller)
   })))

   res.json({
    total: all.length,
    page,
    pages,
    limit,
    items: withSellers
   })
  } catch (e) {
   console.error("[WEB] /api/market:", e)
   res.status(500).json({ error: "Erreur serveur" })
  }
 })

 app.get("/api/guilds", (req, res) => {
  try {
   const { page, limit, offset } = parsePagination(req, 20, 100)
   const all = computeGuildSummary(req.query)
   const items = all.slice(offset, offset + limit)
   const pages = Math.max(1, Math.ceil(all.length / limit))

   res.json({
    total: all.length,
    page,
    pages,
    limit,
    items
   })
  } catch (e) {
   console.error("[WEB] /api/guilds:", e)
   res.status(500).json({ error: "Erreur serveur" })
  }
 })

 app.get("/api/guild/:id", async (req, res) => {
  try {
   const profile = await computeGuildProfile(req.params.id)
   if (!profile) return res.status(404).json({ error: "Guilde introuvable" })
   res.json(profile)
  } catch (e) {
   console.error("[WEB] /api/guild/:id:", e)
   res.status(500).json({ error: "Erreur serveur" })
  }
 })

 app.get("/api/oauth/status", (req, res) => {
  const session = resolveSession(req)
  res.json({
   enabled: oauthConfigured(),
   clientId: OAUTH_CLIENT_ID || null,
   connected: Boolean(session),
   userId: session?.userId || null
  })
 })

 app.get("/api/me", async (req, res) => {
  try {
   const session = requireSession(req, res)
   if (!session) return
   const discord = await resolveDiscordUser(session.userId)
   const me = buildMePayload(session.userId)
   res.json({ ...me, discord })
  } catch (e) {
   console.error("[WEB] /api/me:", e)
   res.status(500).json({ error: "Erreur serveur" })
  }
 })

 app.get("/api/me/inventory", (req, res) => {
  try {
   const session = requireSession(req, res)
   if (!session) return
   res.json(buildInventoryPayload(session.userId))
  } catch (e) {
   console.error("[WEB] /api/me/inventory:", e)
   res.status(500).json({ error: "Erreur serveur" })
  }
 })

 app.get("/api/achievements", (req, res) => {
  try {
   const session = resolveSession(req)
   const connected = Boolean(session)
   const user = connected ? getUser(session.userId) : null
   const unlockedSet = new Set((user?.achievements || []).map((id) => String(id)))

   const category = String(req.query.category || "all")
   const safeCategory = ACHIEVEMENT_CATEGORIES.includes(category) ? category : "all"
   const entries = getAchievementsByCategory(safeCategory)

   const items = entries
    .map(([id, ach]) => {
     const unlocked = unlockedSet.has(String(id))
     const hidden = Boolean(ach?.secret && !unlocked)

     return {
      id: String(id),
      trigger: String(ach?.trigger || "other"),
      secret: Boolean(ach?.secret),
      unlocked,
      badge: hidden ? "❓" : String(ach?.badge || "🏆"),
      name: hidden ? "???" : String(ach?.name || "Succès"),
      description: hidden ? "???" : String(ach?.description || "")
     }
    })
    .sort((a, b) =>
     Number(b.unlocked) - Number(a.unlocked) ||
     a.trigger.localeCompare(b.trigger, "fr") ||
     a.name.localeCompare(b.name, "fr")
    )

   const unlockedCount = items.filter((x) => x.unlocked).length

   res.json({
    connected,
    category: safeCategory,
    total: items.length,
    unlocked: unlockedCount,
    categories: getAchievementCategoryStats(unlockedSet),
    items
   })
  } catch (e) {
   console.error("[WEB] /api/achievements:", e)
   res.status(500).json({ error: "Erreur serveur" })
  }
 })

 app.get("/api/me/listings", async (req, res) => {
  try {
   const session = requireSession(req, res)
   if (!session) return

   const cards = getCards()
   const sets = getSets()
   const cardsById = new Map(cards.map((c) => [String(c.id), c]))
   const setNames = getCardSetNameMap(sets)
   const listings = getUserListings(session.userId)
    .map((l) => enrichListingWithCardMeta(l, cardsById, setNames))
    .sort((a, b) => b.timestamp - a.timestamp)

   res.json({ items: listings })
  } catch (e) {
   console.error("[WEB] /api/me/listings:", e)
   res.status(500).json({ error: "Erreur serveur" })
  }
 })

 app.post("/api/market/buy", (req, res) => {
  try {
   const session = requireSession(req, res)
   if (!session) return

   const listingId = Number(req.body?.listingId)
   if (!Number.isFinite(listingId)) return res.status(400).json({ error: "listingId invalide." })

   const result = buyCard(session.userId, listingId)
   if (result?.error) return res.status(400).json({ error: result.error })

   if (typeof webHooks.onWebMarketBuy === "function") {
    Promise.resolve(webHooks.onWebMarketBuy({
     buyerId: String(session.userId),
     listing: result.listing
    })).catch((error) => {
     console.error("[WEB] onWebMarketBuy hook:", error?.message || error)
    })
   }

   res.json({ ok: true, result })
  } catch (e) {
   console.error("[WEB] /api/market/buy:", e)
   res.status(500).json({ error: "Erreur serveur" })
  }
 })

 app.post("/api/market/sell-card", (req, res) => {
  try {
   const session = requireSession(req, res)
   if (!session) return

   const cardId = String(req.body?.cardId || "").trim()
   const price = Number(req.body?.price)
   if (!cardId) return res.status(400).json({ error: "cardId manquant." })
   if (!Number.isFinite(price) || price <= 0) return res.status(400).json({ error: "Prix invalide." })

   const result = addListing(session.userId, cardId, price)
   if (result?.error) return res.status(400).json({ error: result.error })
   res.json({ ok: true, listing: result })
  } catch (e) {
   console.error("[WEB] /api/market/sell-card:", e)
   res.status(500).json({ error: "Erreur serveur" })
  }
 })

 app.post("/api/market/sell-fragment", (req, res) => {
  try {
   const session = requireSession(req, res)
   if (!session) return

   const cardId = String(req.body?.cardId || "").trim()
   const fragmentNumber = Number(req.body?.fragmentNumber)
   const price = Number(req.body?.price)
   if (!cardId) return res.status(400).json({ error: "cardId manquant." })
   if (!Number.isInteger(fragmentNumber) || fragmentNumber < 1 || fragmentNumber > 5) {
    return res.status(400).json({ error: "Numéro de fragment invalide." })
   }
   if (!Number.isFinite(price) || price <= 0) return res.status(400).json({ error: "Prix invalide." })

   const result = addFragmentListing(session.userId, cardId, fragmentNumber, price)
   if (result?.error) return res.status(400).json({ error: result.error })
   res.json({ ok: true, listing: result })
  } catch (e) {
   console.error("[WEB] /api/market/sell-fragment:", e)
   res.status(500).json({ error: "Erreur serveur" })
  }
 })

 app.post("/api/market/remove", (req, res) => {
  try {
   const session = requireSession(req, res)
   if (!session) return

   const listingId = Number(req.body?.listingId)
   if (!Number.isFinite(listingId)) return res.status(400).json({ error: "listingId invalide." })

   const result = removeListing(session.userId, listingId)
   if (result?.error) return res.status(400).json({ error: result.error })
   res.json({ ok: true })
  } catch (e) {
   console.error("[WEB] /api/market/remove:", e)
   res.status(500).json({ error: "Erreur serveur" })
  }
 })

 app.get("/auth/discord", (req, res) => {
  if (!oauthConfigured()) {
   return res.status(503).send("OAuth Discord non configure (DISCORD_WEB_CLIENT_ID/SECRET/REDIRECT_URI).")
  }

  const state = crypto.randomBytes(24).toString("hex")
  const returnTo = sanitizeReturnPath(req.query.returnTo) || "/market?connected=1"
  res.setHeader("Set-Cookie", [
   `kc_oauth_state=${encodeURIComponent(state)}; ${cookieStateOptions()}${isHttpsRequest(req) ? "; Secure" : ""}`,
   `kc_oauth_return=${encodeURIComponent(returnTo)}; ${cookieStateOptions()}${isHttpsRequest(req) ? "; Secure" : ""}`
  ])

  const params = new URLSearchParams({
   client_id: OAUTH_CLIENT_ID,
   redirect_uri: OAUTH_REDIRECT_URI,
   response_type: "code",
   scope: OAUTH_SCOPE,
   state,
   prompt: "consent"
  })

  return res.redirect(`https://discord.com/oauth2/authorize?${params.toString()}`)
 })

 app.get("/auth/discord/callback", async (req, res) => {
  try {
   if (!oauthConfigured()) return res.status(503).send("OAuth Discord non configure.")
   if (req.query.error) return res.status(400).send(`Discord OAuth error: ${req.query.error}`)

   const cookies = parseCookies(req)
  const expectedState = cookies.kc_oauth_state
   const returnTo = sanitizeReturnPath(cookies.kc_oauth_return) || "/market?connected=1"
   const state = String(req.query.state || "")
   const code = String(req.query.code || "")

   if (!state || !expectedState || state !== expectedState) {
    return res.status(400).send("State OAuth invalide ou expire.")
   }
   if (!code) return res.status(400).send("Code OAuth manquant.")

   const tokenBody = new URLSearchParams({
    client_id: OAUTH_CLIENT_ID,
    client_secret: OAUTH_CLIENT_SECRET,
    grant_type: "authorization_code",
    code,
    redirect_uri: OAUTH_REDIRECT_URI
   })

   const tokenRes = await fetch("https://discord.com/api/v10/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: tokenBody
   })

   if (!tokenRes.ok) {
    const txt = await tokenRes.text()
    return res.status(400).send(`Echec echange token Discord: ${txt}`)
   }

   const token = await tokenRes.json()
   const meRes = await fetch("https://discord.com/api/v10/users/@me", {
    headers: { Authorization: `Bearer ${token.access_token}` }
   })

   if (!meRes.ok) {
    const txt = await meRes.text()
    return res.status(400).send(`Echec recup user Discord: ${txt}`)
   }

   const me = await meRes.json()
  const sessionToken = createWebSession(me.id)
  res.setHeader("Set-Cookie", [
    `kc_oauth_state=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax${isHttpsRequest(req) ? "; Secure" : ""}`,
    `kc_oauth_return=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax${isHttpsRequest(req) ? "; Secure" : ""}`,
    `kc_session=${encodeURIComponent(sessionToken)}; ${cookieSessionOptions(req)}`
   ])
   return res.redirect(returnTo)
  } catch (e) {
   console.error("[WEB] /auth/discord/callback:", e)
   return res.status(500).send("Erreur OAuth.")
  }
 })

 app.post("/auth/logout", (req, res) => {
  clearSession(req, res)
  return res.json({ ok: true })
 })

 app.get("/", (req, res) => res.sendFile(path.join(PUBLIC_DIR, "Index.html")))
 app.get("/leaderboard", (req, res) => res.sendFile(path.join(PUBLIC_DIR, "Leaderboard.html")))
 app.get("/profile/:id", (req, res) => res.sendFile(path.join(PUBLIC_DIR, "Profile.html")))
 app.get("/profile", (req, res) => res.sendFile(path.join(PUBLIC_DIR, "Profile.html")))
 app.get("/cards", (req, res) => res.sendFile(path.join(PUBLIC_DIR, "Cards.html")))
 app.get("/market", (req, res) => res.sendFile(path.join(PUBLIC_DIR, "Market.html")))
 app.get("/guild", (req, res) => res.sendFile(path.join(PUBLIC_DIR, "Guild.html")))
 app.get("/guild/:id", (req, res) => res.sendFile(path.join(PUBLIC_DIR, "Guild.html")))
 app.get("/achievements", (req, res) => res.sendFile(path.join(PUBLIC_DIR, "Achievements.html")))
 app.get("/tutorial", (req, res) => res.sendFile(path.join(PUBLIC_DIR, "Tutorial.html")))
 app.get("/about", (req, res) => res.sendFile(path.join(PUBLIC_DIR, "About.html")))

 app.use((req, res) => {
  if (req.path.startsWith("/api/")) return res.status(404).json({ error: "Route introuvable" })
  return res.sendFile(path.join(PUBLIC_DIR, "Index.html"))
 })

 return app
}

function setWebHooks(hooks = {}) {
 if (typeof hooks.onWebMarketBuy === "function") {
  webHooks.onWebMarketBuy = hooks.onWebMarketBuy
 }
}

function startWebServer(port) {
 const app = createWebApp()
 const p = Number(port || process.env.PORT || 3000)

 app.listen(p, "0.0.0.0", () => {
  console.log("\n==============================")
  console.log("   WEB SERVER")
  console.log(`   http://localhost:${p}`)
  console.log("==============================\n")
 })

 return app
}

module.exports = { createWebApp, startWebServer, setWebHooks }
