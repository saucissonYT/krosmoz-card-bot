/* ═══════════════════════════════════════════════════════════════
   SELL HELPER — systems/sellHelper.js

   Utilitaires partagés pour la vente de cartes.
   Extrait de sellcard.js et sellduplicate.js pour éviter la
   duplication du calcul du multiplicateur saisonnier.

   Usage :
     const { getSeasonSellMultiplier } = require("../../systems/sellHelper")
     const multiplier = getSeasonSellMultiplier() // 1.0 par défaut, > 1 si bonus saison
═══════════════════════════════════════════════════════════════ */

const { ensureCurrentSeason, getSeasonTemplate } = require("./seasonService")

/**
 * Cache interne pour éviter de recalculer le multiplicateur
 * à chaque appel (TTL de 15 secondes).
 * @type {{ value: number, expiresAt: number }}
 */
let sellMultiplierCache = {
 value:     1,
 expiresAt: 0
}

/**
 * Retourne le multiplicateur de vente saisonnier.
 *
 * Vérifie si la saison active a un `passiveBonus` de type
 * `market_sell_bonus`. Si oui, retourne sa valeur (ex: 1.25 = +25%).
 * Sinon, retourne 1 (pas de bonus).
 *
 * Le résultat est mis en cache pendant 15 secondes pour éviter
 * de relire les fichiers de saison à chaque vente.
 *
 * @returns {number} Multiplicateur (1.0 = pas de bonus)
 */
function getSeasonSellMultiplier() {

 if (Date.now() < sellMultiplierCache.expiresAt) {
  return sellMultiplierCache.value
 }

 let value = 1

 try {
  const current = ensureCurrentSeason()
  const season  = getSeasonTemplate(current.activeSeason)
  const bonus   = season?.passiveBonus

  if (bonus?.type === "market_sell_bonus") {
   const parsed = Number(bonus.value)
   if (Number.isFinite(parsed) && parsed > 0) value = parsed
  }
 } catch (_) {}

 sellMultiplierCache = {
  value,
  expiresAt: Date.now() + 15000
 }

 return value
}

/**
 * Calcule le pourcentage de bonus affiché au joueur.
 * @param {number} multiplier - Résultat de getSeasonSellMultiplier()
 * @returns {number} Pourcentage entier (0 si pas de bonus)
 */
function getSellBonusPercent(multiplier) {
 return Math.max(0, Math.round((multiplier - 1) * 100))
}

/**
 * Calcule le prix de vente d'une carte avec le bonus saisonnier.
 * @param {number} basePrice  - Prix de base (depuis SELL_PRICE)
 * @param {number} multiplier - Résultat de getSeasonSellMultiplier()
 * @returns {number} Prix final (minimum 1)
 */
function computeSellPrice(basePrice, multiplier) {
 return Math.max(1, Math.floor(basePrice * multiplier))
}

module.exports = {
 getSeasonSellMultiplier,
 getSellBonusPercent,
 computeSellPrice
}