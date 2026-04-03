const {
 EmbedBuilder,
 ActionRowBuilder,
 ButtonBuilder,
 ButtonStyle,
 ModalBuilder,
 TextInputBuilder,
 TextInputStyle,
 StringSelectMenuBuilder,
 StringSelectMenuOptionBuilder
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
const {
 getFragmentDisplayName,
 getFragmentInventoryRows
} = require("../../systems/fragmentService")

/* ─── State ──────────────────────────────────────────────────────────── */

const marketState = {}
const PAGE_SIZE = 10

/* ─── Helpers ────────────────────────────────────────────────────────── */

function formatListing(listing, cards, averages) {
 if (getListingType(listing) === "fragment") {
  const avg = averages[`fragment:${listing.card}:${listing.fragmentNumber}`]
  const minPrice = getFragmentMinimumPrice(listing.card, listing.fragmentNumber, averages)
  const avgText = avg ? ` • 📊 ${avg}` : ""
  return `ID:${listing.id} • 🧩 ${getFragmentDisplayName(listing.card, listing.fragmentNumber)} • ${listing.price} kamas • min ${minPrice}${avgText}`
 }

 const card = cards.find((c) => c.id == listing.card)
 const avg = averages[`card:${listing.card}`] ? ` • 📊 ${averages[`card:${listing.card}`]}` : ""
 return `ID:${listing.id} • ${RARITY_EMOJI[card?.rarity || "C"]} ${card?.name || "?"} • ${listing.price} kamas${avg}`
}

/* ─── Module ─────────────────────────────────────────────────────────── */

module.exports = {
 name: "market",

 /* ══════════════════════════════════════════════════════════
    EXECUTE — menu principal
 ══════════════════════════════════════════════════════════ */

 async execute(interaction) {
  const userId = interaction.user.id
  marketState[userId] = { page: 0 }

  const embed = new EmbedBuilder()
   .setTitle("🛒 Marché")
   .setDescription(
`Que veux-tu faire ?

🛍️ Acheter une carte ou un fragment
📦 Voir mes ventes actives
💰 Vendre une carte
🧩 Vendre un fragment`
   )

  const row = new ActionRowBuilder().addComponents(
   new ButtonBuilder().setCustomId("market_buy").setLabel("Acheter").setStyle(ButtonStyle.Success),
   new ButtonBuilder().setCustomId("market_my").setLabel("Mes ventes").setStyle(ButtonStyle.Primary),
   new ButtonBuilder().setCustomId("market_sell").setLabel("Vendre carte").setStyle(ButtonStyle.Danger),
   new ButtonBuilder().setCustomId("market_sell_fragment").setLabel("Vendre fragment").setEmoji("🧩").setStyle(ButtonStyle.Secondary)
  )

  await interaction.reply({ embeds: [embed], components: [row] })
 },

 /* ══════════════════════════════════════════════════════════
    BUTTON HANDLER
 ══════════════════════════════════════════════════════════ */

 async button(interaction) {
  const userId = interaction.user.id

  if (!marketState[userId]) {
   return interaction.reply({
    content: "❌ Menu expiré. Utilise `/market` pour en ouvrir un nouveau.",
    flags: 64
   })
  }

  const state = marketState[userId]

  /* ── Acheter ── */

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
   const input = new TextInputBuilder()
    .setCustomId("listingId")
    .setLabel("ID du listing (visible dans le marché)")
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
   modal.addComponents(new ActionRowBuilder().addComponents(input))
   return interaction.showModal(modal)
  }

  /* ── Vendre carte ── */

  if (interaction.customId === "market_sell") {
   const modal = new ModalBuilder().setCustomId("marketSellModal").setTitle("Vendre une carte")
   const cardInput = new TextInputBuilder()
    .setCustomId("cardId")
    .setLabel("ID de la carte (visible dans /inventaire)")
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
   const priceInput = new TextInputBuilder()
    .setCustomId("price")
    .setLabel("Prix en kamas")
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
   modal.addComponents(
    new ActionRowBuilder().addComponents(cardInput),
    new ActionRowBuilder().addComponents(priceInput)
   )
   return interaction.showModal(modal)
  }

  /* ── Vendre fragment — NOUVELLE UX ──
   * Au lieu du modal 3 champs, on affiche un select menu
   * avec les fragments possédés par le joueur.
   */

  if (interaction.customId === "market_sell_fragment") {
   return this.renderFragmentPicker(interaction)
  }

  /* ── Mes ventes ── */

  if (interaction.customId === "market_my") {
   const cards = getCards()
   const listings = getUserListings(userId)

   if (listings.length === 0) {
    return interaction.update({ content: "Tu n'as aucune vente active.", embeds: [], components: [] })
   }

   const averages = getAveragePrices()
   const lines = listings.map((l) => formatListing(l, cards, averages))
   const embed = new EmbedBuilder().setTitle("📦 Mes ventes").setDescription(lines.join("\n"))
   const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("market_remove_modal").setLabel("Retirer une vente").setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId("market_back").setLabel("Retour").setStyle(ButtonStyle.Secondary)
   )

   return interaction.update({ embeds: [embed], components: [row] })
  }

  if (interaction.customId === "market_remove_modal") {
   const modal = new ModalBuilder().setCustomId("marketRemoveModal").setTitle("Retirer une vente")
   const input = new TextInputBuilder()
    .setCustomId("listingId")
    .setLabel("ID du listing")
    .setStyle(TextInputStyle.Short)
    .setRequired(true)
   modal.addComponents(new ActionRowBuilder().addComponents(input))
   return interaction.showModal(modal)
  }

  if (interaction.customId === "market_back") {
   return this.execute(interaction)
  }
 },

 /* ══════════════════════════════════════════════════════════
    RENDER MARKET — liste des annonces
 ══════════════════════════════════════════════════════════ */

 async renderMarket(interaction) {
  const userId = interaction.user.id
  const state = marketState[userId]
  const cards = getCards()
  const averages = getAveragePrices()

  const market = getMarket().slice().sort((a, b) => a.price - b.price)
  const start = state.page * PAGE_SIZE
  const slice = market.slice(start, start + PAGE_SIZE)
  const lines = slice.map((l) => formatListing(l, cards, averages))

  const embed = new EmbedBuilder()
   .setTitle("🛒 Marché")
   .setDescription(lines.join("\n") || "Aucune annonce.")
   .setFooter({ text: `Page ${state.page + 1} • ${market.length} annonce(s) au total` })

  const row1 = new ActionRowBuilder().addComponents(
   new ButtonBuilder().setCustomId("market_prev").setEmoji("⬅").setStyle(ButtonStyle.Secondary).setDisabled(state.page === 0),
   new ButtonBuilder().setCustomId("market_next").setEmoji("➡").setStyle(ButtonStyle.Secondary).setDisabled(start + PAGE_SIZE >= market.length)
  )

  const row2 = new ActionRowBuilder().addComponents(
   new ButtonBuilder().setCustomId("market_buy_modal").setLabel("Acheter (ID)").setStyle(ButtonStyle.Success),
   new ButtonBuilder().setCustomId("market_back").setLabel("Retour").setStyle(ButtonStyle.Secondary)
  )

  const payload = { embeds: [embed], components: [row1, row2] }
  if (interaction.isButton()) return interaction.update(payload)
  return interaction.editReply(payload)
 },

 /* ══════════════════════════════════════════════════════════
    RENDER FRAGMENT PICKER — NOUVELLE UX
    Affiche les fragments du joueur dans un select menu.
    Le joueur choisit, ensuite on demande seulement le prix.
 ══════════════════════════════════════════════════════════ */

 async renderFragmentPicker(interaction) {
  const userId = interaction.user.id
  const user = getUser(userId)

  /* Récupère toutes les cartes avec au moins 1 fragment */
  const rows = getFragmentInventoryRows(user).filter((r) => r.ownedCount > 0)

  if (rows.length === 0) {
   const embed = new EmbedBuilder()
    .setTitle("🧩 Vendre un fragment")
    .setDescription("❌ Tu ne possèdes aucun fragment.\n\nOuvre des packs pour en obtenir !")
    .setColor("#e74c3c")

   const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("market_back").setLabel("Retour").setStyle(ButtonStyle.Secondary)
   )

   return interaction.update({ embeds: [embed], components: [row] })
  }

  /* Construit les options du select menu :
   * Une option par (carte × slot possédé), max 25 (limite Discord).
   * Label : "Nom de la carte — Slot 2/5"
   * Description : stock + prix minimum
   * Value : "cardId:fragmentNumber"
   */

  const averages = getAveragePrices()
  const options = []

  for (const row of rows) {
   for (const slotNum of row.numbers) {

    /* Compte combien d'exemplaires de ce slot exact le joueur possède */
    const stock = (user.fragments || []).filter(
     (f) => String(f.cardId) === String(row.cardId) && Number(f.fragmentNumber) === slotNum
    ).length

    const minPrice = getFragmentMinimumPrice(row.cardId, slotNum, averages)
    const cardName = row.card?.name || `Carte #${row.cardId}`
    const label    = `${cardName} — Slot ${slotNum}/5`
    const desc     = `Stock : x${stock} • Prix min : ${minPrice} kamas`

    options.push(
     new StringSelectMenuOptionBuilder()
      .setLabel(label.slice(0, 100))
      .setDescription(desc.slice(0, 100))
      .setValue(`${row.cardId}:${slotNum}`)
      .setEmoji("🧩")
    )

    if (options.length >= 25) break
   }
   if (options.length >= 25) break
  }

  const embed = new EmbedBuilder()
   .setTitle("🧩 Vendre un fragment")
   .setDescription(
`Choisis le fragment à mettre en vente.

Tu peux consulter tes fragments détaillés avec \`/inventaire\` → bouton **Fragments**.`
   )
   .setColor("#9b59b6")
   .setFooter({ text: `${rows.length} carte(s) avec fragment(s) dans ton inventaire` })

  const selectMenu = new StringSelectMenuBuilder()
   .setCustomId("market_fragment_select")
   .setPlaceholder("Choisir un fragment à vendre...")
   .addOptions(options)

  const selectRow = new ActionRowBuilder().addComponents(selectMenu)
  const backRow = new ActionRowBuilder().addComponents(
   new ButtonBuilder().setCustomId("market_back").setLabel("Retour").setStyle(ButtonStyle.Secondary)
  )

  return interaction.update({ embeds: [embed], components: [selectRow, backRow] })
 },

 /* ══════════════════════════════════════════════════════════
    SELECT HANDLER — fragment_select
    Le joueur a choisi son fragment → on sauvegarde le choix
    dans le state et on ouvre le modal prix uniquement.
 ══════════════════════════════════════════════════════════ */

 async select(interaction) {
  if (interaction.customId !== "market_fragment_select") return

  const userId = interaction.user.id

  if (!marketState[userId]) {
   return interaction.reply({
    content: "❌ Menu expiré. Utilise `/market` pour recommencer.",
    flags: 64
   })
  }

  /* Décode "cardId:fragmentNumber" */
  const [cardId, fragmentNumberStr] = interaction.values[0].split(":")
  const fragmentNumber = parseInt(fragmentNumberStr)

  /* Sauvegarde dans le state pour le modal */
  marketState[userId].pendingFragment = { cardId, fragmentNumber }

  /* Affiche le prix minimum en placeholder pour guider le joueur */
  const averages = getAveragePrices()
  const minPrice = getFragmentMinimumPrice(cardId, fragmentNumber, averages)
  const fragmentName = getFragmentDisplayName(cardId, fragmentNumber)

  const modal = new ModalBuilder()
   .setCustomId("marketFragmentPriceModal")
   .setTitle("Vendre un fragment")

  const priceInput = new TextInputBuilder()
   .setCustomId("price")
   .setLabel(`Prix en kamas (min : ${minPrice})`)
   .setPlaceholder(`Ex: ${minPrice}`)
   .setStyle(TextInputStyle.Short)
   .setRequired(true)

  modal.addComponents(new ActionRowBuilder().addComponents(priceInput))

  return interaction.showModal(modal)
 },

 /* ══════════════════════════════════════════════════════════
    MODAL HANDLER
 ══════════════════════════════════════════════════════════ */

 async modal(interaction) {

  /* ── Acheter ── */

  if (interaction.customId === "marketBuyModal") {
   const listingId = parseInt(interaction.fields.getTextInputValue("listingId"))
   const result = buyCard(interaction.user.id, listingId)
   if (result?.error) return interaction.reply({ content: `❌ ${result.error}`, flags: 64 })

   const listing = result?.listing || {}
   const isFragment = getListingType(listing) === "fragment"
   const cards = getCards()
   const card = cards.find((c) => String(c.id) === String(listing.card))
   const itemLabel = isFragment
    ? `🧩 ${getFragmentDisplayName(listing.card, listing.fragmentNumber)}`
    : `${RARITY_EMOJI[card?.rarity || "C"]} ${card?.name || `Carte #${listing.card}`}`
   const priceLabel = Number(listing.price || 0).toLocaleString("fr-FR")

   const user = getUser(interaction.user.id)
   const unlocked = [
    ...achievementCheck(user, "economy"),
    ...achievementCheck(user, "collection"),
    ...achievementCheck(user, "pack"),
    ...achievementCheck(user, "fragment")
   ]

   await interaction.reply({
    content: `✅ Achat confirmé: **${itemLabel}** pour **${priceLabel} kamas**.\n📦 L'objet a été ajouté à ton inventaire.`,
    flags: 64
   })
   if (unlocked.length) await notifyAchievements(interaction, unlocked, user)
   return
  }

  /* ── Vendre carte ── */

  if (interaction.customId === "marketSellModal") {
   await interaction.deferReply({ flags: 64 })
   const cardId = parseInt(interaction.fields.getTextInputValue("cardId"))
   const price  = parseInt(interaction.fields.getTextInputValue("price"))
   if (isNaN(cardId) || isNaN(price)) return interaction.editReply("❌ ID ou prix invalide.")

   const result = addListing(interaction.user.id, cardId, price)
   if (result?.error) return interaction.editReply(`❌ ${result.error}`)

   const user = getUser(interaction.user.id)
   await addBattlePassXP(interaction.user.id, "market_sell")
   const unlocked = achievementCheck(user, "economy")

   await interaction.editReply("🛒 Carte mise en vente.")
   if (unlocked.length) await notifyAchievements(interaction, unlocked, user)
   return
  }

  /* ── Vendre fragment — NOUVELLE UX
   * Le modal ne demande QUE le prix.
   * cardId + fragmentNumber viennent du marketState (sélection précédente).
   */

  if (interaction.customId === "marketFragmentPriceModal") {
   await interaction.deferReply({ flags: 64 })

   const userId = interaction.user.id
   const pending = marketState[userId]?.pendingFragment

   if (!pending) {
    return interaction.editReply("❌ Session expirée. Utilise `/market` → Vendre fragment pour recommencer.")
   }

   const { cardId, fragmentNumber } = pending
   const price = parseInt(interaction.fields.getTextInputValue("price"))

   if (isNaN(price) || price <= 0) {
    return interaction.editReply("❌ Prix invalide.")
   }

   const minPrice = getFragmentMinimumPrice(cardId, fragmentNumber)
   const result = addFragmentListing(userId, cardId, fragmentNumber, price)

   if (result?.error) {
    return interaction.editReply(`❌ ${result.error}\nPrix minimum actuel : **${minPrice}** kamas.`)
   }

   /* Nettoie le state */
   delete marketState[userId].pendingFragment

   const fragmentName = getFragmentDisplayName(cardId, fragmentNumber)
   const user = getUser(userId)
   await addBattlePassXP(userId, "market_sell")
   const unlocked = achievementCheck(user, "fragment")

   await interaction.editReply(
    `🧩 **${fragmentName}** mis en vente pour **${price} kamas**.\nPrix minimum : **${minPrice}** kamas.`
   )
   if (unlocked.length) await notifyAchievements(interaction, unlocked, user)
   return
  }

  /* ── Retirer une vente ── */

  if (interaction.customId === "marketRemoveModal") {
   const listingId = parseInt(interaction.fields.getTextInputValue("listingId"))
   const result = removeListing(interaction.user.id, listingId)
   if (result?.error) return interaction.reply({ content: `❌ ${result.error}`, flags: 64 })
   return interaction.reply({ content: "📦 Vente retirée.", flags: 64 })
  }
 }
}
