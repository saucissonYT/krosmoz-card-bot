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
 getEndlessRewardForLevel,
 getBattlePassAchievements,
 getBattlePassOverview,
 getBattlePassRewardsView
} = require("../../systems/battlePassService")

const REWARDS_PER_PAGE  = 8
const ACH_PER_PAGE      = 10
const activeRewardsPagers = new Map()

/* ─── Labels récompenses ─────────────────────────────────────────────────── */

function rewardLabel(reward) {
 if (!reward) return "—"
 if (reward.type === "kamas")             return `💰 ${reward.value} kamas`
 if (reward.type === "player_xp")         return `⭐ ${reward.value} XP joueur`
 if (reward.type === "pack")              return `📦 ${reward.value || 1} pack`
 if (reward.type === "pack_premium")      return `📦 ${reward.value || 1} pack`
 if (reward.type === "title")             return `📜 ${reward.value}`
 if (reward.type === "badge")             return `🏅 ${reward.value}`
 if (reward.type === "card")              return `🃏 ${reward.cardId}`
 if (reward.type === "card_random_rare")  return "🃏 Carte rare aléatoire"
 if (reward.type === "card_random_ssr")   return "🌈 Carte SSR aléatoire"
 return `${reward.type}`
}

function rewardsLabels(rewards, fallback = "—") {
 if (!Array.isArray(rewards) || rewards.length === 0) return fallback
 return rewards.map(rewardLabel).join(" | ")
}

/* ─── Barre style pity ───────────────────────────────────────────────────── */

function bar(percent) {
 const width  = 12
 const filled = Math.max(0, Math.min(width, Math.round(percent * width)))
 return "🟩".repeat(filled) + "⬛".repeat(width - filled)
}

/* ─── Embed principal ────────────────────────────────────────────────────── */

function buildMainEmbed(userId) {
 const data     = getBattlePassOverview(userId)
 const season   = data.seasonTemplate
 const progress = data.progress

 const maxSeasonLevel = season.totalLevels || 40
 const isEndless      = progress.currentLevel > maxSeasonLevel
 const xpLevel        = Math.max(0, data.xpInLevel     || 0)
 const xpNeed         = Math.max(1, xpLevel + (data.xpToNextLevel || 0))
 const ratio          = Math.min(1, Math.max(0, xpLevel / xpNeed))
 const pct            = Math.round(ratio * 100)

 const nextFree    = (season.freeRewards || []).find((r) => r.level > progress.currentLevel)
 const endlessNext = !nextFree ? getEndlessRewardForLevel(progress.currentLevel + 1) : null
 const nextRewardText = nextFree
  ? `Niv.${nextFree.level} — ${rewardLabel(nextFree)}`
  : endlessNext
   ? `Niv.${endlessNext.level} — ${rewardLabel(endlessNext)}`
   : "Pass entièrement complété"

 const keyLevels  = [20, 25, 30, 35, 40]
 const keyNext    = keyLevels.find((lv) => lv > progress.currentLevel)
 const levelLabel = isEndless
  ? `Niveau ${progress.currentLevel} (Suite)  ${progress.hasPremium ? "💎 Premium" : "🆓 Gratuit"}`
  : `Niveau ${progress.currentLevel}/${maxSeasonLevel}  ${progress.hasPremium ? "💎 Premium" : "🆓 Gratuit"}`

 const desc =
  `*${season.subtitle || "La saison est en marche."}*\n\n` +
  `📅 **Clôture de saison :** ${data.season.endDate}\n` +
  `⚡ **Aura active :** ${season.passiveBonus?.description || "-"}\n\n` +
  `🎚️ **Progression :** ${levelLabel}\n` +
  `⭐ **XP du palier :** ${xpLevel}/${xpNeed}\n` +
  `${bar(ratio)} ${pct}%\n\n` +
  `🎁 **À récupérer maintenant :** ${data.claimableCount}\n` +
  `➡️ **Prochaine récompense :** ${nextRewardText}\n` +
  `🏁 **Prochain palier légendaire :** ${keyNext ? `Niv.${keyNext}` : "Atteint"}\n` +
  `💎 **Prix Premium :** ${season.premiumPrice || 8000} kamas`

 const embed = new EmbedBuilder()
  .setTitle(`${season.emoji || "✨"} BATTLE PASS — ${season.name}`)
  .setDescription(desc)
  .setColor(season.color || "#1B6B3A")

 return { embed, data }
}

