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

/* ---- imports pour l'affichage des quêtes journalières dans le battlepass ---- */
const {
 getAllProgress,
 ensureUserQuests,
 getNextDailyReset,
 DAILY_BONUS,
 DAILY_COUNT
} = require("../../systems/questSystem")

const { getUser, save } = require("../../systems/userSystem")

const REWARDS_PER_PAGE = 8
const ACH_PER_PAGE = 10

const EMOJI = {
 money: "\u{1F4B0}",
 star: "\u{2B50}",
 pack: "\u{1F4E6}",
 scroll: "\u{1F4DC}",
 badge: "\u{1F3C5}",
 card: "\u{1F0CF}",
 rainbow: "\u{1F308}",
 green: "\u{1F7E9}",
 black: "\u{2B1B}",
 free: "\u{1F193}",
 calendar: "\u{1F4C5}",
 bolt: "\u{26A1}",
 slider: "\u{1F39A}\u{FE0F}",
 gift: "\u{1F381}",
 right: "\u{27A1}\u{FE0F}",
 left: "\u{2B05}\u{FE0F}",
 finish: "\u{1F3C1}",
 diamond: "\u{1F48E}",
 sparkle: "\u{2728}",
 trophy: "\u{1F3C6}",
 globe: "\u{1F310}",
 flower: "\u{1F338}",
 lock: "\u{1F512}",
 medal: "\u{1F396}\u{FE0F}",
 party: "\u{1F389}",
 check: "\u{2705}",
 cross: "\u{274C}",
 prev: "\u{25C0}",
 next: "\u{25B6}",
 sun: "\u{2600}\u{FE0F}"
}

function rewardLabel(reward) {
 if (!reward) return "-"
 if (reward.type === "kamas") return `${EMOJI.money} ${reward.value} kamas`
 if (reward.type === "player_xp") return `${EMOJI.star} ${reward.value} XP joueur`
 if (reward.type === "pack" || reward.type === "pack_premium") return `${EMOJI.pack} ${reward.value || 1} pack`
 if (reward.type === "title") return `${EMOJI.scroll} ${reward.value}`
 if (reward.type === "badge") return `${EMOJI.badge} ${reward.value}`
 if (reward.type === "card_random_rare") return `${EMOJI.card} Carte rare aleatoire`
 if (reward.type === "card_random_ssr") return `${EMOJI.rainbow} Carte SSR aleatoire`
 if (reward.type === "fragment_random") return `🧩 ${reward.value || reward.quantity || 1} fragment(s)`
 if (reward.type === "card") return `${EMOJI.card} ${reward.cardId}`
 return String(reward.type || "reward")
}

function rewardsLabels(rewards, fallback = "-") {
 if (!Array.isArray(rewards) || rewards.length === 0) return fallback
 return rewards.map(rewardLabel).join(" | ")
}

function bar(percent) {
 const width = 12
 const filled = Math.max(0, Math.min(width, Math.round(percent * width)))
 return EMOJI.green.repeat(filled) + EMOJI.black.repeat(width - filled)
}

