const fs = require("fs")
const path = require("path")

const { addXP } = require("./progressionSystem")
const { getUser, save } = require("./userSystem")
const {
 addDaysDateOnly,
 ensureCurrentSeason,
 getBattlePassPaths,
 getSeasonCycle,
 getSeasonTemplate,
 readJson,
 setCurrentSeasonState,
 toDateOnly,
 writeAtomic
} = require("./seasonService")

const claimLocks = new Set()
const commandCooldown = new Map()
const COOLDOWN_MS = 2000
const SEASON_CHECK_THROTTLE_MS = 5000
const FILE_LOCK_STALE_MS = 15000
const ENDLESS_XP_STEP = 900
const ENDLESS_KAMAS_REWARD = 2500
const ENDLESS_PLAYER_XP_REWARD = 700
let lastSeasonTransitionCheckAt = 0

function getXpConfig() {
 const configPath = path.join(process.cwd(), "config", "battlepassXP.json")
 const fallback = {
  schemaVersion: 1,
  sources: {
   daily_claim: 40,
   pack_open: 60,
   fusion: 120,
   market_sell: 20,
   event_pack: 240,
   manual: 0
  }
 }

 if (!fs.existsSync(configPath)) return fallback
 return readJson(configPath, fallback)
}

function computeLevel(totalXP, xpCurve, maxLevel = 40) {
 let level = 1
 for (let i = 0; i < xpCurve.length; i++) {
  if (totalXP >= xpCurve[i]) level = i + 2
  else break
 }

 if (xpCurve.length > 0 && totalXP >= xpCurve[xpCurve.length - 1]) {
  const overflow = totalXP - xpCurve[xpCurve.length - 1]
  level = (xpCurve.length + 1) + Math.floor(overflow / ENDLESS_XP_STEP)
 }

 if (typeof maxLevel === "number" && Number.isFinite(maxLevel) && maxLevel > 0) {
  return Math.min(level, maxLevel)
 }
 return level
}

function getLevelMinXP(level, xpCurve) {
 if (level <= 1) return 0
 const index = level - 2
 if (index < xpCurve.length) return xpCurve[index] || 0
 const last = xpCurve[xpCurve.length - 1] || 0
 const extra = index - (xpCurve.length - 1)
 return last + (extra * ENDLESS_XP_STEP)
}

function getEndlessRewardForLevel(level) {
 if (level <= 40) return null
 if (level % 2 === 1) {
  return { level, type: "kamas", value: ENDLESS_KAMAS_REWARD }
 }
 return { level, type: "player_xp", value: ENDLESS_PLAYER_XP_REWARD }
}

function syncProgressLevel(progress, season) {
 const computed = computeLevel(progress.totalXP || 0, season.xpCurve || [], null)
 if (computed !== progress.currentLevel) {
  progress.currentLevel = computed
  saveUserProgress(progress)
 }
 return computed
}

function getProgressPath(userId) {
 const paths = getBattlePassPaths()
 return path.join(paths.progress, `${userId}.json`)
}

function createDefaultProgress(userId, seasonId) {
 return {
  schemaVersion: 1,
  userId: String(userId),
  seasonId,
  totalXP: 0,
  currentLevel: 1,
  hasPremium: false,
  claimedFree: [],
  claimedPremium: [],
  achievementsUnlocked: [],
  stats: {
   premiumBuys: 0,
   packsOpened: 0,
   fusions: 0,
   dailyClaims: 0,
   marketSales: 0
  },
  lastUpdated: new Date().toISOString()
 }
}

function checkCooldown(userId) {
 const last = commandCooldown.get(userId) || 0
 if (Date.now() - last < COOLDOWN_MS) return false
 commandCooldown.set(userId, Date.now())
 return true
}

