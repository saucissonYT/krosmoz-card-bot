const {
 EmbedBuilder,
 ActionRowBuilder,
 StringSelectMenuBuilder,
 ButtonBuilder,
 ButtonStyle
} = require("discord.js")

const { getShop, buyFromShop } = require("../../systems/krosmoshop")
const { getCards } = require("../../systems/cardRegistry")
const { getUser, save } = require("../../systems/userSystem")
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

  const today = new Date().toLocaleDateString("fr-FR", { timeZone: "Europe/Paris" })
  const alreadyBought = user.krosmoshop?.[today] || {}

  const lines = shop.map(c => {
   const card = cards.find(item => item.id == c.card)
   if (!card) return `Carte inconnue (ID:${c.card})`

   const count = user.cards?.[c.card] || 0
   const bought = alreadyBought[c.card] ? " ✅ acheté" : ""
   const ownedMark = count > 0 ? `✅ x${count}` : "❌ x0"

   return `${RARITY_EMOJI[c.rarity]} ${card.name} • ${c.price} kamas • ${ownedMark}${bought}`
  })

  /* Calculer combien de cartes non possédées sont achetables */
  const notOwned = shop.filter(c => {
   const count = user.cards?.[c.card] || 0
   const bought = alreadyBought[c.card]
   return count === 0 && !bought
  })

  const totalCostNotOwned = notOwned.reduce((sum, c) => sum + c.price, 0)

  const embed = new EmbedBuilder()
   .setTitle("🛒 KrosmoShop du jour")
   .setDescription(lines.join("\n") || "Aucune carte.")
   .setFooter({ text: `💰 Tes kamas : ${user.kamas || 0}` })
   .setColor(0xF1C40F)

  const select = new StringSelectMenuBuilder()
   .setCustomId("krosmoshop_buy")
   .setPlaceholder("Acheter une carte")

  shop.forEach(c => {
   const card = cards.find(item => item.id == c.card)
   if (!card) return

   const count = user.cards?.[c.card] || 0
   const ownedMark = count > 0 ? `✅ x${count}` : "❌ x0"

   select.addOptions({
    label: card.name,
    description: `${c.price} kamas | ${ownedMark}`,
    value: String(c.card)
   })
  })

  const selectRow = new ActionRowBuilder().addComponents(select)

  const buttonRow = new ActionRowBuilder().addComponents(
   new ButtonBuilder()
    .setCustomId("krosmoshop_buyall")
    .setLabel(`Acheter ${notOwned.length} non-possédée(s) (${totalCostNotOwned} kamas)`)
    .setEmoji("🛍️")
    .setStyle(ButtonStyle.Success)
    .setDisabled(notOwned.length === 0 || user.kamas < totalCostNotOwned)
  )

  await interaction.reply({
   embeds: [embed],
   components: [selectRow, buttonRow]
  })
 },

 async select(interaction) {
  if (interaction.customId !== "krosmoshop_buy") return

  await interaction.deferReply({ flags: 64 })

  const cardId = parseInt(interaction.values[0])
  const result = buyFromShop(interaction.user.id, cardId)

  if (result?.error) {
   return interaction.editReply(`❌ ${result.error}`)
  }

  const emoji = RARITY_EMOJI[result.rarity] || "🎴"
  const cardName = result.cardInfo?.name || `Carte #${cardId}`

  let text = `Achat effectué ! ${emoji} **${cardName}** \`${result.rarity}\` • -${result.price} kamas`

  if (result.isNew) {
   text += "\n\n🆕 Nouvelle découverte ! Tu ne possédais pas cette carte !"
  }

  await interaction.editReply(text)

  if (result.unlocked?.length) {
   await notifyAchievements(interaction, result.unlocked)
  }
 },

 async button(interaction) {
  if (interaction.customId !== "krosmoshop_buyall") return

  await interaction.deferReply({ flags: 64 })

  const cards = getCards()
  const user = getUser(interaction.user.id)
  const shopData = getShop()
  const shop = shopData.cards || []

  const today = new Date().toLocaleDateString("fr-FR", { timeZone: "Europe/Paris" })
  const alreadyBought = user.krosmoshop?.[today] || {}

  /* Filtrer les cartes non possédées et non déjà achetées aujourd'hui */
  const notOwned = shop.filter(c => {
   const count = user.cards?.[c.card] || 0
   const bought = alreadyBought[c.card]
   return count === 0 && !bought
  })

  if (notOwned.length === 0) {
   return interaction.editReply("❌ Aucune carte non possédée à acheter.")
  }

  /* Acheter une par une via buyFromShop pour respecter toute la logique */
  const bought = []
  const errors = []
  let totalSpent = 0
  let allUnlocked = []

  for (const entry of notOwned) {
   const result = buyFromShop(interaction.user.id, entry.card)

   if (result?.error) {
    errors.push(`${RARITY_EMOJI[entry.rarity]} erreur: ${result.error}`)
    /* Si kamas insuffisants, on arrête */
    if (result.error.includes("Kamas")) break
    continue
   }

   const card = cards.find(c => c.id == entry.card)
   bought.push(`${RARITY_EMOJI[result.rarity]} **${card?.name || `#${entry.card}`}** • -${result.price} kamas`)
   totalSpent += result.price

   if (result.unlocked?.length) {
    allUnlocked.push(...result.unlocked)
   }
  }

  /* Embed résultat */
  const embed = new EmbedBuilder()
   .setTitle("🛍️ Achat groupé KrosmoShop")
   .setColor(0x2ECC71)

  let desc = ""

  if (bought.length > 0) {
   desc += `**${bought.length} carte(s) achetée(s) :**\n${bought.join("\n")}\n\n💰 Total dépensé : **${totalSpent} kamas**\n💰 Solde : **${user.kamas} kamas**`
  }

  if (errors.length > 0) {
   desc += `\n\n**Erreurs :**\n${errors.join("\n")}`
  }

  if (bought.length === 0 && errors.length === 0) {
   desc = "Aucun achat effectué."
  }

  embed.setDescription(desc)

  await interaction.editReply({ embeds: [embed] })

  /* Dédoublonner les achievements */
  allUnlocked = [...new Set(allUnlocked)]
  if (allUnlocked.length) {
   await notifyAchievements(interaction, allUnlocked)
  }
 }
}