const {
 EmbedBuilder,
 ActionRowBuilder,
 ButtonBuilder,
 ButtonStyle,
 ModalBuilder,
 TextInputBuilder,
 TextInputStyle
} = require("discord.js")

const {
 getMarket,
 buyCard,
 addListing,
 addFragmentListing,
 getUserListings,
 removeListing,
 getAveragePrices,
 getFragmentMinimumPrice,
 getListingType
} = require("../../systems/market")

const { getCards } = require("../../systems/cardRegistry")
const { getUser } = require("../../systems/userSystem")
const { addBattlePassXP } = require("../../systems/battlePassService")
const { achievementCheck } = require("../../systems/achievementCheck")
const { notifyAchievements } = require("../../systems/achievementNotifier")
const { RARITY_EMOJI } = require("../../systems/constants")
const { getFragmentDisplayName } = require("../../systems/fragmentService")

const marketState = {}
const PAGE_SIZE = 10

function formatListing(listing, cards, averages) {
 if (getListingType(listing) === "fragment") {
  const avg = averages[`fragment:${listing.card}:${listing.fragmentNumber}`]
  const minPrice = getFragmentMinimumPrice(listing.card, listing.fragmentNumber, averages)
  const avgText = avg ? ` • 📊 ${avg}` : ""
  return `ID:${listing.id} • 🧩 ${getFragmentDisplayName(listing.card, listing.fragmentNumber)} • ${listing.price} kamas • min ${minPrice}${avgText}`
 }

 const card = cards.find((entry) => entry.id == listing.card)
 const avg = averages[`card:${listing.card}`] ? ` • 📊 ${averages[`card:${listing.card}`]}` : ""
 return `ID:${listing.id} • ${RARITY_EMOJI[card?.rarity || "C"]} ${card?.name || "?"} • ${listing.price} kamas${avg}`
}

