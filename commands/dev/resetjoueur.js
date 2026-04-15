const fs = require("fs")
const path = require("path")

const {
 SlashCommandBuilder,
 EmbedBuilder,
 ActionRowBuilder,
 ButtonBuilder,
 ButtonStyle
} = require("discord.js")

const { isDev } = require("../../systems/devSystem")
const { getUser, save } = require("../../systems/userSystem")
const { data, markMarketDirty, USERS_DIR } = require("../../systems/dataManager")
const { dbDeleteUser } = require("../../systems/database")

const {
 getUserGuild,
 kickMember,
 disbandGuild
} = require("../../systems/guildSystem")

function resetBattlePassProgress(userId) {
 try {
  const { devResetProgress } = require("../../systems/battlePassService")
  devResetProgress(userId)
 } catch (_) {
  // Battle pass non disponible, non bloquant.
 }
}

function removeUserMarketListings(userId) {
 if (!Array.isArray(data.market) || data.market.length === 0) return 0
 const before = data.market.length
 data.market = data.market.filter((listing) => String(listing.seller) !== String(userId))
 return before - data.market.length
}

function removeFromGuild(userId) {
 try {
  const guild = getUserGuild(userId)
  if (!guild) return null

  if (guild.leaderId === userId) {
   disbandGuild(guild.id, userId)
   return `Guilde **${guild.name}** dissoute (meneur reset)`
  }

  kickMember(guild.id, guild.leaderId, userId)
  return `Retire de la guilde **${guild.name}**`
 } catch (err) {
  console.error("[resetjoueur] Erreur guild cleanup:", err)
  return null
 }
}

function resetUserData(userId) {
 const guildMsg = removeFromGuild(userId)

 const userFile = path.join(USERS_DIR, `${userId}.json`)
 if (fs.existsSync(userFile)) fs.unlinkSync(userFile)

 try {
  dbDeleteUser(userId)
 } catch (err) {
  console.error("[resetjoueur] Erreur delete SQLite:", err)
 }

 delete data.users[userId]

 const marketRemoved = removeUserMarketListings(userId)
 if (marketRemoved > 0) markMarketDirty()
 resetBattlePassProgress(userId)

 // Persiste market + donnees statiques
 save()

 return { guildMsg, marketRemoved }
}

module.exports = {
 data: new SlashCommandBuilder()
  .setName("resetjoueur")
  .setDescription("Reset complet du profil d'un joueur (irreversible).")
  .addUserOption((o) =>
   o.setName("joueur")
    .setDescription("Joueur a reset")
    .setRequired(true)
  ),

 async execute(interaction) {
  if (!isDev(interaction.user.id)) {
   return interaction.reply({ content: "Commande dev.", ephemeral: true })
  }

  const target = interaction.options.getUser("joueur")
  const user = getUser(target.id)
  const totalCards = Object.values(user.cards || {}).reduce((a, b) => a + b, 0)
  const guildInfo = getUserGuild(target.id)

  const confirmEmbed = new EmbedBuilder()
   .setTitle("Confirmation - Reset joueur")
   .setColor("#e74c3c")
   .setDescription(
    `Tu vas effacer completement le profil de **${target.username}**.\n\n` +
    `Cette action est irreversible.`
   )
   .addFields(
    { name: "Joueur", value: `${target.username} (\`${target.id}\`)`, inline: false },
    { name: "Kamas", value: `${(user.kamas || 0).toLocaleString("fr-FR")}`, inline: true },
    { name: "Packs", value: `${user.packs || 0}`, inline: true },
    { name: "Cartes", value: `${totalCards}`, inline: true },
    { name: "Niveau", value: `${user.progression?.level || 1}`, inline: true },
    { name: "Guilde", value: guildInfo ? `${guildInfo.emoji} ${guildInfo.name}` : "Aucune", inline: true },
    { name: "Achievements", value: `${(user.achievements || []).length}`, inline: true }
   )
   .setFooter({ text: "Confirmer pour reset, Annuler pour stopper." })

  const row = new ActionRowBuilder().addComponents(
   new ButtonBuilder()
    .setCustomId("resetjoueur_confirm")
    .setLabel("Confirmer le reset")
    .setStyle(ButtonStyle.Danger),
   new ButtonBuilder()
    .setCustomId("resetjoueur_cancel")
    .setLabel("Annuler")
    .setStyle(ButtonStyle.Secondary)
  )

  await interaction.reply({ embeds: [confirmEmbed], components: [row], ephemeral: true })
  const msg = await interaction.fetchReply()
  const collector = msg.createMessageComponentCollector({ time: 30000 })

  collector.on("collect", async (i) => {
   if (i.user.id !== interaction.user.id) {
    return i.reply({ content: "Pas ta commande.", ephemeral: true })
   }

   collector.stop()

   if (i.customId === "resetjoueur_cancel") {
    return i.update({
     embeds: [
      new EmbedBuilder()
       .setTitle("Reset annule")
       .setColor("#95a5a6")
       .setDescription(`Le profil de **${target.username}** n'a pas ete modifie.`)
     ],
     components: []
    })
   }

   if (i.customId === "resetjoueur_confirm") {
    const { guildMsg, marketRemoved } = resetUserData(target.id)

    const lines = [
     "Profil supprime du disque",
     "Cache memoire vide",
     marketRemoved > 0
      ? `${marketRemoved} annonce(s) market retiree(s)`
      : "Aucune annonce market a retirer",
     "Battle Pass reinitialise",
     guildMsg ? guildMsg : "Pas de guilde a nettoyer"
    ]

    const doneEmbed = new EmbedBuilder()
     .setTitle("Reset effectue")
     .setColor("#2ecc71")
     .setDescription(
      `Le profil de **${target.username}** a ete efface.\n\n` +
      lines.map((l) => `- ${l}`).join("\n") +
      `\n\n${target.username} repartira de zero a sa prochaine commande.`
     )

    console.log(`[resetjoueur] Reset complet: ${target.username} (${target.id}) par ${interaction.user.username}`)
    return i.update({ embeds: [doneEmbed], components: [] })
   }
  })

  collector.on("end", (_, reason) => {
   if (reason === "time") {
    interaction.editReply({
     embeds: [
      new EmbedBuilder()
       .setTitle("Delai depasse")
       .setColor("#95a5a6")
       .setDescription("Le reset a ete annule (30s sans reponse).")
     ],
     components: []
    }).catch(() => {})
   }
  })
 }
}
