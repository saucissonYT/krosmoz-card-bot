const {
 EmbedBuilder,
 ActionRowBuilder,
 StringSelectMenuBuilder
} = require("discord.js")

const { getShop, buyFromShop } = require("../../systems/krosmoshop")
const { getCards } = require("../../systems/cardRegistry")
const { getUser } = require("../../systems/userSystem")
const { notifyAchievements } = require("../../systems/achievementNotifier")
const { RARITY_EMOJI } = require("../../systems/constants")

module.exports = {
 name: "krosmoshop",
 description: "Shop quotidien",

 async execute(interaction) {
  const cards = getCards()
  const user = getUser(interaction.user.id)

  const shopData = getShop()
  const shop = shopData.cards || []

  const lines = shop.map(c => {
   const card = cards.find(item => item.id == c.card)
   if (!card) return `Carte inconnue (ID:${c.card})`

   const count = user.cards?.[c.card] || 0
   const ownedMark = count > 0 ? `:white_check_mark: x${count}` : ":x: x0"

   return `${RARITY_EMOJI[c.rarity]} ${card.name} • ${c.price} kamas • ID:${c.card}  ${ownedMark}`
  })

  const embed = new EmbedBuilder()
   .setTitle("KrosmoShop du jour")
   .setDescription(lines.join("\n") || "Aucune carte.")
   .setFooter({ text: `Tes kamas : ${user.kamas || 0}` })

  const select = new StringSelectMenuBuilder()
   .setCustomId("krosmoshop_buy")
   .setPlaceholder("Acheter une carte")

  shop.forEach(c => {
   const card = cards.find(item => item.id == c.card)
   if (!card) return

   const count = user.cards?.[c.card] || 0
   const ownedMark = count > 0 ? `:white_check_mark: x${count}` : ":x: x0"

   select.addOptions({
    label: card.name,
    description: `${c.price} kamas | ${ownedMark}`,
    value: String(c.card)
   })
  })

  const row = new ActionRowBuilder().addComponents(select)

  await interaction.reply({
   embeds: [embed],
   components: [row]
  })
 },

 async select(interaction) {
  if (interaction.customId !== "krosmoshop_buy") return

  await interaction.deferReply({ flags: 64 })

  const cardId = parseInt(interaction.values[0])
  const result = buyFromShop(interaction.user.id, cardId)

  if (result?.error) {
   return interaction.editReply(`:x: ${result.error}`)
  }

  const emoji = RARITY_EMOJI[result.rarity] || ":flower_playing_cards:"
  const cardName = result.cardInfo?.name || `Carte #${cardId}`

  let text = `Achat effectue ! ${emoji} **${cardName}** \`${result.rarity}\` • -${result.price} kamas`

  if (result.isNew) {
   text += "\n\nNouvelle decouverte ! Tu ne possedais pas cette carte !"
  }

  await interaction.editReply(text)

  if (result.unlocked?.length) {
   await notifyAchievements(interaction, result.unlocked)
  }
 }
}
