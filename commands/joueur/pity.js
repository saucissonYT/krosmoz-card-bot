const { EmbedBuilder } = require("discord.js")
const setsData = require("../../cards/sets.json")
const { getUser } = require("../../systems/userSystem")

const sets = Array.isArray(setsData) ? setsData : setsData.sets

module.exports = {

 name:"pity",
 description:"Voir tes pity par set",

 async execute(interaction){

  const user = getUser(interaction.user.id)

  if(!user.pity)
   user.pity = {}

  const lines=[]

  for(const set of sets){

   const pity = user.pity[set.id] || {UR:0,SSR:0}

   lines.push(
`**${set.name}**
🔥 UR : ${pity.UR}/10
🌈 SSR : ${pity.SSR}/50`
   )

  }

  const embed=new EmbedBuilder()
   .setTitle(`🎴 Pity de ${interaction.user.username}`)
   .setDescription(lines.join("\n\n"))

  await interaction.reply({
   embeds:[embed],
   ephemeral:true
  })

 }

}