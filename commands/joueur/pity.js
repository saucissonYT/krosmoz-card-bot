const { EmbedBuilder } = require("discord.js")
const setsData = require("../../cards/sets.json")
const { getUser } = require("../../systems/userSystem")

const sets = Array.isArray(setsData) ? setsData : setsData.sets

function progressBar(value,max){

 const filled=Math.floor((value/max)*10)
 const empty=10-filled

 return "🟩".repeat(filled)+"⬛".repeat(empty)

}

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

   const urBar = progressBar(pity.UR,10)
   const ssrBar = progressBar(pity.SSR,50)

   lines.push(
`**${set.name}**

🟡 UR : ${pity.UR}/10
${urBar}

🌈 SSR : ${pity.SSR}/50
${ssrBar}`
   )

  }

  const embed=new EmbedBuilder()
   .setTitle(`🎴 Pity de ${interaction.user.username}`)
   .setDescription(lines.join("\n\n"))
   .setColor("#f1c40f")

  await interaction.reply({
   embeds:[embed]
  })

 }

}