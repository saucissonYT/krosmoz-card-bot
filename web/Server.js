const crypto = require("crypto")
const express = require("express")
const fs = require("fs")
const path = require("path")

const { MAX_PLAYER_LEVEL, PACK_PRICE, FUSION_COST, SELL_PRICE } = require("../systems/constants")
const { getUser, save } = require("../systems/userSystem")
const { addXP } = require("../systems/progressionSystem")
const { getShop, buyFromShop } = require("../systems/krosmoshop")
const { getUserGuildBonuses } = require("../systems/guildBonuses")
const { getPlayerBonuses } = require("../systems/playerBonuses")
const {
 addBattlePassXP,
 buyPremium,
 claimBattlePassLevelReward,
 claimAllBattlePassRewards,
 getBattlePassOverview,
 getBattlePassRewardsView
} = require("../systems/battlePassService")
const { achievementCheck } = require("../systems/achievementCheck")
const { ensureCurrentSeason, getSeasonTemplate } = require("../systems/seasonService")
const { getSeasonSellMultiplier, getSellBonusPercent, computeSellPrice } = require("../systems/sellHelper")
const { sortSetsByDisplayOrder } = require("../systems/setOrder")
const { openPack } = require("../systems/packEngine")
const {
 craftFromFragments,
 rollFragmentForEvent,
 grantRolledFragment
} = require("../systems/fragmentService")
const { isSetUnlocked } = require("../systems/setUnlockSystem")
const {
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
const { getAllGuilds, getUserGuild, getGuildRank } = require("../systems/guildSystem")
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
const rouletteGameplay = require("../commands/joueur/roulette")
const { createRateLimiter } = require("../systems/rateLimiter")
const { apiCache } = require("../systems/apiCache")
const {
 getSchedulerNextRun,
 setSchedulerNextRun
} = require("../systems/schedulerStateStore")
const {
 dbLoadUser,
 dbCountUsers,
 dbLeaderboard,
 dbLoadMarketHistory,
 dbGlobalStats
} = require("../systems/database")

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
const WEB_PINATA_ALLOWED_EMOJIS = ["🪅", "🎉", "⭐", "🔥", "💰", "🌈", "🧩", "🎴"]
const WEB_PINATA_TIERS = [
 { minScore: 1, label: "🥉 Bronze", kamas: [100, 300], xp: 10, bpXp: 30, cardChance: 0, cardPool: [], fragmentChance: 0 },
 { minScore: 5, label: "🥈 Argent", kamas: [300, 700], xp: 25, bpXp: 60, cardChance: 0.25, cardPool: ["C", "U"], fragmentChance: 0 },
 { minScore: 10, label: "🥇 Or", kamas: [700, 1400], xp: 50, bpXp: 100, cardChance: 0.4, cardPool: ["C", "U", "R"], fragmentChance: 0.1 },
 { minScore: 18, label: "💎 Diamant", kamas: [1400, 2500], xp: 100, bpXp: 150, cardChance: 0.55, cardPool: ["C", "U", "R", "SR"], fragmentChance: 0.18 },
 { minScore: 28, label: "🌈 Krosmique", kamas: [2500, 4000], xp: 160, bpXp: 220, cardChance: 0.7, cardPool: ["C", "U", "R", "SR", "UR"], fragmentChance: 0.25 }
]
const WEB_PINATA_MULTIPLIERS = [
 { min: 1, mult: 1.0 },
 { min: 4, mult: 1.25 },
 { min: 8, mult: 1.5 },
 { min: 13, mult: 1.75 },
 { min: 21, mult: 2.0 }
]
const WEB_PINATA_SSR_CHANCE_KROSMIQUE = 0.02

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

/* ── Journal d'activité en mémoire (ring buffer) ── */
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

let BASE = "/data"
if (!fs.existsSync(BASE)) BASE = path.join(process.cwd(), "data")

const CARDS_PATH = path.join(BASE, "cards.json")
const PUBLIC_DIR = path.join(__dirname, "public")
const CARD_IMAGES_RUNTIME_DIR = path.join(BASE, "cards", "images")
const CARD_IMAGES_REPO_DIR = path.join(process.cwd(), "cards", "images")

const DISCORD_USER_TTL_MS = 5 * 60 * 1000
const discordUserCache = new Map()

/* ── Cache données statiques (cards / sets) ── */
const STATIC_CACHE_TTL = 60 * 1000
let _cardsCache = null
let _cardsCacheAt = 0
let _setsCache = null
let _setsCacheAt = 0

/* ── Nettoyage périodique du cache Discord + sessions expirées (toutes les 10 min) ── */
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

function loadUser(userId) {
 return dbLoadUser(userId)
}

function getCards() {
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

 return {
  type: safeType,
  resetIn: safeType === "weekly" ? getNextWeeklyReset() : getNextDailyReset(),
  summary,
  bonus: {
   kamas: Number(bonus?.kamas || 0),
   xp: Number(bonus?.xp || 0),
   packs: Number(bonus?.packs || 0)
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
    packs: Number(quest?.reward?.packs || 0)
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
   emoji: String(guild.emoji || "🏰"),
   rank,
   canClaim,
   level: Number(guild.level || 1),
   xp: Number(guild.xp || 0),
   daily: buildGuildQuestGroup(guild, "daily"),
   weekly: buildGuildQuestGroup(guild, "weekly")
  }
 }
}

function buildPreviewQuestRows(quests = [], scope = "player", memberCount = 6) {
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
      packs: Number(quest?.reward?.packs || 0)
     }
  }
 })
}

