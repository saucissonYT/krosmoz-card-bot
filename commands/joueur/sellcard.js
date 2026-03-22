const {
 ActionRowBuilder,
 StringSelectMenuBuilder
} = require("discord.js")

const { RARITY_EMOJI, SELL_PRICE } = require("../../systems/constants")
const { ensureCurrentSeason, getSeasonTemplate } = require("../../systems/seasonService")

const { getCardsById } = require("../../systems/cardRegistry")
const { getUser, save } = require("../../systems/userSystem")
const { achievementCheck } = require("../../systems/achievementCheck")
const { notifyAchievements } = require("../../systems/achievementNotifier")

function getSeasonSellMultiplier() {
 try {
  const current = ensureCurrentSeason()
  const season = getSeasonTemplate(current.activeSeason)
  const bonus = season?.passiveBonus

  if (bonus?.type === "market_sell_bonus") {
   const value = Number(bonus.value)
   if (Number.isFinite(value) && value > 0) return value
  }
 } catch (_) {}

 return 1
}

module.exports = {
 name: "sellcard",
 description: "Vendre une carte",

 async execute(interaction) {
  const cardsById = getCardsById()
  const user = getUser(interaction.user.id)

  if (!user.cards || Object.keys(user.cards).length === 0) {
   return interaction.reply({ content: "❌ Tu n'as aucune carte.", flags: 64 })
  }

  const sellMultiplier = getSeasonSellMultiplier()
  const bonusPct = Math.max(0, Math.round((sellMultiplier - 1) * 100))
  const options = []

  for (const id in user.cards) {
   const card = cardsById[id]
   if (!card) continue

   const owned = user.cards[id]
   const basePrice = SELL_PRICE[card.rarity] || 1
   const price = Math.max(1, Math.floor(basePrice * sellMultiplier))

   options.push({
    label: `${RARITY_EMOJI[card.rarity]} ${card.name}`,
    value: id,
    description: `Possédé: x${owned} • Vente: ${price} • Total: ${owned * price}`
   })
  }

  if (options.length === 0) {
   return interaction.reply({ content: "❌ Aucune carte vendable.", flags: 64 })
  }

  const menu = new StringSelectMenuBuilder()
   .setCustomId("sellcard_select")
   .setPlaceholder("💰 Choisir une carte à vendre")
   .addOptions(options.slice(0, 25))

  const row = new ActionRowBuilder().addComponents(menu)

  await interaction.reply({
   content: `💰 **Sélectionne une carte à vendre**${bonusPct > 0 ? `\nBonus saison appliqué: **+${bonusPct}%**` : ""}`,
   components: [row],
   flags: 64
  })
 },

 async select(interaction) {
  if (interaction.customId !== "sellcard_select") return

  const cardsById = getCardsById()
  const user = getUser(interaction.user.id)
  const id = interaction.values[0]
  const card = cardsById[id]

  if (!card) {
   return interaction.update({ content: "❌ Carte introuvable.", components: [] })
  }

  if (!user.cards || !user.cards[id]) {
   return interaction.update({ content: "❌ Tu ne possèdes plus cette carte.", components: [] })
  }

  const sellMultiplier = getSeasonSellMultiplier()
  const bonusPct = Math.max(0, Math.round((sellMultiplier - 1) * 100))
  const basePrice = SELL_PRICE[card.rarity] || 1
  const price = Math.max(1, Math.floor(basePrice * sellMultiplier))

  user.cards[id]--
  if (user.cards[id] <= 0) delete user.cards[id]

  user.kamas = (user.kamas || 0) + price

  if (!user.stats) user.stats = {}
  user.stats.cardsSold = (user.stats.cardsSold || 0) + 1

  save(interaction.user.id)

  const unlocked = achievementCheck(user, "economy")

  await interaction.update({
   content:
`💰 **Carte vendue**

${RARITY_EMOJI[card.rarity]} **${card.name}**
+${price} kamas${bonusPct > 0 ? ` (bonus saison +${bonusPct}%)` : ""}

💰 Solde : **${user.kamas} kamas**`,
   components: []
  })

  if (unlocked.length) {
   await notifyAchievements(interaction, unlocked)
  }
 }
}
