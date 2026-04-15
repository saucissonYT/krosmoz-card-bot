const crypto = require("crypto")
const express = require("express")
const fs = require("fs")
const path = require("path")
const { createLogger } = require("../systems/logger")
const { isDiscordIdBanned } = require("../systems/banlistSystem")
const { data: appData, save: saveAppData } = require("../systems/dataManager")
const { resetRegistry: resetCardRegistry } = require("../systems/cardRegistry")

const { MAX_PLAYER_LEVEL, PACK_PRICE, FUSION_COST, SELL_PRICE } = require("../systems/constants")
const { getUser, save, updateActivityStreak } = require("../systems/userSystem")
const {
 USER_TOASTS_MAX_POP,
 enqueueWebRewardToast,
 popWebRewardToasts
} = require("../systems/webToastQueue")
const { addXP } = require("../systems/progressionSystem")
const { getShop, buyFromShop } = require("../systems/krosmoshop")
const { getGuildBonuses, getUserGuildBonuses } = require("../systems/guildBonuses")
const { getPlayerBonuses } = require("../systems/playerbonuses")
const {
 addBattlePassXP,
 buyPremium,
 claimBattlePassLevelReward,
 claimAllBattlePassRewards,
 computeLevel,
 getBattlePassOverview,
 getBattlePassRewardsView,
 getUserProgress,
 saveUserProgress
} = require("../systems/battlePassService")
const {
 claimDaily,
 canClaim: canClaimDaily,
 getNextMidnightParisMs
} = require("../systems/dailySystem")
const { achievementCheck } = require("../systems/achievementCheck")
const { ensureCurrentSeason, getSeasonTemplate } = require("../systems/seasonService")
const { getSeasonSellMultiplier, getSellBonusPercent, computeSellPrice } = require("../systems/sellHelper")
const { sortSetsByDisplayOrder } = require("../systems/setOrder")
const { openPack } = require("../systems/packEngine")
const { isSecretCard, getSecretCardById } = require("../systems/secretCard")
const {
 craftFromFragments,
 rollFragmentForEvent,
 grantRolledFragment
} = require("../systems/fragmentService")
const { isSetUnlocked } = require("../systems/setUnlockSystem")
const {
 startEvent,
 getEvent,
 isEventActive,
 initUserEvent,
 canUseEventPack,
 registerEventPack,
 claimFirstPack
} = require("../systems/eventSystem")
const { generateEventPack } = require("../systems/eventPackEngine")
const { applyEventRewards } = require("../systems/rewardSystem")
const {
 addListing,
 addFragmentListing,
 buyCard,
 getUserListings,
 removeListing
} = require("../systems/market")
const {
 createGuild,
 disbandGuild,
 joinGuild,
 leaveGuild,
 kickMember,
 promoteOfficer,
 demoteOfficer,
 transferLeader,
 renameGuild,
 devForceJoin,
 devSetLevel: devSetGuildLevel,
 getAllGuilds,
 getGuild,
 getGuildRank,
 getUserGuild,
 saveGuilds,
 xpRequired,
 MAX_MEMBERS
} = require("../systems/guildSystem")
const {
 ensureUserQuests,
 getDailyQuests,
 getWeeklyQuests,
 getAllProgress,
 claimQuest,
 claimAll,
 getNextDailyReset,
 getNextWeeklyReset,
 DAILY_BONUS,
 WEEKLY_BONUS
} = require("../systems/questSystem")
const {
 getDailyGuildQuests,
 getWeeklyGuildQuests,
 getScaledGoal,
 getGuildQuestProgress,
 claimGuildQuests,
 getNextGuildQuestReset
} = require("../systems/guildQuestSystem")
const achievementRegistry = require("../systems/achievementRegistry")
const { getAchievementReward, formatReward } = require("../systems/achievementRewards")
const {
 ensureAchievementClaimState,
 getPendingAchievementIds,
 getPendingAchievementCategoryCounts,
 claimAchievementRewards
} = require("../systems/achievementClaimService")
const rouletteGameplay = require("../commands/joueur/roulette")
const { createRateLimiter } = require("../systems/rateLimiter")
const { apiCache } = require("../systems/apiCache")
const {
 recordAction,
 recordWebLogin,
 recordShopView,
 recordGuildApplication,
 recordGuildApplicationReview,
 recordGuildRecruitment,
 recordProfileView
} = require("../systems/achievementProgressTracker")
const {
 getSchedulerNextRun,
 setSchedulerNextRun
} = require("../systems/schedulerStateStore")
const {
 dbLoadUser,
 dbAddMarketHistory,
 dbCountUsers,
 dbLeaderboard,
 dbLoadMarketHistory,
 dbGlobalStats
} = require("../systems/database")
const webLog = createLogger("WEB")

const RARITY_ORDER = ["C", "U", "R", "SR", "HR", "UR", "S", "SSR"]
const FRAGMENT_MIN_PRICE = 250
const MAX_PRICE = 10_000_000
const MAX_SESSIONS = 10_000
const ACHIEVEMENT_CATEGORIES = [
 "all",
 "pack",
 "rng",
 "collection",
 "economy",
 "fusion",
 "fragment",
 "daily",
 "roulette",
 "social",
 "inventory",
 "krosmoshop",
 "event",
 "guild",
 "gift",
 "progression",
 "secret"
]
const WEB_EVENTS_RARITY_ORDER = ["C", "U", "R", "SR", "HR", "UR", "S", "SSR"]
const WEB_PINATA_DURATION_MS = 60 * 1000
const WEB_PINATA_MIN_INTERVAL_MS = 4 * 60 * 60 * 1000
const WEB_PINATA_MAX_INTERVAL_MS = 5 * 60 * 60 * 1000
const WEB_NO_ACTIVITY_PENALTY_MS = 3 * 60 * 60 * 1000
const WEB_PINATA_TIMER_KEY = "web_pinata"
const WEB_PINATA_ALLOWED_EMOJIS = ["🍀", "🔥", "⚡", "💎", "🎯", "✨", "🎉", "💥"]
const WEB_PINATA_TIERS = [
 { minScore: 1, label: "🥉 Bronze", kamas: [100, 300], xp: 10, bpXp: 30, cardChance: 0, cardPool: [], fragmentChance: 0 },
 { minScore: 5, label: "🥈 Argent", kamas: [300, 700], xp: 25, bpXp: 60, cardChance: 0.25, cardPool: ["C", "U"], fragmentChance: 0 },
 { minScore: 10, label: "🥇 Or", kamas: [700, 1400], xp: 50, bpXp: 100, cardChance: 0.4, cardPool: ["C", "U", "R"], fragmentChance: 0.1 },
 { minScore: 18, label: "💎 Diamant", kamas: [1400, 2500], xp: 100, bpXp: 150, cardChance: 0.55, cardPool: ["C", "U", "R", "SR"], fragmentChance: 0.18 },
 { minScore: 28, label: "🌌 Krosmique", kamas: [2500, 4000], xp: 160, bpXp: 220, cardChance: 0.7, cardPool: ["C", "U", "R", "SR", "UR"], fragmentChance: 0.25 }
]
const WEB_PINATA_MULTIPLIERS = [
 { min: 1, mult: 1.0 },
 { min: 4, mult: 1.25 },
 { min: 8, mult: 1.5 },
 { min: 13, mult: 1.75 },
 { min: 21, mult: 2.0 }
]
const WEB_PINATA_SSR_CHANCE_KROSMIQUE = 0.02
const BATTLEPASS_XP_CONFIG_PATH = path.join(process.cwd(), "config", "battlepassXP.json")
const DEFAULT_QUEST_BP_XP = {
 dailyClaim: 80,
 weeklyClaim: 250,
 dailyBonus: 120,
 weeklyBonus: 400
}
const RECRUIT_HISTORY_WINDOW_MS = 7 * 24 * 60 * 60 * 1000
const RECRUIT_HISTORY_MAX_ITEMS = 1500
const RECRUIT_HISTORY_UTC_OFFSET_HOURS = 2

function getNextWebPinataDelayMs() {
 return Math.floor(Math.random() * (WEB_PINATA_MAX_INTERVAL_MS - WEB_PINATA_MIN_INTERVAL_MS + 1)) + WEB_PINATA_MIN_INTERVAL_MS
}

function getInitialWebPinataNextStart(now = Date.now()) {
 const restored = getSchedulerNextRun(WEB_PINATA_TIMER_KEY)
 if (Number.isFinite(restored) && restored > 0) return restored

 const nextAt = now + getNextWebPinataDelayMs()
 setSchedulerNextRun(WEB_PINATA_TIMER_KEY, nextAt)
 return nextAt
}

function scheduleNextWebPinata(now = Date.now(), extraDelayMs = 0) {
 const nextAt = now + getNextWebPinataDelayMs() + Math.max(0, Number(extraDelayMs || 0))
 webPinataState.nextStartAt = nextAt
 setSchedulerNextRun(WEB_PINATA_TIMER_KEY, nextAt)
 return nextAt
}

const webPinataState = {
 roundId: 0,
 active: false,
 startedAt: 0,
 endsAt: 0,
 nextStartAt: getInitialWebPinataNextStart(),
 participants: new Map(),
 rewardsByUser: new Map(),
 lastResults: [],
 lastSummary: null
}
const webHooks = {
 onWebMarketBuy: null
}
const {
 pickLot: pickRouletteLot,
 updateRouletteStats: updateRouletteStatsFromCommand,
 applyReward: applyRouletteRewardFromCommand,
 formatReward: formatRouletteReward
} = rouletteGameplay

/* Journal d'activité en mémoire (ring buffer) */
const ACTIVITY_LOG_MAX = 200
const activityLog = []

function pushActivity(entry) {
 if (!entry || !entry.kind) return
 activityLog.unshift({
  ...entry,
  timestamp: entry.timestamp || Date.now()
 })
 if (activityLog.length > ACTIVITY_LOG_MAX) activityLog.length = ACTIVITY_LOG_MAX
}


function formatWebPinataRewardText(row = {}) {
 const parts = []
 const kamas = Number(row.kamas || 0)
 const xp = Number(row.xp || 0)
 if (kamas > 0) parts.push(`🪙 +${kamas.toLocaleString("fr-FR")} kamas`)
 if (xp > 0) parts.push(`⭐ +${xp.toLocaleString("fr-FR")} XP`)
 if (row?.card?.cardName) {
  const rarity = String(row?.card?.rarity || "")
  parts.push(`🃏 ${String(row.card.cardName)}${rarity ? ` (${rarity})` : ""}`)
 }
 if (row?.fragment?.cardId && Number(row?.fragment?.fragmentNumber || 0) > 0) {
  parts.push(`🧩 Fragment ${Number(row.fragment.fragmentNumber)}/5`)
 }
 return parts.join(" • ")
}

let BASE = "/data"
if (!fs.existsSync(BASE)) BASE = path.join(process.cwd(), "data")

const CARDS_PATH = path.join(BASE, "cards.json")
const PUBLIC_DIR = path.join(__dirname, "public")
const CARD_IMAGES_RUNTIME_DIR = path.join(BASE, "cards", "images")
const CARD_IMAGES_REPO_DIR = path.join(process.cwd(), "cards", "images")

const DISCORD_USER_TTL_MS = 5 * 60 * 1000
const discordUserCache = new Map()

/* Cache données statiques (cards / sets) */
const STATIC_CACHE_TTL = 60 * 1000
let _cardsCache = null
let _cardsCacheAt = 0
let _setsCache = null
let _setsCacheAt = 0
let _localCardsBootstrapTried = false

/* Nettoyage périodique du cache Discord + sessions expirées (toutes les 10 min) */
setInterval(() => {
 const now = Date.now()
 for (const [key, entry] of discordUserCache) {
  if (entry.expiresAt <= now) discordUserCache.delete(key)
 }
 for (const [token, session] of webSessions) {
  if (session.expiresAt <= now) webSessions.delete(token)
 }
}, 10 * 60 * 1000)

const OAUTH_CLIENT_ID = process.env.DISCORD_WEB_CLIENT_ID || process.env.CLIENT_ID || ""
const OAUTH_CLIENT_SECRET = process.env.DISCORD_WEB_CLIENT_SECRET || ""
const OAUTH_REDIRECT_URI = process.env.DISCORD_WEB_REDIRECT_URI || ""
const OAUTH_SCOPE = process.env.DISCORD_WEB_SCOPE || "identify"
const BAN_KROSMOZ_IMAGE_PATH = "/assets/ui/ban%20krosmoz.png"
const WEB_SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7
const webSessions = new Map()
const WEB_LOCAL_AUTH_COOKIE = "kc_local_auth"
const WEB_LOCAL_AUTH_FORCE = String(process.env.WEB_LOCAL_AUTH || "").trim().toLowerCase()
const WEB_LOCAL_AUTH_USER_ID = String(process.env.WEB_LOCAL_AUTH_USER_ID || "999999999999999999").trim() || "999999999999999999"
const WEB_LOCAL_DEMO_WORLD = String(process.env.WEB_LOCAL_DEMO_WORLD || "1").trim().toLowerCase()
const WEB_BOOTSTRAP_CARDS_FROM_IMAGES = String(process.env.WEB_BOOTSTRAP_CARDS_FROM_IMAGES || "0").trim().toLowerCase()
const WEB_LOCAL_DEMO_SEED_VERSION = 5
const WEB_LOCAL_DEMO_BOT_COUNT = 34
const WEB_LOCAL_DEMO_ID_BASE = 980000000000000000n
const DEV_CARD_EDITOR_DISCORD_ID = "231419667179241472"
const localDiscordProfileOverrides = new Map()
const localDevUserSeededUsers = new Set()
let localDemoWorldSeeded = false

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

function saveCards(cards = []) {
 const safeCards = Array.isArray(cards) ? cards : []
 fs.mkdirSync(path.dirname(CARDS_PATH), { recursive: true })
 fs.writeFileSync(CARDS_PATH, `${JSON.stringify(safeCards, null, 2)}\n`, "utf8")

 _cardsCache = safeCards
 _cardsCacheAt = Date.now()

 try {
  if (appData && Array.isArray(appData.cards)) {
   appData.cards = safeCards
   saveAppData()
   resetCardRegistry()
  }
 } catch (error) {
  webLog.warn("Sync appData.cards impossible", { err: error })
 }
}

function canEditCards(session) {
 return String(session?.userId || "") === DEV_CARD_EDITOR_DISCORD_ID
}

function sanitizeCardImageName(value) {
 const text = String(value || "").trim()
 if (!text) return ""
 if (text.length > 180) return ""
 if (text.includes("..")) return ""
 if (/[\\/]/.test(text)) return ""
 if (!/\.(png|jpe?g|webp)$/i.test(text)) return ""
 return text
}

function sanitizeUploadBaseName(value, fallback = "card") {
 const raw = String(value || "").trim()
 const withoutExt = raw.replace(/\.[^.]+$/g, "")
 const cleaned = withoutExt
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .replace(/[^a-zA-Z0-9_-]+/g, "_")
  .replace(/^_+|_+$/g, "")
  .slice(0, 60)
 return cleaned || String(fallback || "card")
}

function parseImageDataUrl(dataUrl) {
 const text = String(dataUrl || "").trim()
 const match = /^data:(image\/(?:png|jpeg|jpg|webp));base64,([A-Za-z0-9+/=]+)$/i.exec(text)
 if (!match) return null

 const mime = String(match[1] || "").toLowerCase()
 const base64 = String(match[2] || "")
 let buffer = null
 try {
  buffer = Buffer.from(base64, "base64")
 } catch (_) {
  return null
 }
 if (!buffer || !buffer.length) return null

 const extByMime = {
  "image/png": "png",
  "image/jpeg": "jpg",
  "image/jpg": "jpg",
  "image/webp": "webp"
 }
 const ext = extByMime[mime] || null
 if (!ext) return null

 return { mime, ext, buffer }
}

function splitImageFileName(value) {
 const text = String(value || "").trim()
 const match = /^(.*)\.([^.]+)$/.exec(text)
 if (!match) return null
 return {
  base: String(match[1] || "").trim(),
  ext: String(match[2] || "").trim().toLowerCase()
 }
}

function buildUniqueImageFileName(baseName, ext, isTaken) {
 const safeBase = sanitizeUploadBaseName(baseName || "card", "card")
 const safeExt = String(ext || "png").toLowerCase()
 let candidate = `${safeBase}.${safeExt}`
 if (!isTaken(candidate)) return candidate

 for (let i = 1; i <= 9999; i += 1) {
  candidate = `${safeBase}_${i}.${safeExt}`
  if (!isTaken(candidate)) return candidate
 }

 return `${safeBase}_${Date.now()}.${safeExt}`
}

function buildRandomImageFileName(cardId, ext, isTaken) {
 const safeExt = String(ext || "png").toLowerCase()
 const safeCardId = String(cardId || "card").replace(/[^a-zA-Z0-9_-]/g, "") || "card"

 for (let i = 0; i < 32; i += 1) {
  const randomHex = crypto.randomBytes(4).toString("hex")
  const candidate = `${safeCardId}_${Date.now()}_${randomHex}.${safeExt}`
  if (!isTaken(candidate)) return candidate
 }

 return buildUniqueImageFileName(`card_${safeCardId}_${Date.now()}`, safeExt, isTaken)
}

function loadUser(userId) {
 return dbLoadUser(userId)
}

function normalizeDemoCardName(rawName) {
 const text = String(rawName || "")
  .replace(/[_-]+/g, " ")
  .replace(/\s+/g, " ")
  .trim()
 if (!text) return "Carte inconnue"
 return text.charAt(0).toUpperCase() + text.slice(1)
}

function buildLocalCardsFromImages() {
 const sourceRoots = [CARD_IMAGES_RUNTIME_DIR, CARD_IMAGES_REPO_DIR]
 const raritySet = new Set(RARITY_ORDER)
 const rawSets = readJSON(findSetsPath(), [])
 const setCandidates = (Array.isArray(rawSets) ? rawSets : (rawSets?.sets || []))
  .map((row) => String(row?.id || "").trim().toLowerCase())
  .filter(Boolean)
 const playableSets = setCandidates.length > 0 ? setCandidates : ["katrepat"]
 const byId = new Map()
 let syntheticId = 100000

 for (const rootDir of sourceRoots) {
  if (!fs.existsSync(rootDir)) continue
  const stack = [{ dir: rootDir, setHint: null }]

  while (stack.length > 0) {
   const { dir, setHint } = stack.pop()
   let entries = []
   try {
    entries = fs.readdirSync(dir, { withFileTypes: true })
   } catch (_) {
    continue
   }

   for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      const nextSetHint = setHint || entry.name
      stack.push({ dir: fullPath, setHint: nextSetHint })
      continue
    }
    if (!entry.isFile()) continue
    if (!/\.(png|jpg|jpeg|webp)$/i.test(entry.name)) continue

    const ext = path.extname(entry.name)
    const stem = entry.name.slice(0, -ext.length)
    const parts = stem.split("_").filter(Boolean)
    if (parts.length <= 0) continue

    let rarity = "C"
    const last = String(parts[parts.length - 1] || "").toUpperCase()
    if (raritySet.has(last)) {
     rarity = last
     parts.pop()
    }

    let parsedId = Number.parseInt(String(parts[0] || ""), 10)
    if (Number.isInteger(parsedId)) {
     parts.shift()
    } else {
     parsedId = syntheticId++
    }

    const cardId = String(parsedId)
    if (byId.has(cardId)) continue
    const sourceSetId = String(setHint || "katrepat").toLowerCase()
    const setId = sourceSetId || String(playableSets[Math.abs(parsedId) % playableSets.length] || "katrepat")
    const cardName = normalizeDemoCardName(parts.join(" "))

    byId.set(cardId, {
     id: parsedId,
     name: cardName,
     rarity,
     set: setId,
     image: entry.name
    })
   }
  }
 }

 return [...byId.values()].sort((a, b) =>
  Number(a.id || 0) - Number(b.id || 0) ||
  String(a.name || "").localeCompare(String(b.name || ""), "fr")
 )
}

function bootstrapCardsFromImagesIfNeeded() {
 if (_localCardsBootstrapTried) return
 _localCardsBootstrapTried = true

 if (!isTruthyFlag(WEB_BOOTSTRAP_CARDS_FROM_IMAGES)) return

 const existingCards = readJSON(CARDS_PATH, [])
 if (Array.isArray(existingCards) && existingCards.length > 0) return

 const generatedCards = buildLocalCardsFromImages()
 if (!generatedCards.length) return

 try {
  saveCards(generatedCards)
 } catch (_) {}

 _cardsCache = generatedCards
 _cardsCacheAt = Date.now()
 webLog.info("Bootstrap cartes locales depuis les images", { cards: generatedCards.length })
}

function getCards() {
 bootstrapCardsFromImagesIfNeeded()
 const now = Date.now()
 if (_cardsCache && (now - _cardsCacheAt) < STATIC_CACHE_TTL) return _cardsCache
 _cardsCache = readJSON(CARDS_PATH, [])
 _cardsCacheAt = now
 return _cardsCache
}

function getSets() {
 const now = Date.now()
 if (_setsCache && (now - _setsCacheAt) < STATIC_CACHE_TTL) return _setsCache
 const raw = readJSON(findSetsPath(), [])
 const list = Array.isArray(raw) ? raw : (raw?.sets || [])
 _setsCache = sortSetsByDisplayOrder(list)
 _setsCacheAt = now
 return _setsCache
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
 return getAllGuilds()
}

function parseIntSafe(value, fallback) {
 const n = Number(value)
 if (!Number.isFinite(n)) return fallback
 return Math.floor(n)
}

function normalizeUiText(value) {
 const raw = String(value || "")
 if (!raw) return ""
 const hasMojibake = /(?:Ã.|â.|ð[\u0080-\u00BF]|œ|�)/.test(raw)
 if (!hasMojibake) return raw

 try {
  const latin1Decoded = Buffer.from(raw, "latin1").toString("utf8")
  if (latin1Decoded && latin1Decoded !== raw) return latin1Decoded
 } catch (_) {}

 try {
  return decodeURIComponent(escape(raw))
 } catch (_) {
  return raw
 }
}

function normalizeUiEmoji(value, fallback = "🏅") {
 const normalized = normalizeUiText(value).trim()
 if (!normalized) return String(fallback || "🏅")
 return normalized
}

function shouldTrackProfileView(req) {
 const value = String(req.query?.track || "").trim().toLowerCase()
 return value === "1" || value === "true" || value === "yes" || value === "on"
}

function getBattlePassQuestXpConfig() {
 return readJSON(BATTLEPASS_XP_CONFIG_PATH, { sources: {} }) || { sources: {} }
}

function getQuestBattlePassXp(type = "daily") {
 const safeType = normalizeQuestType(type)
 const cfg = getBattlePassQuestXpConfig()
 const source = cfg?.sources || {}
 if (safeType === "weekly") {
  return Number(source.quest_weekly_claim || DEFAULT_QUEST_BP_XP.weeklyClaim)
 }
 return Number(source.quest_daily_claim || DEFAULT_QUEST_BP_XP.dailyClaim)
}

function getQuestBonusBattlePassXp(type = "daily") {
 const safeType = normalizeQuestType(type)
 const cfg = getBattlePassQuestXpConfig()
 const source = cfg?.sources || {}
 if (safeType === "weekly") {
  return Number(source.quest_weekly_bonus || DEFAULT_QUEST_BP_XP.weeklyBonus)
 }
 return Number(source.quest_daily_bonus || DEFAULT_QUEST_BP_XP.dailyBonus)
}

function countUnlockedAchievements(unlocked) {
 if (!Array.isArray(unlocked) || unlocked.length === 0) return 0
 return new Set(unlocked.map((id) => String(id))).size
}

function normalizeQuestType(value) {
 const type = String(value || "").trim().toLowerCase()
 return type === "weekly" ? "weekly" : "daily"
}

function normalizeQuestScope(value) {
 const scope = String(value || "").trim().toLowerCase()
 return scope === "guild" ? "guild" : "player"
}

function getParisDateFR(now = new Date()) {
 return now.toLocaleDateString("fr-FR", { timeZone: "Europe/Paris" })
}

function getNextParisMidnightTimestamp(nowMs = Date.now()) {
 const parisNow = new Date(new Date(nowMs).toLocaleString("en-US", { timeZone: "Europe/Paris" }))
 const nextParisMidnight = new Date(parisNow.getTime())
 nextParisMidnight.setHours(24, 0, 0, 0)
 const delta = Math.max(0, nextParisMidnight.getTime() - parisNow.getTime())
 return nowMs + delta
}

function resolveShopFinalPrice(userId, user, basePrice) {
 const safeBase = Math.max(0, Number(basePrice || 0))
 let finalPrice = safeBase

 const guildBonuses = getUserGuildBonuses(userId)
 const guildDiscount = Math.max(0, Number(guildBonuses?.shopDiscount || 0))
 if (guildDiscount > 0) {
  finalPrice = Math.floor(finalPrice * (1 - (guildDiscount / 100)))
 }

 const playerLevel = Number(user?.progression?.level || 1)
 const playerBonuses = getPlayerBonuses(playerLevel)
 const playerDiscount = Math.max(0, Number(playerBonuses?.shopDiscount || 0))
 if (playerDiscount > 0) {
  finalPrice = Math.floor(finalPrice * (1 - (playerDiscount / 100)))
 }

 finalPrice = Math.max(0, Number(finalPrice || 0))
 const totalDiscountPercent = safeBase > 0
  ? Math.max(0, Math.round((1 - (finalPrice / safeBase)) * 100))
  : 0

 return {
  basePrice: safeBase,
  finalPrice,
  guildDiscount,
  playerDiscount,
  totalDiscountPercent
 }
}

