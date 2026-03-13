const {
 SlashCommandBuilder,
 EmbedBuilder
} = require("discord.js")

const { getUser } = require("../../systems/userSystem")
const { claimDaily, canClaim } = require("../../systems/dailySystem")

module.exports={

 name:"daily",

 data:new SlashCommandBuilder()
  .setName("daily")
  .setDescription("Réclamer ta récompense quotidienne"),

 async execute(interaction){

  const user=getUser(interaction.user.id)

  if(!canClaim(user)){

   return interaction.reply({
    content:"❌ Tu as déjà récupéré ton daily aujourd'hui.",
    ephemeral:true
   })

  }

  const result=claimDaily(user)

  const embed=new EmbedBuilder()
   .setTitle("🎁 Récompense quotidienne")
   .setColor("#f1c40f")

  if(result.reward.type==="pack"){
   embed.setDescription(`📦 Tu reçois **${result.reward.value} pack(s)**`)
  }

  if(result.reward.type==="kamas"){
   embed.setDescription(`💰 Tu reçois **${result.reward.value} kamas**`)
  }

  if(result.reward.type==="ssr"){

   const card=result.reward.value

   embed.setDescription(
`🌈 **Streak 7 atteint !**

Carte SSR obtenue :

🌈 **${card.name}**`
   )

  }

  embed.addFields(
   {
    name:"🔥 Streak actuel",
    value:`${result.streak} jours`,
    inline:true
   },
   {
    name:"📊 Progression",
    value:result.streakBar,
    inline:false
   }
  )

  if(result.doubleReward){

   embed.addFields({
    name:"🎉 Double Daily !",
    value:"Tes récompenses ont été **doublées**.",
    inline:false
   })

  }

  if(result.assiduUnlocked){

   embed.addFields({
    name:"🏆 Succès débloqué",
    value:"**Assidu**",
    inline:false
   })

  }

  if(result.dailyAchievements && result.dailyAchievements.length){

   for(const ach of result.dailyAchievements){

    embed.addFields({
     name:"🏆 Succès Daily",
     value:
`**${ach.name}**

Titre : ${ach.title}
+${ach.xp} XP
+${ach.kamas} kamas`,
     inline:false
    })

   }

  }

  await interaction.reply({embeds:[embed]})

 }

}