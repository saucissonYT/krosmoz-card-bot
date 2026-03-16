const {
 SlashCommandBuilder,
 ActionRowBuilder,
 StringSelectMenuBuilder,
 EmbedBuilder
} = require("discord.js")

const { isDev } = require("../../systems/devSystem")
const { getUsers, save } = require("../../systems/userSystem")

const setsData = require("../../cards/sets.json")
const sets = Array.isArray(setsData) ? setsData : setsData.sets

module.exports = {

 data:new SlashCommandBuilder()
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

  const options = sets.slice(0,25).map(set => ({
   label:set.name,
   value:String(set.id)
  }))

  const menu=new StringSelectMenuBuilder()
   .setCustomId(`hardpityset:${target.id}`)
   .setPlaceholder("Choisir le set")
   .addOptions(options)

  const row=new ActionRowBuilder().addComponents(menu)

  await interaction.reply({
   content:`Choisis le set pour **${target.username}**`,
   components:[row],
   ephemeral:true
  })

 },

 async select(interaction){

  if(!isDev(interaction.user.id))
   return interaction.reply({
    content:"⛔ Dev uniquement.",
    ephemeral:true
   })

  const id=interaction.customId

  /* SELECT SET */

  if(id.startsWith("hardpityset:")){

   const userId=id.split(":")[1]
   const setId=interaction.values[0]

   const menu=new StringSelectMenuBuilder()
    .setCustomId(`hardpity:${userId}:${setId}`)
    .setPlaceholder("Choisir la hard pity")
    .addOptions([
     {label:"Hard Pity SSR",value:"SSR",emoji:"🌈"},
     {label:"Hard Pity UR",value:"UR",emoji:"🔥"}
    ])

   const row=new ActionRowBuilder().addComponents(menu)

   return interaction.update({
    content:`Set sélectionné : **${setId}**`,
    components:[row]
   })

  }

  if(!id.startsWith("hardpity:")) return

  const parts=id.split(":")

  const userId=parts[1]
  const setId=parts[2]

  const choice=interaction.values[0]

  const users=getUsers()

  const user=users[userId]

  if(!user)
   return interaction.reply({
    content:"Utilisateur introuvable.",
    ephemeral:true
   })

  if(!user.pity)
   user.pity={}

  if(!user.pity[setId])
   user.pity[setId]={UR:0,SSR:0}

  if(choice==="SSR")
   user.pity[setId].SSR=49

  if(choice==="UR")
   user.pity[setId].UR=9

  save()

  const embed=new EmbedBuilder()
   .setColor("Orange")
   .setTitle("🔥 Hard Pity appliquée")
   .addFields(
    {name:"Utilisateur",value:`<@${userId}>`,inline:true},
    {name:"Set",value:setId,inline:true},
    {name:"Type",value:choice,inline:true}
   )
   .setFooter({text:"Le prochain pack garantira cette rareté."})

  await interaction.update({
   embeds:[embed],
   components:[]
  })

 }

}