const {
 SlashCommandBuilder
} = require("discord.js")

const {
 startEvent,
 stopEvent,
 getEvent
} = require("../../systems/eventEngine")

const events = require("../../systems/eventRegistry")
const { isDev } = require("../../systems/devSystem")

/* 🔎 MAP EVENTS */

const eventMap = Object.fromEntries(
 events.map(e => [e.id.toLowerCase(), e])
)

module.exports = {

 data: new SlashCommandBuilder()
  .setName("forceevent")
  .setDescription("Forcer un événement (DEV)")

  .addSubcommand(sub =>
   sub
    .setName("start")
    .setDescription("Démarrer un event spécifique")
    .addStringOption(option =>
     option
      .setName("event")
      .setDescription("Nom de l'event")
      .setRequired(true)
      .addChoices(
       ...events.map(e => ({
        name: e.name,
        value: e.id.toLowerCase()
       }))
      )
    )
  )

  .addSubcommand(sub =>
   sub
    .setName("stop")
    .setDescription("Arrêter l'event en cours")
  ),

 async execute(interaction){

  /* 🔒 CHECK DEV */

  if(!isDev(interaction.user.id)){
   return interaction.reply({
    content:"⛔ Commande réservée aux développeurs.",
    ephemeral:true
   })
  }

  const sub = interaction.options.getSubcommand()

  /* 🚀 START */

  if(sub === "start"){

   const current = getEvent()

   if(current){
    return interaction.reply({
     content:`⚠️ Un event est déjà actif : **${current.name}**`,
     ephemeral:true
    })
   }

   const eventId = interaction.options.getString("event")
   const event = eventMap[eventId]

   if(!event){
    return interaction.reply({
     content:"❌ Event invalide.",
     ephemeral:true
    })
   }

   startEvent(event, interaction.channel)

   return interaction.reply({
    content:`🎰 Event forcé : **${event.name}**`,
    ephemeral:true
   })

  }

  /* 🛑 STOP */

  if(sub === "stop"){

   const current = getEvent()

   if(!current){
    return interaction.reply({
     content:"⚠️ Aucun event actif.",
     ephemeral:true
    })
   }

   stopEvent(interaction.channel)

   return interaction.reply({
    content:`⛔ Event arrêté : **${current.name}**`,
    ephemeral:true
   })

  }

 }

}