const { SlashCommandBuilder, EmbedBuilder } = require("discord.js")
const { getUser, save } = require("../../systems/userSystem")
const { achievementCheck } = require("../../systems/achievementCheck")
const { notifyAchievements } = require("../../systems/achievementNotifier")
const {
 claimAllAchievementRewards,
 getPendingAchievementIds
} = require("../../systems/achievementClaimService")

function fmt(value) {
 return Number(value || 0).toLocaleString("fr-FR")
}

module.exports = {
 data: new SlashCommandBuilder()
  .setName("achievementclaim")
  .setDescription("Recuperer toutes les recompenses de succes en attente."),

 async execute(interaction) {
  await interaction.deferReply({ flags: 64 })

  const user = getUser(interaction.user.id)
  const before = getPendingAchievementIds(user).length
  if (before <= 0) {
   const emptyEmbed = new EmbedBuilder()
    .setTitle("Recompenses de succes")
    .setColor("#5865F2")
    .setDescription("Aucune recompense en attente pour le moment.")
   await interaction.editReply({ embeds: [emptyEmbed] })
   return
  }

  const claim = claimAllAchievementRewards(user)
  const newlyUnlocked = achievementCheck(user, null)
  const pendingAfter = getPendingAchievementIds(user).length
  save(interaction.user.id)

  const lines = []
  if (claim.totals.kamas > 0) lines.push(`- **${fmt(claim.totals.kamas)}** kamas`)
  if (claim.totals.packs > 0) lines.push(`- **${fmt(claim.totals.packs)}** pack${claim.totals.packs > 1 ? "s" : ""}`)
  if (claim.totals.cards > 0) lines.push(`- **${fmt(claim.totals.cards)}** carte${claim.totals.cards > 1 ? "s" : ""}`)
  if (claim.totals.xp > 0) lines.push(`- **${fmt(claim.totals.xp)}** XP`)
  if (claim.totals.fragments > 0) lines.push(`- **${fmt(claim.totals.fragments)}** fragment${claim.totals.fragments > 1 ? "s" : ""}`)
  if (claim.totals.titles > 0) lines.push(`- **${fmt(claim.totals.titles)}** titre${claim.totals.titles > 1 ? "s" : ""}`)

  const resultEmbed = new EmbedBuilder()
   .setTitle("Recompenses recuperees")
   .setColor("#f1c40f")
   .setDescription(lines.length ? lines.join("\n") : "Recompenses recuperees.")
   .addFields(
    { name: "Succes claim", value: `**${fmt(claim.claimedCount)}**`, inline: true },
    { name: "Nouveaux succes", value: `**${fmt(newlyUnlocked.length)}**`, inline: true },
    { name: "En attente", value: `**${fmt(pendingAfter)}**`, inline: true }
   )

  await interaction.editReply({ embeds: [resultEmbed] })

  if (newlyUnlocked.length > 0) {
   await notifyAchievements(interaction, newlyUnlocked, user)
  }
 }
}