function buildActionRow(data) {
 const premiumPrice = data.seasonTemplate?.premiumPrice || 8000
 return new ActionRowBuilder().addComponents(
  new ButtonBuilder().setCustomId("bp_claim")
   .setLabel("🎁 Réclamer").setStyle(ButtonStyle.Success).setDisabled(data.claimableCount <= 0),
  new ButtonBuilder().setCustomId("bp_rewards")
   .setLabel("📜 Rewards").setStyle(ButtonStyle.Primary),
  new ButtonBuilder().setCustomId("bp_buy")
   .setLabel(`💎 Premium (${premiumPrice})`).setStyle(ButtonStyle.Secondary).setDisabled(data.progress.hasPremium),
  new ButtonBuilder().setCustomId("bp_ach")
   .setLabel("🏆 Succès").setStyle(ButtonStyle.Secondary),
  new ButtonBuilder().setCustomId("bp_season")
   .setLabel("🗓️ Saison").setStyle(ButtonStyle.Secondary)
 )
}

function buildBuyConfirmRow() {
 return new ActionRowBuilder().addComponents(
  new ButtonBuilder().setCustomId("bp_buy_confirm").setLabel("✅ Confirmer achat").setStyle(ButtonStyle.Success),
  new ButtonBuilder().setCustomId("bp_buy_cancel").setLabel("↩️ Retour").setStyle(ButtonStyle.Secondary)
 )
}

/* ─── Rewards page ───────────────────────────────────────────────────────── */

function buildRewardsPage(userId, page = 1) {
 const view  = getBattlePassRewardsView(userId, page, REWARDS_PER_PAGE)
 const lines = view.rows.map((row) => {
  const freeState    = row.claimedFree    ? "✅" : "🎁"
  const premiumState = row.claimedPremium ? "✅" : "⭐"
  const freeText     = rewardsLabels(row.freeRewards)
  const premiumText  = rewardsLabels(row.premiumRewards, "Aucune récompense premium sur ce palier")
  return `**Palier ${row.level}**\n${freeState} **Gratuit :** ${freeText}\n${premiumState} **Premium :** ${premiumText}`
 })

 const embed = new EmbedBuilder()
  .setTitle("📜 Grimoire des Récompenses")
  .setDescription(lines.join("\n\n") || "Aucune récompense.")
  .setFooter({ text: `Page ${view.page}/${view.maxPage} • 40 paliers` })
  .setColor("#1B6B3A")

 const row = new ActionRowBuilder().addComponents(
  new ButtonBuilder().setCustomId("bp_rewards_prev").setLabel("⬅️").setStyle(ButtonStyle.Secondary).setDisabled(view.page <= 1),
  new ButtonBuilder().setCustomId("bp_rewards_page").setLabel(`${view.page}/${view.maxPage}`).setStyle(ButtonStyle.Primary).setDisabled(true),
  new ButtonBuilder().setCustomId("bp_rewards_next").setLabel("➡️").setStyle(ButtonStyle.Secondary).setDisabled(view.page >= view.maxPage)
 )

 return { embed, row, page: view.page, maxPage: view.maxPage }
}

