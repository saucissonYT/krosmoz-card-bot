const { SlashCommandBuilder, EmbedBuilder } = require("discord.js")

const { getCard } = require("../../systems/cardRegistry")
const { getUser, save } = require("../../systems/userSystem")
const { achievementCheck } = require("../../systems/achievementCheck")
const { notifyAchievements } = require("../../systems/achievementNotifier")
const {
 craftFromFragments,
 getCardCraftProgress,
 getCraftableSSRCards,
 isCraftableSSRCard
} = require("../../systems/fragmentService")

/* ---- Jauge style pity avec compteurs par slot ---- */

function buildFragBar(user, cardId) {
 const counts = [1, 2, 3, 4, 5].map(n =>
  (user.fragments || []).filter(f =>
   String(f.cardId) === String(cardId) &&
   Number(f.fragmentNumber) === n
  ).length
 )
 const bar  = counts.map(c => c > 0 ? "🟩" : "⬛").join("")
 const nums = counts.map(c => ` ${c} `).join(" ")
 return `${bar}\n${nums}`
}

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
  const user = getUser(interaction.user.id)

  const choices = getCraftableSSRCards()
   .map((card) => {
    const progress = getCardCraftProgress(user, card.id)
    return {
     card,
     progress,
     canCraft: progress.canCraft,
     ownedCount: progress.ownedCount
    }
   })
   /* Craftable en premier, puis par fragments possédés décroissant */
   .sort((a, b) => {
    if (a.canCraft !== b.canCraft) return a.canCraft ? -1 : 1
    return b.ownedCount - a.ownedCount
   })
   .map(({ card, progress }) => {
    const tag = progress.canCraft
     ? "✅ CRAFTABLE"
     : progress.ownedCount > 0
      ? `🧩 ${progress.ownedCount}/5`
      : "0/5"
    return {
     name: `[${tag}] ${card.name} (#${card.id})`,
     value: String(card.id)
    }
   })
   .filter((c) => c.name.toLowerCase().includes(focused) || c.value.includes(focused))
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
  const user = getUser(interaction.user.id)

  /* ---- Craft échoué ---- */

  if (!result.ok) {
   const progress = result.progress || getCardCraftProgress(user, card.id)
   const fragBar = buildFragBar(user, card.id)

   const embed = new EmbedBuilder()
    .setTitle("❌ Craft impossible")
    .setDescription(
`**${card.name}**

${fragBar}

Il te manque les fragments : **${progress.missing.join(", ") || "-"}**`
    )
    .setColor("#e74c3c")
    .setFooter({ text: `${progress.ownedCount}/5 fragments réunis` })

   return interaction.editReply({ embeds: [embed] })
  }

  /* ---- Craft réussi ---- */

  const progress = getCardCraftProgress(user, card.id)
  const unlocked = achievementCheck(user, "fragment")
  save(interaction.user.id)

  const embed = new EmbedBuilder()
   .setTitle("✨ Craft réussi !")
   .setDescription(
`🌈 **${card.name}** a été assemblée depuis ses fragments.

🟩🟩🟩🟩🟩
 1   2   3   4   5

🃏 Carte ajoutée à ta collection.
🎖️ Titre débloqué : **${result.titleUnlocked}**
⭐ XP Battle Pass : **+500**`
   )
   .setColor("#f1c40f")
   .setFooter({
    text: progress.ownedCount > 0
     ? `Tu possèdes encore ${progress.ownedCount} fragment(s) de cette carte`
     : "Tous les fragments ont été consommés"
   })

  await interaction.editReply({ embeds: [embed] })

  if (unlocked.length) {
   await notifyAchievements(interaction, unlocked, user)
  }
 }
}
