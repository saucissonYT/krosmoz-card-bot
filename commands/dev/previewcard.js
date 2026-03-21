const { SlashCommandBuilder, EmbedBuilder } = require("discord.js")
const { RARITY_EMOJI } = require("../../systems/constants")
const { isDev } = require("../../systems/devSystem")

module.exports = {

 data: new SlashCommandBuilder()
  .setName("previewcard")
  .setDescription("Prévisualiser une carte")
  .addStringOption(o =>
   o.setName("nom")
    .setDescription("Nom de la carte")
    .setRequired(true)
  )
  .addStringOption(o =>
   o.setName("rarete")
    .setDescription("Rareté")
    .setRequired(true)
    .addChoices(
     { name:"C", value:"C" },
     { name:"U", value:"U" },
     { name:"R", value:"R" },
     { name:"SR", value:"SR" },
     { name:"HR", value:"HR" },
     { name:"UR", value:"UR" },
     { name:"S", value:"S" },
     { name:"SSR", value:"SSR" }
    )
  )
  .addAttachmentOption(o =>
   o.setName("image")
    .setDescription("Image de la carte")
    .setRequired(true)
  )
  .addStringOption(o =>
   o.setName("set")
    .setDescription("Set (optionnel)")
    .setRequired(false)
  ),

 async execute(interaction){

  if(!isDev(interaction.user.id))
   return interaction.reply({
    content:"⛔ Commande dev.",
    ephemeral:true
   })

  const name = interaction.options.getString("nom")
  const rarity = interaction.options.getString("rarete")
  const set = interaction.options.getString("set")
  const attachment = interaction.options.getAttachment("image")

  const embed = new EmbedBuilder()
   .setTitle(`${RARITY_EMOJI[rarity]} ${name}`)
   .setDescription(
`Rareté : ${rarity}
Set : ${set || "Aucun"}`
   )
   .setImage(attachment.url)

  interaction.reply({ embeds:[embed] })

 }

}