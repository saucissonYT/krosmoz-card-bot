const { SlashCommandBuilder } = require("discord.js")

const { isDev }         = require("../../systems/devSystem")
const { launchPinata }  = require("../../systems/pinataEvent")

module.exports = {

 data: new SlashCommandBuilder()
  .setName("forcepinata")
  .setDescription("🪅 [DEV] Forcer le lancement d'une piñata dans ce salon"),

 async execute(interaction) {

  if (!isDev(interaction.user.id))
   return interaction.reply({ content: "⛔ Commande dev.", flags: 64 })

  if (!interaction.channel || !interaction.channel.isTextBased())
   return interaction.reply({ content: "❌ Ce salon ne supporte pas les piñatas.", flags: 64 })

  await interaction.reply({ content: "🪅 Lancement de la piñata...", flags: 64 })

  await launchPinata(interaction.channel)
 }
}