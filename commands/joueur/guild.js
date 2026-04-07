const {
 SlashCommandBuilder,
 EmbedBuilder,
 ActionRowBuilder,
 ButtonBuilder,
 ButtonStyle,
 ModalBuilder,
 TextInputBuilder,
 TextInputStyle
} = require("discord.js")

const { getUser, save } = require("../../systems/userSystem")
const {
 getUserGuild,
 getGuild,
 createGuild,
 leaveGuild,
 getAllGuilds,
 getGuildRank,
 xpRequired,
 MAX_MEMBERS,
 CREATE_COST
} = require("../../systems/guildSystem")
const { getUserGuildBonuses, formatBonuses, formatNextUnlocks } = require("../../systems/guildBonuses")
const {
 getGuildQuestProgress,
 claimGuildQuests,
 getNextGuildQuestReset
} = require("../../systems/guildQuestSystem")
const { achievementCheck } = require("../../systems/achievementCheck")
const { notifyAchievements } = require("../../systems/achievementNotifier")

/* ================= HELPERS ================= */

function progressBar(current, max, size = 12){
 if(max <= 0) return "🟩".repeat(size)
 const pct = Math.min(1, current / max)
 const filled = Math.round(size * pct)
 return "🟩".repeat(filled) + "⬛".repeat(size - filled)
}

/* ================= COMMAND ================= */

