const { SlashCommandBuilder } = require("discord.js")

const { isDev } = require("../../systems/devSystem")
const { getUser, save } = require("../../systems/userSystem")

module.exports = {

 data: new SlashCommandBuilder()
  .setName("resetcooldown")
  .setDescription("Reset cooldown pack d'un joueur")
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

  user.lastPack = 0

  save(target.id)

  interaction.reply(`✅ Cooldown reset pour **${target.username}**`)

 }

}