function getUserProgress(userId, seasonId) {
 const filePath = getProgressPath(userId)
 const fallback = createDefaultProgress(userId, seasonId)

 if (!fs.existsSync(filePath)) {
  writeAtomic(filePath, fallback)
  return fallback
 }

 const progress = readJson(filePath, fallback)
 let changed = false

 if (!progress.schemaVersion) {
  progress.schemaVersion = 1
  changed = true
 }
 if (!progress.stats) {
  progress.stats = fallback.stats
  changed = true
 }
 if (!Array.isArray(progress.achievementsUnlocked)) {
  progress.achievementsUnlocked = []
  changed = true
 }
 if (!Array.isArray(progress.claimedFree)) {
  progress.claimedFree = []
  changed = true
 }
 if (!Array.isArray(progress.claimedPremium)) {
  progress.claimedPremium = []
  changed = true
 }

 if (progress.seasonId !== seasonId) {
  const migrated = createDefaultProgress(userId, seasonId)
  migrated.hasPremium = false
  writeAtomic(filePath, migrated)
  return migrated
 }

 if (changed) {
  writeAtomic(filePath, progress)
 }

 return progress
}

function saveUserProgress(progress) {
 progress.lastUpdated = new Date().toISOString()
 writeAtomic(getProgressPath(progress.userId), progress)
}

function getUserLockPath(userId) {
 const paths = getBattlePassPaths()
 return path.join(paths.battlepass, `op_${userId}.lock`)
}

function acquireFileLock(lockPath, staleMs = FILE_LOCK_STALE_MS) {
 const now = Date.now()

 function tryCreate() {
  const fd = fs.openSync(lockPath, "wx")
  fs.writeFileSync(fd, String(now), "utf8")
  fs.closeSync(fd)
 }

 try {
  tryCreate()
  return true
 } catch (err) {
  if (err?.code !== "EEXIST") return false
 }

 try {
  const stat = fs.statSync(lockPath)
  if (now - stat.mtimeMs > staleMs) {
   fs.rmSync(lockPath, { force: true })
   tryCreate()
   return true
  }
 } catch (_) {}

 return false
}

function releaseFileLock(lockPath) {
 try {
  fs.rmSync(lockPath, { force: true })
 } catch (_) {}
}

function moveFileSafe(src, dst) {
 try {
  fs.renameSync(src, dst)
  return
 } catch (err) {
  if (!["EXDEV", "EPERM", "EBUSY"].includes(err?.code)) throw err
 }

 fs.copyFileSync(src, dst)
 fs.rmSync(src, { force: true })
}

