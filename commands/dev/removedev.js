const { SlashCommandBuilder } = require("discord.js")
const { toggleDev, isOwner } = require("../../systems/devSystem")

module.exports = {

 data: new SlashCommandBuilder()
  .setName("removedev")
  .setDescription("Ajouter ou retirer un dev")
  .addUserOption(option =>
   option
    .setName("utilisateur")
    .setDescription("Utilisateur à modifier")
    .setRequired(true)
  ),

 async execute(interaction){

  if(!isOwner(interaction.user.id))
   return interaction.reply({
    content:"Commande réservée au propriétaire.",
    ephemeral:true
   })

  const user = interaction.options.getUser("utilisateur")

  const added = toggleDev(user.id)

  if(added){

   await interaction.reply({
    content:`✅ ${user.username} est maintenant **dev**.`,
    ephemeral:true
   })

  }else{

   await interaction.reply({
    content:`❌ ${user.username} n'est plus **dev**.`,
    ephemeral:true
   })

  }

 }

}