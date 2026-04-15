const fs = require("fs")
const path = require("path")

const { getBasePath } = require("./paths")
const { createLogger } = require("./logger")
const { writeAtomic, readJsonSafe } = require("./fileUtils")

const log = createLogger("BANLIST")

const BASE = getBasePath()
const BANLIST_PATH = path.join(BASE, "banlist.json")
const BANLIST_SEED_VERSION = 1
const BANLIST_SEED_IDS = [
 "598501812034732032",
 "249870238789795840",
 "95951343591632896",
 "315095114387030016",
 "1107433812239077396",
 "347461215263522828",
 "221995463354744832",
 "1417123692982440090"
]

function normalizeDiscordId(value) {
 const safe = String(value || "").trim()
 if (!/^\d{16,22}$/.test(safe)) return null
 return safe
}

function buildSeedEntry(by = "seed") {
 return {
  at: Date.now(),
  by: String(by || "seed"),
  reason: "Ban Krosmoz"
 }
}

function sanitizeMeta(rawMeta) {
 if (!rawMeta || typeof rawMeta !== "object") return { seedVersion: 0 }
 const seedVersion = Number(rawMeta.seedVersion || 0)
 return {
  seedVersion: Number.isFinite(seedVersion) && seedVersion >= 0 ? Math.floor(seedVersion) : 0
 }
}

function sanitizeEntries(rawEntries) {
 if (!rawEntries || typeof rawEntries !== "object") return {}
 const cleaned = {}

 for (const [rawId, rawEntry] of Object.entries(rawEntries)) {
  const id = normalizeDiscordId(rawId)
  if (!id) continue

  cleaned[id] = {
   at: Number(rawEntry?.at || Date.now()),
   by: String(rawEntry?.by || "unknown"),
   reason: String(rawEntry?.reason || "Ban Krosmoz")
  }
 }

 return cleaned
}

function sanitizeStore(rawStore) {
 return {
  meta: sanitizeMeta(rawStore?.meta),
  entries: sanitizeEntries(rawStore?.entries)
 }
}

const store = sanitizeStore(readJsonSafe(BANLIST_PATH, {
 meta: { seedVersion: 0 },
 entries: {}
}))

function saveStore() {
 try {
  writeAtomic(BANLIST_PATH, store)
 } catch (err) {
  log.error("Erreur sauvegarde banlist", { err })
 }
}

function bootstrapSeedIds() {
 const currentVersion = Number(store.meta?.seedVersion || 0)
 if (currentVersion >= BANLIST_SEED_VERSION) return

 let added = 0
 for (const rawId of BANLIST_SEED_IDS) {
  const id = normalizeDiscordId(rawId)
  if (!id) continue
  if (store.entries[id]) continue
  store.entries[id] = buildSeedEntry("seed")
  added += 1
 }

 store.meta.seedVersion = BANLIST_SEED_VERSION
 saveStore()

 if (added > 0) {
  log.info("Seed banlist applique", { added })
 }
}

if (!fs.existsSync(BANLIST_PATH)) {
 saveStore()
}

bootstrapSeedIds()

log.info("banlist.json charge", {
 total: Object.keys(store.entries).length
})

function isDiscordIdBanned(userId) {
 const id = normalizeDiscordId(userId)
 if (!id) return false
 return Boolean(store.entries[id])
}

function getDiscordBanEntry(userId) {
 const id = normalizeDiscordId(userId)
 if (!id) return null
 const entry = store.entries[id]
 if (!entry) return null
 return {
  userId: id,
  at: Number(entry.at || 0),
  by: String(entry.by || "unknown"),
  reason: String(entry.reason || "Ban Krosmoz")
 }
}

function addDiscordBan(userId, by = "unknown", reason = "Ban Krosmoz") {
 const id = normalizeDiscordId(userId)
 if (!id) {
  return { ok: false, error: "ID Discord invalide." }
 }

 const alreadyBanned = Boolean(store.entries[id])
 store.entries[id] = {
  at: Date.now(),
  by: String(by || "unknown"),
  reason: String(reason || "Ban Krosmoz")
 }
 saveStore()

 return {
  ok: true,
  added: !alreadyBanned,
  entry: getDiscordBanEntry(id)
 }
}

function removeDiscordBan(userId) {
 const id = normalizeDiscordId(userId)
 if (!id) return { ok: false, error: "ID Discord invalide." }
 if (!store.entries[id]) return { ok: true, removed: false }

 delete store.entries[id]
 saveStore()
 return { ok: true, removed: true }
}

function getAllBannedDiscordIds() {
 return Object.keys(store.entries)
}

module.exports = {
 normalizeDiscordId,
 isDiscordIdBanned,
 getDiscordBanEntry,
 addDiscordBan,
 removeDiscordBan,
 getAllBannedDiscordIds
}
