const { SlashCommandBuilder, EmbedBuilder } = require("discord.js")
const { sanctionPlayer, unsanctionPlayer, isSanctioned } = require("../../systems/moderationSystem")

/* ================================================================
   /sanction — Sanctionner ou lever la sanction d'un joueur
   Accès : modérateurs (rôle géré dans slashRoutes.js)
================================================================ */

module.exports = {

  data: new SlashCommandBuilder()
    .setName("sanction")
    .setDescription("Sanctionner un joueur (il ne peut plus utiliser le bot)")
    .addSubcommand(sub =>
      sub
        .setName("add")
        .setDescription("Appliquer une sanction")
        .addUserOption(opt =>
          opt.setName("joueur").setDescription("Joueur à sanctionner").setRequired(true)
        )
        .addIntegerOption(opt =>
          opt.setName("duree").setDescription("Durée en minutes (0 = permanent)").setRequired(true).setMinValue(0)
        )
        .addStringOption(opt =>
          opt.setName("raison").setDescription("Raison de la sanction").setRequired(false)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName("remove")
        .setDescription("Lever la sanction d'un joueur")
        .addUserOption(opt =>
          opt.setName("joueur").setDescription("Joueur à unsanctionner").setRequired(true)
        )
    )
    .addSubcommand(sub =>
      sub
        .setName("check")
        .setDescription("Vérifier le statut d'un joueur")
        .addUserOption(opt =>
          opt.setName("joueur").setDescription("Joueur à vérifier").setRequired(true)
        )
    ),

  async execute(interaction) {

    const sub    = interaction.options.getSubcommand()
    const target = interaction.options.getUser("joueur")

    /* ======================== ADD ======================== */

    if (sub === "add") {

      const durationMin = interaction.options.getInteger("duree")
      const reason      = interaction.options.getString("raison") || "Aucune raison précisée"
      const durationMs  = durationMin * 60 * 1000

      const entry = sanctionPlayer(target.id, durationMs, reason, interaction.user.id)

      const isPermanent = entry.endsAt === null

      const embed = new EmbedBuilder()
        .setTitle("🔨 Joueur sanctionné")
        .setColor(0xE74C3C)
        .addFields(
          { name: "Joueur",    value: `<@${target.id}> (${target.username})`, inline: true },
          { name: "Par",       value: `<@${interaction.user.id}>`,             inline: true },
          { name: "Durée",     value: isPermanent ? "**Permanent**" : `**${durationMin} minute(s)**`, inline: true },
          { name: "Fin",       value: isPermanent ? "Jamais" : `<t:${Math.floor(entry.endsAt / 1000)}:R>`, inline: true },
          { name: "Raison",    value: reason }
        )
        .setTimestamp()
        .setFooter({ text: "Le joueur ne pourra plus utiliser le bot pendant cette durée." })

      return interaction.reply({ embeds: [embed], ephemeral: true })
    }

    /* ======================== REMOVE ======================== */

    if (sub === "remove") {

      const removed = unsanctionPlayer(target.id)

      if (!removed) {
        return interaction.reply({
          content: `ℹ️ **${target.username}** n'a aucune sanction active.`,
          ephemeral: true
        })
      }

      const embed = new EmbedBuilder()
        .setTitle("✅ Sanction levée")
        .setColor(0x2ECC71)
        .setDescription(`La sanction de **${target.username}** (<@${target.id}>) a été levée par <@${interaction.user.id}>.`)
        .setTimestamp()

      return interaction.reply({ embeds: [embed], ephemeral: true })
    }

    /* ======================== CHECK ======================== */

    if (sub === "check") {

      const entry = isSanctioned(target.id)

      if (!entry) {
        return interaction.reply({
          content: `✅ **${target.username}** n'est pas sanctionné.`,
          ephemeral: true
        })
      }

      const isPermanent = entry.endsAt === null

      const embed = new EmbedBuilder()
        .setTitle("🔍 Sanction active")
        .setColor(0xE67E22)
        .addFields(
          { name: "Joueur",  value: `<@${target.id}> (${target.username})`, inline: true },
          { name: "Par",     value: `<@${entry.by}>`,                        inline: true },
          { name: "Fin",     value: isPermanent ? "**Permanent**" : `<t:${Math.floor(entry.endsAt / 1000)}:R>`, inline: true },
          { name: "Depuis",  value: `<t:${Math.floor(entry.at / 1000)}:R>`,  inline: true },
          { name: "Raison",  value: entry.reason }
        )
        .setTimestamp()

      return interaction.reply({ embeds: [embed], ephemeral: true })
    }

  }

}