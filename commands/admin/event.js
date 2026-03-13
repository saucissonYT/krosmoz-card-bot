const { EmbedBuilder } = require("discord.js")

const {
 startSSREvent,
 stopSSREvent,
 isSSREvent,
 getEventRemaining
} = require("../../systems/eventSystem")

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

  const sub = interaction.options.getSubcommand()

  await interaction.deferReply()

  /* START */

  if(sub === "start"){

   startSSREvent(interaction.channel)

   const embed = new EmbedBuilder()
    .setTitle("🌈 Event SSR activé")
    .setDescription("Les chances de SSR sont augmentées.")
    .setColor("Green")

   return interaction.editReply({embeds:[embed]})

  }

  /* STOP */

  if(sub === "stop"){

   stopSSREvent()

   const embed = new EmbedBuilder()
    .setTitle("⛔ Event arrêté")
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
     .setDescription(`🟢 Event SSR actif\nTemps restant : ${remaining} minutes`)
     .setColor("Green")

   }

   return interaction.editReply({embeds:[embed]})

  }

 }

}