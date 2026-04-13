const fs = require("fs")
const path = require("path")

const {
 SlashCommandBuilder,
 EmbedBuilder,
 ActionRowBuilder,
 ButtonBuilder,
 ButtonStyle,
 ModalBuilder,
 TextInputBuilder,
 TextInputStyle
} = require("discord.js")

const { CARDS_IMAGES_DIR } = require("../../systems/dataManager")
const { getBasePath } = require("../../systems/paths")
const { readJsonSafe } = require("../../systems/fileUtils")
const { RARITY_EMOJI, SELL_PRICE } = require("../../systems/constants")
const { isSecretCard } = require("../../systems/secretCard")

const { addListing } = require("../../systems/market")
const { getUser, save } = require("../../systems/userSystem")
const CARDS_PATH = path.join(getBasePath(), "cards.json")

function loadCardsFromDisk() {
 const cards = readJsonSafe(CARDS_PATH, [])
 return Array.isArray(cards) ? cards : []
}

function getCardsByIdFromDisk() {
 const cards = loadCardsFromDisk()
 return Object.fromEntries(cards.map((c) => [String(c.id), c]))
}

/* ═══════════════════════════════════════════════════════════════
   /carte — Afficher une carte avec options vendre / market
   
   MODIFIÉ :
   - Supprimé les constantes locales rarityEmoji et rarityPrice
     → utilise RARITY_EMOJI et SELL_PRICE depuis constants.js
   - save() → save(interaction.user.id) (dirty save ciblé)
   - Ajout de collector.on("end") pour désactiver les boutons
   - Support shiny (affichage doré si le joueur possède une version shiny)
═══════════════════════════════════════════════════════════════ */