function buildKrosmoshopStatePayload(userId = null) {
 const connected = Boolean(userId)
 const shop = getShop()
 const cards = getCards()
 const sets = getSets()
 const cardsById = new Map(cards.map((c) => [String(c.id), c]))
 const setNames = getCardSetNameMap(sets)
 const shopDay = String(shop?.lastReset || getParisDateFR())

 const user = connected ? getUser(userId) : null
 const userKamas = Number(user?.kamas || 0)
 const userCards = user?.cards || {}
 const boughtToday = user?.krosmoshop?.[shopDay] || {}

 const discountInfo = connected
  ? resolveShopFinalPrice(String(userId), user, 100)
  : { guildDiscount: 0, playerDiscount: 0, totalDiscountPercent: 0 }

 const items = (shop?.cards || []).map((entry) => {
  const cardId = String(entry?.card || "")
  const card = cardsById.get(cardId) || null
  const basePrice = Math.max(0, Number(entry?.price || 0))
  const pricing = connected
   ? resolveShopFinalPrice(String(userId), user, basePrice)
   : { basePrice, finalPrice: basePrice, guildDiscount: 0, playerDiscount: 0, totalDiscountPercent: 0 }
  const purchased = connected ? Boolean(boughtToday?.[cardId]) : false
  const owned = Number(userCards?.[cardId] || 0)
  const missingKamas = Math.max(0, pricing.finalPrice - userKamas)

  return {
   cardId,
   rarity: String(entry?.rarity || card?.rarity || "C"),
   name: String(card?.name || `Carte ${cardId}`),
   setId: String(card?.set || "unknown"),
   setName: String(setNames.get(String(card?.set || "")) || card?.set || "Inconnu"),
   imageUrl: card?.image && card?.set
    ? `/assets/cards/${encodeURIComponent(String(card.set))}/${encodeURIComponent(String(card.image))}`
    : null,
   basePrice: pricing.basePrice,
   finalPrice: pricing.finalPrice,
   totalDiscountPercent: pricing.totalDiscountPercent,
   purchased,
   owned,
   canBuy: connected && !purchased && userKamas >= pricing.finalPrice,
   missingKamas
  }
 })

 const purchasableCount = items.filter((item) => item.canBuy).length
 const boughtCount = items.filter((item) => item.purchased).length
 const totalCount = items.length
 const nextResetAt = getNextParisMidnightTimestamp()

 return {
  connected,
  previewMode: !connected,
  shopDay,
  nextResetAt,
  cooldownMs: Math.max(0, nextResetAt - Date.now()),
  wallet: {
   kamas: userKamas
  },
  discounts: {
   guildPercent: Number(discountInfo.guildDiscount || 0),
   playerPercent: Number(discountInfo.playerDiscount || 0),
   totalPercent: Number(discountInfo.totalDiscountPercent || 0)
  },
  progress: {
   boughtCount,
   totalCount,
   purchasableCount
  },
  stats: {
   cardsBought: Number(user?.krosmoshopStats?.cardsBought || 0),
   ssrBought: Number(user?.krosmoshopStats?.ssrBought || 0),
   sBought: Number(user?.krosmoshopStats?.sBought || 0),
   kamasSpent: Number(user?.krosmoshopStats?.kamasSpent || 0),
   daysVisited: Number(user?.krosmoshopStats?.daysVisited || 0)
  },
  items
 }
}

function buildQuestSummary(progress = []) {
 const total = progress.length
 const done = progress.filter((quest) => Boolean(quest?.done)).length
 const claimed = progress.filter((quest) => Boolean(quest?.claimed)).length
 const claimable = progress.filter((quest) => Boolean(quest?.done) && !Boolean(quest?.claimed)).length
 return {
  total,
  done,
  claimed,
  claimable,
  allDone: total > 0 && done >= total,
  allClaimed: total > 0 && claimed >= total
 }
}

function buildPlayerQuestGroup(user, type) {
 const safeType = normalizeQuestType(type)
 const progress = getAllProgress(user, safeType)
 const summary = buildQuestSummary(progress)
 const bonus = safeType === "weekly" ? WEEKLY_BONUS : DAILY_BONUS
 const questBpXp = getQuestBattlePassXp(safeType)
 const bonusBpXp = getQuestBonusBattlePassXp(safeType)

 return {
  type: safeType,
  resetIn: safeType === "weekly" ? getNextWeeklyReset() : getNextDailyReset(),
  summary,
  bonus: {
   kamas: Number(bonus?.kamas || 0),
   xp: Number(bonus?.xp || 0),
   packs: Number(bonus?.packs || 0),
   fragments: Number(bonus?.fragments || 0),
   bpXp: bonusBpXp
  },
  quests: progress.map((quest) => ({
   id: String(quest.id || ""),
   emoji: String(quest.emoji || ""),
   name: String(quest.name || "Quête"),
   desc: String(quest.desc || ""),
   current: Number(quest.current || 0),
   goal: Number(quest.goal || 0),
   done: Boolean(quest.done),
   claimed: Boolean(quest.claimed),
   claimable: Boolean(quest.done) && !Boolean(quest.claimed),
   reward: {
    kamas: Number(quest?.reward?.kamas || 0),
    xp: Number(quest?.reward?.xp || 0),
    packs: Number(quest?.reward?.packs || 0),
    fragments: Number(quest?.reward?.fragments || 0),
    bpXp: questBpXp
   }
  }))
 }
}

function buildGuildQuestGroup(guild, type) {
 const safeType = normalizeQuestType(type)
 const progress = getGuildQuestProgress(guild.id, safeType)
 const summary = buildQuestSummary(progress)

 return {
  type: safeType,
  resetIn: getNextGuildQuestReset(safeType),
  summary,
  quests: progress.map((quest) => ({
   id: String(quest.id || ""),
   emoji: String(quest.emoji || ""),
   name: String(quest.name || "Quête de guilde"),
   desc: String(quest.desc || ""),
   current: Number(quest.current || 0),
   goal: Number(quest.goal || 0),
   done: Boolean(quest.done),
   claimed: Boolean(quest.claimed),
   claimable: Boolean(quest.done) && !Boolean(quest.claimed),
   reward: {
    guildXp: Number(quest.xp || 0)
   }
  }))
 }
}

function buildQuestStatePayload(userId) {
 const user = getUser(userId)
 ensureUserQuests(user)

 const guild = getUserGuild(userId)
 const player = {
  daily: buildPlayerQuestGroup(user, "daily"),
  weekly: buildPlayerQuestGroup(user, "weekly")
 }

 if (!guild) return { connected: true, player, guild: null }

 const rank = getGuildRank(guild.id, userId)
 const canClaim = rank === "meneur" || rank === "officier"

 return {
  connected: true,
  player,
  guild: {
   id: String(guild.id || ""),
   name: String(guild.name || "Guilde"),
   emoji: String(guild.emoji || "🛡️"),
   rank,
   canClaim,
   level: Number(guild.level || 1),
   xp: Number(guild.xp || 0),
   daily: buildGuildQuestGroup(guild, "daily"),
   weekly: buildGuildQuestGroup(guild, "weekly")
  }
 }
}

function buildPreviewQuestRows(quests = [], scope = "player", memberCount = 6, type = "daily") {
 const safeType = normalizeQuestType(type)
 return quests.map((quest, index) => {
  const baseGoal = scope === "guild"
   ? Number(getScaledGoal(Number(quest?.baseGoal || 1), memberCount) || 1)
   : Number(quest?.goal || 1)
  const goal = Math.max(1, baseGoal)
  const rawDesc = String(quest?.desc || "")
  const desc = scope === "guild" ? rawDesc.replace("{goal}", String(goal)) : rawDesc

  let current = Math.max(0, goal - 1)
  let claimed = false
  if (index === 0) {
   current = goal
   claimed = true
  } else if (index === 1) {
   current = goal
  } else if (index === 2) {
   current = Math.max(1, Math.floor(goal * 0.7))
  }
  const done = current >= goal

  return {
   id: String(quest?.id || ""),
   emoji: String(quest?.emoji || ""),
   name: String(quest?.name || (scope === "guild" ? "Quête de guilde" : "Quête")),
   desc,
   current: Math.min(current, goal),
   goal,
   done,
   claimed,
   claimable: false,
   reward: scope === "guild"
    ? { guildXp: Number(quest?.xp || 0) }
   : {
     kamas: Number(quest?.reward?.kamas || 0),
     xp: Number(quest?.reward?.xp || 0),
     packs: Number(quest?.reward?.packs || 0),
     fragments: Number(quest?.reward?.fragments || 0),
     bpXp: getQuestBattlePassXp(safeType)
     }
  }
 })
}

function buildQuestPreviewPayload() {
 const playerDailyRows = buildPreviewQuestRows(getDailyQuests().quests, "player", 6, "daily")
 const playerWeeklyRows = buildPreviewQuestRows(getWeeklyQuests().quests, "player", 6, "weekly")
 const guildMemberCount = 6
 const guildDailyRows = buildPreviewQuestRows(getDailyGuildQuests(), "guild", guildMemberCount, "daily")
 const guildWeeklyRows = buildPreviewQuestRows(getWeeklyGuildQuests(), "guild", guildMemberCount, "weekly")

 return {
  connected: false,
  preview: {
   enabled: true,
   note: "Mode aperçu local sans connexion Discord."
  },
  player: {
   daily: {
    type: "daily",
    resetIn: getNextDailyReset(),
    summary: buildQuestSummary(playerDailyRows),
   bonus: {
    kamas: Number(DAILY_BONUS?.kamas || 0),
    xp: Number(DAILY_BONUS?.xp || 0),
    packs: Number(DAILY_BONUS?.packs || 0),
    fragments: Number(DAILY_BONUS?.fragments || 0),
    bpXp: getQuestBonusBattlePassXp("daily")
   },
    quests: playerDailyRows
   },
   weekly: {
    type: "weekly",
    resetIn: getNextWeeklyReset(),
    summary: buildQuestSummary(playerWeeklyRows),
   bonus: {
    kamas: Number(WEEKLY_BONUS?.kamas || 0),
    xp: Number(WEEKLY_BONUS?.xp || 0),
    packs: Number(WEEKLY_BONUS?.packs || 0),
    fragments: Number(WEEKLY_BONUS?.fragments || 0),
    bpXp: getQuestBonusBattlePassXp("weekly")
   },
    quests: playerWeeklyRows
   }
  },
  guild: {
   id: "preview-guild",
   name: "Guilde Aperçu",
   emoji: "🛡️",
   rank: "visiteur",
   canClaim: false,
   level: 12,
   xp: 1840,
   memberCount: guildMemberCount,
   daily: {
    type: "daily",
    resetIn: getNextGuildQuestReset("daily"),
    summary: buildQuestSummary(guildDailyRows),
    quests: guildDailyRows
   },
   weekly: {
    type: "weekly",
    resetIn: getNextGuildQuestReset("weekly"),
    summary: buildQuestSummary(guildWeeklyRows),
    quests: guildWeeklyRows
   }
  }
 }
}

function normalizeRarity(value) {
 const rarity = String(value || "").trim().toUpperCase()
 return RARITY_ORDER.includes(rarity) ? rarity : ""
}

function getNextRarity(rarity) {
 const index = RARITY_ORDER.indexOf(rarity)
 if (index < 0) return null
 if (index >= RARITY_ORDER.indexOf("SSR")) return null
 return RARITY_ORDER[index + 1]
}

function randInt(min, max) {
 const lo = Number(min)
 const hi = Number(max)
 if (!Number.isFinite(lo) || !Number.isFinite(hi) || hi < lo) return 0
 return Math.floor(Math.random() * (hi - lo + 1)) + lo
}

function pickWebPinataTier(score) {
 let result = null
 for (const tier of WEB_PINATA_TIERS) {
  if (Number(score || 0) >= Number(tier.minScore || 0)) result = tier
 }
 return result
}

function getWebPinataMultiplier(participantCount) {
 let multiplier = 1
 for (const row of WEB_PINATA_MULTIPLIERS) {
  if (participantCount >= Number(row.min || 0)) multiplier = Number(row.mult || 1)
 }
 return multiplier
}

function pickRandomCardByRarities(cards, rarityPool) {
 const pool = cards.filter((card) => rarityPool.includes(String(card?.rarity || "")))
 if (!pool.length) return null
 return pool[Math.floor(Math.random() * pool.length)]
}

function startWebPinataRound(now = Date.now()) {
 webPinataState.roundId += 1
 webPinataState.active = true
 webPinataState.startedAt = now
 webPinataState.endsAt = now + WEB_PINATA_DURATION_MS
 webPinataState.nextStartAt = 0
 webPinataState.participants = new Map()
 webPinataState.rewardsByUser = new Map()
 webPinataState.lastResults = []
 webPinataState.lastSummary = null
 pushActivity({ kind: "pinata_start", roundId: webPinataState.roundId })
}

async function finalizeWebPinataRound() {
 const now = Date.now()
 const entries = [...webPinataState.participants.entries()]
 const participantCount = entries.length
 const multiplier = getWebPinataMultiplier(participantCount)
 const cards = getCards()
 const resultRows = []

 for (const [userId, participant] of entries) {
  const totalReactions = Number(participant?.totalReactions || 0)
  const uniqueCount = participant?.uniqueEmojis instanceof Set ? participant.uniqueEmojis.size : 0
  const score = totalReactions + (uniqueCount * 2)
  const tier = pickWebPinataTier(score)
  if (!tier) continue

  const user = getUser(String(userId))
  if (!user.stats) user.stats = {}
  if (!user.cards) user.cards = {}

  const kamas = Math.floor(randInt(tier.kamas[0], tier.kamas[1]) * multiplier)
  const xp = Math.floor(Number(tier.xp || 0) * multiplier)
  user.kamas = Number(user.kamas || 0) + kamas
  user.stats.kamasEarned = Number(user.stats.kamasEarned || 0) + kamas
  user.stats.totalKamasEarned = Number(user.stats.totalKamasEarned || 0) + kamas
  addXP(user, xp)

  let cardReward = null
  let ssrWon = false
  const isKrosmique = Number(tier.minScore || 0) === Number(WEB_PINATA_TIERS[WEB_PINATA_TIERS.length - 1].minScore || 0)
  if (Math.random() < Number(tier.cardChance || 0)) {
   if (isKrosmique && Math.random() < WEB_PINATA_SSR_CHANCE_KROSMIQUE) {
    const ssrCard = pickRandomCardByRarities(cards, ["SSR"])
    if (ssrCard) {
      user.cards[ssrCard.id] = Number(user.cards[ssrCard.id] || 0) + 1
      user.stats.ssrPulled = Number(user.stats.ssrPulled || 0) + 1
      user.stats.pinataSSRWon = Number(user.stats.pinataSSRWon || 0) + 1
      ssrWon = true
      cardReward = {
       cardId: String(ssrCard.id),
       cardName: String(ssrCard.name || `Carte ${ssrCard.id}`),
       rarity: String(ssrCard.rarity || "SSR"),
       imageUrl: ssrCard?.image && ssrCard?.set
        ? `/assets/cards/${encodeURIComponent(String(ssrCard.set))}/${encodeURIComponent(String(ssrCard.image))}`
        : null
      }
    }
   }
   if (!cardReward) {
    const card = pickRandomCardByRarities(cards, tier.cardPool || [])
    if (card) {
     user.cards[card.id] = Number(user.cards[card.id] || 0) + 1
     cardReward = {
      cardId: String(card.id),
      cardName: String(card.name || `Carte ${card.id}`),
      rarity: String(card.rarity || "C"),
      imageUrl: card?.image && card?.set
       ? `/assets/cards/${encodeURIComponent(String(card.set))}/${encodeURIComponent(String(card.image))}`
       : null
     }
    }
   }
  }

  let fragmentReward = null
  const rolled = rollFragmentForEvent(Number(tier.fragmentChance || 0))
  if (rolled) {
   grantRolledFragment(String(userId), rolled, "pinata-web")
   fragmentReward = {
    cardId: String(rolled.cardId),
    fragmentNumber: Number(rolled.fragmentNumber || 0)
   }
  }

  user.stats.pinataParticipations = Number(user.stats.pinataParticipations || 0) + 1
  user.stats.pinataReactionsTotal = Number(user.stats.pinataReactionsTotal || 0) + totalReactions
  user.stats.pinataKamasWon = Number(user.stats.pinataKamasWon || 0) + kamas

  const unlocked = achievementCheck(user, "pinata")
  try {
   await addBattlePassXP(String(userId), Number(tier.bpXp || 0), "manual")
  } catch (_) {}
  save(String(userId))

  const row = {
   userId: String(userId),
   totalReactions,
   uniqueCount,
   score,
   tier: String(tier.label || "Participant"),
   kamas,
   xp,
   ssrWon,
   card: cardReward,
   fragment: fragmentReward,
   unlockedAchievements: countUnlockedAchievements(unlocked)
  }
  webPinataState.rewardsByUser.set(String(userId), row)
  enqueueWebRewardToast(String(userId), {
   type: "event",
   tone: "event",
   title: "🎉 Piñata d'Écaflip",
   subtitle: `${String(tier.label || "Participant")} • Score ${score}`,
   description: "Récompense de fin de piñata",
   rewardText: formatWebPinataRewardText(row),
   chipLabel: "Gains"
  })
  resultRows.push(row)
 }

 resultRows.sort((a, b) => b.score - a.score)
 webPinataState.lastResults = resultRows.slice(0, 50)
 webPinataState.lastSummary = {
  roundId: webPinataState.roundId,
  endedAt: now,
  participants: participantCount,
  multiplier,
  totalKamas: resultRows.reduce((sum, row) => sum + Number(row.kamas || 0), 0),
  totalCards: resultRows.filter((row) => row.card).length,
  totalSSR: resultRows.filter((row) => row.ssrWon).length,
  totalFragments: resultRows.filter((row) => row.fragment).length
 }

 webPinataState.active = false
 webPinataState.startedAt = 0
 webPinataState.endsAt = 0
 const extraDelay = participantCount <= 0 ? WEB_NO_ACTIVITY_PENALTY_MS : 0
 scheduleNextWebPinata(now, extraDelay)
 pushActivity({ kind: "pinata_end", participants: participantCount })
 apiCache.invalidatePrefix("leaderboard:")
}

async function ensureWebPinataLifecycle() {
 const now = Date.now()
 if (!webPinataState.active && now >= Number(webPinataState.nextStartAt || 0)) {
  startWebPinataRound(now)
 }
 if (webPinataState.active && now >= Number(webPinataState.endsAt || 0)) {
  await finalizeWebPinataRound()
 }
}

let webPinataLifecycleInterval = null
let webPinataLifecycleRunning = false

function startWebPinataLifecycleLoop() {
 if (webPinataLifecycleInterval) return

 webPinataLifecycleInterval = setInterval(async () => {
  if (webPinataLifecycleRunning) return
  webPinataLifecycleRunning = true
  try {
   await ensureWebPinataLifecycle()
  } catch (error) {
   console.error("[WEB] lifecycle pinata:", error)
  } finally {
   webPinataLifecycleRunning = false
  }
 }, 5000)
}

function getWebPinataView(userId) {
 const participantCount = webPinataState.participants.size
 const meParticipant = userId ? webPinataState.participants.get(String(userId)) : null
 const meReward = userId ? webPinataState.rewardsByUser.get(String(userId)) : null
 const reactedEmojis = meParticipant?.uniqueEmojis instanceof Set
  ? [...meParticipant.uniqueEmojis.values()]
  : []

 const leaderboard = (webPinataState.lastResults || []).slice(0, 6).map((row) => ({
  userId: String(row.userId),
  score: Number(row.score || 0),
  tier: String(row.tier || "Participant"),
  kamas: Number(row.kamas || 0),
  ssrWon: Boolean(row.ssrWon)
 }))

 return {
  active: Boolean(webPinataState.active),
  roundId: Number(webPinataState.roundId || 0),
  startedAt: webPinataState.startedAt || null,
  endsAt: webPinataState.endsAt || null,
  nextStartAt: webPinataState.nextStartAt || null,
  durationMs: WEB_PINATA_DURATION_MS,
  cooldownMs: Math.max(0, Number(webPinataState.nextStartAt || 0) - Date.now()),
  allowedEmojis: WEB_PINATA_ALLOWED_EMOJIS,
  participants: participantCount,
  my: {
   totalReactions: Number(meParticipant?.totalReactions || 0),
   uniqueCount: reactedEmojis.length,
   emojis: reactedEmojis,
   reward: meReward || null
  },
  summary: webPinataState.lastSummary || null,
  leaderboard
 }
}

function buildEventVoiceLine(event, pack) {
 const voice = event?.voiceLines || {}
 const hasSSR = (pack || []).some((card) => String(card?.rarity || "") === "SSR")
 const hasS = (pack || []).some((card) => String(card?.rarity || "") === "S")
 const pool = hasSSR ? (voice.SSR || []) : hasS ? (voice.S || []) : []
 if (!pool.length) return null
 return String(pool[Math.floor(Math.random() * pool.length)] || "").trim() || null
}

function getUserDuplicateCountForRarityInSet(user, cards, setId, rarity) {
 let duplicates = 0
 for (const card of cards) {
  if (String(card.set) !== String(setId) || String(card.rarity) !== String(rarity)) continue
  const count = Number(user.cards?.[card.id] || 0)
  if (count > 1) duplicates += (count - 1)
 }
 return duplicates
}