function buildQuestPreviewPayload() {
 const playerDailyRows = buildPreviewQuestRows(getDailyQuests().quests, "player")
 const playerWeeklyRows = buildPreviewQuestRows(getWeeklyQuests().quests, "player")
 const guildMemberCount = 6
 const guildDailyRows = buildPreviewQuestRows(getDailyGuildQuests(), "guild", guildMemberCount)
 const guildWeeklyRows = buildPreviewQuestRows(getWeeklyGuildQuests(), "guild", guildMemberCount)

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
     packs: Number(DAILY_BONUS?.packs || 0)
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
     packs: Number(WEEKLY_BONUS?.packs || 0)
    },
    quests: playerWeeklyRows
   }
  },
  guild: {
   id: "preview-guild",
   name: "Guilde Aperçu",
   emoji: "🏰",
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
 res.setHeader("Set-Cookie", `kc_session=; HttpOnly; Path=/; Max-Age=0; SameSite=Strict${isHttpsRequest(req) ? "; Secure" : ""}`)
}

function requireSession(req, res) {
 const session = resolveSession(req)
 if (!session) {
  res.status(401).json({ error: "Connexion Discord requise." })
  return null
 }
 return session
}

function requireSessionPage(req, res) {
 const session = resolveSession(req)
 if (session) return session
 res.redirect("/")
 return null
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

  const res = await fetch(`https://discord.com/api/v10/users/${encodeURIComponent(userId)}`, {
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
 const valid = ["cards", "unique", "kamas", "level", "achievements", "ssr", "packs"]
 if (!valid.includes(category)) return []

 /* Requête SQL directe — instantané, plus besoin de lire tous les fichiers */
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
  pity: sets.map((set) => {
   const p = user.pity?.[set.id] || {}
   return {
    setId: set.id,
    setName: set.name,
    UR:  p.UR  ?? 0,
    S:   p.S   ?? 0,
    SSR: p.SSR ?? 0
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
  packs: Number(user.packs || 0),
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
 const sellMultiplier = getSeasonSellMultiplier()
 const sellBonusPercent = getSellBonusPercent(sellMultiplier)

 const cardItems = Object.entries(user.cards || {})
  .map(([cardId, qty]) => {
   const card = cardsById.get(String(cardId))
   const setId = card?.set || "unknown"
   const rarity = String(card?.rarity || "C").toUpperCase()
   const baseSellPrice = Number(SELL_PRICE[rarity] || 1)
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
    sellPrice: computeSellPrice(baseSellPrice, sellMultiplier),
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

 app.use(express.json({ limit: "50kb" }))
 app.use(express.urlencoded({ extended: false, limit: "50kb" }))

 /* ── Security headers (helmet-like) ── */
 app.use((req, res, next) => {
  res.setHeader("X-Content-Type-Options", "nosniff")
  res.setHeader("X-Frame-Options", "DENY")
  res.setHeader("X-XSS-Protection", "0")
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin")
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()")
  return next()
 })

 /* ── Rate limiter API (100 req/min par IP) ── */
 app.use("/api/", createRateLimiter({ windowMs: 60000, max: 100 }))

 /* ── Rate limiter strict sur POST marché (20 req/min par IP) ── */
 const marketLimiter = createRateLimiter({ windowMs: 60000, max: 20 })
 app.use("/api/market/buy", marketLimiter)
 app.use("/api/market/sell-card", marketLimiter)
 app.use("/api/market/sell-fragment", marketLimiter)
 app.use("/api/market/remove", marketLimiter)
 const gameLimiter = createRateLimiter({ windowMs: 60000, max: 40 })
 app.use("/api/game/", gameLimiter)
 app.use("/api/events/", gameLimiter)

 /* ── CSRF : POST API doit être application/json ── */
 app.use("/api/", (req, res, next) => {
  if (req.method === "POST") {
   const ct = String(req.headers["content-type"] || "")
   if (!ct.includes("application/json")) {
    return res.status(415).json({ error: "Content-Type application/json requis." })
   }
  }
  return next()
 })

 /* ── Health check endpoint ── */
 app.get("/health", (req, res) => {
  const uptime = process.uptime()
  const mem = process.memoryUsage()

  let userCount = 0
  try {
   userCount = dbCountUsers()
  } catch (_) {}

  res.json({
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
  })
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
   emoji: String(tpl?.emoji || "🎟️"),
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
    emoji: String(overview?.seasonTemplate?.emoji || "🎟️"),
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

  if (questId) {
   const single = claimQuest(user, questId, type)
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

   if (completionBonus) {
    totalKamas += Number(bonus?.kamas || 0)
    totalXp += Number(bonus?.xp || 0)
    totalPacks += Number(bonus?.packs || 0)
   }
   claimResult = single
  } else {
   const multi = claimAll(user, type)
   if (Number(multi?.claimedCount || 0) <= 0) {
    return res.status(400).json({ error: "Aucune quête à récupérer." })
   }
   claimedCount = Number(multi.claimedCount || 0)
   completionBonus = Boolean(multi.completionBonus)
   totalKamas = Number(multi.totalKamas || 0)
   totalXp = Number(multi.totalXp || 0)
   totalPacks = Number(multi.totalPacks || 0)
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

  const unlocked = achievementCheck(user, "daily")
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
   const valid = ["cards", "unique", "kamas", "level", "achievements", "ssr", "packs"]
   if (!valid.includes(category)) return res.status(400).json({ error: "Categorie invalide" })
   const blockedLeaderboardNames = new Set(["krosmoz-card", "nouveau"])

   const entries = apiCache.getOrCompute(
    `leaderboard:${category}`,
    () => computeLeaderboard(category),
    60000
   )
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

  res.json({
   packPrice: Number(PACK_PRICE || 0),
   packStock: Number(user.packs || 0),
   unlockedSets,
   fusion
  })
 } catch (e) {
  console.error("[WEB] /api/game/meta:", e)
  res.status(500).json({ error: "Erreur serveur" })
 }
})

app.get("/api/krosmoshop/state", (req, res) => {
 try {
  const session = resolveSession(req)
  const userId = session?.userId || null
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
  const card = cards.find((row) => String(row.id) === cardId)
  if (!card) return res.status(404).json({ error: "Carte introuvable." })

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
  const validSetIds = new Set((sets || []).map((set) => String(set.id)))
  if (!validSetIds.has(setId)) return res.status(400).json({ error: "Set invalide." })
  if (!isSetUnlocked(user, setId, cards)) return res.status(400).json({ error: "Set verrouille pour ce profil." })

  const stock = Number(user.packs || 0)
  if (stock < quantity) return res.status(400).json({ error: "Packs insuffisants." })

  user.packs = stock - quantity
  if (!user.stats) user.stats = {}
  user.stats.packsOpened = Number(user.stats.packsOpened || 0) + quantity
  user.stats.krosmozOpened = Number(user.stats.krosmozOpened || 0) + quantity
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
  const unlocked = achievementCheck(user, "roulette")

  save(session.userId)
  apiCache.invalidate(`profile:${session.userId}`)
  apiCache.invalidatePrefix("leaderboard:")

  res.json({
   ok: true,
   lot: {
    id: Number(lot.id || 0),
    name: String(lot.name || "Lot"),
    emoji: String(lot.emoji || "🎡"),
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

app.post("/api/events/eventpack/open", async (req, res) => {
 try {
  const session = requireSession(req, res)
  if (!session) return

  const event = getEvent()
  if (!isEventActive() || !event) {
   return res.status(400).json({ error: "Aucun event des dieux n'est actif." })
  }

  const user = getUser(session.userId)
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

  const cardsPayload = pack.map((card, index) => ({
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
   const unlockedSet = new Set((user?.achievements || []).map((id) => String(id)))

   const category = String(req.query.category || "all")
   const safeCategory = ACHIEVEMENT_CATEGORIES.includes(category) ? category : "all"
   const entries = getAchievementsByCategory(safeCategory)

   const items = entries
    .map(([id, ach]) => {
     const unlocked = unlockedSet.has(String(id))
     const hidden = Boolean(ach?.secret && !unlocked)
     const reward = getAchievementReward(String(id), ach || {})

     return {
      id: String(id),
      trigger: String(ach?.trigger || "other"),
      secret: Boolean(ach?.secret),
      unlocked,
      badge: hidden ? "❓" : String(ach?.badge || "🏆"),
      name: hidden ? "???" : String(ach?.name || "Succès"),
      description: hidden ? "???" : String(ach?.description || ""),
      title: hidden ? "" : String(ach?.title || ""),
      rewardText: hidden ? "" : formatReward(reward),
      reward: hidden ? null : reward
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
  if (String(req.params.tab || "").toLowerCase() === "quests") {
   return res.sendFile(path.join(PUBLIC_DIR, "Play.html"))
  }
  const session = requireSessionPage(req, res)
  if (!session) return
 return res.sendFile(path.join(PUBLIC_DIR, "Play.html"))
 })
 app.get("/krosmoshop", (req, res) => res.sendFile(path.join(PUBLIC_DIR, "Krosmoshop.html")))
 app.get("/market", (req, res) => res.sendFile(path.join(PUBLIC_DIR, "Market.html")))
 app.get("/events", (req, res) => res.sendFile(path.join(PUBLIC_DIR, "Events.html")))
 app.get("/battlepass", (req, res) => res.sendFile(path.join(PUBLIC_DIR, "Battlepass.html")))
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
 startWebPinataLifecycleLoop()
 ensureWebPinataLifecycle().catch((error) => {
  console.error("[WEB] lifecycle init pinata:", error)
 })

 app.listen(p, "0.0.0.0", () => {
  console.log("\n==============================")
  console.log("   WEB SERVER")
  console.log(`   http://localhost:${p}`)
  console.log("==============================\n")
 })

 return app
}

module.exports = { createWebApp, startWebServer, setWebHooks, pushActivity }
