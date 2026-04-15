function ensureStats(user) {
 if (!user) return {}
 if (!user.stats || typeof user.stats !== "object") user.stats = {}
 return user.stats
}

function getParisParts(ts = Date.now()) {
 const dt = new Date(ts)
 const parts = new Intl.DateTimeFormat("fr-FR", {
  timeZone: "Europe/Paris",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23"
 }).formatToParts(dt)
 const map = Object.fromEntries(parts.map((p) => [p.type, p.value]))
 return {
  year: String(map.year || "1970"),
  month: String(map.month || "01"),
  day: String(map.day || "01"),
  hour: Number(map.hour || 0),
  minute: Number(map.minute || 0),
  second: Number(map.second || 0)
 }
}

function getParisDayKey(ts = Date.now()) {
 const p = getParisParts(ts)
 return `${p.year}-${p.month}-${p.day}`
}

function incrementMapCounter(obj, key, step = 1) {
 if (!obj || typeof obj !== "object") return
 const safeKey = String(key || "").trim()
 if (!safeKey) return
 obj[safeKey] = Number(obj[safeKey] || 0) + Number(step || 0)
}

function recordAction(user, action, ts = Date.now()) {
 const stats = ensureStats(user)
 const safeAction = String(action || "").trim().toLowerCase()
 if (!safeAction) return
 const dayKey = getParisDayKey(ts)

 if (!stats.actionVarietyByDay || typeof stats.actionVarietyByDay !== "object") {
  stats.actionVarietyByDay = {}
 }
 if (!stats.dailyCycleByDay || typeof stats.dailyCycleByDay !== "object") {
  stats.dailyCycleByDay = {}
 }

 if (!stats.actionVarietyByDay[dayKey] || typeof stats.actionVarietyByDay[dayKey] !== "object") {
  stats.actionVarietyByDay[dayKey] = { actions: {}, completed: 0 }
 }
 const varietyBucket = stats.actionVarietyByDay[dayKey]
 if (!varietyBucket.actions || typeof varietyBucket.actions !== "object") varietyBucket.actions = {}
 varietyBucket.actions[safeAction] = 1
 const uniqueActions = Object.keys(varietyBucket.actions).length
 if (uniqueActions >= 5 && !Number(varietyBucket.completed || 0)) {
  varietyBucket.completed = 1
  stats.actionVarietyDays = Number(stats.actionVarietyDays || 0) + 1
 }

 if (!stats.dailyCycleByDay[dayKey] || typeof stats.dailyCycleByDay[dayKey] !== "object") {
  stats.dailyCycleByDay[dayKey] = { daily: 0, pack: 0, sell: 0, done: 0 }
 }
 const cycleBucket = stats.dailyCycleByDay[dayKey]
 if (safeAction === "daily") cycleBucket.daily = 1
 if (safeAction === "pack") cycleBucket.pack = 1
 if (safeAction === "sell") cycleBucket.sell = 1
 if (cycleBucket.daily && cycleBucket.pack && cycleBucket.sell && !Number(cycleBucket.done || 0)) {
  cycleBucket.done = 1
  stats.dailyCycleCount = Number(stats.dailyCycleCount || 0) + 1
 }

 if (!stats.quickComboWindow || typeof stats.quickComboWindow !== "object") {
  stats.quickComboWindow = {}
 }
 if (safeAction === "daily" || safeAction === "roulette" || safeAction === "pinata") {
  stats.quickComboWindow[safeAction] = Number(ts)
  const d = Number(stats.quickComboWindow.daily || 0)
  const r = Number(stats.quickComboWindow.roulette || 0)
  const p = Number(stats.quickComboWindow.pinata || 0)
  if (d > 0 && r > 0 && p > 0) {
   const minTs = Math.min(d, r, p)
   const maxTs = Math.max(d, r, p)
   if (maxTs - minTs <= 120000) {
    stats.tripleAlignment = Number(stats.tripleAlignment || 0) + 1
    stats.quickComboWindow = {}
   }
  }
 }
}

function recordWebLogin(user, ts = Date.now()) {
 const stats = ensureStats(user)
 const prev = Number(stats.siteLastLoginAt || 0)
 stats.sitePrevLoginAt = prev
 stats.siteLastLoginAt = Number(ts)
 stats.siteLogins = Number(stats.siteLogins || 0) + 1
 if (prev > 0 && (Number(ts) - prev) >= (7 * 86400000)) {
  stats.pendingComebackDaily = 1
 }
}

