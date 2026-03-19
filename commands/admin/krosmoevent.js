const {
 SlashCommandBuilder,
 ActionRowBuilder,
 StringSelectMenuBuilder,
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

  /* 🔧 FIX */
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
    content:"🎰 Event lancé aléatoirement."
   })
  }

  /* ---------------- FORCE EVENT ---------------- */

  if(sub === "force"){

   const options = Object.keys(EVENTS).map(key => ({
    label:EVENTS[key].name,
    value:key
   }))

   const menu = new StringSelectMenuBuilder()
    .setCustomId(`krosmoevent_select_${interaction.user.id}`)
    .setPlaceholder("Choisir un event")
    .addOptions(options.slice(0,25))

   const row = new ActionRowBuilder().addComponents(menu)

   return interaction.editReply({
    content:"🎯 Choisis un event à lancer",
    components:[row]
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

   const embed = new EmbedBuilder()
    .setTitle("📊 Event en cours")
    .setDescription(`🎰 **${event.name}**`)
    .addFields(
     { name:"Effet", value:event.effect || "Inconnu" },
     { name:"Temps restant", value:`${minutes} min` }
    )
    .setColor("Purple")

   return interaction.editReply({
    embeds:[embed]
   })
  }

 },

 /* ---------------- SELECT MENU ---------------- */

 async select(interaction){

  if(!interaction.customId.startsWith("krosmoevent_select_")) return

  const ownerId = interaction.customId.split("_")[2] // 🔧 FIX

  if(interaction.user.id !== ownerId){
   return interaction.reply({
    content:"❌ Pas ton menu.",
    ephemeral:true
   })
  }

  if(!isDev(interaction.user.id)) return

  const channel = interaction.channel

  if(!channel){
   return interaction.reply({
    content:"❌ Channel introuvable.",
    ephemeral:true
   })
  }

  const eventKey = interaction.values[0]

  if(isEventActive()){
   return interaction.update({
    content:"⚠️ Un event est déjà actif.",
    components:[]
   })
  }

  startEvent(channel, eventKey)

  await interaction.update({
   content:`✅ Event forcé : **${EVENTS[eventKey].name}**`,
   components:[]
  })

 }

}