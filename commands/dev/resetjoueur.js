const fs = require("fs")
const path = require("path")

const {
 SlashCommandBuilder,
 EmbedBuilder,
 ActionRowBuilder,
 ButtonBuilder,
 ButtonStyle
} = require("discord.js")

const { isDev }                   = require("../../systems/devSystem")
const { getUser, save }           = require("../../systems/userSystem")
const { data, USERS_DIR, saveUser } = require("../../systems/dataManager")

const {
 getUserGuild,
 leaveGuild,
 kickMember,
 disbandGuild,
 saveGuilds
} = require("../../systems/guildSystem")

/* ---- Battle Pass : reset la progression du joueur ---- */
function resetBattlePassProgress(userId) {
 try {
  const { devResetProgress } = require("../../systems/battlePassService")
  devResetProgress(userId)
 } catch(_) { /* battlepass non dispo, pas bloquant */ }
}

/* ---- Retire le joueur de sa guilde proprement ---- */
function removeFromGuild(userId) {
 try {
  const guild = getUserGuild(userId)
  if (!guild) return null

  /* Si c'est le meneur → dissoudre la guilde */
  if (guild.leaderId === userId) {
   const result = disbandGuild(guild.id, userId)
   return `⚔️ Guilde **${guild.name}** dissoute (il en était le meneur)`
  }

  /* Sinon → kick normal */
  kickMember(guild.id, guild.leaderId, userId)
  return `👋 Retiré de la guilde **${guild.name}**`

 } catch(err) {
  console.error("[resetjoueur] Erreur guild cleanup:", err)
  return null
 }
}

/* ---- Reset complet du fichier user ---- */
function resetUserData(userId) {

 /* 1. Retirer de la guilde AVANT de supprimer le user */
 const guildMsg = removeFromGuild(userId)

 /* 2. Supprimer le fichier sur le disque */
 const userFile = path.join(USERS_DIR, `${userId}.json`)
 if (fs.existsSync(userFile)) {
  fs.unlinkSync(userFile)
 }

 /* 3. Vider le cache mémoire → getUser() recréera un profil vierge */
 delete data.users[userId]

 /* 4. Reset battle pass */
 resetBattlePassProgress(userId)

 return { guildMsg }
}

/* =============================================================== */

module.exports = {

 data: new SlashCommandBuilder()
  .setName("resetjoueur")
  .setDescription("⚠️ Reset COMPLET du profil d'un joueur (repart de zéro)")
  .addUserOption(o =>
   o.setName("joueur")
    .setDescription("Joueur à reset")
    .setRequired(true)
  ),

 async execute(interaction) {

  if (!isDev(interaction.user.id))
   return interaction.reply({ content: "⛔ Commande dev.", ephemeral: true })

  const target = interaction.options.getUser("joueur")
  const user   = getUser(target.id)

  /* ---- Résumé du profil actuel pour la confirmation ---- */
  const totalCards = Object.values(user.cards || {}).reduce((a, b) => a + b, 0)
  const guildInfo  = getUserGuild(target.id)

  const confirmEmbed = new EmbedBuilder()
   .setTitle("⚠️ Confirmation — Reset joueur")
   .setColor("#e74c3c")
   .setDescription(
    `Tu vas **effacer complètement** le profil de **${target.username}**.\n\n` +
    `Cette action est **irréversible**. Le joueur repartira de zéro.`
   )
   .addFields(
    { name: "👤 Joueur",       value: `${target.username} (\`${target.id}\`)`, inline: false },
    { name: "💰 Kamas",        value: `${(user.kamas || 0).toLocaleString("fr-FR")}`,           inline: true },
    { name: "📦 Packs",        value: `${user.packs || 0}`,                                      inline: true },
    { name: "🃏 Cartes",       value: `${totalCards}`,                                            inline: true },
    { name: "⭐ Niveau",       value: `${user.progression?.level || 1}`,                          inline: true },
    { name: "🏰 Guilde",       value: guildInfo ? `${guildInfo.emoji} ${guildInfo.name}` : "Aucune", inline: true },
    { name: "🏆 Achievements", value: `${(user.achievements || []).length}`,                      inline: true }
   )
   .setFooter({ text: "Clique sur Confirmer pour effacer, ou Annuler pour abandonner." })

  const row = new ActionRowBuilder().addComponents(
   new ButtonBuilder()
    .setCustomId("resetjoueur_confirm")
    .setLabel("⚠️ Confirmer le reset")
    .setStyle(ButtonStyle.Danger),
   new ButtonBuilder()
    .setCustomId("resetjoueur_cancel")
    .setLabel("Annuler")
    .setStyle(ButtonStyle.Secondary)
  )

  await interaction.reply({ embeds: [confirmEmbed], components: [row], ephemeral: true })

  const msg       = await interaction.fetchReply()
  const collector = msg.createMessageComponentCollector({ time: 30000 })

  collector.on("collect", async i => {

   if (i.user.id !== interaction.user.id)
    return i.reply({ content: "Pas ta commande.", ephemeral: true })

   collector.stop()

   /* ---- ANNULATION ---- */
   if (i.customId === "resetjoueur_cancel") {
    return i.update({
     embeds: [
      new EmbedBuilder()
       .setTitle("❌ Reset annulé")
       .setColor("#95a5a6")
       .setDescription(`Le profil de **${target.username}** n'a pas été modifié.`)
     ],
     components: []
    })
   }

   /* ---- CONFIRMATION ---- */
   if (i.customId === "resetjoueur_confirm") {

    const { guildMsg } = resetUserData(target.id)

    const lines = [
     "✅ Fichier user supprimé",
     "✅ Cache mémoire vidé",
     "✅ Battle Pass réinitialisé",
     guildMsg ? `✅ ${guildMsg}` : "ℹ️ Pas de guilde à nettoyer"
    ]

    const doneEmbed = new EmbedBuilder()
     .setTitle("🧹 Reset effectué")
     .setColor("#2ecc71")
     .setDescription(
      `Le profil de **${target.username}** a été **effacé**.\n\n` +
      lines.join("\n") +
      `\n\n**${target.username}** repartira de zéro à sa prochaine commande.`
     )

    console.log(`[resetjoueur] Reset complet : ${target.username} (${target.id}) par ${interaction.user.username}`)

    return i.update({ embeds: [doneEmbed], components: [] })
   }

  })

  collector.on("end", (_, reason) => {
   if (reason === "time") {
    interaction.editReply({
     embeds: [
      new EmbedBuilder()
       .setTitle("⏱️ Délai dépassé")
       .setColor("#95a5a6")
       .setDescription("Le reset a été annulé (30s sans réponse).")
     ],
     components: []
    }).catch(() => {})
   }
  })

 }

}