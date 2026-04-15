/* ================================================================
   INTERACTION CREATE HANDLER - Global error boundary
================================================================ */

const { createLogger, createTimer } = require("../../systems/logger")
const { isDiscordIdBanned } = require("../../systems/banlistSystem")

const { routeSlashInteraction } = require("./routes/slashRoutes")
const { routeSelectInteraction } = require("./routes/selectRoutes")
const { routeButtonInteraction } = require("./routes/buttonRoutes")
const { routeModalInteraction } = require("./routes/modalRoutes")

const log = createLogger("INTERACTION")

/**
 * Reply safely even when the interaction is already acknowledged.
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
  log.debug("Impossible d'envoyer le message d'erreur", {
   err: e.message,
   code: e.code
  })
 }
}

async function safeBanReply(interaction) {
 if (interaction.isAutocomplete()) {
  try {
   await interaction.respond([])
  } catch (_) {}
  return
 }

 await safeErrorReply(interaction, "Tu es banni de Krosmoz. Toutes les interactions sont bloquees.")
}

function registerInteractionCreateHandler(client) {
 client.on("interactionCreate", async (interaction) => {
  log.debug("Interaction recue", {
   type: interaction.type,
   command: interaction.commandName || interaction.customId || "unknown",
   user: interaction.user?.id
  })

  const timer = createTimer(interaction.commandName || interaction.customId || "interaction")

  try {
   if (isDiscordIdBanned(interaction.user?.id)) {
    log.warn("Interaction bloquee (banlist)", {
     user: interaction.user?.id,
     type: interaction.type,
     command: interaction.commandName || interaction.customId || "unknown"
    })
    await safeBanReply(interaction)
    return
   }

   if (interaction.isAutocomplete()) {
    const command = client.commands.get(interaction.commandName)
    if (command?.autocomplete) {
     await command.autocomplete(interaction)
    }
    return
   }

   if (interaction.isChatInputCommand()) {
    await routeSlashInteraction(interaction, client)
    log.debug("Slash termine", timer.end({ command: interaction.commandName }))
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
    return
   }
  } catch (error) {
   const errorContext = {
    type: interaction.type,
    command: interaction.commandName || interaction.customId || "unknown",
    user: interaction.user?.id,
    guild: interaction.guild?.id,
    channel: interaction.channel?.id,
    err: error
   }

   if (error.code === 10062) {
    log.warn("Interaction expiree (10062)", errorContext)
    return
   }

   if (error.code === 40060) {
    log.warn("Interaction deja repondue (40060)", errorContext)
    return
   }

   log.error("Erreur execution interaction", errorContext)
   await safeErrorReply(interaction, "Une erreur est survenue. Reessaie dans un instant.")
  }
 })
}

module.exports = {
 registerInteractionCreateHandler
}
