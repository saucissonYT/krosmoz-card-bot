const { SlashCommandBuilder, EmbedBuilder } = require("discord.js")

const { isDev } = require("../../systems/devSystem")
const { editSetReward, loadSets } = require("../../systems/setSystemFile")

module.exports = {

 data: (() => {

  const rawSets = loadSets()
  const sets = Array.isArray(rawSets) ? rawSets : rawSets?.sets || []

  const builder = new SlashCommandBuilder()
   .setName("setreward")
   .setDescription("Modifier la récompense d'un set")
   .addIntegerOption(o =>
    o.setName("reward")
     .setDescription("Nouvelle récompense en kamas")
     .setRequired(true)
   )

  builder.addStringOption(o => {
   o.setName("set")
    .setDescription("Set")
    .setRequired(true)

   if(sets.length > 0){
    o.addChoices(
     ...sets.slice(0, 25).map(s => ({
      name:s.name,
      value:s.id
     }))
    )
   }

   return o
  })

  return builder

 })(),

 async execute(interaction){

  if(!isDev(interaction.user.id))
   return interaction.reply({
    content:"⛔ Commande dev.",
    ephemeral:true
   })

  const id = interaction.options.getString("set")
  const reward = interaction.options.getInteger("reward")

  const result = editSetReward(id, reward)

  if(result.error)
   return interaction.reply({ content:`❌ ${result.error}`, ephemeral:true })

  const embed = new EmbedBuilder()
   .setTitle("💰 Récompense modifiée")
   .setColor("#2ecc71")
   .addFields(
    { name:"Set", value:result.name, inline:true },
    { name:"Reward", value:`${result.reward} kamas`, inline:true }
   )

  interaction.reply({ embeds:[embed], ephemeral:true })

 }

}