const {
 SlashCommandBuilder,
 StringSelectMenuBuilder,
 ActionRowBuilder
} = require("discord.js")

const { getUser } = require("../../systems/userSystem")
const { achievementCheck } = require("../../systems/achievementCheck")

module.exports = {

 data:new SlashCommandBuilder()
  .setName("titre")
  .setDescription("Choisir ton titre"),

 async execute(interaction){

  const user = getUser(interaction.user.id)

  if(!user.stats) user.stats={}
  user.stats.titleOpen=(user.stats.titleOpen||0)+1

  const titles = user.titles || ["Nouveau"]

  const menu = new StringSelectMenuBuilder()

   .setCustomId("choose_title")

   .setPlaceholder("Choisir un titre")

   .addOptions(

    titles.map(t => ({
     label:t,
     value:t
    }))

   )

  const row = new ActionRowBuilder()
   .addComponents(menu)

  await interaction.reply({
   content:"👑 Choisis ton titre :",
   components:[row],
   ephemeral:true
  })

  await achievementCheck(interaction,user,"social")

 }

}