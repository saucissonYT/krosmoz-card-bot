/* ═══════════════════════════════════════════════════════════════
   TRADE SYSTEM — systems/tradeSystem.js

   Gestion centralisée des trades en mémoire.
   - Stockage des trades actifs
   - Tracking des joueurs en échange
   - Cooldown par joueur
   - Auto-expiration des trades abandonnés (5 min)
═══════════════════════════════════════════════════════════════ */

const { createLogger } = require("./logger")

const log = createLogger("TRADE")

/** Durée max d'un trade avant expiration automatique (ms) */
const TRADE_TTL = 5 * 60 * 1000

/** Cooldown entre deux trades pour un même joueur (ms) */
const TRADE_COOLDOWN = 30000

/** @type {Map<string, TradeData>} */
const trades = new Map()

/** @type {Set<string>} IDs des joueurs en cours d'échange */
const activeUsers = new Set()

/** @type {Map<string, number>} Cooldown par joueur (timestamp) */
const tradeCooldowns = new Map()

/**
 * @typedef {Object} TradeData
 * @property {string}  from      - ID Discord du créateur
 * @property {string}  to        - ID Discord de la cible
 * @property {string}  [giveCard] - ID de la carte offerte
 * @property {string}  [wantCard] - ID de la carte demandée
 * @property {number}  createdAt - Timestamp de création
 */

/**
 * Crée un nouveau trade.
 * @param {string} id - ID unique du trade
 * @param {{ from: string, to: string }} data
 * @returns {{ success: boolean, error?: string }}
 */
function createTrade(id, data) {
 if (!id || !data?.from || !data?.to) {
  return { success: false, error: "Paramètres de trade invalides" }
 }
 if (data.from === data.to) {
  return { success: false, error: "Impossible d'échanger avec soi-même" }
 }
 if (activeUsers.has(data.from)) {
  return { success: false, error: "Tu as déjà un échange en cours" }
 }
 if (activeUsers.has(data.to)) {
  return { success: false, error: "Ce joueur est déjà dans un échange" }
 }

 trades.set(id, { ...data, createdAt: Date.now() })
 activeUsers.add(data.from)
 activeUsers.add(data.to)

 return { success: true }
}

/**
 * Récupère un trade par ID.
 * @param {string} id
 * @returns {TradeData|null}
 */
function getTrade(id) {
 return trades.get(id) || null
}

/**
 * Nettoie un trade : supprime l'entrée et libère les joueurs.
 * @param {string} id
 */
function deleteTrade(id) {
 const trade = trades.get(id)
 if (trade) {
  activeUsers.delete(trade.from)
  activeUsers.delete(trade.to)
 }
 trades.delete(id)
}

/**
 * Vérifie si un joueur est en cours d'échange.
 * @param {string} userId
 * @returns {boolean}
 */
function isUserInTrade(userId) {
 return activeUsers.has(userId)
}

/**
 * Vérifie le cooldown d'un joueur.
 * @param {string} userId
 * @returns {{ allowed: boolean, remainingMs?: number }}
 */
function checkCooldown(userId) {
 const last = tradeCooldowns.get(userId) || 0
 const elapsed = Date.now() - last
 if (elapsed < TRADE_COOLDOWN) {
  return { allowed: false, remainingMs: TRADE_COOLDOWN - elapsed }
 }
 return { allowed: true }
}

/**
 * Enregistre l'utilisation du cooldown pour un joueur.
 * @param {string} userId
 */
function setCooldown(userId) {
 tradeCooldowns.set(userId, Date.now())
}

/**
 * Nettoie les trades expirés (appelé périodiquement).
 */
function cleanupExpired() {
 const now = Date.now()
 for (const [id, trade] of trades) {
  if (now - trade.createdAt > TRADE_TTL) {
   log.info("Trade expiré (auto-cleanup)", { tradeId: id, from: trade.from, to: trade.to })
   deleteTrade(id)
  }
 }
 /* Nettoyage des cooldowns expirés */
 for (const [userId, ts] of tradeCooldowns) {
  if (now - ts > TRADE_COOLDOWN * 2) {
   tradeCooldowns.delete(userId)
  }
 }
}

/* Cleanup automatique toutes les 2 minutes */
const cleanupTimer = setInterval(cleanupExpired, 2 * 60 * 1000)
if (cleanupTimer.unref) cleanupTimer.unref()

module.exports = {
 createTrade,
 getTrade,
 deleteTrade,
 isUserInTrade,
 checkCooldown,
 setCooldown,
 TRADE_COOLDOWN,
 TRADE_TTL
}
