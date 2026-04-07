const fs = require("fs")
const path = require("path")

const { CARDS_IMAGES_DIR } = require("./dataManager")
const { getCard, getCards } = require("./cardRegistry")
const { getUser, save } = require("./userSystem")
const { writeAtomic } = require("./seasonService")

const craftLocks = new Set()

let craftableIndexCache = null

function getFragmentsBaseDir() {
 const base = path.join(process.cwd(), "data", "fragments")
 if (!fs.existsSync(base)) fs.mkdirSync(base, { recursive: true })
 return base
}

function getCraftableIndexPath() {
 return path.join(getFragmentsBaseDir(), "craftable_ssrs.json")
}

function getCraftLogsDir() {
 const dir = path.join(getFragmentsBaseDir(), "craft_logs")
 if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
 return dir
}

function getCraftLogPath(userId) {
 return path.join(getCraftLogsDir(), `${userId}.json`)
}

function ensureFragmentStats(user) {
 if (!user.stats) user.stats = {}
 if (user.stats.fragmentsCollected === undefined) user.stats.fragmentsCollected = 0
 if (user.stats.fragmentsSold === undefined) user.stats.fragmentsSold = 0
 if (user.stats.fragmentsCrafted === undefined) user.stats.fragmentsCrafted = 0
 if (!Array.isArray(user.stats.fragmentsCraftedCards)) user.stats.fragmentsCraftedCards = []
 if (!Array.isArray(user.stats.fragmentTitlesUnlocked)) user.stats.fragmentTitlesUnlocked = []
}

function normalizeCardId(cardId) {
 return String(cardId)
}

function isCraftableSSRCard(card) {
 if (!card || card.rarity !== "SSR") return false
 if (card.fragments && card.fragments.craftable === false) return false
 return true
}

function getCraftableSSRCards() {
 return getCards().filter(isCraftableSSRCard)
}

function buildCraftableIndex() {
 const craftableSsrs = getCraftableSSRCards().map((card) => normalizeCardId(card.id))
 const data = {
  generatedAt: new Date().toISOString(),
  craftableSsrs
 }

 writeAtomic(getCraftableIndexPath(), data)
 craftableIndexCache = data
 return data
}

function loadCraftableIndex() {
 if (craftableIndexCache) return craftableIndexCache

 const filePath = getCraftableIndexPath()
 if (!fs.existsSync(filePath)) {
  return buildCraftableIndex()
 }

 try {
  const raw = fs.readFileSync(filePath, "utf8")
  craftableIndexCache = JSON.parse(raw)
  return craftableIndexCache
 } catch (_) {
  return buildCraftableIndex()
 }
}

function getFragmentDisplayName(cardId, fragmentNumber) {
 const card = getCard(cardId)
 if (!card) return `Fragment ${fragmentNumber}/5`
 return `Fragment de ${card.name} ${fragmentNumber}/5`
}

function getFragmentImageKey(fragmentNumber) {
 return `fragment_${fragmentNumber}`
}

function getFragmentImagePath(fragmentNumber) {
 return path.join(CARDS_IMAGES_DIR, "fragments", `fragment_${fragmentNumber}.png`)
}

function getFragmentsForCard(userOrInventory, cardId) {
 const inventory = userOrInventory || {}
 const fragments = Array.isArray(inventory.fragments) ? inventory.fragments : []
 return fragments.filter((fragment) => normalizeCardId(fragment.cardId) === normalizeCardId(cardId))
}

function getDistinctFragmentNumbers(userOrInventory, cardId) {
 return [...new Set(getFragmentsForCard(userOrInventory, cardId).map((fragment) => Number(fragment.fragmentNumber)).filter(Number.isFinite))].sort((a, b) => a - b)
}

function hasAllFragments(userOrInventory, cardId) {
 const numbers = getDistinctFragmentNumbers(userOrInventory, cardId)
 return [1, 2, 3, 4, 5].every((number) => numbers.includes(number))
}

function getMissingFragmentNumbers(userOrInventory, cardId) {
 const owned = getDistinctFragmentNumbers(userOrInventory, cardId)
 return [1, 2, 3, 4, 5].filter((number) => !owned.includes(number))
}

