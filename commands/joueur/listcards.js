const {
 ActionRowBuilder,
 StringSelectMenuBuilder,
 ButtonBuilder,
 ButtonStyle,
 SlashCommandBuilder,
 EmbedBuilder
} = require("discord.js")

const { RARITY_EMOJI, RARITY_ORDER } = require("../../systems/constants")
const { getCards }  = require("../../systems/cardRegistry")
const { getUser }   = require("../../systems/userSystem")
const {
 isSetUnlocked,
 getUnlockMessage,
 splitSetsByUnlock
} = require("../../systems/setUnlockSystem")

const rarityOrder = Object.fromEntries(
 RARITY_ORDER.map((r, i) => [r, RARITY_ORDER.length - i])
)

const PAGE_SIZE = 15

module.exports = {

 data: new SlashCommandBuilder()
  .setName("listcards")
  .setDescription("Voir les cartes par set"),

 async execute(interaction){

  const cards    = getCards()
  const user     = getUser(interaction.user.id)
  const inventory = user.cards || {}

  if(cards.length === 0)
   return interaction.reply({
    content: "❌ Aucune carte disponible.",
    flags:   64
   })

  /* ─── Construction de la liste des sets ─────────────────────────────── */

  const rawSets = [...new Set(cards.map(c => c.set))].map(id => ({ id }))
  const { unlocked, locked } = splitSetsByUnlock(rawSets, user, cards)

  /* Options du menu — débloqués en premier, puis verrouillés */
  const menuOptions = [
   ...unlocked.map(set => ({
    label: set.id,
    value: set.id
   })),
   ...locked.map(set => ({
    label: `🔒 ${set.id}`,
    value: set.id
   }))
  ].slice(0, 25)

  const menu = new StringSelectMenuBuilder()
   .setCustomId("listcards_select")
   .setPlaceholder("Choisir un set")
   .addOptions(menuOptions)

  const menuRow = new ActionRowBuilder().addComponents(menu)

  /* ─── Embed récap sets ───────────────────────────────────────────────── */

  const unlockedLines = unlocked.map(s => {
   const count = cards.filter(c => c.set === s.id).length
   const owned = cards.filter(c => c.set === s.id && inventory[c.id]).length
   const pct   = count > 0 ? Math.floor(owned / count * 100) : 0
   return `✅ **${s.id}** — ${owned}/${count} (${pct}%)`
  })

  const lockedLines = locked.map(s => {
   const count = cards.filter(c => c.set === s.id).length
   const info  = getUnlockMessage(user, s.id, cards)
   /* Compact : juste la première condition */
   const hint  = info ? info.split("\n")[1] || "" : ""
   return `🔒 **${s.id}** — ${count} cartes · ${hint.replace("• ", "").trim()}`
  })

  const descLines = []
  if(unlockedLines.length) descLines.push("**Sets débloqués**", ...unlockedLines)
  if(lockedLines.length)   descLines.push("", "**Sets verrouillés**", ...lockedLines)

  const setsEmbed = new EmbedBuilder()
   .setTitle("📦 Sets de cartes")
   .setDescription(descLines.join("\n") || "Aucun set.")
   .setColor(0xF1C40F)

  const linkRow = new ActionRowBuilder().addComponents(
   new ButtonBuilder()
    .setLabel("Voir sur le site")
    .setEmoji("🌐")
    .setStyle(ButtonStyle.Link)
    .setURL("https://www.krosmozcard.fr/cards")
  )

  await interaction.reply({
   embeds:     [setsEmbed],
   components: [menuRow, linkRow],
   flags:      64
  })

  const msg = await interaction.fetchReply()

  const collector = msg.createMessageComponentCollector({ time: 120000 })

  let page       = 0
  let selectedSet = null
  let setCards    = []

  collector.on("collect", async i => {

   if(i.user.id !== interaction.user.id)
    return i.reply({ content: "Pas pour toi.", flags: 64 })

   if(i.customId === "listcards_select"){

    selectedSet = i.values[0]

    /* ── Vérification déblocage ── */
    if(!isSetUnlocked(user, selectedSet, cards)){
     const lockMsg = getUnlockMessage(user, selectedSet, cards)
     return i.reply({ content: lockMsg || "🔒 Ce set est verrouillé.", flags: 64 })
    }

    setCards = cards
     .filter(c => c.set === selectedSet)
     .sort((a, b) => {
      const ra = rarityOrder[a.rarity] || 0
      const rb = rarityOrder[b.rarity] || 0
      if(rb !== ra) return rb - ra
      return a.id - b.id
     })

    page = 0
   }

   if(i.customId === "list_next") page++
   if(i.customId === "list_prev") page--

   if(i.customId === "list_back"){
    selectedSet = null
    page = 0
   }

   if(!selectedSet){
    return i.update({
     embeds:     [setsEmbed],
     components: [menuRow, linkRow]
    })
   }

   const totalPages = Math.max(1, Math.ceil(setCards.length / PAGE_SIZE))
   page = Math.max(0, Math.min(page, totalPages - 1))

   const start = page * PAGE_SIZE
   const slice = setCards.slice(start, start + PAGE_SIZE)

   const lines = slice.map(c => {
    const emoji = RARITY_EMOJI[c.rarity] || ""
    const owned = inventory[c.id] ? "✅" : "❌"
    return `${owned} #${c.id} • ${emoji} **${c.name}**`
   })

   /* Stat complétion du set */
   const totalSet  = setCards.length
   const ownedSet  = setCards.filter(c => inventory[c.id]).length
   const pctSet    = totalSet > 0 ? Math.floor(ownedSet / totalSet * 100) : 0

   const cardsEmbed = new EmbedBuilder()
    .setTitle(`📦 Set : ${selectedSet}`)
    .setDescription(lines.join("\n") || "Aucune carte.")
    .setFooter({
     text: `📚 ${ownedSet}/${totalSet} (${pctSet}%) · Page ${page + 1}/${totalPages}`
    })
    .setColor(0x3498DB)

   const buttons = new ActionRowBuilder().addComponents(

    new ButtonBuilder()
     .setCustomId("list_prev")
     .setLabel("⬅")
     .setStyle(ButtonStyle.Secondary)
     .setDisabled(page === 0),

    new ButtonBuilder()
     .setCustomId("list_next")
     .setLabel("➡")
     .setStyle(ButtonStyle.Secondary)
     .setDisabled(page === totalPages - 1),

    new ButtonBuilder()
     .setCustomId("list_back")
     .setLabel("Retour aux sets")
     .setStyle(ButtonStyle.Danger)

   )

   await i.update({
    embeds:     [cardsEmbed],
    components: [buttons]
   })

  })

 }

}