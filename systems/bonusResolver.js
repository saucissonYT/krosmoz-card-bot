/* ═══════════════════════════════════════════════════════════════
   BONUS RESOLVER — systems/bonusResolver.js

   Point central pour calculer TOUS les bonus d'un joueur.
   Élimine les require() circulaires entre packEngine, guildSystem,
   playerBonuses, guildBonuses.

   Usage :
     const { resolveAllBonuses } = require("./bonusResolver")
     const bonuses = resolveAllBonuses(userId, user)

   @param {string} userId - ID Discord
   @param {Object} user   - Objet utilisateur (avec progression.level)
   @returns {Object} Tous les bonus agrégés
═══════════════════════════════════════════════════════════════ */

const { createLogger } = require("./logger")
const log = createLogger("BONUS")

/**
 * Résout tous les bonus d'un joueur (guilde + niveau).
 * Chaque source est chargée de façon lazy et protégée par try/catch.
 *
 * @param {string} userId
 * @param {Object} user
 * @returns {{
 *   kamasBonus: number,
 *   luckyPackBonus: number,
 *   xpBonus: number,
 *   shinyBonus: number,
 *   critBonus: number,
 *   doubleBonus: number,
 *   tripleBonus: number,
 *   cooldownReduction: number,
 *   dailyBonusPacks: number,
 *   doubleDailyBonus: number,
 *   shopDiscount: number,
 *   bpXpBonus: number
 * }}
 */
function resolveAllBonuses(userId, user) {

 const result = {
  /* Communs pack + économie */
  kamasBonus:        0,
  luckyPackBonus:    0,
  xpBonus:           0,
  shinyBonus:        0,

  /* Fusion */
  critBonus:         0,
  doubleBonus:       0,
  tripleBonus:       0,

  /* Daily / cooldown */
  cooldownReduction: 0,
  dailyBonusPacks:   0,
  doubleDailyBonus:  0,

  /* Shop */
  shopDiscount:      0,

  /* Battle Pass */
  bpXpBonus:         0
 }

 /* ── Guild bonuses ── */
 try {
  const { getUserGuildBonuses } = require("./guildBonuses")
  const gb = getUserGuildBonuses(userId)
  if (gb) {
   result.kamasBonus        += gb.kamasBonus        || 0
   result.luckyPackBonus    += gb.luckyPackBonus    || 0
   result.xpBonus           += gb.xpBonus           || 0
   result.critBonus         += gb.critBonus         || 0
   result.doubleBonus       += gb.doubleBonus       || 0
   result.tripleBonus       += gb.tripleBonus       || 0
   result.cooldownReduction += gb.cooldownReduction || 0
   result.dailyBonusPacks   += gb.dailyBonusPacks   || 0
   result.doubleDailyBonus  += gb.doubleDailyBonus  || 0
   result.shopDiscount      += gb.shopDiscount      || 0
   result.bpXpBonus         += gb.bpXpBonus         || 0
  }
 } catch (e) {
  log.debug("Guild bonuses indisponibles", { err: e.message })
 }

 /* ── Player level bonuses ── */
 try {
  const { getPlayerBonuses } = require("./playerBonuses")
  const pb = getPlayerBonuses(user.progression?.level || 1)
  if (pb) {
   result.kamasBonus        += pb.kamasBonus        || 0
   result.luckyPackBonus    += pb.luckyPackBonus    || 0
   result.xpBonus           += pb.xpBonus           || 0
   result.shinyBonus        += pb.shinyBonus        || 0
   result.critBonus         += pb.critBonus         || 0
   result.doubleBonus       += pb.doubleBonus       || 0
   result.tripleBonus       += pb.tripleBonus       || 0
   result.cooldownReduction += pb.cooldownReduction || 0
   result.dailyBonusPacks   += pb.dailyBonusPacks   || 0
   result.doubleDailyBonus  += pb.doubleDailyBonus  || 0
   result.shopDiscount      += pb.shopDiscount      || 0
   result.bpXpBonus         += pb.bpXpBonus         || 0
  }
 } catch (e) {
  log.debug("Player bonuses indisponibles", { err: e.message })
 }

 return result
}

module.exports = { resolveAllBonuses }