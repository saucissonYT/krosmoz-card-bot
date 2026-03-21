const { SlashCommandBuilder } = require("discord.js")

const { isDev } = require("../../systems/devSystem")

let cooldownDisabled = false

module.exports = {

 data: new SlashCommandBuilder()
  .setName("cooldown")
  .setDescription("Activer ou désactiver le cooldown global")
  .addStringOption(o =>
   o.setName("mode")
    .setDescription("Mode")
    .setRequired(true)
    .addChoices(
     { name:"off (désactiver cooldown)", value:"off" },
     { name:"on (activer cooldown)", value:"on" },
     { name:"status", value:"status" }
    )
  ),

 async execute(interaction){

  if(!isDev(interaction.user.id))
   return interaction.reply({
    content:"⛔ Commande dev.",
    ephemeral:true
   })

  const mode = interaction.options.getString("mode")

  if(mode === "off"){
   cooldownDisabled = true
   return interaction.reply("🟢 Cooldown **désactivé** pour tout le monde.")
  }

  if(mode === "on"){
   cooldownDisabled = false
   return interaction.reply("🔴 Cooldown **réactivé**.")
  }

  if(mode === "status"){
   return interaction.reply(
    `⚙️ Cooldown : ${cooldownDisabled ? "OFF" : "ON"}`
   )
  }

 },

 cooldownDisabled: () => cooldownDisabled

}