function awardReward(userId, reward) {
 const user = getUser(userId)
 const { getCards } = require("./cardRegistry")
 const result = {
  text: "",
  kamas: 0,
  packs: 0,
  xp: 0
 }

 if (reward.type === "kamas") {
  const amount = reward.value || 0
  user.kamas = (user.kamas || 0) + amount
  result.kamas += amount
  result.text = `💰 ${amount} kamas`
 } else if (reward.type === "player_xp") {
  const amount = reward.value || 0
  addXP(user, amount)
  result.xp += amount
  result.text = `⭐ ${amount} XP joueur`
 } else if (reward.type === "pack") {
  const amount = reward.value || 1
  user.packs = (user.packs || 0) + amount
  result.packs += amount
  result.text = `📦 ${amount} pack(s)`
 } else if (reward.type === "pack_premium") {
  const amount = reward.value || 1
  user.packs = (user.packs || 0) + amount
  result.packs += amount
  result.text = `📦 ${amount} pack(s)`
 } else if (reward.type === "title") {
  if (!user.titles) user.titles = ["Nouveau"]
  if (!user.titles.includes(reward.value)) user.titles.push(reward.value)
  result.text = `📜 Titre: ${reward.value}`
 } else if (reward.type === "badge") {
  if (!user.badges) user.badges = []
  if (!user.badges.includes(reward.value)) user.badges.push(reward.value)
  result.text = `🏅 Badge: ${reward.value}`
 } else if (reward.type === "card" && reward.cardId) {
  if (!user.cards) user.cards = {}
  user.cards[reward.cardId] = (user.cards[reward.cardId] || 0) + 1
  result.text = `🃏 ${reward.cardId}`
  if (reward.cardId.includes("_exclusive_rare")) {
   const current = ensureCurrentSeason()
   const progress = getUserProgress(userId, current.activeSeason)
   progress.stats.seasonExclusive = (progress.stats.seasonExclusive || 0) + 1
   saveUserProgress(progress)
  }
 } else if (reward.type === "card_random_rare") {
  const count = reward.value || 1
  const rares = getCards().filter((c) => c.rarity === "R")
  const names = []
  for (let i = 0; i < count; i++) {
   if (!rares.length) break
   const card = rares[Math.floor(Math.random() * rares.length)]
   if (!user.cards) user.cards = {}
   user.cards[card.id] = (user.cards[card.id] || 0) + 1
   names.push(card.name || card.id)
   user.stats = user.stats || {}
   user.stats.rarePulled = (user.stats.rarePulled || 0) + 1
   const current = ensureCurrentSeason()
   const progress = getUserProgress(userId, current.activeSeason)
   progress.stats.rareCards = (progress.stats.rareCards || 0) + 1
   saveUserProgress(progress)
  }
  result.text = names.length ? `🃏 Rare x${names.length}: ${names.slice(0, 2).join(", ")}` : "🃏 Carte rare"
 } else if (reward.type === "card_random_ssr") {
  const count = reward.value || 1
  const ssrs = getCards().filter((c) => c.rarity === "SSR")
  const names = []
  for (let i = 0; i < count; i++) {
   if (!ssrs.length) break
   const card = ssrs[Math.floor(Math.random() * ssrs.length)]
   if (!user.cards) user.cards = {}
   user.cards[card.id] = (user.cards[card.id] || 0) + 1
   names.push(card.name || card.id)
   user.stats = user.stats || {}
   user.stats.ssrPulled = (user.stats.ssrPulled || 0) + 1
   user.stats.ssrFromEvent = (user.stats.ssrFromEvent || 0) + 1
  }
  result.text = names.length ? `🌈 SSR x${names.length}: ${names.slice(0, 2).join(", ")}` : "🌈 Carte SSR"
 }

 save(userId)
 return result
}

function getClaimableRewards(progress, season) {
 const claimable = {
  free: [],
  premium: []
 }

 for (const reward of season.freeRewards || []) {
  if (reward.level <= progress.currentLevel && !progress.claimedFree.includes(reward.level)) {
   claimable.free.push(reward)
  }
 }

 if (progress.hasPremium) {
  for (const reward of season.premiumRewards || []) {
   if (reward.level <= progress.currentLevel && !progress.claimedPremium.includes(reward.level)) {
    claimable.premium.push(reward)
   }
  }
 }

 if (progress.currentLevel > 40) {
  for (let level = 41; level <= progress.currentLevel; level++) {
   if (progress.claimedFree.includes(level)) continue
   const reward = getEndlessRewardForLevel(level)
   if (reward) claimable.free.push(reward)
  }
 }

 return claimable
}

