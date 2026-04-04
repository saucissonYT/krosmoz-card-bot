/* ═══════════════════════════════════════════════════════════════
   COLLECTOR HELPER — systems/collectorHelper.js

   Wrapper sécurisé pour les collectors Discord.
   Remplace le pattern répété dans chaque commande avec boutons :
   - Vérification que c'est bien le bon utilisateur
   - Try/catch automatique avec fallback d'erreur
   - Nettoyage des composants en fin de collector

   Usage :
     const { createSafeCollector } = require("../../systems/collectorHelper")

     createSafeCollector(msg, interaction, {
       time: 120000,
       onCollect: async (i) => {
         // ta logique ici — i.user.id est garanti === interaction.user.id
       },
       onEnd: () => {
         // optionnel — par défaut retire les composants
       }
     })
═══════════════════════════════════════════════════════════════ */

const { createLogger } = require("./logger")

const log = createLogger("COLLECTOR")

/**
 * Crée un collector sécurisé avec vérification utilisateur,
 * gestion d'erreur et nettoyage automatique.
 *
 * @param {Message} msg - Le message Discord contenant les composants
 * @param {CommandInteraction} interaction - L'interaction d'origine (pour vérifier l'utilisateur)
 * @param {Object} options
 * @param {number} [options.time=120000] - Durée du collector en ms
 * @param {Function} options.onCollect - Callback appelé quand l'utilisateur interagit
 * @param {Function} [options.onEnd] - Callback optionnel en fin de collector
 * @returns {InteractionCollector}
 */
function createSafeCollector(msg, interaction, options = {}) {

 const {
  time = 120000,
  onCollect,
  onEnd
 } = options

 const collector = msg.createMessageComponentCollector({ time })

 collector.on("collect", async (i) => {

  /* ── Vérification utilisateur ── */

  if (i.user.id !== interaction.user.id) {
   return i.reply({
    content: "❌ Ce n'est pas ton menu.",
    flags: 64
   })
  }

  /* ── Exécution sécurisée ── */

  try {

   await onCollect(i)

  } catch (err) {

   log.error("Erreur dans collector", {
    command: interaction.commandName || interaction.customId || "unknown",
    user: interaction.user?.id,
    err
   })

   try {
    if (!i.replied && !i.deferred) {
     await i.reply({ content: "❌ Une erreur est survenue.", flags: 64 })
    } else {
     await i.followUp({ content: "❌ Une erreur est survenue.", flags: 64 })
    }
   } catch (_) {
    /* Interaction expirée — rien à faire */
   }

  }

 })

 /* ── Fin du collector ── */

 collector.on("end", () => {

  if (onEnd) return onEnd()

  /* Par défaut : retirer les composants */
  msg.edit({ components: [] }).catch(() => {})

 })

 return collector

}

module.exports = { createSafeCollector }