function recordDailyClaim(user, ts = Date.now()) {
 const stats = ensureStats(user)
 const p = getParisParts(ts)
 if (p.hour < 8) stats.dailyMorningClaims = Number(stats.dailyMorningClaims || 0) + 1
 if (p.hour === 0) stats.dailyMidnightClaims = Number(stats.dailyMidnightClaims || 0) + 1
 if ((p.hour === 23 && p.minute === 59 && p.second >= 50) || (p.hour === 0 && p.minute === 0 && p.second <= 10)) {
  stats.dailyNearResetClaims = Number(stats.dailyNearResetClaims || 0) + 1
 }
 const loginAt = Number(stats.siteLastLoginAt || 0)
 if (loginAt > 0 && (Number(ts) - loginAt) <= 120000) {
  stats.fastLoginDailyClaims = Number(stats.fastLoginDailyClaims || 0) + 1
 }
 if (Number(stats.pendingComebackDaily || 0) > 0) {
  stats.comebackDailyClaims = Number(stats.comebackDailyClaims || 0) + 1
  stats.pendingComebackDaily = 0
 }
 recordAction(user, "daily", ts)
}

function recordShopView(user, ts = Date.now()) {
 const stats = ensureStats(user)
 stats.shopPageViews = Number(stats.shopPageViews || 0) + 1
 stats.shopLastViewAt = Number(ts)
}

function recordShopBuy(user, details = {}) {
 const stats = ensureStats(user)
 const now = Number(details.ts || Date.now())
 const rarity = String(details.rarity || "").toUpperCase()
 const finalPrice = Number(details.finalPrice || 0)
 const originalPrice = Number(details.originalPrice || finalPrice)
 const shopSize = Math.max(1, Number(details.shopSize || 15))
 const dayKey = String(details.dayKey || getParisDayKey(now))
 const p = getParisParts(now)

 if (!stats.shopBoughtRarities || typeof stats.shopBoughtRarities !== "object") {
  stats.shopBoughtRarities = {}
 }
 if (rarity) stats.shopBoughtRarities[rarity] = 1

 if (finalPrice < originalPrice) {
  stats.shopDiscountBuys = Number(stats.shopDiscountBuys || 0) + 1
 }
 const viewAt = Number(stats.shopLastViewAt || 0)
 if (viewAt > 0 && (now - viewAt) <= 5000) {
  stats.shopFastBuys = Number(stats.shopFastBuys || 0) + 1
 }
 if (p.hour === 0 && p.minute < 10) {
  stats.shopResetSnipes = Number(stats.shopResetSnipes || 0) + 1
 }

 if (String(stats.shopDayKey || "") !== dayKey) {
  stats.shopDayKey = dayKey
  stats.shopDailyBuyCount = 0
  stats.shopDailyFullClearDone = 0
 }
 stats.shopDailyBuyCount = Number(stats.shopDailyBuyCount || 0) + 1
 if (Number(stats.shopDailyBuyCount || 0) >= shopSize && !Number(stats.shopDailyFullClearDone || 0)) {
  stats.shopDailyFullClearDone = 1
  stats.shopFullClears = Number(stats.shopFullClears || 0) + 1
  stats.shopLastTicketBuys = Number(stats.shopLastTicketBuys || 0) + 1
 }

 recordAction(user, "shop", now)
}

function recordMarketListing(user, cardId, ts = Date.now()) {
 const stats = ensureStats(user)
 stats.marketListingsCreated = Number(stats.marketListingsCreated || 0) + 1
 if (!stats.marketListedCardIds || typeof stats.marketListedCardIds !== "object") {
  stats.marketListedCardIds = {}
 }
 const key = String(cardId || "").trim()
 if (key) stats.marketListedCardIds[key] = 1
 recordAction(user, "market_list", ts)
}

function recordMarketBuy(user, cardId, ts = Date.now()) {
 const stats = ensureStats(user)
 if (!stats.marketLastBoughtAtByCard || typeof stats.marketLastBoughtAtByCard !== "object") {
  stats.marketLastBoughtAtByCard = {}
 }
 const key = String(cardId || "").trim()
 if (key) stats.marketLastBoughtAtByCard[key] = Number(ts)
 recordAction(user, "buy", ts)
}

function recordMarketSale(user, listing, netKamas, ts = Date.now()) {
 const stats = ensureStats(user)
 const now = Number(ts || Date.now())
 stats.marketSalesConfirmed = Number(stats.marketSalesConfirmed || 0) + 1
 stats.marketKamasEarned = Number(stats.marketKamasEarned || 0) + Math.max(0, Number(netKamas || 0))

 const createdAt = Number(listing?.timestamp || 0)
 if (createdAt > 0 && (now - createdAt) <= 60000) {
  stats.marketQuickSales = Number(stats.marketQuickSales || 0) + 1
 }

 const dayKey = getParisDayKey(now)
 if (String(stats.marketSalesDayKey || "") !== dayKey) {
  stats.marketSalesDayKey = dayKey
  stats.marketSalesToday = 0
 }
 stats.marketSalesToday = Number(stats.marketSalesToday || 0) + 1
 stats.maxMarketSalesInDay = Math.max(
  Number(stats.maxMarketSalesInDay || 0),
  Number(stats.marketSalesToday || 0)
 )

 const cardId = String(listing?.card || "").trim()
 if (cardId) {
  const lastBuyMap = stats.marketLastBoughtAtByCard || {}
  const lastBuyAt = Number(lastBuyMap[cardId] || 0)
  if (lastBuyAt > 0 && (now - lastBuyAt) <= 86400000 && Number(netKamas || 0) > 0) {
   stats.marketFlips = Number(stats.marketFlips || 0) + 1
  }
 }

 recordAction(user, "sell", now)
}

