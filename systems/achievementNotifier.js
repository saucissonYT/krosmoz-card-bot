const { EmbedBuilder } = require("discord.js")
const achievements = require("./achievementRegistry")
const { getAchievementReward, formatReward } = require("./achievementRewards")
const { ensureAchievementClaimState } = require("./achievementClaimService")

function getPendingRewardForAchievement(user, achievementId, achievementDef) {
 if (!user) return getAchievementReward(achievementId, achievementDef)
 const { pendingRewards } = ensureAchievementClaimState(user)
 return pendingRewards?.[achievementId] || getAchievementReward(achievementId, achievementDef)
}

async function notifyWithSender(sendFn, list, user) {
 for (const id of list) {
  const achievement = achievements[id]
  if (!achievement) continue

  const reward = getPendingRewardForAchievement(user, id, achievement)
  const rewardText = formatReward(reward)

  const embed = new EmbedBuilder()
   .setTitle("Succes debloque")
   .setColor("#f1c40f")

  let desc = `${achievement.badge} **${achievement.name}**`
  if (achievement.description) desc += `\nDescription: ${achievement.description}`
  if (achievement.title) desc += `\nTitre a recuperer: **${achievement.title}**`
  if (rewardText) desc += `\n\n**Recompenses en attente**\n${rewardText}`
  desc += "\n\nPour valider ce succes et recevoir les gains, fais **/achievementclaim** (ou claim depuis la page web des achievements)."
  embed.setDescription(desc)

  if (achievement.secret) {
   embed.setFooter({ text: "Succes secret" })
  }

  await sendFn(embed)
 }
}

async function notifyAchievements(interaction, list, user) {
 return notifyWithSender(
  async (embed) => {
   await interaction.followUp({
    embeds: [embed],
    flags: 64
   })
  },
  list,
  user
 )
}

async function notifyAchievementsMessage(message, list, user) {
 return notifyWithSender(
  async (embed) => {
   await message.reply({ embeds: [embed] })
  },
  list,
  user
 )
}

module.exports = {
 notifyAchievements,
 notifyAchievementsMessage
}
