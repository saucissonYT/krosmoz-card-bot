const { EmbedBuilder } = require("discord.js")
const { getUser } = require("../../systems/userSystem")
const { achievementCheck } = require("../../systems/achievementCheck")

module.exports = {

 name:"balance",

 async execute(interaction){

  const user=getUser(interaction.user.id)

  if(!user.stats) user.stats={}
  user.stats.balanceCheck=(user.stats.balanceCheck||0)+1

  const embed=new EmbedBuilder()
   .setTitle("💰 Solde")
   .setDescription(`Tu possèdes **${user.kamas} kamas**`)
   .setColor("Gold")

  await interaction.reply({embeds:[embed]})

  await achievementCheck(interaction,user,"economy")

 }

}