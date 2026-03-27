const { SlashCommandBuilder, EmbedBuilder } = require("discord.js")

const { getCard } = require("../../systems/cardRegistry")
const { getUser, save } = require("../../systems/userSystem")
const { achievementCheck } = require("../../systems/achievementCheck")
const { notifyAchievements } = require("../../systems/achievementNotifier")
const {
 craftFromFragments,
 getCardCraftProgress,
 buildProgressBar,
 getCraftableSSRCards,
 isCraftableSSRCard
} = require("../../systems/fragmentService")

module.exports = {
 data: new SlashCommandBuilder()
  .setName("craft")
  .setDescription("Assembler une carte SSR a partir de ses fragments")
  .addStringOption((option) =>
   option
    .setName("carte")
    .setDescription("ID numerique de la carte SSR a crafter")
    .setRequired(true)
    .setAutocomplete(true)
  ),

 async autocomplete(interaction) {
  const focused = interaction.options.getFocused().toLowerCase()
  const choices = getCraftableSSRCards()
   .map((card) => ({
    name: `${card.name} (#${card.id})`,
    value: String(card.id)
   }))
   .filter((choice) => choice.name.toLowerCase().includes(focused) || choice.value.includes(focused))
   .slice(0, 25)

  await interaction.respond(choices)
 },

 async execute(interaction) {
  await interaction.deferReply()

  const cardId = interaction.options.getString("carte")
  const card = getCard(cardId)

  if (!card) {
   return interaction.editReply("❌ Carte introuvable.")
  }

  if (!isCraftableSSRCard(card)) {
   return interaction.editReply("❌ Cette carte n'est pas craftable via fragments.")
  }

  const result = await craftFromFragments(interaction.user.id, card.id)

  if (!result.ok) {
   const user = getUser(interaction.user.id)
   const progress = result.progress || getCardCraftProgress(user, card.id)
   return interaction.editReply(
`❌ Craft impossible.

🧩 **${card.name}**
${buildProgressBar(progress)} ${progress.ownedCount}/5
Possedes : ${progress.numbers.join(", ") || "-"}
Manquants : ${progress.missing.join(", ") || "-"}`
   )
  }

  const user = getUser(interaction.user.id)
  const progress = getCardCraftProgress(user, card.id)
  const unlocked = achievementCheck(user, "fragment")
  save(interaction.user.id)

  const embed = new EmbedBuilder()
   .setTitle("✨ Craft reussi")
   .setDescription(
`🧩 **${card.name}** a ete assemble a partir de ses fragments.

${buildProgressBar({ ownedCount: 5 })} 5/5 consommes
🃏 La carte a ete ajoutee a ta collection.
🎖️ Titre debloque : **${result.titleUnlocked}**
⭐ XP Battle Pass : **+500**`
   )
   .setFooter({
    text: progress.ownedCount > 0
     ? `Fragments restants pour cette carte : ${progress.ownedCount}/5`
     : "Tous les fragments ont ete consommes"
   })
   .setColor("#f1c40f")

  await interaction.editReply({ embeds: [embed] })

  if (unlocked.length) {
   await notifyAchievements(interaction, unlocked, user)
  }
 }
}
