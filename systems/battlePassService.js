const fs   = require("fs")
const path = require("path")

const { addXP }         = require("./progressionSystem")
const { getUser, save } = require("./userSystem")
const {
 addDaysDateOnly,
 ensureCurrentSeason,
 getBattlePassPaths,
 getSeasonCycle,
 getSeasonTemplate,
 readJson,
 setCurrentSeasonState,
 toDateOnly
} = require("./seasonService")

const {
 dbLoadBattlePassProgress,
 dbSaveBattlePassProgress,
 dbListBattlePassUserIds,
 dbCountBattlePassUsers
} = require("./database")

const claimLocks         = new Set()
const commandCooldown    = new Map()
const COOLDOWN_MS               = 2000
const SEASON_CHECK_THROTTLE_MS  = 5000
const FILE_LOCK_STALE_MS        = 15000
const ENDLESS_XP_STEP           = 900
const ENDLESS_KAMAS_REWARD      = 2500
const ENDLESS_PLAYER_XP_REWARD  = 700
let lastSeasonTransitionCheckAt = 0

/* ─── XP Config ──────────────────────────────────────────────────────────── */

function getXpConfig() {
 const configPath = path.join(process.cwd(), "config", "battlepassXP.json")
 const fallback = {
  schemaVersion: 1,
  sources: {
   daily_claim: 40,
   pack_open:   60,
   fusion:      120,
   market_sell: 20,
   event_pack:  240,
   roulette_spin: 90,
   manual:      0
  }
 }
 if (!fs.existsSync(configPath)) return fallback
 return readJson(configPath, fallback)
}

/* ─── Level maths ────────────────────────────────────────────────────────── */

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
 const last  = xpCurve[xpCurve.length - 1] || 0
 const extra = index - (xpCurve.length - 1)
 return last + (extra * ENDLESS_XP_STEP)
}

function getEndlessRewardForLevel(level) {
 if (level <= 40) return null
 if (level % 2 === 1) return { level, type: "kamas",     value: ENDLESS_KAMAS_REWARD }
 return                        { level, type: "player_xp", value: ENDLESS_PLAYER_XP_REWARD }
}

function syncProgressLevel(progress, season) {
 const computed = computeLevel(progress.totalXP || 0, season.xpCurve || [], null)
 if (computed !== progress.currentLevel) {
  progress.currentLevel = computed
  saveUserProgress(progress)
 }
 return computed
}

/* ─── Progress file paths ───────────────────────────────────────────────── */

function getProgressPath(userId) {
 const paths = getBattlePassPaths()
 return path.join(paths.progress, `${userId}.json`)
}

