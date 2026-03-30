/* ===============================================
   SET UNLOCK SYSTEM
   Déblocage des sets par niveau du joueur
   OU par complétion à 70% du set précédent.

   Règles :
   - incarnam  → toujours débloqué (niveau 1)
   - astrub    → niveau 11  OU incarnam  ≥ 70%
   - amakna    → niveau 36  OU astrub    ≥ 70%
   - sufokia   → niveau 51  OU amakna    ≥ 70%
   - kelba     → niveau 66  OU sufokia   ≥ 70%
   - katrepat  → niveau 81  OU kelba     ≥ 70%
   - sberg     → niveau 96  OU katrepat  ≥ 70%

   krosmoshop et events ignorent ce système (cartes hors règle).
=============================================== */

/* ================= CONFIG ================= */

const SET_UNLOCK_CONFIG = [
 { id: "incarnam", levelRequired: 1,  prevSet: null,        name: "Incarnam"  },
 { id: "astrub",   levelRequired: 11, prevSet: "incarnam",  name: "Astrub"    },
 { id: "amakna",   levelRequired: 36, prevSet: "astrub",    name: "Amakna"    },
 { id: "sufokia",  levelRequired: 51, prevSet: "amakna",    name: "Sufokia"   },
 { id: "kelba",    levelRequired: 66, prevSet: "sufokia",   name: "Kelba"     },
 { id: "katrepat", levelRequired: 81, prevSet: "kelba",     name: "Katrepat"  },
 { id: "sberg",    levelRequired: 96, prevSet: "katrepat",  name: "Sberg"     },
]

const COMPLETION_UNLOCK_THRESHOLD = 0.70

/* ================= HELPERS ================= */

/**
 * Retourne la config d'un set par son id.
 * Retourne null si le set n'est pas dans la config (= toujours débloqué).
 */
function getUnlockConfig(setId){
 return SET_UNLOCK_CONFIG.find(c => c.id === setId) || null
}

/**
 * Calcule la complétion d'un set pour un joueur donné.
 * @param {object} user
 * @param {string} setId
 * @param {Array}  allCards  — tableau complet des cartes (data.cards)
 * @returns {{ owned, total, percent }}
 */
function computeSetCompletion(user, setId, allCards){

 const setCards = (allCards || []).filter(c => c.set === setId)

 if(!setCards.length)
  return { owned: 0, total: 0, percent: 0 }

 const owned = setCards.filter(c => user.cards?.[c.id]).length

 return {
  owned,
  total:   setCards.length,
  percent: owned / setCards.length
 }

}

/* ================= UNLOCK CHECK ================= */

/**
 * Indique si un set est débloqué pour un joueur.
 * @param {object} user
 * @param {string} setId
 * @param {Array}  allCards
 * @returns {boolean}
 */
function isSetUnlocked(user, setId, allCards){

 const config = getUnlockConfig(setId)

 /* Set inconnu de la config → toujours accessible */
 if(!config) return true

 const level = user.progression?.level || 1

 /* Condition level */
 if(level >= config.levelRequired) return true

 /* Condition complétion du set précédent à 70% */
 if(config.prevSet){
  const { percent } = computeSetCompletion(user, config.prevSet, allCards)
  if(percent >= COMPLETION_UNLOCK_THRESHOLD) return true
 }

 return false

}

/* ================= UNLOCK REASON ================= */

/**
 * Retourne un objet décrivant comment débloquer ce set.
 * Utilisé pour l'affichage dans krosmoz / listcards.
 * @param {object} user
 * @param {string} setId
 * @param {Array}  allCards
 * @returns {{ levelRequired, prevSet, prevSetPercent, prevSetThreshold, levelOk, completionOk }}
 */
function getUnlockInfo(user, setId, allCards){

 const config = getUnlockConfig(setId)

 if(!config)
  return { alwaysUnlocked: true }

 const level  = user.progression?.level || 1
 const levelOk = level >= config.levelRequired

 let completionOk  = false
 let prevSetPercent = 0

 if(config.prevSet){
  const { percent } = computeSetCompletion(user, config.prevSet, allCards)
  prevSetPercent = percent
  completionOk   = percent >= COMPLETION_UNLOCK_THRESHOLD
 }

 return {
  alwaysUnlocked:    false,
  levelRequired:     config.levelRequired,
  currentLevel:      level,
  prevSet:           config.prevSet,
  prevSetPercent,
  prevSetThreshold:  COMPLETION_UNLOCK_THRESHOLD,
  levelOk,
  completionOk,
 }

}

/**
 * Retourne un message lisible expliquant comment débloquer un set.
 * @param {object} user
 * @param {string} setId
 * @param {Array}  allCards
 * @returns {string}
 */
function getUnlockMessage(user, setId, allCards){

 const info = getUnlockInfo(user, setId, allCards)

 if(info.alwaysUnlocked || info.levelOk || info.completionOk)
  return null

 const pct      = Math.floor(info.prevSetPercent * 100)
 const threshold = Math.floor(info.prevSetThreshold * 100)

 const lines = [
  `🔒 **Set verrouillé** — débloque-le via :`,
  `• 📈 Atteindre le **niveau ${info.levelRequired}** (tu es niveau ${info.currentLevel})`,
 ]

 if(info.prevSet){
  lines.push(`• 📚 Compléter **${threshold}%** de **${info.prevSet}** (tu es à ${pct}%)`)
 }

 return lines.join("\n")

}

/* ================= ORDER ================= */

/**
 * Retourne les sets triés dans l'ordre de progression,
 * en séparant unlocked / locked.
 * @param {Array}  sets      — liste des sets (loadSets())
 * @param {object} user
 * @param {Array}  allCards
 * @returns {{ unlocked: Array, locked: Array }}
 */
function splitSetsByUnlock(sets, user, allCards){

 const order   = SET_UNLOCK_CONFIG.map(c => c.id)
 const sorted  = [...sets].sort((a, b) => {
  const ia = order.indexOf(a.id)
  const ib = order.indexOf(b.id)
  const ra  = ia === -1 ? 999 : ia
  const rb  = ib === -1 ? 999 : ib
  return ra - rb
 })

 const unlocked = sorted.filter(s => isSetUnlocked(user, s.id, allCards))
 const locked   = sorted.filter(s => !isSetUnlocked(user, s.id, allCards))

 return { unlocked, locked }

}

/* ================= EXPORTS ================= */

module.exports = {
 SET_UNLOCK_CONFIG,
 COMPLETION_UNLOCK_THRESHOLD,
 isSetUnlocked,
 getUnlockInfo,
 getUnlockMessage,
 computeSetCompletion,
 splitSetsByUnlock,
}