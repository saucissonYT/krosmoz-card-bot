/* ═══════════════════════════════════════════════════════════════
   /listcards — Afficher les cartes par set avec pagination

   MODIFICATIONS :
   - Supprimé les constantes locales `rarityEmoji` et `rarityOrder`
     → utilise `RARITY_EMOJI` et `RARITY_ORDER` depuis constants.js
   - Ajout de JSDoc sur les fonctions et le module
   - collector.on("end") pour désactiver les composants après timeout
═══════════════════════════════════════════════════════════════ */

const {
 ActionRowBuilder,
 StringSelectMenuBuilder,
 ButtonBuilder,
 ButtonStyle,
 SlashCommandBuilder,
 EmbedBuilder
} = require("discord.js")
const path = require("path")

const { getBasePath }                 = require("../../systems/paths")
const { readJsonSafe }                = require("../../systems/fileUtils")
const { getUser }                     = require("../../systems/userSystem")
const { RARITY_EMOJI, RARITY_ORDER } = require("../../systems/constants")

const CARDS_PATH = path.join(getBasePath(), "cards.json")

/**
 * Mapping rareté → poids numérique pour le tri décroissant.
 * Construit dynamiquement depuis RARITY_ORDER pour rester synchronisé.
 * @type {Object<string, number>}
 */
const rarityWeight = {}
RARITY_ORDER.forEach((r, i) => { rarityWeight[r] = i + 1 })

const PAGE_SIZE = 15

module.exports = {

 data: new SlashCommandBuilder()
  .setName("listcards")
  .setDescription("Voir les cartes par set"),

 /**
  * Affiche un menu de sélection des sets, puis la liste paginée
  * des cartes du set choisi avec indicateur de possession.
  * @param {import("discord.js").ChatInputCommandInteraction} interaction
  */
 async execute(interaction) {

  try {
   if (!interaction.deferred && !interaction.replied) {
    await interaction.deferReply({ flags: 64 })
   }
  } catch (err) {
   if (err?.code === 10062 || err?.code === 40060) return
   throw err
  }

  const cards     = readJsonSafe(CARDS_PATH, [])
  const user      = getUser(interaction.user.id)
  const inventory = user.cards || {}

  if (!Array.isArray(cards) || cards.length === 0)
   return interaction.editReply("❌ Aucune carte disponible.")

  /* ---------- SETS ---------- */

  const sets = [...new Set(cards.map(c => c.set))]

  const menu = new StringSelectMenuBuilder()
   .setCustomId("listcards_select")
   .setPlaceholder("Choisir un set")
   .addOptions(
    sets.map(set => ({
     label: set,
     value: set
    }))
   )

  const menuRow = new ActionRowBuilder().addComponents(menu)

  const setsEmbed = new EmbedBuilder()
   .setTitle("📦 Sets disponibles")
   .setDescription(
    sets.map(s => {
     const count = cards.filter(c => c.set === s).length
     return `• **${s}** (${count} cartes)`
    }).join("\n")
   )
   .setColor(0xF1C40F)

  await interaction.editReply({
   embeds: [setsEmbed],
   components: [menuRow],
  })

  const msg = await interaction.fetchReply()

  const collector = msg.createMessageComponentCollector({
   time: 120000
  })

  let page        = 0
  let selectedSet  = null
  let setCards     = []

  collector.on("collect", async i => {

   if (i.user.id !== interaction.user.id)
    return i.reply({
     content: "Pas pour toi.",
     flags: 64
    })

   if (i.customId === "listcards_select") {

    selectedSet = i.values[0]

    setCards = cards
     .filter(c => c.set === selectedSet)
     .sort((a, b) => {
      const ra = rarityWeight[a.rarity] || 0
      const rb = rarityWeight[b.rarity] || 0
      if (rb !== ra) return rb - ra
      return a.id - b.id
     })

    page = 0
   }

   if (i.customId === "list_next") page++
   if (i.customId === "list_prev") page--

   if (i.customId === "list_back") {
    selectedSet = null
    page = 0
   }

   if (!selectedSet) {
    return i.update({
     embeds: [setsEmbed],
     components: [menuRow]
    })
   }

   const totalPages = Math.max(1, Math.ceil(setCards.length / PAGE_SIZE))

   page = Math.max(0, Math.min(page, totalPages - 1))

   const start = page * PAGE_SIZE
   const slice = setCards.slice(start, start + PAGE_SIZE)

   const lines = slice.map(c => {

    const emoji = RARITY_EMOJI[c.rarity] || ""
    const owned = inventory[c.id]
     ? `✅ x${inventory[c.id]}`
     : "❌"

    return `${emoji} **${c.name}** (${c.rarity}) — ${owned}`
   })

   const listEmbed = new EmbedBuilder()
    .setTitle(`📚 ${selectedSet}`)
    .setDescription(lines.join("\n") || "Aucune carte.")
    .setFooter({ text: `Page ${page + 1}/${totalPages} • ${setCards.length} cartes` })
    .setColor(0x3498DB)

   const navRow = new ActionRowBuilder().addComponents(

    new ButtonBuilder()
     .setCustomId("list_prev")
     .setEmoji("⬅")
     .setStyle(ButtonStyle.Secondary)
     .setDisabled(page === 0),

    new ButtonBuilder()
     .setCustomId("list_back")
     .setLabel("Sets")
     .setStyle(ButtonStyle.Primary),

    new ButtonBuilder()
     .setCustomId("list_next")
     .setEmoji("➡")
     .setStyle(ButtonStyle.Secondary)
     .setDisabled(page >= totalPages - 1)
   )

   return i.update({
    embeds: [listEmbed],
    components: [navRow]
   })
  })

  /* Désactive les composants après expiration du collector */
  collector.on("end", () => {
   msg.edit({ components: [] }).catch(() => {})
  })

 }

}