function addFragmentToInventory(userId, { cardId, fragmentNumber, source = "unknown" }) {
 const user = getUser(userId)
 if (!Array.isArray(user.fragments)) user.fragments = []

 const safeNumber = Number(fragmentNumber)
 if (!Number.isInteger(safeNumber) || safeNumber < 1 || safeNumber > 5) {
  throw new Error(`Numero de fragment invalide: ${fragmentNumber}`)
 }

 user.fragments.push({
  cardId: normalizeCardId(cardId),
  fragmentNumber: safeNumber,
  source,
  obtainedAt: new Date().toISOString()
 })

 ensureFragmentStats(user)
 user.stats.fragmentsCollected++

 save(userId)
 return user.fragments[user.fragments.length - 1]
}

function removeFragment(userOrInventory, cardId, fragmentNumber) {
 const inventory = userOrInventory
 if (!Array.isArray(inventory.fragments)) inventory.fragments = []

 const idx = inventory.fragments.findIndex((fragment) =>
  normalizeCardId(fragment.cardId) === normalizeCardId(cardId) &&
  Number(fragment.fragmentNumber) === Number(fragmentNumber)
 )

 if (idx === -1) {
  throw new Error(`Fragment ${fragmentNumber}/5 introuvable pour ${cardId}`)
 }

 return inventory.fragments.splice(idx, 1)[0]
}

function pickRandom(list) {
 return list[Math.floor(Math.random() * list.length)]
}

function getFragmentPoolForSet(setId) {
 const craftable = loadCraftableIndex().craftableSsrs || []
 return craftable.filter((cardId) => {
  const card = getCard(cardId)
  return card && card.set === setId
 })
}

function rollFragmentFromPool(pool, dropRate) {
 if (!Array.isArray(pool) || pool.length === 0) return null
 if (typeof dropRate !== "number" || dropRate <= 0) return null
 if (Math.random() > dropRate) return null

 return {
  cardId: normalizeCardId(pickRandom(pool)),
  fragmentNumber: pickRandom([1, 2, 3, 4, 5])
 }
}

function rollFragmentForSet(setId, dropRate) {
 const pool = getFragmentPoolForSet(setId)
 return rollFragmentFromPool(pool, dropRate)
}

function rollFragmentForEvent(dropRate) {
 const pool = loadCraftableIndex().craftableSsrs || []
 return rollFragmentFromPool(pool, dropRate)
}

function grantRolledFragment(userId, rolledFragment, source = "unknown") {
 if (!rolledFragment) return null
 return addFragmentToInventory(userId, {
  cardId: rolledFragment.cardId,
  fragmentNumber: rolledFragment.fragmentNumber,
  source
 })
}

function getCardCraftProgress(userOrInventory, cardId) {
 const fragments = getFragmentsForCard(userOrInventory, cardId)
 const owned = [...new Set(fragments.map((fragment) => Number(fragment.fragmentNumber)).filter(Number.isFinite))].sort((a, b) => a - b)
 return {
  cardId: normalizeCardId(cardId),
  ownedCount: owned.length,
  totalCount: fragments.length,
  numbers: owned,
  missing: [1, 2, 3, 4, 5].filter((number) => !owned.includes(number)),
  canCraft: owned.length === 5
 }
}

function buildProgressBar(progress) {
 const count = Math.max(0, Math.min(5, progress?.ownedCount || 0))
 return `${"■".repeat(count)}${"□".repeat(5 - count)}`
}

function getFragmentInventoryRows(user) {
 const craftableIds = loadCraftableIndex().craftableSsrs || []
 return craftableIds
  .map((cardId) => {
   const card = getCard(cardId)
   const progress = getCardCraftProgress(user, cardId)
   return {
    cardId,
    card,
    ...progress
   }
  })
  .sort((a, b) => {
   if (b.ownedCount !== a.ownedCount) return b.ownedCount - a.ownedCount
   return String(a.card?.name || a.cardId).localeCompare(String(b.card?.name || b.cardId), "fr")
  })
}

function logCraft(userId, cardId) {
 const filePath = getCraftLogPath(userId)
 let entries = []

 try {
  if (fs.existsSync(filePath)) {
   entries = JSON.parse(fs.readFileSync(filePath, "utf8"))
  }
 } catch (_) {}

 entries.push({
  cardId: normalizeCardId(cardId),
  craftedAt: new Date().toISOString()
 })

 writeAtomic(filePath, entries)
}

