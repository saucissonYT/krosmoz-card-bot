const {
 SlashCommandBuilder,
 ActionRowBuilder,
 StringSelectMenuBuilder,
 EmbedBuilder
} = require("discord.js")

const { isDev } = require("../../systems/devSystem")
const { getUsers, save } = require("../../systems/userSystem")
const sets = require("../../cards/sets.json")

module.exports = {

 data: new SlashCommandBuilder()
  .setName("hardpity")
  .setDescription("Forcer une hard pity pour un joueur")
  .addUserOption(option =>
   option
    .setName("joueur")
    .setDescription("Utilisateur")
    .setRequired(true)
  ),

 async execute(interaction){

  if(!isDev(interaction.user.id))
   return interaction.reply({
    content:"⛔ Commande dev uniquement.",
    ephemeral:true
   })

  const target = interaction.options.getUser("joueur")

  const options = sets.map(set => ({
   label:set.name,
   value:String(set.id)
  }))

  const menu = new StringSelectMenuBuilder()
   .setCustomId(`hardpityset_${target.id}`)
   .setPlaceholder("Choisir le set")
   .addOptions(options)

  const row = new ActionRowBuilder().addComponents(menu)

  await interaction.reply({
   content:`Choisis le set pour **${target.username}**`,
   components:[row],
   ephemeral:true
  })

 },

 async select(interaction){

  const id = interaction.customId

  // SELECTION SET

  if(id.startsWith("hardpityset_")){

   const userId = id.split("_")[1]
   const setId = interaction.values[0]

   const menu = new StringSelectMenuBuilder()
    .setCustomId(`hardpity_${userId}_${setId}`)
    .setPlaceholder("Choisir la hard pity")
    .addOptions([
     {
      label:"Hard Pity SSR",
      value:"SSR",
      emoji:"🌈"
     },
     {
      label:"Hard Pity UR",
      value:"UR",
      emoji:"🔥"
     }
    ])

   const row = new ActionRowBuilder().addComponents(menu)

   return interaction.update({
    content:`Set sélectionné : **${setId}**`,
    components:[row]
   })

  }

  // SELECTION RARETE

  if(!id.startsWith("hardpity_")) return

  const [, userId, setId] = id.split("_")
  const choice = interaction.values[0]

  const users = getUsers()

  if(!users[userId])
   return interaction.reply({
    content:"Utilisateur introuvable.",
    ephemeral:true
   })

  if(!users[userId].pity)
   users[userId].pity = {}

  if(!users[userId].pity[setId])
   users[userId].pity[setId] = { UR:0, SSR:0 }

  if(choice === "SSR")
   users[userId].pity[setId].SSR = 49

  if(choice === "UR")
   users[userId].pity[setId].UR = 9

  save()

  const embed = new EmbedBuilder()
   .setColor("Orange")
   .setTitle("🔥 Hard Pity appliquée")
   .addFields(
    { name:"Utilisateur", value:`<@${userId}>`, inline:true },
    { name:"Set", value:setId, inline:true },
    { name:"Type", value:choice, inline:true }
   )
   .setFooter({ text:"Le prochain pack garantira cette rareté." })

  await interaction.update({
   embeds:[embed],
   components:[]
  })

 }

}