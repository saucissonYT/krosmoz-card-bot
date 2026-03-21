const { SlashCommandBuilder } = require("discord.js")

const { isDev } = require("../../systems/devSystem")
const { getUser, save } = require("../../systems/userSystem")

module.exports = {

 data: new SlashCommandBuilder()
  .setName("resetpity")
  .setDescription("Reset pity d'un joueur")
  .addUserOption(o =>
   o.setName("joueur")
    .setDescription("Utilisateur")
    .setRequired(true)
  ),

 async execute(interaction){

  if(!isDev(interaction.user.id))
   return interaction.reply({
    content:"⛔ Commande dev.",
    ephemeral:true
   })

  const target = interaction.options.getUser("joueur")

  const user = getUser(target.id)

  if(!user)
   return interaction.reply("Utilisateur introuvable.")

  user.pity = {}

  save(target.id)

  interaction.reply(`✅ Toutes les pity reset pour **${target.username}**`)

 }

}