function recordMarketRemove(user, ts = Date.now()) {
 const stats = ensureStats(user)
 stats.marketListingsRemoved = Number(stats.marketListingsRemoved || 0) + 1
 recordAction(user, "market_remove", ts)
}

function recordGuildApplication(user) {
 const stats = ensureStats(user)
 stats.guildApplicationsSent = Number(stats.guildApplicationsSent || 0) + 1
}

function recordGuildApplicationReview(user) {
 const stats = ensureStats(user)
 stats.guildApplicationsHandled = Number(stats.guildApplicationsHandled || 0) + 1
}

function recordGuildRecruitment(user) {
 const stats = ensureStats(user)
 stats.guildInvitesAccepted = Number(stats.guildInvitesAccepted || 0) + 1
}

function recordGuildKick(user) {
 const stats = ensureStats(user)
 stats.guildKicks = Number(stats.guildKicks || 0) + 1
}

function recordBattlePassLevelGain(user, levelDelta) {
 const stats = ensureStats(user)
 const gained = Math.max(0, Number(levelDelta || 0))
 if (gained <= 0) return
 stats.bpLevelsGained = Number(stats.bpLevelsGained || 0) + gained
}

function recordBattlePassRewardClaim(user, count, options = {}) {
 const stats = ensureStats(user)
 const safeCount = Math.max(0, Number(count || 0))
 if (safeCount <= 0) return
 stats.bpRewardsClaimed = Number(stats.bpRewardsClaimed || 0) + safeCount
 if (options.all) stats.bpClaimAllUsed = Number(stats.bpClaimAllUsed || 0) + 1

 const now = Date.now()
 const dayKey = getParisDayKey(now)
 if (!stats.bpClaimDays || typeof stats.bpClaimDays !== "object") stats.bpClaimDays = {}
 if (!stats.bpClaimDays[dayKey]) {
  stats.bpClaimDays[dayKey] = 1
  stats.bpClaimDayCount = Number(stats.bpClaimDayCount || 0) + 1
 }

 const seasonEndDate = String(options.seasonEndDate || "").trim()
 if (seasonEndDate && seasonEndDate === dayKey) {
  stats.bpLastDayClaims = Number(stats.bpLastDayClaims || 0) + 1
 }
}

function recordBattlePassPremiumBuy(user) {
 const stats = ensureStats(user)
 stats.bpPremiumBought = Number(stats.bpPremiumBought || 0) + 1
}

function recordProfileView(user) {
 const stats = ensureStats(user)
 stats.profileViews = Number(stats.profileViews || 0) + 1
}

function recordTradeAccepted(fromUser, toUser, ts = Date.now()) {
 const dayKey = getParisDayKey(ts)
 const users = [fromUser, toUser]

 for (const user of users) {
  const stats = ensureStats(user)
  stats.tradeSuccessCount = Number(stats.tradeSuccessCount || 0) + 1
  stats.socialInteractions = Number(stats.socialInteractions || 0) + 1
 }

 const fromStats = ensureStats(fromUser)
 const toStats = ensureStats(toUser)

 if (!fromStats.tradePartners || typeof fromStats.tradePartners !== "object") fromStats.tradePartners = {}
 if (!toStats.tradePartners || typeof toStats.tradePartners !== "object") toStats.tradePartners = {}

 incrementMapCounter(fromStats.tradePartners, toUser?.id || toUser?.userId || "other", 1)
 incrementMapCounter(toStats.tradePartners, fromUser?.id || fromUser?.userId || "other", 1)

 if (!fromStats.tradeDirectionsByDay || typeof fromStats.tradeDirectionsByDay !== "object") fromStats.tradeDirectionsByDay = {}
 if (!toStats.tradeDirectionsByDay || typeof toStats.tradeDirectionsByDay !== "object") toStats.tradeDirectionsByDay = {}

 const fromKey = `${dayKey}:${String(toUser?.id || toUser?.userId || "other")}`
 const toKey = `${dayKey}:${String(fromUser?.id || fromUser?.userId || "other")}`
 fromStats.tradeDirectionsByDay[fromKey] = Number(fromStats.tradeDirectionsByDay[fromKey] || 0) + 1
 toStats.tradeDirectionsByDay[toKey] = Number(toStats.tradeDirectionsByDay[toKey] || 0) + 1
}

module.exports = {
 getParisDayKey,
 recordAction,
 recordWebLogin,
 recordDailyClaim,
 recordShopView,
 recordShopBuy,
 recordMarketListing,
 recordMarketBuy,
 recordMarketSale,
 recordMarketRemove,
 recordGuildApplication,
 recordGuildApplicationReview,
 recordGuildRecruitment,
 recordGuildKick,
 recordBattlePassLevelGain,
 recordBattlePassRewardClaim,
 recordBattlePassPremiumBuy,
 recordProfileView,
 recordTradeAccepted
}
