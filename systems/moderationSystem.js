/* ═══════════════════════════════════════════════════════════════
   MODERATION SYSTEM — systems/moderationSystem.js

   Gère les sanctions (ban temporaire / permanent) et le mode
   malchance (force les tirages C uniquement).

   MODIFICATIONS :
   - Supprimé le pattern `let BASE = "/data"` dupliqué
     → utilise `getBasePath()` depuis paths.js (source unique)
   - Supprimé `loadJSON` / `saveJSON` manuels
     → utilise `readJsonSafe` / `writeAtomic` depuis fileUtils.js
   - Supprimé les `console.error` bruts
     → utilise `createLogger("MODERATION")` depuis logger.js
   - Ajout de JSDoc sur toutes les fonctions exportées
   - Ajout de try/catch robustes sur les opérations critiques
═══════════════════════════════════════════════════════════════ */

const path = require("path")

const { getBasePath }                = require("./paths")
const { createLogger }               = require("./logger")
const { writeAtomic, readJsonSafe }  = require("./fileUtils")

const log = createLogger("MODERATION")

/* ─── Chemins ─────────────────────────────────────────────── */

const BASE            = getBasePath()
const SANCTIONS_PATH  = path.join(BASE, "sanctions.json")
const NOLUCK_PATH     = path.join(BASE, "noluck.json")

/* ─── Chargement initial ─────────────────────────────────── */

/** @type {Object<string, SanctionEntry>} */
let sanctions = readJsonSafe(SANCTIONS_PATH, {})

/** @type {Object<string, NoluckEntry>} */
let noluck = readJsonSafe(NOLUCK_PATH, {})

log.info("Moderation chargée", {
 sanctions: Object.keys(sanctions).length,
 noluck:    Object.keys(noluck).length
})

/* ═══════════════════════════════════════════════════════════════
   SANCTIONS
   Structure sanctions.json :
   {
     "123456789": {
       "endsAt":  1700000000000,   // timestamp ms — null = permanent
       "reason":  "spam",
       "by":      "moderator_id",
       "at":      1699999000000
     }
   }
═══════════════════════════════════════════════════════════════ */

/**
 * @typedef {Object} SanctionEntry
 * @property {number|null} endsAt  - Timestamp de fin (null = permanent)
 * @property {string}      reason  - Raison de la sanction
 * @property {string}      by      - ID du modérateur
 * @property {number}      at      - Timestamp de création
 */

/**
 * Sanctionner un joueur (ban temporaire ou permanent).
 * @param {string} userId      - ID Discord de la cible
 * @param {number} durationMs  - Durée en ms (0 = permanent)
 * @param {string} [reason]    - Raison
 * @param {string} [by]        - ID du modérateur
 * @returns {SanctionEntry} L'entrée de sanction créée
 */
function sanctionPlayer(userId, durationMs, reason = "Aucune raison précisée", by = "inconnu") {

 const now    = Date.now()
 const endsAt = durationMs > 0 ? now + durationMs : null

 sanctions[userId] = { endsAt, reason, by, at: now }

 try {
  writeAtomic(SANCTIONS_PATH, sanctions)
 } catch (err) {
  log.error("Erreur sauvegarde sanctions", { err, userId })
 }

 log.info("Joueur sanctionné", { userId, durationMs, reason, by })

 return sanctions[userId]
}

/**
 * Lever la sanction d'un joueur.
 * @param {string} userId - ID Discord
 * @returns {boolean} true si une sanction existait et a été levée
 */
function unsanctionPlayer(userId) {

 if (!sanctions[userId]) return false

 delete sanctions[userId]

 try {
  writeAtomic(SANCTIONS_PATH, sanctions)
 } catch (err) {
  log.error("Erreur sauvegarde unsanction", { err, userId })
 }

 log.info("Sanction levée", { userId })

 return true
}

/**
 * Vérifier si un joueur est sanctionné.
 * Nettoie automatiquement les sanctions expirées.
 * @param {string} userId - ID Discord
 * @returns {boolean} true si le joueur est actuellement sanctionné
 */
function isSanctioned(userId) {

 const entry = sanctions[userId]
 if (!entry) return false

 /* Sanction permanente */
 if (entry.endsAt === null) return true

 /* Sanction expirée → nettoyage automatique */
 if (Date.now() >= entry.endsAt) {
  delete sanctions[userId]

  try {
   writeAtomic(SANCTIONS_PATH, sanctions)
  } catch (err) {
   log.error("Erreur nettoyage sanction expirée", { err, userId })
  }

  return false
 }

 return true
}

