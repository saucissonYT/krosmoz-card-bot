const {
 SlashCommandBuilder,
 EmbedBuilder,
 ActionRowBuilder,
 ButtonBuilder,
 ButtonStyle
} = require("discord.js")

const {
 buyPremium,
 claimAllBattlePassRewards,
 getBattlePassAchievements,
 getBattlePassOverview,
 getBattlePassRewardsView
} = require("../../systems/battlePassService")

function rewardLabel(reward) {
 if (!reward) return "—"
 if (reward.type === "kamas") return `💰 ${reward.value} kamas`
 if (reward.type === "player_xp") return `⭐ ${reward.value} XP joueur`
 if (reward.type === "pack") return `📦 ${reward.value || 1} pack`
 if (reward.type === "pack_premium") return `🎁 ${reward.value || 1} pack premium`
 if (reward.type === "title") return `📜 ${reward.value}`
 if (reward.type === "badge") return `🏅 ${reward.value}`
 if (reward.type === "card") return `🃏 ${reward.cardId}`
 if (reward.type === "card_random_rare") return "🃏 Carte rare aleatoire"
 if (reward.type === "card_random_ssr") return "🌈 Carte SSR aleatoire"
 return `${reward.type}`
}

function bar(percent) {
 const width = 20
 const filled = Math.max(0, Math.min(width, Math.round(percent * width)))
 return `${"█".repeat(filled)}${"░".repeat(width - filled)}`
}

function buildMainEmbed(userId) {
 const data = getBattlePassOverview(userId)
 const season = data.seasonTemplate
 const progress = data.progress

 const curve = season.xpCurve || []
 const prevCap = progress.currentLevel <= 1 ? 0 : (curve[progress.currentLevel - 2] || 0)
 const levelCap = curve[progress.currentLevel - 1] || curve[curve.length - 1] || progress.totalXP

 const xpLevel = Math.max(0, progress.totalXP - prevCap)
 const xpNeed = Math.max(1, levelCap - prevCap)
 const ratio = Math.min(1, Math.max(0, xpLevel / xpNeed))
 const pct = Math.round(ratio * 100)

 const nextFree = (season.freeRewards || []).find((r) => r.level > progress.currentLevel)
 const keyLevels = [20, 25, 30, 35, 40]
 const keyNext = keyLevels.find((lv) => lv > progress.currentLevel)

 const desc =
  `*${season.subtitle || "La saison est en marche."}*\n\n` +
  `📅 **Cloture de saison:** ${data.season.endDate}\n` +
  `⚡ **Aura active:** ${season.passiveBonus?.description || "-"}\n\n` +
  `🎚️ **Progression:** Niveau ${progress.currentLevel}/${season.totalLevels}  ${progress.hasPremium ? "💎 Premium" : "🆓 Gratuit"}\n` +
  `⭐ **XP du palier:** ${xpLevel}/${xpNeed}\n` +
  `[${bar(ratio)}] ${pct}%\n\n` +
  `🎁 **A recuperer maintenant:** ${data.claimableCount}\n` +
  `➡️ **Prochaine recompense:** ${nextFree ? `Niv.${nextFree.level} — ${rewardLabel(nextFree)}` : "Pass entierement complete"}\n` +
  `🏁 **Prochain palier legendaire:** ${keyNext ? `Niv.${keyNext}` : "Atteint"}`

 const embed = new EmbedBuilder()
  .setTitle(`${season.emoji || "✨"} BATTLE PASS — ${season.name}`)
  .setDescription(desc)
  .setColor(season.color || "#1B6B3A")

 return { embed, data }
}

function buildActionRow(data) {
 return new ActionRowBuilder().addComponents(
  new ButtonBuilder()
   .setCustomId("bp_claim")
   .setLabel("🎁 Reclamer")
   .setStyle(ButtonStyle.Success)
   .setDisabled(data.claimableCount <= 0),
  new ButtonBuilder()
   .setCustomId("bp_rewards")
   .setLabel("📜 Rewards")
   .setStyle(ButtonStyle.Primary),
  new ButtonBuilder()
   .setCustomId("bp_buy")
   .setLabel("💎 Premium")
   .setStyle(ButtonStyle.Secondary)
   .setDisabled(data.progress.hasPremium),
  new ButtonBuilder()
   .setCustomId("bp_ach")
   .setLabel("🏆 Succes")
   .setStyle(ButtonStyle.Secondary),
  new ButtonBuilder()
   .setCustomId("bp_season")
   .setLabel("🗓️ Saison")
   .setStyle(ButtonStyle.Secondary)
 )
}

async function sendRewards(interaction, userId, page = 1) {
 const view = getBattlePassRewardsView(userId, page, 10)
 const lines = view.rows.map((row) => {
  const f = row.claimedFree ? "✅" : "🎁"
  const p = row.claimedPremium ? "✅" : "⭐"
  return `**Palier ${row.level}**\n${f} Gratuit: ${rewardLabel(row.free)}\n${p} Premium: ${rewardLabel(row.premium)}`
 })

 const embed = new EmbedBuilder()
  .setTitle("📜 Grimoire des Recompenses (40 paliers)")
  .setDescription(lines.join("\n\n") || "Aucune reward.")
  .setFooter({ text: `Page ${view.page}/${view.maxPage}` })
  .setColor("#1B6B3A")

 if (interaction.deferred || interaction.replied) {
  return interaction.followUp({ embeds: [embed], flags: 64 })
 }
 return interaction.reply({ embeds: [embed], flags: 64 })
}

