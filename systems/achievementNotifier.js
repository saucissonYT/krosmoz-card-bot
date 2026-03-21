const { EmbedBuilder } = require("discord.js")
const achievements = require("./achievementRegistry")
const { getAchievementReward, formatReward } = require("./achievementRewards")

/* ===============================================
   ACHIEVEMENT NOTIFIER
   
   Affiche les succès débloqués avec leurs récompenses.
   
   MODIFIÉ : utilise désormais des embeds au lieu de
   messages texte bruts pour un affichage plus riche.
   Affiche les récompenses (kamas, XP, packs) obtenues.
   
   Lit user._lastAchievementRewards si disponible pour
   récupérer les rewards exactes (avec bonus secret etc).
   Sinon, recalcule via getAchievementReward().
=============================================== */

async function notifyAchievements(interaction, list, user){

 for(const id of list){

  const a = achievements[id]

  if(!a) continue

  /* Récupérer la reward exacte depuis le cache user ou recalculer */
  let reward

  if(user && user._lastAchievementRewards && user._lastAchievementRewards[id]){
   reward = user._lastAchievementRewards[id]
  } else {
   reward = getAchievementReward(id, a)
  }

  const rewardText = formatReward(reward)

  /* Construire l'embed */
  const embed = new EmbedBuilder()
   .setTitle("🏆 Succès débloqué !")
   .setColor("#f1c40f")

  let desc = `${a.badge} **${a.name}**`

  if(a.description)
   desc += `\n📝 ${a.description}`

  if(a.title)
   desc += `\n🎖️ Titre obtenu : **${a.title}**`

  if(rewardText)
   desc += `\n\n🎁 **Récompenses :**\n${rewardText}`

  embed.setDescription(desc)

  if(a.secret)
   embed.setFooter({ text:"🔒 Succès secret !" })

  await interaction.followUp({
   embeds:[embed],
   flags:64
  })

 }

 /* Nettoyer le cache de rewards après notification */
 if(user && user._lastAchievementRewards){
  delete user._lastAchievementRewards
 }

}

module.exports = {
 notifyAchievements
}