/**
 * Récupérer les infos de sanction d'un joueur.
 * @param {string} userId - ID Discord
 * @returns {SanctionEntry|null}
 */
function getSanction(userId) {
 if (!isSanctioned(userId)) return null
 return sanctions[userId] || null
}

/**
 * Retourne toutes les sanctions actives.
 * @returns {Object<string, SanctionEntry>}
 */
function getAllSanctions() {
 /* Nettoyage des sanctions expirées avant retour */
 const now     = Date.now()
 let   changed = false

 for (const userId in sanctions) {
  const entry = sanctions[userId]
  if (entry.endsAt !== null && now >= entry.endsAt) {
   delete sanctions[userId]
   changed = true
  }
 }

 if (changed) {
  try {
   writeAtomic(SANCTIONS_PATH, sanctions)
  } catch (err) {
   log.error("Erreur nettoyage batch sanctions", { err })
  }
 }

 return { ...sanctions }
}

/* ═══════════════════════════════════════════════════════════════
   MALCHANCE (NOLUCK)
   Force un joueur à ne tirer que des cartes C (blanches).

   Structure noluck.json :
   {
     "123456789": {
       "endsAt":  1700000000000,
       "reason":  "triche",
       "by":      "moderator_id",
       "at":      1699999000000
     }
   }
═══════════════════════════════════════════════════════════════ */

/**
 * @typedef {Object} NoluckEntry
 * @property {number|null} endsAt  - Timestamp de fin (null = permanent)
 * @property {string}      reason  - Raison
 * @property {string}      by      - ID du modérateur
 * @property {number}      at      - Timestamp de création
 */

/**
 * Activer le mode malchance sur un joueur.
 * @param {string} userId      - ID Discord
 * @param {number} durationMs  - Durée en ms (0 = permanent)
 * @param {string} [reason]    - Raison
 * @param {string} [by]        - ID du modérateur
 * @returns {NoluckEntry}
 */
function setNoluck(userId, durationMs, reason = "Aucune raison précisée", by = "inconnu") {

 const now    = Date.now()
 const endsAt = durationMs > 0 ? now + durationMs : null

 noluck[userId] = { endsAt, reason, by, at: now }

 try {
  writeAtomic(NOLUCK_PATH, noluck)
 } catch (err) {
  log.error("Erreur sauvegarde noluck", { err, userId })
 }

 log.info("Noluck activé", { userId, durationMs, reason, by })

 return noluck[userId]
}

/**
 * Désactiver le mode malchance.
 * @param {string} userId - ID Discord
 * @returns {boolean} true si le mode existait et a été retiré
 */
function removeNoluck(userId) {

 if (!noluck[userId]) return false

 delete noluck[userId]

 try {
  writeAtomic(NOLUCK_PATH, noluck)
 } catch (err) {
  log.error("Erreur sauvegarde removeNoluck", { err, userId })
 }

 log.info("Noluck retiré", { userId })

 return true
}

/**
 * Vérifier si un joueur est en mode malchance.
 * Nettoie automatiquement les entrées expirées.
 * @param {string} userId - ID Discord
 * @returns {boolean}
 */
function hasNoluck(userId) {

 const entry = noluck[userId]
 if (!entry) return false

 if (entry.endsAt === null) return true

 if (Date.now() >= entry.endsAt) {
  delete noluck[userId]

  try {
   writeAtomic(NOLUCK_PATH, noluck)
  } catch (err) {
   log.error("Erreur nettoyage noluck expiré", { err, userId })
  }

  return false
 }

 return true
}

/**
 * Récupérer les infos de malchance d'un joueur.
 * @param {string} userId - ID Discord
 * @returns {NoluckEntry|null}
 */
function getNoluck(userId) {
 if (!hasNoluck(userId)) return null
 return noluck[userId] || null
}

/* ─── Export ─────────────────────────────────────────────── */

module.exports = {
 sanctionPlayer,
 unsanctionPlayer,
 isSanctioned,
 getSanction,
 getAllSanctions,
 setNoluck,
 removeNoluck,
 hasNoluck,
 getNoluck
}