function checkAndUnlockAchievements(progress, season) {
 const newlyUnlocked = []

 function unlock(id) {
  if (!progress.achievementsUnlocked.includes(id)) {
   progress.achievementsUnlocked.push(id)
   newlyUnlocked.push(id)
  }
 }

 const user = getUser(progress.userId)
 const globals = readJson(getBattlePassPaths().globalAchievements, { achievements: [] }).achievements || []

 function metricValue(type) {
  if (type === "level") return progress.currentLevel
  if (type === "premium_buy") return progress.stats.premiumBuys || 0
  if (type === "daily_claims") return progress.stats.dailyClaims || 0
  if (type === "packs_opened") return progress.stats.packsOpened || 0
  if (type === "fusions") return progress.stats.fusions || 0
  if (type === "market_sales") return progress.stats.marketSales || 0
  if (type === "events") return progress.stats.events || 0
  if (type === "rare_cards") return user.stats?.rarePulled || 0
  if (type === "ssr_cards") return user.stats?.ssrPulled || 0
  if (type === "shiny_cards") return user.stats?.shinySSR || 0
  if (type === "sets_completed") return (user.completedSets || []).length
  if (type === "kamas_earned") return user.stats?.kamasEarned || 0
  if (type === "titles_owned") return (user.titles || []).length
  if (type === "badges_owned") return (user.badges || []).length
  if (type === "all6") return 0
  return 0
 }

 for (const achievement of globals) {
  const value = metricValue(achievement.type)
  if (value >= (achievement.target || 1)) unlock(achievement.id)
 }

 const seasonal = season.achievements || []
 for (const achievement of seasonal) {
  let value = 0
  if (achievement.type === "season_level") value = progress.currentLevel
  if (achievement.type === "season_packs") value = progress.stats.packsOpened || 0
  if (achievement.type === "season_sets") value = progress.stats.setsCompleted || 0
  if (achievement.type === "season_rare") value = progress.stats.rareCards || 0
  if (achievement.type === "season_exclusive") value = progress.stats.seasonExclusive || 0
  if (value >= (achievement.target || 1)) unlock(achievement.id)
 }

 return newlyUnlocked
}

function updateActivityStat(progress, source) {
 if (source === "pack_open") progress.stats.packsOpened = (progress.stats.packsOpened || 0) + 1
 if (source === "fusion") progress.stats.fusions = (progress.stats.fusions || 0) + 1
 if (source === "daily_claim") progress.stats.dailyClaims = (progress.stats.dailyClaims || 0) + 1
 if (source === "market_sell") progress.stats.marketSales = (progress.stats.marketSales || 0) + 1
 if (source === "event_pack") progress.stats.events = (progress.stats.events || 0) + 1
 if (source === "set_complete") progress.stats.setsCompleted = (progress.stats.setsCompleted || 0) + 1
}

function getSeasonBonusMultiplier(season) {
 if (!season || !season.passiveBonus) return 1
 if (season.passiveBonus.type === "xp_boost") return season.passiveBonus.value || 1
 return 1
}

function autoDistributeAllClaimable() {
 const current = ensureCurrentSeason()
 const season = getSeasonTemplate(current.activeSeason)
 const paths = getBattlePassPaths()
 const files = fs.existsSync(paths.progress) ? fs.readdirSync(paths.progress) : []

 let distributedUsers = 0
 let distributedRewards = 0

 for (const file of files) {
  if (!file.endsWith(".json")) continue
  const userId = file.replace(".json", "")
  const progress = getUserProgress(userId, current.activeSeason)
  const claimable = getClaimableRewards(progress, season)
  const rewards = [...claimable.free, ...claimable.premium]

  if (rewards.length === 0) continue

  for (const reward of claimable.free) {
   awardReward(userId, reward)
   progress.claimedFree.push(reward.level)
   distributedRewards++
  }

  for (const reward of claimable.premium) {
   awardReward(userId, reward)
   progress.claimedPremium.push(reward.level)
   distributedRewards++
  }

  saveUserProgress(progress)
  distributedUsers++
 }

 return { distributedUsers, distributedRewards }
}

function getAllProgressUserIds() {
 const paths = getBattlePassPaths()
 if (!fs.existsSync(paths.progress)) return []
 return fs.readdirSync(paths.progress)
  .filter((f) => f.endsWith(".json"))
  .map((f) => f.replace(".json", ""))
}