function createDefaultProgress(userId, seasonId) {
 return {
  schemaVersion: 1,
  userId:   String(userId),
  seasonId,
  totalXP:  0,
  currentLevel: 1,
  hasPremium:   false,
  claimedFree:     [],
  claimedPremium:  [],
  claimedFreeAt:   {},
  claimedPremiumAt:{},
  achievementsUnlocked: [],
  stats: {
   premiumBuys:  0,
   packsOpened:  0,
   fusions:      0,
   dailyClaims:  0,
   marketSales:  0,
   events:       0,
   setsCompleted: 0,
   rareCards:    0,
   rouletteSpins: 0
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
 const fallback = createDefaultProgress(userId, seasonId)

 /* SQLite d'abord */
 const fromDb = dbLoadBattlePassProgress(userId, seasonId)

 if (fromDb) {
  let changed = false

  if (!fromDb.schemaVersion) { fromDb.schemaVersion = 1; changed = true }
  if (!fromDb.stats) { fromDb.stats = fallback.stats; changed = true }
  const statDefaults = { events: 0, setsCompleted: 0, rareCards: 0, rouletteSpins: 0 }
  for (const [k, v] of Object.entries(statDefaults)) {
   if (fromDb.stats[k] === undefined) { fromDb.stats[k] = v; changed = true }
  }
  if (!Array.isArray(fromDb.achievementsUnlocked)) { fromDb.achievementsUnlocked = []; changed = true }
  if (!Array.isArray(fromDb.claimedFree))          { fromDb.claimedFree = [];          changed = true }
  if (!Array.isArray(fromDb.claimedPremium))       { fromDb.claimedPremium = [];        changed = true }
  if (!fromDb.claimedFreeAt || typeof fromDb.claimedFreeAt !== "object" || Array.isArray(fromDb.claimedFreeAt)) {
   fromDb.claimedFreeAt = {}
   changed = true
  }
  if (!fromDb.claimedPremiumAt || typeof fromDb.claimedPremiumAt !== "object" || Array.isArray(fromDb.claimedPremiumAt)) {
   fromDb.claimedPremiumAt = {}
   changed = true
  }
  const migrationTs = fromDb.lastUpdated || new Date().toISOString()
  for (const lvl of fromDb.claimedFree) {
   const key = String(Number(lvl || 0))
   if (!key || key === "0") continue
   if (!fromDb.claimedFreeAt[key]) {
    fromDb.claimedFreeAt[key] = migrationTs
    changed = true
   }
  }
  for (const lvl of fromDb.claimedPremium) {
   const key = String(Number(lvl || 0))
   if (!key || key === "0") continue
   if (!fromDb.claimedPremiumAt[key]) {
    fromDb.claimedPremiumAt[key] = migrationTs
    changed = true
   }
  }

  if (fromDb.seasonId !== seasonId) {
   const migrated = createDefaultProgress(userId, seasonId)
   migrated.hasPremium = false
   dbSaveBattlePassProgress(migrated)
   return migrated
  }

  if (changed) dbSaveBattlePassProgress(fromDb)
  return fromDb
 }

 /* Fallback : essayer l'ancien fichier JSON (période de transition) */
 const filePath = getProgressPath(userId)
 if (fs.existsSync(filePath)) {
  const progress = readJson(filePath, fallback)
  if (!progress.userId)   progress.userId   = String(userId)
  if (!progress.seasonId) progress.seasonId = seasonId
  if (!Array.isArray(progress.claimedFree)) progress.claimedFree = []
  if (!Array.isArray(progress.claimedPremium)) progress.claimedPremium = []
  ensureClaimMaps(progress)
  const migrationTs = progress.lastUpdated || new Date().toISOString()
  for (const lvl of progress.claimedFree) {
   const key = String(Number(lvl || 0))
   if (!key || key === "0") continue
   if (!progress.claimedFreeAt[key]) progress.claimedFreeAt[key] = migrationTs
  }
  for (const lvl of progress.claimedPremium) {
   const key = String(Number(lvl || 0))
   if (!key || key === "0") continue
   if (!progress.claimedPremiumAt[key]) progress.claimedPremiumAt[key] = migrationTs
  }
  /* Migrer vers SQLite automatiquement */
  dbSaveBattlePassProgress(progress)
  return progress
 }

 /* Nouveau joueur : créer dans SQLite */
 dbSaveBattlePassProgress(fallback)
 return fallback
}

function saveUserProgress(progress) {
 progress.lastUpdated = new Date().toISOString()
 dbSaveBattlePassProgress(progress)
}

function ensureClaimMaps(progress) {
 if (!progress.claimedFreeAt || typeof progress.claimedFreeAt !== "object" || Array.isArray(progress.claimedFreeAt)) {
  progress.claimedFreeAt = {}
 }
 if (!progress.claimedPremiumAt || typeof progress.claimedPremiumAt !== "object" || Array.isArray(progress.claimedPremiumAt)) {
  progress.claimedPremiumAt = {}
 }
}

function setClaimedAt(progress, track, level, iso = new Date().toISOString()) {
 ensureClaimMaps(progress)
 const key = String(Number(level || 0))
 if (!key || key === "0") return
 if (track === "premium") {
  if (!progress.claimedPremiumAt[key]) progress.claimedPremiumAt[key] = iso
  return
 }
 if (!progress.claimedFreeAt[key]) progress.claimedFreeAt[key] = iso
}

/* ─── File lock ─────────────────────────────────────────────────────────── */

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
 try { tryCreate(); return true } catch (err) {
  if (err?.code !== "EEXIST") return false
 }
 try {
  const stat = fs.statSync(lockPath)
  if (now - stat.mtimeMs > staleMs) {
   fs.rmSync(lockPath, { force: true }); tryCreate(); return true
  }
 } catch (_) {}
 return false
}

function releaseFileLock(lockPath) {
 try { fs.rmSync(lockPath, { force: true }) } catch (_) {}
}
/* ─── Award reward ───────────────────────────────────────────────────────── */

function awardReward(userId, reward) {
 const user = getUser(userId)
 const { getCards } = require("./cardRegistry")
 const result = { text: "", kamas: 0, packs: 0, xp: 0 }

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

 } else if (reward.type === "pack" || reward.type === "pack_premium") {
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
   const current  = ensureCurrentSeason()
   const progress = getUserProgress(userId, current.activeSeason)
   progress.stats.rareCards = (progress.stats.rareCards || 0) + 1
   saveUserProgress(progress)
  }
  result.text = names.length ? `🃏 Rare x${names.length}: ${names.slice(0, 2).join(", ")}` : "🃏 Carte rare"

 } else if (reward.type === "card_random_ssr") {
  const count = reward.value || 1
  const ssrs  = getCards().filter((c) => c.rarity === "SSR")
  const names = []
  for (let i = 0; i < count; i++) {
   if (!ssrs.length) break
   const card = ssrs[Math.floor(Math.random() * ssrs.length)]
   if (!user.cards) user.cards = {}
   user.cards[card.id] = (user.cards[card.id] || 0) + 1
   names.push(card.name || card.id)
   user.stats = user.stats || {}
   user.stats.ssrPulled        = (user.stats.ssrPulled        || 0) + 1
   user.stats.ssrFromBattlePass = (user.stats.ssrFromBattlePass || 0) + 1
  }
  result.text = names.length ? `🌈 SSR x${names.length}: ${names.slice(0, 2).join(", ")}` : "🌈 Carte SSR"
 }

 else if (reward.type === "fragment_random") {
  const current = ensureCurrentSeason()
  const {
   grantBattlePassFragmentReward,
   getFragmentDisplayName
  } = require("./fragmentService")

  const granted = grantBattlePassFragmentReward(userId, reward, current)
  const names = granted.map((fragment) => getFragmentDisplayName(fragment.cardId, fragment.fragmentNumber))
  result.text = names.length
   ? `🧩 ${names.slice(0, 2).join(", ")}${names.length > 2 ? ` +${names.length - 2}` : ""}`
   : "🧩 Fragment aleatoire"
 }

 save(userId)
 return result
}

