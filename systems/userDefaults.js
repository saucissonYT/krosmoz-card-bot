/* ═══════════════════════════════════════════════════════════════
   USER DEFAULTS — systems/userDefaults.js

   Garantit que chaque objet user a toutes les propriétés requises.
   Appelé une seule fois dans loadUser() / getUser() du userSystem.

   Remplace les dizaines de :
     if (!user.stats) user.stats = {}
     if (!user.cards) user.cards = {}
   dispersées dans toutes les commandes.

   Usage :
     const { ensureUserStructure } = require("./userDefaults")
     const user = JSON.parse(raw)
     ensureUserStructure(user)
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

 /* ── Achievements ── */

 if (!user.achievements) user.achievements = {}

 /* ── Titres ── */

 if (!user.titles) user.titles = ["Nouveau"]

 /* ── Badges ── */

 if (!user.badges) user.badges = []

 /* ── Cooldowns ── */

 if (!user.cooldowns) user.cooldowns = {}

 return user

}

module.exports = { ensureUserStructure }