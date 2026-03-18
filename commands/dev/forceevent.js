const {
 SlashCommandBuilder,
 ActionRowBuilder,
 StringSelectMenuBuilder
} = require("discord.js")

const { isDev } = require("../../systems/devSystem")
const { startEvent, stopEvent } = require("../../systems/eventSystem")

const EVENTS = require("../../systems/eventRegistry")

module.exports = {

 data:new SlashCommandBuilder()
  .setName("forceevent")
  .setDescription("Forcer un event")
  .addSubcommand(sub=>
   sub.setName("start")
    .setDescription("Lancer un event")
  )
  .addSubcommand(sub=>
   sub.setName("stop")
    .setDescription("Stop l'event")
  ),

 async execute(interaction){

  if(!isDev(interaction.user.id)){
   return interaction.reply({
    content:"⛔ Dev uniquement.",
    ephemeral:true
   })
  }

  const sub = interaction.options.getSubcommand()

  await interaction.deferReply({ ephemeral:true })

  if(sub === "start"){

   const options = Object.keys(EVENTS).map(key=>({
    label:EVENTS[key].name,
    value:key
   }))

   const menu = new StringSelectMenuBuilder()
    .setCustomId("forceevent_select")
    .setPlaceholder("Choisir un event")
    .addOptions(options.slice(0,25))

   const row = new ActionRowBuilder().addComponents(menu)

   return interaction.editReply({
    content:"🎯 Choisis un event à lancer",
    components:[row]
   })

  }

  if(sub === "stop"){

   stopEvent(interaction.channel)

   return interaction.editReply("⛔ Event arrêté.")
  }

 },

 async select(interaction){

  if(interaction.customId !== "forceevent_select") return

  if(!isDev(interaction.user.id)) return

  await interaction.deferUpdate()

  const eventKey = interaction.values[0]

  startEvent(interaction.channel,eventKey)

  await interaction.editReply({
   content:`✅ Event lancé : **${eventKey}**`,
   components:[]
  })

 }

}