function rotateSeasonIfNeeded() {
 const current = ensureCurrentSeason()
 const today = toDateOnly(new Date())

 if (today < current.endDate) return { rotated: false, current }

 const paths = getBattlePassPaths()
 const cycle = getSeasonCycle()
 const archiveKey = `${current.activeSeason}_${current.startDate}`
 const archiveDir = path.join(paths.archive, archiveKey)
 if (!fs.existsSync(archiveDir)) fs.mkdirSync(archiveDir, { recursive: true })

 const files = fs.existsSync(paths.progress) ? fs.readdirSync(paths.progress) : []
 for (const file of files) {
  if (!file.endsWith(".json")) continue
  const src = path.join(paths.progress, file)
  const dst = path.join(archiveDir, file)
  try {
   moveFileSafe(src, dst)
  } catch (err) {
   console.error("[battlepass] archive move failed:", file, err.message)
  }
 }

 const nextIndex = (current.cycleIndex + 1) % cycle.length
 const nextSeasonId = cycle[nextIndex]
 const nextStart = today
 const nextEnd = addDaysDateOnly(nextStart, 21)

 const nextState = {
  schemaVersion: 1,
  activeSeason: nextSeasonId,
  cycleIndex: nextIndex,
  startDate: nextStart,
  endDate: nextEnd,
  previousSeasons: [...(current.previousSeasons || []), archiveKey],
  forcedByDev: false
 }

 setCurrentSeasonState(nextState)
 return { rotated: true, current: nextState }
}

function checkSeasonTransitions(options = {}) {
 const force = Boolean(options.force)
 const now = Date.now()
 if (!force && now - lastSeasonTransitionCheckAt < SEASON_CHECK_THROTTLE_MS) {
  return { skipped: true, autoDistributed: false, rotated: false }
 }
 lastSeasonTransitionCheckAt = now

 const current = ensureCurrentSeason()
 const today = toDateOnly(new Date())
 const autoDate = addDaysDateOnly(current.endDate, -2)

 if (!current.autoDistributedAt && today >= autoDate && today < current.endDate) {
  const summary = autoDistributeAllClaimable()
  current.autoDistributedAt = today
  setCurrentSeasonState(current)
  return { autoDistributed: true, summary, rotated: false }
 }

 const rotated = rotateSeasonIfNeeded()
 return { autoDistributed: false, rotated: rotated.rotated }
}

function devStopSeasonNow() {
 const current = ensureCurrentSeason()
 current.endDate = toDateOnly(new Date())
 current.forcedByDev = true
 setCurrentSeasonState(current)
 const result = checkSeasonTransitions({ force: true })
 return { ok: true, result }
}

function devNextSeason() {
 const current = ensureCurrentSeason()
 const cycle = getSeasonCycle()
 const nextIndex = (current.cycleIndex + 1) % cycle.length
 return devForceSeason(cycle[nextIndex])
}

function devRestartSeason(options = {}) {
 const current = ensureCurrentSeason()
 const seasonId = current.activeSeason
 const today = toDateOnly(new Date())
 const keepProgress = options.keepProgress !== false

 if (!keepProgress) {
  const ids = getAllProgressUserIds()
  for (const userId of ids) {
   const filePath = getProgressPath(userId)
   try {
    fs.rmSync(filePath, { force: true })
   } catch (_) {}
  }
 }

 const next = {
  ...current,
  activeSeason: seasonId,
  startDate: today,
  endDate: addDaysDateOnly(today, 21),
  forcedByDev: true
 }
 setCurrentSeasonState(next)
 return { ok: true, keepProgress, state: next }
}

function devResetProgress(userId) {
 const current = ensureCurrentSeason()
 const empty = createDefaultProgress(userId, current.activeSeason)
 writeAtomic(getProgressPath(userId), empty)
 return { ok: true, progress: empty }
}

async function devClaimAllForUser(userId) {
 return claimAllBattlePassRewards(userId)
}