async function sendAchievements(interaction, userId) {
 const data = getBattlePassAchievements(userId)
 const lines = data.entries.slice(0, 25).map((entry) => `${entry.unlocked ? "✅" : "🔒"} ${entry.name}`)

 const embed = new EmbedBuilder()
  .setTitle("🏆 Codex des Succes")
  .setDescription(lines.join("\n") || "Aucun succes.")
  .setFooter({ text: `${data.unlocked.length}/${data.total} debloques` })
  .setColor("#8E1F1F")

 return interaction.followUp({ embeds: [embed], flags: 64 })
}

async function sendSeason(interaction, userId) {
 const data = getBattlePassOverview(userId)
 const season = data.seasonTemplate

 const embed = new EmbedBuilder()
  .setTitle(`${season.emoji || "✨"} ${season.name} — Dossier de saison`)
  .setDescription(
   `${season.subtitle || ""}\n\n` +
   `**Bonus actif:** ${season.passiveBonus?.description || "-"}\n` +
   `**Cycle:** 6 saisons fixes (Emeraude -> Pourpre -> Turquoise -> Ocre -> Ivoire -> Ebene)`
  )
  .addFields(
   { name: "Debut", value: data.season.startDate, inline: true },
   { name: "Fin", value: data.season.endDate, inline: true },
   { name: "Prix Premium", value: `${season.premiumPrice || 8000} kamas`, inline: true }
  )
  .setColor(season.color || "#1B6B3A")

 return interaction.followUp({ embeds: [embed], flags: 64 })
}

module.exports = {
 data: new SlashCommandBuilder()
  .setName("battlepass")
  .setDescription("Voir ta progression Battle Pass")
  .addStringOption((option) =>
   option.setName("action")
    .setDescription("Action rapide")
    .setRequired(false)
    .addChoices(
     { name: "Voir", value: "view" },
     { name: "Claim", value: "claim" },
     { name: "Rewards", value: "rewards" },
     { name: "Buy", value: "buy" },
     { name: "Achievements", value: "achievements" },
     { name: "Season", value: "season" }
    )
  )
  .addIntegerOption((option) =>
   option.setName("page")
    .setDescription("Page rewards")
    .setRequired(false)
    .setMinValue(1)
    .setMaxValue(10)
  ),

 async execute(interaction) {
  const action = interaction.options.getString("action") || "view"
  const page = interaction.options.getInteger("page") || 1
  const userId = interaction.user.id

  if (action === "claim") {
   const result = await claimAllBattlePassRewards(userId)
   if (!result.ok) return interaction.reply({ content: `❌ ${result.error}`, flags: 64 })
   return interaction.reply({ content: `✅ Coffres ouverts. Butin recupere: ${result.total} (${result.freeCount} gratuit + ${result.premiumCount} premium).`, flags: 64 })
  }

  if (action === "buy") {
   const result = await buyPremium(userId)
   if (!result.ok) return interaction.reply({ content: `❌ ${result.error}`, flags: 64 })
   return interaction.reply({ content: `✅ Pass Premium active. Recompenses retroactives accordees: ${result.retroCount}.`, flags: 64 })
  }

  if (action === "rewards") return sendRewards(interaction, userId, page)
  if (action === "achievements") return sendAchievements(interaction, userId)
  if (action === "season") return sendSeason(interaction, userId)

  const { embed, data } = buildMainEmbed(userId)
  const row = buildActionRow(data)

  await interaction.reply({ embeds: [embed], components: [row], flags: 64 })
  const msg = await interaction.fetchReply()

  const collector = msg.createMessageComponentCollector({ time: 180000 })

  collector.on("collect", async (i) => {
   if (i.user.id !== interaction.user.id) {
    return i.reply({ content: "Ce menu n'est pas pour toi.", flags: 64 })
   }

  if (i.customId === "bp_claim") {
    const result = await claimAllBattlePassRewards(userId)
    if (!result.ok) {
      return i.reply({ content: `❌ ${result.error}`, flags: 64 })
    }
    const refreshed = buildMainEmbed(userId)
    return i.update({ embeds: [refreshed.embed], components: [buildActionRow(refreshed.data)] })
   }

   if (i.customId === "bp_buy") {
    const result = await buyPremium(userId)
    if (!result.ok) {
     return i.reply({ content: `❌ ${result.error}`, flags: 64 })
    }
    await i.reply({ content: `✅ Pass Premium active. Retroactif: ${result.retroCount} paliers.`, flags: 64 })
    const refreshed = buildMainEmbed(userId)
    return interaction.editReply({ embeds: [refreshed.embed], components: [buildActionRow(refreshed.data)] })
   }

   if (i.customId === "bp_rewards") {
    await i.deferUpdate()
    return sendRewards(interaction, userId, 1)
   }

   if (i.customId === "bp_ach") {
    await i.deferUpdate()
    return sendAchievements(interaction, userId)
   }

   if (i.customId === "bp_season") {
    await i.deferUpdate()
    return sendSeason(interaction, userId)
   }
  })
 }
}