/* ─── Claimable rewards ─────────────────────────────────────────────────── */

function getClaimableRewards(progress, season) {
 const claimable = { free: [], premium: [] }

 for (const reward of season.freeRewards || []) {
  if (reward.level <= progress.currentLevel && !progress.claimedFree.includes(reward.level))
   claimable.free.push(reward)
 }

 if (progress.hasPremium) {
  for (const reward of season.premiumRewards || []) {
   if (reward.level <= progress.currentLevel && !progress.claimedPremium.includes(reward.level))
    claimable.premium.push(reward)
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

function getClaimableRewardsForLevel(progress, season, level) {
 const targetLevel = Math.max(1, Math.floor(Number(level || 0)))
 const claimable = getClaimableRewards(progress, season)
 return {
  level: targetLevel,
  free: claimable.free.filter((reward) => Number(reward?.level || 0) === targetLevel),
  premium: claimable.premium.filter((reward) => Number(reward?.level || 0) === targetLevel)
 }
}

/* ─── checkAndUnlockAchievements ────────────────────────────────────────── */

function checkAndUnlockAchievements(progress, season) {
 const newlyUnlocked = []

 function unlock(id) {
  if (!progress.achievementsUnlocked.includes(id)) {
   progress.achievementsUnlocked.push(id)
   newlyUnlocked.push(id)
  }
 }

 const user    = getUser(progress.userId)
 const globals = readJson(getBattlePassPaths().globalAchievements, { achievements: [] }).achievements || []
 const current = ensureCurrentSeason()

 function metricValue(type) {
  if (type === "level")         return progress.currentLevel
  if (type === "premium_buy")   return progress.stats.premiumBuys  || 0
  if (type === "daily_claims")  return progress.stats.dailyClaims  || 0
  if (type === "packs_opened")  return progress.stats.packsOpened  || 0
  if (type === "fusions")       return progress.stats.fusions      || 0
  if (type === "market_sales")  return progress.stats.marketSales  || 0
  if (type === "events")        return progress.stats.events       || 0
  if (type === "roulette_spins")return progress.stats.rouletteSpins || 0
  if (type === "rare_cards")    return user.stats?.rarePulled      || 0
  if (type === "ssr_cards")     return user.stats?.ssrPulled       || 0
  if (type === "shiny_cards")   return user.stats?.shinySSR        || 0
  if (type === "sets_completed")return (user.completedSets || []).length
  if (type === "kamas_earned")  return user.stats?.kamasEarned     || 0
  if (type === "titles_owned")  return (user.titles  || []).length
  if (type === "badges_owned")  return (user.badges  || []).length
  /* FIX all6 — compte les saisons précédentes + la saison courante si niveau ≥ 40 */
  if (type === "all6") {
   const previousCount = (current.previousSeasons || []).length
   const finishedCurrent = progress.currentLevel >= 40 ? 1 : 0
   return previousCount + finishedCurrent
  }
  return 0
 }

 for (const achievement of globals) {
  const value = metricValue(achievement.type)
  if (value >= (achievement.target || 1)) unlock(achievement.id)
 }

 /* Achievements saisonniers — tous les types corrigés */
 const seasonal = season.achievements || []
 for (const achievement of seasonal) {
  let value = 0
  if (achievement.type === "season_level")   value = progress.currentLevel
  if (achievement.type === "season_packs")   value = progress.stats.packsOpened  || 0
  if (achievement.type === "season_daily")   value = progress.stats.dailyClaims  || 0
  if (achievement.type === "season_fusions") value = progress.stats.fusions      || 0
  if (achievement.type === "season_events")  value = progress.stats.events       || 0
  if (achievement.type === "season_sets")    value = progress.stats.setsCompleted || 0
  if (achievement.type === "season_roulette")value = progress.stats.rouletteSpins || 0
  if (value >= (achievement.target || 1)) unlock(achievement.id)
 }

 return newlyUnlocked
}

/* ─── updateActivityStat ────────────────────────────────────────────────── */

function updateActivityStat(progress, source) {
 if (source === "pack_open")   progress.stats.packsOpened  = (progress.stats.packsOpened  || 0) + 1
 if (source === "fusion")      progress.stats.fusions      = (progress.stats.fusions      || 0) + 1
 if (source === "daily_claim") progress.stats.dailyClaims  = (progress.stats.dailyClaims  || 0) + 1
 if (source === "market_sell") progress.stats.marketSales  = (progress.stats.marketSales  || 0) + 1
 if (source === "event_pack")  progress.stats.events       = (progress.stats.events       || 0) + 1
 if (source === "set_complete")progress.stats.setsCompleted = (progress.stats.setsCompleted || 0) + 1
 if (source === "roulette_spin")progress.stats.rouletteSpins = (progress.stats.rouletteSpins || 0) + 1
}

function getSeasonBonusMultiplier(season) {
 if (!season?.passiveBonus) return 1
 if (season.passiveBonus.type === "xp_boost") return season.passiveBonus.value || 1
 return 1
}

/* ─── getAllProgressUserIds ──────────────────────────────────────────────── */

function getAllProgressUserIds() {
 const current = ensureCurrentSeason()

 /* SQLite d'abord */
 const fromDb = dbListBattlePassUserIds(current.activeSeason)
 if (fromDb.length > 0) return fromDb

 /* Fallback fichiers JSON (période de transition) */
 const paths = getBattlePassPaths()
 if (!fs.existsSync(paths.progress)) return []
 return fs.readdirSync(paths.progress)
  .filter((f) => f.endsWith(".json"))
  .map((f) => f.replace(".json", ""))
}

/* ─── autoDistribute + rotate ───────────────────────────────────────────── */

function autoDistributeAllClaimable() {
 const current = ensureCurrentSeason()
 const season  = getSeasonTemplate(current.activeSeason)
 const ids     = getAllProgressUserIds()
 for (const userId of ids) {
  try {
   const progress = getUserProgress(userId, current.activeSeason)
   const claimable = getClaimableRewards(progress, season)
   const claimIso = new Date().toISOString()
   for (const reward of [...claimable.free, ...claimable.premium]) {
    try { awardReward(userId, reward) } catch (_) {}
   }
   progress.claimedFree    = [...new Set([...progress.claimedFree,    ...claimable.free.map((r) => r.level)])]
   progress.claimedPremium = [...new Set([...progress.claimedPremium, ...claimable.premium.map((r) => r.level)])]
   for (const reward of claimable.free) setClaimedAt(progress, "free", reward.level, claimIso)
   for (const reward of claimable.premium) setClaimedAt(progress, "premium", reward.level, claimIso)
   saveUserProgress(progress)
  } catch (_) {}
 }
}

function rotateSeasonIfNeeded() {
 const current = ensureCurrentSeason()
 const cycle   = getSeasonCycle()
 const today   = toDateOnly(new Date())

 if (today <= current.endDate) return { rotated: false, current }

 const nextIndex  = (current.cycleIndex + 1) % cycle.length
 const nextSeason = cycle[nextIndex]
 const next = {
  schemaVersion:  1,
  activeSeason:   nextSeason,
  cycleIndex:     nextIndex,
  startDate:      today,
  endDate:        addDaysDateOnly(today, 21),
  previousSeasons:[...current.previousSeasons, current.activeSeason],
  forcedByDev:    false
 }
 setCurrentSeasonState(next)
 return { rotated: true, current: next }
}

/* ─── checkSeasonTransitions ────────────────────────────────────────────── */

function checkSeasonTransitions(options = {}) {
 const now = Date.now()
 if (!options.force && now - lastSeasonTransitionCheckAt < SEASON_CHECK_THROTTLE_MS) return
 lastSeasonTransitionCheckAt = now
 try { rotateSeasonIfNeeded() } catch (_) {}
}

/* ─── getBattlePassAchievements — enrichi ────────────────────────────────── */

function getBattlePassAchievements(userId) {
 const overview  = getBattlePassOverview(userId)
 const unlocked  = overview.progress.achievementsUnlocked || []
 const current   = ensureCurrentSeason()

 const globalDefs = readJson(getBattlePassPaths().globalAchievements, { achievements: [] }).achievements || []
 const seasonal   = overview.seasonTemplate.achievements || []

 /* ── Enrichir chaque def avec description + type + target ── */
 const mapDef = (a) => ({
  id:          a.id,
  name:        a.name,
  description: a.description || buildDescription(a),
  type:        a.type,
  target:      a.target,
  reward:      a.reward,
  secret:      !!a.secret,
  seasonal:    false,
  unlocked:    unlocked.includes(a.id)
 })

 const mapSeasonal = (a) => ({
  ...mapDef(a),
  seasonal:    true
 })

 return {
  unlocked,
  globals:  globalDefs.map(mapDef),
  seasonal: seasonal.map(mapSeasonal),
  total:    globalDefs.length + seasonal.length,
  season:   current.activeSeason,
  seasonName: overview.seasonTemplate.name,
  seasonEmoji: overview.seasonTemplate.emoji || "✨"
 }
}

/* Génère une description lisible depuis type + target */
function buildDescription(a) {
 const t = a.target || 1
 const map = {
  level:         `Atteindre le niveau ${t} du Battle Pass.`,
  daily_claims:  `Réclamer le daily ${t} fois.`,
  packs_opened:  `Ouvrir ${t} pack(s) via /krosmoz.`,
  fusions:       `Effectuer ${t} fusion(s).`,
  market_sales:  `Vendre ${t} carte(s) sur le marché.`,
  events:        `Ouvrir ${t} pack(s) d'event.`,
  rare_cards:    `Obtenir ${t} carte(s) rare (HR+).`,
  ssr_cards:     `Obtenir ${t} carte(s) SSR 🌈.`,
  shiny_cards:   `Obtenir ${t} SSR Shiny ✨.`,
  sets_completed:`Compléter ${t} set(s) de cartes.`,
  kamas_earned:  `Gagner ${t} kamas au total.`,
  titles_owned:  `Posséder ${t} titre(s).`,
  badges_owned:  `Posséder ${t} badge(s).`,
  premium_buy:   `Acheter le Pass Premium.`,
  all6:          `Terminer les 6 saisons du cycle Battle Pass.`,
  season_level:  `Atteindre le niveau ${t} cette saison.`,
  season_packs:  `Ouvrir ${t} pack(s) cette saison.`,
  season_daily:  `Réclamer le daily ${t} fois cette saison.`,
  season_fusions:`Effectuer ${t} fusion(s) cette saison.`,
  season_events: `Ouvrir ${t} pack(s) d'event cette saison.`,
  season_roulette:`Jouer ${t} fois a la roulette cette saison.`,
  season_sets:   `Compléter ${t} set(s) entier cette saison.`,
 }
 return map[a.type] || a.name
}

/* ─── getBattlePassOverview ─────────────────────────────────────────────── */

function getBattlePassOverview(userId) {
 checkSeasonTransitions()

 const current  = ensureCurrentSeason()
 const season   = getSeasonTemplate(current.activeSeason)
 const progress = getUserProgress(userId, current.activeSeason)
 syncProgressLevel(progress, season)
 const claimable = getClaimableRewards(progress, season)

 const curve        = season.xpCurve || []
 const currentLevel = progress.currentLevel
 const prevCap      = getLevelMinXP(currentLevel, curve)
 const nextCap      = getLevelMinXP(currentLevel + 1, curve)

 return {
  season,
  seasonTemplate: season,
  currentSeason:  current,   /* ← état courant de la saison (startDate, endDate...) */
  progress,
  xpInLevel:     Math.max(0, progress.totalXP - prevCap),
  xpToNextLevel: Math.max(0, nextCap - progress.totalXP),
  claimableCount: claimable.free.length + claimable.premium.length,
  claimable
 }
}

/* ─── getBattlePassRewardsView ──────────────────────────────────────────── */

function getBattlePassRewardsView(userId, page = 1, perPage = 8) {
 const overview    = getBattlePassOverview(userId)
 const season      = overview.seasonTemplate
 const totalLevels = season.totalLevels || 40
 const maxPage     = Math.max(1, Math.ceil(totalLevels / perPage))
 const safePage    = Math.max(1, Math.min(page, maxPage))
 const start       = (safePage - 1) * perPage + 1
 const end         = Math.min(totalLevels, safePage * perPage)

 const rows = []
 for (let level = start; level <= end; level++) {
  const freeRewards    = (season.freeRewards    || []).filter((r) => r.level === level)
  const premiumRewards = (season.premiumRewards || []).filter((r) => r.level === level)
  rows.push({
   level,
   freeRewards,
   premiumRewards,
   free:    freeRewards[0]    || null,
   premium: premiumRewards[0] || null,
   claimedFree:    overview.progress.claimedFree.includes(level),
   claimedPremium: overview.progress.claimedPremium.includes(level),
   claimedFreeAt: (overview.progress.claimedFreeAt && overview.progress.claimedFreeAt[String(level)]) || null,
   claimedPremiumAt: (overview.progress.claimedPremiumAt && overview.progress.claimedPremiumAt[String(level)]) || null
  })
 }

 return { page: safePage, maxPage, rows, totalLevels }
}

/* ─── addBattlePassXP ───────────────────────────────────────────────────── */

async function addBattlePassXP(userId, sourceOrAmount, maybeSource) {
 checkSeasonTransitions()

 if (!userId) return { addedXP: 0, leveledUp: false, error: "userId manquant." }

 const current  = ensureCurrentSeason()
 const season   = getSeasonTemplate(current.activeSeason)
 const progress = getUserProgress(userId, current.activeSeason)
 const cfg      = getXpConfig()

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

 const multiplier  = getSeasonBonusMultiplier(season)
 const finalAmount = Math.floor(amount * multiplier)

 progress.totalXP += finalAmount
 const oldLevel = progress.currentLevel
 const newLevel = computeLevel(progress.totalXP, season.xpCurve || [], null)
 progress.currentLevel = newLevel

 const unlocked = checkAndUnlockAchievements(progress, season)
 saveUserProgress(progress)

 return { addedXP: finalAmount, leveledUp: newLevel > oldLevel, oldLevel, newLevel, unlocked }
}

/* ─── claimAllBattlePassRewards ─────────────────────────────────────────── */

async function claimAllBattlePassRewards(userId) {
 if (!checkCooldown(userId))
  return { ok: false, error: "Cooldown actif. Reessaie dans 2 secondes." }
 if (claimLocks.has(userId))
  return { ok: false, error: "Claim deja en cours." }

 const lockPath = getUserLockPath(userId)
 if (!acquireFileLock(lockPath))
  return { ok: false, error: "Claim deja en cours." }

 claimLocks.add(userId)

 try {
  checkSeasonTransitions({ force: true })

  const current  = ensureCurrentSeason()
  const season   = getSeasonTemplate(current.activeSeason)
  const progress = getUserProgress(userId, current.activeSeason)
  syncProgressLevel(progress, season)

  const claimable = getClaimableRewards(progress, season)
  if (claimable.free.length + claimable.premium.length === 0)
   return { ok: false, error: "Rien a recuperer pour le moment." }

  const totals         = { kamas: 0, packs: 0, xp: 0 }
  const claimedRewards = []
  const claimIso = new Date().toISOString()

  for (const reward of claimable.free) {
   const result = awardReward(userId, reward)
   totals.kamas += result.kamas; totals.packs += result.packs; totals.xp += result.xp
   progress.claimedFree.push(reward.level)
   setClaimedAt(progress, "free", reward.level, claimIso)
   claimedRewards.push({ level: reward.level, text: result.text, track: "free" })
  }

  for (const reward of claimable.premium) {
   const result = awardReward(userId, reward)
   totals.kamas += result.kamas; totals.packs += result.packs; totals.xp += result.xp
   progress.claimedPremium.push(reward.level)
   setClaimedAt(progress, "premium", reward.level, claimIso)
   claimedRewards.push({ level: reward.level, text: result.text, track: "premium" })
  }

  const newlyUnlocked = checkAndUnlockAchievements(progress, season)
  saveUserProgress(progress)

  return {
   ok:   true,
   total: claimedRewards.length,
   totals,
   claimedRewards,
   newlyUnlocked
  }
 } finally {
  claimLocks.delete(userId)
  releaseFileLock(lockPath)
 }
}

async function claimBattlePassLevelReward(userId, level) {
 if (claimLocks.has(userId))
  return { ok: false, error: "Claim deja en cours." }

 const targetLevel = Math.max(1, Math.floor(Number(level || 0)))
 if (!Number.isFinite(targetLevel) || targetLevel <= 0)
  return { ok: false, error: "Palier invalide." }

 const lockPath = getUserLockPath(userId)
 if (!acquireFileLock(lockPath))
  return { ok: false, error: "Claim deja en cours." }

 claimLocks.add(userId)

 try {
  checkSeasonTransitions({ force: true })

  const current  = ensureCurrentSeason()
  const season   = getSeasonTemplate(current.activeSeason)
  const progress = getUserProgress(userId, current.activeSeason)
  syncProgressLevel(progress, season)

  if (targetLevel > Number(progress.currentLevel || 1))
   return { ok: false, error: "Ce palier est verrouille." }

  const claimable = getClaimableRewardsForLevel(progress, season, targetLevel)
  const totalClaimable = claimable.free.length + claimable.premium.length
  if (totalClaimable <= 0)
   return { ok: false, error: "Aucune recompense disponible sur ce palier." }

  const totals = { kamas: 0, packs: 0, xp: 0 }
  const claimedRewards = []
  const claimIso = new Date().toISOString()

  for (const reward of claimable.free) {
   const result = awardReward(userId, reward)
   totals.kamas += result.kamas
   totals.packs += result.packs
   totals.xp += result.xp
   progress.claimedFree.push(reward.level)
   setClaimedAt(progress, "free", reward.level, claimIso)
   claimedRewards.push({ level: reward.level, text: result.text, track: "free" })
  }

  for (const reward of claimable.premium) {
   const result = awardReward(userId, reward)
   totals.kamas += result.kamas
   totals.packs += result.packs
   totals.xp += result.xp
   progress.claimedPremium.push(reward.level)
   setClaimedAt(progress, "premium", reward.level, claimIso)
   claimedRewards.push({ level: reward.level, text: result.text, track: "premium" })
  }

  progress.claimedFree = [...new Set(progress.claimedFree.map((value) => Number(value || 0)).filter((value) => value > 0))]
  progress.claimedPremium = [...new Set(progress.claimedPremium.map((value) => Number(value || 0)).filter((value) => value > 0))]

  const newlyUnlocked = checkAndUnlockAchievements(progress, season)
  saveUserProgress(progress)

  return {
   ok: true,
   level: targetLevel,
   total: claimedRewards.length,
   totals,
   claimedRewards,
   newlyUnlocked
  }
 } finally {
  claimLocks.delete(userId)
  releaseFileLock(lockPath)
 }
}

/* ─── buyPremium ────────────────────────────────────────────────────────── */

async function buyPremium(userId) {
 if (!checkCooldown(userId))
  return { ok: false, error: "Cooldown actif." }

 const lockPath = getUserLockPath(userId)
 if (!acquireFileLock(lockPath))
  return { ok: false, error: "Claim deja en cours." }

 claimLocks.add(userId)

 try {
  checkSeasonTransitions({ force: true })

  const current  = ensureCurrentSeason()
  const season   = getSeasonTemplate(current.activeSeason)
  const progress = getUserProgress(userId, current.activeSeason)
  syncProgressLevel(progress, season)
  const user = getUser(userId)

  if (progress.hasPremium) return { ok: false, error: "Pass premium deja actif." }

  const now = toDateOnly(new Date())
  if (now > current.endDate) return { ok: false, error: "Saison cloturee." }

  if ((user.kamas || 0) < (season.premiumPrice || 18000))
   return { ok: false, error: `Kamas insuffisants (${season.premiumPrice || 18000} requis).` }

  user.kamas -= (season.premiumPrice || 18000)
  progress.hasPremium = true
  progress.stats.premiumBuys = (progress.stats.premiumBuys || 0) + 1

  save(userId)

  const retroRewards = (season.premiumRewards || []).filter((reward) =>
   reward.level <= progress.currentLevel &&
   !progress.claimedPremium.includes(reward.level)
  )

  let retroCount = 0
  const premiumClaimIso = new Date().toISOString()
  for (const reward of retroRewards) {
   try {
    awardReward(userId, reward)
    progress.claimedPremium.push(reward.level)
    setClaimedAt(progress, "premium", reward.level, premiumClaimIso)
    retroCount++
   } catch (err) {
    console.error("[battlepass] retro reward failed:", reward.level, err.message)
   }
  }

  checkAndUnlockAchievements(progress, season)
  saveUserProgress(progress)

  return { ok: true, retroCount, price: season.premiumPrice || 18000 }
 } finally {
  claimLocks.delete(userId)
  releaseFileLock(lockPath)
 }
}

/* ─── Dev tools ──────────────────────────────────────────────────────────── */

function devForceSeason(seasonId) {
 const current = ensureCurrentSeason()
 const cycle   = getSeasonCycle()
 const today   = toDateOnly(new Date())
 const idx     = cycle.indexOf(seasonId)
 if (idx === -1) return { ok: false, error: "Saison inconnue." }
 const next = {
  schemaVersion: 1, activeSeason: seasonId, cycleIndex: idx,
  startDate: today, endDate: addDaysDateOnly(today, 21),
  previousSeasons: current.previousSeasons || [], forcedByDev: true
 }
 setCurrentSeasonState(next)
 return { ok: true, state: next }
}

function devSetLevel(userId, level) {
 const current  = ensureCurrentSeason()
 const season   = getSeasonTemplate(current.activeSeason)
 if (level < 1 || level > 9999) return { ok: false, error: "Niveau invalide." }
 const progress = getUserProgress(userId, current.activeSeason)
 progress.currentLevel = level
 progress.totalXP      = getLevelMinXP(level, season.xpCurve || [])
 saveUserProgress(progress)
 return { ok: true, progress }
}

function devSetXP(userId, totalXP) {
 const current  = ensureCurrentSeason()
 const season   = getSeasonTemplate(current.activeSeason)
 const progress = getUserProgress(userId, current.activeSeason)
 progress.totalXP      = Math.max(0, totalXP)
 progress.currentLevel = computeLevel(progress.totalXP, season.xpCurve || [], null)
 saveUserProgress(progress)
 return { ok: true, progress }
}

function devStatus() {
 const current = ensureCurrentSeason()
 const count   = dbCountBattlePassUsers(current.activeSeason)
 return { current, playersWithProgress: count, progressPath: getBattlePassPaths().progress }
}

function devGivePremium(userId) {
 const current  = ensureCurrentSeason()
 const season   = getSeasonTemplate(current.activeSeason)
 const progress = getUserProgress(userId, current.activeSeason)
 if (progress.hasPremium) return { ok: true, retroCount: 0, already: true }
 progress.hasPremium = true
 let retroCount = 0
 const premiumClaimIso = new Date().toISOString()
 const retroRewards = (season.premiumRewards || []).filter((r) =>
  r.level <= progress.currentLevel && !progress.claimedPremium.includes(r.level)
 )
 for (const reward of retroRewards) {
  try {
   awardReward(userId, reward)
   progress.claimedPremium.push(reward.level)
   setClaimedAt(progress, "premium", reward.level, premiumClaimIso)
   retroCount++
  }
  catch (err) { console.error("[battlepass] devGivePremium reward failed:", err.message) }
 }
 saveUserProgress(progress)
 return { ok: true, retroCount, already: false }
}

function devNextSeason() { return rotateSeasonIfNeeded() }
function devStopSeasonNow() {
 const c = ensureCurrentSeason()
 const yesterday = addDaysDateOnly(toDateOnly(new Date()), -1)
 c.endDate = yesterday; c.forcedByDev = true
 setCurrentSeasonState(c); return { ok: true }
}
function devRestartSeason() {
 const c     = ensureCurrentSeason()
 const today = toDateOnly(new Date())
 c.startDate = today; c.endDate = addDaysDateOnly(today, 21); c.forcedByDev = false
 setCurrentSeasonState(c); return { ok: true }
}
function devResetProgress(userId) {
 const current  = ensureCurrentSeason()
 const progress = createDefaultProgress(userId, current.activeSeason)
 saveUserProgress(progress)
 return { ok: true }
}
async function devClaimAllForUser(userId) { return claimAllBattlePassRewards(userId) }

function runSeasonReset(options = {}) {
 const dryRun  = Boolean(options.dryRun)
 const current = ensureCurrentSeason()
 const cycle   = getSeasonCycle()
 const nextIdx = (current.cycleIndex + 1) % cycle.length
 const ids     = getAllProgressUserIds()
 const seasonTemplate = getSeasonTemplate(current.activeSeason)
 let rewardsToDistribute = 0
 for (const userId of ids) {
  const p = getUserProgress(userId, current.activeSeason)
  const c = getClaimableRewards(p, seasonTemplate)
  rewardsToDistribute += c.free.length + c.premium.length
 }
 const summary = {
  dryRun, currentSeason: current.activeSeason, nextSeason: cycle[nextIdx],
  users: ids.length, rewardsToDistribute, actions: []
 }
 if (dryRun) {
  for (const uid of ids.slice(0, 20)) summary.actions.push(`[DRY-RUN] archive progress/${uid}.json`)
  summary.actions.push("[DRY-RUN] update current_season.json")
  return summary
 }
 autoDistributeAllClaimable()
 const rotate = rotateSeasonIfNeeded()
 summary.rotated  = rotate.rotated
 summary.newState = rotate.current
 return summary
}

/* ─── Exports ────────────────────────────────────────────────────────────── */

module.exports = {
 addBattlePassXP,
 buyPremium,
 checkSeasonTransitions,
 claimBattlePassLevelReward,
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

