/* ═══════════════════════════════════════════════════════════════
   DATABASE — systems/database.js

   Couche SQLite avec better-sqlite3 (synchrone).
   Remplace les fichiers JSON pour :
     - users
     - market / marketHistory
     - guilds           ← NOUVEAU v0.38
     - battlepass progress  ← NOUVEAU v0.38

   Installation requise :
     npm install better-sqlite3

   Usage :
     const { getDb, closeDb } = require("./database")
     const db = getDb()
     const row = db.prepare("SELECT * FROM users WHERE id = ?").get(userId)

   Les cards, devs, season templates, current_season restent en JSON
   (données statiques / config, pas d'impact perf).
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

  /* ── USER CARDS (normalized inventory) ───────────────────────── */
  CREATE TABLE IF NOT EXISTS user_cards (
   user_id         TEXT NOT NULL,
   card_id         TEXT NOT NULL,
   qty             INTEGER NOT NULL,
   PRIMARY KEY (user_id, card_id)
  );

  CREATE INDEX IF NOT EXISTS idx_user_cards_card ON user_cards(card_id);

  /* ── USER FRAGMENTS (normalized inventory) ───────────────────── */
  CREATE TABLE IF NOT EXISTS user_fragments (
   id              INTEGER PRIMARY KEY AUTOINCREMENT,
   user_id         TEXT NOT NULL,
   card_id         TEXT NOT NULL,
   fragment_number INTEGER NOT NULL,
   source          TEXT,
   obtained_at     TEXT
  );

  CREATE INDEX IF NOT EXISTS idx_user_fragments_user ON user_fragments(user_id);
  CREATE INDEX IF NOT EXISTS idx_user_fragments_lookup ON user_fragments(user_id, card_id, fragment_number);

  /* ── USER RECRUIT HISTORY (normalized heavy array) ───────────── */
  CREATE TABLE IF NOT EXISTS user_recruit_history (
   user_id         TEXT NOT NULL,
   entry_idx       INTEGER NOT NULL,
   payload         TEXT NOT NULL,
   PRIMARY KEY (user_id, entry_idx)
  );

  CREATE INDEX IF NOT EXISTS idx_user_recruit_history_user ON user_recruit_history(user_id);

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

  /* ── GUILDS ────────────────────────────────── */
  CREATE TABLE IF NOT EXISTS guilds (
   id              TEXT PRIMARY KEY,
   data            TEXT NOT NULL,
   name            TEXT NOT NULL,
   leader_id       TEXT NOT NULL,
   level           INTEGER DEFAULT 1,
   xp              INTEGER DEFAULT 0,
   member_count    INTEGER DEFAULT 1,
   created_at      INTEGER DEFAULT 0,
   updated_at      INTEGER DEFAULT 0
  );

  CREATE INDEX IF NOT EXISTS idx_guilds_name     ON guilds(name);
  CREATE INDEX IF NOT EXISTS idx_guilds_leader   ON guilds(leader_id);
  CREATE INDEX IF NOT EXISTS idx_guilds_level    ON guilds(level DESC);

  /* ── BATTLEPASS PROGRESS ───────────────────── */
  CREATE TABLE IF NOT EXISTS battlepass_progress (
   user_id         TEXT NOT NULL,
   season_id       TEXT NOT NULL,
   data            TEXT NOT NULL,
   current_level   INTEGER DEFAULT 1,
   total_xp        INTEGER DEFAULT 0,
   has_premium     INTEGER DEFAULT 0,
   updated_at      INTEGER DEFAULT 0,
   PRIMARY KEY (user_id, season_id)
  );

  CREATE INDEX IF NOT EXISTS idx_bp_season  ON battlepass_progress(season_id);
  CREATE INDEX IF NOT EXISTS idx_bp_level   ON battlepass_progress(current_level DESC);

  /* ── WEB SESSIONS ───────────────────────────── */
  CREATE TABLE IF NOT EXISTS web_sessions (
   token       TEXT PRIMARY KEY,
   user_id     TEXT NOT NULL,
   created_at  INTEGER NOT NULL,
   expires_at  INTEGER NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_ws_user    ON web_sessions(user_id);
  CREATE INDEX IF NOT EXISTS idx_ws_expires ON web_sessions(expires_at);

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

/* ═══════════════════════════════════════════════
   USERS
═══════════════════════════════════════════════ */

function dbLoadUser(id) {
 const row = stmt("loadUser",
  "SELECT data FROM users WHERE id = ?"
 ).get(id)
 if (!row) return null

 const user = JSON.parse(row.data)

 const cardRows = stmt(
  "loadUserCards",
  "SELECT card_id, qty FROM user_cards WHERE user_id = ?"
 ).all(id)
 if (cardRows.length > 0) {
  user.cards = {}
  for (const entry of cardRows) {
   const cardId = String(entry.card_id || "")
   const qty = Math.max(0, Number(entry.qty || 0))
   if (!cardId || qty <= 0) continue
   user.cards[cardId] = qty
  }
 } else if (!user.cards || typeof user.cards !== "object" || Array.isArray(user.cards)) {
  user.cards = {}
 }

 const fragmentRows = stmt(
  "loadUserFragments",
  "SELECT card_id, fragment_number, source, obtained_at FROM user_fragments WHERE user_id = ? ORDER BY id ASC"
 ).all(id)
 if (fragmentRows.length > 0) {
  user.fragments = fragmentRows.map((entry) => ({
   cardId: String(entry.card_id || ""),
   fragmentNumber: Number(entry.fragment_number || 0),
   source: entry.source ? String(entry.source) : undefined,
   obtainedAt: entry.obtained_at ? String(entry.obtained_at) : undefined
  }))
 } else if (!Array.isArray(user.fragments)) {
  user.fragments = []
 }

 const recruitRows = stmt(
  "loadUserRecruitHistory",
  "SELECT payload FROM user_recruit_history WHERE user_id = ? ORDER BY entry_idx ASC"
 ).all(id)
 if (recruitRows.length > 0) {
  const items = []
  for (const rowEntry of recruitRows) {
   try {
    items.push(JSON.parse(String(rowEntry.payload || "{}")))
   } catch (_) {}
  }
  user.recruitHistory = items
 } else if (!Array.isArray(user.recruitHistory)) {
  user.recruitHistory = []
 }

 return user
}

function dbSaveUser(id, user, cardsDefs) {
 const clone = JSON.parse(JSON.stringify(user))
 delete clone._dirty

 const cardsMap = (clone.cards && typeof clone.cards === "object" && !Array.isArray(clone.cards))
  ? clone.cards
  : {}
 const fragmentsList = Array.isArray(clone.fragments) ? clone.fragments : []
 const recruitHistoryList = Array.isArray(clone.recruitHistory) ? clone.recruitHistory : []

 /* Calculer les colonnes indexées */
 const totalCards = Object.values(cardsMap).reduce((a, b) => a + Number(b || 0), 0)
 const uniqueCards = Object.keys(cardsMap).length

 let ssrCount = 0
 if (cardsDefs && cardsDefs.length > 0) {
  const ssrIds = new Set()
  for (const c of cardsDefs) {
   if (c.rarity === "SSR") ssrIds.add(String(c.id))
  }
  for (const [cardId, qty] of Object.entries(cardsMap)) {
   if (ssrIds.has(String(cardId))) ssrCount += Number(qty || 0)
  }
 }

 /* Les gros tableaux sont normalisés dans des tables dédiées */
 delete clone.cards
 delete clone.fragments
 delete clone.recruitHistory

 getDb().transaction(() => {
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

  stmt("deleteUserCards", "DELETE FROM user_cards WHERE user_id = ?").run(id)
  const insertUserCard = stmt(
   "insertUserCard",
   "INSERT INTO user_cards (user_id, card_id, qty) VALUES (?, ?, ?)"
  )
  for (const [cardId, qtyRaw] of Object.entries(cardsMap)) {
   const cardKey = String(cardId || "").trim()
   const qty = Math.max(0, Math.floor(Number(qtyRaw || 0)))
   if (!cardKey || qty <= 0) continue
   insertUserCard.run(id, cardKey, qty)
  }

  stmt("deleteUserFragments", "DELETE FROM user_fragments WHERE user_id = ?").run(id)
  const insertUserFragment = stmt(
   "insertUserFragment",
   "INSERT INTO user_fragments (user_id, card_id, fragment_number, source, obtained_at) VALUES (?, ?, ?, ?, ?)"
  )
  for (const fragment of fragmentsList) {
   const cardId = String(fragment?.cardId || "").trim()
   const fragmentNumber = Math.floor(Number(fragment?.fragmentNumber || 0))
   if (!cardId || !Number.isFinite(fragmentNumber) || fragmentNumber <= 0) continue
   insertUserFragment.run(
    id,
    cardId,
    fragmentNumber,
    fragment?.source ? String(fragment.source) : null,
    fragment?.obtainedAt ? String(fragment.obtainedAt) : null
   )
  }

  stmt("deleteUserRecruitHistory", "DELETE FROM user_recruit_history WHERE user_id = ?").run(id)
  const insertUserRecruitHistory = stmt(
   "insertUserRecruitHistory",
   "INSERT INTO user_recruit_history (user_id, entry_idx, payload) VALUES (?, ?, ?)"
  )
  for (let index = 0; index < recruitHistoryList.length; index++) {
   const entry = recruitHistoryList[index]
   try {
    insertUserRecruitHistory.run(id, index, JSON.stringify(entry || {}))
   } catch (_) {}
  }
 })()
}

function dbDeleteUser(id) {
 getDb().transaction(() => {
  stmt("deleteUser", "DELETE FROM users WHERE id = ?").run(id)
  stmt("deleteUserCards", "DELETE FROM user_cards WHERE user_id = ?").run(id)
  stmt("deleteUserFragments", "DELETE FROM user_fragments WHERE user_id = ?").run(id)
  stmt("deleteUserRecruitHistory", "DELETE FROM user_recruit_history WHERE user_id = ?").run(id)
 })()
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

/* ═══════════════════════════════════════════════
   MARKET
═══════════════════════════════════════════════ */

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

/* ═══════════════════════════════════════════════
   GUILDS
═══════════════════════════════════════════════ */

function dbLoadAllGuilds() {
 const rows = getDb().prepare("SELECT data FROM guilds").all()
 const result = {}
 for (const row of rows) {
  try {
   const guild = JSON.parse(row.data)
   if (guild && guild.id) {
    result[guild.id] = guild
   }
  } catch (_) { /* skip corrupted */ }
 }
 return result
}

function dbLoadGuild(guildId) {
 const row = stmt("loadGuild",
  "SELECT data FROM guilds WHERE id = ?"
 ).get(guildId)
 return row ? JSON.parse(row.data) : null
}

function dbSaveGuild(guild) {
 if (!guild || !guild.id) return

 const clone = JSON.parse(JSON.stringify(guild))

 stmt("saveGuild", `
  INSERT OR REPLACE INTO guilds
   (id, data, name, leader_id, level, xp, member_count, created_at, updated_at)
  VALUES
   (?, ?, ?, ?, ?, ?, ?, ?, ?)
 `).run(
  clone.id,
  JSON.stringify(clone),
  clone.name || "Sans nom",
  clone.leaderId || "",
  clone.level || 1,
  clone.xp || 0,
  Array.isArray(clone.memberIds) ? clone.memberIds.length : 1,
  clone.createdAt || Date.now(),
  Date.now()
 )
}

function dbDeleteGuild(guildId) {
 stmt("deleteGuild", "DELETE FROM guilds WHERE id = ?").run(guildId)
}

function dbCountGuilds() {
 return getDb().prepare("SELECT COUNT(*) as c FROM guilds").get().c
}

function dbGuildLeaderboard(limit = 50) {
 return getDb().prepare(`
  SELECT id, name, level, xp, member_count, leader_id
  FROM guilds
  ORDER BY level DESC, xp DESC
  LIMIT ?
 `).all(limit)
}

function dbFindGuildByName(name) {
 const row = getDb().prepare(
  "SELECT data FROM guilds WHERE LOWER(name) = LOWER(?)"
 ).get(name)
 return row ? JSON.parse(row.data) : null
}

/* ═══════════════════════════════════════════════
   BATTLEPASS PROGRESS
═══════════════════════════════════════════════ */

function dbLoadBattlePassProgress(userId, seasonId) {
 const row = stmt("loadBP",
  "SELECT data FROM battlepass_progress WHERE user_id = ? AND season_id = ?"
 ).get(userId, seasonId)
 return row ? JSON.parse(row.data) : null
}

function dbSaveBattlePassProgress(progress) {
 if (!progress || !progress.userId || !progress.seasonId) return

 const clone = JSON.parse(JSON.stringify(progress))

 stmt("saveBP", `
  INSERT OR REPLACE INTO battlepass_progress
   (user_id, season_id, data, current_level, total_xp, has_premium, updated_at)
  VALUES
   (?, ?, ?, ?, ?, ?, ?)
 `).run(
  clone.userId,
  clone.seasonId,
  JSON.stringify(clone),
  clone.currentLevel || 1,
  clone.totalXP || 0,
  clone.hasPremium ? 1 : 0,
  Date.now()
 )
}

function dbDeleteBattlePassProgress(userId, seasonId) {
 stmt("deleteBP",
  "DELETE FROM battlepass_progress WHERE user_id = ? AND season_id = ?"
 ).run(userId, seasonId)
}

function dbListBattlePassUserIds(seasonId) {
 return getDb().prepare(
  "SELECT user_id FROM battlepass_progress WHERE season_id = ?"
 ).all(seasonId).map(r => r.user_id)
}

function dbCountBattlePassUsers(seasonId) {
 return getDb().prepare(
  "SELECT COUNT(*) as c FROM battlepass_progress WHERE season_id = ?"
 ).get(seasonId).c
}

function dbBattlePassLeaderboard(seasonId, limit = 50) {
 return getDb().prepare(`
  SELECT user_id AS userId, current_level AS level, total_xp AS xp, has_premium AS premium
  FROM battlepass_progress
  WHERE season_id = ? AND current_level > 1
  ORDER BY current_level DESC, total_xp DESC
  LIMIT ?
 `).all(seasonId, limit)
}

function dbDeleteAllBattlePassProgress(seasonId) {
 getDb().prepare(
  "DELETE FROM battlepass_progress WHERE season_id = ?"
 ).run(seasonId)
}

/* ═══════════════════════════════════════════════
   GLOBAL STATS (agrégation SQL)
═══════════════════════════════════════════════ */

function dbGlobalStats() {
 const row = getDb().prepare(`
  SELECT
   COUNT(*)          AS players,
   COALESCE(SUM(kamas), 0)        AS totalKamas,
   COALESCE(SUM(total_cards), 0)  AS cardsOwned,
   COALESCE(SUM(ssr_count), 0)    AS ssrOwned,
   COALESCE(SUM(packs_opened), 0) AS packsOpened,
   COALESCE(SUM(achievements), 0) AS achievements,
   COALESCE(SUM(CAST(json_extract(data, '$.stats.fusions') AS INTEGER)), 0) AS fusions,
   COALESCE(SUM(CAST(json_extract(data, '$.stats.rouletteSpins') AS INTEGER)), 0) AS rouletteSpins,
   COALESCE(SUM(CAST(json_extract(data, '$.stats.pinataParticipations') AS INTEGER)), 0) AS pinataParticipations
  FROM users
 `).get()
 return row
}

/* ═══════════════════════════════════════════════
   WEB SESSIONS
═══════════════════════════════════════════════ */

function dbSaveSession(token, userId, expiresAt) {
 stmt("saveSession", `
  INSERT OR REPLACE INTO web_sessions (token, user_id, created_at, expires_at)
  VALUES (?, ?, ?, ?)
 `).run(token, userId, Date.now(), expiresAt)
}

function dbDeleteSession(token) {
 stmt("deleteSession", "DELETE FROM web_sessions WHERE token = ?").run(token)
}

function dbLoadSessions() {
 const now = Date.now()
 return getDb().prepare(
  "SELECT token, user_id, expires_at FROM web_sessions WHERE expires_at > ?"
 ).all(now).map(row => ({
  token:     row.token,
  userId:    row.user_id,
  expiresAt: row.expires_at
 }))
}

function dbCleanExpiredSessions() {
 return getDb().prepare(
  "DELETE FROM web_sessions WHERE expires_at <= ?"
 ).run(Date.now()).changes
}

/* ═══════════════════════════════════════════════
   META
═══════════════════════════════════════════════ */

function dbGetMeta(key) {
 const row = getDb().prepare("SELECT value FROM meta WHERE key = ?").get(key)
 return row ? row.value : null
}

function dbSetMeta(key, value) {
 getDb().prepare(
  "INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)"
 ).run(key, String(value))
}

/* ═══════════════════════════════════════════════
   TRANSACTIONS
═══════════════════════════════════════════════ */

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
 dbGlobalStats,

 /* Market */
 dbLoadMarket,
 dbAddMarketListing,
 dbRemoveMarketListing,
 dbGetMarketListingById,
 dbGetUserListings,

 /* Market History */
 dbLoadMarketHistory,
 dbAddMarketHistory,

 /* Guilds */
 dbLoadAllGuilds,
 dbLoadGuild,
 dbSaveGuild,
 dbDeleteGuild,
 dbCountGuilds,
 dbGuildLeaderboard,
 dbFindGuildByName,

 /* BattlePass Progress */
 dbLoadBattlePassProgress,
 dbSaveBattlePassProgress,
 dbDeleteBattlePassProgress,
 dbListBattlePassUserIds,
 dbCountBattlePassUsers,
 dbBattlePassLeaderboard,
 dbDeleteAllBattlePassProgress,

 /* Web Sessions */
 dbSaveSession,
 dbDeleteSession,
 dbLoadSessions,
 dbCleanExpiredSessions,

 /* Meta */
 dbGetMeta,
 dbSetMeta,
 dbTransaction
}
