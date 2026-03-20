const { SlashCommandBuilder } = require("discord.js")
const { isOwner, toggleDev } = require("../../systems/devSystem")

module.exports = {

 data: new SlashCommandBuilder()
  .setName("krosmodev")
  .setDescription("Donner ou retirer le rang développeur")
  .addUserOption(option =>
   option
    .setName("joueur")
    .setDescription("Joueur à modifier")
    .setRequired(true)
  ),

 async execute(interaction){

  if(!isOwner(interaction.user.id))
   return interaction.reply({
    content:"⛔ Commande réservée au propriétaire.",
    ephemeral:true
   })

  const target = interaction.options.getUser("joueur")

  const result = toggleDev(target.id)

  if(result){

   interaction.reply({
    content:`✅ **${target.username}** est maintenant **développeur**.`,
    ephemeral:true
   })

  }else{

   interaction.reply({
    content:`❌ **${target.username}** n'est plus **développeur**.`,
    ephemeral:true
   })

  }

 }

}