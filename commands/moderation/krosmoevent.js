const {
 SlashCommandBuilder,
 EmbedBuilder
} = require("discord.js")

const { isDev } = require("../../systems/devSystem")
const {
 startEvent,
 stopEvent,
 getEvent,
 isEventActive
} = require("../../systems/eventSystem")

const EVENTS = require("../../systems/eventRegistry")

module.exports = {

 data: new SlashCommandBuilder()
  .setName("krosmoevent")
  .setDescription("Gestion des events Krosmoz")

  .addSubcommand(sub =>
   sub.setName("start")
    .setDescription("Lancer un event (random)")
  )

  .addSubcommand(sub =>
   sub.setName("force")
    .setDescription("Forcer un event spécifique")
    .addStringOption(opt =>
     opt.setName("event")
      .setDescription("Choisir un event")
      .setRequired(true)
      .addChoices(
       ...Object.keys(EVENTS).map(key => ({
        name: EVENTS[key].name,
        value: key
       }))
      )
    )
  )

  .addSubcommand(sub =>
   sub.setName("stop")
    .setDescription("Arrêter l'event")
  )

  .addSubcommand(sub =>
   sub.setName("status")
    .setDescription("Voir l'event actuel")
  ),

 async execute(interaction){

  if(!isDev(interaction.user.id)){
   return interaction.reply({
    content:"⛔ Dev uniquement.",
    ephemeral:true
   })
  }

  const sub = interaction.options.getSubcommand()
  const channel = interaction.channel

  if(!channel){
   return interaction.reply({
    content:"❌ Impossible de récupérer le channel.",
    ephemeral:true
   })
  }

  if(!interaction.deferred && !interaction.replied){
   await interaction.deferReply({ ephemeral:true })
  }

  /* ---------------- START RANDOM ---------------- */

  if(sub === "start"){

   if(isEventActive()){
    return interaction.editReply({
     content:"⚠️ Un event est déjà actif."
    })
   }

   startEvent(channel)

   return interaction.editReply({
    content:"?? Event lancé aléatoirement."
   })
  }

  /* ---------------- FORCE EVENT ---------------- */

  if(sub === "force"){

   const eventKey = interaction.options.getString("event")

   if(isEventActive()){
    return interaction.editReply({
     content:"⚠️ Un event est déjà actif."
    })
   }

   startEvent(channel, eventKey)

   return interaction.editReply({
    content:`✅ Event forcé : **${EVENTS[eventKey].name}**`
   })
  }

  /* ---------------- STOP ---------------- */

  if(sub === "stop"){

   if(!isEventActive()){
    return interaction.editReply({
     content:"⚠️ Aucun event actif."
    })
   }

   stopEvent(channel)

   return interaction.editReply({
    content:"⛔ Event arrêté."
   })
  }

  /* ---------------- STATUS ---------------- */

  if(sub === "status"){

   const event = getEvent()

   if(!event){
    return interaction.editReply({
     content:"🔴 Aucun event actif."
    })
   }

   const remaining = Math.max(0, event.endTime - Date.now())
   const minutes = Math.ceil(remaining / 60000)

   /* FIX: lire l'effet depuis le registry via event.key,
      car currentEvent ne stocke pas "effect" */
   const registryEntry = EVENTS[event.key]
   const effect = registryEntry?.effect || "Effet spécial"

   const embed = new EmbedBuilder()
    .setTitle("📊 Event en cours")
    .setDescription(`?? **${event.name}**`)
    .addFields(
     { name:"Effet", value:effect },
     { name:"Temps restant", value:`${minutes} min` },
     { name:"🎟️ Tickets", value:`${event.tickets} par joueur` },
     { name:"📦 Packs ouverts", value:`${event.stats?.packs || 0}`, inline:true },
     { name:"🌈 SSR obtenues", value:`${event.stats?.ssr || 0}`, inline:true },
     { name:"🎴 Cartes", value:`${event.stats?.totalCards || 0}`, inline:true }
    )
    .setColor("Purple")

   return interaction.editReply({
    embeds:[embed]
   })
  }

 }

}