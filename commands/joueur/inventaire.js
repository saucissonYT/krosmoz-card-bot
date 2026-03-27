const {
 SlashCommandBuilder,
 EmbedBuilder,
 ActionRowBuilder,
 ButtonBuilder,
 ButtonStyle
} = require("discord.js")

const { getCardsById } = require("../../systems/cardRegistry")
const { getUser, save } = require("../../systems/userSystem")
const { achievementCheck } = require("../../systems/achievementCheck")
const { notifyAchievements } = require("../../systems/achievementNotifier")
const { loadSets } = require("../../systems/setSystemFile")
const {
 getFragmentInventoryRows,
 buildProgressBar
} = require("../../systems/fragmentService")

const { RARITY_EMOJI, RARITY_ORDER } = require("../../systems/constants")

const rarityOrderMap = Object.fromEntries(
 RARITY_ORDER.map((r, i) => [r, i + 1])
)

module.exports = {

 data: new SlashCommandBuilder()
  .setName("inventaire")
  .setDescription("Voir ton inventaire")
  .addStringOption(o =>
   o.setName("mode")
    .setDescription("Choisir entre cartes et fragments")
    .setRequired(false)
    .addChoices(
     { name:"Cartes", value:"cartes" },
     { name:"Fragments", value:"fragments" }
    )
  )
  .addStringOption(o =>
   o.setName("rarete")
    .setDescription("Filtrer par rareté")
    .setRequired(false)
    .addChoices(
     { name:"C", value:"C" },
     { name:"U", value:"U" },
     { name:"R", value:"R" },
     { name:"SR", value:"SR" },
     { name:"HR", value:"HR" },
     { name:"UR", value:"UR" },
     { name:"S", value:"S" },
     { name:"SSR", value:"SSR" }
    )
  ),

 async execute(interaction){

  await interaction.deferReply()

  const cardsById = getCardsById()
  const user = getUser(interaction.user.id)

  if(!user.cards) user.cards = {}
  if(!user.stats) user.stats = {}

  /* ---- Mode actif (cartes ou fragments) ---- */

  let currentMode = interaction.options.getString("mode") || "cartes"

  /* ---- Chargement dynamique des sets ---- */

  const rawSets = loadSets()
  const sets = Array.isArray(rawSets) ? rawSets : rawSets?.sets || []

  const setOrderMap = Object.fromEntries(
   sets.map((s, i) => [s.id, i])
  )

  /* ====================================================
   * ÉTAT VUE FRAGMENTS
   * ==================================================== */

  let fragSetFilter = null
  let fragPage = 1
  const fragPerPage = 10

  function buildFragments(){

   const allRows = getFragmentInventoryRows(user)

   /* Filtre par set si actif */
   const rows = fragSetFilter
    ? allRows.filter(row => row.card?.set === fragSetFilter)
    : allRows

   const totalPages = Math.max(1, Math.ceil(rows.length / fragPerPage))
   fragPage = Math.max(1, Math.min(fragPage, totalPages))
   const slice = rows.slice((fragPage - 1) * fragPerPage, fragPage * fragPerPage)

   const lines = slice.map((row) => {
    const craftTag = row.canCraft ? " [Crafter]" : ""
    const owned = row.numbers.length ? row.numbers.join(", ") : "-"
    const missing = row.missing.length ? row.missing.join(", ") : "-"
    return `${row.card?.name || row.cardId} (${row.ownedCount}/5) • stock:${row.totalCount}${craftTag}
Possedes: ${owned}
Manquants: ${missing}`
   })

   const craftableNow = allRows.filter((row) => row.canCraft).length
   const totalFragments = (user.fragments || []).length
   const activeSetName = fragSetFilter ? sets.find(s => s.id === fragSetFilter)?.name : null

   const footerParts = [
    `Page ${fragPage}/${totalPages}`,
    `${totalFragments} fragments`,
    `${craftableNow} craftable(s)`
   ]
   if(activeSetName) footerParts.push(`🗂️ ${activeSetName}`)

   const embed = new EmbedBuilder()
    .setTitle(`🧩 Fragments de ${interaction.user.username}`)
    .setDescription(lines.join("\n") || "Aucun fragment.")
    .setFooter({ text: footerParts.join(" • ") })

   /* ---- ROW 1 : Navigation + Reset + Switch Cartes ---- */

   const nav = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId("frag_prev").setEmoji("⬅").setStyle(ButtonStyle.Secondary).setDisabled(fragPage === 1),
    new ButtonBuilder().setCustomId("frag_page").setLabel(`${fragPage}/${totalPages}`).setStyle(ButtonStyle.Secondary).setDisabled(true),
    new ButtonBuilder().setCustomId("frag_next").setEmoji("➡").setStyle(ButtonStyle.Secondary).setDisabled(fragPage === totalPages),
    new ButtonBuilder().setCustomId("frag_reset").setLabel("Reset").setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId("switch_cartes").setLabel("Cartes").setEmoji("🎴").setStyle(ButtonStyle.Primary)
   )

   /* ---- ROW 2 : Filtres par Set (dynamique) ---- */

   const components = [nav]

   const displaySets = sets.slice(0, 5)
   if(displaySets.length > 0){
    const setRow = new ActionRowBuilder()
    displaySets.forEach(s => {
     setRow.addComponents(
      new ButtonBuilder()
       .setCustomId(`fragset_${s.id}`)
       .setLabel(s.name)
       .setStyle(fragSetFilter === s.id ? ButtonStyle.Success : ButtonStyle.Secondary)
     )
    })
    components.push(setRow)
   }

   return { embed, components }

  }

  /* ====================================================
   * ÉTAT VUE CARTES
   * ==================================================== */

  user.stats.inventoryOpen = (user.stats.inventoryOpen || 0) + 1

  const unlocked = achievementCheck(user, "inventory")

  const rarityFilter = interaction.options.getString("rarete")

  let inventory = []
  let cleaned = false

  for(const id in user.cards){

   const card = cardsById[String(id)]

   if(!card){
    delete user.cards[id]
    cleaned = true
    continue
   }

   inventory.push({
    card,
    count: user.cards[id]
   })

  }

  if(cleaned) save()

  if(rarityFilter)
   inventory = inventory.filter(e => e.card.rarity === rarityFilter)

  /* ---- État des filtres et tri ---- */

  let filter = null
  let setFilter = null
  let sort = "id"
  let doublonsOnly = false

  const perPage = 20
  let page = 1

  const shinyCards = user.shinyCards || {}

  /* ---- Application des filtres et tri ---- */

  function applyFilters(){

   let list = [...inventory]

   /* Filtre par rareté (boutons rareté) */
   if(filter)
    list = list.filter(e => e.card.rarity === filter)

   /* Filtre par set (boutons set) */
   if(setFilter)
    list = list.filter(e => e.card.set === setFilter)

   /* Filtre doublons uniquement */
   if(doublonsOnly)
    list = list.filter(e => e.count >= 2)

   /* Tri */
   if(sort === "name")
    list.sort((a, b) => a.card.name.localeCompare(b.card.name))

   if(sort === "rarity")
    list.sort((a, b) => rarityOrderMap[b.card.rarity] - rarityOrderMap[a.card.rarity])

   if(sort === "count")
    list.sort((a, b) => b.count - a.count)

   if(sort === "set")
    list.sort((a, b) => {

     const sa = setOrderMap[a.card.set] ?? 999
     const sb = setOrderMap[b.card.set] ?? 999

     if(sa !== sb) return sa - sb

     /* Dans le même set, tri par rareté décroissante puis ID */
     const ra = rarityOrderMap[a.card.rarity] || 0
     const rb = rarityOrderMap[b.card.rarity] || 0

     if(rb !== ra) return rb - ra

     return a.card.id - b.card.id

    })

   return list

  }

  /* ---- Construction de l'embed et des boutons ---- */

  function buildCartes(){

   if(inventory.length === 0){
    return {
     embed: new EmbedBuilder()
      .setTitle(`🎴 Inventaire de ${interaction.user.username}`)
      .setDescription("📦 Inventaire vide."),
     components: []
    }
   }

   const data = applyFilters()

   const totalPages = Math.max(1, Math.ceil(data.length / perPage))

   page = Math.max(1, Math.min(page, totalPages))

   const start = (page - 1) * perPage

   const slice = data.slice(start, start + perPage)

   const lines = slice.map(e => {

    const emoji = RARITY_EMOJI[e.card.rarity] || ""

    const shinyCount = shinyCards[e.card.id] || 0
    const shinyTag = shinyCount > 0 ? ` ✨(${shinyCount})` : ""

    /* Nom du set entre crochets */
    const setName = sets.find(s => s.id === e.card.set)?.name || e.card.set

    return `#${e.card.id} • ${emoji} ${e.card.name} • [${setName}] • x${e.count}${shinyTag}`

   })

   /* Stats pour le footer */
   const totalShinyUnique = Object.keys(shinyCards).length
   const totalShinyAll = Object.values(shinyCards).reduce((a, b) => a + b, 0)

   const uniqueOwned = Object.keys(user.cards).length
   const totalOwned = Object.values(user.cards).reduce((a, b) => a + b, 0)

   let footerParts = [
    `${data.length} résultats`,
    `Page ${page}/${totalPages}`,
    `${uniqueOwned} uniques / ${totalOwned} total`
   ]

   if(totalShinyAll > 0)
    footerParts.push(`✨ ${totalShinyAll} shiny (${totalShinyUnique} uniques)`)

   if(doublonsOnly)
    footerParts.push("🔄 Doublons")

   const embed = new EmbedBuilder()
    .setTitle(`🎴 Inventaire de ${interaction.user.username}`)
    .setDescription(lines.join("\n") || "Aucune carte.")
    .setFooter({ text: footerParts.join(" • ") })

   /* ---- ROW 1 : Navigation + Doublons + Reset ---- */

   const nav = new ActionRowBuilder().addComponents(

    new ButtonBuilder()
     .setCustomId("prev")
     .setEmoji("⬅")
     .setStyle(ButtonStyle.Secondary)
     .setDisabled(page === 1),

    new ButtonBuilder()
     .setCustomId("page_info")
     .setLabel(`${page}/${totalPages}`)
     .setStyle(ButtonStyle.Secondary)
     .setDisabled(true),

    new ButtonBuilder()
     .setCustomId("next")
     .setEmoji("➡")
     .setStyle(ButtonStyle.Secondary)
     .setDisabled(page === totalPages),

    new ButtonBuilder()
     .setCustomId("toggle_doublons")
     .setLabel("Doublons")
     .setEmoji("🔄")
     .setStyle(doublonsOnly ? ButtonStyle.Success : ButtonStyle.Secondary),

    new ButtonBuilder()
     .setCustomId("filter_clear")
     .setLabel("Reset")
     .setStyle(ButtonStyle.Danger)

   )

   /* ---- ROW 2 : Tri (Nom, Rareté, Quantité, Set) + Switch Fragments ---- */

   const sortRow = new ActionRowBuilder().addComponents(

    new ButtonBuilder()
     .setCustomId("sort_name")
     .setLabel("Nom")
     .setStyle(sort === "name" ? ButtonStyle.Success : ButtonStyle.Primary),

    new ButtonBuilder()
     .setCustomId("sort_rarity")
     .setLabel("Rareté")
     .setStyle(sort === "rarity" ? ButtonStyle.Success : ButtonStyle.Primary),

    new ButtonBuilder()
     .setCustomId("sort_count")
     .setLabel("Quantité")
     .setStyle(sort === "count" ? ButtonStyle.Success : ButtonStyle.Primary),

    new ButtonBuilder()
     .setCustomId("sort_set")
     .setLabel("Set")
     .setStyle(sort === "set" ? ButtonStyle.Success : ButtonStyle.Primary),

    new ButtonBuilder()
     .setCustomId("switch_fragments")
     .setLabel("Fragments")
     .setEmoji("🧩")
     .setStyle(ButtonStyle.Secondary)

   )

   /* ---- ROW 3 : Filtres rareté 1 (C, U, R, SR) ---- */

   const rarityRow1 = new ActionRowBuilder()

   ;["C", "U", "R", "SR"].forEach(r => {
    rarityRow1.addComponents(
     new ButtonBuilder()
      .setCustomId(`filter_${r}`)
      .setLabel(r)
      .setStyle(filter === r ? ButtonStyle.Success : ButtonStyle.Secondary)
    )
   })

   /* ---- ROW 4 : Filtres rareté 2 (HR, UR, S, SSR) ---- */

   const rarityRow2 = new ActionRowBuilder()

   ;["HR", "UR", "S", "SSR"].forEach(r => {
    rarityRow2.addComponents(
     new ButtonBuilder()
      .setCustomId(`filter_${r}`)
      .setLabel(r)
      .setStyle(filter === r ? ButtonStyle.Success : ButtonStyle.Secondary)
    )
   })

   /* ---- ROW 5 : Filtres par Set (dynamique) ---- */

   const setRow = new ActionRowBuilder()

   /* Maximum 5 boutons par row (limite Discord) */
   const displaySets = sets.slice(0, 5)

   displaySets.forEach(s => {
    setRow.addComponents(
     new ButtonBuilder()
      .setCustomId(`setfilter_${s.id}`)
      .setLabel(s.name)
      .setStyle(setFilter === s.id ? ButtonStyle.Success : ButtonStyle.Secondary)
    )
   })

   return {
    embed,
    components: [nav, sortRow, rarityRow1, rarityRow2, setRow]
   }

  }

  /* ====================================================
   * DISPATCH
   * ==================================================== */

  function build(){
   return currentMode === "fragments" ? buildFragments() : buildCartes()
  }

  /* ---- Envoi initial ---- */

  const built = build()

  await interaction.editReply({
   embeds: [built.embed],
   components: built.components
  })

  const msg = await interaction.fetchReply()

  if(unlocked.length)
   await notifyAchievements(interaction, unlocked)

  /* ---- Collector d'interactions ---- */

  const collector = msg.createMessageComponentCollector({
   time: 120000
  })

  collector.on("collect", async i => {

   if(i.user.id !== interaction.user.id)
    return i.reply({
     content: "Pas ton inventaire.",
     flags: 64
    })

   /* ---- Switch de mode ---- */

   if(i.customId === "switch_fragments"){
    currentMode = "fragments"
    fragPage = 1
   }

   else if(i.customId === "switch_cartes"){
    currentMode = "cartes"
    page = 1
   }

   /* ---- Navigation cartes ---- */

   else if(i.customId === "next") page++
   else if(i.customId === "prev") page--

   /* ---- Tri ---- */

   else if(i.customId === "sort_name") sort = "name"
   else if(i.customId === "sort_rarity") sort = "rarity"
   else if(i.customId === "sort_count") sort = "count"
   else if(i.customId === "sort_set") sort = "set"

   /* ---- Filtre rareté (toggle : reclique = désactive) ---- */

   else if(i.customId.startsWith("filter_") && i.customId !== "filter_clear"){
    const r = i.customId.split("_")[1]
    filter = (filter === r) ? null : r
    page = 1
   }

   /* ---- Filtre set cartes (toggle : reclique = désactive) ---- */

   else if(i.customId.startsWith("setfilter_")){
    const s = i.customId.replace("setfilter_", "")
    setFilter = (setFilter === s) ? null : s
    page = 1
   }

   /* ---- Toggle doublons ---- */

   else if(i.customId === "toggle_doublons"){
    doublonsOnly = !doublonsOnly
    page = 1
   }

   /* ---- Reset cartes ---- */

   else if(i.customId === "filter_clear"){
    filter = null
    setFilter = null
    doublonsOnly = false
    sort = "id"
    page = 1
   }

   /* ---- Navigation fragments ---- */

   else if(i.customId === "frag_next") fragPage++
   else if(i.customId === "frag_prev") fragPage--

   /* ---- Filtre set fragments (toggle) ---- */

   else if(i.customId.startsWith("fragset_")){
    const s = i.customId.replace("fragset_", "")
    fragSetFilter = (fragSetFilter === s) ? null : s
    fragPage = 1
   }

   /* ---- Reset fragments ---- */

   else if(i.customId === "frag_reset"){
    fragSetFilter = null
    fragPage = 1
   }

   const rebuilt = build()

   await i.update({
    embeds: [rebuilt.embed],
    components: rebuilt.components
   })

  })

 }

}