function runSeasonReset(options = {}) {
 const dryRun = Boolean(options.dryRun)
 const current = ensureCurrentSeason()
 const cycle = getSeasonCycle()
 const nextIndex = (current.cycleIndex + 1) % cycle.length
 const nextSeason = cycle[nextIndex]
 const today = toDateOnly(new Date())

 const ids = getAllProgressUserIds()
 let rewardsToDistribute = 0

 const seasonTemplate = getSeasonTemplate(current.activeSeason)
 for (const userId of ids) {
  const progress = getUserProgress(userId, current.activeSeason)
  const claimable = getClaimableRewards(progress, seasonTemplate)
  rewardsToDistribute += claimable.free.length + claimable.premium.length
 }

 const summary = {
  dryRun,
  currentSeason: current.activeSeason,
  nextSeason,
  users: ids.length,
  rewardsToDistribute,
  actions: []
 }

 if (dryRun) {
  for (const userId of ids.slice(0, 20)) {
   summary.actions.push(`[DRY-RUN] archive progress/${userId}.json`)
  }
  summary.actions.push("[DRY-RUN] update current_season.json")
  return summary
 }

 autoDistributeAllClaimable()
 const rotate = rotateSeasonIfNeeded()
 summary.rotated = rotate.rotated
 summary.newState = rotate.current
 return summary
}

async function addBattlePassXP(userId, sourceOrAmount, maybeSource) {
 checkSeasonTransitions()

 if (!userId) {
  return { addedXP: 0, leveledUp: false, error: "userId manquant." }
 }

 const current = ensureCurrentSeason()
 const season = getSeasonTemplate(current.activeSeason)
 const progress = getUserProgress(userId, current.activeSeason)
 const cfg = getXpConfig()

 let source = maybeSource || "manual"
 let amount = 0

 if (typeof sourceOrAmount === "number") {
  amount = sourceOrAmount
 } else {
  source = sourceOrAmount
  amount = cfg.sources[source] || 0
 }

 if (!amount || amount <= 0) return { addedXP: 0, leveledUp: false, progress }

 updateActivityStat(progress, source)

 const multiplier = getSeasonBonusMultiplier(season)
 const finalAmount = Math.floor(amount * multiplier)

 progress.totalXP += finalAmount
 const oldLevel = progress.currentLevel
 const newLevel = computeLevel(progress.totalXP, season.xpCurve || [], null)
 progress.currentLevel = newLevel

 const unlocked = checkAndUnlockAchievements(progress, season)

 saveUserProgress(progress)

 return {
  addedXP: finalAmount,
  leveledUp: newLevel > oldLevel,
  oldLevel,
  newLevel,
  unlocked
 }
}

async function claimAllBattlePassRewards(userId) {
 if (!checkCooldown(userId)) {
  return { ok: false, error: "Cooldown actif. Reessaie dans 2 secondes." }
 }

 if (claimLocks.has(userId)) {
  return { ok: false, error: "Claim deja en cours." }
 }

 const lockPath = getUserLockPath(userId)
 if (!acquireFileLock(lockPath)) {
  return { ok: false, error: "Claim deja en cours." }
 }

 claimLocks.add(userId)

 try {
  checkSeasonTransitions({ force: true })

  const current = ensureCurrentSeason()
  const season = getSeasonTemplate(current.activeSeason)
  const progress = getUserProgress(userId, current.activeSeason)
  syncProgressLevel(progress, season)
  const claimable = getClaimableRewards(progress, season)

  let freeCount = 0
  let premiumCount = 0
  const claimedRewards = []
  const totals = { kamas: 0, packs: 0, xp: 0 }

  for (const reward of claimable.free) {
   const granted = awardReward(userId, reward)
   progress.claimedFree.push(reward.level)
   freeCount++
   claimedRewards.push({ track: "free", level: reward.level, text: granted.text || reward.type })
   totals.kamas += granted.kamas || 0
   totals.packs += granted.packs || 0
   totals.xp += granted.xp || 0
  }

  for (const reward of claimable.premium) {
   const granted = awardReward(userId, reward)
   progress.claimedPremium.push(reward.level)
   premiumCount++
   claimedRewards.push({ track: "premium", level: reward.level, text: granted.text || reward.type })
   totals.kamas += granted.kamas || 0
   totals.packs += granted.packs || 0
   totals.xp += granted.xp || 0
  }

  saveUserProgress(progress)

  return {
   ok: true,
   freeCount,
   premiumCount,
   total: freeCount + premiumCount,
   claimedRewards,
   totals
  }
 } finally {
  claimLocks.delete(userId)
  releaseFileLock(lockPath)
 }
}