async function craftFromFragments(userId, cardId) {
 const safeCardId = normalizeCardId(cardId)
 const user = getUser(userId)
 const card = getCard(safeCardId)

 if (!card) return { ok: false, error: "Carte introuvable." }
 if (!isCraftableSSRCard(card)) return { ok: false, error: "Cette carte n'est pas craftable via fragments." }

 if (craftLocks.has(userId)) {
  return { ok: false, error: "Un craft est deja en cours." }
 }

 craftLocks.add(userId)

 try {
  if (!hasAllFragments(user, safeCardId)) {
   return {
    ok: false,
    error: "Fragments manquants.",
    progress: getCardCraftProgress(user, safeCardId)
   }
  }

  const snapshot = JSON.parse(JSON.stringify(user))

  try {
   for (const number of [1, 2, 3, 4, 5]) {
    removeFragment(user, safeCardId, number)
   }

   if (!user.cards) user.cards = {}
   user.cards[card.id] = (user.cards[card.id] || 0) + 1

   /* ---- Comptabilisation SSR ---- */
   user.stats.ssrPulled       = (user.stats.ssrPulled       || 0) + 1
   user.stats.ssrFromFragments = (user.stats.ssrFromFragments || 0) + 1

   ensureFragmentStats(user)
   user.stats.fragmentsCrafted++
   if (!user.stats.fragmentsCraftedCards.includes(safeCardId)) {
    user.stats.fragmentsCraftedCards.push(safeCardId)
   }

   const title = `Elu de ${card.name}`
   if (!user.titles) user.titles = ["Nouveau"]
   if (!user.titles.includes(title)) user.titles.push(title)
   if (!user.stats.fragmentTitlesUnlocked.includes(title)) {
    user.stats.fragmentTitlesUnlocked.push(title)
   }

   save(userId)
  } catch (error) {
   Object.keys(user).forEach((key) => delete user[key])
   Object.assign(user, snapshot)
   save(userId)
   throw error
  }

  logCraft(userId, safeCardId)

  let bpResult = null
  try {
   const { addBattlePassXP } = require("./battlePassService")
   bpResult = await addBattlePassXP(userId, 500, "manual")
  } catch (_) {}

  return {
   ok: true,
   card,
   titleUnlocked: `Elu de ${card.name}`,
   bpResult,
   progress: getCardCraftProgress(user, safeCardId)
  }
 } finally {
  craftLocks.delete(userId)
 }
}

function getSeasonLinkedSsrs(currentSeason) {
 const seasonId = currentSeason?.activeSeason || currentSeason
 if (!seasonId) return loadCraftableIndex().craftableSsrs || []

 const matched = getCraftableSSRCards()
  .filter((card) => String(card.set || "").toLowerCase().includes(String(seasonId).toLowerCase()))
  .map((card) => normalizeCardId(card.id))

 return matched.length > 0 ? matched : (loadCraftableIndex().craftableSsrs || [])
}

function grantBattlePassFragmentReward(userId, reward, currentSeason = null) {
 const quantity = Math.max(1, Number(reward?.value || reward?.quantity || 1))
 const pool = reward?.pool === "season"
  ? getSeasonLinkedSsrs(currentSeason)
  : (loadCraftableIndex().craftableSsrs || [])

 const granted = []
 for (let i = 0; i < quantity; i++) {
  const rolled = rollFragmentFromPool(pool, 1)
  if (!rolled) continue
  granted.push(grantRolledFragment(userId, rolled, "battlepass"))
 }

 return granted.filter(Boolean)
}

module.exports = {
 addFragmentToInventory,
 buildCraftableIndex,
 buildProgressBar,
 craftFromFragments,
 getCardCraftProgress,
 getCraftableSSRCards,
 getDistinctFragmentNumbers,
 getFragmentDisplayName,
 getFragmentImageKey,
 getFragmentImagePath,
 getFragmentInventoryRows,
 getFragmentPoolForSet,
 getFragmentsForCard,
 getMissingFragmentNumbers,
 getSeasonLinkedSsrs,
 grantBattlePassFragmentReward,
 grantRolledFragment,
 hasAllFragments,
 isCraftableSSRCard,
 loadCraftableIndex,
 removeFragment,
 rollFragmentForEvent,
 rollFragmentForSet,
 rollFragmentFromPool
}
