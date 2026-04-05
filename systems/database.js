/* ═══════════════════════════════════════════════════════════════
   DATABASE — systems/database.js

   Couche SQLite avec better-sqlite3 (synchrone).
   Remplace les fichiers JSON pour users et market.

   Installation requise :
     npm install better-sqlite3

   Usage :
     const { getDb, closeDb } = require("./database")
     const db = getDb()
     const row = db.prepare("SELECT * FROM users WHERE id = ?").get(userId)

   Les cards, devs, guilds, battlepass restent en JSON (pas d'impact perf).
   Seuls les users et le market migrent vers SQLite.
═══════════════════════════════════════════════════════════════ */

const path    = require("path")
const { getBasePath } = require("./paths")
const { createLogger } = require("./logger")

const log = createLogger("DB")

let _db = null

/**
 * Retourne l'instance SQLite (singleton).
 * Crée la BDD et les tables au premier appel.
 * @returns {import("better-sqlite3").Database}
 */
function getDb() {
 if (_db) return _db

 const Database = require("better-sqlite3")
 const dbPath   = path.join(getBasePath(), "krosmoz.db")

 _db = new Database(dbPath)

 /* Performance : WAL mode + synchronous NORMAL */
 _db.pragma("journal_mode = WAL")
 _db.pragma("synchronous = NORMAL")
 _db.pragma("cache_size = -8000")    /* 8 MB cache */
 _db.pragma("busy_timeout = 5000")

 createTables(_db)

 log.info("SQLite connecté", { path: dbPath })

 return _db
}

/**
 * Ferme proprement la BDD (pour graceful shutdown).
 */
function closeDb() {
 if (_db) {
  _db.close()
  _db = null
  log.info("SQLite fermé")
 }
}

/* ═══════════════════════════════════════════════
   SCHEMA
═══════════════════════════════════════════════ */

function createTables(db) {

 db.exec(`

  /* ── USERS ─────────────────────────────────── */
  CREATE TABLE IF NOT EXISTS users (
   id              TEXT PRIMARY KEY,
   data            TEXT NOT NULL,
   kamas           INTEGER DEFAULT 0,
   level           INTEGER DEFAULT 1,
   total_cards     INTEGER DEFAULT 0,
   unique_cards    INTEGER DEFAULT 0,
   achievements    INTEGER DEFAULT 0,
   packs_opened    INTEGER DEFAULT 0,
   ssr_count       INTEGER DEFAULT 0,
   title           TEXT DEFAULT 'Nouveau',
   guild_id        TEXT,
   updated_at      INTEGER DEFAULT 0
  );

  CREATE INDEX IF NOT EXISTS idx_users_kamas       ON users(kamas DESC);
  CREATE INDEX IF NOT EXISTS idx_users_level       ON users(level DESC);
  CREATE INDEX IF NOT EXISTS idx_users_total_cards ON users(total_cards DESC);
  CREATE INDEX IF NOT EXISTS idx_users_unique_cards ON users(unique_cards DESC);
  CREATE INDEX IF NOT EXISTS idx_users_achievements ON users(achievements DESC);
  CREATE INDEX IF NOT EXISTS idx_users_packs       ON users(packs_opened DESC);
  CREATE INDEX IF NOT EXISTS idx_users_ssr         ON users(ssr_count DESC);

  /* ── MARKET ────────────────────────────────── */
  CREATE TABLE IF NOT EXISTS market (
   id              INTEGER PRIMARY KEY AUTOINCREMENT,
   seller          TEXT NOT NULL,
   card            TEXT NOT NULL,
   price           INTEGER NOT NULL,
   type            TEXT DEFAULT 'card',
   fragment_number INTEGER,
   timestamp       INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_market_seller ON market(seller);
  CREATE INDEX IF NOT EXISTS idx_market_card   ON market(card);

  /* ── MARKET HISTORY ────────────────────────── */
  CREATE TABLE IF NOT EXISTS market_history (
   id              INTEGER PRIMARY KEY AUTOINCREMENT,
   seller          TEXT NOT NULL,
   buyer           TEXT NOT NULL,
   card            TEXT NOT NULL,
   price           INTEGER NOT NULL,
   type            TEXT DEFAULT 'card',
   fragment_number INTEGER,
   timestamp       INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_mh_timestamp ON market_history(timestamp DESC);

  /* ── META (migration tracking) ─────────────── */
  CREATE TABLE IF NOT EXISTS meta (
   key   TEXT PRIMARY KEY,
   value TEXT
  );

 `)
}

/* ═══════════════════════════════════════════════
   PREPARED STATEMENTS (lazy, cached)
═══════════════════════════════════════════════ */

const _stmts = {}

function stmt(key, sql) {
 if (!_stmts[key]) {
  _stmts[key] = getDb().prepare(sql)
 }
 return _stmts[key]
}

/* ── Users ── */

function dbLoadUser(id) {
 const row = stmt("loadUser",
  "SELECT data FROM users WHERE id = ?"
 ).get(id)
 return row ? JSON.parse(row.data) : null
}

