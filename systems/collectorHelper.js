/* ═══════════════════════════════════════════════════════════════
   COLLECTOR HELPER — systems/collectorHelper.js

   Crée des collectors Discord avec cleanup automatique.
   Supprime les composants quand le collector expire, évite les
   fuites mémoire et les erreurs "Unknown interaction".

   Usage :
     const { createSafeCollector } = require("../../systems/collectorHelper")

     const collector = createSafeCollector(msg, {
       time: 120000,
       userId: interaction.user.id,  // filtre automatique
       onCollect: async (i) => { ... },
       onEnd: async (msg) => { ... }  // optionnel, par défaut supprime les composants
     })

   @param {Message} msg      - Le message Discord contenant les composants
   @param {Object}  options
   @returns {MessageComponentCollector}
═══════════════════════════════════════════════════════════════ */

const { createLogger } = require("./logger")
const log = createLogger("COLLECTOR")

/**
 * Crée un collector avec cleanup automatique.
 *
 * @param {import("discord.js").Message} msg
 * @param {Object} options
 * @param {number}   [options.time=120000]  - Durée du collector en ms
 * @param {string}   [options.userId]       - ID du user autorisé (filtre)
 * @param {Function} [options.onCollect]    - Handler de collect
 * @param {Function} [options.onEnd]        - Handler de fin (défaut: supprime composants)
 * @param {string}   [options.componentType] - Type de composant à filtrer
 * @returns {import("discord.js").InteractionCollector}
 */
function createSafeCollector(msg, options = {}) {

 const time = options.time || 120000

 const collectorOptions = { time }

 const collector = msg.createMessageComponentCollector(collectorOptions)

 /* ── Filter par userId ── */
 if (options.userId) {
  const originalOnCollect = options.onCollect
  options.onCollect = async (i) => {
   if (i.user.id !== options.userId) {
    return i.reply({ content: "Pas pour toi.", flags: 64 }).catch(() => {})
   }
   if (originalOnCollect) return originalOnCollect(i)
  }
 }

 /* ── onCollect ── */
 if (options.onCollect) {
  collector.on("collect", async (i) => {
   try {
    await options.onCollect(i)
   } catch (err) {
    log.error("Erreur collector collect", { err: err.message, customId: i.customId })
    try {
     if (!i.replied && !i.deferred) {
      await i.reply({ content: "Une erreur est survenue.", flags: 64 })
     }
    } catch (_) {}
   }
  })
 }

 /* ── onEnd — cleanup automatique ── */
 collector.on("end", async () => {
  try {
   if (options.onEnd) {
    await options.onEnd(msg)
   } else {
    /* Comportement par défaut : supprimer les composants */
    await msg.edit({ components: [] }).catch(() => {})
   }
  } catch (err) {
   /* Message supprimé ou indisponible — c'est OK */
   log.debug("Cleanup collector ignoré", { err: err.message })
  }
 })

 return collector
}

module.exports = { createSafeCollector }