const {
 SlashCommandBuilder
} = require("discord.js")

const { isDev } = require("../../systems/devSystem")
const { startEvent, stopEvent, getEvent, isEventActive } = require("../../systems/eventSystem")

const EVENTS = require("../../systems/eventRegistry")
console.log("LOADED EVENTS:", Object.keys(EVENTS))
console.log("COUNT:", Object.keys(EVENTS).length)

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

  /* ---------- DEV CHECK ---------- */

  if(!isDev(interaction.user.id)){
   return interaction.reply({
    content:"⛔ Dev uniquement.",
    flags:64
   })
  }

  const sub = interaction.options.getSubcommand()

  /* ================= START ================= */

  if(sub === "start"){

   const key = interaction.options.getString("classe")

   if(!EVENTS[key]){
    return interaction.reply({
     content:"❌ Event invalide.",
     flags:64
    })
   }

   // 🔥 check si déjà un event actif
   if(isEventActive()){
    const current = getEvent()

    return interaction.reply({
     content:`⚠️ Un event est déjà actif : **${current.name}**\nUtilise \`/forceevent stop\` avant.`,
     flags:64
    })
   }

   const started = startEvent(interaction.channel, key)

   if(!started){
    return interaction.reply({
     content:"❌ Impossible de lancer l'event.",
     flags:64
    })
   }

   console.log("🛠️ FORCE EVENT START:", key)

   return interaction.reply({
    content:`✅ Event lancé : **${EVENTS[key].name}**`,
    flags:64
   })
  }

  /* ================= STOP ================= */

  if(sub === "stop"){

   if(!isEventActive()){
    return interaction.reply({
     content:"⚠️ Aucun event actif.",
     flags:64
    })
   }

   const current = getEvent()

   stopEvent(interaction.channel)

   console.log("🛠️ FORCE EVENT STOP:", current?.key)

   return interaction.reply({
    content:`⛔ Event arrêté : **${current?.name}**`,
    flags:64
   })
  }

 }
}