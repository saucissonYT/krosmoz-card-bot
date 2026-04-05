/* ════════════════════════════════════════════════════════════
   INTERACTION CREATE HANDLER — Error boundary global

   MODIFICATIONS :
   1. Logger structuré
   2. Error boundary renforcé avec contexte complet
   3. Protection contre les interactions expirées
   4. Timer de performance sur chaque commande
════════════════════════════════════════════════════════════ */

const { createLogger, createTimer } = require("../../systems/logger")

const { routeSlashInteraction }  = require("./routes/slashRoutes")
const { routeSelectInteraction } = require("./routes/selectRoutes")
const { routeButtonInteraction } = require("./routes/buttonRoutes")
const { routeModalInteraction }  = require("./routes/modalRoutes")

const log = createLogger("INTERACTION")

/**
 * Tente de répondre à l'utilisateur en cas d'erreur.
 * Gère tous les cas : replied, deferred, expired.
 *
 * @param {import("discord.js").Interaction} interaction
 * @param {string} message
 */
async function safeErrorReply(interaction, message) {
 try {
  if (interaction.replied || interaction.deferred) {
   await interaction.followUp({ content: message, ephemeral: true })
  } else {
   await interaction.reply({ content: message, ephemeral: true })
  }
 } catch (e) {
  /* Interaction expirée (>3s) ou déjà répondue — on log en debug */
  log.debug("Impossible d'envoyer le message d'erreur", {
   err: e.message,
   code: e.code
  })
 }
}

function registerInteractionCreateHandler(client) {

 client.on("interactionCreate", async (interaction) => {

  /* Log de debug — désactivable via LOG_LEVEL=info en prod */
  log.debug("Interaction reçue", {
   type:    interaction.type,
   command: interaction.commandName || interaction.customId || "unknown",
   user:    interaction.user?.id
  })

  const timer = createTimer(interaction.commandName || interaction.customId || "interaction")

  try {

   /* ── Autocomplete ── */
   if (interaction.isAutocomplete()) {
    const command = client.commands.get(interaction.commandName)
    if (command?.autocomplete) {
     await command.autocomplete(interaction)
    }
    return
   }

   /* ── Slash commands ── */
   if (interaction.isChatInputCommand()) {
    await routeSlashInteraction(interaction, client)
    log.debug("Slash terminé", timer.end({ command: interaction.commandName }))
    return
   }

   /* ── Select menus ── */
   if (interaction.isStringSelectMenu()) {
    await routeSelectInteraction(interaction, client)
    return
   }

   /* ── Buttons ── */
   if (interaction.isButton()) {
    await routeButtonInteraction(interaction, client)
    return
   }

   /* ── Modals ── */
   if (interaction.isModalSubmit()) {
    await routeModalInteraction(interaction, client)
    return
   }

  } catch (error) {

   /* ── Error boundary global ── */
   const errorContext = {
    type:    interaction.type,
    command: interaction.commandName || interaction.customId || "unknown",
    user:    interaction.user?.id,
    guild:   interaction.guild?.id,
    channel: interaction.channel?.id,
    err:     error
   }

   /* Différencier les erreurs Discord des erreurs logiques */
   if (error.code === 10062) {
    /* Unknown Interaction — l'interaction a expiré (>3s) */
    log.warn("Interaction expirée (10062)", errorContext)
    return
   }

   if (error.code === 40060) {
    /* Interaction already acknowledged */
    log.warn("Interaction déjà répondue (40060)", errorContext)
    return
   }

   /* Erreur réelle — on log en error */
   log.error("Erreur exécution interaction", errorContext)

   await safeErrorReply(interaction, "Une erreur est survenue. Réessaie dans un instant.")
  }

 })

}

module.exports = {
 registerInteractionCreateHandler
}