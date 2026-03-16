const {
 SlashCommandBuilder,
 EmbedBuilder
} = require("discord.js")

const { getUser } = require("../../systems/userSystem")
const { claimDaily, canClaim } = require("../../systems/dailySystem")
const { achievementCheck } = require("../../systems/achievementCheck")
const { notifyAchievements } = require("../../systems/achievementNotifier")

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
    flags:64
   })

  }

  const result = await claimDaily(interaction,user)

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

  /* ---------------- ACHIEVEMENTS ---------------- */

  let unlocked=[]

  unlocked.push(...achievementCheck(user,"daily"))

  if(result.reward.type==="kamas")
   unlocked.push(...achievementCheck(user,"economy"))

  if(result.reward.type==="ssr")
   unlocked.push(...achievementCheck(user,"collection"))

  await interaction.reply({embeds:[embed]})

  if(unlocked.length)
   await notifyAchievements(interaction,unlocked)

 }

}