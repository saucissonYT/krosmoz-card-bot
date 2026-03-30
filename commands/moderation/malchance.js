const { SlashCommandBuilder, EmbedBuilder } = require("discord.js")
const { setNoLuck, hasNoLuck, getAllNoLuck } = require("../../systems/moderationSystem")

/* ================================================================
   /malchance — Activer / désactiver la malchance d'un joueur
   Effet : le joueur ne tire QUE des cartes C (blanches) dans ses packs.
   Accès : modérateurs (rôle géré dans slashRoutes.js)
================================================================ */

module.exports = {

  data: new SlashCommandBuilder()
    .setName("malchance")
    .setDescription("Retirer la chance d'un joueur (il ne tire que des C dans ses packs)")
    .addSubcommand(sub =>
      sub
        .setName("on")
        .setDescription("Activer la malchance d'un joueur")
        .addUserOption(opt =>
          opt.setName("joueur").setDescription("Joueur ciblé").setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName("off")
        .setDescription("Désactiver la malchance d'un joueur")
        .addUserOption(opt =>
          opt.setName("joueur").setDescription("Joueur ciblé").setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName("check")
        .setDescription("Vérifier si un joueur est sous malchance")
        .addUserOption(opt =>
          opt.setName("joueur").setDescription("Joueur à vérifier").setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName("list")
        .setDescription("Lister tous les joueurs sous malchance")
    ),

  async execute(interaction) {

    const sub    = interaction.options.getSubcommand()
    const target = interaction.options.getUser("joueur")

    /* ======================== ON ======================== */

    if (sub === "on") {

      if (hasNoLuck(target.id)) {
        return interaction.reply({
          content: `⚠️ **${target.username}** est déjà sous malchance.`,
          ephemeral: true
        })
      }

      setNoLuck(target.id, true, interaction.user.id)

      const embed = new EmbedBuilder()
        .setTitle("⚫ Malchance activée")
        .setColor(0x2C3E50)
        .setDescription(
          `La chance de **${target.username}** (<@${target.id}>) a été retirée.\n\n` +
          `⚪ Il ne tirera **que des cartes C** dans tous ses packs jusqu'à désactivation.`
        )
        .addFields(
          { name: "Par",     value: `<@${interaction.user.id}>`, inline: true },
          { name: "Cible",   value: `<@${target.id}>`,           inline: true }
        )
        .setTimestamp()
        .setFooter({ text: "Utilisez /malchance off pour lever l'effet." })

      return interaction.reply({ embeds: [embed], ephemeral: true })
    }

    /* ======================== OFF ======================== */

    if (sub === "off") {

      if (!hasNoLuck(target.id)) {
        return interaction.reply({
          content: `ℹ️ **${target.username}** n'est pas sous malchance.`,
          ephemeral: true
        })
      }

      setNoLuck(target.id, false, interaction.user.id)

      const embed = new EmbedBuilder()
        .setTitle("✨ Malchance levée")
        .setColor(0xF1C40F)
        .setDescription(
          `La chance de **${target.username}** (<@${target.id}>) a été restaurée.\n\n` +
          `Il peut à nouveau tirer des cartes normalement.`
        )
        .addFields(
          { name: "Par",   value: `<@${interaction.user.id}>`, inline: true },
          { name: "Cible", value: `<@${target.id}>`,           inline: true }
        )
        .setTimestamp()

      return interaction.reply({ embeds: [embed], ephemeral: true })
    }

    /* ======================== CHECK ======================== */

    if (sub === "check") {

      const active = hasNoLuck(target.id)

      const embed = new EmbedBuilder()
        .setTitle("🔍 Statut malchance")
        .setColor(active ? 0x2C3E50 : 0x2ECC71)
        .setDescription(
          active
            ? `⚫ **${target.username}** est actuellement sous **malchance**.\nIl ne tire que des cartes C dans ses packs.`
            : `✨ **${target.username}** n'est pas sous malchance.`
        )
        .setTimestamp()

      return interaction.reply({ embeds: [embed], ephemeral: true })
    }

    /* ======================== LIST ======================== */

    if (sub === "list") {

      const all = getAllNoLuck()
      const entries = Object.entries(all)

      if (entries.length === 0) {
        return interaction.reply({
          content: "✅ Aucun joueur n'est actuellement sous malchance.",
          ephemeral: true
        })
      }

      const lines = entries.map(([uid, data]) =>
        `• <@${uid}> — par <@${data.by}> (<t:${Math.floor(data.at / 1000)}:R>)`
      )

      const embed = new EmbedBuilder()
        .setTitle(`⚫ Joueurs sous malchance (${entries.length})`)
        .setColor(0x2C3E50)
        .setDescription(lines.join("\n"))
        .setTimestamp()

      return interaction.reply({ embeds: [embed], ephemeral: true })
    }

  }

}