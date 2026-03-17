const {
 SlashCommandBuilder,
 StringSelectMenuBuilder,
 ActionRowBuilder,
 EmbedBuilder,
 ButtonBuilder,
 ButtonStyle
} = require("discord.js")

const { getUser, save } = require("../../systems/userSystem")
const { achievementCheck } = require("../../systems/achievementCheck")
const { notifyAchievements } = require("../../systems/achievementNotifier")

const PAGE_SIZE = 25

const titleState = {}

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

  titleState[interaction.user.id] = {
   page:0
  }

  const {embed,components} = this.buildMenu(interaction.user.id,titles,currentTitle)

  await interaction.reply({
   embeds:[embed],
   components,
   ephemeral:true
  })

  const unlocked = achievementCheck(user,"social")

  if(unlocked.length)
   await notifyAchievements(interaction,unlocked)

 },

 /* ================= MENU BUILDER ================= */

 buildMenu(userId,titles,currentTitle){

  const state = titleState[userId]
  const page = state.page

  const start = page * PAGE_SIZE
  const slice = titles.slice(start,start+PAGE_SIZE)

  const menu = new StringSelectMenuBuilder()
   .setCustomId("choose_title")
   .setPlaceholder("Choisir un titre")
   .addOptions(

    slice.map(t => ({
     label:t,
     value:t,
     description: t === currentTitle ? "Titre actuel" : undefined,
     default: t === currentTitle
    }))

   )

  const menuRow = new ActionRowBuilder().addComponents(menu)

  const totalPages = Math.ceil(titles.length/PAGE_SIZE)

  const navRow = new ActionRowBuilder().addComponents(

   new ButtonBuilder()
    .setCustomId("title_prev")
    .setEmoji("⬅")
    .setStyle(ButtonStyle.Secondary)
    .setDisabled(page===0),

   new ButtonBuilder()
    .setCustomId("title_next")
    .setEmoji("➡")
    .setStyle(ButtonStyle.Secondary)
    .setDisabled(page>=totalPages-1)

  )

  const embed = new EmbedBuilder()
   .setTitle("👑 Gestion du titre")
   .setColor("#f1c40f")
   .setDescription(`Titre actuel : **${currentTitle}**`)
   .setFooter({text:`Page ${page+1}/${totalPages}`})

  return {
   embed,
   components:[menuRow,navRow]
  }

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
   components:[]
  })

 },

 /* ================= BUTTON ================= */

 async button(interaction){

  const userId = interaction.user.id

  if(!titleState[userId])
   return

  const user = getUser(userId)
  const titles = user.titles || ["Nouveau"]
  const currentTitle = user.title || titles[0]

  const state = titleState[userId]

  if(interaction.customId==="title_next")
   state.page++

  if(interaction.customId==="title_prev")
   state.page--

  const totalPages = Math.ceil(titles.length/PAGE_SIZE)

  state.page = Math.max(0,Math.min(state.page,totalPages-1))

  const {embed,components} = this.buildMenu(userId,titles,currentTitle)

  await interaction.update({
   embeds:[embed],
   components
  })

 }

}