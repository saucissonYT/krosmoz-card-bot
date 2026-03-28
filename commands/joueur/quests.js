const {
 SlashCommandBuilder,
 EmbedBuilder,
 ActionRowBuilder,
 ButtonBuilder,
 ButtonStyle
} = require("discord.js")

const { getUser, save }         = require("../../systems/userSystem")
const { addBattlePassXP }       = require("../../systems/battlePassService")
const {
 getAllProgress,
 claimAll,
 getNextDailyReset,
 getNextWeeklyReset,
 DAILY_BONUS,
 WEEKLY_BONUS
} = require("../../systems/questSystem")

/* ================= HELPERS ================= */

function progressBar(current, goal, size=10){
 const pct = Math.min(1, current / goal)
 const filled = Math.round(size * pct)
 return "🟩".repeat(filled) + "⬛".repeat(size - filled)
}

function rewardText(reward){
 const parts = []
 if(reward.kamas) parts.push(`💰${reward.kamas}`)
 if(reward.xp)    parts.push(`⭐${reward.xp}`)
 if(reward.packs) parts.push(`📦${reward.packs}`)
 return parts.join(" ")
}

function bonusText(bonus){
 const parts = []
 if(bonus.kamas) parts.push(`💰 ${bonus.kamas} kamas`)
 if(bonus.xp)    parts.push(`⭐ ${bonus.xp} XP`)
 if(bonus.packs) parts.push(`📦 ${bonus.packs} packs`)
 return parts.join(" + ")
}

/* ================= BUILD EMBEDS ================= */

function buildDailyEmbed(user, interaction){

 const progress  = getAllProgress(user, "daily")
 const completed = progress.filter(q => q.done).length
 const claimed   = progress.filter(q => q.claimed).length
 const total     = progress.length
 const allClaimed = claimed >= total

 const lines = progress.map(q => {
  const status  = q.claimed ? "✅" : q.done ? "🎁" : "⬜"
  const bar     = progressBar(q.current, q.goal, 8)
  const pctText = q.done ? "**OK**" : `${q.current}/${q.goal}`
  return `${status} ${q.emoji} **${q.name}** — ${pctText}\n${bar} *${q.desc}* → ${rewardText(q.reward)}`
 })

 const header = progressBar(completed, total, 12)

 let bonusLine = ""
 if(allClaimed){
  bonusLine = `\n🎉 **BONUS JOURNALIER RÉCUPÉRÉ !** ${bonusText(DAILY_BONUS)}`
 } else if(completed >= total){
  bonusLine = `\n🎁 **Quêtes terminées !** Récupère pour le bonus : ${bonusText(DAILY_BONUS)}`
 }

 return new EmbedBuilder()
  .setTitle("☀️ Quêtes Journalières")
  .setColor(allClaimed ? "#f1c40f" : "#3498db")
  .setDescription(
`Reset dans **${getNextDailyReset()}**

${header} **${completed}/${total}** terminées
${bonusLine}

${lines.join("\n\n")}`
  )
  .setFooter({ text:`${interaction.user.username} • Nouvelles quêtes chaque jour à 1h` })
}

function buildWeeklyEmbed(user, interaction){

 const progress  = getAllProgress(user, "weekly")
 const completed = progress.filter(q => q.done).length
 const claimed   = progress.filter(q => q.claimed).length
 const total     = progress.length
 const allClaimed = claimed >= total

 const lines = progress.map(q => {
  const status  = q.claimed ? "✅" : q.done ? "🎁" : "⬜"
  const bar     = progressBar(q.current, q.goal, 8)
  const pctText = q.done ? "**OK**" : `${q.current}/${q.goal}`
  return `${status} ${q.emoji} **${q.name}** — ${pctText}\n${bar} *${q.desc}* → ${rewardText(q.reward)}`
 })

 const header = progressBar(completed, total, 12)

 let bonusLine = ""
 if(allClaimed){
  bonusLine = `\n🏆 **BONUS HEBDO RÉCUPÉRÉ !** ${bonusText(WEEKLY_BONUS)}`
 } else if(completed >= total){
  bonusLine = `\n🎁 **Toutes terminées !** Récupère pour le bonus : ${bonusText(WEEKLY_BONUS)}`
 }

 return new EmbedBuilder()
  .setTitle("📅 Quêtes Hebdomadaires")
  .setColor(allClaimed ? "#f1c40f" : "#9b59b6")
  .setDescription(
`Reset dans **${getNextWeeklyReset()}**

${header} **${completed}/${total}** terminées
${bonusLine}

${lines.join("\n\n")}`
  )
  .setFooter({ text:`${interaction.user.username} • Nouvelles quêtes chaque lundi à 1h` })
}

/* ================= BUTTONS ================= */

