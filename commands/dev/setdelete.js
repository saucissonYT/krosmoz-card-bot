const { SlashCommandBuilder, EmbedBuilder } = require("discord.js")

const { isDev } = require("../../systems/devSystem")
const { deleteSet, loadSets } = require("../../systems/setSystemFile")

module.exports = {

 data: (() => {

  const rawSets = loadSets()
  const sets = Array.isArray(rawSets) ? rawSets : rawSets?.sets || []

  const builder = new SlashCommandBuilder()
   .setName("setdelete")
   .setDescription("Supprimer un set")

  builder.addStringOption(option => {

   option
    .setName("set")
    .setDescription("Set à supprimer")
    .setRequired(true)

   if(sets.length > 0){
    option.addChoices(
     ...sets.slice(0, 25).map(s => ({
      name:s.name,
      value:s.id
     }))
    )
   }

   return option

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

  const result = deleteSet(id)

  if(result?.error)
   return interaction.reply({
    content:`❌ ${result.error}`,
    ephemeral:true
   })

  const embed = new EmbedBuilder()
   .setTitle("🗑 Set supprimé")
   .setColor("#e74c3c")
   .setDescription(`Le set **${result.name}** (\`${id}\`) a été supprimé.`)

  interaction.reply({ embeds:[embed], ephemeral:true })

 }

}