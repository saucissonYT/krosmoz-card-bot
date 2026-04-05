/* ═══════════════════════════════════════════════════════════════
   ECONOMY — systems/economy.js

   Gère les récompenses en kamas liées aux raretés de cartes.
   Source unique pour la logique de reward (réexporté par rewards.js).

   Les prix de base viennent de `RARITY_PRICE` dans constants.js.
   Les stats `kamasEarned` et `totalKamasEarned` sont trackées
   pour les achievements économiques.
═══════════════════════════════════════════════════════════════ */

const { RARITY_PRICE } = require("./constants")

/**
 * Récompense le joueur en kamas selon la rareté d'une carte.
 *
 * Ajoute le montant correspondant à `user.kamas` et met à jour
 * les stats `kamasEarned` et `totalKamasEarned`.
 *
 * @param {Object} user   - L'objet utilisateur (modifié en place)
 * @param {string} rarity - La rareté de la carte (C, U, R, SR, HR, UR, S, SSR)
 * @returns {number} Le montant de kamas gagnés (0 si rareté inconnue)
 */
function rewardKamas(user, rarity) {

 const gain = RARITY_PRICE[rarity] || 0

 user.kamas = (user.kamas || 0) + gain

 if (!user.stats) user.stats = {}

 user.stats.kamasEarned      = (user.stats.kamasEarned || 0) + gain
 user.stats.totalKamasEarned = (user.stats.totalKamasEarned || 0) + gain

 return gain
}

module.exports = {
 rewardKamas
}