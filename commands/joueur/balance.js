const { EmbedBuilder } = require("discord.js")
const { getUser } = require("../../systems/usersystem")

module.exports = {

 name:"balance",

 async execute(interaction){

  const user=getUser(interaction.user.id)

  const embed=new EmbedBuilder()
   .setTitle("💰 Solde")
   .setDescription(`Tu possèdes **${user.kamas} kamas**`)
   .setColor("Gold")

  interaction.reply({embeds:[embed]})

 }

}