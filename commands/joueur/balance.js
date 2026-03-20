const { EmbedBuilder } = require("discord.js")
const { getUser, save } = require("../../systems/userSystem")
const { achievementCheck } = require("../../systems/achievementCheck")
const { notifyAchievements } = require("../../systems/achievementNotifier")

module.exports = {

 name:"balance",

 async execute(interaction){

  const user=getUser(interaction.user.id)

  if(!user.stats) user.stats={}
  user.stats.balanceCheck=(user.stats.balanceCheck||0)+1

  /*
   * FIX: save() manquant après modification de stats.
   *
   * AVANT : user.stats.balanceCheck incrémenté mais jamais sauvegardé.
   *         L'autosave 30s ne rattrape que si le user est déjà _dirty.
   *         Si le bot crash entre-temps, la stat et le potentiel
   *         achievement sont perdus.
   *
   * APRÈS : save(userId) ciblé pour persister la modification.
   */
  save(interaction.user.id)

  const unlocked = achievementCheck(user,"economy")

  const embed=new EmbedBuilder()
   .setTitle("💰 Solde")
   .setDescription(`Tu possèdes **${user.kamas} kamas**`)
   .setColor("Gold")

  await interaction.reply({embeds:[embed]})

  if(unlocked.length)
   await notifyAchievements(interaction,unlocked)

 }

}