function getMessagePage(message) {
 const text = message?.embeds?.[0]?.footer?.text || ""
 const match = text.match(/Page\s+(\d+)\//i)
 return match ? Number(match[1]) : 1
}

function getAchievementsTabFromMessage(message) {
 for (const row of message?.components || []) {
  for (const component of row.components || []) {
   if (component.customId === "bp_ach_global" && component.style === ButtonStyle.Success) return "global"
   if (component.customId === "bp_ach_seasonal" && component.style === ButtonStyle.Success) return "seasonal"
  }
 }
 return "seasonal"
}

/* ================= MAIN EMBED ================= */

function buildMainEmbed(userId) {
 const data = getBattlePassOverview(userId)
 const season = data.seasonTemplate
 const progress = data.progress

 const maxSeasonLevel = season.totalLevels || 40
 const isEndless = progress.currentLevel > maxSeasonLevel
 const xpLevel = Math.max(0, data.xpInLevel || 0)
 const xpNeed = Math.max(1, xpLevel + (data.xpToNextLevel || 0))
 const ratio = Math.min(1, Math.max(0, xpLevel / xpNeed))
 const pct = Math.round(ratio * 100)

 const nextFree = (season.freeRewards || []).find((reward) => reward.level > progress.currentLevel)
 const endlessNext = !nextFree ? getEndlessRewardForLevel(progress.currentLevel + 1) : null
 const nextRewardText = nextFree
  ? `Niv.${nextFree.level} - ${rewardLabel(nextFree)}`
  : endlessNext
   ? `Niv.${endlessNext.level} - ${rewardLabel(endlessNext)}`
   : "Pass complet"

 const keyLevels = [20, 25, 30, 35, 40]
 const keyNext = keyLevels.find((level) => level > progress.currentLevel)
 const levelLabel = isEndless
  ? `Niveau ${progress.currentLevel} (Suite) ${progress.hasPremium ? `${EMOJI.diamond} Premium` : `${EMOJI.free} Gratuit`}`
  : `Niveau ${progress.currentLevel}/${maxSeasonLevel} ${progress.hasPremium ? `${EMOJI.diamond} Premium` : `${EMOJI.free} Gratuit`}`

 const embed = new EmbedBuilder()
  .setTitle(`${season.emoji || EMOJI.sparkle} BATTLE PASS - ${season.name}`)
  .setDescription(
   `*${season.subtitle || "La saison est en marche."}*\n\n` +
   `${EMOJI.calendar} **Cloture de saison :** ${data.season.endDate}\n` +
   `${EMOJI.bolt} **Aura active :** ${season.passiveBonus?.description || "-"}\n\n` +
   `${EMOJI.slider} **Progression :** ${levelLabel}\n` +
   `${EMOJI.star} **XP du palier :** ${xpLevel}/${xpNeed}\n` +
   `${bar(ratio)} ${pct}%\n\n` +
   `${EMOJI.gift} **A recuperer maintenant :** ${data.claimableCount}\n` +
   `${EMOJI.right} **Prochaine recompense :** ${nextRewardText}\n` +
   `${EMOJI.finish} **Prochain palier legendaire :** ${keyNext ? `Niv.${keyNext}` : "Atteint"}\n` +
   `${EMOJI.diamond} **Prix Premium :** ${season.premiumPrice || 8000} kamas`
  )
  .setColor(season.color || "#1B6B3A")

 return { embed, data }
}

/* ================= ACTION ROWS ================= */
/*
 * On passe de 1 à 2 ActionRows :
 * - Row 1 : actions principales (Réclamer, Rewards, Premium)
 * - Row 2 : navigation/info (Succès, Saison, Quêtes du jour)
 *
 * Raison : Discord limite à 5 boutons par ActionRow. Avec 5 boutons
 * dans une seule row, il n'y avait plus de place pour le bouton quêtes.
 */
function buildActionRows(data) {
 const premiumPrice = data.seasonTemplate?.premiumPrice || 8000

 const row1 = new ActionRowBuilder().addComponents(
  new ButtonBuilder()
   .setCustomId("bp_claim")
   .setLabel(`${EMOJI.gift} Reclamer`)
   .setStyle(ButtonStyle.Success)
   .setDisabled(data.claimableCount <= 0),
  new ButtonBuilder()
   .setCustomId("bp_rewards")
   .setLabel(`${EMOJI.scroll} Rewards`)
   .setStyle(ButtonStyle.Primary),
  new ButtonBuilder()
   .setCustomId("bp_buy")
   .setLabel(`${EMOJI.diamond} Premium (${premiumPrice})`)
   .setStyle(ButtonStyle.Secondary)
   .setDisabled(data.progress.hasPremium)
 )

 const row2 = new ActionRowBuilder().addComponents(
  new ButtonBuilder()
   .setCustomId("bp_ach")
   .setLabel(`${EMOJI.trophy} Succes`)
   .setStyle(ButtonStyle.Secondary),
  new ButtonBuilder()
   .setCustomId("bp_season")
   .setLabel(`${EMOJI.calendar} Saison`)
   .setStyle(ButtonStyle.Secondary),
  new ButtonBuilder()
   .setCustomId("bp_quests")
   .setLabel(`${EMOJI.sun} Quetes du jour`)
   .setStyle(ButtonStyle.Secondary)
 )

 return [row1, row2]
}

function buildBuyConfirmRow() {
 return new ActionRowBuilder().addComponents(
  new ButtonBuilder().setCustomId("bp_buy_confirm").setLabel("Confirmer achat").setStyle(ButtonStyle.Success),
  new ButtonBuilder().setCustomId("bp_buy_cancel").setLabel("Retour").setStyle(ButtonStyle.Secondary)
 )
}

/* ================= QUÊTES JOURNALIÈRES EMBED ================= */
/*
 * Affiche la progression des quêtes journalières du joueur directement
 * depuis le battlepass. Appelle ensureUserQuests() + save() pour
 * garantir que le snapshot est bien initialisé avant l'affichage.
 */
function buildDailyQuestsEmbed(userId) {
 const user = getUser(userId)

 /* Init le snapshot si pas encore fait aujourd'hui */
 ensureUserQuests(user)
 save()

 const progress = getAllProgress(user, "daily")
 const completed = progress.filter(q => q.done).length
 const allClaimed = progress.every(q => q.claimed)
 const hasClaimable = progress.some(q => q.done && !q.claimed)
 const total = progress.length

 const lines = progress.map(q => {
  const status = q.claimed ? "✅" : q.done ? "🎁" : "⬜"
  const pctText = q.done ? "**OK**" : `${q.current}/${q.goal}`
  const rewardParts = []
  if (q.reward?.kamas) rewardParts.push(`${EMOJI.money} ${q.reward.kamas}`)
  if (q.reward?.packs) rewardParts.push(`${EMOJI.pack} ${q.reward.packs} pack(s)`)
  if (q.reward?.xp)    rewardParts.push(`${EMOJI.star} ${q.reward.xp} XP`)
  return `${status} **${q.name}** — ${pctText}\n*${q.desc}* → ${rewardParts.join(" | ") || "-"}`
 })

 let bonusLine = ""
 const bonusParts = []
 if (DAILY_BONUS?.kamas) bonusParts.push(`${EMOJI.money} ${DAILY_BONUS.kamas}`)
 if (DAILY_BONUS?.packs) bonusParts.push(`${EMOJI.pack} ${DAILY_BONUS.packs} pack(s)`)
 if (DAILY_BONUS?.xp)    bonusParts.push(`${EMOJI.star} ${DAILY_BONUS.xp} XP`)
 const bonusStr = bonusParts.join(" | ")

 if (allClaimed) {
  bonusLine = `\n${EMOJI.trophy} **BONUS JOURNALIER RÉCUPÉRÉ !** ${bonusStr ? `(${bonusStr})` : ""}`
 } else if (completed >= total && hasClaimable) {
  bonusLine = `\n${EMOJI.gift} **Toutes terminées !** Réclame via **/quests** → Bonus : ${bonusStr}`
 } else if (completed >= total) {
  bonusLine = `\n${EMOJI.trophy} **Toutes terminées et récupérées !**`
 }

 return new EmbedBuilder()
  .setTitle(`${EMOJI.sun} Quêtes Journalières`)
  .setColor(allClaimed ? "#f1c40f" : completed >= total ? "#2ecc71" : "#3498db")
  .setDescription(
   `Reset dans **${getNextDailyReset()}**\n\n` +
   `${bar(total ? completed / total : 0)} **${completed}/${total}** terminées${bonusLine}\n\n` +
   lines.join("\n\n")
  )
  .setFooter({ text: `Utilise /quests pour réclamer tes récompenses journalières` })
}

/* ================= REWARDS PAGE ================= */

function buildRewardsPage(userId, page = 1) {
 const view = getBattlePassRewardsView(userId, page, REWARDS_PER_PAGE)
 const lines = view.rows.map((row) => {
  const freeState = row.claimedFree ? EMOJI.check : EMOJI.gift
  const premiumState = row.claimedPremium ? EMOJI.check : EMOJI.star
  return `**Palier ${row.level}**\n${freeState} **Gratuit :** ${rewardsLabels(row.freeRewards)}\n${premiumState} **Premium :** ${rewardsLabels(row.premiumRewards, "Aucune reward premium sur ce palier")}`
 })

 const embed = new EmbedBuilder()
  .setTitle(`${EMOJI.scroll} Grimoire des recompenses`)
  .setDescription(lines.join("\n\n") || "Aucune recompense.")
  .setFooter({ text: `Page ${view.page}/${view.maxPage} - 40 paliers` })
  .setColor("#1B6B3A")

 const row = new ActionRowBuilder().addComponents(
  new ButtonBuilder().setCustomId("bp_rewards_prev").setLabel(EMOJI.left).setStyle(ButtonStyle.Secondary).setDisabled(view.page <= 1),
  new ButtonBuilder().setCustomId("bp_rewards_page").setLabel(`${view.page}/${view.maxPage}`).setStyle(ButtonStyle.Primary).setDisabled(true),
  new ButtonBuilder().setCustomId("bp_rewards_next").setLabel(EMOJI.right).setStyle(ButtonStyle.Secondary).setDisabled(view.page >= view.maxPage)
 )

 return { embed, row }
}

/* ================= ACHIEVEMENTS EMBED ================= */

function buildAchievementsEmbed(userId, tab = "seasonal", page = 1) {
 const data = getBattlePassAchievements(userId)
 const list = tab === "global" ? data.globals : data.seasonal
 const totalPages = Math.max(1, Math.ceil(list.length / ACH_PER_PAGE))
 const safePage = Math.max(1, Math.min(page, totalPages))
 const slice = list.slice((safePage - 1) * ACH_PER_PAGE, safePage * ACH_PER_PAGE)

 const done = list.filter((entry) => entry.unlocked).length
 const header = tab === "global"
  ? `${EMOJI.globe} **Succes permanents** - ${done}/${data.globals.length} debloques`
  : `${EMOJI.flower} **Succes saisonniers** (${data.seasonEmoji} ${data.seasonName}) - ${done}/${data.seasonal.length} debloques`

 const lines = slice.map((entry) => {
  const icon = entry.unlocked ? EMOJI.check : EMOJI.lock
  if (entry.secret && !entry.unlocked) {
   return `${icon} **Succes secret**\n???`
  }
  const rewardText = entry.reward
   ? ` - ${EMOJI.medal} +${entry.reward.bpXp || 0} XP BP${entry.reward.kamas ? ` - ${EMOJI.money} ${entry.reward.kamas}` : ""}`
   : ""
  return `${icon} **${entry.name}**\n${entry.description || ""}${rewardText}`
 })

 const embed = new EmbedBuilder()
  .setTitle(`${EMOJI.trophy} Codex des succes Battle Pass`)
  .setDescription(`${header}\n${bar(list.length ? done / list.length : 0)} ${done}/${list.length}\n\n${lines.join("\n\n") || "Aucun succes."}`)
  .setFooter({ text: `Page ${safePage}/${totalPages} - Total : ${data.total} succes BP` })
  .setColor(tab === "global" ? "#f39c12" : "#8e44ad")

 const tabRow = new ActionRowBuilder().addComponents(
  new ButtonBuilder()
   .setCustomId("bp_ach_seasonal")
   .setLabel(`Saisonniers (${data.seasonal.filter((entry) => entry.unlocked).length}/${data.seasonal.length})`)
   .setStyle(tab === "seasonal" ? ButtonStyle.Success : ButtonStyle.Secondary),
  new ButtonBuilder()
   .setCustomId("bp_ach_global")
   .setLabel(`Permanents (${data.globals.filter((entry) => entry.unlocked).length}/${data.globals.length})`)
   .setStyle(tab === "global" ? ButtonStyle.Success : ButtonStyle.Secondary)
 )

 const pageRow = new ActionRowBuilder().addComponents(
  new ButtonBuilder().setCustomId("bp_ach_prev").setLabel(EMOJI.prev).setStyle(ButtonStyle.Secondary).setDisabled(safePage <= 1),
  new ButtonBuilder().setCustomId("bp_ach_page").setLabel(`${safePage}/${totalPages}`).setStyle(ButtonStyle.Primary).setDisabled(true),
  new ButtonBuilder().setCustomId("bp_ach_next").setLabel(EMOJI.next).setStyle(ButtonStyle.Secondary).setDisabled(safePage >= totalPages)
 )

 return { embed, rows: [tabRow, pageRow] }
}

/* ================= CLAIM SUMMARY EMBED ================= */

function buildClaimSummaryEmbed(result) {
 const preview = (result.claimedRewards || []).slice(0, 10)
 const lines = preview.map((reward) => {
  const track = reward.track === "premium" ? EMOJI.star : EMOJI.gift
  return `${track} **Niv.${reward.level}** - ${reward.text}`
 })

 if ((result.claimedRewards || []).length > preview.length) {
  lines.push(`... +${result.claimedRewards.length - preview.length} autre(s)`)
 }

 return new EmbedBuilder()
  .setTitle(`${EMOJI.party} Recompenses recuperees`)
  .setDescription(lines.join("\n") || "Aucune recompense.")
  .addFields(
   { name: "Total", value: `${result.total || 0}`, inline: true },
   { name: `${EMOJI.money} Kamas`, value: `+${result.totals?.kamas || 0}`, inline: true },
   { name: `${EMOJI.pack} Packs`, value: `+${result.totals?.packs || 0}`, inline: true }
  )
  .setColor("#2ecc71")
}

/* ================= SEND HELPERS ================= */

async function sendRewards(interaction, userId, page = 1) {
 const response = buildRewardsPage(userId, page)
 return interaction.reply({ embeds: [response.embed], components: [response.row], flags: 64 })
}

async function sendAchievements(interaction, userId, tab = "seasonal", page = 1) {
 const response = buildAchievementsEmbed(userId, tab, page)
 return interaction.reply({ embeds: [response.embed], components: response.rows, flags: 64 })
}

/*
 * sendSeason : wrappé dans try/catch.
 * Sans ça, si getBattlePassOverview() throw (fichier manquant, saison
 * non init...), l'interaction n'est jamais acknowledged → timeout Discord.
 */
async function sendSeason(interaction, userId) {
 try {
  const data = getBattlePassOverview(userId)
  const season = data.seasonTemplate

  const embed = new EmbedBuilder()
   .setTitle(`${season.emoji || EMOJI.sparkle} ${season.name} - Dossier de saison`)
   .setDescription(
    `${season.subtitle || ""}\n\n` +
    `**Bonus actif :** ${season.passiveBonus?.description || "-"}\n` +
    `**Cycle :** Emeraude -> Pourpre -> Turquoise -> Ocre -> Ivoire -> Ebene`
   )
   .addFields(
    { name: "Debut", value: data.season.startDate, inline: true },
    { name: "Fin", value: data.season.endDate, inline: true },
    { name: "Prix Premium", value: `${season.premiumPrice || 8000} kamas`, inline: true }
   )
   .setColor(season.color || "#1B6B3A")

  return interaction.reply({ embeds: [embed], flags: 64 })
 } catch (err) {
  console.error("[battlepass] sendSeason error:", err)
  return interaction.reply({ content: `${EMOJI.cross} Impossible d'afficher les infos de la saison. Réessaie.`, flags: 64 })
 }
}

/*
 * sendDailyQuests : affiche les quêtes journalières du joueur.
 * Nouveau bouton "Quêtes du jour" dans la 2ème ActionRow.
 */
async function sendDailyQuests(interaction, userId) {
 try {
  const embed = buildDailyQuestsEmbed(userId)
  return interaction.reply({ embeds: [embed], flags: 64 })
 } catch (err) {
  console.error("[battlepass] sendDailyQuests error:", err)
  return interaction.reply({ content: `${EMOJI.cross} Impossible d'afficher les quêtes. Réessaie.`, flags: 64 })
 }
}

/* ================= MODULE EXPORT ================= */

module.exports = {
 data: new SlashCommandBuilder()
  .setName("battlepass")
  .setDescription("Voir ta progression Battle Pass")
  .addStringOption((option) =>
   option.setName("action").setDescription("Action rapide").setRequired(false)
    .addChoices(
     { name: "Voir", value: "view" },
     { name: "Claim", value: "claim" },
     { name: "Rewards", value: "rewards" },
     { name: "Buy", value: "buy" },
     { name: "Achievements", value: "achievements" },
     { name: "Season", value: "season" },
     { name: "Quêtes", value: "quests" }
    )
  )
  .addIntegerOption((option) =>
   option.setName("page").setDescription("Page rewards").setRequired(false).setMinValue(1).setMaxValue(10)
  ),

 async execute(interaction) {
  const action = interaction.options.getString("action") || "view"
  const page = interaction.options.getInteger("page") || 1
  const userId = interaction.user.id

  if (action === "claim") {
   const result = await claimAllBattlePassRewards(userId)
   if (!result.ok) return interaction.reply({ content: `${EMOJI.cross} ${result.error}`, flags: 64 })
   return interaction.reply({ embeds: [buildClaimSummaryEmbed(result)], flags: 64 })
  }

  if (action === "buy") {
   const result = await buyPremium(userId)
   if (!result.ok) return interaction.reply({ content: `${EMOJI.cross} ${result.error}`, flags: 64 })
   return interaction.reply({ content: `${EMOJI.check} Pass Premium active. Retroactif distribue.`, flags: 64 })
  }

  if (action === "rewards") return sendRewards(interaction, userId, page)
  if (action === "achievements") return sendAchievements(interaction, userId)
  if (action === "season") return sendSeason(interaction, userId)
  if (action === "quests") return sendDailyQuests(interaction, userId)

  const main = buildMainEmbed(userId)
  /* buildActionRows retourne un tableau de 2 ActionRows */
  return interaction.reply({ embeds: [main.embed], components: buildActionRows(main.data), flags: 64 })
 },

 async button(interaction) {
  const userId = interaction.user.id

  /* ---- CLAIM ---- */
  if (interaction.customId === "bp_claim") {
   const result = await claimAllBattlePassRewards(userId)
   if (!result.ok) return interaction.reply({ content: `${EMOJI.cross} ${result.error}`, flags: 64 })
   const refreshed = buildMainEmbed(userId)
   await interaction.update({ embeds: [refreshed.embed], components: buildActionRows(refreshed.data) })
   return interaction.followUp({ embeds: [buildClaimSummaryEmbed(result)], flags: 64 })
  }

  /* ---- ACHETER PREMIUM ---- */
  if (interaction.customId === "bp_buy") {
   const refreshed = buildMainEmbed(userId)
   const confirmEmbed = new EmbedBuilder(refreshed.embed.data).addFields({
    name: "Confirmation Premium",
    value: `Tu vas depenser **${refreshed.data.seasonTemplate.premiumPrice || 8000} kamas**.\nVeux-tu activer le Pass Premium maintenant ?`
   })
   return interaction.update({ embeds: [confirmEmbed], components: [buildBuyConfirmRow()] })
  }

  if (interaction.customId === "bp_buy_confirm") {
   const result = await buyPremium(userId)
   if (!result.ok) return interaction.reply({ content: `${EMOJI.cross} ${result.error}`, flags: 64 })
   const refreshed = buildMainEmbed(userId)
   await interaction.update({ embeds: [refreshed.embed], components: buildActionRows(refreshed.data) })
   return interaction.followUp({ content: `${EMOJI.check} Pass Premium active. Retroactif : ${result.retroCount} paliers.`, flags: 64 })
  }

  if (interaction.customId === "bp_buy_cancel") {
   const refreshed = buildMainEmbed(userId)
   return interaction.update({ embeds: [refreshed.embed], components: buildActionRows(refreshed.data) })
  }

  /* ---- NAVIGATION ---- */
  if (interaction.customId === "bp_rewards") return sendRewards(interaction, userId, 1)
  if (interaction.customId === "bp_ach") return sendAchievements(interaction, userId)
  if (interaction.customId === "bp_season") return sendSeason(interaction, userId)
  if (interaction.customId === "bp_quests") return sendDailyQuests(interaction, userId)

  /* ---- PAGINATION REWARDS ---- */
  if (interaction.customId === "bp_rewards_next" || interaction.customId === "bp_rewards_prev") {
   let page = getMessagePage(interaction.message)
   if (interaction.customId === "bp_rewards_next") page++
   if (interaction.customId === "bp_rewards_prev") page--
   const response = buildRewardsPage(userId, page)
   return interaction.update({ embeds: [response.embed], components: [response.row] })
  }

  /* ---- PAGINATION ACHIEVEMENTS ---- */
  if (interaction.customId.startsWith("bp_ach_")) {
   let tab = getAchievementsTabFromMessage(interaction.message)
   let page = getMessagePage(interaction.message)

   if (interaction.customId === "bp_ach_global") {
    tab = "global"
    page = 1
   } else if (interaction.customId === "bp_ach_seasonal") {
    tab = "seasonal"
    page = 1
   } else if (interaction.customId === "bp_ach_next") {
    page++
   } else if (interaction.customId === "bp_ach_prev") {
    page--
   }

   const response = buildAchievementsEmbed(userId, tab, page)
   return interaction.update({ embeds: [response.embed], components: response.rows })
  }

  return false
 }
}