async function openRewardsPager(interaction, userId, startPage = 1) {
 const existing = activeRewardsPagers.get(userId)
 if (existing) { try { existing.collector.stop("replaced") } catch (_) {} }

 let currentPage = startPage
 const first = buildRewardsPage(userId, currentPage)
 let msg = null

 if (interaction.deferred || interaction.replied) {
  msg = await interaction.followUp({ embeds: [first.embed], components: [first.row], flags: 64, fetchReply: true })
 } else {
  msg = await interaction.reply({ embeds: [first.embed], components: [first.row], flags: 64, fetchReply: true })
 }

 const collector = msg.createMessageComponentCollector({ time: 180000 })
 activeRewardsPagers.set(userId, { collector, messageId: msg.id })

 collector.on("collect", async (i) => {
  if (i.user.id !== interaction.user.id) return i.reply({ content: "Ce menu n'est pas pour toi.", flags: 64 })
  if (i.customId === "bp_rewards_next") currentPage++
  if (i.customId === "bp_rewards_prev") currentPage--
  const pageData = buildRewardsPage(userId, currentPage)
  currentPage = pageData.page
  await i.update({ embeds: [pageData.embed], components: [pageData.row] })
 })

 collector.on("end", async () => {
  const entry = activeRewardsPagers.get(userId)
  if (entry?.messageId === msg.id) activeRewardsPagers.delete(userId)
  try { await msg.edit({ components: [] }) } catch (_) {}
 })
}

/* ─── Claim summary ──────────────────────────────────────────────────────── */

function buildClaimSummaryEmbed(result) {
 const preview = (result.claimedRewards || []).slice(0, 10)
 const lines   = preview.map((r) => {
  const track = r.track === "premium" ? "⭐" : "🎁"
  return `${track} **Niv.${r.level}** — ${r.text}`
 })
 if ((result.claimedRewards || []).length > preview.length) {
  lines.push(`… +${result.claimedRewards.length - preview.length} autre(s)`)
 }
 return new EmbedBuilder()
  .setTitle("🎉 Récompenses récupérées")
  .setDescription(lines.join("\n") || "Aucune récompense.")
  .addFields(
   { name: "Total",    value: `${result.total}`,               inline: true },
   { name: "💰 Kamas", value: `+${result.totals?.kamas || 0}`, inline: true },
   { name: "📦 Packs", value: `+${result.totals?.packs || 0}`, inline: true }
  )
  .setColor("#2ecc71")
}

/* ─── Achievements UX ────────────────────────────────────────────────────── */

function buildAchievementsEmbed(userId, tab = "seasonal", page = 1) {
 const data = getBattlePassAchievements(userId)

 const list         = tab === "global" ? data.globals : data.seasonal
 const totalPages   = Math.max(1, Math.ceil(list.length / ACH_PER_PAGE))
 const safePage     = Math.max(1, Math.min(page, totalPages))
 const slice        = list.slice((safePage - 1) * ACH_PER_PAGE, safePage * ACH_PER_PAGE)

 const unlockedList = tab === "global"
  ? data.globals.filter(a => a.unlocked)
  : data.seasonal.filter(a => a.unlocked)

 const headerLine   = tab === "global"
  ? `🌐 **Succès permanents** — ${unlockedList.length}/${data.globals.length} débloqués`
  : `🌸 **Succès saisonniers** (${data.seasonEmoji} ${data.seasonName}) — ${unlockedList.length}/${data.seasonal.length} débloqués`

 /* Barre de progression de l'onglet */
 const total   = list.length
 const done    = unlockedList.length
 const barLine = `${bar(total > 0 ? done / total : 0)} ${done}/${total}`

 const lines = slice.map((a) => {
  const icon      = a.unlocked ? "✅" : "🔒"
  const rewardTxt = a.reward
   ? ` — 🎖️ +${a.reward.bpXp || 0} XP BP${a.reward.kamas ? ` · 💰 ${a.reward.kamas}` : ""}`
   : ""
  return `${icon} **${a.name}**\n　${a.description || ""}${rewardTxt}`
 })

 const color = tab === "global" ? "#f39c12" : (data.seasonName?.includes("Ebene") ? "#222222" : "#9b59b6")

 const embed = new EmbedBuilder()
  .setTitle(`🏆 Codex des Succès Battle Pass`)
  .setDescription(`${headerLine}\n${barLine}\n\n${lines.join("\n\n") || "Aucun succès dans cette catégorie."}`)
  .setFooter({ text: `Page ${safePage}/${totalPages} • Total : ${data.total} succès BP` })
  .setColor(color)

 /* Row 1 : onglets */
 const tabRow = new ActionRowBuilder().addComponents(
  new ButtonBuilder()
   .setCustomId("bp_ach_seasonal")
   .setLabel(`🌸 Saisonniers (${data.seasonal.filter(a=>a.unlocked).length}/${data.seasonal.length})`)
   .setStyle(tab === "seasonal" ? ButtonStyle.Success : ButtonStyle.Secondary),
  new ButtonBuilder()
   .setCustomId("bp_ach_global")
   .setLabel(`🌐 Permanents (${data.globals.filter(a=>a.unlocked).length}/${data.globals.length})`)
   .setStyle(tab === "global" ? ButtonStyle.Success : ButtonStyle.Secondary)
 )

 /* Row 2 : pagination */
 const pageRow = new ActionRowBuilder().addComponents(
  new ButtonBuilder().setCustomId("bp_ach_prev").setLabel("◀").setStyle(ButtonStyle.Secondary).setDisabled(safePage <= 1),
  new ButtonBuilder().setCustomId("bp_ach_page").setLabel(`${safePage}/${totalPages}`).setStyle(ButtonStyle.Primary).setDisabled(true),
  new ButtonBuilder().setCustomId("bp_ach_next").setLabel("▶").setStyle(ButtonStyle.Secondary).setDisabled(safePage >= totalPages)
 )

 return { embed, rows: [tabRow, pageRow], page: safePage, totalPages, tab }
}