module.exports = {
 name: "market",

 async execute(interaction) {
  const userId = interaction.user.id
  marketState[userId] = { page: 0 }

  const embed = new EmbedBuilder()
   .setTitle("🛒 Marche")
   .setDescription(`Que veux-tu faire ?

🛍️ Acheter
📦 Voir mes ventes
💰 Vendre une carte
🧩 Vendre un fragment`)

  const row = new ActionRowBuilder().addComponents(
   new ButtonBuilder().setCustomId("market_buy").setLabel("Acheter").setStyle(ButtonStyle.Success),
   new ButtonBuilder().setCustomId("market_my").setLabel("Mes ventes").setStyle(ButtonStyle.Primary),
   new ButtonBuilder().setCustomId("market_sell").setLabel("Vendre carte").setStyle(ButtonStyle.Danger),
   new ButtonBuilder().setCustomId("market_sell_fragment").setLabel("Vendre fragment").setStyle(ButtonStyle.Secondary)
  )

  await interaction.reply({ embeds: [embed], components: [row] })
 },

 async button(interaction) {
  const userId = interaction.user.id
  if (!marketState[userId]) {
   return interaction.reply({ content: "❌ Menu expire.", flags: 64 })
  }

  const state = marketState[userId]

  if (interaction.customId === "market_buy") {
   state.page = 0
   return this.renderMarket(interaction)
  }

  if (interaction.customId === "market_next") {
   state.page++
   return this.renderMarket(interaction)
  }

  if (interaction.customId === "market_prev") {
   if (state.page > 0) state.page--
   return this.renderMarket(interaction)
  }

  if (interaction.customId === "market_buy_modal") {
   const modal = new ModalBuilder().setCustomId("marketBuyModal").setTitle("Acheter une annonce")
   const input = new TextInputBuilder().setCustomId("listingId").setLabel("ID du listing").setStyle(TextInputStyle.Short).setRequired(true)
   modal.addComponents(new ActionRowBuilder().addComponents(input))
   return interaction.showModal(modal)
  }

  if (interaction.customId === "market_sell") {
   const modal = new ModalBuilder().setCustomId("marketSellModal").setTitle("Vendre une carte")
   const cardInput = new TextInputBuilder().setCustomId("cardId").setLabel("ID de la carte").setStyle(TextInputStyle.Short).setRequired(true)
   const priceInput = new TextInputBuilder().setCustomId("price").setLabel("Prix en kamas").setStyle(TextInputStyle.Short).setRequired(true)
   modal.addComponents(
    new ActionRowBuilder().addComponents(cardInput),
    new ActionRowBuilder().addComponents(priceInput)
   )
   return interaction.showModal(modal)
  }

  if (interaction.customId === "market_sell_fragment") {
   const modal = new ModalBuilder().setCustomId("marketSellFragmentModal").setTitle("Vendre un fragment")
   const cardInput = new TextInputBuilder().setCustomId("cardId").setLabel("ID de la carte SSR cible").setStyle(TextInputStyle.Short).setRequired(true)
   const numberInput = new TextInputBuilder().setCustomId("fragmentNumber").setLabel("Numero du fragment (1-5)").setStyle(TextInputStyle.Short).setRequired(true)
   const priceInput = new TextInputBuilder().setCustomId("price").setLabel("Prix en kamas").setStyle(TextInputStyle.Short).setRequired(true)
   modal.addComponents(
    new ActionRowBuilder().addComponents(cardInput),
    new ActionRowBuilder().addComponents(numberInput),
    new ActionRowBuilder().addComponents(priceInput)
   )
   return interaction.showModal(modal)
  }

  if (interaction.customId === "market_my") {
   const cards = getCards()
   const listings = getUserListings(userId)

   if (listings.length === 0) {
    return interaction.update({ content: "Tu n'as aucune vente active.", embeds: [], components: [] })
   }

   const averages = getAveragePrices()
   const lines = listings.map((listing) => formatListing(listing, cards, averages))
   const embed = new EmbedBuilder().setTitle("📦 Mes ventes").setDescription(lines.join("\n"))
   const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("market_remove_modal").setLabel("Retirer une vente").setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId("market_back").setLabel("Retour").setStyle(ButtonStyle.Secondary)
   )

   return interaction.update({ embeds: [embed], components: [row] })
  }

  if (interaction.customId === "market_remove_modal") {
   const modal = new ModalBuilder().setCustomId("marketRemoveModal").setTitle("Retirer une vente")
   const input = new TextInputBuilder().setCustomId("listingId").setLabel("ID du listing").setStyle(TextInputStyle.Short).setRequired(true)
   modal.addComponents(new ActionRowBuilder().addComponents(input))
   return interaction.showModal(modal)
  }

  if (interaction.customId === "market_back") {
   return this.execute(interaction)
  }
 },

 async renderMarket(interaction) {
  const userId = interaction.user.id
  const state = marketState[userId]
  const cards = getCards()
  const averages = getAveragePrices()

  const market = getMarket().slice().sort((a, b) => a.price - b.price)
  const start = state.page * PAGE_SIZE
  const slice = market.slice(start, start + PAGE_SIZE)
  const lines = slice.map((listing) => formatListing(listing, cards, averages))

  const embed = new EmbedBuilder()
   .setTitle("🛒 Marche")
   .setDescription(lines.join("\n") || "Aucun resultat.")

  const row1 = new ActionRowBuilder().addComponents(
   new ButtonBuilder().setCustomId("market_prev").setEmoji("⬅").setStyle(ButtonStyle.Secondary),
   new ButtonBuilder().setCustomId("market_next").setEmoji("➡").setStyle(ButtonStyle.Secondary)
  )

  const row2 = new ActionRowBuilder().addComponents(
   new ButtonBuilder().setCustomId("market_buy_modal").setLabel("Acheter ID").setStyle(ButtonStyle.Success),
   new ButtonBuilder().setCustomId("market_back").setLabel("Retour").setStyle(ButtonStyle.Secondary)
  )

  const payload = { embeds: [embed], components: [row1, row2] }
  if (interaction.isButton()) return interaction.update(payload)
  return interaction.editReply(payload)
 },

 async modal(interaction) {
  if (interaction.customId === "marketBuyModal") {
   const listingId = parseInt(interaction.fields.getTextInputValue("listingId"))
   const result = buyCard(interaction.user.id, listingId)
   if (result?.error) return interaction.reply({ content: `❌ ${result.error}`, flags: 64 })

   const user = getUser(interaction.user.id)
   const unlocked = [
    ...achievementCheck(user, "economy"),
    ...achievementCheck(user, "collection"),
    ...achievementCheck(user, "pack"),
    ...achievementCheck(user, "fragment")
   ]

   await interaction.reply({ content: "✅ Achat effectue.", flags: 64 })
   if (unlocked.length) await notifyAchievements(interaction, unlocked, user)
   return
  }

  if (interaction.customId === "marketSellModal") {
   await interaction.deferReply({ flags: 64 })
   const cardId = parseInt(interaction.fields.getTextInputValue("cardId"))
   const price = parseInt(interaction.fields.getTextInputValue("price"))
   if (isNaN(cardId) || isNaN(price)) return interaction.editReply("❌ ID ou prix invalide.")

   const result = addListing(interaction.user.id, cardId, price)
   if (result?.error) return interaction.editReply(`❌ ${result.error}`)

   const user = getUser(interaction.user.id)
   await addBattlePassXP(interaction.user.id, "market_sell")
   const unlocked = achievementCheck(user, "economy")

   await interaction.editReply({ content: "🛒 Carte mise en vente." })
   if (unlocked.length) await notifyAchievements(interaction, unlocked, user)
   return
  }

  if (interaction.customId === "marketSellFragmentModal") {
   await interaction.deferReply({ flags: 64 })

   const cardId = interaction.fields.getTextInputValue("cardId").trim()
   const fragmentNumber = parseInt(interaction.fields.getTextInputValue("fragmentNumber"))
   const price = parseInt(interaction.fields.getTextInputValue("price"))

   if (isNaN(fragmentNumber) || isNaN(price)) {
    return interaction.editReply("❌ Numero ou prix invalide.")
   }

   const minPrice = getFragmentMinimumPrice(cardId, fragmentNumber)
   const result = addFragmentListing(interaction.user.id, cardId, fragmentNumber, price)
   if (result?.error) {
    return interaction.editReply(`❌ ${result.error}\nPrix minimum actuel : **${minPrice}** kamas.`)
   }

   const user = getUser(interaction.user.id)
   await addBattlePassXP(interaction.user.id, "market_sell")
   const unlocked = achievementCheck(user, "fragment")

   await interaction.editReply(`🧩 Fragment mis en vente.\nPrix minimum actuel : **${minPrice}** kamas.`)
   if (unlocked.length) await notifyAchievements(interaction, unlocked, user)
   return
  }

  if (interaction.customId === "marketRemoveModal") {
   const listingId = parseInt(interaction.fields.getTextInputValue("listingId"))
   const result = removeListing(interaction.user.id, listingId)
   if (result?.error) return interaction.reply({ content: `❌ ${result.error}`, flags: 64 })
   return interaction.reply({ content: "📦 Vente retiree.", flags: 64 })
  }
 }
}
