/* ═══════════════════════════════════════════════════════════════
   ANTI-ABUSE — systems/antiAbuse.js

   Rate limiting per-user pour les commandes Discord.
   - Cooldown par commande (configurable)
   - Limite globale d'actions par minute par utilisateur
   - Cleanup automatique des entrées expirées
═══════════════════════════════════════════════════════════════ */

const { createLogger } = require("./logger")

const log = createLogger("ABUSE")

/* Cooldown par commande (en ms) */
const COMMAND_COOLDOWNS = {
 buypack:      3000,
 sellcard:     2000,
 sellduplicate:5000,
 fusion:       3000,
 craft:        3000,
 trade:        5000,
 gift:         5000,
 daily:        2000,
 roulette:     3000,
 market:       2000,
 krosmoshop:   2000,
 eventpack:    3000
}

const DEFAULT_COOLDOWN = 1500

/* Limite globale : max N actions par fenêtre */
const GLOBAL_WINDOW_MS = 60000
const GLOBAL_MAX_ACTIONS = 30

/* Map<userId, { commands: Map<commandName, lastUsed>, actions: [{ts}], warned: boolean }> */
const users = new Map()

/* Cleanup toutes les 5 minutes */
const cleanupInterval = setInterval(() => {
 const now = Date.now()
 for (const [userId, entry] of users) {
  entry.actions = entry.actions.filter((a) => now - a.ts < GLOBAL_WINDOW_MS)
  if (entry.actions.length === 0 && entry.commands.size === 0) {
   users.delete(userId)
  } else {
   for (const [cmd, lastUsed] of entry.commands) {
    const cooldown = COMMAND_COOLDOWNS[cmd] || DEFAULT_COOLDOWN
    if (now - lastUsed > cooldown * 2) entry.commands.delete(cmd)
   }
  }
 }
}, 5 * 60 * 1000)

if (cleanupInterval.unref) cleanupInterval.unref()

function getEntry(userId) {
 let entry = users.get(userId)
 if (!entry) {
  entry = { commands: new Map(), actions: [], warned: false }
  users.set(userId, entry)
 }
 return entry
}

/**
 * Vérifie si un utilisateur peut exécuter une commande.
 * @param {string} userId
 * @param {string} commandName
 * @returns {{ allowed: boolean, retryAfterMs?: number, reason?: string }}
 */
function checkRateLimit(userId, commandName) {
 const now = Date.now()
 const entry = getEntry(userId)

 /* 1. Vérifier le cooldown de la commande */
 const cooldown = COMMAND_COOLDOWNS[commandName] || DEFAULT_COOLDOWN
 const lastUsed = entry.commands.get(commandName) || 0
 const elapsed = now - lastUsed

 if (elapsed < cooldown) {
  const retryAfterMs = cooldown - elapsed
  return {
   allowed: false,
   retryAfterMs,
   reason: `Commande en cooldown (${Math.ceil(retryAfterMs / 1000)}s)`
  }
 }

 /* 2. Vérifier la limite globale d'actions par minute */
 entry.actions = entry.actions.filter((a) => now - a.ts < GLOBAL_WINDOW_MS)

 if (entry.actions.length >= GLOBAL_MAX_ACTIONS) {
  if (!entry.warned) {
   log.warn("Rate limit atteint", { userId, actions: entry.actions.length })
   entry.warned = true
  }
  const oldestInWindow = entry.actions[0]?.ts || now
  const retryAfterMs = GLOBAL_WINDOW_MS - (now - oldestInWindow)
  return {
   allowed: false,
   retryAfterMs,
   reason: "Trop d'actions en peu de temps. Attends un moment."
  }
 }

 /* Autorisé — enregistrer l'action */
 entry.commands.set(commandName, now)
 entry.actions.push({ ts: now })
 entry.warned = false

 return { allowed: true }
}

/**
 * Compat: ancien checkGlobalCooldown (toujours true maintenant)
 */
function checkGlobalCooldown() {
 return true
}

module.exports = {
 checkRateLimit,
 checkGlobalCooldown,
 COMMAND_COOLDOWNS,
 DEFAULT_COOLDOWN
}
