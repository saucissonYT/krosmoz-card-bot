const { SlashCommandBuilder, EmbedBuilder } = require("discord.js")

const { isDev } = require("../../systems/devSystem")
const {
 normalizeDiscordId,
 addDiscordBan,
 removeDiscordBan,
 getDiscordBanEntry,
 getAllBannedDiscordIds
} = require("../../systems/banlistSystem")

module.exports = {

 data: new SlashCommandBuilder()
  .setName("banlist")
  .setDescription("Gerer la banlist Discord du projet")
  .addSubcommand(sub =>
   sub
    .setName("add")
    .setDescription("Ajouter un ID Discord a la banlist")
    .addStringOption(opt =>
     opt
      .setName("id")
      .setDescription("ID Discord a bannir")
      .setRequired(true)
    )
    .addStringOption(opt =>
     opt
      .setName("raison")
      .setDescription("Raison (optionnelle)")
      .setRequired(false)
    )
  )
  .addSubcommand(sub =>
   sub
    .setName("remove")
    .setDescription("Retirer un ID Discord de la banlist")
    .addStringOption(opt =>
     opt
      .setName("id")
      .setDescription("ID Discord a debannir")
      .setRequired(true)
    )
  )
  .addSubcommand(sub =>
   sub
    .setName("check")
    .setDescription("Verifier si un ID Discord est banni")
    .addStringOption(opt =>
     opt
      .setName("id")
      .setDescription("ID Discord a verifier")
      .setRequired(true)
    )
  )
  .addSubcommand(sub =>
   sub
    .setName("list")
    .setDescription("Afficher tous les IDs bannis")
  ),

 async execute(interaction) {
  if (!isDev(interaction.user.id)) {
   return interaction.reply({
    content: "⛔ Commande dev.",
    ephemeral: true
   })
  }

  const sub = interaction.options.getSubcommand()

  if (sub === "add") {
   const rawId = interaction.options.getString("id")
   const reason = String(interaction.options.getString("raison") || "Ban Krosmoz")
   const userId = normalizeDiscordId(rawId)

   if (!userId) {
    return interaction.reply({
     content: "❌ ID Discord invalide (16 a 22 chiffres).",
     ephemeral: true
    })
   }

   const result = addDiscordBan(userId, interaction.user.id, reason)
   if (!result.ok) {
    return interaction.reply({
     content: `❌ ${result.error || "Impossible d'ajouter l'ID a la banlist."}`,
     ephemeral: true
    })
   }

   const entry = result.entry
   const embed = new EmbedBuilder()
    .setTitle(result.added ? "🚫 ID ajoute a la banlist" : "♻️ ID deja banni (maj)")
    .setColor(0xE74C3C)
    .addFields(
     { name: "ID", value: `\`${userId}\``, inline: false },
     { name: "Raison", value: String(entry?.reason || reason), inline: false },
     { name: "Par", value: `<@${interaction.user.id}>`, inline: true }
    )
    .setTimestamp()

   return interaction.reply({ embeds: [embed], ephemeral: true })
  }

  if (sub === "remove") {
   const rawId = interaction.options.getString("id")
   const userId = normalizeDiscordId(rawId)

   if (!userId) {
    return interaction.reply({
     content: "❌ ID Discord invalide (16 a 22 chiffres).",
     ephemeral: true
    })
   }

   const result = removeDiscordBan(userId)
   if (!result.ok) {
    return interaction.reply({
     content: `❌ ${result.error || "Impossible de retirer l'ID de la banlist."}`,
     ephemeral: true
    })
   }

   if (!result.removed) {
    return interaction.reply({
     content: `ℹ️ \`${userId}\` n'etait pas dans la banlist.`,
     ephemeral: true
    })
   }

   return interaction.reply({
    content: `✅ \`${userId}\` retire de la banlist.`,
    ephemeral: true
   })
  }

  if (sub === "check") {
   const rawId = interaction.options.getString("id")
   const userId = normalizeDiscordId(rawId)
   if (!userId) {
    return interaction.reply({
     content: "❌ ID Discord invalide (16 a 22 chiffres).",
     ephemeral: true
    })
   }

   const entry = getDiscordBanEntry(userId)
   if (!entry) {
    return interaction.reply({
     content: `✅ \`${userId}\` n'est pas banni.`,
     ephemeral: true
    })
   }

   const embed = new EmbedBuilder()
    .setTitle("🚫 ID banni")
    .setColor(0xE67E22)
    .addFields(
     { name: "ID", value: `\`${userId}\``, inline: false },
     { name: "Raison", value: String(entry.reason || "Ban Krosmoz"), inline: false },
     { name: "Depuis", value: `<t:${Math.floor(Number(entry.at || Date.now()) / 1000)}:R>`, inline: true },
     {
      name: "Par",
      value: /^\d{16,22}$/.test(String(entry.by || ""))
       ? `<@${entry.by}>`
       : String(entry.by || "inconnu"),
      inline: true
     }
    )
    .setTimestamp()

   return interaction.reply({ embeds: [embed], ephemeral: true })
  }

  const ids = getAllBannedDiscordIds()
  if (!ids.length) {
   return interaction.reply({
    content: "✅ La banlist est vide.",
    ephemeral: true
   })
  }

  const maxItems = 80
  const sliced = ids.slice(0, maxItems)
  const content = [
   `🚫 **Banlist active** (${ids.length} ID${ids.length > 1 ? "s" : ""})`,
   "```",
   ...sliced,
   "```",
   ids.length > maxItems ? `_... ${ids.length - maxItems} autres IDs masques._` : ""
  ]
   .filter(Boolean)
   .join("\n")

  return interaction.reply({
   content,
   ephemeral: true
  })
 }

}
