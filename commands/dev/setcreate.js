const { SlashCommandBuilder, EmbedBuilder } = require("discord.js")

const { isDev } = require("../../systems/devSystem")
const { addSet } = require("../../systems/setSystemFile")

module.exports = {

 data: new SlashCommandBuilder()
  .setName("setcreate")
  .setDescription("Créer un set")
  .addStringOption(option =>
   option
    .setName("name")
    .setDescription("Nom du set")
    .setRequired(true)
  )
  .addIntegerOption(option =>
   option
    .setName("reward")
    .setDescription("Récompense en kamas")
    .setRequired(true)
  ),

 async execute(interaction){

  if(!isDev(interaction.user.id))
   return interaction.reply({
    content:"⛔ Commande dev.",
    ephemeral:true
   })

  const name = interaction.options.getString("name")
  const reward = interaction.options.getInteger("reward")

  if(!name || !name.trim())
   return interaction.reply({
    content:"❌ Nom invalide.",
    ephemeral:true
   })

  const result = addSet(name, reward)

  if(result?.error)
   return interaction.reply({
    content:`❌ ${result.error}`,
    ephemeral:true
   })

  const embed = new EmbedBuilder()
   .setTitle("📦 Set créé")
   .setColor("#2ecc71")
   .addFields(
    { name:"Nom", value:result.name, inline:true },
    { name:"ID", value:result.id, inline:true },
    { name:"Reward", value:`${result.reward} kamas`, inline:true }
   )

  interaction.reply({ embeds:[embed], ephemeral:true })

 }

}