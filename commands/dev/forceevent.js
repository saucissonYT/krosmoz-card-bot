const {
 SlashCommandBuilder
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
    .addStringOption(opt=>
     opt.setName("classe")
      .setDescription("Classe de l'event")
      .setRequired(true)
      .addChoices(
       ...Object.keys(EVENTS).map(k=>({
        name:EVENTS[k].name,
        value:k
       }))
      )
    )
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

  /* ---------- START ---------- */

  if(sub === "start"){

   const key = interaction.options.getString("classe")

   startEvent(interaction.channel,key)

   return interaction.reply({
    content:`✅ Event lancé : **${EVENTS[key].name}**`,
    ephemeral:true
   })
  }

  /* ---------- STOP ---------- */

  if(sub === "stop"){

   stopEvent(interaction.channel)

   return interaction.reply({
    content:"⛔ Event arrêté.",
    ephemeral:true
   })
  }

 }
}