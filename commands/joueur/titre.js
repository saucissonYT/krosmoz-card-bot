const {
 SlashCommandBuilder,
 StringSelectMenuBuilder,
 ActionRowBuilder,
 EmbedBuilder
} = require("discord.js")

const { getUser, save } = require("../../systems/userSystem")
const { achievementCheck } = require("../../systems/achievementCheck")
const { notifyAchievements } = require("../../systems/achievementNotifier")

module.exports = {

 data:new SlashCommandBuilder()
  .setName("titre")
  .setDescription("Choisir ton titre"),

 /* ================= COMMANDE ================= */

 async execute(interaction){

  const user = getUser(interaction.user.id)

  if(!user.stats) user.stats={}
  user.stats.titleOpen=(user.stats.titleOpen||0)+1

  const titles = user.titles || ["Nouveau"]

  const currentTitle = user.title || titles[0]

  const menu = new StringSelectMenuBuilder()

   .setCustomId("choose_title")

   .setPlaceholder("Choisir un titre")

   .addOptions(

    titles.map(t => ({
     label:t,
     value:t,
     description: t === currentTitle ? "Titre actuel" : undefined,
     default: t === currentTitle
    }))

   )

  const row = new ActionRowBuilder().addComponents(menu)

  const embed = new EmbedBuilder()
   .setTitle("👑 Gestion du titre")
   .setColor("#f1c40f")
   .setDescription(`Titre actuel : **${currentTitle}**`)

  await interaction.reply({
   embeds:[embed],
   components:[row],
   ephemeral:true
  })

  const unlocked = achievementCheck(user,"social")

  if(unlocked.length)
   await notifyAchievements(interaction,unlocked)

 },

 /* ================= SELECT ================= */

 async select(interaction){

  if(interaction.customId !== "choose_title")
   return

  const user = getUser(interaction.user.id)

  const title = interaction.values[0]

  user.title = title

  save()

  const embed = new EmbedBuilder()
   .setTitle("👑 Titre mis à jour")
   .setColor("#f1c40f")
   .setDescription(`Ton nouveau titre est : **${title}**`)

  await interaction.update({
   embeds:[embed],
   content:"",
   components:[]
  })

 }

}