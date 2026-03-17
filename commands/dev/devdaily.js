const { SlashCommandBuilder, EmbedBuilder } = require("discord.js")

const { getUser, save } = require("../../systems/userSystem")
const { claimDaily } = require("../../systems/dailySystem")
const { achievementCheck } = require("../../systems/achievementCheck")
const { notifyAchievements } = require("../../systems/achievementNotifier")
const { isDev } = require("../../systems/devSystem")

module.exports = {

 name:"devdaily",

 data:new SlashCommandBuilder()
  .setName("devdaily")
  .setDescription("Simuler un daily (DEV)")

  .addUserOption(option=>
   option.setName("joueur")
   .setDescription("Joueur cible")
   .setRequired(false)
  )

  .addStringOption(option=>
   option.setName("type")
   .setDescription("Type de daily")
   .setRequired(false)
   .addChoices(
    {name:"Normal",value:"normal"},
    {name:"Double",value:"double"},
    {name:"SSR",value:"ssr"},
    {name:"Streak 7",value:"streak"}
   )
  ),

 async execute(interaction){

  if(!isDev(interaction.user.id))
   return interaction.reply({
    content:"Commande dev.",
    flags:64
   })

  const target =
   interaction.options.getUser("joueur") || interaction.user

  const type =
   interaction.options.getString("type") || "normal"

  const user = getUser(target.id)

  /* FORCER TYPES */

  if(type==="double")
   user.devDailyForce="double"

  if(type==="ssr")
   user.devDailyForce="ssr"

  if(type==="streak")
   user.dailyStreak=6

  const result = await claimDaily(interaction,user)

  const embed = new EmbedBuilder()
   .setTitle("🧪 DEV DAILY")
   .setColor("#2ecc71")

  if(result.reward.type==="pack"){
   embed.setDescription(`📦 **${target.username}** reçoit **${result.reward.value} pack(s)**`)
  }

  if(result.reward.type==="kamas"){
   embed.setDescription(`💰 **${target.username}** reçoit **${result.reward.value} kamas**`)
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
    name:"🎉 Double Daily",
    value:"Récompense doublée",
    inline:false
   })

  }

  save()

  await interaction.reply({
   embeds:[embed]
  })

  const unlocked=[
   ...achievementCheck(user,"daily"),
   ...achievementCheck(user,"economy")
  ]

  if(unlocked.length)
   await notifyAchievements(interaction,unlocked)

 }

}