function dbSaveUser(id, user, cardsDefs) {
 const clone = JSON.parse(JSON.stringify(user))
 delete clone._dirty

 /* Calculer les colonnes indexées */
 const totalCards  = Object.values(clone.cards || {}).reduce((a, b) => a + b, 0)
 const uniqueCards = Object.keys(clone.cards || {}).length

 let ssrCount = 0
 if (cardsDefs && cardsDefs.length > 0) {
  const ssrIds = new Set()
  for (const c of cardsDefs) {
   if (c.rarity === "SSR") ssrIds.add(String(c.id))
  }
  for (const [cardId, qty] of Object.entries(clone.cards || {})) {
   if (ssrIds.has(String(cardId))) ssrCount += qty
  }
 }

 stmt("saveUser", `
  INSERT OR REPLACE INTO users
   (id, data, kamas, level, total_cards, unique_cards, achievements, packs_opened, ssr_count, title, guild_id, updated_at)
  VALUES
   (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
 `).run(
  id,
  JSON.stringify(clone),
  clone.kamas || 0,
  clone.progression?.level || 1,
  totalCards,
  uniqueCards,
  Array.isArray(clone.achievements) ? clone.achievements.length : 0,
  clone.stats?.packsOpened || 0,
  ssrCount,
  clone.title || "Nouveau",
  clone.guildId || null,
  Date.now()
 )
}

function dbDeleteUser(id) {
 stmt("deleteUser", "DELETE FROM users WHERE id = ?").run(id)
}

function dbListUserIds() {
 return getDb().prepare("SELECT id FROM users").all().map(r => r.id)
}

function dbCountUsers() {
 return getDb().prepare("SELECT COUNT(*) as c FROM users").get().c
}

/* ── Leaderboard (SQL direct — ultra rapide) ── */

function dbLeaderboard(category, limit = 100) {
 const columnMap = {
  cards:        "total_cards",
  unique:       "unique_cards",
  kamas:        "kamas",
  level:        "level",
  achievements: "achievements",
  packs:        "packs_opened",
  ssr:          "ssr_count"
 }

 const column = columnMap[category]
 if (!column) return []

 return getDb().prepare(`
  SELECT id AS userId, ${column} AS value, level, title
  FROM users
  WHERE ${column} > 0
  ORDER BY ${column} DESC
  LIMIT ?
 `).all(limit)
}

/* ── Market ── */

function dbLoadMarket() {
 return getDb().prepare("SELECT * FROM market ORDER BY timestamp DESC").all().map(row => ({
  id:             row.id,
  seller:         row.seller,
  card:           row.card,
  price:          row.price,
  type:           row.type,
  fragmentNumber: row.fragment_number,
  timestamp:      row.timestamp
 }))
}

function dbAddMarketListing(listing) {
 const result = stmt("addListing", `
  INSERT INTO market (seller, card, price, type, fragment_number, timestamp)
  VALUES (?, ?, ?, ?, ?, ?)
 `).run(
  listing.seller,
  String(listing.card),
  listing.price,
  listing.type || "card",
  listing.fragmentNumber || null,
  listing.timestamp || Date.now()
 )
 return result.lastInsertRowid
}

function dbRemoveMarketListing(id) {
 stmt("removeListing", "DELETE FROM market WHERE id = ?").run(id)
}

function dbGetMarketListingById(id) {
 const row = getDb().prepare("SELECT * FROM market WHERE id = ?").get(id)
 if (!row) return null
 return {
  id:             row.id,
  seller:         row.seller,
  card:           row.card,
  price:          row.price,
  type:           row.type,
  fragmentNumber: row.fragment_number,
  timestamp:      row.timestamp
 }
}

function dbGetUserListings(userId) {
 return getDb().prepare("SELECT * FROM market WHERE seller = ?").all(userId).map(row => ({
  id:             row.id,
  seller:         row.seller,
  card:           row.card,
  price:          row.price,
  type:           row.type,
  fragmentNumber: row.fragment_number,
  timestamp:      row.timestamp
 }))
}

/* ── Market History ── */

function dbLoadMarketHistory(limit = 500) {
 return getDb().prepare(
  "SELECT * FROM market_history ORDER BY timestamp DESC LIMIT ?"
 ).all(limit).map(row => ({
  id:             row.id,
  seller:         row.seller,
  buyer:          row.buyer,
  card:           row.card,
  price:          row.price,
  type:           row.type,
  fragmentNumber: row.fragment_number,
  timestamp:      row.timestamp
 }))
}

function dbAddMarketHistory(entry) {
 stmt("addHistory", `
  INSERT INTO market_history (seller, buyer, card, price, type, fragment_number, timestamp)
  VALUES (?, ?, ?, ?, ?, ?, ?)
 `).run(
  entry.seller,
  entry.buyer,
  String(entry.card),
  entry.price,
  entry.type || "card",
  entry.fragmentNumber || null,
  entry.timestamp || Date.now()
 )
}

/* ── Meta ── */

function dbGetMeta(key) {
 const row = getDb().prepare("SELECT value FROM meta WHERE key = ?").get(key)
 return row ? row.value : null
}

function dbSetMeta(key, value) {
 getDb().prepare(
  "INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)"
 ).run(key, String(value))
}

/* ── Transactions ── */

function dbTransaction(fn) {
 return getDb().transaction(fn)()
}

/* ═══════════════════════════════════════════════
   EXPORTS
═══════════════════════════════════════════════ */

module.exports = {
 getDb,
 closeDb,

 /* Users */
 dbLoadUser,
 dbSaveUser,
 dbDeleteUser,
 dbListUserIds,
 dbCountUsers,
 dbLeaderboard,

 /* Market */
 dbLoadMarket,
 dbAddMarketListing,
 dbRemoveMarketListing,
 dbGetMarketListingById,
 dbGetUserListings,

 /* Market History */
 dbLoadMarketHistory,
 dbAddMarketHistory,

 /* Meta */
 dbGetMeta,
 dbSetMeta,
 dbTransaction
}