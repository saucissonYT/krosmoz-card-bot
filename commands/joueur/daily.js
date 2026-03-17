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

  /* ---------------- COOLDOWN ---------------- */

  if(!canClaim(user)){

   const now=Date.now()
   const cooldown=24*60*60*1000

   const lastClaim=user.daily?.lastClaim||0
   const next=lastClaim+cooldown
   const remaining=next-now

   const hours=Math.floor(remaining/(1000*60*60))
   const minutes=Math.floor((remaining%(1000*60*60))/(1000*60))

   const nextDate=new Date(next)

   const nextTime=nextDate.toLocaleTimeString("fr-FR",{
    hour:"2-digit",
    minute:"2-digit"
   })

   const embed=new EmbedBuilder()
    .setTitle("⏳ Daily déjà récupéré")
    .setColor("#e67e22")
    .setDescription("Tu as déjà récupéré ta récompense aujourd'hui.")
    .addFields({
     name:"⏳ Prochaine daily",
     value:`Dans **${hours}h ${minutes}m**\n(à **${nextTime}**)`
    })

   return interaction.reply({
    embeds:[embed],
    flags:64
   })

  }

  /* ---------------- CLAIM ---------------- */

  const result = await claimDaily(interaction,user)

  /* ---------------- STREAK BAR ---------------- */

  const streak=result.streak

  const streakBar=Array.from({length:7},(_,i)=>i<streak?"🟩":"⬜").join("")

  /* ---------------- XP SYSTEM ---------------- */

  const day=((streak-1)%7)+1
  const xp=25+(day-1)*10

  user.progression.xp+=xp
  user.progression.totalXp+=xp

  /* ---------------- STREAK MAX ---------------- */

  if(!user.stats.maxDailyStreak)
   user.stats.maxDailyStreak=0

  if(streak>user.stats.maxDailyStreak)
   user.stats.maxDailyStreak=streak

  /* ---------------- FLAVOR TEXT ---------------- */

  const flavorTexts=[

   "📦 Un paquet arrive directement d'Amakna.",
   "💰 Les marchands d'Astrub te récompensent.",
   "🎁 Une récompense du Conseil des Douze.",
   "🗺️ Une trouvaille mystérieuse du Krosmoz.",
   "📜 Une récompense pour ton aventure quotidienne."

  ]

  const flavor=flavorTexts[Math.floor(Math.random()*flavorTexts.length)]

  /* ---------------- EMBED ---------------- */

  const embed=new EmbedBuilder()
   .setTitle("🎁 Récompense quotidienne")
   .setColor("#f1c40f")
   .setDescription(flavor)

  if(result.reward.type==="pack"){
   embed.addFields({
    name:"📦 Récompense",
    value:`**${result.reward.value} pack(s)**`
   })
  }

  if(result.reward.type==="kamas"){
   embed.addFields({
    name:"💰 Récompense",
    value:`**${result.reward.value} kamas**`
   })
  }

  if(result.reward.type==="ssr"){

   const card=result.reward.value

   embed.addFields({
    name:"🌈 Streak 7 atteinte !",
    value:`Carte SSR obtenue\n\n🌈 **${card.name}**`
   })

  }

  embed.addFields(

   {
    name:"🔥 Streak",
    value:`${streakBar}\n${streak}/7`,
    inline:false
   },

   {
    name:"🏆 Record",
    value:`${user.stats.maxDailyStreak} jours`,
    inline:true
   },

   {
    name:"⭐ XP gagnée",
    value:`+${xp} XP`,
    inline:true
   }

  )

  /* ---------------- DOUBLE DAILY ---------------- */

  if(result.doubleReward){

   embed.addFields({
    name:"🎉 DOUBLE DAILY !",
    value:"Tes récompenses ont été **doublées** 🍀",
    inline:false
   })

  } else {

   embed.addFields({
    name:"🍀 Chance de double",
    value:"10%",
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

  /* ---------------- PUBLIC MESSAGE ---------------- */

  await interaction.reply({embeds:[embed]})

  if(unlocked.length)
   await notifyAchievements(interaction,unlocked)

 }

}