function buildButtons(user, tab){

 const progress     = getAllProgress(user, tab)
 const hasClaimable = progress.some(q => q.done && !q.claimed)

 const row1 = new ActionRowBuilder().addComponents(

  new ButtonBuilder()
   .setCustomId("quest_tab_daily")
   .setLabel("Journalières")
   .setEmoji("☀️")
   .setStyle(tab === "daily" ? ButtonStyle.Success : ButtonStyle.Secondary),

  new ButtonBuilder()
   .setCustomId("quest_tab_weekly")
   .setLabel("Hebdomadaires")
   .setEmoji("📅")
   .setStyle(tab === "weekly" ? ButtonStyle.Success : ButtonStyle.Secondary)

 )

 const row2 = new ActionRowBuilder().addComponents(

  new ButtonBuilder()
   .setCustomId(`quest_claim_${tab}`)
   .setLabel("Récupérer tout")
   .setEmoji("🎁")
   .setStyle(ButtonStyle.Primary)
   .setDisabled(!hasClaimable),

  new ButtonBuilder()
   .setCustomId(`quest_refresh_${tab}`)
   .setLabel("Rafraîchir")
   .setEmoji("🔄")
   .setStyle(ButtonStyle.Secondary)

 )

 return [row1, row2]
}

/* ================= COMMAND ================= */

module.exports = {

 data: new SlashCommandBuilder()
  .setName("quests")
  .setDescription("Voir tes quêtes journalières et hebdomadaires"),

 async execute(interaction){

  const user = getUser(interaction.user.id)

  let tab = "daily"

  const embed      = buildDailyEmbed(user, interaction)
  const components = buildButtons(user, tab)

  const msg = await interaction.reply({
   embeds:[embed],
   components,
   fetchReply:true
  })

  const collector = msg.createMessageComponentCollector({ time:180000 })

  collector.on("collect", async i => {

   if(i.user.id !== interaction.user.id)
    return i.reply({ content:"Pas tes quêtes.", flags:64 })

   /* ---- TAB SWITCH ---- */

   if(i.customId === "quest_tab_daily" || i.customId === "quest_tab_weekly"){

    tab = i.customId === "quest_tab_daily" ? "daily" : "weekly"
    const freshUser = getUser(interaction.user.id)
    const newEmbed  = tab === "daily"
     ? buildDailyEmbed(freshUser, interaction)
     : buildWeeklyEmbed(freshUser, interaction)

    await i.update({
     embeds:[newEmbed],
     components:buildButtons(freshUser, tab)
    })
    return
   }

   /* ---- CLAIM ---- */

   if(i.customId.startsWith("quest_claim_")){

    const claimType = i.customId.replace("quest_claim_", "")
    const freshUser = getUser(interaction.user.id)

    const result = claimAll(freshUser, claimType)

    save(interaction.user.id)

    if(result.claimedCount === 0){
     await i.reply({ content:"❌ Aucune quête à récupérer.", flags:64 })
     return
    }

    /* ================================================================
       XP BATTLE PASS — Quêtes réclamées
       
       On donne de l'XP BP en deux temps :
       1. Par quête réclamée  (quest_daily_claim / quest_weekly_claim)
       2. Bonus si toutes terminées (quest_daily_bonus / quest_weekly_bonus)
       
       Les valeurs viennent de config/battlepassXP.json pour rester
       facilement ajustables sans toucher au code.
    ================================================================ */

    const bpSource      = claimType === "daily" ? "quest_daily_claim"  : "quest_weekly_claim"
    const bpBonusSource = claimType === "daily" ? "quest_daily_bonus"  : "quest_weekly_bonus"

    let totalBpXp = 0

    /* XP par quête réclamée */
    for(let n = 0; n < result.claimedCount; n++){
     const bpResult = await addBattlePassXP(interaction.user.id, bpSource)
     totalBpXp += bpResult.addedXP || 0
    }

    /* Bonus de complétion totale */
    if(result.completionBonus){
     const bpBonus = await addBattlePassXP(interaction.user.id, bpBonusSource)
     totalBpXp += bpBonus.addedXP || 0
    }

    /* ---- Message de retour ---- */

    let text = `🎁 **${result.claimedCount} quête(s) récupérée(s) !**\n`
    if(result.totalKamas > 0)  text += `💰 +${result.totalKamas} kamas\n`
    if(result.totalXp > 0)     text += `⭐ +${result.totalXp} XP joueur\n`
    if(result.totalPacks > 0)  text += `📦 +${result.totalPacks} pack(s)\n`
    if(totalBpXp > 0)          text += `✨ +${totalBpXp} XP Battle Pass\n`

    if(result.completionBonus){
     const bonusName = claimType === "daily" ? "JOURNALIER" : "HEBDOMADAIRE"
     text += `\n🏆 **BONUS ${bonusName} !** ${bonusText(claimType === "daily" ? DAILY_BONUS : WEEKLY_BONUS)}`
    }

    await i.reply({ content:text, flags:64 })

    /* Refresh embed */
    const newEmbed = claimType === "daily"
     ? buildDailyEmbed(freshUser, interaction)
     : buildWeeklyEmbed(freshUser, interaction)

    await interaction.editReply({
     embeds:[newEmbed],
     components:buildButtons(freshUser, tab)
    })
    return
   }

   /* ---- REFRESH ---- */

   if(i.customId.startsWith("quest_refresh_")){

    const freshUser = getUser(interaction.user.id)
    const newEmbed  = tab === "daily"
     ? buildDailyEmbed(freshUser, interaction)
     : buildWeeklyEmbed(freshUser, interaction)

    await i.update({
     embeds:[newEmbed],
     components:buildButtons(freshUser, tab)
    })
    return
   }

  })

  collector.on("end", () => {
   msg.edit({ components:[] }).catch(() => {})
  })

 }

}