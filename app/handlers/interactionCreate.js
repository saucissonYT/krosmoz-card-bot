/* ════════════════════════════════════════════════════════════
   MODIFICATIONS :
   1. Utilise logger.js au lieu de console.log/console.error
   2. Ajoute du contexte aux erreurs (commande, user, guild)
   3. Log de debug pour chaque interaction (désactivable via LOG_LEVEL)
════════════════════════════════════════════════════════════ */

const { createLogger } = require("../../systems/logger")

const { routeSlashInteraction }  = require("./routes/slashRoutes")
const { routeSelectInteraction } = require("./routes/selectRoutes")
const { routeButtonInteraction } = require("./routes/buttonRoutes")
const { routeModalInteraction }  = require("./routes/modalRoutes")

const log = createLogger("INTERACTION")

function registerInteractionCreateHandler(client) {

 client.on("interactionCreate", async (interaction) => {

  /* Log de debug — désactivable via LOG_LEVEL=info en prod */
  log.debug("Interaction reçue", {
   type:    interaction.type,
   command: interaction.commandName || interaction.customId || "unknown",
   user:    interaction.user?.id
  })

  try {

   if (interaction.isAutocomplete()) {
    const command = client.commands.get(interaction.commandName)
    if (command?.autocomplete) await command.autocomplete(interaction)
    return
   }

   if (interaction.isChatInputCommand()) {
    await routeSlashInteraction(interaction, client)
    return
   }

   if (interaction.isStringSelectMenu()) {
    await routeSelectInteraction(interaction, client)
    return
   }

   if (interaction.isButton()) {
    await routeButtonInteraction(interaction, client)
    return
   }

   if (interaction.isModalSubmit()) {
    await routeModalInteraction(interaction, client)
   }

  } catch (error) {

   /* FIX : on ajoute du contexte pour faciliter le debug en prod */
   log.error("Erreur exécution interaction", {
    type:    interaction.type,
    command: interaction.commandName || interaction.customId || "unknown",
    user:    interaction.user?.id,
    guild:   interaction.guild?.id,
    err:     error
   })

   try {
    if (interaction.replied || interaction.deferred) {
     await interaction.followUp({
      content: "Une erreur est survenue.",
      ephemeral: true
     })
    } else {
     await interaction.reply({
      content: "Une erreur est survenue.",
      ephemeral: true
     })
    }
   } catch (e) {
    /* Interaction expirée ou déjà répondue — on log en debug */
    log.debug("Impossible d'envoyer le message d'erreur", { err: e.message })
   }

  }

 })

}

module.exports = {
 registerInteractionCreateHandler
}