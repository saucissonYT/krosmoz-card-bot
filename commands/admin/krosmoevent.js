const { SlashCommandBuilder } = require("discord.js")

const { startEvent, getEvent } = require("../../systems/eventEngine")
const events = require("../../systems/eventRegistry")

module.exports = {

 data: new SlashCommandBuilder()
  .setName("krosmoevent")
  .setDescription("Lancer un event aléatoire"),

 async execute(interaction){

  /* 🔒 CHECK ADMIN */

  if(!interaction.member.permissions.has("Administrator")){
   return interaction.reply({
    content:"❌ Commande réservée aux administrateurs.",
    ephemeral:true
   })
  }

  /* ⚠️ CHECK EVENT EXISTANT */

  const current = getEvent()

  if(current){
   return interaction.reply({
    content:`⚠️ Un event est déjà actif : **${current.name}**`,
    ephemeral:true
   })
  }

  /* 🎰 RANDOM EVENT */

  const event = events[Math.floor(Math.random()*events.length)]

  /* 🚀 START */

  startEvent(event, interaction.channel)

  await interaction.reply({
   content:`🎰 Event lancé : **${event.name}**`,
   ephemeral:true
  })

 }

}