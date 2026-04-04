    /* ═══════════════════════════════════════════════════════════════
   INPUT VALIDATOR — systems/inputValidator.js

   Fonctions de validation réutilisables pour les entrées
   des commandes Discord. Chaque fonction retourne un objet
   { ok, value/card/error } pour un pattern cohérent.

   Usage :
     const { validateCardId } = require("../../systems/inputValidator")
     const result = validateCardId(id, cardsById)
     if (!result.ok) return interaction.reply(result.error)
     const card = result.card
═══════════════════════════════════════════════════════════════ */

/**
 * Valide un ID de carte et retourne la carte si elle existe.
 *
 * @param {*} id - L'ID fourni par l'utilisateur
 * @param {Object} cardsById - Le dictionnaire de cartes indexé par ID
 * @returns {{ ok: boolean, card?: Object, error?: string }}
 */
function validateCardId(id, cardsById) {

 if (id === null || id === undefined) {
  return { ok: false, error: "❌ ID de carte requis." }
 }

 if (!Number.isInteger(id) || id < 0) {
  return { ok: false, error: "❌ ID de carte invalide." }
 }

 const card = cardsById[id]

 if (!card) {
  return { ok: false, error: "❌ Carte introuvable." }
 }

 return { ok: true, card }

}

/**
 * Valide qu'une valeur est un entier positif.
 *
 * @param {*} value - La valeur à valider
 * @param {string} [name="valeur"] - Nom affiché dans le message d'erreur
 * @returns {{ ok: boolean, value?: number, error?: string }}
 */
function validatePositiveInteger(value, name = "valeur") {

 if (!Number.isInteger(value) || value <= 0) {
  return { ok: false, error: `❌ ${name} doit être un entier positif.` }
 }

 return { ok: true, value }

}

/**
 * Valide un prix dans une fourchette donnée.
 *
 * @param {*} price - Le prix à valider
 * @param {number} [min=1] - Prix minimum
 * @param {number} [max=999999] - Prix maximum
 * @returns {{ ok: boolean, price?: number, error?: string }}
 */
function validatePrice(price, min = 1, max = 999999) {

 if (!Number.isFinite(price) || price < min || price > max) {
  return { ok: false, error: `❌ Prix invalide (doit être entre ${min} et ${max}).` }
 }

 return { ok: true, price: Math.floor(price) }

}

/**
 * Valide qu'un utilisateur possède au moins N exemplaires d'une carte.
 *
 * @param {Object} user - L'objet utilisateur
 * @param {string|number} cardId - L'ID de la carte
 * @param {number} [minCount=1] - Nombre minimum requis
 * @returns {{ ok: boolean, count?: number, error?: string }}
 */
function validateOwnership(user, cardId, minCount = 1) {

 const count = user.cards?.[cardId] || 0

 if (count < minCount) {
  return {
   ok: false,
   count,
   error: minCount === 1
    ? "❌ Tu ne possèdes pas cette carte."
    : `❌ Tu n'as que ${count} exemplaire(s) (${minCount} requis).`
  }
 }

 return { ok: true, count }

}

module.exports = {
 validateCardId,
 validatePositiveInteger,
 validatePrice,
 validateOwnership
}