module.exports = {

 data: new SlashCommandBuilder()
  .setName("carte")
  .setDescription("Afficher une carte")
  .addStringOption(option =>
   option.setName("nom").setDescription("Nom de la carte")
  )
  .addIntegerOption(option =>
   option.setName("id").setDescription("ID de la carte")
  ),

 async execute(interaction) {

  try {
   if (!interaction.deferred && !interaction.replied) {
    await interaction.deferReply()
   }
  } catch (err) {
   if (err?.code === 10062 || err?.code === 40060) return
   throw err
  }

  const cards = loadCardsFromDisk()
  if (!Array.isArray(cards) || !cards.length) {
   return interaction.editReply("❌ Aucune carte disponible (cards.json vide ou invalide).")
  }
  const allCards = cards
  const cardsById = Object.fromEntries(cards.map((c) => [String(c.id), c]))

  const user = getUser(interaction.user.id)

  const name = interaction.options.getString("nom")
  const id = interaction.options.getInteger("id")

  let card

  if (id) {
   const matches = allCards.filter(c => String(c.id) === String(id))

   if (!matches.length) {
    return interaction.editReply("❌ Carte introuvable.")
   }

   if (matches.length > 1) {
    const preview = matches
     .slice(0, 5)
     .map((c) => `- ${c.name} (${c.rarity}, set:${c.set})`)
     .join("\n")

    return interaction.editReply(
`❌ ID dupliqué détecté (#${id}).
${matches.length} cartes partagent cet ID.
Impossible d'afficher une carte unique.

Conflits:
${preview}`
    )
   }

   card = matches[0]
  }

  else if (name) {

   card = cards.find(c =>
    c.name.toLowerCase().includes(name.toLowerCase())
   )

  }

  else
   return interaction.editReply("❌ Tu dois préciser `nom` ou `id`.")

  if (!card)
   return interaction.editReply("❌ Carte introuvable.")

  const sameIdCards = allCards.filter(c => String(c.id) === String(card.id))
  if (sameIdCards.length > 1) {
   const preview = sameIdCards
    .slice(0, 5)
    .map((c) => `- ${c.name} (${c.rarity}, set:${c.set})`)
    .join("\n")

   return interaction.editReply(
`❌ ID dupliqué détecté (#${card.id}).
${sameIdCards.length} cartes partagent cet ID.
Conflits:
${preview}`
   )
  }

  const count = user.cards?.[card.id] || 0

  /* ── Shiny detection ── */

  const shinyCount = user.shinyCards?.[card.id] || 0
  const isShiny = shinyCount > 0

  const titleEmoji = isShiny ? "✨" : RARITY_EMOJI[card.rarity]
  const titleSuffix = isShiny ? " ✨ SHINY" : ""

  let description =
`🆔 ID : ${card.id}
⭐ Rareté : ${card.rarity}
📚 Set : ${card.set}
📦 Possédé : x${count}`

  if (isShiny) {
   description += `\n\n✨ **Version Shiny** : x${shinyCount}`
  }

  const embed = new EmbedBuilder()
   .setTitle(`${titleEmoji} ${card.name}${titleSuffix}`)
   .setDescription(description)

  if (isShiny) {
   embed.setColor("#FFD700")
  }

  const filePath = `${CARDS_IMAGES_DIR}/${card.set}/${card.image}`

  let files = []

  if (fs.existsSync(filePath)) {
   embed.setImage(`attachment://${card.image}`)
   files = [{ attachment: filePath, name: card.image }]
  } else {
   embed.setFooter({ text: "Image manquante" })
  }

  const isSecret = isSecretCard(card)
  const row = isSecret
   ? new ActionRowBuilder().addComponents(
    new ButtonBuilder()
     .setCustomId(`secret_locked_${card.id}`)
     .setLabel("🔒 Carte SECRET non echangeable")
     .setStyle(ButtonStyle.Secondary)
     .setDisabled(true)
   )
   : new ActionRowBuilder().addComponents(
    new ButtonBuilder()
     .setCustomId(`sell_${card.id}`)
     .setLabel("💰 Vendre")
     .setStyle(ButtonStyle.Danger),

    new ButtonBuilder()
     .setCustomId(`market_${card.id}`)
     .setLabel("🛒 Mettre au market")
     .setStyle(ButtonStyle.Primary)
   )

  await interaction.editReply({
   embeds: [embed],
   components: [row],
   files: files
  })
  const msg = await interaction.fetchReply()

  const collector = msg.createMessageComponentCollector({ time: 60000 })

  collector.on("collect", async i => {

   if (i.user.id !== interaction.user.id)
    return i.reply({ content: "Pas ta carte.", flags: 64 })

   /* ---------------- SELL ---------------- */

   if (i.customId.startsWith("sell_")) {

    const cid = i.customId.split("_")[1]

    if (!user.cards[cid])
     return i.reply({ content: "❌ Tu ne possèdes plus cette carte.", flags: 64 })

   const soldCard = cardsById[cid]
   if (isSecretCard(soldCard))
    return i.reply({ content: "❌ La carte SECRET ne peut pas etre vendue.", flags: 64 })

    /* FIX : utilise SELL_PRICE (prix vente au bot) au lieu du prix market */
    const price = SELL_PRICE[soldCard.rarity] || 1

    user.cards[cid]--

    if (user.cards[cid] === 0)
     delete user.cards[cid]

    user.kamas += price

    if (!user.stats) user.stats = {}
    user.stats.cardsSold = (user.stats.cardsSold || 0) + 1

    /* FIX : save ciblé par userId */
    save(interaction.user.id)

    return i.reply(`💰 Carte vendue : **${soldCard.name}**\nGain : **${price} kamas**`)
   }

   /* ---------------- MARKET BUTTON ---------------- */

   if (i.customId.startsWith("market_")) {

    const cid = i.customId.split("_")[1]

   if (!user.cards[cid])
    return i.reply({ content: "❌ Tu ne possèdes plus cette carte.", flags: 64 })
   const marketCard = cardsById[cid]
   if (isSecretCard(marketCard))
    return i.reply({ content: "❌ La carte SECRET ne peut pas etre mise au market.", flags: 64 })

    const modal = new ModalBuilder()
     .setCustomId(`marketmodal_${cid}`)
     .setTitle("Mettre en vente")

    const priceInput = new TextInputBuilder()
     .setCustomId("price")
     .setLabel("Prix de vente")
     .setStyle(TextInputStyle.Short)
     .setRequired(true)

    modal.addComponents(
     new ActionRowBuilder().addComponents(priceInput)
    )

    await i.showModal(modal)

   }

  })

  /* FIX : retire les boutons quand le collector expire (60s) */
  collector.on("end", () => {
   msg.edit({ components: [] }).catch(() => {})
  })

 },

 /* ---------------- MODAL HANDLER ---------------- */

 async modal(interaction) {

  if (!interaction.customId.startsWith("marketmodal_")) return

  const cid = interaction.customId.split("_")[1]

  const price = parseInt(interaction.fields.getTextInputValue("price"))

  if (isNaN(price) || price <= 0)
   return interaction.reply({
    content: "❌ Prix invalide.",
    flags: 64
   })

  const user = getUser(interaction.user.id)
  const cardsById = getCardsByIdFromDisk()
  const modalCard = cardsById[cid]

  if (!user.cards[cid])
   return interaction.reply({
    content: "❌ Tu ne possèdes plus cette carte.",
    flags: 64
   })
  if (isSecretCard(modalCard))
   return interaction.reply({
    content: "❌ La carte SECRET ne peut pas etre mise au market.",
    flags: 64
   })

  const result = addListing(
   interaction.user.id,
   parseInt(cid),
   price
  )

  if (result?.error)
   return interaction.reply({
    content: `❌ ${result.error}`,
    flags: 64
   })

  /* FIX : save ciblé par userId */
  save(interaction.user.id)

  return interaction.reply({
   content: `🛒 Carte mise en vente pour **${price} kamas**.`,
   flags: 64
  })

 }

}
