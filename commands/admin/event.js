const { EmbedBuilder } = require("discord.js")

const {
 startSSREvent,
 stopSSREvent,
 isSSREvent,
 getEventRemaining
} = require("../../systems/eventSystem")

const { isDev } = require("../../systems/devSystem")

module.exports = {

 name: "event",
 description: "Gestion des événements SSR",

 options: [
  {
   name: "start",
   description: "Démarrer l'événement SSR",
   type: 1
  },
  {
   name: "stop",
   description: "Arrêter l'événement",
   type: 1
  },
  {
   name: "status",
   description: "Voir le statut de l'événement",
   type: 1
  }
 ],

 async execute(interaction) {

  if(!isDev(interaction.user.id)){
   return interaction.reply({
    content:"❌ Commande réservée aux développeurs.",
    ephemeral:true
   })
  }

  const sub = interaction.options.getSubcommand()

  await interaction.deferReply()

  /* START */

  if(sub === "start"){

   if(isSSREvent()){

    const remaining = Math.ceil(getEventRemaining()/60000)

    const embed = new EmbedBuilder()
     .setTitle("⚠️ Event déjà actif")
     .setDescription(`Il reste **${remaining} minutes**.`)
     .setColor("Orange")

    return interaction.editReply({embeds:[embed]})

   }

   startSSREvent(interaction.channel)

   const embed = new EmbedBuilder()
    .setTitle("🌈 Event SSR activé")
    .setDescription("Les chances de SSR sont augmentées.")
    .setColor("Green")

   return interaction.editReply({embeds:[embed]})

  }

  /* STOP */

  if(sub === "stop"){

   if(!isSSREvent()){

    const embed = new EmbedBuilder()
     .setTitle("⚠️ Aucun event actif")
     .setColor("Orange")

    return interaction.editReply({embeds:[embed]})

   }

   stopSSREvent()

   const embed = new EmbedBuilder()
    .setTitle("⛔ Event arrêté")
    .setDescription("Les taux SSR sont revenus à la normale.")
    .setColor("Red")

   return interaction.editReply({embeds:[embed]})

  }

  /* STATUS */

  if(sub === "status"){

   const active = isSSREvent()

   const embed = new EmbedBuilder()
    .setTitle("📊 Statut Event")

   if(!active){

    embed
     .setDescription("🔴 Aucun événement actif.")
     .setColor("Red")

   }else{

    const remaining = Math.ceil(getEventRemaining()/60000)

    embed
     .setDescription(`🟢 Event SSR actif\nTemps restant : **${remaining} minutes**`)
     .setColor("Green")

   }

   return interaction.editReply({embeds:[embed]})

  }

 }

}