async function buyPremium(userId) {
 if (claimLocks.has(userId)) {
  return { ok: false, error: "Operation deja en cours." }
 }

 const lockPath = getUserLockPath(userId)
 if (!acquireFileLock(lockPath)) {
  return { ok: false, error: "Operation deja en cours." }
 }

 claimLocks.add(userId)

 try {
  checkSeasonTransitions({ force: true })

  const current = ensureCurrentSeason()
  const season = getSeasonTemplate(current.activeSeason)
  const progress = getUserProgress(userId, current.activeSeason)
  syncProgressLevel(progress, season)
  const user = getUser(userId)

  if (progress.hasPremium) return { ok: false, error: "Pass premium deja actif." }

  const now = toDateOnly(new Date())
  if (now > current.endDate) return { ok: false, error: "Saison cloturee." }

  if ((user.kamas || 0) < (season.premiumPrice || 8000)) {
   return { ok: false, error: `Kamas insuffisants (${season.premiumPrice || 8000} requis).` }
  }

  user.kamas -= (season.premiumPrice || 8000)
  progress.hasPremium = true
  progress.stats.premiumBuys = (progress.stats.premiumBuys || 0) + 1

  save(userId)

  const retroRewards = (season.premiumRewards || []).filter((reward) =>
   reward.level <= progress.currentLevel &&
   !progress.claimedPremium.includes(reward.level)
  )

  let retroCount = 0

  for (const reward of retroRewards) {
   try {
    awardReward(userId, reward)
    progress.claimedPremium.push(reward.level)
    retroCount++
   } catch (err) {
    console.error("[battlepass] retro reward failed:", reward.level, err.message)
   }
  }

  checkAndUnlockAchievements(progress, season)
  saveUserProgress(progress)

  return {
   ok: true,
   retroCount,
   price: season.premiumPrice || 8000
  }
 } finally {
  claimLocks.delete(userId)
  releaseFileLock(lockPath)
 }
}

function getBattlePassOverview(userId) {
 checkSeasonTransitions()

 const current = ensureCurrentSeason()
 const season = getSeasonTemplate(current.activeSeason)
 const progress = getUserProgress(userId, current.activeSeason)
 syncProgressLevel(progress, season)
 const claimable = getClaimableRewards(progress, season)

 const curve = season.xpCurve || []
 const currentLevel = progress.currentLevel
 const prevCap = getLevelMinXP(currentLevel, curve)
 const nextCap = getLevelMinXP(currentLevel + 1, curve)

 return {
  season: current,
  seasonTemplate: season,
  progress,
  xpInLevel: Math.max(0, progress.totalXP - prevCap),
  xpToNextLevel: Math.max(0, nextCap - progress.totalXP),
  claimableCount: claimable.free.length + claimable.premium.length,
  claimable
 }
}

function getBattlePassRewardsView(userId, page = 1, perPage = 8) {
 const overview = getBattlePassOverview(userId)
 const season = overview.seasonTemplate
 const totalLevels = season.totalLevels || 40
 const maxPage = Math.max(1, Math.ceil(totalLevels / perPage))
 const safePage = Math.max(1, Math.min(page, maxPage))
 const start = (safePage - 1) * perPage + 1
 const end = Math.min(totalLevels, safePage * perPage)

 const rows = []
 for (let level = start; level <= end; level++) {
  const freeRewards = (season.freeRewards || []).filter((r) => r.level === level)
  const premiumRewards = (season.premiumRewards || []).filter((r) => r.level === level)

  rows.push({
   level,
   freeRewards,
   premiumRewards,
   free: freeRewards[0] || null,
   premium: premiumRewards[0] || null,
   claimedFree: overview.progress.claimedFree.includes(level),
   claimedPremium: overview.progress.claimedPremium.includes(level)
  })
 }

 return {
  page: safePage,
  maxPage,
  rows,
  totalLevels
 }
}

