const { routeSlashInteraction } = require("./routes/slashRoutes")
const { routeSelectInteraction } = require("./routes/selectRoutes")
const { routeButtonInteraction } = require("./routes/buttonRoutes")
const { routeModalInteraction } = require("./routes/modalRoutes")

function registerInteractionCreateHandler(client) {
 client.on("interactionCreate", async (interaction) => {
  console.log(`Interaction recue : ${interaction.type}`)

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
   console.error("ERREUR :", error)

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
    console.error("Impossible d'envoyer le message d'erreur :", e.message)
   }
  }
 })
}

module.exports = {
 registerInteractionCreateHandler
}