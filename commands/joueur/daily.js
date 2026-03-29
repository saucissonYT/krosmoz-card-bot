const {
 SlashCommandBuilder,
 EmbedBuilder
} = require("discord.js")

const { getUser, save, updateActivityStreak } = require("../../systems/userSystem")
const { claimDaily, canClaim, getNextMidnightParisMs } = require("../../systems/dailySystem")
const { addBattlePassXP } = require("../../systems/battlePassService")
const { achievementCheck } = require("../../systems/achievementCheck")
const { notifyAchievements } = require("../../systems/achievementNotifier")

/* ---- FIX SNAPSHOT LAZY : imports pour init les snapshots AVANT toute action ---- */
const { ensureUserQuests } = require("../../systems/questSystem")
const { getUserGuild } = require("../../systems/guildSystem")
const { ensureSnapshot } = require("../../systems/guildQuestSystem")

module.exports={

 name:"daily",

 data:new SlashCommandBuilder()
  .setName("daily")
  .setDescription("Réclamer ta récompense quotidienne"),

 async execute(interaction){

  const user=getUser(interaction.user.id)

  /* ================================================================
     INIT SNAPSHOTS QUÊTES — DOIT ÊTRE AVANT TOUTE MODIFICATION STATS
     
     Raison : ensureUserQuests() / ensureSnapshot() créent le snapshot
     (état de référence) au premier appel du jour. Si des actions
     (daily, packs...) ont déjà modifié les stats avant cet appel,
     elles ne seront pas comptées dans la progression des quêtes.
     
     En appelant ici, AVANT claimDaily(), on garantit que :
     - le daily lui-même compte pour les quêtes "faire X daily"
     - les quêtes de guilde snapshotent bien avant contribution
  ================================================================ */

  ensureUserQuests(user)

  try {
   const guild = getUserGuild(interaction.user.id)
   if (guild) ensureSnapshot(guild)
  } catch(_) { /* guilde non dispo, pas bloquant */ }

  /* ---------------- COOLDOWN ---------------- */

  if(!canClaim(user)){

   /* Sauvegarde si le snapshot vient d'être initialisé (nouveau jour) */
   save()

   const now          = Date.now()
   const nextMidnight = getNextMidnightParisMs()
   const remaining    = Math.max(0, nextMidnight - now)

   const hours   = Math.floor(remaining / (1000 * 60 * 60))
   const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60))

   const embed=new EmbedBuilder()
    .setTitle("⏳ Daily déjà récupéré")
    .setColor("#e67e22")
    .setDescription("Tu as déjà récupéré ta récompense aujourd'hui.")
    .addFields({
     name:"⏳ Prochaine daily",
     value:`Dans **${hours}h ${minutes}m**\n(à **minuit** heure Paris)`
    })

   return interaction.reply({ embeds:[embed], flags:64 })
  }

  /* ---------------- CLAIM ---------------- */

  const result = await claimDaily(interaction,user)

  /* ---- ACTIVITY STREAK ---- */
  updateActivityStreak(user)

  /* ---------------- STREAK BAR ---------------- */

  const streak=result.streak

  const streakBar=Array.from({length:7},(_,i)=>i<streak?"🟩":"⬜").join("")

  /* ---------------- XP SYSTEM ---------------- */

  const day=((streak-1)%7)+1
  const xp=25+(day-1)*10

  user.progression.xp+=xp
  user.progression.totalXp+=xp

  await addBattlePassXP(interaction.user.id, "daily_claim")

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
   embed.addFields({ name:"📦 Récompense", value:`**${result.reward.value} pack(s)**` })
  }

  if(result.reward.type==="kamas"){
   embed.addFields({ name:"💰 Récompense", value:`**${result.reward.value} kamas**` })
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
   },

   {
    name:"📅 Présence",
    value:`${user.stats.activityStreak || 1} jours consécutifs`,
    inline:true
   }

  )

  if(result.doubleReward){
   embed.addFields({
    name:"🎉 DOUBLE DAILY !",
    value:`Récompense doublée ! (${Math.round(result.doubleDailyChance*100)}% de chance)`
   })
  }

  if(result.bonusPacksGiven > 0){
   embed.addFields({
    name:"🏰 Bonus de guilde",
    value:`+${result.bonusPacksGiven} pack(s) offert(s) par ta guilde !`
   })
  }

  if(result.bonusKamas > 0 && result.reward.type==="kamas"){
   embed.addFields({
    name:"⬆️ Bonus kamas",
    value:`+${result.bonusKamas} kamas de bonus joueur`
   })
  }

  save(interaction.user.id)

  await interaction.reply({ embeds:[embed] })

  const unlocked=[
   ...achievementCheck(user,"daily"),
   ...achievementCheck(user,"economy")
  ]

  if(unlocked.length)
   await notifyAchievements(interaction,unlocked)

 }

}