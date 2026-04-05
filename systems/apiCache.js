/* ═══════════════════════════════════════════════════════════════
   API CACHE — systems/apiCache.js

   Cache mémoire avec TTL pour les endpoints coûteux (leaderboard,
   profils, activity feed). Se met à jour automatiquement quand le
   TTL expire. Supporte l'invalidation manuelle.

   Usage :
     const { apiCache } = require("../systems/apiCache")

     // Lire ou recalculer
     const data = apiCache.getOrCompute("leaderboard:cards", () => {
       return computeLeaderboard("cards")
     }, 60000) // TTL 60s

     // Invalider manuellement (après une action utilisateur)
     apiCache.invalidate("leaderboard:cards")

     // Invalider tout ce qui commence par un préfixe
     apiCache.invalidatePrefix("leaderboard:")

     // Invalider tout
     apiCache.clear()

   @module apiCache
═══════════════════════════════════════════════════════════════ */

const { createLogger } = require("./logger")
const log = createLogger("CACHE")

class ApiCache {

 constructor() {
  /** @type {Map<string, {data: any, expiresAt: number}>} */
  this._store = new Map()

  /* Cleanup toutes les 10 minutes */
  this._cleanupTimer = setInterval(() => this._cleanup(), 10 * 60 * 1000)
  if (this._cleanupTimer.unref) this._cleanupTimer.unref()
 }

 /**
  * Retourne la valeur en cache si elle n'est pas expirée,
  * sinon appelle computeFn, stocke le résultat et le retourne.
  *
  * @param {string}   key       - Clé unique
  * @param {Function} computeFn - Fonction de calcul (sync ou async)
  * @param {number}   ttlMs     - Durée de vie en ms (défaut: 60000)
  * @returns {any} Les données (depuis le cache ou recalculées)
  */
 getOrCompute(key, computeFn, ttlMs = 60000) {
  const now = Date.now()
  const entry = this._store.get(key)

  if (entry && now < entry.expiresAt) {
   return entry.data
  }

  /* Recalculer */
  const data = computeFn()
  this._store.set(key, { data, expiresAt: now + ttlMs })
  log.debug("Cache miss, recalculé", { key })
  return data
 }

 /**
  * Version async de getOrCompute pour les fonctions asynchrones.
  *
  * @param {string}   key
  * @param {Function} computeFn - Async function
  * @param {number}   ttlMs
  * @returns {Promise<any>}
  */
 async getOrComputeAsync(key, computeFn, ttlMs = 60000) {
  const now = Date.now()
  const entry = this._store.get(key)

  if (entry && now < entry.expiresAt) {
   return entry.data
  }

  const data = await computeFn()
  this._store.set(key, { data, expiresAt: now + ttlMs })
  log.debug("Cache async miss, recalculé", { key })
  return data
 }

 /**
  * Invalide une clé spécifique.
  * @param {string} key
  */
 invalidate(key) {
  this._store.delete(key)
 }

 /**
  * Invalide toutes les clés qui commencent par le préfixe donné.
  * Utile pour invalider tous les leaderboards d'un coup.
  *
  * @param {string} prefix
  */
 invalidatePrefix(prefix) {
  for (const key of this._store.keys()) {
   if (key.startsWith(prefix)) {
    this._store.delete(key)
   }
  }
 }

 /**
  * Vide tout le cache.
  */
 clear() {
  this._store.clear()
 }

 /**
  * Retourne le nombre d'entrées en cache (pour /health).
  * @returns {number}
  */
 size() {
  return this._store.size
 }

 /**
  * Supprime les entrées expirées.
  * @private
  */
 _cleanup() {
  const now = Date.now()
  let cleaned = 0
  for (const [key, entry] of this._store) {
   if (now >= entry.expiresAt) {
    this._store.delete(key)
    cleaned++
   }
  }
  if (cleaned > 0) {
   log.debug("Cache cleanup", { cleaned, remaining: this._store.size })
  }
 }
}

/* Singleton — une seule instance pour tout le serveur */
const apiCache = new ApiCache()

module.exports = { apiCache }