function getBattlePassAchievements(userId) {
 const overview = getBattlePassOverview(userId)
 const unlocked = overview.progress.achievementsUnlocked || []

 const globalDefs = readJson(getBattlePassPaths().globalAchievements, { achievements: [] }).achievements || []
 const seasonal = overview.seasonTemplate.achievements || []

 const combined = [
  ...globalDefs.map((a) => ({ id: a.id, name: a.name })),
  ...seasonal.map((a) => ({ id: a.id, name: a.name }))
 ]

 return {
  unlocked,
  total: combined.length,
  entries: combined.map((entry) => ({
   ...entry,
   unlocked: unlocked.includes(entry.id)
  }))
 }
}

function devForceSeason(seasonId) {
 const current = ensureCurrentSeason()
 const cycle = getSeasonCycle()
 const idx = cycle.indexOf(seasonId)
 if (idx === -1) return { ok: false, error: "Saison inconnue." }

 const today = toDateOnly(new Date())
 const next = {
  schemaVersion: 1,
  activeSeason: seasonId,
  cycleIndex: idx,
  startDate: today,
  endDate: addDaysDateOnly(today, 21),
  previousSeasons: current.previousSeasons || [],
  forcedByDev: true
 }

 setCurrentSeasonState(next)
 return { ok: true, state: next }
}

function devSetLevel(userId, level) {
 const current = ensureCurrentSeason()
 const season = getSeasonTemplate(current.activeSeason)
 if (level < 1 || level > 9999) {
  return { ok: false, error: "Niveau invalide." }
 }

 const progress = getUserProgress(userId, current.activeSeason)
 const curve = season.xpCurve || []
 progress.currentLevel = level
 progress.totalXP = getLevelMinXP(level, curve)
 saveUserProgress(progress)
 return { ok: true, progress }
}

function devSetXP(userId, totalXP) {
 const current = ensureCurrentSeason()
 const season = getSeasonTemplate(current.activeSeason)
 const progress = getUserProgress(userId, current.activeSeason)
 progress.totalXP = Math.max(0, totalXP)
 progress.currentLevel = computeLevel(progress.totalXP, season.xpCurve || [], null)
 saveUserProgress(progress)
 return { ok: true, progress }
}

function devStatus() {
 const current = ensureCurrentSeason()
 const paths = getBattlePassPaths()
 const progressFiles = fs.existsSync(paths.progress) ? fs.readdirSync(paths.progress).filter((f) => f.endsWith(".json")) : []
 return {
  current,
  playersWithProgress: progressFiles.length,
  progressPath: paths.progress
 }
}

function devGivePremium(userId) {
 const current = ensureCurrentSeason()
 const season = getSeasonTemplate(current.activeSeason)
 const progress = getUserProgress(userId, current.activeSeason)

 if (progress.hasPremium) {
  return { ok: true, retroCount: 0, already: true }
 }

 progress.hasPremium = true
 let retroCount = 0

 const retroRewards = (season.premiumRewards || []).filter((reward) =>
  reward.level <= progress.currentLevel &&
  !progress.claimedPremium.includes(reward.level)
 )

 for (const reward of retroRewards) {
  try {
   awardReward(userId, reward)
   progress.claimedPremium.push(reward.level)
   retroCount++
  } catch (err) {
   console.error("[battlepass] devGivePremium reward failed:", err.message)
  }
 }

 saveUserProgress(progress)
 return { ok: true, retroCount, already: false }
}

module.exports = {
 addBattlePassXP,
 buyPremium,
 checkSeasonTransitions,
  claimAllBattlePassRewards,
  computeLevel,
  getEndlessRewardForLevel,
  devForceSeason,
  devGivePremium,
  devNextSeason,
  devStopSeasonNow,
  devRestartSeason,
  devResetProgress,
  devClaimAllForUser,
  devSetLevel,
  devSetXP,
  devStatus,
  getBattlePassAchievements,
  getBattlePassOverview,
  getBattlePassRewardsView,
  getUserProgress,
  runSeasonReset,
  saveUserProgress
}