async function sendAchievements(interaction, userId) {
 let tab  = "seasonal"
 let page = 1

 const first = buildAchievementsEmbed(userId, tab, page)
 let msg = null

 if (interaction.deferred || interaction.replied) {
  msg = await interaction.followUp({ embeds: [first.embed], components: first.rows, flags: 64, fetchReply: true })
 } else {
  msg = await interaction.reply({ embeds: [first.embed], components: first.rows, flags: 64, fetchReply: true })
 }

 const collector = msg.createMessageComponentCollector({
  filter: (i) => i.user.id === interaction.user.id,
  time: 180000
 })

 collector.on("collect", async (i) => {
  if (i.customId === "bp_ach_seasonal") { tab = "seasonal"; page = 1 }
  if (i.customId === "bp_ach_global")   { tab = "global";   page = 1 }
  if (i.customId === "bp_ach_next")     page++
  if (i.customId === "bp_ach_prev")     page--

  const refreshed = buildAchievementsEmbed(userId, tab, page)
  page = refreshed.page
  await i.update({ embeds: [refreshed.embed], components: refreshed.rows })
 })

 collector.on("end", async () => {
  try { await msg.edit({ components: [] }) } catch (_) {}
 })
}

/* ─── Season info ────────────────────────────────────────────────────────── */

async function sendSeason(interaction, userId) {
 const data   = getBattlePassOverview(userId)
 const season = data.seasonTemplate

 const embed = new EmbedBuilder()
  .setTitle(`${season.emoji || "✨"} ${season.name} — Dossier de saison`)
  .setDescription(
   `${season.subtitle || ""}\n\n` +
   `**Bonus actif :** ${season.passiveBonus?.description || "-"}\n` +
   `**Cycle :** 6 saisons fixes (Émeraude → Pourpre → Turquoise → Ocre → Ivoire → Ébène)`
  )
  .addFields(
   { name: "Début",         value: data.season.startDate,              inline: true },
   { name: "Fin",           value: data.season.endDate,                inline: true },
   { name: "Prix Premium",  value: `${season.premiumPrice || 8000} kamas`, inline: true }
  )
  .setColor(season.color || "#1B6B3A")

 return interaction.followUp({ embeds: [embed], flags: 64 })
}

async function sendRewards(interaction, userId, page = 1) {
 return openRewardsPager(interaction, userId, page)
}

/* ─── Module ─────────────────────────────────────────────────────────────── */

