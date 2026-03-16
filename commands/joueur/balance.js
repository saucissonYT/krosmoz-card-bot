const { EmbedBuilder } = require("discord.js")
const { getUser } = require("../../systems/userSystem")
const { achievementCheck } = require("../../systems/achievementCheck")
const { notifyAchievements } = require("../../systems/achievementNotifier")

module.exports = {

 name:"balance",

 async execute(interaction){

  const user=getUser(interaction.user.id)

  if(!user.stats) user.stats={}
  user.stats.balanceCheck=(user.stats.balanceCheck||0)+1

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