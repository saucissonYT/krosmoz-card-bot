/* ═══════════════════════════════════════════════════════════════
   RATE LIMITER — systems/rateLimiter.js

   Middleware Express de rate limiting en mémoire.
   Aucune dépendance externe requise.

   Usage dans Server.js :
     const { createRateLimiter } = require("../systems/rateLimiter")
     app.use("/api/", createRateLimiter({ windowMs: 60000, max: 60 }))

   @param {Object} options
   @param {number} options.windowMs  - Fenêtre en ms (défaut: 60000 = 1 min)
   @param {number} options.max       - Requêtes max par fenêtre (défaut: 60)
   @param {string} options.message   - Message d'erreur (défaut: "Too many requests")
   @returns {Function} Middleware Express
═══════════════════════════════════════════════════════════════ */

/**
 * Crée un middleware Express de rate limiting.
 * Utilise une Map en mémoire avec cleanup automatique.
 *
 * @param {Object} options
 * @returns {Function}
 */
function createRateLimiter(options = {}) {

 const windowMs = options.windowMs || 60000
 const max      = options.max      || 60
 const message  = options.message  || "Too many requests. Try again later."

 /** @type {Map<string, {count: number, resetAt: number}>} */
 const clients = new Map()

 /* Cleanup toutes les 5 minutes pour éviter les fuites mémoire */
 const cleanupInterval = setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of clients) {
   if (now > entry.resetAt) clients.delete(key)
  }
 }, 5 * 60 * 1000)

 /* Ne pas bloquer le process.exit */
 if (cleanupInterval.unref) cleanupInterval.unref()

 return function rateLimiter(req, res, next) {
  const key = req.ip || req.connection?.remoteAddress || "unknown"
  const now = Date.now()

  let entry = clients.get(key)

  if (!entry || now > entry.resetAt) {
   entry = { count: 0, resetAt: now + windowMs }
   clients.set(key, entry)
  }

  entry.count++

  /* Headers informatifs */
  res.setHeader("X-RateLimit-Limit", max)
  res.setHeader("X-RateLimit-Remaining", Math.max(0, max - entry.count))
  res.setHeader("X-RateLimit-Reset", Math.ceil(entry.resetAt / 1000))

  if (entry.count > max) {
   res.setHeader("Retry-After", Math.ceil((entry.resetAt - now) / 1000))
   return res.status(429).json({ error: message })
  }

  next()
 }
}

module.exports = { createRateLimiter }