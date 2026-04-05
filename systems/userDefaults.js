/* ═══════════════════════════════════════════════════════════════
   USER DEFAULTS — systems/userDefaults.js

   Garantit que chaque objet user a toutes les propriétés requises.
   Appelé une seule fois dans loadUser() / getUser() du userSystem.

   FIX: achievements initialisé en [] (tableau) et non {} (objet).
   L'achievementEngine utilise .includes() et .push() qui nécessitent
   un tableau. Un objet {} causait des doublons silencieux.
═══════════════════════════════════════════════════════════════ */

/**
 * Garantit que toutes les propriétés essentielles existent sur l'objet user.
 * Modifie l'objet en place et le retourne.
 *
 * @param {Object} user - L'objet utilisateur
 * @returns {Object} Le même objet, complété
 */
function ensureUserStructure(user) {

 if (!user) return user

 /* ── Collections ── */

 if (!user.cards)      user.cards      = {}
 if (!user.shinyCards)  user.shinyCards  = {}
 if (!user.fragments)   user.fragments   = []

 /* ── Économie ── */

 if (user.kamas === undefined) user.kamas = 0

 /* ── Progression ── */

 if (user.level === undefined) user.level = 1
 if (user.xp === undefined)    user.xp    = 0

 /* ── Pity ── */

 if (!user.pity) user.pity = {}

 /* ── Stats ── */

 if (!user.stats) user.stats = {}

 /* ── Achievements — DOIT être un tableau [] ── */

 if (!Array.isArray(user.achievements)) user.achievements = []

 /* ── Titres ── */

 if (!user.titles || !Array.isArray(user.titles)) user.titles = ["Nouveau"]

 /* ── Badges ── */

 if (!user.badges || !Array.isArray(user.badges)) user.badges = []

 /* ── Cooldowns ── */

 if (!user.cooldowns) user.cooldowns = {}

 return user

}

module.exports = { ensureUserStructure }