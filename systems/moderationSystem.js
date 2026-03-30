const fs   = require("fs")
const path = require("path")

/* ================================================================
   MODERATION SYSTEM
   – sanctions  : empêche un joueur d'utiliser le bot pendant X temps
   – malchance  : force le joueur à ne tirer que des cartes C (blanches)
================================================================ */

/* -------- BASE PATH (Railway /data ou ./data local) -------- */

let BASE = "/data"
if (!fs.existsSync(BASE)) BASE = path.join(process.cwd(), "data")
if (!fs.existsSync(BASE)) fs.mkdirSync(BASE, { recursive: true })

const SANCTIONS_PATH = path.join(BASE, "sanctions.json")
const NOLUCK_PATH    = path.join(BASE, "noluck.json")

/* ================================================================
   HELPERS LOAD / SAVE
================================================================ */

function loadJSON(filePath, defaultValue) {
  try {
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, "utf8")
      if (raw && raw.trim() !== "") return JSON.parse(raw)
    }
  } catch (err) {
    console.error(`[MODERATION] Erreur lecture ${filePath}:`, err)
  }
  return defaultValue
}

function saveJSON(filePath, data) {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2))
  } catch (err) {
    console.error(`[MODERATION] Erreur sauvegarde ${filePath}:`, err)
  }
}

/* ================================================================
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
================================================================ */

let sanctions = loadJSON(SANCTIONS_PATH, {})

/**
 * Sanctionner un joueur.
 * @param {string} userId     - ID Discord de la cible
 * @param {number} durationMs - Durée en millisecondes (0 = permanent)
 * @param {string} reason     - Raison
 * @param {string} by         - ID du modérateur
 */
function sanctionPlayer(userId, durationMs, reason = "Aucune raison précisée", by = "inconnu") {
  const now    = Date.now()
  const endsAt = durationMs > 0 ? now + durationMs : null   // null = permanent

  sanctions[userId] = { endsAt, reason, by, at: now }
  saveJSON(SANCTIONS_PATH, sanctions)

  return sanctions[userId]
}

/**
 * Lever la sanction d'un joueur.
 */
function unsanctionPlayer(userId) {
  if (!sanctions[userId]) return false
  delete sanctions[userId]
  saveJSON(SANCTIONS_PATH, sanctions)
  return true
}

/**
 * Vérifier si un joueur est sanctionné.
 * Nettoie automatiquement les sanctions expirées.
 * @returns {object|null}  La sanction active, ou null
 */
function isSanctioned(userId) {
  const entry = sanctions[userId]
  if (!entry) return null

  /* Sanction permanente */
  if (entry.endsAt === null) return entry

  /* Vérifier expiration */
  if (Date.now() >= entry.endsAt) {
    delete sanctions[userId]
    saveJSON(SANCTIONS_PATH, sanctions)
    return null
  }

  return entry
}

/**
 * Récupérer toutes les sanctions actives (pour debug/audit).
 */
function getAllSanctions() {
  const now    = Date.now()
  const active = {}

  for (const [uid, entry] of Object.entries(sanctions)) {
    if (entry.endsAt === null || now < entry.endsAt) {
      active[uid] = entry
    } else {
      /* Nettoyage au passage */
      delete sanctions[uid]
    }
  }

  saveJSON(SANCTIONS_PATH, sanctions)
  return active
}

/* ================================================================
   MALCHANCE
   Structure noluck.json :
   {
     "123456789": {
       "active": true,
       "by":     "moderator_id",
       "at":     1699999000000
     }
   }
================================================================ */

let noluck = loadJSON(NOLUCK_PATH, {})

/**
 * Activer ou désactiver la malchance d'un joueur.
 * @param {string}  userId - ID Discord de la cible
 * @param {boolean} active - true = activer, false = désactiver
 * @param {string}  by     - ID du modérateur
 */
function setNoLuck(userId, active, by = "inconnu") {
  if (active) {
    noluck[userId] = { active: true, by, at: Date.now() }
  } else {
    delete noluck[userId]
  }
  saveJSON(NOLUCK_PATH, noluck)
}

/**
 * Vérifier si un joueur a la malchance active.
 * @returns {boolean}
 */
function hasNoLuck(userId) {
  return !!(noluck[userId]?.active)
}

/**
 * Récupérer tous les joueurs avec malchance active.
 */
function getAllNoLuck() {
  return { ...noluck }
}

/* ================================================================
   EXPORTS
================================================================ */

module.exports = {
  /* Sanctions */
  sanctionPlayer,
  unsanctionPlayer,
  isSanctioned,
  getAllSanctions,
  /* Malchance */
  setNoLuck,
  hasNoLuck,
  getAllNoLuck,
}