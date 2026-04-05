/* ═══════════════════════════════════════════════════════════════
   INPUT VALIDATOR — systems/inputValidator.js

   Validation centralisée des inputs utilisateur.
   Empêche les crashes sur données malformées.

   Usage :
     const { validateUserId, validateCardId, validateAmount, validateGuildName } = require("./inputValidator")

     const { valid, error } = validateUserId(id)
     if (!valid) return interaction.reply({ content: error, flags: 64 })
═══════════════════════════════════════════════════════════════ */

/**
 * Valide un ID Discord (16 à 22 chiffres).
 * @param {any} id
 * @returns {{ valid: boolean, error?: string, value?: string }}
 */
function validateUserId(id) {
 if (!id) return { valid: false, error: "ID utilisateur manquant." }
 const str = String(id)
 if (!/^\d{16,22}$/.test(str)) return { valid: false, error: "ID utilisateur invalide." }
 return { valid: true, value: str }
}

/**
 * Valide un ID de carte (entier positif).
 * @param {any} id
 * @returns {{ valid: boolean, error?: string, value?: number }}
 */
function validateCardId(id) {
 if (id === null || id === undefined) return { valid: false, error: "ID de carte manquant." }
 const num = Number(id)
 if (!Number.isFinite(num) || num < 1 || !Number.isInteger(num)) {
  return { valid: false, error: "ID de carte invalide (entier positif attendu)." }
 }
 return { valid: true, value: num }
}

/**
 * Valide un montant (kamas, prix, quantité).
 * @param {any}    amount
 * @param {Object} [options]
 * @param {number} [options.min=1]     - Minimum autorisé
 * @param {number} [options.max=Infinity] - Maximum autorisé
 * @param {string} [options.label="Montant"]
 * @returns {{ valid: boolean, error?: string, value?: number }}
 */
function validateAmount(amount, options = {}) {
 const min   = options.min   ?? 1
 const max   = options.max   ?? Infinity
 const label = options.label ?? "Montant"

 if (amount === null || amount === undefined) {
  return { valid: false, error: `${label} manquant.` }
 }

 const num = Number(amount)

 if (!Number.isFinite(num) || !Number.isInteger(num)) {
  return { valid: false, error: `${label} invalide (entier attendu).` }
 }

 if (num < min) return { valid: false, error: `${label} trop bas (min: ${min}).` }
 if (num > max) return { valid: false, error: `${label} trop élevé (max: ${max}).` }

 return { valid: true, value: num }
}

/**
 * Valide un nom de guilde.
 * @param {any} name
 * @returns {{ valid: boolean, error?: string, value?: string }}
 */
function validateGuildName(name) {
 if (!name || typeof name !== "string") {
  return { valid: false, error: "Nom de guilde manquant." }
 }

 const trimmed = name.trim()

 if (trimmed.length < 2)  return { valid: false, error: "Nom trop court (min 2 caractères)." }
 if (trimmed.length > 32) return { valid: false, error: "Nom trop long (max 32 caractères)." }

 /* Anti-injection basique */
 if (/[<>@#&\\]/.test(trimmed)) {
  return { valid: false, error: "Nom contient des caractères interdits." }
 }

 return { valid: true, value: trimmed }
}

/**
 * Valide un ID de set.
 * @param {any}   setId
 * @param {Array} [validSets] - Liste des sets valides (optionnel)
 * @returns {{ valid: boolean, error?: string, value?: string }}
 */
function validateSetId(setId, validSets) {
 if (!setId || typeof setId !== "string") {
  return { valid: false, error: "ID de set manquant." }
 }

 const trimmed = setId.trim().toLowerCase()

 if (trimmed.length < 1 || trimmed.length > 50) {
  return { valid: false, error: "ID de set invalide." }
 }

 if (validSets && !validSets.includes(trimmed)) {
  return { valid: false, error: `Set "${trimmed}" inconnu.` }
 }

 return { valid: true, value: trimmed }
}

/**
 * Valide une rareté.
 * @param {any} rarity
 * @returns {{ valid: boolean, error?: string, value?: string }}
 */
function validateRarity(rarity) {
 const VALID = ["C","U","R","SR","HR","UR","S","SSR"]
 if (!rarity || typeof rarity !== "string") {
  return { valid: false, error: "Rareté manquante." }
 }
 const upper = rarity.toUpperCase()
 if (!VALID.includes(upper)) {
  return { valid: false, error: `Rareté invalide : ${rarity}` }
 }
 return { valid: true, value: upper }
}

module.exports = {
 validateUserId,
 validateCardId,
 validateAmount,
 validateGuildName,
 validateSetId,
 validateRarity
}