function consumeDuplicatesForFusion(user, cards, setId, rarity, cost) {
 let available = getUserDuplicateCountForRarityInSet(user, cards, setId, rarity)
 if (available < cost) return { ok: false, available }

 let remaining = cost
 for (const card of cards) {
  if (remaining <= 0) break
  if (String(card.set) !== String(setId) || String(card.rarity) !== String(rarity)) continue

  const count = Number(user.cards?.[card.id] || 0)
  const removable = Math.max(0, count - 1)
  if (removable <= 0) continue

  const take = Math.min(removable, remaining)
  user.cards[card.id] = count - take
  if (user.cards[card.id] <= 0) delete user.cards[card.id]
  remaining -= take
 }

 available = getUserDuplicateCountForRarityInSet(user, cards, setId, rarity)
 return { ok: remaining === 0, availableAfter: available }
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

function stripDiscordMarkdownForWeb(value) {
 const input = String(value || "")
 if (!input) return ""

 return input
  .replace(/\r/g, "")
  .replace(/^>\s?/gm, "")
  .replace(/^#{1,6}\s*/gm, "")
  .replace(/`{1,3}/g, "")
  .replace(/\*\*(.*?)\*\*/g, "$1")
  .replace(/\*(.*?)\*/g, "$1")
  .replace(/__(.*?)__/g, "$1")
  .replace(/~~(.*?)~~/g, "$1")
  .replace(/\|\|(.*?)\|\|/g, "$1")
  .trim()
}

function getCardSetNameMap(sets) {
 const map = new Map()
 for (const set of sets || []) {
  map.set(String(set.id), set.name || set.id)
 }
 return map
}

function formatUtcTimestamp(ts) {
 const date = new Date(Number(ts || 0))
 if (!Number.isFinite(date.getTime())) return ""
 const shifted = new Date(date.getTime() + (RECRUIT_HISTORY_UTC_OFFSET_HOURS * 60 * 60 * 1000))
 const pad = (n) => String(n).padStart(2, "0")
 return `${pad(shifted.getUTCDate())}/${pad(shifted.getUTCMonth() + 1)}/${shifted.getUTCFullYear()} ${pad(shifted.getUTCHours())}:${pad(shifted.getUTCMinutes())}:${pad(shifted.getUTCSeconds())}`
}

function normalizeRecruitHistoryEntry(raw, now = Date.now()) {
 if (!raw || typeof raw !== "object") return null
 const ts = Number(raw.ts || raw.acquiredAtTs || raw.timestamp || 0)
 if (!Number.isFinite(ts) || ts <= 0) return null
 if ((now - ts) > RECRUIT_HISTORY_WINDOW_MS) return null

 const setId = String(raw.setId || "").trim().toLowerCase()
 const setName = String(raw.setName || raw.setId || "Inconnu")
 const rarity = String(raw.rarity || "C").toUpperCase()
 const itemName = String(raw.itemName || raw.cardName || "Carte inconnue")
 const recruitmentName = String(raw.recruitmentName || setName || "Set")
 const qty = Math.max(1, Number(raw.qty || 1))
 const imageUrl = raw.imageUrl ? String(raw.imageUrl) : null

 return {
  ts,
  setId,
  setName,
  rarity,
  itemName,
  recruitmentName,
  qty,
  imageUrl
 }
}

function ensureRecruitHistory(user, now = Date.now()) {
 const source = Array.isArray(user?.recruitHistory) ? user.recruitHistory : []
 const normalized = []
 for (const row of source) {
  const entry = normalizeRecruitHistoryEntry(row, now)
  if (entry) normalized.push(entry)
 }
 normalized.sort((a, b) => Number(b.ts || 0) - Number(a.ts || 0))
 if (normalized.length > RECRUIT_HISTORY_MAX_ITEMS) {
  normalized.length = RECRUIT_HISTORY_MAX_ITEMS
 }

 let changed = !Array.isArray(user?.recruitHistory) || normalized.length !== source.length
 if (!changed) {
  for (let i = 0; i < normalized.length; i++) {
   const left = normalized[i]
   const right = source[i] || {}
   if (
    Number(left.ts || 0) !== Number(right.ts || right.acquiredAtTs || right.timestamp || 0) ||
    String(left.setId || "") !== String(right.setId || "").toLowerCase() ||
    String(left.setName || "") !== String(right.setName || right.setId || "Inconnu") ||
    String(left.rarity || "") !== String(right.rarity || "C").toUpperCase() ||
    String(left.itemName || "") !== String(right.itemName || right.cardName || "Carte inconnue") ||
    String(left.recruitmentName || "") !== String(right.recruitmentName || right.setName || "Set") ||
    Number(left.qty || 1) !== Math.max(1, Number(right.qty || 1)) ||
    String(left.imageUrl || "") !== String(right.imageUrl || "")
   ) {
    changed = true
    break
   }
  }
 }

 if (changed && user && typeof user === "object") {
  user.recruitHistory = normalized
 }
 return { list: normalized, changed }
}

function appendRecruitHistoryEntries(user, entries = []) {
 if (!user || typeof user !== "object") return 0
 const now = Date.now()
 const seed = ensureRecruitHistory(user, now).list
 const list = [...seed]
 let added = 0

 for (const raw of (Array.isArray(entries) ? entries : [])) {
  const entry = normalizeRecruitHistoryEntry({ ...raw, ts: now }, now)
  if (!entry) continue
  list.unshift(entry)
  added += 1
 }

 if (!added) return 0

 const pruned = list
  .filter((row) => (now - Number(row.ts || 0)) <= RECRUIT_HISTORY_WINDOW_MS)
  .sort((a, b) => Number(b.ts || 0) - Number(a.ts || 0))
  .slice(0, RECRUIT_HISTORY_MAX_ITEMS)

 user.recruitHistory = pruned
 return added
}

function buildRecruitHistoryPayload(user, options = {}) {
 const now = Date.now()
 const setFilter = String(options?.setId || "").trim().toLowerCase()
 const page = Math.max(1, Number(options?.page || 1))
 const limit = Math.max(1, Number(options?.limit || 10))

 const { list, changed } = ensureRecruitHistory(user, now)
 const filtered = setFilter ? list.filter((row) => String(row.setId || "") === setFilter) : list
 const total = filtered.length
 const pages = Math.max(1, Math.ceil(total / limit))
 const safePage = Math.max(1, Math.min(pages, page))
 const offset = (safePage - 1) * limit
 const items = filtered.slice(offset, offset + limit).map((row) => ({
  ...row,
  acquiredAtTs: Number(row.ts || 0),
  acquiredAt: formatUtcTimestamp(row.ts)
 }))

 return {
  changed,
  total,
  page: safePage,
  pages,
  limit,
  items
 }
}

function parseCookies(req) {
 const header = req.headers.cookie
 if (!header) return {}
 return header.split(";").reduce((acc, chunk) => {
  const idx = chunk.indexOf("=")
  if (idx < 0) return acc
  const k = chunk.slice(0, idx).trim()
  const v = chunk.slice(idx + 1).trim()
  try {
   acc[k] = decodeURIComponent(v)
  } catch (_) {
   acc[k] = v
  }
  return acc
 }, {})
}

function isTruthyFlag(value) {
 const raw = String(value || "").trim().toLowerCase()
 return raw === "1" || raw === "true" || raw === "yes" || raw === "on"
}

function isFalsyFlag(value) {
 const raw = String(value || "").trim().toLowerCase()
 return raw === "0" || raw === "false" || raw === "no" || raw === "off"
}

function isLoopbackHost(req) {
 const host = String(req.headers.host || req.hostname || "").toLowerCase()
 return host.startsWith("localhost") || host.startsWith("127.0.0.1") || host.startsWith("[::1]") || host.startsWith("::1")
}

function canUseLocalAuth(req) {
 if (isTruthyFlag(WEB_LOCAL_AUTH_FORCE)) return true
 if (String(process.env.NODE_ENV || "").toLowerCase() === "production") return false
 return isLoopbackHost(req)
}

function hasLocalAuthSignal(req, cookies = null) {
 const sourceCookies = cookies || parseCookies(req)
 const headerFlag = req.headers["x-kc-local-auth"]
 const queryFlag = req.query?.local
 const cookieFlag = sourceCookies[WEB_LOCAL_AUTH_COOKIE]
 return isTruthyFlag(headerFlag) || isTruthyFlag(queryFlag) || isTruthyFlag(cookieFlag)
}

function hasLocalAuthDisableSignal(req, cookies = null) {
 const sourceCookies = cookies || parseCookies(req)
 const headerFlag = req.headers["x-kc-local-auth"]
 const queryFlag = req.query?.local
 const cookieFlag = sourceCookies[WEB_LOCAL_AUTH_COOKIE]
 return isFalsyFlag(headerFlag) || isFalsyFlag(queryFlag) || isFalsyFlag(cookieFlag)
}

function buildLocalSession(req, cookies = null) {
 if (!canUseLocalAuth(req)) return null
 if (hasLocalAuthDisableSignal(req, cookies)) return null
 const autoLocalWhenOauthMissing = !oauthConfigured()
 if (!hasLocalAuthSignal(req, cookies) && !autoLocalWhenOauthMissing) return null
 return {
  token: `local:${WEB_LOCAL_AUTH_USER_ID}`,
  userId: WEB_LOCAL_AUTH_USER_ID,
  local: true
 }
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
 return `HttpOnly; Path=/; Max-Age=${maxAgeSec}; SameSite=Strict${isHttpsRequest(req) ? "; Secure" : ""}`
}

function createWebSession(userId) {
 /* Cap anti-flood : si trop de sessions, purger les expirées d'abord */
 if (webSessions.size >= MAX_SESSIONS) {
  const now = Date.now()
  for (const [t, s] of webSessions) {
   if (s.expiresAt <= now) webSessions.delete(t)
  }
  /* Si toujours au max, supprimer les plus anciennes */
  if (webSessions.size >= MAX_SESSIONS) {
   const oldest = [...webSessions.entries()]
    .sort((a, b) => a[1].expiresAt - b[1].expiresAt)
    .slice(0, Math.floor(MAX_SESSIONS * 0.1))
   for (const [t] of oldest) webSessions.delete(t)
  }
 }

 const token = crypto.randomBytes(32).toString("hex")
 const user = getUser(String(userId || ""))
 if (user) {
  recordWebLogin(user, Date.now())
  save(String(userId || ""))
 }
 webSessions.set(token, {
  userId: String(userId),
  expiresAt: Date.now() + WEB_SESSION_TTL_MS
 })
 return token
}

function isLocalDemoWorldEnabled() {
 return !isFalsyFlag(WEB_LOCAL_DEMO_WORLD)
}

function getLocalDemoUserId(index) {
 return String(WEB_LOCAL_DEMO_ID_BASE + BigInt(Math.max(1, Number(index || 1))))
}

function getLocalDemoBotName(index) {
 const baseNames = [
  "Aldren", "Briska", "Caelys", "Darnok", "Elyra", "Feyris", "Galven", "Helion",
  "Ilyne", "Jorim", "Kalyra", "Lioren", "Myrth", "Nerion", "Orlune", "Phaeris",
  "Quorin", "Ravyn", "Sylwen", "Tarian", "Ulric", "Vaelis", "Weyra", "Xelion",
  "Ysara", "Zorath", "Arvyn", "Belros", "Cyria", "Delya", "Eron", "Falyn",
  "Grynd", "Havor", "Irven", "Jelra", "Kaelor", "Lunis", "Marek", "Nyxen"
 ]
 const safeIndex = Math.max(0, Number(index || 0))
 const root = baseNames[safeIndex % baseNames.length]
 const suffix = String(Math.floor(safeIndex / baseNames.length) + 1).padStart(2, "0")
 return `${root} ${suffix}`
}

function setLocalDiscordProfile(userId, displayName, username = null) {
 const safeId = String(userId || "").trim()
 if (!safeId) return
 const fallbackUsername = String(username || displayName || `aventurier_${safeId.slice(-4)}`)
  .toLowerCase()
  .replace(/[^a-z0-9_]/g, "_")
 const value = {
  id: safeId,
  username: fallbackUsername,
  displayName: String(displayName || fallbackUsername),
  avatar: null,
  avatarURL: null
 }
 localDiscordProfileOverrides.set(safeId, value)
 discordUserCache.set(safeId, { value, expiresAt: Date.now() + DISCORD_USER_TTL_MS })
}

function ensureLocalDiscordProfiles(localUserId) {
 setLocalDiscordProfile(localUserId, "Sauci Local", "sauci_local")
 for (let index = 0; index < WEB_LOCAL_DEMO_BOT_COUNT; index++) {
  const userId = getLocalDemoUserId(index + 1)
  setLocalDiscordProfile(userId, getLocalDemoBotName(index), `joueur_${String(index + 1).padStart(2, "0")}`)
 }
}

function getCurrentDayId() {
 const now = new Date()
 const yyyy = now.getFullYear()
 const mm = String(now.getMonth() + 1).padStart(2, "0")
 const dd = String(now.getDate()).padStart(2, "0")
 return `${yyyy}-${mm}-${dd}`
}

function getCurrentWeekId() {
 const now = new Date()
 const jan1 = new Date(now.getFullYear(), 0, 1)
 const days = Math.floor((now - jan1) / 86400000)
 const week = Math.ceil((days + jan1.getDay() + 1) / 7)
 return `${now.getFullYear()}-W${String(week).padStart(2, "0")}`
}

function ensureQuestStatValue(user, stat, absoluteValue) {
 const safeValue = Math.max(0, Math.floor(Number(absoluteValue || 0)))
 if (!user.stats || typeof user.stats !== "object") user.stats = {}
 if (!user.krosmoshopStats || typeof user.krosmoshopStats !== "object") {
  user.krosmoshopStats = {
   cardsBought: 0,
   ssrBought: 0,
   sBought: 0,
   kamasSpent: 0,
   daysVisited: 0
  }
 }

 if (stat === "_shopBought" || stat === "shopBought") {
  user.stats.shopBought = Math.max(Number(user.stats.shopBought || 0), safeValue)
  user.krosmoshopStats.cardsBought = Math.max(Number(user.krosmoshopStats.cardsBought || 0), safeValue)
  return
 }
 if (stat === "_shopKamasSpent") {
  user.krosmoshopStats.kamasSpent = Math.max(Number(user.krosmoshopStats.kamasSpent || 0), safeValue)
  return
 }
 if (stat === "_kamasEarned") {
  user.stats.kamasEarned = Math.max(Number(user.stats.kamasEarned || 0), safeValue)
  user.stats.totalKamasEarned = Math.max(Number(user.stats.totalKamasEarned || 0), safeValue)
  return
 }
 user.stats[stat] = Math.max(Number(user.stats[stat] || 0), safeValue)
}

function ensureUserCardsForDemo(user, cards, options = {}) {
 if (!user.cards || typeof user.cards !== "object") user.cards = {}
 if (!Array.isArray(cards) || cards.length <= 0) return

 const uniqueTarget = Math.max(1, Math.min(cards.length, Number(options.uniqueTarget || 30)))
 const minQty = Math.max(1, Number(options.minQty || 1))
 const maxQty = Math.max(minQty, Number(options.maxQty || 3))
 const offset = Math.max(0, Number(options.offset || 0)) % cards.length
 const sortedCards = [...cards].sort((a, b) =>
  Number(a?.id || 0) - Number(b?.id || 0) ||
  String(a?.name || "").localeCompare(String(b?.name || ""), "fr")
 )
 const rotated = sortedCards.slice(offset).concat(sortedCards.slice(0, offset))

 for (let index = 0; index < uniqueTarget; index++) {
  const card = rotated[index]
  if (!card) continue
  const cardId = String(card.id || "")
  if (!cardId) continue
  const span = Math.max(1, (maxQty - minQty) + 1)
  const qty = minQty + ((index + offset) % span)
  if (Number(user.cards[cardId] || 0) < qty) {
   user.cards[cardId] = qty
  }
 }
}

function ensureUserFragmentsForDemo(user, cards, options = {}) {
 if (!Array.isArray(user.fragments)) user.fragments = []
 const prioritized = cards.filter((card) => ["SSR", "S", "UR"].includes(String(card?.rarity || "").toUpperCase()))
 if (!prioritized.length) return

 const fullSets = Math.max(0, Number(options.fullSets || 0))
 const partialSets = Math.max(0, Number(options.partialSets || 0))
 const offset = Math.max(0, Number(options.offset || 0)) % prioritized.length
 const rotated = prioritized.slice(offset).concat(prioritized.slice(0, offset))
 const existing = new Set(
  user.fragments.map((fragment) => `${String(fragment?.cardId || "")}:${Number(fragment?.fragmentNumber || 0)}`)
 )

 const addFragment = (cardId, fragmentNumber) => {
  const key = `${String(cardId)}:${Number(fragmentNumber)}`
  if (existing.has(key)) return
  user.fragments.push({
   cardId: String(cardId),
   fragmentNumber: Number(fragmentNumber),
   source: "local-demo",
   obtainedAt: new Date().toISOString()
  })
  existing.add(key)
 }

 for (let index = 0; index < fullSets; index++) {
  const card = rotated[index]
  if (!card) break
  for (let fragmentNumber = 1; fragmentNumber <= 5; fragmentNumber++) {
   addFragment(card.id, fragmentNumber)
  }
 }

 for (let index = fullSets; index < fullSets + partialSets; index++) {
  const card = rotated[index]
  if (!card) break
  const maxFragment = 1 + (index % 4)
  for (let fragmentNumber = 1; fragmentNumber <= maxFragment; fragmentNumber++) {
   addFragment(card.id, fragmentNumber)
  }
 }
}

function ensureLocalBattlePassProgress(userId, targetLevel, premium = false, claimedRatio = 0.4) {
 const currentSeason = ensureCurrentSeason()
 const season = getSeasonTemplate(currentSeason.activeSeason)
 if (!season) return

 const progress = getUserProgress(userId, currentSeason.activeSeason)
 const safeTarget = Math.max(1, Math.floor(Number(targetLevel || 1)))
 const curve = Array.isArray(season.xpCurve) ? season.xpCurve : []
 const totalLevels = Math.max(1, Number(season.totalLevels || 40))
 const xpFloor = safeTarget > 1
  ? (curve[Math.min(curve.length - 1, Math.max(0, safeTarget - 2))] || 0)
  : 0
 const endlessBonus = safeTarget > totalLevels
  ? (safeTarget - totalLevels) * 900
  : 250

 progress.totalXP = Math.max(Number(progress.totalXP || 0), Number(xpFloor || 0) + endlessBonus)
 progress.currentLevel = computeLevel(progress.totalXP, curve, null)
 progress.hasPremium = Boolean(progress.hasPremium || premium)

 const maxClaimableLevel = Math.min(totalLevels, progress.currentLevel)
 const claimedFreeMax = Math.max(0, Math.min(maxClaimableLevel, Math.floor(maxClaimableLevel * Number(claimedRatio || 0.4))))
 const claimedPremiumMax = progress.hasPremium
  ? Math.max(0, Math.min(maxClaimableLevel, Math.floor(claimedFreeMax * 0.8)))
  : 0

 progress.claimedFree = Array.from({ length: claimedFreeMax }, (_, idx) => idx + 1)
 progress.claimedPremium = Array.from({ length: claimedPremiumMax }, (_, idx) => idx + 1)
 const nowIso = new Date().toISOString()
 progress.claimedFreeAt = {}
 progress.claimedPremiumAt = {}
 for (const level of progress.claimedFree) {
  progress.claimedFreeAt[String(level)] = nowIso
 }
 for (const level of progress.claimedPremium) {
  progress.claimedPremiumAt[String(level)] = nowIso
 }

 if (!progress.stats || typeof progress.stats !== "object") progress.stats = {}
 progress.stats.packsOpened = Math.max(Number(progress.stats.packsOpened || 0), Math.floor(progress.currentLevel * 3))
 progress.stats.fusions = Math.max(Number(progress.stats.fusions || 0), Math.floor(progress.currentLevel * 1.6))
 progress.stats.dailyClaims = Math.max(Number(progress.stats.dailyClaims || 0), 15)
 progress.stats.marketSales = Math.max(Number(progress.stats.marketSales || 0), 18)
 progress.stats.events = Math.max(Number(progress.stats.events || 0), 10)
 progress.stats.rouletteSpins = Math.max(Number(progress.stats.rouletteSpins || 0), 25)

 saveUserProgress(progress)
}

function clearListingsForSeller(sellerId) {
 const existing = getUserListings(sellerId)
 for (const listing of existing || []) {
  const listingId = Number(listing?.id || 0)
  if (!Number.isFinite(listingId) || listingId <= 0) continue
  removeListing(sellerId, listingId)
 }
}

function ensureMarketListingsForSeller(sellerId, targetCount, cardsById, sellerOffset = 0) {
 const marketBasePrice = {
  C: 120,
  U: 220,
  R: 420,
  SR: 760,
  HR: 1300,
  UR: 2200,
  S: 4300,
  SSR: 11800
 }

 const user = getUser(sellerId)
 if (!user) return
 if (!user.cards || typeof user.cards !== "object") user.cards = {}
 if (!Array.isArray(user.fragments)) user.fragments = []

 const existingListings = getUserListings(sellerId)
 const missing = Math.max(0, Number(targetCount || 0) - existingListings.length)
 if (missing <= 0) return

 const sellableCards = Object.entries(user.cards)
  .filter(([, qty]) => Number(qty || 0) > 1)
  .map(([cardId, qty]) => {
   const card = cardsById.get(String(cardId)) || getSecretCardById(cardId)
   return {
    cardId: String(cardId),
    qty: Number(qty || 0),
    rarity: String(card?.rarity || "C").toUpperCase()
   }
  })
  .sort((a, b) => {
   const left = RARITY_ORDER.indexOf(a.rarity)
   const right = RARITY_ORDER.indexOf(b.rarity)
   return right - left || Number(b.qty || 0) - Number(a.qty || 0)
  })

 let created = 0
 for (let index = 0; index < sellableCards.length && created < missing; index++) {
  const row = sellableCards[index]
  const base = Number(marketBasePrice[row.rarity] || 180)
  const factor = 0.86 + (((index + sellerOffset) % 7) * 0.08)
  const price = Math.max(50, Math.floor(base * factor))
  const result = addListing(sellerId, row.cardId, price)
  if (!result?.error) created++
 }

 const fragmentTarget = Math.min(2, Math.max(0, Math.floor(Number(targetCount || 0) / 5)))
 let fragmentCreated = 0
 const fragments = [...user.fragments]
 for (let index = 0; index < fragments.length && fragmentCreated < fragmentTarget; index++) {
  const fragment = fragments[index]
  const card = cardsById.get(String(fragment?.cardId || ""))
  const rarity = String(card?.rarity || "SSR").toUpperCase()
  const base = Math.max(250, Math.floor(Number(marketBasePrice[rarity] || 1400) * 0.3))
  const price = base + (((index + sellerOffset) % 5) * 85)
  const result = addFragmentListing(
   sellerId,
   String(fragment.cardId || ""),
   Number(fragment.fragmentNumber || 0),
   price
  )
  if (!result?.error) fragmentCreated++
 }

 save(sellerId)
}

function seedLocalMarketHistory(cards, sellers, buyers) {
 const marketBasePrice = {
  C: 120,
  U: 220,
  R: 420,
  SR: 760,
  HR: 1300,
  UR: 2200,
  S: 4300,
  SSR: 11800
 }

 if (!Array.isArray(cards) || cards.length <= 0) return
 if (!Array.isArray(sellers) || sellers.length <= 0) return
 if (!Array.isArray(buyers) || buyers.length <= 0) return

 const pool = cards.slice(0, Math.min(cards.length, 120))
 const now = Date.now()
 for (let index = 0; index < 48; index++) {
  const card = pool[(index * 11) % pool.length]
  if (!card) continue
  const seller = String(sellers[index % sellers.length] || "")
  const buyer = String(buyers[(index * 3 + 2) % buyers.length] || "")
  if (!seller || !buyer || seller === buyer) continue
  const rarity = String(card?.rarity || "C").toUpperCase()
  const base = Number(marketBasePrice[rarity] || 200)
  const price = Math.max(40, Math.floor(base * (0.78 + ((index % 6) * 0.09))))
  dbAddMarketHistory({
   seller,
   buyer,
   card: String(card.id),
   price,
   type: "card",
   fragmentNumber: null,
   timestamp: now - ((index + 1) * 17 * 60 * 1000)
  })
 }
}

function ensureLocalGuildWorld(localUserId, botIds) {
 const guildNames = [
  "Chroniques du Krosmoz",
  "Veilleurs d Astrub",
  "Compagnie des Douze",
  "Sberg Vanguard",
  "Conclave des Runes",
  "Brigade de Kelba"
 ]

 const existingByName = new Map(
  getGuildList().map((guild) => [normalizeText(guild?.name), guild])
 )

 const guildIds = []
 const allMembers = [localUserId, ...botIds]
 const segmentSize = [8, 6, 6, 5, 5, 5]
 let cursor = 0

 for (let index = 0; index < guildNames.length; index++) {
  const name = guildNames[index]
  const normalized = normalizeText(name)
  let guild = existingByName.get(normalized) || null

  if (!guild) {
   const leaderId = index === 0
    ? localUserId
    : botIds[Math.max(0, botIds.length - index)]
   const leader = getUser(leaderId)
   if (Number(leader.kamas || 0) < 5000) leader.kamas = 5000
   save(leaderId)
   const created = createGuild(leaderId, name)
   if (created?.guild) guild = created.guild
  }
  if (!guild?.id) continue

  guildIds.push(String(guild.id))
  const desired = Math.max(3, Number(segmentSize[index] || 5))
  const members = []
  if (index === 0) members.push(localUserId)
  while (members.length < desired && cursor < allMembers.length) {
   const nextId = allMembers[cursor]
   cursor++
   if (!nextId || members.includes(nextId)) continue
   members.push(nextId)
  }
  for (const memberId of members) {
   devForceJoin(memberId, guild.id)
  }

  const targetLevel = Math.max(5, Math.min(50, 10 + (index * 7)))
  devSetGuildLevel(guild.id, targetLevel)
 }

 const dayId = getCurrentDayId()
 const weekId = getCurrentWeekId()
 for (let index = 0; index < guildIds.length; index++) {
  const guild = getGuild(guildIds[index])
  if (!guild) continue
  if (!guild.stats || typeof guild.stats !== "object") guild.stats = {}
  guild.stats.totalXpEarned = Math.max(Number(guild.stats.totalXpEarned || 0), 3000 + (index * 2200))
  guild.stats.questsCompleted = Math.max(Number(guild.stats.questsCompleted || 0), 15 + (index * 6))
  guild.questsWeek = weekId
  guild.questsDay = dayId
  guild.questSnapshot = {}
  guild.questDaySnapshot = {}
  guild.questsClaimed = Array.isArray(guild.questsClaimed) ? guild.questsClaimed : []
  guild.questsDayClaimed = Array.isArray(guild.questsDayClaimed) ? guild.questsDayClaimed : []
 }
 saveGuilds()
}

function ensureLocalDevUserSeed(userId) {
 const safeUserId = String(userId || "").trim()
 if (!safeUserId) return
 if (localDevUserSeededUsers.has(safeUserId)) return

 const user = getUser(safeUserId)
 if (!user) return

 let dirty = false
 const forceReset = isLocalDemoWorldEnabled()

 if (forceReset || Number(user.kamas || 0) < 260000) {
  user.kamas = 260000
  dirty = true
 }

 if (forceReset || Number(user.packs || 0) < 45) {
  user.packs = 45
  dirty = true
 }

 if (!user.progression || typeof user.progression !== "object" || forceReset || Number(user.progression.level || 0) < 28) {
  user.progression = { level: 28, xp: 530, totalXp: 98000 }
  dirty = true
 } else {
  if (!Number.isFinite(Number(user.progression.xp))) {
   user.progression.xp = 530
   dirty = true
  }
  if (!Number.isFinite(Number(user.progression.totalXp))) {
   user.progression.totalXp = 98000
   dirty = true
  }
 }

 const cards = getCards()
 ensureUserCardsForDemo(user, cards, { uniqueTarget: 170, minQty: 2, maxQty: 6, offset: 9 })
 ensureUserFragmentsForDemo(user, cards, { fullSets: 14, partialSets: 10, offset: 4 })
 dirty = true

 const allAchievementIds = Object.keys(achievementRegistry || {})
 if (!Array.isArray(user.achievements)) user.achievements = []
 if (user.achievements.length < Math.min(70, allAchievementIds.length)) {
  const target = Math.min(allAchievementIds.length, 90)
  const picked = []
  for (let index = 0; index < target; index++) {
   picked.push(String(allAchievementIds[(index * 7) % allAchievementIds.length]))
  }
  user.achievements = [...new Set([...user.achievements, ...picked])]
  dirty = true
 }

 if (!Array.isArray(user.titles)) user.titles = ["Nouveau"]
 for (const title of ["Nouveau", "Collectionneur", "Marchand du Krosmoz", "Alchimiste"]) {
  if (!user.titles.includes(title)) user.titles.push(title)
 }
 if (String(user.title || "").trim() === "" || user.title === "Nouveau") {
  user.title = "Maitre des Douze"
  dirty = true
 }

 if (!user.stats || typeof user.stats !== "object") user.stats = {}
 ensureQuestStatValue(user, "packsOpened", 410)
 ensureQuestStatValue(user, "packsBought", 180)
 ensureQuestStatValue(user, "fusions", 135)
 ensureQuestStatValue(user, "fusionCrit", 24)
 ensureQuestStatValue(user, "cardsSold", 190)
 ensureQuestStatValue(user, "cardsBought", 118)
 ensureQuestStatValue(user, "marketBought", 54)
 ensureQuestStatValue(user, "ssrPulled", 36)
 ensureQuestStatValue(user, "shinySSR", 7)
 ensureQuestStatValue(user, "dailyClaims", 42)
 ensureQuestStatValue(user, "eventPacksOpened", 29)
 ensureQuestStatValue(user, "ssrFromEvent", 6)
 ensureQuestStatValue(user, "rouletteSpins", 98)
 ensureQuestStatValue(user, "_kamasEarned", 960000)
 ensureQuestStatValue(user, "_shopBought", 45)
 ensureQuestStatValue(user, "_shopKamasSpent", 93000)
 ensureQuestStatValue(user, "giftsGiven", 28)
 ensureQuestStatValue(user, "profileViews", 71)
 ensureQuestStatValue(user, "inventoryOpen", 84)
 ensureQuestStatValue(user, "leaderboardViews", 53)
 ensureQuestStatValue(user, "botMentions", 15)
 ensureQuestStatValue(user, "pinataParticipations", 11)
 ensureQuestStatValue(user, "pinataReactionsTotal", 186)
 ensureQuestStatValue(user, "pinataKamasWon", 12400)
 ensureQuestStatValue(user, "krosmozOpened", 32)
 user.stats.activityStreak = forceReset
  ? 19
  : Math.max(Number(user.stats.activityStreak || 0), 19)
 user.daily = user.daily || { streak: 0, lastDaily: 0 }
 user.daily.streak = forceReset
  ? 12
  : Math.max(Number(user.daily.streak || 0), 12)

 ensureUserQuests(user)
 const daily = getDailyQuests().quests || []
 const weekly = getWeeklyQuests().quests || []
 for (const quest of daily) {
  const baseline = Number(user.quests?.daily?.snapshot?.[quest.stat] || 0)
  ensureQuestStatValue(user, quest.stat, baseline + Number(quest.goal || 1) + 2)
 }
 for (const quest of weekly) {
  const baseline = Number(user.quests?.weekly?.snapshot?.[quest.stat] || 0)
  ensureQuestStatValue(user, quest.stat, baseline + Number(quest.goal || 1) + 5)
 }
 if (user.quests?.daily && Array.isArray(user.quests.daily.claimed) && user.quests.daily.claimed.length <= 0 && daily[0]) {
  user.quests.daily.claimed.push(String(daily[0].id))
 }
 if (user.quests?.weekly && Array.isArray(user.quests.weekly.claimed) && user.quests.weekly.claimed.length <= 0 && weekly[0]) {
  user.quests.weekly.claimed.push(String(weekly[0].id))
 }

 ensureLocalBattlePassProgress(safeUserId, 36, true, 0.45)

 if (dirty) save(safeUserId)
 localDevUserSeededUsers.add(safeUserId)
}

function ensureLocalDemoWorldSeed(localUserId) {
 if (!isLocalDemoWorldEnabled()) return
 if (localDemoWorldSeeded) return

 try {
  ensureLocalDiscordProfiles(localUserId)

  const localUser = getUser(localUserId)
  if (!localUser) return

  const cards = getCards()
  if (!Array.isArray(cards) || cards.length <= 0) return
  const cardsById = new Map(cards.map((card) => [String(card.id), card]))

  const botIds = []
  for (let index = 0; index < WEB_LOCAL_DEMO_BOT_COUNT; index++) {
   const botId = getLocalDemoUserId(index + 1)
   botIds.push(botId)

   const user = getUser(botId)
   ensureUserCardsForDemo(user, cards, {
    uniqueTarget: 95 + (index % 40),
    minQty: 1,
    maxQty: 4,
    offset: 11 + (index * 3)
   })
   ensureUserFragmentsForDemo(user, cards, {
    fullSets: 2 + (index % 3),
    partialSets: 3 + (index % 4),
    offset: index * 2
   })

   user.kamas = 30000 + (index * 4200)
   user.packs = 20 + (index % 18)
   user.progression = user.progression || { level: 1, xp: 0, totalXp: 0 }
   user.progression.level = 10 + (index % 25)
   user.progression.xp = 40 + ((index * 37) % 420)
   user.progression.totalXp = (user.progression.level * 2800) + (index * 330)

   if (!Array.isArray(user.titles)) user.titles = ["Nouveau"]
   for (const title of ["Nouveau", "Aventurier", "Marchand"]) {
    if (!user.titles.includes(title)) user.titles.push(title)
   }
   if (!user.title || user.title === "Nouveau") {
    user.title = index % 2 === 0 ? "Aventurier" : "Marchand"
   }

   if (!Array.isArray(user.achievements)) user.achievements = []
   const achievementIds = Object.keys(achievementRegistry || {})
   const unlockTarget = Math.min(achievementIds.length, 10 + (index % 18))
   for (let achIndex = 0; achIndex < unlockTarget; achIndex++) {
    user.achievements.push(String(achievementIds[(achIndex * 5 + index) % achievementIds.length]))
   }
   user.achievements = [...new Set(user.achievements)]

   ensureQuestStatValue(user, "packsOpened", 95 + (index * 6))
   ensureQuestStatValue(user, "fusions", 40 + (index * 3))
   ensureQuestStatValue(user, "cardsSold", 52 + (index * 2))
   ensureQuestStatValue(user, "cardsBought", 31 + (index * 2))
   ensureQuestStatValue(user, "marketBought", 17 + (index % 25))
   ensureQuestStatValue(user, "ssrPulled", 6 + Math.floor(index / 3))
   ensureQuestStatValue(user, "dailyClaims", 12 + (index % 20))
   ensureQuestStatValue(user, "eventPacksOpened", 5 + (index % 12))
   ensureQuestStatValue(user, "rouletteSpins", 16 + (index % 40))
   ensureQuestStatValue(user, "_kamasEarned", 130000 + (index * 21000))
   ensureQuestStatValue(user, "_shopBought", 8 + (index % 16))
   ensureQuestStatValue(user, "_shopKamasSpent", 18000 + (index * 2400))
   ensureQuestStatValue(user, "giftsGiven", 4 + (index % 11))
   ensureQuestStatValue(user, "krosmozOpened", 5 + (index % 16))

   ensureLocalBattlePassProgress(botId, 8 + (index % 28), index % 3 === 0, 0.32)
   save(botId)
  }

  ensureLocalGuildWorld(localUserId, botIds)

  const listingSellers = [localUserId, ...botIds.slice(0, 22)]
  for (let index = 0; index < listingSellers.length; index++) {
   const sellerId = listingSellers[index]
   const targetCount = sellerId === localUserId ? 9 : 5 + (index % 3)
   clearListingsForSeller(sellerId)
   ensureMarketListingsForSeller(sellerId, targetCount, cardsById, index)
  }

  seedLocalMarketHistory(cards, botIds.slice(0, 14), [localUserId, ...botIds.slice(14, 28)])

  if (!isEventActive()) {
   startEvent(null)
  }
  const refreshedLocalUser = getUser(localUserId)
  initUserEvent(refreshedLocalUser)
  if (refreshedLocalUser?.event && Number(refreshedLocalUser.event.used || 0) <= 0) {
   refreshedLocalUser.event.used = 1
  }
  ensureQuestStatValue(refreshedLocalUser, "eventPacksOpened", 31)
  save(localUserId)

  pushActivity({
   kind: "drop_ssr",
   userId: localUserId,
   cardName: "Simulation locale SSR",
   shiny: false,
   timestamp: Date.now() - (12 * 60 * 1000)
  })
  pushActivity({
   kind: "pinata_end",
   participants: 24,
   timestamp: Date.now() - (7 * 60 * 1000)
  })

  refreshedLocalUser.localDev = refreshedLocalUser.localDev || {}
  refreshedLocalUser.localDev.worldSeedVersion = WEB_LOCAL_DEMO_SEED_VERSION
  refreshedLocalUser.localDev.seededAt = new Date().toISOString()
  save(localUserId)
  localDemoWorldSeeded = true
 } catch (error) {
  webLog.error("Seed local demo world: echec", { err: error })
 }
}

function resolveSession(req) {
 const cookies = parseCookies(req)
 const localSession = buildLocalSession(req, cookies)
 if (localSession) {
  ensureLocalDevUserSeed(localSession.userId)
  ensureLocalDemoWorldSeed(localSession.userId)
  return localSession
 }

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

function isBannedSession(session) {
 if (!session?.userId) return false
 return isDiscordIdBanned(session.userId)
}

function buildBanPageHtml() {
 const imageSrc = BAN_KROSMOZ_IMAGE_PATH
 return `<!doctype html>
<html lang="fr">
<head>
 <meta charset="utf-8">
 <meta name="viewport" content="width=device-width, initial-scale=1">
 <title>Ban Krosmoz</title>
 <style>
  html,body{
   margin:0;
   width:100%;
   height:100%;
   overflow:hidden;
   background:#000;
  }
  body{
   display:flex;
   align-items:center;
   justify-content:center;
   user-select:none;
   touch-action:none;
   pointer-events:none;
  }
  img{
   width:100vw;
   height:100vh;
   object-fit:cover;
   -webkit-user-drag:none;
  }
 </style>
</head>
<body>
 <img src="${imageSrc}" alt="Ban Krosmoz" draggable="false">
</body>
</html>`
}

function sendBanPage(res) {
 res.status(403)
 res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, private")
 return res.type("html").send(buildBanPageHtml())
}

function sendBanApiResponse(res) {
 return res.status(403).json({
  error: "Compte banni de Krosmoz.",
  code: "BAN_KROSMOZ",
  banned: true,
  banImage: BAN_KROSMOZ_IMAGE_PATH
 })
}

function shouldBypassBanGate(req) {
 const rawPath = String(req.path || "")
 let pathName = rawPath
 try {
  pathName = decodeURIComponent(rawPath)
 } catch (_) {}

 if (pathName === "/health") return true
 if (pathName === "/auth/logout") return true
 if (pathName === "/api/oauth/status") return true
 if (pathName === "/assets/ui/ban krosmoz.png") return true
 return false
}

function clearSession(req, res) {
 const cookies = parseCookies(req)
 const token = cookies.kc_session
 if (token) webSessions.delete(token)
 res.setHeader("Set-Cookie", [
  `kc_session=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict${isHttpsRequest(req) ? "; Secure" : ""}`,
  `${WEB_LOCAL_AUTH_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax${isHttpsRequest(req) ? "; Secure" : ""}`
 ])
}

function requireSession(req, res) {
 const session = resolveSession(req)
 if (!session) {
  res.status(401).json({ error: "Connexion Discord requise." })
  return null
 }
 if (isBannedSession(session)) {
  sendBanApiResponse(res)
  return null
 }
 return session
}

function requireSessionPage(req, res) {
 const session = resolveSession(req)
 if (session && !isBannedSession(session)) return session
 if (session && isBannedSession(session)) {
  sendBanPage(res)
  return null
 }
 res.redirect("/")
 return null
}

async function resolveDiscordUser(userId) {
 const safeUserId = String(userId || "").trim()
 const localOverride = localDiscordProfileOverrides.get(safeUserId)
 if (localOverride) return localOverride

 const now = Date.now()
 const cached = discordUserCache.get(safeUserId)
 if (cached && cached.expiresAt > now) return cached.value

 const fallback = {
  id: safeUserId,
  username: safeUserId,
  displayName: safeUserId,
  avatar: null,
  avatarURL: null
 }

 try {
  const token = process.env.TOKEN
  if (!token) return fallback

  const res = await fetch(`https://discord.com/api/v10/users/${encodeURIComponent(safeUserId)}`, {
   headers: { Authorization: `Bot ${token}` }
  })
  if (!res.ok) return fallback

  const data = await res.json()
  const avatarURL = data.avatar
   ? `https://cdn.discordapp.com/avatars/${safeUserId}/${data.avatar}.${data.avatar.startsWith("a_") ? "gif" : "webp"}?size=256`
   : `https://cdn.discordapp.com/embed/avatars/${(BigInt(safeUserId) >> 22n) % 6n}.png`

  const value = {
   id: safeUserId,
   username: data.username,
   displayName: data.global_name || data.username,
   avatar: data.avatar,
   avatarURL
  }

  discordUserCache.set(safeUserId, { value, expiresAt: now + DISCORD_USER_TTL_MS })
  return value
 } catch (_) {
  return fallback
 }
}

function computeGlobalStats() {
 const cards = getCards()
 const sets = getSets()
 const guilds = getGuildList()
 const row = dbGlobalStats()

 return {
  players: row.players,
  totalCards: cards.length,
  totalSets: sets.length,
  cardsOwned: row.cardsOwned,
  ssrOwned: row.ssrOwned,
  totalKamas: row.totalKamas,
  packsOpened: row.packsOpened,
  fusions: row.fusions,
  rouletteSpins: row.rouletteSpins,
  pinataParticipations: row.pinataParticipations,
  achievements: row.achievements,
  guilds: guilds.length
 }
}

async function computeActivityFeed(limit = 10) {
 const cards = getCards()
 const cardsById = new Map(cards.map((c) => [String(c.id), c]))
 const safeLimit = Math.max(1, Math.min(50, Number(limit) || 10))

 /* Market history (SQLite) */
 const latest = dbLoadMarketHistory(safeLimit)

 const marketItems = await Promise.all(latest.map(async (entry) => {
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

 /* Merge avec le journal d'activité en mémoire */
 const logItems = await Promise.all(activityLog.slice(0, safeLimit).map(async (entry) => {
  const enriched = { ...entry }

  if (entry.userId) {
   const discord = await resolveDiscordUser(String(entry.userId))
   enriched.userName = discord?.displayName || String(entry.userId)
  }

  return enriched
 }))

 const merged = [...marketItems, ...logItems]
  .sort((a, b) => b.timestamp - a.timestamp)
  .slice(0, safeLimit)

 return merged
}

function computeLeaderboard(category) {
 const valid = ["cards", "unique", "kamas", "level", "achievements", "ssr", "packs", "guilds"]
 if (!valid.includes(category)) return []

 if (category === "guilds") {
  return computeGuildSummary({ sort: "level" })
   .slice(0, 100)
   .map((row) => ({
    guildId: String(row.id),
    name: String(row.name || "Guilde"),
    emoji: String(row.emoji || "🛡️"),
    level: Number(row.level || 1),
    members: Number(row.members || 0),
    maxMembers: MAX_MEMBERS,
    value: Number(row.level || 1)
   }))
 }

 /* Requête SQL directe ? instantané, plus besoin de lire tous les fichiers */
 return dbLeaderboard(category, 100)
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
 const unlockedIds = Array.isArray(user.achievements) ? user.achievements.map((id) => String(id)) : []
 const profileBadges = []
 const seenBadges = new Set()

 for (const id of unlockedIds) {
  const ach = achievementRegistry?.[id]
  if (!ach) continue
  const badge = String(ach?.badge || "").trim()
  if (!badge) continue
  const key = `ach:${id}`
  if (seenBadges.has(key)) continue
  seenBadges.add(key)
  profileBadges.push({
   id: key,
   badge,
   name: String(ach?.name || id),
   label: String(ach?.name || id),
   source: "achievement"
  })
 }

 for (const raw of (Array.isArray(user.badges) ? user.badges : [])) {
  const badgeName = String(raw || "").trim()
  if (!badgeName) continue
  const key = `bp:${badgeName}`
  if (seenBadges.has(key)) continue
  seenBadges.add(key)
  profileBadges.push({
   id: key,
   badge: "🏅",
   name: badgeName,
   label: badgeName,
   source: "battlepass"
  })
 }

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
  badges: profileBadges,
  achievements: user.achievements?.length || 0,
  guild,
  rarityBreakdown,
  setProgress,
  pity: sets.map((set) => {
   const p = user.pity?.[set.id] || {}
   return {
    setId: set.id,
    setName: set.name,
    UR:  p.UR || 0,
    S:   p.S || 0,
    SSR: p.SSR || 0
   }
  }),
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
 const rarityRaw = Array.isArray(query.rarity) ? query.rarity : [query.rarity]
 const rarityList = [...new Set(
  rarityRaw
   .flatMap((value) => String(value || "").split(","))
   .map((value) => normalizeText(value).toUpperCase())
   .filter(Boolean)
 )]
 const raritySet = rarityList.length ? new Set(rarityList) : null
 const set = normalizeText(query.set)
 const sort = normalizeText(query.sort) || "id"
 const order = normalizeText(query.order || query.dir || "asc") === "desc" ? "desc" : "asc"
 const orderFactor = order === "desc" ? -1 : 1
 const rarityRank = (rarityValue) => {
  const idx = RARITY_ORDER.indexOf(String(rarityValue || "").toUpperCase())
  return idx >= 0 ? idx : RARITY_ORDER.length
 }

 let filtered = cards.filter((card) => {
  if (q && !String(card.name || "").toLowerCase().includes(q)) return false
  if (raritySet && !raritySet.has(String(card.rarity || "").toUpperCase())) return false
  if (set && String(card.set || "").toLowerCase() !== set) return false
  return true
 })

 switch (sort) {
  case "name":
   filtered = filtered.sort((a, b) =>
    orderFactor * (
     String(a.name || "").localeCompare(String(b.name || ""), "fr") ||
     (Number(a.id || 0) - Number(b.id || 0))
    )
   )
   break
  case "rarity":
   filtered = filtered.sort((a, b) => {
    const left = rarityRank(a.rarity)
    const right = rarityRank(b.rarity)
    return orderFactor * (
     (left - right) ||
     String(a.name || "").localeCompare(String(b.name || ""), "fr") ||
     (Number(a.id || 0) - Number(b.id || 0))
    )
   })
   break
  case "set":
   filtered = filtered.sort((a, b) =>
    orderFactor * (
     String(setNames.get(String(a.set || "")) || a.set || "").localeCompare(
      String(setNames.get(String(b.set || "")) || b.set || ""),
      "fr"
     ) ||
     String(a.name || "").localeCompare(String(b.name || ""), "fr") ||
     (Number(a.id || 0) - Number(b.id || 0))
    )
   )
   break
  default:
   filtered = filtered.sort((a, b) =>
    orderFactor * (
     (Number(a.id || 0) - Number(b.id || 0)) ||
     String(a.name || "").localeCompare(String(b.name || ""), "fr")
    )
   )
   break
 }

  return {
   total: filtered.length,
   items: filtered.map((card) => ({
   id: card.id,
    name: card.name || `Carte ${card.id}`,
    rarity: card.rarity || "C",
    set: card.set || "unknown",
    image: card.image || "",
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
 const { dbLoadMarket: loadMkt, dbLoadMarketHistory: loadHist } = require("../systems/database")
 const market = loadMkt()
 const history = loadHist(1000)
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
  const card = cardsById.get(String(entry.card)) || getSecretCardById(entry.card)
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
  if (String(item.rarity || "").toUpperCase() === "SECRET") return false
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
  emoji: g.emoji || "🛡️",
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
   const card = cardsById.get(String(cardId)) || getSecretCardById(cardId)
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
  emoji: guild.emoji || "🛡️",
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

function asGuildId(value) {
 return String(value || "").trim()
}

function normalizeGuildApplications(guild) {
 if (!guild || typeof guild !== "object") return []
 const before = Array.isArray(guild.applications) ? guild.applications : []
 const members = new Set((guild.memberIds || []).map((id) => String(id)))
 const seen = new Set()
 const normalized = []

 for (const row of before) {
  const userId = asGuildId(row?.userId || row)
  if (!userId || seen.has(userId) || members.has(userId)) continue
  normalized.push({
   userId,
   createdAt: row?.createdAt || new Date().toISOString()
  })
  seen.add(userId)
 }

 if (
  !Array.isArray(guild.applications) ||
  guild.applications.length !== normalized.length ||
  guild.applications.some((entry, index) => String(entry?.userId || entry) !== String(normalized[index]?.userId || ""))
 ) {
  guild.applications = normalized
 }
 return guild.applications
}

function removeGuildApplicationsForUser(userId) {
 const safeUserId = asGuildId(userId)
 if (!safeUserId) return
 let dirty = false
 for (const guild of getGuildList()) {
  const apps = normalizeGuildApplications(guild)
  const next = apps.filter((entry) => asGuildId(entry?.userId) !== safeUserId)
  if (next.length !== apps.length) {
   guild.applications = next
   dirty = true
  }
 }
 if (dirty) saveGuilds()
}

function addGuildApplication(guildId, applicantId) {
 const safeGuildId = asGuildId(guildId)
 const safeApplicantId = asGuildId(applicantId)
 if (!safeGuildId || !safeApplicantId) return { error: "Paramètres invalides." }

 const guild = getGuild(safeGuildId)
 if (!guild) return { error: "Guilde introuvable." }

 const user = getUser(safeApplicantId)
 if (!user) return { error: "Joueur introuvable." }
 if (user.guildId) return { error: "Tu es déjà dans une guilde." }
 recordGuildApplication(user)
 save(safeApplicantId)

 const apps = normalizeGuildApplications(guild)
 if (apps.some((entry) => asGuildId(entry?.userId) === safeApplicantId)) {
  return { error: "Tu as déjà postulé dans cette guilde." }
 }

 guild.applications = [
  ...apps,
  { userId: safeApplicantId, createdAt: new Date().toISOString() }
 ]
 saveGuilds()

  const applicantLabel = `Joueur #${safeApplicantId.slice(-4)}`
  const leadershipIds = [asGuildId(guild.leaderId), ...(guild.officerIds || []).map((id) => asGuildId(id))]
  const seen = new Set()
  for (const reviewerId of leadershipIds) {
   if (!reviewerId || reviewerId === safeApplicantId || seen.has(reviewerId)) continue
   seen.add(reviewerId)
   enqueueWebRewardToast(reviewerId, {
    type: "guild",
    tone: "event",
    title: "Nouvelle candidature de guilde",
    subtitle: `${applicantLabel} postule dans ${String(guild.name || "la guilde")}`,
    description: `${Number(guild.applications.length || 0)} candidature(s) en attente`,
    rewardText: "",
    chipLabel: "Guilde"
   })
  }

 return { ok: true }
}

function respondGuildApplication(guildId, reviewerId, applicantId, accept = false) {
 const safeGuildId = asGuildId(guildId)
 const safeReviewerId = asGuildId(reviewerId)
 const safeApplicantId = asGuildId(applicantId)
 if (!safeGuildId || !safeReviewerId || !safeApplicantId) return { error: "Paramètres invalides." }

 const guild = getGuild(safeGuildId)
 if (!guild) return { error: "Guilde introuvable." }

 const rank = getGuildRank(guild.id, safeReviewerId)
 if (rank !== "meneur" && rank !== "officier") {
  return { error: "Seuls le meneur et les officiers peuvent traiter les candidatures." }
 }
 const reviewer = getUser(safeReviewerId)
 if (reviewer) {
  recordGuildApplicationReview(reviewer)
  save(safeReviewerId)
 }

 const apps = normalizeGuildApplications(guild)
 const exists = apps.some((entry) => asGuildId(entry?.userId) === safeApplicantId)
 if (!exists) return { error: "Candidature introuvable." }

 guild.applications = apps.filter((entry) => asGuildId(entry?.userId) !== safeApplicantId)
 saveGuilds()

 if (!accept) return { ok: true, action: "rejected" }

 const result = joinGuild(safeApplicantId, safeGuildId)
 if (result?.error) return { error: result.error }
 const recruiter = getUser(safeReviewerId)
 if (recruiter) {
  recordGuildRecruitment(recruiter)
  save(safeReviewerId)
 }
 removeGuildApplicationsForUser(safeApplicantId)
 return { ok: true, action: "accepted", guild: result.guild }
}

function detachUserFromGuildsForLocal(userId) {
 const safeUserId = asGuildId(userId)
 if (!safeUserId) return

 const current = getUserGuild(safeUserId)
 if (!current) return

 if (String(current.leaderId || "") === safeUserId) {
  const replacement = (current.memberIds || []).find((id) => String(id) !== safeUserId)
  if (replacement) {
   transferLeader(current.id, safeUserId, String(replacement))
   leaveGuild(safeUserId)
  } else {
   disbandGuild(current.id, safeUserId)
  }
  return
 }

 leaveGuild(safeUserId)
}

function switchLocalGuildRole(userId, mode) {
 const safeUserId = asGuildId(userId)
 const safeMode = String(mode || "").trim().toLowerCase()
 if (!safeUserId) return { error: "Utilisateur invalide." }

 const guilds = computeGuildSummary({ sort: "level" }).map((row) => getGuild(row.id)).filter(Boolean)
 if (guilds.length <= 0) return { error: "Aucune guilde disponible." }

 const pickGuild = (index) => guilds[Math.max(0, Math.min(guilds.length - 1, index))]
 const user = getUser(safeUserId)
 if (!user) return { error: "Utilisateur introuvable." }

 if (safeMode === "none" || safeMode === "sans_guilde") {
  detachUserFromGuildsForLocal(safeUserId)
  removeGuildApplicationsForUser(safeUserId)
  return { ok: true, mode: "none" }
 }

 let targetGuild = pickGuild(0)
 if (safeMode === "officer" || safeMode === "officier") targetGuild = pickGuild(1)
 if (safeMode === "member" || safeMode === "membre") targetGuild = pickGuild(2)
 if (!targetGuild) return { error: "Guilde cible introuvable." }

 detachUserFromGuildsForLocal(safeUserId)
 if (!Array.isArray(targetGuild.memberIds)) targetGuild.memberIds = []
 if (!Array.isArray(targetGuild.officerIds)) targetGuild.officerIds = []

 if (!targetGuild.memberIds.includes(safeUserId)) {
  if (targetGuild.memberIds.length >= MAX_MEMBERS) {
   const removable = targetGuild.memberIds.find((id) => String(id) !== String(targetGuild.leaderId || ""))
   if (removable) {
    targetGuild.memberIds = targetGuild.memberIds.filter((id) => String(id) !== String(removable))
    targetGuild.officerIds = targetGuild.officerIds.filter((id) => String(id) !== String(removable))
    const removedUser = getUser(removable)
    if (removedUser?.guildId && String(removedUser.guildId) === String(targetGuild.id)) {
     delete removedUser.guildId
     save(removable)
    }
   } else {
    return { error: "La guilde est pleine." }
   }
  }
  targetGuild.memberIds.push(safeUserId)
 }

 user.guildId = String(targetGuild.id)
 save(safeUserId)

 if (safeMode === "leader" || safeMode === "meneur") {
  targetGuild.leaderId = safeUserId
  targetGuild.officerIds = targetGuild.officerIds.filter((id) => String(id) !== safeUserId)
 } else {
  if (String(targetGuild.leaderId || "") === safeUserId) {
   let newLeader = targetGuild.memberIds.find((id) => String(id) !== safeUserId) || null
   if (!newLeader) {
    newLeader = getLocalDemoUserId(1)
    if (!targetGuild.memberIds.includes(newLeader)) targetGuild.memberIds.push(newLeader)
    const fallbackLeader = getUser(newLeader)
    fallbackLeader.guildId = String(targetGuild.id)
    save(newLeader)
   }
   targetGuild.leaderId = String(newLeader)
  }

  if (safeMode === "officer" || safeMode === "officier") {
   if (!targetGuild.officerIds.includes(safeUserId)) {
    const leadersAndSelf = new Set([String(targetGuild.leaderId || ""), safeUserId])
    const filtered = (targetGuild.officerIds || []).filter((id) => !leadersAndSelf.has(String(id)))
    targetGuild.officerIds = [...filtered, safeUserId].slice(0, 3)
   }
  } else {
   targetGuild.officerIds = (targetGuild.officerIds || []).filter((id) => String(id) !== safeUserId)
  }
 }

 removeGuildApplicationsForUser(safeUserId)
 saveGuilds()
 return { ok: true, mode: safeMode, guildId: String(targetGuild.id) }
}

function toGuildBonusRows(bonusMap = {}) {
 return [
  { key: "kamasBonus", label: "Kamas bonus", unit: "%" },
  { key: "fusionCritBonus", label: "Fusion critique", unit: "%" },
  { key: "fusionDoubleBonus", label: "Fusion double", unit: "%" },
  { key: "fusionTripleBonus", label: "Fusion triple", unit: "%" },
  { key: "luckyPackBonus", label: "Lucky pack", unit: "%" },
  { key: "xpBonus", label: "XP Battle Pass", unit: "%" },
  { key: "playerXpBonus", label: "XP joueur", unit: "%" },
  { key: "shopDiscount", label: "Réduction KrosmoShop", unit: "%" },
  { key: "dailyBonusPacks", label: "Packs daily bonus", unit: "" },
  { key: "doubleDailyBonus", label: "Chance double daily", unit: "%" }
 ].map((row) => {
  const value = Number(bonusMap?.[row.key] || 0)
  return {
   ...row,
   value,
   active: value > 0
  }
 })
}

async function buildGuildStatePayload(userId) {
 const safeUserId = asGuildId(userId)
 const me = getUser(safeUserId)
 if (!me) return null

 const meDiscord = await resolveDiscordUser(safeUserId)
 const currentGuild = getUserGuild(safeUserId)

 const base = {
  connected: true,
  me: {
   id: safeUserId,
   discord: meDiscord,
   kamas: Number(me.kamas || 0),
   level: Number(me.progression?.level || 1),
   title: String(me.title || "Nouveau")
  },
  inGuild: Boolean(currentGuild),
  guild: null,
  quests: null,
  guildDirectory: [],
  pendingApplications: []
 }

 const allGuilds = computeGuildSummary({ sort: "level" })
 const userPendingGuildIds = new Set()

 for (const item of allGuilds) {
  const guild = getGuild(item.id)
  if (!guild) continue
  const apps = normalizeGuildApplications(guild)
  if (apps.some((entry) => asGuildId(entry?.userId) === safeUserId)) {
   userPendingGuildIds.add(String(guild.id))
  }
 }

 base.guildDirectory = allGuilds.slice(0, 80).map((row) => ({
  id: String(row.id),
  name: String(row.name || "Guilde"),
  emoji: String(row.emoji || "🛡️"),
  level: Number(row.level || 1),
  members: Number(row.members || 0),
  maxMembers: MAX_MEMBERS,
  hasApplied: userPendingGuildIds.has(String(row.id)),
  canApply: Number(row.members || 0) < MAX_MEMBERS
 }))

 base.pendingApplications = base.guildDirectory.filter((row) => row.hasApplied).map((row) => ({
  guildId: row.id,
  guildName: row.name,
  createdAt: null
 }))

 if (!currentGuild) return base

 const rank = getGuildRank(currentGuild.id, safeUserId)
 const isLeader = rank === "meneur"
 const isOfficer = rank === "officier"
 const canManage = isLeader || isOfficer
 const profile = await computeGuildProfile(currentGuild.id)
 const xpCurrent = Number(currentGuild.xp || 0)
 const xpNeed = Math.max(1, Number(xpRequired(Number(currentGuild.level || 1)) || 1))
 const bonusMap = getGuildBonuses(Number(currentGuild.level || 1))
 const applications = normalizeGuildApplications(currentGuild)
 const applicationsWithUsers = await Promise.all(applications.map(async (entry) => {
  const applicantId = asGuildId(entry?.userId)
  if (!applicantId) return null
  const user = loadUser(applicantId)
  if (!user || user.guildId) return null
  const discord = await resolveDiscordUser(applicantId)
  return {
   userId: applicantId,
   createdAt: entry?.createdAt || null,
   discord,
   level: Number(user.progression?.level || 1),
   title: String(user.title || "Nouveau"),
   kamas: Number(user.kamas || 0)
  }
 }))

 const questState = buildQuestStatePayload(safeUserId)
 base.quests = questState?.guild || null
 base.guild = {
  id: String(currentGuild.id),
  name: String(currentGuild.name || "Guilde"),
  emoji: String(currentGuild.emoji || "🛡️"),
  rank,
  rankLabel: isLeader ? "Meneur" : (isOfficer ? "Officier" : "Membre"),
  canManage,
  canLead: isLeader,
  level: Number(currentGuild.level || 1),
  xp: xpCurrent,
  xpRequired: xpNeed,
  xpPct: Math.max(0, Math.min(100, Math.round((xpCurrent / xpNeed) * 100))),
  createdAt: currentGuild.createdAt || null,
  memberCount: Array.isArray(currentGuild.memberIds) ? currentGuild.memberIds.length : 0,
  maxMembers: MAX_MEMBERS,
  stats: {
   questsCompleted: Number(currentGuild.stats?.questsCompleted || 0),
   totalXpEarned: Number(currentGuild.stats?.totalXpEarned || 0)
  },
  bonuses: toGuildBonusRows(bonusMap),
  members: Array.isArray(profile?.members) ? profile.members : [],
  applications: applicationsWithUsers.filter(Boolean)
 }

 return base
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
  packs: Number(user.packs || 0),
  cardsCount: Object.values(user.cards || {}).reduce((a, b) => a + b, 0),
  uniqueCards: Object.keys(user.cards || {}).length,
  fragmentsCount: Array.isArray(user.fragments) ? user.fragments.length : 0
 }
}

function buildDailyStatePayload(user) {
 const now = Date.now()
 const nextClaimAt = Number(getNextMidnightParisMs() || 0)
 const canClaim = Boolean(canClaimDaily(user))
 const remainingMs = canClaim ? 0 : Math.max(0, nextClaimAt - now)

 return {
  canClaim,
  nextClaimAt,
  remainingMs,
  streak: Number(user?.daily?.streak || 0),
  lastDaily: Number(user?.daily?.lastDaily || 0)
 }
}

function buildInventoryPayload(userId) {
 const user = getUser(userId)
 const cards = getCards()
 const sets = getSets()
 const cardsById = new Map(cards.map((c) => [String(c.id), c]))
 const setNames = getCardSetNameMap(sets)
 const sellMultiplier = getSeasonSellMultiplier()
 const sellBonusPercent = getSellBonusPercent(sellMultiplier)

 const cardItems = Object.entries(user.cards || {})
  .map(([cardId, qty]) => {
   const card = cardsById.get(String(cardId)) || getSecretCardById(cardId)
   const setId = card?.set || "unknown"
   const rarity = String(card?.rarity || "C").toUpperCase()
   const isSecret = isSecretCard(card)
   const baseSellPrice = isSecret ? 0 : Number(SELL_PRICE[rarity] || 1)
   return {
    cardId: String(cardId),
    qty: Number(qty || 0),
    cardName: card?.name || `Carte ${cardId}`,
    rarity,
    set: setId,
    setName: setNames.get(String(setId)) || String(setId),
    imageUrl: card?.image && card?.set
     ? `/assets/cards/${encodeURIComponent(String(card.set))}/${encodeURIComponent(String(card.image))}`
     : null,
    sellPrice: isSecret ? 0 : computeSellPrice(baseSellPrice, sellMultiplier),
    sellBonusPercent
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

const achievementProgressEvalCache = new Map()

function clampProgress(value, min, max) {
 return Math.min(max, Math.max(min, value))
}

function trimOuterParens(expression) {
 let text = String(expression || "").trim()
 while (text.startsWith("(") && text.endsWith(")")) {
  let depth = 0
  let valid = true
  for (let i = 0; i < text.length; i++) {
   const ch = text[i]
   if (ch === "(") depth++
   else if (ch === ")") depth--
   if (depth === 0 && i < text.length - 1) {
    valid = false
    break
   }
   if (depth < 0) {
    valid = false
    break
   }
  }
  if (!valid || depth !== 0) break
  text = text.slice(1, -1).trim()
 }
 return text
}

function splitTopLevelAnd(expression) {
 const source = String(expression || "")
 const parts = []
 let depth = 0
 let quote = ""
 let chunkStart = 0
 for (let i = 0; i < source.length; i++) {
  const ch = source[i]
  const next = source[i + 1]
  if (quote) {
   if (ch === "\\" && i + 1 < source.length) {
    i++
    continue
   }
   if (ch === quote) quote = ""
   continue
  }
  if (ch === "'" || ch === '"' || ch === "`") {
   quote = ch
   continue
  }
  if (ch === "(" || ch === "[" || ch === "{") depth++
  else if (ch === ")" || ch === "]" || ch === "}") depth = Math.max(0, depth - 1)
  if (depth === 0 && ch === "&" && next === "&") {
   parts.push(source.slice(chunkStart, i).trim())
   chunkStart = i + 2
   i++
  }
 }
 const tail = source.slice(chunkStart).trim()
 if (tail) parts.push(tail)
 return parts.filter(Boolean)
}

function findTopLevelComparison(expression) {
 const source = String(expression || "")
 let depth = 0
 let quote = ""

 for (let i = 0; i < source.length; i++) {
  const ch = source[i]
  const next = source[i + 1]
  const next2 = source[i + 2]

  if (quote) {
   if (ch === "\\" && i + 1 < source.length) {
    i++
    continue
   }
   if (ch === quote) quote = ""
   continue
  }

  if (ch === "'" || ch === "\"" || ch === "`") {
   quote = ch
   continue
  }

  if (ch === "(" || ch === "[" || ch === "{") {
   depth++
   continue
  }
  if (ch === ")" || ch === "]" || ch === "}") {
   depth = Math.max(0, depth - 1)
   continue
  }
  if (depth !== 0) continue

  if (ch === "=" && next === ">" ) {
   i++
   continue
  }

  if (ch === "=" && next === "=" && next2 === "=") {
   return {
    left: source.slice(0, i).trim(),
    operator: "===",
    right: source.slice(i + 3).trim()
   }
  }
  if (ch === ">" && next === "=") {
   return {
    left: source.slice(0, i).trim(),
    operator: ">=",
    right: source.slice(i + 2).trim()
   }
  }
  if (ch === "<" && next === "=") {
   return {
    left: source.slice(0, i).trim(),
    operator: "<=",
    right: source.slice(i + 2).trim()
   }
  }
  if (ch === "=" && next === "=") {
   return {
    left: source.slice(0, i).trim(),
    operator: "==",
    right: source.slice(i + 2).trim()
   }
  }
  if (ch === ">" || ch === "<") {
   return {
    left: source.slice(0, i).trim(),
    operator: ch,
    right: source.slice(i + 1).trim()
   }
  }
 }

 return null
}

function extractConditionExpression(conditionFn) {
 if (typeof conditionFn !== "function") return ""
 const src = String(conditionFn || "").trim()
 const arrow = src.indexOf("=>")
 if (arrow < 0) return ""
 const body = src.slice(arrow + 2).trim()
 if (!body) return ""
 if (body.startsWith("{")) {
  const returnMatch = body.match(/return\s+([\s\S]*?);?\s*}/)
  return returnMatch ? trimOuterParens(returnMatch[1]) : ""
 }
 return trimOuterParens(body.replace(/;$/, ""))
}

function countSecretUnlockedForProgress(user) {
 const unlocked = new Set((user?.achievements || []).map((id) => String(id)))
 if (unlocked.size <= 0) return 0
 let count = 0
 for (const id of unlocked) {
  if (achievementRegistry?.[id]?.secret) count++
 }
 return count
}

function countNormalShinyPairsForProgress(user) {
 const normal = user?.cards || {}
 const shiny = user?.shinyCards || {}
 let count = 0
 for (const id of Object.keys(shiny)) {
  if (Number(shiny?.[id] || 0) > 0 && Number(normal?.[id] || 0) > 0) count++
 }
 return count
}

function longestConsecutiveOwnedIdsForProgress(user) {
 const ids = Object.keys(user?.cards || {})
  .map((id) => Number(id))
  .filter((id) => Number.isFinite(id) && Number(user?.cards?.[String(id)] || 0) > 0)
  .sort((a, b) => a - b)
 if (ids.length <= 0) return 0
 let best = 1
 let current = 1
 for (let i = 1; i < ids.length; i++) {
  if (ids[i] === ids[i - 1] + 1) current++
  else if (ids[i] !== ids[i - 1]) current = 1
  if (current > best) best = current
 }
 return best
}

function hasRainbowSetForProgress(user) {
 const wanted = ["C", "U", "R", "SR", "HR", "UR", "S", "SSR"]
 const cardsById = new Map(getCards().map((card) => [String(card?.id || ""), card]))
 const sets = {}
 for (const cardId of Object.keys(user?.cards || {})) {
  if (Number(user?.cards?.[cardId] || 0) <= 0) continue
  const card = cardsById.get(String(cardId))
  if (!card?.set || !card?.rarity) continue
  if (!sets[card.set]) sets[card.set] = new Set()
  sets[card.set].add(String(card.rarity).toUpperCase())
 }
 return Object.values(sets).some((rarities) => wanted.every((rarity) => rarities.has(rarity)))
}

function guildDaysFromJoinDateForProgress(user) {
 const joinedAt = Number(user?.stats?.guildJoinedAt || 0)
 if (joinedAt <= 0) return 0
 return Math.floor((Date.now() - joinedAt) / 86400000)
}

function evalAchievementProgressExpression(user, expression) {
 const safeExpr = String(expression || "").trim()
 if (!safeExpr) return null
 let evaluator = achievementProgressEvalCache.get(safeExpr)
 if (!evaluator) {
  try {
   evaluator = new Function(
    "u",
    "n",
    "arrCount",
    "mapCount",
    "countSecretUnlocked",
    "countNormalShinyPairs",
    "longestConsecutiveOwnedIds",
    "hasRainbowSet",
    "guildDaysFromJoinDate",
    `return (${safeExpr})`
   )
   achievementProgressEvalCache.set(safeExpr, evaluator)
  } catch (_) {
   return null
  }
 }
 try {
  return evaluator(
   user,
   (targetUser, key) => Number(targetUser?.stats?.[key] || 0),
   (value) => (Array.isArray(value) ? value.length : 0),
   (value) => (value && typeof value === "object" ? Object.keys(value).length : 0),
   countSecretUnlockedForProgress,
   countNormalShinyPairsForProgress,
   longestConsecutiveOwnedIdsForProgress,
   hasRainbowSetForProgress,
   guildDaysFromJoinDateForProgress
  )
 } catch (_) {
  return null
 }
}

function parseProgressClause(user, clause, unlocked) {
 const text = trimOuterParens(clause)
 if (!text) return null

 const comparison = findTopLevelComparison(text)
 if (comparison) {
  const leftExpr = trimOuterParens(comparison.left)
  const operator = String(comparison.operator || "")
  const rightExpr = trimOuterParens(comparison.right)
  if (!leftExpr || !rightExpr) return null

  const isBooleanCompare = (operator === "===" || operator === "==") && /^(true|false)$/i.test(rightExpr)
  if (isBooleanCompare) {
   const expected = String(rightExpr).toLowerCase() === "true"
   const raw = evalAchievementProgressExpression(user, leftExpr)
   const done = Boolean(raw) === expected
   return {
    numeric: false,
    done,
    current: done ? 1 : 0,
    goal: 1
   }
  }

  const leftRaw = evalAchievementProgressExpression(user, leftExpr)
  const rightRaw = evalAchievementProgressExpression(user, rightExpr)

  const leftNum = Number(leftRaw)
  const rightNum = Number(rightRaw)
  const leftIsNum = Number.isFinite(leftNum)
  const rightIsNum = Number.isFinite(rightNum)

  if (leftIsNum && rightIsNum) {
   let compareLeft = leftNum
   let compareRight = rightNum
   let currentValue = leftNum
   let goalValue = Math.abs(rightNum)

   if (rightExpr.includes("86400000")) {
    compareLeft = Math.floor(compareLeft / 86400000)
    compareRight = Math.floor(compareRight / 86400000)
    currentValue = compareLeft
    goalValue = Math.abs(compareRight)
   }

   goalValue = Math.max(1, goalValue)
   let done = false
   if (operator === ">=") done = compareLeft >= compareRight
   else if (operator === ">") done = compareLeft > compareRight
   else if (operator === "<=") done = compareLeft <= compareRight
   else if (operator === "<") done = compareLeft < compareRight
   else done = compareLeft === compareRight

   let progressCurrent = 0
   if (operator === ">=" || operator === ">") {
    progressCurrent = clampProgress(Math.floor(currentValue), 0, goalValue)
    if (done) progressCurrent = goalValue
   } else if (operator === "===" || operator === "==") {
    progressCurrent = done ? goalValue : 0
   } else if (operator === "<=" || operator === "<") {
    const delta = Math.max(0, Math.floor(compareRight - currentValue))
    progressCurrent = goalValue - clampProgress(delta, 0, goalValue)
    if (done) progressCurrent = goalValue
   }

   return {
    numeric: true,
    done,
    current: progressCurrent,
    goal: goalValue
   }
  }

  const done = Boolean(evalAchievementProgressExpression(user, `${leftExpr} ${operator} ${rightExpr}`))
  return {
   numeric: false,
   done,
   current: done ? 1 : 0,
   goal: 1
  }
 }

 const raw = evalAchievementProgressExpression(user, text)
 if (typeof raw === "boolean") {
  const done = Boolean(raw)
  return {
   numeric: false,
   done,
   current: done ? 1 : 0,
   goal: 1
  }
 }

 if (Number.isFinite(Number(raw))) {
  const value = Math.max(0, Math.floor(Number(raw)))
  const done = unlocked || value > 0
  return {
   numeric: true,
   done,
   current: Math.min(value, 1),
   goal: 1
  }
 }

 return null
}

function computeAchievementProgress(user, achievement, unlocked) {
 const fallbackDone = Boolean(unlocked)
 const fallback = {
  current: fallbackDone ? 1 : 0,
  goal: 1,
  percent: fallbackDone ? 100 : 0
 }

 if (!achievement || typeof achievement.condition !== "function") return fallback
 const expression = extractConditionExpression(achievement.condition)
 if (!expression) return fallback

 const clauses = splitTopLevelAnd(expression)
 if (clauses.length <= 0) return fallback

 const parsed = clauses
  .map((clause) => parseProgressClause(user, clause, unlocked))
  .filter(Boolean)

 if (parsed.length <= 0) return fallback

 const numeric = parsed.filter((entry) => entry.numeric && entry.goal > 1)
 const active = numeric.length > 0 ? numeric : parsed

 const goal = Math.max(1, active.reduce((sum, entry) => sum + Math.max(1, Math.floor(entry.goal || 1)), 0))
 let current = active.reduce((sum, entry) => {
  const entryGoal = Math.max(1, Math.floor(entry.goal || 1))
  const entryCurrent = clampProgress(Math.floor(entry.current || 0), 0, entryGoal)
  return sum + entryCurrent
 }, 0)
 if (fallbackDone) current = goal

 const percent = clampProgress(Math.round((current / goal) * 100), 0, 100)
 return { current, goal, percent }
}

function createWebApp() {
 const app = express()
 app.disable("x-powered-by")

 app.use((req, res, next) => {
  const proto = String(req.headers["x-forwarded-proto"] || "")
  const host = String(req.headers.host || "")
  const isProd = String(process.env.NODE_ENV || "").toLowerCase() === "production"
  const isLocal = host.startsWith("localhost") || host.startsWith("127.0.0.1")
  const pathName = String(req.path || "")
  const isHealthPath = pathName === "/health"

  // Always allow health checks without redirect to avoid platform restart loops.
  if (isHealthPath) {
   return next()
  }

  if (isProd && !isLocal && proto && !proto.includes("https")) {
   return res.redirect(301, `https://${host}${req.originalUrl}`)
  }

  if (proto.includes("https")) {
   res.setHeader("Strict-Transport-Security", "max-age=31536000; includeSubDomains; preload")
  }

  return next()
 })

 app.use(express.json({ limit: "8mb" }))
 app.use(express.urlencoded({ extended: false, limit: "8mb" }))

 /* Security headers (helmet-like) */
 app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff")
  res.setHeader("X-Frame-Options", "DENY")
  res.setHeader("X-XSS-Protection", "0")
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin")
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
  return next()
 })

 /* Rate limiter API (100 req/min par IP) */
 app.use("/api/", createRateLimiter({ windowMs: 60000, max: 100 }))

 /* Rate limiter strict sur POST march? (20 req/min par IP) */
 const marketLimiter = createRateLimiter({ windowMs: 60000, max: 20 })
 app.use("/api/market/buy", marketLimiter)
 app.use("/api/market/sell-card", marketLimiter)
 app.use("/api/market/sell-fragment", marketLimiter)
 app.use("/api/market/remove", marketLimiter)
 const gameLimiter = createRateLimiter({ windowMs: 60000, max: 40 })
 app.use("/api/game/", gameLimiter)
 app.use("/api/events/", gameLimiter)

 /* CSRF : POST API doit être application/json */
 app.use("/api/", (req, res, next) => {
  if (req.method === "POST") {
   const ct = String(req.headers["content-type"] || "")
   if (!ct.includes("application/json")) {
    return res.status(415).json({ error: "Content-Type application/json requis." })
   }
  }
  return next()
 })

 app.use((req, res, next) => {
  if (shouldBypassBanGate(req)) return next()

  const session = resolveSession(req)
  if (!session || !isBannedSession(session)) return next()

  if (String(req.path || "").startsWith("/api/")) {
   return sendBanApiResponse(res)
  }

  return sendBanPage(res)
 })

 /* Health check endpoint */
 app.get("/health", (req, res) => {
  const uptime = process.uptime()
  const mem = process.memoryUsage()

  let userCount = 0
  try {
   userCount = dbCountUsers()
  } catch (_) {}

  const payload = {
   status: "ok",
   uptime: Math.floor(uptime),
   uptimeHuman: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m`,
   memory: {
    rss: Math.round(mem.rss / 1024 / 1024) + " MB",
    heap: Math.round(mem.heapUsed / 1024 / 1024) + " MB"
   },
   users: userCount,
   cacheEntries: apiCache.size(),
   timestamp: new Date().toISOString()
  }

  if (process.env.RAILWAY_SERVICE_ID || process.env.HEALTH_LOGS === "1") {
   webLog.info("Healthcheck repondu", {
    method: req.method,
    path: req.path,
    status: payload.status,
    uptimeSec: payload.uptime
   })
  }

  res.json(payload)
 })

 app.use(express.static(PUBLIC_DIR, { index: false }))
 app.get("/css/style.css", (req, res) => res.sendFile(path.join(PUBLIC_DIR, "Style.css")))
 app.use("/assets/cards", express.static(CARD_IMAGES_RUNTIME_DIR, { index: false, fallthrough: true }))
 app.use("/assets/cards", express.static(CARD_IMAGES_REPO_DIR, { index: false, fallthrough: true }))

app.get("/api/stats", (req, res) => {
 try {
  const stats = apiCache.getOrCompute("global:stats", () => computeGlobalStats(), 60000)
  res.json(stats)
 } catch (e) {
  console.error("[WEB] /api/stats:", e)
  res.status(500).json({ error: "Erreur serveur" })
 }
})

app.get("/api/battlepass/season", (req, res) => {
 try {
  const current = ensureCurrentSeason()
  const tpl = getSeasonTemplate(current.activeSeason)
  const now = new Date()
  const end = current?.endDate ? new Date(`${current.endDate}T23:59:59.999Z`) : null
  const daysRemaining = end ? Math.max(0, Math.ceil((end.getTime() - now.getTime()) / 86400000)) : null

  res.json({
   id: String(current.activeSeason || ""),
   name: String(tpl?.name || current.activeSeason || "Saison"),
   subtitle: String(tpl?.subtitle || ""),
   bonusDescription: String(tpl?.passiveBonus?.description || ""),
   emoji: String(tpl?.emoji || "🎟�?"),
   startDate: current.startDate || null,
   endDate: current.endDate || null,
   daysRemaining
  })
 } catch (e) {
  console.error("[WEB] /api/battlepass/season:", e)
  res.status(500).json({ error: "Erreur serveur" })
 }
})

app.get("/api/battlepass/me", async (req, res) => {
 try {
  const session = requireSession(req, res)
  if (!session) return

  const overview = getBattlePassOverview(session.userId)
  const seasonLevels = Math.max(1, Number(overview?.seasonTemplate?.totalLevels || 40))
  const rewardsView = getBattlePassRewardsView(session.userId, 1, seasonLevels)
  const xpInLevel = Math.max(0, Number(overview?.xpInLevel || 0))
  const xpToNextLevel = Math.max(0, Number(overview?.xpToNextLevel || 0))
  const xpLevelMax = Math.max(1, xpInLevel + xpToNextLevel)
  const discord = await resolveDiscordUser(session.userId)

  res.json({
   me: buildMePayload(session.userId),
   discord,
   season: {
    id: String(overview?.currentSeason?.activeSeason || ""),
    name: String(overview?.seasonTemplate?.name || overview?.currentSeason?.activeSeason || "Saison"),
    subtitle: String(overview?.seasonTemplate?.subtitle || ""),
    bonusDescription: String(overview?.seasonTemplate?.passiveBonus?.description || ""),
    emoji: String(overview?.seasonTemplate?.emoji || "🎟�?"),
    startDate: overview?.currentSeason?.startDate || null,
    endDate: overview?.currentSeason?.endDate || null,
    premiumPrice: Number(overview?.seasonTemplate?.premiumPrice || 18000),
    totalLevels: seasonLevels
   },
   progress: {
    totalXP: Number(overview?.progress?.totalXP || 0),
    currentLevel: Number(overview?.progress?.currentLevel || 1),
    hasPremium: Boolean(overview?.progress?.hasPremium),
    xpInLevel,
    xpToNextLevel,
    xpLevelMax,
    xpPercent: Math.min(100, Math.round((xpInLevel / xpLevelMax) * 100)),
    claimableCount: Number(overview?.claimableCount || 0)
   },
   stats: overview?.progress?.stats || {},
   rewards: (rewardsView?.rows || []).map((row) => ({
    level: Number(row.level || 0),
    freeRewards: Array.isArray(row.freeRewards) ? row.freeRewards : [],
    premiumRewards: Array.isArray(row.premiumRewards) ? row.premiumRewards : [],
    claimedFree: Boolean(row.claimedFree),
    claimedPremium: Boolean(row.claimedPremium),
    claimedFreeAt: row?.claimedFreeAt || null,
    claimedPremiumAt: row?.claimedPremiumAt || null
   }))
  })
 } catch (e) {
  console.error("[WEB] /api/battlepass/me:", e)
  res.status(500).json({ error: "Erreur serveur" })
 }
})

app.post("/api/battlepass/claim", async (req, res) => {
 try {
  const session = requireSession(req, res)
  if (!session) return

  const result = await claimAllBattlePassRewards(session.userId)
  if (!result?.ok) return res.status(400).json({ error: result?.error || "Impossible de reclamer." })

  const user = getUser(session.userId)
  const unlocked = user ? achievementCheck(user, "progression") : []
  if (user) save(session.userId)

  const overview = getBattlePassOverview(session.userId)
  res.json({
   ok: true,
   result,
   claimableCount: Number(overview?.claimableCount || 0),
   currentLevel: Number(overview?.progress?.currentLevel || 1),
   totalXP: Number(overview?.progress?.totalXP || 0),
   unlockedAchievements: countUnlockedAchievements(unlocked)
  })
 } catch (e) {
  console.error("[WEB] /api/battlepass/claim:", e)
  res.status(500).json({ error: "Erreur serveur" })
 }
})

app.post("/api/battlepass/claim-level", async (req, res) => {
 try {
  const session = requireSession(req, res)
  if (!session) return

  const level = Math.max(1, Math.floor(Number(req.body?.level || 0)))
  if (!Number.isFinite(level) || level <= 0) {
   return res.status(400).json({ error: "Palier invalide." })
  }

  const result = await claimBattlePassLevelReward(session.userId, level)
  if (!result?.ok) return res.status(400).json({ error: result?.error || "Impossible de reclamer ce palier." })

  const user = getUser(session.userId)
  const unlocked = user ? achievementCheck(user, "progression") : []
  if (user) save(session.userId)

  const overview = getBattlePassOverview(session.userId)
  res.json({
   ok: true,
   level,
   result,
   claimableCount: Number(overview?.claimableCount || 0),
   currentLevel: Number(overview?.progress?.currentLevel || 1),
   totalXP: Number(overview?.progress?.totalXP || 0),
   unlockedAchievements: countUnlockedAchievements(unlocked)
  })
 } catch (e) {
  console.error("[WEB] /api/battlepass/claim-level:", e)
  res.status(500).json({ error: "Erreur serveur" })
 }
})

app.post("/api/battlepass/premium", async (req, res) => {
 try {
  const session = requireSession(req, res)
  if (!session) return

  const result = await buyPremium(session.userId)
  if (!result?.ok) return res.status(400).json({ error: result?.error || "Achat premium impossible." })

  const user = getUser(session.userId)
  const unlocked = user ? achievementCheck(user, "economy") : []
  if (user) save(session.userId)

  const overview = getBattlePassOverview(session.userId)
  res.json({
   ok: true,
   result,
   hasPremium: Boolean(overview?.progress?.hasPremium),
   kamas: Number(getUser(session.userId)?.kamas || 0),
   unlockedAchievements: countUnlockedAchievements(unlocked)
  })
 } catch (e) {
  console.error("[WEB] /api/battlepass/premium:", e)
  res.status(500).json({ error: "Erreur serveur" })
 }
})

app.get("/api/quests/state", (req, res) => {
 try {
  const session = resolveSession(req)
  if (!session) {
   return res.json(buildQuestPreviewPayload())
  }

  const user = getUser(session.userId)
  const prevDailyId = String(user?.quests?.daily?.dayId || "")
  const prevWeeklyId = String(user?.quests?.weekly?.weekId || "")

  const payload = buildQuestStatePayload(session.userId)

  const nextDailyId = String(user?.quests?.daily?.dayId || "")
  const nextWeeklyId = String(user?.quests?.weekly?.weekId || "")
  if (prevDailyId !== nextDailyId || prevWeeklyId !== nextWeeklyId) {
   save(session.userId)
  }

  res.json(payload)
 } catch (e) {
  console.error("[WEB] /api/quests/state:", e)
  res.status(500).json({ error: "Erreur serveur" })
 }
})

app.post("/api/quests/claim", async (req, res) => {
 try {
  const session = requireSession(req, res)
  if (!session) return

  const scope = normalizeQuestScope(req.body?.scope)
  const type = normalizeQuestType(req.body?.type)
  const questId = String(req.body?.questId || "").trim()

  if (scope === "guild") {
   const guild = getUserGuild(session.userId)
   if (!guild) return res.status(400).json({ error: "Tu n'es dans aucune guilde." })

   const result = claimGuildQuests(guild.id, session.userId, type, questId)
   if (result?.error) return res.status(400).json({ error: String(result.error) })

   const user = getUser(session.userId)
   if (user) {
    if (!user.stats || typeof user.stats !== "object") user.stats = {}
    user.stats.guildQuestsClaimed = Number(user.stats.guildQuestsClaimed || 0) + Number(result.claimed || 0)
    user.stats.guildXpContributed = Number(user.stats.guildXpContributed || 0) + Number(result.totalXP || 0)
    if (result.isPerfect) {
     user.stats.guildPerfectWeeks = Number(user.stats.guildPerfectWeeks || 0) + 1
    }
    user.stats.guildMaxLevel = Math.max(Number(user.stats.guildMaxLevel || 0), Number(guild.level || 0))
    if (Number(user.stats.guildQuestsClaimed || 0) <= Number(result.claimed || 0)) {
     user.stats.guildFirstClaim = 1
    }
   }

   if (result?.levelResult?.leveled) {
    for (const memberId of guild.memberIds || []) {
     const member = getUser(memberId)
     if (!member) continue
     if (!member.stats || typeof member.stats !== "object") member.stats = {}
     member.stats.guildMaxLevel = Math.max(Number(member.stats.guildMaxLevel || 0), Number(guild.level || 0))
     save(memberId)
    }
   }

   const unlocked = user ? achievementCheck(user, "guild") : []
   if (user) save(session.userId)

   apiCache.invalidatePrefix("leaderboard:")
   apiCache.invalidate(`profile:${session.userId}`)
   return res.json({
    ok: true,
    scope,
    type,
    result: {
     claimed: Number(result.claimed || 0),
     totalXP: Number(result.totalXP || 0),
     bonusXP: Number(result.bonusXP || 0),
     allDone: Boolean(result.allDone),
     isPerfect: Boolean(result.isPerfect),
     levelResult: result.levelResult || null
    },
    unlockedAchievements: countUnlockedAchievements(unlocked),
    state: buildQuestStatePayload(session.userId)
   })
  }

  const user = getUser(session.userId)
  ensureUserQuests(user)

  let claimResult = null
  let claimedCount = 0
  let completionBonus = false
  let totalKamas = 0
  let totalXp = 0
  let totalPacks = 0
  let totalFragments = 0

  if (questId) {
   const single = claimQuest(user, questId, type, { userId: session.userId })
   if (!single?.success) {
    return res.status(400).json({ error: String(single?.error || "Récompense indisponible.") })
   }

   const questReward = single?.quest?.reward || {}
   const bonus = type === "weekly" ? WEEKLY_BONUS : DAILY_BONUS
   claimedCount = 1
   completionBonus = Boolean(single.completionBonus)
   totalKamas = Number(questReward.kamas || 0)
   totalXp = Number(questReward.xp || 0)
   totalPacks = Number(questReward.packs || 0)
   totalFragments = Number(questReward.fragments || 0)

   if (completionBonus) {
    totalKamas += Number(bonus?.kamas || 0)
    totalXp += Number(bonus?.xp || 0)
    totalPacks += Number(bonus?.packs || 0)
    totalFragments += Number(single?.bonusGrantedFragments || 0)
   }
   claimResult = single
  } else {
   const multi = claimAll(user, type, { userId: session.userId })
   if (Number(multi?.claimedCount || 0) <= 0) {
    return res.status(400).json({ error: "Aucune quête à récupérer." })
   }
   claimedCount = Number(multi.claimedCount || 0)
   completionBonus = Boolean(multi.completionBonus)
   totalKamas = Number(multi.totalKamas || 0)
   totalXp = Number(multi.totalXp || 0)
   totalPacks = Number(multi.totalPacks || 0)
   totalFragments = Number(multi.totalFragments || 0)
   claimResult = multi
  }

  let totalBpXp = 0
  const bpSource = type === "weekly" ? "quest_weekly_claim" : "quest_daily_claim"
  const bpBonusSource = type === "weekly" ? "quest_weekly_bonus" : "quest_daily_bonus"

  for (let i = 0; i < claimedCount; i++) {
   const bpResult = await addBattlePassXP(session.userId, bpSource)
   totalBpXp += Number(bpResult?.addedXP || 0)
  }
  if (completionBonus) {
   const bpBonus = await addBattlePassXP(session.userId, bpBonusSource)
   totalBpXp += Number(bpBonus?.addedXP || 0)
  }

  const unlockedSet = new Set()
  const addUnlocked = (entries = []) => {
   for (const id of entries) {
    const safeId = String(id || "").trim()
    if (!safeId) continue
    unlockedSet.add(safeId)
   }
  }
  addUnlocked(achievementCheck(user, "daily"))
  addUnlocked(achievementCheck(user, "event"))
  const unlocked = [...unlockedSet]
  save(session.userId)
  apiCache.invalidate(`profile:${session.userId}`)
  apiCache.invalidatePrefix("leaderboard:")

  res.json({
   ok: true,
   scope,
   type,
   result: {
    claimedCount,
   totalKamas,
   totalXp,
   totalPacks,
   totalFragments,
   completionBonus,
   totalBpXp,
   raw: claimResult
   },
   unlockedAchievements: countUnlockedAchievements(unlocked),
   state: buildQuestStatePayload(session.userId)
  })
 } catch (e) {
  console.error("[WEB] /api/quests/claim:", e)
  res.status(500).json({ error: "Erreur serveur" })
 }
})

 app.get("/api/activity", async (req, res) => {
  try {
   const limit = Number(req.query.limit || 10)
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
   const valid = ["cards", "unique", "kamas", "level", "achievements", "ssr", "packs", "guilds"]
   if (!valid.includes(category)) return res.status(400).json({ error: "Categorie invalide" })
   const blockedLeaderboardNames = new Set(["krosmoz-card", "nouveau"])

   const entries = apiCache.getOrCompute(
    `leaderboard:${category}`,
    () => computeLeaderboard(category),
    60000
   )

   if (category === "guilds") {
    const rows = (entries || [])
     .slice(0, 50)
     .map((entry, index) => ({
      rank: index + 1,
      guildId: String(entry.guildId || entry.id || ""),
      name: String(entry.name || "Guilde"),
      emoji: String(entry.emoji || "🛡️"),
      level: Number(entry.level || entry.value || 1),
      members: Number(entry.members || 0),
      maxMembers: Number(entry.maxMembers || MAX_MEMBERS),
      value: Number(entry.value || entry.level || 1)
     }))
    return res.json(rows)
   }

   const resolved = await Promise.all(
    entries.map(async (entry) => {
     const discord = await resolveDiscordUser(entry.userId)
     return { ...entry, discord }
    })
   )

   const filtered = resolved
    .filter((entry) => {
     const displayName = normalizeText(entry.discord?.displayName)
     const username = normalizeText(entry.discord?.username)
     const title = normalizeText(entry.title)
     return (
      !blockedLeaderboardNames.has(displayName) &&
      !blockedLeaderboardNames.has(username) &&
      !blockedLeaderboardNames.has(title)
     )
    })
    .slice(0, 50)
    .map((entry, index) => ({ ...entry, rank: index + 1 }))

   res.json(filtered)
  } catch (e) {
   console.error("[WEB] /api/leaderboard:", e)
   res.status(500).json({ error: "Erreur serveur" })
  }
 })

app.get("/api/profile/:id", async (req, res) => {
 try {
  const userId = req.params.id
  if (!/^\d{16,22}$/.test(userId)) return res.status(400).json({ error: "ID invalide" })
  const viewerSession = resolveSession(req)
  const canTrack = shouldTrackProfileView(req) && String(viewerSession?.userId || "") === String(userId)
  if (viewerSession?.userId && canTrack) {
   const viewer = getUser(String(viewerSession.userId))
   if (viewer) {
    recordProfileView(viewer)
    achievementCheck(viewer, "social")
    save(String(viewerSession.userId))
   }
  }

  const profile = apiCache.getOrCompute(
    `profile:${userId}`,
    () => computeProfile(userId),
    30000
   )
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

 app.post("/api/cards/:id/image", (req, res) => {
  try {
   const session = requireSession(req, res)
   if (!session) return
   if (!canEditCards(session)) {
    return res.status(403).json({ error: "Acces reserve au dev du site." })
   }

   const cardId = String(req.params.id || "").trim()
   if (!cardId) {
    return res.status(400).json({ error: "ID de carte invalide." })
   }

   const cards = getCards()
   const index = cards.findIndex((card) => String(card?.id || "") === cardId)
   if (index < 0) {
    return res.status(404).json({ error: "Carte introuvable." })
   }

   const currentCard = cards[index] || {}
   const setId = String(currentCard?.set || "unknown").trim() || "unknown"
   const safeSetId = (!setId.includes("..") && !/[\\/]/.test(setId)) ? setId : "unknown"
   const setKey = String(safeSetId || "").toLowerCase()
   const isImageUsedByAnotherCard = (imageName) => cards.some((card, idx) => {
    if (idx === index) return false
    const cardSet = String(card?.set || "").toLowerCase()
    const cardImage = String(card?.image || "").toLowerCase()
    return cardSet === setKey && cardImage === String(imageName || "").toLowerCase()
   })
   let image = sanitizeCardImageName(req.body?.image)

   if (!image) {
    const parsedUpload = parseImageDataUrl(req.body?.imageDataUrl)
    if (!parsedUpload) {
     return res.status(400).json({ error: "Nom de fichier ou image upload invalide." })
    }
    if (parsedUpload.buffer.length > (5 * 1024 * 1024)) {
      return res.status(400).json({ error: "Image trop lourde (max 5 Mo)." })
    }

    const setDir = path.join(CARD_IMAGES_RUNTIME_DIR, safeSetId)
    fs.mkdirSync(setDir, { recursive: true })
    image = buildRandomImageFileName(cardId, parsedUpload.ext, (candidate) => (
     isImageUsedByAnotherCard(candidate) || fs.existsSync(path.join(setDir, candidate))
    ))
    fs.writeFileSync(path.join(setDir, image), parsedUpload.buffer)
   } else if (isImageUsedByAnotherCard(image)) {
    const split = splitImageFileName(image)
    const suggestion = split
     ? buildUniqueImageFileName(split.base, split.ext, isImageUsedByAnotherCard)
     : null
    return res.status(409).json({
     error: "Nom de fichier deja utilise par une autre carte du meme set.",
     suggestion
    })
   }

   const nextCards = cards.map((card, idx) => (
    idx === index ? { ...card, image } : card
   ))

   saveCards(nextCards)

   return res.json({
    ok: true,
    card: {
     id: String(nextCards[index]?.id || cardId),
     set: String(nextCards[index]?.set || ""),
     image: String(nextCards[index]?.image || ""),
     imageUrl: `/assets/cards/${encodeURIComponent(safeSetId)}/${encodeURIComponent(String(nextCards[index]?.image || ""))}`
     }
    })
  } catch (e) {
   console.error("[WEB] /api/cards/:id/image:", e)
   return res.status(500).json({ error: "Erreur serveur" })
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

 const invalidateGuildCaches = (userIds = []) => {
  apiCache.invalidatePrefix("leaderboard:")
  for (const id of userIds) {
   const safeId = asGuildId(id)
   if (!safeId) continue
   apiCache.invalidate(`profile:${safeId}`)
  }
 }

 app.get("/api/guild/me", async (req, res) => {
  try {
   const session = requireSession(req, res)
   if (!session) return
   const payload = await buildGuildStatePayload(session.userId)
   return res.json(payload || { connected: true, inGuild: false })
  } catch (e) {
   console.error("[WEB] /api/guild/me:", e)
   return res.status(500).json({ error: "Erreur serveur" })
  }
 })

app.post("/api/guild/create", async (req, res) => {
 try {
  const session = requireSession(req, res)
  if (!session) return

  const name = String(req.body?.name || "").trim()
  const result = createGuild(session.userId, name)
  if (result?.error) return res.status(400).json({ error: String(result.error) })

  const actor = getUser(session.userId)
  const unlocked = actor ? achievementCheck(actor, "guild") : []
  if (actor) save(session.userId)

  invalidateGuildCaches([session.userId])
  const payload = await buildGuildStatePayload(session.userId)
  return res.json({
   ok: true,
   guild: payload?.guild || null,
   state: payload,
   unlockedAchievements: countUnlockedAchievements(unlocked)
  })
 } catch (e) {
  console.error("[WEB] /api/guild/create:", e)
  return res.status(500).json({ error: "Erreur serveur" })
 }
})

 app.post("/api/guild/leave", async (req, res) => {
  try {
   const session = requireSession(req, res)
   if (!session) return

   const result = leaveGuild(session.userId)
   if (result?.error) return res.status(400).json({ error: String(result.error) })

   invalidateGuildCaches([session.userId])
   const payload = await buildGuildStatePayload(session.userId)
   return res.json({ ok: true, state: payload })
  } catch (e) {
   console.error("[WEB] /api/guild/leave:", e)
   return res.status(500).json({ error: "Erreur serveur" })
  }
 })

app.post("/api/guild/apply", async (req, res) => {
 try {
  const session = requireSession(req, res)
  if (!session) return

   const guildId = asGuildId(req.body?.guildId)
   if (!guildId) return res.status(400).json({ error: "Guilde invalide." })

  const result = addGuildApplication(guildId, session.userId)
  if (result?.error) return res.status(400).json({ error: String(result.error) })

  const actor = getUser(session.userId)
  const unlocked = actor ? achievementCheck(actor, "guild") : []
  if (actor) save(session.userId)

  const payload = await buildGuildStatePayload(session.userId)
  return res.json({
   ok: true,
   state: payload,
   unlockedAchievements: countUnlockedAchievements(unlocked)
  })
 } catch (e) {
  console.error("[WEB] /api/guild/apply:", e)
  return res.status(500).json({ error: "Erreur serveur" })
 }
})

 app.post("/api/guild/application/respond", async (req, res) => {
  try {
   const session = requireSession(req, res)
   if (!session) return

   const currentGuild = getUserGuild(session.userId)
   if (!currentGuild) return res.status(400).json({ error: "Tu n'es dans aucune guilde." })

   const guildId = asGuildId(req.body?.guildId || currentGuild.id)
   const applicantId = asGuildId(req.body?.applicantId)
   const action = String(req.body?.action || "").trim().toLowerCase()
   const accept = action === "accept" || action === "accepted" || action === "approve"
   if (!applicantId) return res.status(400).json({ error: "Candidature invalide." })

  const result = respondGuildApplication(guildId, session.userId, applicantId, accept)
  if (result?.error) return res.status(400).json({ error: String(result.error) })

  const reviewer = getUser(session.userId)
  const reviewerUnlocked = reviewer ? achievementCheck(reviewer, "guild") : []
  if (reviewer) save(session.userId)

  const applicant = getUser(applicantId)
  const applicantUnlocked = (accept && applicant) ? achievementCheck(applicant, "guild") : []
  if (accept && applicant) save(applicantId)

  invalidateGuildCaches([session.userId, applicantId])
  const payload = await buildGuildStatePayload(session.userId)
  return res.json({
   ok: true,
   action: result.action,
   state: payload,
   unlockedAchievements: countUnlockedAchievements(reviewerUnlocked),
   targetUnlockedAchievements: countUnlockedAchievements(applicantUnlocked)
  })
 } catch (e) {
  console.error("[WEB] /api/guild/application/respond:", e)
  return res.status(500).json({ error: "Erreur serveur" })
 }
})

 app.post("/api/guild/manage/invite", async (req, res) => {
  try {
   const session = requireSession(req, res)
   if (!session) return
   if (!session.local) {
    return res.status(403).json({ error: "Invitation directe disponible uniquement en local." })
   }

   const guild = getUserGuild(session.userId)
   if (!guild) return res.status(400).json({ error: "Tu n'es dans aucune guilde." })
   const rank = getGuildRank(guild.id, session.userId)
   if (rank !== "meneur" && rank !== "officier") {
    return res.status(403).json({ error: "Seuls le meneur et les officiers peuvent inviter." })
   }

   const targetId = asGuildId(req.body?.targetId)
   if (!/^\d{16,22}$/.test(targetId)) {
    return res.status(400).json({ error: "ID Discord invalide." })
   }
   if (targetId === asGuildId(session.userId)) {
    return res.status(400).json({ error: "Tu es déjà dans cette guilde." })
   }

 const result = joinGuild(targetId, guild.id)
 if (result?.error) return res.status(400).json({ error: String(result.error) })
 const recruiter = getUser(String(session.userId))
 if (recruiter) {
  recordGuildRecruitment(recruiter)
   achievementCheck(recruiter, "guild")
   save(String(session.userId))
  }
  const invited = getUser(targetId)
  const invitedUnlocked = invited ? achievementCheck(invited, "guild") : []
  if (invited) save(targetId)

  removeGuildApplicationsForUser(targetId)
   invalidateGuildCaches([session.userId, targetId])
   const payload = await buildGuildStatePayload(session.userId)
   return res.json({
    ok: true,
    state: payload,
    targetUnlockedAchievements: countUnlockedAchievements(invitedUnlocked)
   })
  } catch (e) {
   console.error("[WEB] /api/guild/manage/invite:", e)
   return res.status(500).json({ error: "Erreur serveur" })
  }
 })

 app.post("/api/guild/manage/kick", async (req, res) => {
  try {
   const session = requireSession(req, res)
   if (!session) return
   const guild = getUserGuild(session.userId)
   if (!guild) return res.status(400).json({ error: "Tu n'es dans aucune guilde." })

   const targetId = asGuildId(req.body?.targetId)
   if (!targetId) return res.status(400).json({ error: "Membre invalide." })

  const result = kickMember(guild.id, session.userId, targetId)
  if (result?.error) return res.status(400).json({ error: String(result.error) })

  const actor = getUser(session.userId)
  const unlocked = actor ? achievementCheck(actor, "guild") : []
  if (actor) save(session.userId)

  invalidateGuildCaches([session.userId, targetId])
  const payload = await buildGuildStatePayload(session.userId)
  return res.json({
   ok: true,
   state: payload,
   unlockedAchievements: countUnlockedAchievements(unlocked)
  })
 } catch (e) {
  console.error("[WEB] /api/guild/manage/kick:", e)
  return res.status(500).json({ error: "Erreur serveur" })
  }
 })

 app.post("/api/guild/manage/promote", async (req, res) => {
  try {
   const session = requireSession(req, res)
   if (!session) return
   const guild = getUserGuild(session.userId)
   if (!guild) return res.status(400).json({ error: "Tu n'es dans aucune guilde." })
   const targetId = asGuildId(req.body?.targetId)
   if (!targetId) return res.status(400).json({ error: "Membre invalide." })

  const result = promoteOfficer(guild.id, session.userId, targetId)
  if (result?.error) return res.status(400).json({ error: String(result.error) })

  const target = getUser(targetId)
  const targetUnlocked = target ? achievementCheck(target, "guild") : []
  if (target) save(targetId)

  invalidateGuildCaches([session.userId, targetId])
  const payload = await buildGuildStatePayload(session.userId)
  return res.json({
   ok: true,
   state: payload,
   targetUnlockedAchievements: countUnlockedAchievements(targetUnlocked)
  })
 } catch (e) {
  console.error("[WEB] /api/guild/manage/promote:", e)
  return res.status(500).json({ error: "Erreur serveur" })
  }
 })

 app.post("/api/guild/manage/demote", async (req, res) => {
  try {
   const session = requireSession(req, res)
   if (!session) return
   const guild = getUserGuild(session.userId)
   if (!guild) return res.status(400).json({ error: "Tu n'es dans aucune guilde." })
   const targetId = asGuildId(req.body?.targetId)
   if (!targetId) return res.status(400).json({ error: "Membre invalide." })

   const result = demoteOfficer(guild.id, session.userId, targetId)
   if (result?.error) return res.status(400).json({ error: String(result.error) })

   invalidateGuildCaches([session.userId, targetId])
   const payload = await buildGuildStatePayload(session.userId)
   return res.json({ ok: true, state: payload })
  } catch (e) {
   console.error("[WEB] /api/guild/manage/demote:", e)
   return res.status(500).json({ error: "Erreur serveur" })
  }
 })

 app.post("/api/guild/manage/transfer", async (req, res) => {
  try {
   const session = requireSession(req, res)
   if (!session) return
   const guild = getUserGuild(session.userId)
   if (!guild) return res.status(400).json({ error: "Tu n'es dans aucune guilde." })
   const targetId = asGuildId(req.body?.targetId)
   if (!targetId) return res.status(400).json({ error: "Membre invalide." })

  const result = transferLeader(guild.id, session.userId, targetId)
  if (result?.error) return res.status(400).json({ error: String(result.error) })

  const actor = getUser(session.userId)
  const unlocked = actor ? achievementCheck(actor, "guild") : []
  if (actor) save(session.userId)

  invalidateGuildCaches([session.userId, targetId])
  const payload = await buildGuildStatePayload(session.userId)
  return res.json({
   ok: true,
   state: payload,
   unlockedAchievements: countUnlockedAchievements(unlocked)
  })
 } catch (e) {
  console.error("[WEB] /api/guild/manage/transfer:", e)
  return res.status(500).json({ error: "Erreur serveur" })
  }
 })

 app.post("/api/guild/manage/rename", async (req, res) => {
  try {
   const session = requireSession(req, res)
   if (!session) return
   const guild = getUserGuild(session.userId)
   if (!guild) return res.status(400).json({ error: "Tu n'es dans aucune guilde." })

   const name = String(req.body?.name || "").trim()
  const result = renameGuild(guild.id, session.userId, name)
  if (result?.error) return res.status(400).json({ error: String(result.error) })

  const actor = getUser(session.userId)
  const unlocked = actor ? achievementCheck(actor, "guild") : []
  if (actor) save(session.userId)

  invalidateGuildCaches([session.userId])
  const payload = await buildGuildStatePayload(session.userId)
  return res.json({
   ok: true,
   state: payload,
   unlockedAchievements: countUnlockedAchievements(unlocked)
  })
 } catch (e) {
  console.error("[WEB] /api/guild/manage/rename:", e)
  return res.status(500).json({ error: "Erreur serveur" })
  }
 })

 app.post("/api/guild/manage/disband", async (req, res) => {
  try {
   const session = requireSession(req, res)
   if (!session) return
   const guild = getUserGuild(session.userId)
   if (!guild) return res.status(400).json({ error: "Tu n'es dans aucune guilde." })

   const memberIds = Array.isArray(guild.memberIds) ? [...guild.memberIds] : [session.userId]
   const result = disbandGuild(guild.id, session.userId)
   if (result?.error) return res.status(400).json({ error: String(result.error) })

   invalidateGuildCaches(memberIds)
   const payload = await buildGuildStatePayload(session.userId)
   return res.json({ ok: true, state: payload })
  } catch (e) {
   console.error("[WEB] /api/guild/manage/disband:", e)
   return res.status(500).json({ error: "Erreur serveur" })
  }
 })

 app.post("/api/guild/dev/switch-role", async (req, res) => {
  try {
   const session = requireSession(req, res)
   if (!session) return
   if (!session.local) return res.status(403).json({ error: "Disponible uniquement en mode local." })

   const mode = String(req.body?.mode || "").trim().toLowerCase()
   if (!["leader", "meneur", "officer", "officier", "member", "membre", "none", "sans_guilde"].includes(mode)) {
    return res.status(400).json({ error: "Mode invalide." })
   }

   const switched = switchLocalGuildRole(session.userId, mode)
   if (switched?.error) return res.status(400).json({ error: String(switched.error) })

   invalidateGuildCaches([session.userId])
   const payload = await buildGuildStatePayload(session.userId)
   return res.json({ ok: true, mode: switched.mode, state: payload })
  } catch (e) {
   console.error("[WEB] /api/guild/dev/switch-role:", e)
   return res.status(500).json({ error: "Erreur serveur" })
  }
 })

 app.get("/api/guild/:id", async (req, res) => {
  try {
   const profile = await computeGuildProfile(req.params.id)
   if (!profile) return res.status(404).json({ error: "Guilde introuvable" })
   return res.json(profile)
  } catch (e) {
   console.error("[WEB] /api/guild/:id:", e)
   return res.status(500).json({ error: "Erreur serveur" })
  }
 })

 app.get("/api/oauth/status", (req, res) => {
  const session = resolveSession(req)
  const banned = isBannedSession(session)
  const localAuthAvailable = canUseLocalAuth(req)
  const localAuthEnabled = Boolean(buildLocalSession(req))
  res.json({
   enabled: oauthConfigured() || localAuthEnabled,
   clientId: OAUTH_CLIENT_ID || null,
   connected: Boolean(session),
   userId: session?.userId || null,
   banned,
   banImage: banned ? BAN_KROSMOZ_IMAGE_PATH : null,
   localAuthAvailable,
   localAuthEnabled,
   localAuthSession: Boolean(session?.local)
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

 app.get("/api/daily/state", (req, res) => {
  try {
   const session = resolveSession(req)
   if (!session) {
    return res.json({
     connected: false,
     state: {
      canClaim: false,
      nextClaimAt: 0,
      remainingMs: 0,
      streak: 0,
      lastDaily: 0
     }
    })
   }

   const user = getUser(session.userId)
   if (!user) return res.status(404).json({ error: "Joueur introuvable." })
   return res.json({
    connected: true,
    state: buildDailyStatePayload(user)
   })
  } catch (e) {
   console.error("[WEB] /api/daily/state:", e)
   return res.status(500).json({ error: "Erreur serveur" })
  }
 })

 app.post("/api/daily/claim", async (req, res) => {
  try {
   const session = requireSession(req, res)
   if (!session) return

   const user = getUser(session.userId)
   if (!user) return res.status(404).json({ error: "Joueur introuvable." })

   if (!canClaimDaily(user)) {
    return res.status(400).json({
     error: "Daily déjà récupérée.",
     state: buildDailyStatePayload(user)
    })
   }

   const result = await claimDaily(null, user, session.userId)

   updateActivityStreak(user)

   const streakNow = Math.max(0, Number(result?.streak || user?.daily?.streak || 0))
   const streakDay = Math.max(1, ((Math.max(1, streakNow) - 1) % 7) + 1)
   const xpGained = 25 + ((streakDay - 1) * 10)
   if (!user.progression || typeof user.progression !== "object") {
    user.progression = { level: 1, xp: 0, totalXp: 0 }
   }
   user.progression.xp = Number(user.progression.xp || 0) + xpGained
   user.progression.totalXp = Number(user.progression.totalXp || 0) + xpGained

   if (!user.stats || typeof user.stats !== "object") user.stats = {}
   user.stats.maxDailyStreak = Math.max(Number(user.stats.maxDailyStreak || 0), streakNow)

   let bpAddedXP = 0
   try {
    const bpResult = await addBattlePassXP(session.userId, "daily_claim")
    bpAddedXP = Number(bpResult?.addedXP || 0)
   } catch (_) {}

   const unlocked = [
    ...achievementCheck(user, "daily"),
    ...achievementCheck(user, "economy"),
    ...achievementCheck(user, "progression")
   ]

   save(session.userId)
   apiCache.invalidate(`profile:${session.userId}`)
   apiCache.invalidatePrefix("leaderboard:")

   return res.json({
    ok: true,
    result: {
     reward: result?.reward || null,
     streak: streakNow,
     streakBar: String(result?.streakBar || ""),
     doubleReward: Boolean(result?.doubleReward),
     doubleDailyChance: Number(result?.doubleDailyChance || 0),
     bonusPacksGiven: Number(result?.bonusPacksGiven || 0),
     bonusKamas: Number(result?.bonusKamas || 0),
     xpGained,
     bpAddedXP
    },
    unlockedAchievements: countUnlockedAchievements(unlocked),
    state: buildDailyStatePayload(user)
   })
  } catch (e) {
   console.error("[WEB] /api/daily/claim:", e)
   return res.status(500).json({ error: "Erreur serveur" })
  }
 })

app.post("/api/me/title", (req, res) => {
 try {
   const session = requireSession(req, res)
   if (!session) return

   const user = getUser(session.userId)
   if (!user) return res.status(404).json({ error: "Joueur introuvable." })

   const nextTitle = String(req.body?.title || "").trim()
   if (!nextTitle) return res.status(400).json({ error: "Titre invalide." })

   if (!Array.isArray(user.titles) || user.titles.length <= 0) {
    user.titles = ["Nouveau"]
   }

   const hasTitle = user.titles.some((title) => String(title) === nextTitle)
   if (!hasTitle) {
    return res.status(400).json({ error: "Tu n'as pas débloqué ce titre." })
   }

  const previousTitle = String(user.title || "Nouveau")
  user.title = nextTitle
  user.stats = user.stats || {}
  if (previousTitle !== nextTitle) {
   user.stats.titleChanges = Number(user.stats.titleChanges || 0) + 1
  }
  save(session.userId)
   apiCache.invalidate(`profile:${session.userId}`)
   apiCache.invalidatePrefix("leaderboard:")

   return res.json({
    ok: true,
    title: String(user.title || "Nouveau"),
    titles: Array.isArray(user.titles) ? user.titles : ["Nouveau"]
   })
  } catch (e) {
   console.error("[WEB] /api/me/title:", e)
   return res.status(500).json({ error: "Erreur serveur" })
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

app.get("/api/game/meta", (req, res) => {
 try {
  const session = requireSession(req, res)
  if (!session) return

  const user = getUser(session.userId)
  const cards = getCards()
  const sets = getSets()

  const unlockedSets = (sets || [])
   .filter((set) => isSetUnlocked(user, set.id, cards))
   .map((set) => ({ id: String(set.id), name: String(set.name || set.id) }))

  const fusion = ["C", "U", "R", "SR", "HR", "UR", "S"].map((rarity) => ({
   rarity,
   cost: Number(FUSION_COST[rarity] || 0)
  }))
  const pityBySet = Object.fromEntries((sets || []).map((set) => {
   const setId = String(set.id)
   const p = user.pity?.[setId] || {}
   const ur = Number(p?.UR || 0)
   const s = Number(p?.S || 0)
   const ssr = Number(p?.SSR || 0)
   return [setId, {
    UR: ur,
    S: s,
    SSR: ssr,
    toGuaranteed: {
     UR: Math.max(0, 10 - ur),
     S: Math.max(0, 30 - s),
     SSR: Math.max(0, 50 - ssr)
    }
   }]
  }))

  res.json({
   packPrice: Number(PACK_PRICE || 0),
   packStock: Number(user.packs || 0),
   kamas: Number(user.kamas || 0),
   unlockedSets,
   fusion,
   pityBySet
  })
 } catch (e) {
  console.error("[WEB] /api/game/meta:", e)
  res.status(500).json({ error: "Erreur serveur" })
 }
})

app.get("/api/game/recruit-history", (req, res) => {
 try {
  const session = requireSession(req, res)
  if (!session) return

  const user = getUser(session.userId)
  const { page, limit } = parsePagination(req, 10, 100)
  const setId = String(req.query?.setId || req.query?.set || "").trim().toLowerCase()
  const payload = buildRecruitHistoryPayload(user, { setId, page, limit })

  if (payload.changed) save(session.userId)

  res.json({
   ok: true,
   windowDays: 7,
   timezone: "UTC+2",
   setId: setId || null,
   total: payload.total,
   page: payload.page,
   pages: payload.pages,
   limit: payload.limit,
   items: payload.items
  })
 } catch (e) {
  console.error("[WEB] /api/game/recruit-history:", e)
  res.status(500).json({ error: "Erreur serveur" })
 }
})

app.get("/api/krosmoshop/state", (req, res) => {
 try {
  const session = resolveSession(req)
  const userId = session?.userId || null
  if (userId) {
   const user = getUser(String(userId))
   if (user) {
    recordShopView(user, Date.now())
    save(String(userId))
   }
  }
  const payload = buildKrosmoshopStatePayload(userId)
  res.json(payload)
 } catch (e) {
  console.error("[WEB] /api/krosmoshop/state:", e)
  res.status(500).json({ error: "Erreur serveur" })
 }
})

app.post("/api/krosmoshop/buy", (req, res) => {
 try {
  const session = requireSession(req, res)
  if (!session) return

  const cardId = String(req.body?.cardId || "").trim()
  if (!cardId) return res.status(400).json({ error: "cardId manquant." })

  const result = buyFromShop(session.userId, cardId)
  if (result?.error) return res.status(400).json({ error: String(result.error) })

  const user = getUser(session.userId)
  apiCache.invalidate(`profile:${session.userId}`)
  apiCache.invalidatePrefix("leaderboard:")

  res.json({
   ok: true,
   result: {
    cardId: String(cardId),
    rarity: String(result?.rarity || ""),
    price: Number(result?.price || 0),
    originalPrice: Number(result?.originalPrice || 0),
    isNew: Boolean(result?.isNew),
    cardInfo: result?.cardInfo || null
   },
   kamas: Number(user?.kamas || 0),
   unlockedAchievements: countUnlockedAchievements(result?.unlocked || []),
   state: buildKrosmoshopStatePayload(session.userId)
  })
 } catch (e) {
  console.error("[WEB] /api/krosmoshop/buy:", e)
  res.status(500).json({ error: "Erreur serveur" })
 }
})

app.post("/api/game/buy-packs", (req, res) => {
 try {
  const session = requireSession(req, res)
  if (!session) return

  const quantity = Math.max(1, Math.min(50, Number(req.body?.quantity || 1)))
  if (!Number.isInteger(quantity)) return res.status(400).json({ error: "Quantite invalide." })

  const user = getUser(session.userId)
  const totalCost = Number(PACK_PRICE || 0) * quantity
  if (Number(user.kamas || 0) < totalCost) {
   return res.status(400).json({ error: `Pas assez de kamas (${totalCost.toLocaleString("fr-FR")} requis).` })
  }

  user.kamas -= totalCost
  user.packs = Number(user.packs || 0) + quantity
  if (!user.stats) user.stats = {}
  user.stats.packsBought = Number(user.stats.packsBought || 0) + quantity
  user.stats.lastBulkBuy = quantity
  user.stats.maxBulkBuy = Math.max(Number(user.stats.maxBulkBuy || 0), quantity)
  if (quantity >= 2) {
   user.stats.multiPackBuys = Number(user.stats.multiPackBuys || 0) + 1
  }

  const unlocked = achievementCheck(user, "economy")
  save(session.userId)
  apiCache.invalidate(`profile:${session.userId}`)
  apiCache.invalidatePrefix("leaderboard:")

  res.json({
   ok: true,
   quantity,
   totalCost,
   packStock: Number(user.packs || 0),
   kamas: Number(user.kamas || 0),
   unlockedAchievements: countUnlockedAchievements(unlocked)
  })
 } catch (e) {
  console.error("[WEB] /api/game/buy-packs:", e)
  res.status(500).json({ error: "Erreur serveur" })
 }
})

app.post("/api/game/sell-card", (req, res) => {
 try {
  const session = requireSession(req, res)
  if (!session) return

  const cardId = String(req.body?.cardId || "").trim()
  if (!cardId) return res.status(400).json({ error: "cardId manquant." })

  const user = getUser(session.userId)
  const cards = getCards()
  const card = cards.find((row) => String(row.id) === cardId) || getSecretCardById(cardId)
  if (!card) return res.status(404).json({ error: "Carte introuvable." })
  if (isSecretCard(card)) return res.status(400).json({ error: "La carte SECRET ne peut pas etre vendue." })

  const qtyBefore = Number(user.cards?.[cardId] || 0)
  if (qtyBefore <= 0) return res.status(400).json({ error: "Tu ne possedes plus cette carte." })

  const rarity = String(card.rarity || "C").toUpperCase()
  const baseSellPrice = Number(SELL_PRICE[rarity] || 1)
  const sellMultiplier = getSeasonSellMultiplier()
  const sellBonusPercent = getSellBonusPercent(sellMultiplier)
  const gain = computeSellPrice(baseSellPrice, sellMultiplier)

  user.cards[cardId] = qtyBefore - 1
  if (user.cards[cardId] <= 0) delete user.cards[cardId]

  const kamasBefore = Number(user.kamas || 0)
  user.kamas = kamasBefore + gain

  if (!user.stats) user.stats = {}
  user.stats.cardsSold = Number(user.stats.cardsSold || 0) + 1

  const unlocked = achievementCheck(user, "economy")
  save(session.userId)
  apiCache.invalidate(`profile:${session.userId}`)
  apiCache.invalidatePrefix("leaderboard:")

  res.json({
   ok: true,
   sold: {
    cardId,
    cardName: String(card.name || `Carte ${cardId}`),
    rarity,
    gain,
    sellBonusPercent,
    remainingQty: Math.max(0, Number(user.cards?.[cardId] || 0)),
    kamasBefore,
    kamasAfter: Number(user.kamas || 0)
   },
   kamas: Number(user.kamas || 0),
   unlockedAchievements: countUnlockedAchievements(unlocked)
  })
 } catch (e) {
  console.error("[WEB] /api/game/sell-card:", e)
  res.status(500).json({ error: "Erreur serveur" })
 }
})

app.post("/api/game/open-packs", async (req, res) => {
 try {
  const session = requireSession(req, res)
  if (!session) return

  const quantity = Math.max(1, Math.min(25, Number(req.body?.quantity || 1)))
  const setId = String(req.body?.setId || "").trim()
  if (!Number.isInteger(quantity)) return res.status(400).json({ error: "Quantite invalide." })
  if (!setId) return res.status(400).json({ error: "setId manquant." })

  const user = getUser(session.userId)
  const cards = getCards()
  const sets = getSets()
  const setNames = getCardSetNameMap(sets)
  const activeSetName = String(setNames.get(setId) || setId)
  const validSetIds = new Set((sets || []).map((set) => String(set.id)))
  if (!validSetIds.has(setId)) return res.status(400).json({ error: "Set invalide." })
  if (!isSetUnlocked(user, setId, cards)) return res.status(400).json({ error: "Set verrouille pour ce profil." })

  const stock = Number(user.packs || 0)
  if (stock < quantity) return res.status(400).json({ error: "Packs insuffisants." })

  user.packs = stock - quantity
  if (!user.stats) user.stats = {}
  user.stats.packsOpened = Number(user.stats.packsOpened || 0) + quantity
  user.stats.krosmozOpened = Number(user.stats.krosmozOpened || 0) + quantity
  user.stats.lastBulkOpen = quantity
  user.stats.maxBulkOpen = Math.max(Number(user.stats.maxBulkOpen || 0), quantity)
  if (quantity >= 2) user.stats.multiPackOpens = Number(user.stats.multiPackOpens || 0) + 1

  const pulls = []
  let kamasGain = 0
  let xpGain = 0
  const rarityCount = {}
  const grouped = new Map()
  const fragments = []
  const discoveredCardIds = new Set()
  const revealCards = []

  for (let i = 0; i < quantity; i++) {
   const result = openPack(user, setId, session.userId, { isSimpleCommandOpen: quantity === 1 })
   kamasGain += Number(result?.kamasGain || 0)
   xpGain += Number(result?.xpGain || 0)
   if (result?.fragment) fragments.push(result.fragment)
   const discoveredThisPull = new Set((result?.discovered || []).map((card) => String(card?.id || "")))
   for (const discovered of (result?.discovered || [])) {
    if (!discovered?.id) continue
    discoveredCardIds.add(String(discovered.id))
   }

   for (const card of (result?.pack || [])) {
    if (isSecretCard(card)) continue
    const cardId = String(card?.id || "")
    const rarity = String(card?.rarity || "C")
    rarityCount[rarity] = Number(rarityCount[rarity] || 0) + 1
    const key = `${card.id}:${card.shiny ? 1 : 0}`
    revealCards.push({
     cardId,
     cardName: String(card?.name || `Carte ${card?.id}`),
     rarity,
     set: String(card?.set || setId),
     image: card?.image ? `/assets/cards/${encodeURIComponent(String(card.set || setId))}/${encodeURIComponent(String(card.image))}` : null,
     shiny: Boolean(card?.shiny),
     isNew: discoveredThisPull.has(cardId)
    })
    if (!grouped.has(key)) {
     grouped.set(key, {
      cardId,
      cardName: String(card.name || `Carte ${card.id}`),
      rarity,
      set: String(card.set || setId),
      image: card?.image ? `/assets/cards/${encodeURIComponent(String(card.set || setId))}/${encodeURIComponent(String(card.image))}` : null,
      shiny: Boolean(card?.shiny),
      isNew: false,
      qty: 0
     })
    }
    grouped.get(key).qty += 1
    if (discoveredCardIds.has(String(card.id))) grouped.get(key).isNew = true
   }

   pulls.push({
    luckyPack: Boolean(result?.luckyPack),
    best: result?.best ? {
     cardId: String(result.best.id),
     cardName: String(result.best.name || `Carte ${result.best.id}`),
     rarity: String(result.best.rarity || "C")
    } : null
   })
  }

  await addBattlePassXP(session.userId, "pack_open")
  appendRecruitHistoryEntries(user, [...grouped.values()].map((row) => ({
   setId,
   setName: activeSetName,
   itemName: String(row.cardName || `Carte ${row.cardId}`),
   recruitmentName: activeSetName,
   rarity: String(row.rarity || "C"),
   qty: Math.max(1, Number(row.qty || 1)),
   imageUrl: row.image ? String(row.image) : null
  })))
  const unlocked = [
   ...achievementCheck(user, "pack"),
   ...achievementCheck(user, "rng"),
   ...achievementCheck(user, "collection"),
   ...achievementCheck(user, "fragment")
  ]
  save(session.userId)
  apiCache.invalidate(`profile:${session.userId}`)
  apiCache.invalidatePrefix("leaderboard:")

  const pity = user.pity?.[setId] || { UR: 0, S: 0, SSR: 0 }
  const pityCounters = {
   UR: Number(pity?.UR || 0),
   S: Number(pity?.S || 0),
   SSR: Number(pity?.SSR || 0)
  }

  res.json({
   ok: true,
   quantity,
   setId,
   packStock: Number(user.packs || 0),
   kamas: Number(user.kamas || 0),
   totals: {
    kamasGain,
    xpGain,
    rarityCount,
    fragments: fragments.length
   },
   cards: [...grouped.values()].sort((a, b) =>
    RARITY_ORDER.indexOf(String(b.rarity)) - RARITY_ORDER.indexOf(String(a.rarity)) ||
    String(a.cardName).localeCompare(String(b.cardName), "fr")
   ),
   revealCards,
   pity: {
    counters: pityCounters,
    toGuaranteed: {
     UR: Math.max(0, 10 - pityCounters.UR),
     S: Math.max(0, 30 - pityCounters.S),
     SSR: Math.max(0, 50 - pityCounters.SSR)
    }
   },
   pulls,
   unlockedAchievements: countUnlockedAchievements(unlocked)
  })
 } catch (e) {
  console.error("[WEB] /api/game/open-packs:", e)
  res.status(500).json({ error: "Erreur serveur" })
 }
})

app.post("/api/game/fuse", async (req, res) => {
 try {
  const session = requireSession(req, res)
  if (!session) return

  const setId = String(req.body?.setId || "").trim()
  const rarity = normalizeRarity(req.body?.rarity)
  if (!setId) return res.status(400).json({ error: "setId manquant." })
  if (!rarity || rarity === "SSR") return res.status(400).json({ error: "Rareté invalide pour fusion." })

  const cost = Number(FUSION_COST[rarity] || 0)
  if (!cost) return res.status(400).json({ error: "Fusion indisponible pour cette rarete." })
  const targetRarity = getNextRarity(rarity)
  if (!targetRarity) return res.status(400).json({ error: "Rareté cible introuvable." })

  const user = getUser(session.userId)
  const cards = getCards()
  const sets = getSets()
  const validSetIds = new Set((sets || []).map((set) => String(set.id)))
  if (!validSetIds.has(setId)) return res.status(400).json({ error: "Set invalide." })
  if (!isSetUnlocked(user, setId, cards)) return res.status(400).json({ error: "Set verrouille pour ce profil." })

  const consumed = consumeDuplicatesForFusion(user, cards, setId, rarity, cost)
  if (!consumed.ok) {
   return res.status(400).json({
    error: "Doublons insuffisants pour fusion.",
    required: cost,
    available: consumed.available || 0
   })
  }

  const rewardPool = cards.filter((card) => String(card.set) === setId && String(card.rarity) === targetRarity)
  if (!rewardPool.length) {
   return res.status(400).json({ error: `Aucune carte ${targetRarity} dans ce set.` })
  }
  const reward = rewardPool[Math.floor(Math.random() * rewardPool.length)]

  if (!user.cards) user.cards = {}
  user.cards[reward.id] = Number(user.cards[reward.id] || 0) + 1

  if (!user.stats) user.stats = {}
  user.stats.fusions = Number(user.stats.fusions || 0) + 1

  const xp = 15
  try {
   const { addXP } = require("../systems/progressionSystem")
   addXP(user, xp)
  } catch (_) {}
  await addBattlePassXP(session.userId, "fusion")

  const unlocked = [
   ...achievementCheck(user, "fusion"),
   ...achievementCheck(user, "collection"),
   ...achievementCheck(user, "rng")
  ]
  save(session.userId)
  apiCache.invalidate(`profile:${session.userId}`)
  apiCache.invalidatePrefix("leaderboard:")

  res.json({
   ok: true,
   setId,
   fromRarity: rarity,
   toRarity: targetRarity,
   cost,
   reward: {
    cardId: String(reward.id),
    cardName: String(reward.name || `Carte ${reward.id}`),
    rarity: String(reward.rarity || targetRarity),
    set: String(reward.set || setId),
    imageUrl: reward?.image ? `/assets/cards/${encodeURIComponent(String(reward.set || setId))}/${encodeURIComponent(String(reward.image))}` : null
   },
   remainingDuplicates: Number(consumed.availableAfter || 0),
   xpGain: xp,
   unlockedAchievements: countUnlockedAchievements(unlocked)
  })
 } catch (e) {
  console.error("[WEB] /api/game/fuse:", e)
  res.status(500).json({ error: "Erreur serveur" })
 }
})

app.post("/api/game/craft", async (req, res) => {
 try {
  const session = requireSession(req, res)
  if (!session) return

  const cardId = String(req.body?.cardId || "").trim()
  if (!cardId) return res.status(400).json({ error: "cardId manquant." })

  const result = await craftFromFragments(session.userId, cardId)
  if (!result?.ok) {
   return res.status(400).json({
    error: result?.error || "Craft impossible.",
    progress: result?.progress || null
   })
  }

  const user = getUser(session.userId)
  const unlocked = [
   ...achievementCheck(user, "fragment"),
   ...achievementCheck(user, "collection"),
   ...achievementCheck(user, "rng")
  ]
  save(session.userId)
  apiCache.invalidate(`profile:${session.userId}`)
  apiCache.invalidatePrefix("leaderboard:")

  const crafted = result.card || {}
  res.json({
   ok: true,
   card: {
    cardId: String(crafted.id || cardId),
    cardName: String(crafted.name || `Carte ${cardId}`),
    rarity: String(crafted.rarity || "SSR"),
    set: String(crafted.set || "unknown"),
    imageUrl: crafted?.image ? `/assets/cards/${encodeURIComponent(String(crafted.set || "unknown"))}/${encodeURIComponent(String(crafted.image))}` : null
   },
   titleUnlocked: result.titleUnlocked || null,
   unlockedAchievements: countUnlockedAchievements(unlocked)
  })
 } catch (e) {
  console.error("[WEB] /api/game/craft:", e)
  res.status(500).json({ error: "Erreur serveur" })
 }
})

app.get("/api/events/state", async (req, res) => {
 try {
  await ensureWebPinataLifecycle()
  const session = resolveSession(req)
  const connected = Boolean(session)
  const event = getEvent()
  const eventActive = isEventActive() && Boolean(event)

  let me = null
  let roulette = { canSpin: false, cooldownMs: 0, lastSpin: null }
  let tickets = { total: 0, used: 0, remaining: 0 }
  if (connected && session) {
   const user = getUser(session.userId)
   me = buildMePayload(session.userId)
   const now = Date.now()
   const lastSpinTs = user.stats?.rouletteLastSpin ? new Date(user.stats.rouletteLastSpin).getTime() : 0
   const cooldownMs = Math.max(0, (60 * 60 * 1000) - Math.max(0, now - lastSpinTs))
   roulette = {
    canSpin: cooldownMs <= 0,
    cooldownMs,
    lastSpin: user.stats?.rouletteLastSpin || null,
    spins: Number(user.stats?.rouletteSpins || 0),
    jackpots: Number(user.stats?.rouletteJackpot || 0)
   }

   if (eventActive) {
    const beforeEventState = `${user.event?.uid || ""}:${user.event?.tickets || ""}:${user.event?.used || ""}`
    initUserEvent(user)
    tickets.total = Number(user.event?.tickets || 0)
    tickets.used = Number(user.event?.used || 0)
    tickets.remaining = Math.max(0, tickets.total - tickets.used)
    const afterEventState = `${user.event?.uid || ""}:${user.event?.tickets || ""}:${user.event?.used || ""}`
    if (beforeEventState !== afterEventState) save(session.userId)
   }
  }

  const eventView = eventActive
   ? {
     active: true,
     key: String(event.key),
     name: String(event.name || "Event"),
     effect: stripDiscordMarkdownForWeb(event.effect),
     startText: stripDiscordMarkdownForWeb(event.start),
     midText: stripDiscordMarkdownForWeb(event.mid),
     endText: stripDiscordMarkdownForWeb(event.end),
     needsTarget: Boolean(event.needsTarget),
     targetName: String(event?.data?.targetName || ""),
     ticketsPerPlayer: Number(event.tickets || 0),
    stats: {
     packs: Number(event.stats?.packs || 0),
     ssr: Number(event.stats?.ssr || 0),
     totalCards: Number(event.stats?.totalCards || 0)
    },
    endTime: Number(event.endTime || 0)
   }
   : { active: false }

  res.json({
   connected,
   me,
   roulette,
   tickets,
   event: eventView,
   pinata: getWebPinataView(session?.userId || null)
  })
 } catch (e) {
  console.error("[WEB] /api/events/state:", e)
  res.status(500).json({ error: "Erreur serveur" })
 }
})

app.post("/api/events/roulette/spin", async (req, res) => {
 try {
  const session = requireSession(req, res)
  if (!session) return

  const user = getUser(session.userId)
  if (!user.stats) user.stats = {}
  const now = Date.now()
  const lastSpin = user.stats.rouletteLastSpin ? new Date(user.stats.rouletteLastSpin).getTime() : 0
  const elapsed = now - lastSpin
  const cooldownMs = (60 * 60 * 1000) - elapsed
  if (cooldownMs > 0) {
   return res.status(400).json({ error: "Roulette en recharge.", cooldownMs })
  }

  const lot = pickRouletteLot()
  updateRouletteStatsFromCommand(user, lot, now)
  await applyRouletteRewardFromCommand({ user: { id: String(session.userId) } }, user, lot)
  await addBattlePassXP(session.userId, "roulette_spin")
  recordAction(user, "roulette", now)
  const unlocked = achievementCheck(user, "roulette")

  save(session.userId)
  apiCache.invalidate(`profile:${session.userId}`)
  apiCache.invalidatePrefix("leaderboard:")

  enqueueWebRewardToast(session.userId, {
   type: "event",
   tone: "event",
   title: "🎲 Roulette d'Écaflip",
   subtitle: `${String(lot.emoji || "🎁")} ${String(lot.name || "Lot")}`,
   description: `Rareté: ${String(lot.rarity || "commun")}`,
   rewardText: formatRouletteReward(lot.reward || {}),
   chipLabel: "Gains"
  })

  res.json({
   ok: true,
   lot: {
    id: Number(lot.id || 0),
    name: String(lot.name || "Lot"),
    emoji: String(lot.emoji || "🎁"),
    rarity: String(lot.rarity || "commun")
   },
   rewardText: formatRouletteReward(lot.reward || {}),
   stats: {
    kamas: Number(user.kamas || 0),
    packs: Number(user.packs || 0),
    spins: Number(user.stats.rouletteSpins || 0),
    jackpots: Number(user.stats.rouletteJackpot || 0)
   },
   unlockedAchievements: countUnlockedAchievements(unlocked)
  })
 } catch (e) {
  console.error("[WEB] /api/events/roulette/spin:", e)
  res.status(500).json({ error: "Erreur serveur" })
 }
})

app.get("/api/events/reward-toasts", (req, res) => {
 try {
  const session = requireSession(req, res)
  if (!session) return
  const items = popWebRewardToasts(session.userId, USER_TOASTS_MAX_POP)
  res.json({ ok: true, items })
 } catch (e) {
  console.error("[WEB] /api/events/reward-toasts:", e)
  res.status(500).json({ error: "Erreur serveur" })
 }
})

app.post("/api/events/eventpack/open", async (req, res) => {
 try {
  const session = requireSession(req, res)
  if (!session) return

  const event = getEvent()
  if (!isEventActive() || !event) {
   return res.status(400).json({ error: "Aucun event des dieux n'est actif." })
  }

  const user = getUser(session.userId)
  const setNames = getCardSetNameMap(getSets())
  if (!user.stats) user.stats = {}
  if (!user.cards) user.cards = {}

  initUserEvent(user)
  const check = canUseEventPack(user)
  if (!check?.ok) return res.status(400).json({ error: String(check?.error || "Ticket indisponible.") })

  const isFirstPack = claimFirstPack()
  user.event.used = Number(user.event.used || 0) + 1

  const generated = generateEventPack(user, event)
  const pack = Array.isArray(generated?.pack) ? generated.pack.filter(Boolean) : []
  const meta = generated?.meta || {}
  if (!pack.length) return res.status(400).json({ error: "Pack d'event invalide." })

  const discoveredIds = new Set()
  for (const card of pack) {
   if (!card?.id) continue
   if (!user.cards[card.id] || Number(user.cards[card.id]) <= 0) discoveredIds.add(String(card.id))
  }
  for (const card of pack) {
   if (!card?.id) continue
   user.cards[card.id] = Number(user.cards[card.id] || 0) + 1
  }

  const kamasBeforeEventPack = Number(user.kamas || 0)
  const reward = applyEventRewards(user, pack, event, meta) || {}
  const kamasGainEventPack = Math.max(0, Number(user.kamas || 0) - kamasBeforeEventPack)
  await addBattlePassXP(session.userId, "event_pack")
  registerEventPack(pack)

  let fragment = null
  const rolled = rollFragmentForEvent(0.55)
  if (rolled) {
   grantRolledFragment(session.userId, rolled, "event-web")
   fragment = { cardId: String(rolled.cardId), fragmentNumber: Number(rolled.fragmentNumber || 0) }
  }

  user.stats.eventPacksOpened = Number(user.stats.eventPacksOpened || 0) + 1
  if (!user.stats.eventPacksByClass) user.stats.eventPacksByClass = {}
  user.stats.eventPacksByClass[event.key] = Number(user.stats.eventPacksByClass[event.key] || 0) + 1
  if (!Array.isArray(user.stats.eventsParticipated)) user.stats.eventsParticipated = []
  if (!user.stats.eventsParticipated.includes(event.key)) user.stats.eventsParticipated.push(event.key)
  if (isFirstPack) user.stats.firstEventPacks = Number(user.stats.firstEventPacks || 0) + 1
  if (Number(user.event?.used || 0) >= Number(user.event?.tickets || 0)) {
   user.stats.ticketsFullyUsed = Number(user.stats.ticketsFullyUsed || 0) + 1
   const elapsed = Date.now() - Number(user.event?.startTime || Date.now())
   if (elapsed <= 120000) user.stats.speedTickets = true
  }

  const ssrInPack = pack.filter((card) => String(card?.rarity || "") === "SSR").length
  if (ssrInPack > 0) {
   user.stats.ssrPulled = Number(user.stats.ssrPulled || 0) + ssrInPack
   user.stats.ssrFromEvent = Number(user.stats.ssrFromEvent || 0) + ssrInPack
   if (!user.stats.ssrByClass) user.stats.ssrByClass = {}
   user.stats.ssrByClass[event.key] = Number(user.stats.ssrByClass[event.key] || 0) + ssrInPack
  }
  if (event.key === "enutrof" && meta?.jackpot) user.stats.jackpotEnutrof = Number(user.stats.jackpotEnutrof || 0) + 1
  if (event.key === "feca" && reward?.jackpotMessage) user.stats.jackpotFeca = Number(user.stats.jackpotFeca || 0) + 1

  const groupedHistory = new Map()
  for (const card of pack) {
   if (!card?.id || isSecretCard(card)) continue
   const cardSetId = String(card?.set || "")
   const key = `${card.id}:${card.shiny ? 1 : 0}`
   if (!groupedHistory.has(key)) {
    groupedHistory.set(key, {
     setId: cardSetId,
     setName: String(setNames.get(cardSetId) || cardSetId || event?.name || "Event"),
     itemName: String(card?.name || `Carte ${card.id}`),
     recruitmentName: String(event?.name || "Event Pack"),
     rarity: String(card?.rarity || "C"),
     qty: 0,
     imageUrl: card?.image && card?.set
      ? `/assets/cards/${encodeURIComponent(String(card.set))}/${encodeURIComponent(String(card.image))}`
      : null
    })
   }
   groupedHistory.get(key).qty += 1
  }
  appendRecruitHistoryEntries(user, [...groupedHistory.values()])

  const unlocked = [
   ...achievementCheck(user, "event"),
   ...achievementCheck(user, "fragment"),
   ...achievementCheck(user, "collection"),
   ...achievementCheck(user, "rng")
  ]
  save(session.userId)
  apiCache.invalidate(`profile:${session.userId}`)
  apiCache.invalidatePrefix("leaderboard:")

  /* Journal d'activité : drops S/SSR (eventpack web) */
  for (const card of pack) {
   const rarity = String(card?.rarity || "").toUpperCase()
   if (rarity === "SSR") {
    pushActivity({
     kind: "drop_ssr",
     userId: String(session.userId),
     cardName: String(card?.name || "Carte inconnue"),
     shiny: Boolean(card?.shiny)
    })
   } else if (rarity === "S") {
    pushActivity({
     kind: "drop_s",
     userId: String(session.userId),
     cardName: String(card?.name || "Carte inconnue")
    })
   }
  }

  const cardsPayload = pack.filter((card) => !isSecretCard(card)).map((card, index) => ({
   key: `${card.id}-${index}`,
   cardId: String(card.id),
   cardName: String(card.name || `Carte ${card.id}`),
   rarity: String(card.rarity || "C"),
   set: String(card.set || ""),
   imageUrl: card?.image && card?.set
    ? `/assets/cards/${encodeURIComponent(String(card.set))}/${encodeURIComponent(String(card.image))}`
    : null,
   isNew: discoveredIds.has(String(card.id))
  }))

  const tickets = {
   total: Number(user.event?.tickets || 0),
   used: Number(user.event?.used || 0),
   remaining: Math.max(0, Number(user.event?.tickets || 0) - Number(user.event?.used || 0))
  }

  res.json({
   ok: true,
   event: {
    key: String(event.key),
    name: String(event.name || "Event"),
    jackpotMessage: reward?.jackpotMessage || null,
    voiceLine: buildEventVoiceLine(event, pack)
   },
   tickets,
   gains: {
    kamas: kamasGainEventPack,
    xp: Number(reward?.xp || 0),
    ssrInPack,
    fragment
   },
   cards: cardsPayload,
   unlockedAchievements: countUnlockedAchievements(unlocked)
  })
 } catch (e) {
  console.error("[WEB] /api/events/eventpack/open:", e)
  res.status(500).json({ error: "Erreur serveur" })
 }
})

app.post("/api/events/pinata/react", async (req, res) => {
 try {
  const session = requireSession(req, res)
  if (!session) return
  await ensureWebPinataLifecycle()

  if (!webPinataState.active) {
   return res.status(400).json({
    error: "Aucune piñata active.",
    nextStartAt: webPinataState.nextStartAt
   })
  }

  const emoji = String(req.body?.emoji || "").trim()
  if (!WEB_PINATA_ALLOWED_EMOJIS.includes(emoji)) {
   return res.status(400).json({ error: "Emoji de réaction invalide." })
  }

  const userId = String(session.userId)
  let participant = webPinataState.participants.get(userId)
  if (!participant) {
   participant = {
    totalReactions: 0,
    uniqueEmojis: new Set()
   }
   webPinataState.participants.set(userId, participant)
   const actor = getUser(userId)
   if (actor) {
    recordAction(actor, "pinata", Date.now())
    save(userId)
   }
  }

  if (participant.uniqueEmojis.has(emoji)) {
   return res.status(400).json({ error: "Tu as déjà utilisé cet emoji sur cette piñata." })
  }

  participant.uniqueEmojis.add(emoji)
  participant.totalReactions += 1
  const score = participant.totalReactions + (participant.uniqueEmojis.size * 2)

  res.json({
   ok: true,
   score,
   totalReactions: participant.totalReactions,
   uniqueCount: participant.uniqueEmojis.size,
   participants: webPinataState.participants.size,
   pinata: getWebPinataView(userId)
  })
 } catch (e) {
  console.error("[WEB] /api/events/pinata/react:", e)
  res.status(500).json({ error: "Erreur serveur" })
 }
})

app.get("/api/achievements", (req, res) => {
 try {
   const session = resolveSession(req)
   const connected = Boolean(session)
   const user = connected ? getUser(session.userId) : null
   if (user) ensureAchievementClaimState(user)
   let unlockedSet = new Set((user?.achievements || []).map((id) => String(id)))

   const category = String(req.query.category || "all")
   const safeCategory = ACHIEVEMENT_CATEGORIES.includes(category) ? category : "all"
   if (connected && user && safeCategory === "secret") {
    user.stats = user.stats || {}
    user.stats.viewedSecretAchievements = true
    user.stats.viewedSecretAchievementsCount = Number(user.stats.viewedSecretAchievementsCount || 0) + 1
    achievementCheck(user, "secret")
    save(session.userId)
    unlockedSet = new Set((user.achievements || []).map((id) => String(id)))
   }
   const pendingSet = new Set(getPendingAchievementIds(user))

   let entries = getAchievementsByCategory(safeCategory)
   if (safeCategory === "all") {
    // Les succès secrets verrouillés ne doivent pas fuiter dans la vue globale.
    entries = entries.filter(([id, ach]) => !Boolean(ach?.secret) || unlockedSet.has(String(id)))
   }

   const items = entries
   .map(([id, ach]) => {
     const unlocked = unlockedSet.has(String(id))
     const hidden = Boolean(ach?.secret && !unlocked)
     const reward = getAchievementReward(String(id), ach || {})
     const hintTitle = normalizeUiText(String(ach?.title || ach?.name || "Succès secret")).trim() || "Succès secret"
     const badge = normalizeUiEmoji(ach?.badge, "🏅")
     const progress = hidden ? { current: 0, goal: 1, percent: 0 } : computeAchievementProgress(user, ach, unlocked)

     return {
      id: String(id),
      trigger: hidden ? "secret" : String(ach?.trigger || "other"),
      secret: Boolean(ach?.secret),
      hidden,
      unlocked,
      pendingClaim: !hidden && pendingSet.has(String(id)),
      badge: hidden ? "🔒" : badge,
      name: hidden ? hintTitle : normalizeUiText(String(ach?.name || "Succès")),
      description: hidden ? "Indice: succès secret à découvrir." : normalizeUiText(String(ach?.description || "")),
      title: hidden ? hintTitle : normalizeUiText(String(ach?.title || "")),
      progressCurrent: Math.max(0, Number(progress?.current || 0)),
      progressGoal: Math.max(1, Number(progress?.goal || 1)),
      progressPercent: Math.max(0, Math.min(100, Number(progress?.percent || 0))),
      rewardText: hidden ? "" : normalizeUiText(formatReward(reward)),
      reward: hidden ? null : reward
     }
    })
    .sort((a, b) =>
     Number(b.unlocked) - Number(a.unlocked) ||
     a.trigger.localeCompare(b.trigger, "fr") ||
     a.name.localeCompare(b.name, "fr")
    )

   const unlockedCount = items.filter((x) => x.unlocked).length
   const categories = getAchievementCategoryStats(unlockedSet)
   const pendingByCategory = getPendingAchievementCategoryCounts(user)
   for (const categoryId of Object.keys(categories)) {
    categories[categoryId].pending = Number(pendingByCategory?.[categoryId] || 0)
   }
   if (categories?.secret) {
    // On ne divulgue pas le nombre total de secrets non débloqués.
    categories.secret.total = categories.secret.unlocked
   }

   res.json({
    connected,
    category: safeCategory,
    total: items.length,
    unlocked: unlockedCount,
    pending: pendingSet.size,
    categories,
    items
   })
  } catch (e) {
   console.error("[WEB] /api/achievements:", e)
   res.status(500).json({ error: "Erreur serveur" })
 }
})

app.post("/api/achievements/claim", (req, res) => {
 try {
  const session = requireSession(req, res)
  if (!session) return

  const user = getUser(session.userId)
  ensureAchievementClaimState(user)
  const requestedCategory = String(req.body?.category || "").trim().toLowerCase()
  const safeCategory = ACHIEVEMENT_CATEGORIES.includes(requestedCategory) && requestedCategory !== "all"
   ? requestedCategory
   : null
  if (!safeCategory) {
   return res.status(400).json({ error: "Categorie invalide pour le claim." })
  }

  const claim = claimAchievementRewards(user, { category: safeCategory })

  let newlyUnlocked = []
  if (claim.claimedCount > 0) {
   newlyUnlocked = achievementCheck(user, null)
  }

  const pendingAfter = getPendingAchievementIds(user).length
  save(session.userId)
  apiCache.invalidate(`profile:${session.userId}`)
  apiCache.invalidatePrefix("leaderboard:")

  res.json({
   ok: true,
   claimedCount: claim.claimedCount,
   claimedIds: claim.claimedIds,
   totals: claim.totals,
   baseTotals: claim.baseTotals,
   levelUpTotals: claim.levelUpTotals,
   levelUps: claim.levelUps,
   newlyUnlocked,
   category: safeCategory,
   pending: pendingAfter,
   kamas: Number(user.kamas || 0),
   packs: Number(user.packs || 0)
  })
 } catch (e) {
  console.error("[WEB] /api/achievements/claim:", e)
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

 app.post("/api/market/buy", async (req, res) => {
  try {
   const session = requireSession(req, res)
   if (!session) return

   const listingId = Number(req.body?.listingId)
   if (!Number.isFinite(listingId)) return res.status(400).json({ error: "listingId invalide." })

   const result = buyCard(session.userId, listingId)
   if (result?.error) return res.status(400).json({ error: result.error })
   const sellerId = String(result?.listing?.seller || "")

   const buyer = getUser(session.userId)
   const seller = sellerId ? getUser(sellerId) : null
   const unlocked = [
    ...achievementCheck(buyer, "economy"),
    ...achievementCheck(buyer, "collection"),
    ...achievementCheck(buyer, "pack"),
    ...achievementCheck(buyer, "fragment")
   ]
   const sellerUnlocked = seller
    ? achievementCheck(seller, "economy")
    : []
   if (sellerId) save(sellerId)
   save(session.userId)

   /* Invalidation cache après mutation */
   apiCache.invalidate(`profile:${session.userId}`)
   if (sellerId) apiCache.invalidate(`profile:${sellerId}`)
   apiCache.invalidatePrefix("leaderboard:")

   if (typeof webHooks.onWebMarketBuy === "function") {
    Promise.resolve(webHooks.onWebMarketBuy({
     buyerId: String(session.userId),
     listing: result.listing
    })).catch((error) => {
     console.error("[WEB] onWebMarketBuy hook:", error?.message || error)
    })
   }

   res.json({
    ok: true,
    result,
    unlockedAchievements: countUnlockedAchievements(unlocked),
    sellerUnlockedAchievements: countUnlockedAchievements(sellerUnlocked)
   })
  } catch (e) {
   console.error("[WEB] /api/market/buy:", e)
   res.status(500).json({ error: "Erreur serveur" })
  }
 })

 app.post("/api/market/sell-card", async (req, res) => {
  try {
   const session = requireSession(req, res)
   if (!session) return

   const cardId = String(req.body?.cardId || "").trim()
   const price = Number(req.body?.price)
   if (!cardId) return res.status(400).json({ error: "cardId manquant." })
   if (!Number.isFinite(price) || price <= 0) return res.status(400).json({ error: "Prix invalide." })
   if (price > MAX_PRICE) return res.status(400).json({ error: `Prix max: ${MAX_PRICE.toLocaleString("fr-FR")} kamas.` })

   const result = addListing(session.userId, cardId, price)
   if (result?.error) return res.status(400).json({ error: result.error })

   const user = getUser(session.userId)
   await addBattlePassXP(session.userId, "market_sell")
   const unlocked = achievementCheck(user, "economy")
   save(session.userId)

   res.json({
    ok: true,
    listing: result,
    unlockedAchievements: countUnlockedAchievements(unlocked)
   })
  } catch (e) {
   console.error("[WEB] /api/market/sell-card:", e)
   res.status(500).json({ error: "Erreur serveur" })
  }
 })

 app.post("/api/market/sell-fragment", async (req, res) => {
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
   if (price > MAX_PRICE) return res.status(400).json({ error: `Prix max: ${MAX_PRICE.toLocaleString("fr-FR")} kamas.` })

   const result = addFragmentListing(session.userId, cardId, fragmentNumber, price)
   if (result?.error) return res.status(400).json({ error: result.error })

   const user = getUser(session.userId)
   await addBattlePassXP(session.userId, "market_sell")
   const unlocked = achievementCheck(user, "fragment")
   save(session.userId)

   res.json({
    ok: true,
    listing: result,
    unlockedAchievements: countUnlockedAchievements(unlocked)
   })
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
  const localAvailable = canUseLocalAuth(req)
  const localDisabled = hasLocalAuthDisableSignal(req)
  const localFallback = localAvailable && !localDisabled && (hasLocalAuthSignal(req) || !oauthConfigured())
 if (localFallback) {
  const returnTo = sanitizeReturnPath(req.query.returnTo) || "/play/inventory"
  const localUser = getUser(String(WEB_LOCAL_AUTH_USER_ID))
  if (localUser) {
   recordWebLogin(localUser, Date.now())
   save(String(WEB_LOCAL_AUTH_USER_ID))
  }
  res.setHeader("Set-Cookie", `${WEB_LOCAL_AUTH_COOKIE}=1; Path=/; Max-Age=31536000; SameSite=Lax${isHttpsRequest(req) ? "; Secure" : ""}`)
  return res.redirect(returnTo)
 }

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
 app.get("/play", (req, res) => {
  const session = requireSessionPage(req, res)
  if (!session) return
  return res.sendFile(path.join(PUBLIC_DIR, "Play.html"))
 })
app.get("/play/:tab", (req, res) => {
 const tab = String(req.params.tab || "").toLowerCase()
 if (tab === "packs") {
  const session = requireSessionPage(req, res)
  if (!session) return
  return res.sendFile(path.join(PUBLIC_DIR, "Packs.html"))
 }
 if (tab === "quests") {
  return res.sendFile(path.join(PUBLIC_DIR, "Play.html"))
 }
 const session = requireSessionPage(req, res)
 if (!session) return
  return res.sendFile(path.join(PUBLIC_DIR, "Play.html"))
})
app.get("/krosmoshop", (req, res) => res.sendFile(path.join(PUBLIC_DIR, "Krosmoshop.html")))
app.get("/packs", (req, res) => res.sendFile(path.join(PUBLIC_DIR, "Packs.html")))
app.get("/packs-test", (req, res) => res.sendFile(path.join(PUBLIC_DIR, "Packs.html")))
app.get("/market", (req, res) => res.sendFile(path.join(PUBLIC_DIR, "Market.html")))
app.get("/events", (req, res) => res.sendFile(path.join(PUBLIC_DIR, "Events.html")))
 app.get("/battlepass", (req, res) => res.sendFile(path.join(PUBLIC_DIR, "Battlepass.html")))
 app.get("/guild", (req, res) => res.sendFile(path.join(PUBLIC_DIR, "Guild.html")))
 app.get("/guild/detail/:id", (req, res) => res.sendFile(path.join(PUBLIC_DIR, "GuildDetail.html")))
 app.get("/guild/:id", (req, res) => res.redirect(`/guild/detail/${encodeURIComponent(String(req.params.id || ""))}`))
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
 webLog.info("Demarrage web server: init", {
  requestedPort: port ?? null,
  envPort: process.env.PORT || null,
  nodeEnv: process.env.NODE_ENV || null,
  railwayService: process.env.RAILWAY_SERVICE_ID || null
 })

 const app = createWebApp()
 const parsedPort = Number(port || process.env.PORT || process.env.WEB_PORT || 8080)
 const p = Number.isFinite(parsedPort) && parsedPort > 0 ? parsedPort : 8080
 if (p !== parsedPort) {
  webLog.warn("PORT invalide, fallback 8080", {
   parsedPort: Number.isFinite(parsedPort) ? parsedPort : String(parsedPort),
   rawPort: port || process.env.PORT || process.env.WEB_PORT || null
  })
 }

 startWebPinataLifecycleLoop()
 ensureWebPinataLifecycle().catch((error) => {
  webLog.error("Erreur init lifecycle pinata", { err: error })
 })

 const isProd = String(process.env.NODE_ENV || "").toLowerCase() === "production"
 const listenHost = isProd ? "0.0.0.0" : undefined
 const onListening = () => {
  webLog.info("Web server en ecoute", {
   host: listenHost || "default",
   port: p,
   healthUrl: `http://localhost:${p}/health`
  })
 }
 const server = listenHost
  ? app.listen(p, listenHost, onListening)
  : app.listen(p, onListening)
 server.on("error", (error) => {
  webLog.fatal("Echec listen web server", { err: error, port: p })
 })

 return app
}

module.exports = { createWebApp, startWebServer, setWebHooks, pushActivity }