module.exports = {

 data: new SlashCommandBuilder()
  .setName("guild")
  .setDescription("Voir ta guilde ou en créer une"),

 async execute(interaction){

  await interaction.deferReply()

  const user  = getUser(interaction.user.id)
  const guild = getUserGuild(interaction.user.id)

  if(!user.stats) user.stats = {}

  let questType = "daily" /* onglet quêtes actif */

  /* ================= BUILD FUNCTIONS ================= */

  function buildNoGuild(){

   const allGuilds = getAllGuilds()
    .sort((a, b) => b.level - a.level)
    .slice(0, 10)

   const guildList = allGuilds.length > 0
    ? allGuilds.map((g, i) =>
       `${i + 1}. ${g.emoji} **${g.name}** — Niv. ${g.level} (${g.memberIds.length}/${MAX_MEMBERS})`
      ).join("\n")
    : "Aucune guilde existante."

   const embed = new EmbedBuilder()
    .setTitle("🏰 Guildes")
    .setColor("#3498db")
    .setDescription(
`Tu n'es dans aucune guilde.

**Créer une guilde** coûte **${CREATE_COST} kamas**.
Tu recevras un emoji aléatoire et deviendras meneur.

**Guildes existantes :**
${guildList}`
    )

   const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
     .setCustomId("guild_create")
     .setLabel("Créer une guilde")
     .setEmoji("🏗️")
     .setStyle(ButtonStyle.Success)
   )

   return { embeds:[embed], components:[row] }
  }

  function buildMain(){

   const g = getGuild(user.guildId)
   if(!g) return buildNoGuild()

   const rank      = getGuildRank(g.id, interaction.user.id)
   const rankLabel = rank === "meneur" ? "👑 Meneur" : rank === "officier" ? "⚔️ Officier" : "👤 Membre"

   const xpReq = xpRequired(g.level)
   const bar   = progressBar(g.xp, xpReq, 14)

   /* FIX: getUserGuildBonuses(userId) au lieu de getGuildBonuses(level) qui n'existe pas */
   const bonuses          = getUserGuildBonuses(interaction.user.id)
   const activeBonusCount = Object.values(bonuses).filter(v => v > 0).length

   const embed = new EmbedBuilder()
    .setTitle(`${g.emoji} ${g.name}`)
    .setColor("#9b59b6")
    .setDescription(
`**Niveau ${g.level}** — ${g.xp}/${xpReq} XP
${bar}

🆔 ID : \`${g.id}\`
👥 Membres : **${g.memberIds.length}/${MAX_MEMBERS}**
🎖️ Ton rôle : ${rankLabel}
🎯 Bonus actifs : **${activeBonusCount}**
📋 Quêtes complétées : **${g.stats.questsCompleted || 0}**
📅 Créée le ${new Date(g.createdAt).toLocaleDateString("fr-FR")}`
    )

   const row1 = new ActionRowBuilder().addComponents(

    new ButtonBuilder()
     .setCustomId("guild_members")
     .setLabel("Membres")
     .setEmoji("👥")
     .setStyle(ButtonStyle.Secondary),

    new ButtonBuilder()
     .setCustomId("guild_quests")
     .setLabel("Quêtes")
     .setEmoji("📋")
     .setStyle(ButtonStyle.Primary),

    new ButtonBuilder()
     .setCustomId("guild_bonuses")
     .setLabel("Bonus")
     .setEmoji("🎯")
     .setStyle(ButtonStyle.Secondary),

    new ButtonBuilder()
     .setCustomId("guild_leave")
     .setLabel("Quitter")
     .setEmoji("🚪")
     .setStyle(ButtonStyle.Danger)
   )

   return { embeds:[embed], components:[row1] }
  }

  function buildMembers(){

   const g = getGuild(user.guildId)
   if(!g) return buildMain()

   const lines = g.memberIds.map(id => {
    let role = ""
    if(id === g.leaderId) role = " 👑"
    else if(g.officerIds.includes(id)) role = " ⚔️"
    return `<@${id}>${role}`
   })

   const embed = new EmbedBuilder()
    .setTitle(`👥 Membres — ${g.emoji} ${g.name}`)
    .setColor("#3498db")
    .setDescription(
`${lines.join("\n")}

👑 = Meneur • ⚔️ = Officier
**${g.memberIds.length}/${MAX_MEMBERS}** membres`
    )

   const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
     .setCustomId("guild_back")
     .setLabel("Retour")
     .setStyle(ButtonStyle.Secondary)
   )

   return { embeds:[embed], components:[row] }
  }

  function buildQuests(){

   const g = getGuild(user.guildId)
   if(!g) return buildMain()

   const progress = getGuildQuestProgress(g.id, questType)

   const lines = progress.map(q => {
    const status = q.claimed ? "✅" : q.done ? "🎁" : "⬜"
    const bar    = progressBar(q.current, q.goal, 8)
    return `${status} ${q.emoji} **${q.name}** — ${q.current}/${q.goal}\n${bar} *${q.desc}* → ⭐ ${q.xp} XP`
   })

   const completed = progress.filter(q => q.done).length
   const allDone   = completed >= progress.length
   const resetIn   = getNextGuildQuestReset(questType)

   const typeLabel   = questType === "daily" ? "☀️ Journalières" : "📅 Hebdomadaires"
   const bonusAmount = questType === "daily" ? 200 : 500

   const embed = new EmbedBuilder()
    .setTitle(`📋 Quêtes de guilde — ${g.emoji} ${g.name}`)
    .setColor(allDone ? "#f1c40f" : "#e67e22")
    .setDescription(
`**${typeLabel}** • Reset dans **${resetIn}**

${progressBar(completed, progress.length, 12)} **${completed}/${progress.length}**
${allDone ? `\n🌟 **Bonus parfait : +${bonusAmount} XP !**` : ""}

${lines.join("\n\n")}`
    )

   const hasClaimable = progress.some(q => q.done && !q.claimed)
   const rank         = getGuildRank(g.id, interaction.user.id)
   const canClaim     = rank === "meneur" || rank === "officier"

   /* Row 1 : onglets */
   const tabRow = new ActionRowBuilder().addComponents(

    new ButtonBuilder()
     .setCustomId("guild_quests_daily")
     .setLabel("☀️ Journalières")
     .setStyle(questType === "daily" ? ButtonStyle.Success : ButtonStyle.Secondary),

    new ButtonBuilder()
     .setCustomId("guild_quests_weekly")
     .setLabel("📅 Hebdomadaires")
     .setStyle(questType === "weekly" ? ButtonStyle.Success : ButtonStyle.Secondary)
   )

   /* Row 2 : claim + retour */
   const actionRow = new ActionRowBuilder().addComponents(

    new ButtonBuilder()
     .setCustomId("guild_claim_quests")
     .setLabel("Récupérer")
     .setEmoji("🎁")
     .setStyle(ButtonStyle.Success)
     .setDisabled(!hasClaimable || !canClaim),

    new ButtonBuilder()
     .setCustomId("guild_back")
     .setLabel("Retour")
     .setStyle(ButtonStyle.Secondary)
   )

   return { embeds:[embed], components:[tabRow, actionRow] }
  }

  function buildBonuses(){

   const g = getGuild(user.guildId)
   if(!g) return buildMain()

   const bonusText = formatBonuses(g.level)
   const nextText  = formatNextUnlocks(g.level)

   const embed = new EmbedBuilder()
    .setTitle(`🎯 Bonus de guilde — Niv. ${g.level}`)
    .setColor("#2ecc71")
    .setDescription(
`**Bonus actifs :**
${bonusText}

**Prochains bonus :**
${nextText}`
    )

   const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
     .setCustomId("guild_back")
     .setLabel("Retour")
     .setStyle(ButtonStyle.Secondary)
   )

   return { embeds:[embed], components:[row] }
  }

  /* ================= INITIAL DISPLAY ================= */

  const initial = guild ? buildMain() : buildNoGuild()

  await interaction.editReply(initial)

  const msg = await interaction.fetchReply()

  /* ================= COLLECTOR ================= */

  const collector = msg.createMessageComponentCollector({ time:180000 })

  collector.on("collect", async i => {

   if(i.user.id !== interaction.user.id)
    return i.reply({ content:"Pas ta guilde.", flags:64 })

   /* ---- CREATE (modal) ---- */

   if(i.customId === "guild_create"){

    const modal = new ModalBuilder()
     .setCustomId("guild_create_modal")
     .setTitle("Créer une guilde")

    const nameInput = new TextInputBuilder()
     .setCustomId("guild_name_input")
     .setLabel("Nom de la guilde (3-24 caractères)")
     .setStyle(TextInputStyle.Short)
     .setMinLength(3)
     .setMaxLength(24)
     .setRequired(true)

    modal.addComponents(new ActionRowBuilder().addComponents(nameInput))

    await i.showModal(modal)

    try{

     const modalResponse = await i.awaitModalSubmit({ time:60000 })

     const name   = modalResponse.fields.getTextInputValue("guild_name_input").trim()
     const result = createGuild(interaction.user.id, name)

     if(result.error)
      return modalResponse.reply({ content:`❌ ${result.error}`, flags:64 })

     const g = result.guild

     /* Mettre à jour le user local pour que buildMain fonctionne */
     user.guildId = g.id

     const freshUser = getUser(interaction.user.id)
     const unlocked  = achievementCheck(freshUser, "guild")

     const successEmbed = new EmbedBuilder()
      .setTitle("🏰 Guilde créée !")
      .setColor("#2ecc71")
      .setDescription(
`${g.emoji} **${g.name}**

Tu es le meneur ! Utilise **/guildmanage** pour inviter des joueurs.
Coût : **${CREATE_COST} kamas**`
      )

     await modalResponse.reply({ embeds:[successEmbed] })

     const built = buildMain()
     await interaction.editReply(built)

     if(unlocked.length)
      await notifyAchievements(interaction, unlocked)

    }catch(err){
     /* Modal timeout - ignore */
    }

    return
   }

   /* ---- NAVIGATION ---- */

   if(i.customId === "guild_back"){
    return i.update(buildMain())
   }

   if(i.customId === "guild_members"){
    return i.update(buildMembers())
   }

   if(i.customId === "guild_quests"){
    return i.update(buildQuests())
   }

   if(i.customId === "guild_bonuses"){
    return i.update(buildBonuses())
   }

   /* ---- ONGLETS QUÊTES ---- */

   if(i.customId === "guild_quests_daily"){
    questType = "daily"
    return i.update(buildQuests())
   }

   if(i.customId === "guild_quests_weekly"){
    questType = "weekly"
    return i.update(buildQuests())
   }

   /* ---- CLAIM QUESTS ---- */

   if(i.customId === "guild_claim_quests"){

    const freshUser = getUser(interaction.user.id)
    const g         = getUserGuild(interaction.user.id)

    if(!g) return i.update(buildNoGuild())

    const result = claimGuildQuests(g.id, interaction.user.id, questType)

    if(result.error)
     return i.reply({ content:`❌ ${result.error}`, flags:64 })

    /* Track stats joueur */
    freshUser.stats.guildQuestsClaimed = (freshUser.stats.guildQuestsClaimed || 0) + result.claimed
    freshUser.stats.guildXpContributed = (freshUser.stats.guildXpContributed || 0) + result.totalXP

    if(result.isPerfect)
     freshUser.stats.guildPerfectWeeks = (freshUser.stats.guildPerfectWeeks || 0) + 1

    freshUser.stats.guildMaxLevel = Math.max(
     freshUser.stats.guildMaxLevel || 0,
     g.level
    )

    if((freshUser.stats.guildQuestsClaimed || 0) <= result.claimed)
     freshUser.stats.guildFirstClaim = 1

    save(interaction.user.id)

    const unlocked = achievementCheck(freshUser, "guild")

    if(result.levelResult?.leveled){
     for(const memberId of g.memberIds){
      const member  = getUser(memberId)
      member.stats  = member.stats || {}
      member.stats.guildMaxLevel = Math.max(member.stats.guildMaxLevel || 0, g.level)
      save(memberId)
     }
    }

    const typeLabel = questType === "daily" ? "journalières" : "hebdomadaires"
    let claimText = `✅ **${result.claimed}** quête(s) ${typeLabel} récupérée(s) → **+${result.totalXP} XP** de guilde`

    if(result.bonusXP > 0)
     claimText += `\n🌟 Bonus parfait : **+${result.bonusXP} XP**`

    if(result.levelResult?.leveled)
     claimText += `\n\n🎉 **La guilde passe niveau ${result.levelResult.newLevel} !**`

    /* FIX: répondre en éphémère PUIS rafraîchir le panel quêtes */
    await i.reply({ content:claimText, flags:64 })
    await interaction.editReply(buildQuests())

    if(unlocked.length)
     await notifyAchievements(interaction, unlocked)

    return
   }

   /* ---- LEAVE ---- */

   if(i.customId === "guild_leave"){

    const result = leaveGuild(interaction.user.id)

    if(result.error)
     return i.reply({ content:`❌ ${result.error}`, flags:64 })

    const embed = new EmbedBuilder()
     .setTitle("🚪 Tu as quitté la guilde")
     .setColor("#e74c3c")

    return i.update({ embeds:[embed], components:[] })
   }

  })

 },

 /* ================= BUTTON HANDLER (pour index.js) ================= */

 async button(_interaction){
  /* Les boutons guild_ sont gérés par le collector interne */
 }

}