module.exports = {
 data: new SlashCommandBuilder()
  .setName("battlepass")
  .setDescription("Voir ta progression Battle Pass")
  .addStringOption((option) =>
   option.setName("action").setDescription("Action rapide").setRequired(false)
    .addChoices(
     { name: "Voir",         value: "view"         },
     { name: "Claim",        value: "claim"        },
     { name: "Rewards",      value: "rewards"      },
     { name: "Buy",          value: "buy"          },
     { name: "Achievements", value: "achievements" },
     { name: "Season",       value: "season"       }
    )
  )
  .addIntegerOption((option) =>
   option.setName("page").setDescription("Page rewards").setRequired(false).setMinValue(1).setMaxValue(10)
  ),

 async execute(interaction) {
  const action = interaction.options.getString("action") || "view"
  const page   = interaction.options.getInteger("page")  || 1
  const userId = interaction.user.id

  if (action === "claim") {
   const result = await claimAllBattlePassRewards(userId)
   if (!result.ok) return interaction.reply({ content: `❌ ${result.error}`, flags: 64 })
   return interaction.reply({ embeds: [buildClaimSummaryEmbed(result)], flags: 64 })
  }

  if (action === "buy") {
   const result = await buyPremium(userId)
   if (!result.ok) return interaction.reply({ content: `❌ ${result.error}`, flags: 64 })
   return interaction.reply({ content: `✅ Pass Premium activé. Récompenses rétroactives : ${result.retroCount}.`, flags: 64 })
  }

  if (action === "rewards")      return sendRewards(interaction, userId, page)
  if (action === "achievements") return sendAchievements(interaction, userId)
  if (action === "season")       return sendSeason(interaction, userId)

  const { embed, data } = buildMainEmbed(userId)
  const row = buildActionRow(data)

  await interaction.reply({ embeds: [embed], components: [row], flags: 64 })
  const msg = await interaction.fetchReply()

  const collector = msg.createMessageComponentCollector({ time: 180000 })

  collector.on("collect", async (i) => {
   if (i.user.id !== interaction.user.id)
    return i.reply({ content: "Ce menu n'est pas pour toi.", flags: 64 })

   if (i.customId === "bp_claim") {
    const result = await claimAllBattlePassRewards(userId)
    if (!result.ok) return i.reply({ content: `❌ ${result.error}`, flags: 64 })
    const refreshed = buildMainEmbed(userId)
    await i.update({ embeds: [refreshed.embed], components: [buildActionRow(refreshed.data)] })
    return i.followUp({ embeds: [buildClaimSummaryEmbed(result)], flags: 64 })
   }

   if (i.customId === "bp_buy") {
    const refreshed    = buildMainEmbed(userId)
    const confirmEmbed = new EmbedBuilder(refreshed.embed.data).addFields({
     name:  "Confirmation Premium",
     value: `Tu vas dépenser **${refreshed.data.seasonTemplate.premiumPrice || 8000} kamas**.\nVeux-tu activer le Pass Premium maintenant ?`
    })
    return i.update({ embeds: [confirmEmbed], components: [buildBuyConfirmRow()] })
   }

   if (i.customId === "bp_buy_confirm") {
    const result = await buyPremium(userId)
    if (!result.ok) return i.reply({ content: `❌ ${result.error}`, flags: 64 })
    await i.reply({ content: `✅ Pass Premium activé. Rétroactif : ${result.retroCount} paliers.`, flags: 64 })
    const refreshed = buildMainEmbed(userId)
    return interaction.editReply({ embeds: [refreshed.embed], components: [buildActionRow(refreshed.data)] })
   }

   if (i.customId === "bp_buy_cancel") {
    const refreshed = buildMainEmbed(userId)
    return i.update({ embeds: [refreshed.embed], components: [buildActionRow(refreshed.data)] })
   }

   if (i.customId === "bp_rewards") { await i.deferUpdate(); return sendRewards(interaction, userId, 1) }
   if (i.customId === "bp_ach")     { await i.deferUpdate(); return sendAchievements(interaction, userId) }
   if (i.customId === "bp_season")  { await i.deferUpdate(); return sendSeason(interaction, userId) }
  })
 }
}