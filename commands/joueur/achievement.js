const {
 EmbedBuilder,
 ActionRowBuilder,
 ButtonBuilder,
 ButtonStyle,
 StringSelectMenuBuilder,
 StringSelectMenuOptionBuilder
} = require("discord.js")

const achievements = require("../../systems/achievementRegistry")
const { getUser } = require("../../systems/userSystem")

/* =============================================
   /achievements — Liste des succès
   Tri par catégorie + pagination + Battle Pass
============================================= */

/* ---- Catégories jeu principal ---- */
const CATEGORIES = [
 { id:"all",        label:"Tous (jeu)",   emoji:"🏆" },
 { id:"pack",       label:"Packs",        emoji:"📦" },
 { id:"rng",        label:"RNG",          emoji:"🎲" },
 { id:"collection", label:"Collection",   emoji:"📚" },
 { id:"economy",    label:"Économie",     emoji:"💰" },
 { id:"fusion",     label:"Fusion",       emoji:"🔧" },
 { id:"daily",      label:"Daily",        emoji:"📅" },
 { id:"social",     label:"Social",       emoji:"💬" },
 { id:"inventory",  label:"Inventaire",   emoji:"🎒" },
 { id:"krosmoshop", label:"KrosmoShop",   emoji:"🏪" },
 { id:"event",      label:"Events",       emoji:"🎪" },
 { id:"guild",      label:"Guildes",      emoji:"🏰" },
 { id:"gift",       label:"Dons",         emoji:"🎁" },
 { id:"secret",     label:"Secrets",      emoji:"🔒" },
 { id:"battlepass", label:"Battle Pass",  emoji:"🎖️" },
]

const CATEGORY_COLORS = {
 all:        "#f1c40f",
 pack:       "#e67e22",
 rng:        "#9b59b6",
 collection: "#2980b9",
 economy:    "#27ae60",
 fusion:     "#e74c3c",
 daily:      "#f39c12",
 social:     "#1abc9c",
 inventory:  "#3498db",
 krosmoshop: "#e91e8c",
 event:      "#8e44ad",
 guild:      "#c0392b",
 gift:       "#e84393",
 secret:     "#2c3e50",
 battlepass: "#8E1F1F",
}

module.exports = {

 name: "achievements",
 description: "Voir les succès",

 async execute(interaction){

  await interaction.deferReply()

  const user     = getUser(interaction.user.id)
  const allList  = Object.entries(achievements)
  const userId   = interaction.user.id

  /* ---- Charger les achievements Battle Pass ---- */
  let bpData = { entries: [], unlocked: [], total: 0 }
  try {
   const { getBattlePassAchievements } = require("../../systems/battlePassService")
   bpData = getBattlePassAchievements(userId)
  } catch(e) { /* BP non dispo */ }

  let page       = 1
  let categoryId = "all"
  const perPage  = 8

  /* ---- Statistiques globales ---- */
  const unlockedCount   = user.achievements?.length || 0
  const totalMain       = allList.length
  const bpUnlocked      = bpData.unlocked?.length || 0
  const bpTotal         = bpData.total || 0
  const totalAll        = totalMain + bpTotal
  const unlockedAll     = unlockedCount + bpUnlocked

  /* ---- Filtrer la liste selon la catégorie ---- */
  function getFiltered(){
   if(categoryId === "battlepass"){
    /* Retourner les BP entries sous forme [id, data] homogène */
    return bpData.entries.map(e => [e.id, {
     name: e.name,
     badge: "🎖️",
     description: e.description || null,
     trigger: "battlepass",
     _bp: true,
     _unlocked: e.unlocked
    }])
   }
   if(categoryId === "all")    return allList
   if(categoryId === "secret") return allList.filter(([, d]) => d.secret === true)
   return allList.filter(([, d]) => d.trigger === categoryId && !d.secret)
  }

  /* ---- Constructeur d'embed + composants ---- */
  function build(){

   const filtered  = getFiltered()
   const maxPage   = Math.max(1, Math.ceil(filtered.length / perPage))
   page            = Math.max(1, Math.min(page, maxPage))

   const start  = (page - 1) * perPage
   const slice  = filtered.slice(start, start + perPage)

   /* Débloqués dans cette catégorie */
   let catUnlocked
   if(categoryId === "battlepass"){
    catUnlocked = bpUnlocked
   } else {
    catUnlocked = filtered.filter(([id, d]) => {
     if(d._bp) return d._unlocked
     return user.achievements?.includes(id)
    }).length
   }

   const lines = slice.map(([id, data]) => {
    const unlocked = data._bp ? data._unlocked : user.achievements?.includes(id)

    if(data.secret && !unlocked)
     return `🔒 **Succès secret** — ???`

    const titleTag  = data.title ? ` • 👑 ${data.title}` : ""
    const bpTag     = data._bp   ? ` • 🎖️ Battle Pass`  : ""
    const status    = unlocked ? "✅" : "🔒"
    const descLine  = data.description ? `\n　${data.description}` : ""

    return `${status} ${data.badge} **${data.name}**${titleTag}${bpTag}${descLine}`
   })

   const cat = CATEGORIES.find(c => c.id === categoryId) || CATEGORIES[0]

   const footerTotal = categoryId === "battlepass"
    ? `${bpUnlocked}/${bpTotal} débloqués ici`
    : `${catUnlocked}/${filtered.length} débloqués ici`

   const embed = new EmbedBuilder()
    .setTitle(`${cat.emoji} Succès — ${cat.label}`)
    .setDescription(lines.join("\n\n") || "Aucun succès dans cette catégorie.")
    .setFooter({
     text:`${footerTotal} • ${unlockedAll}/${totalAll} au total • Page ${page}/${maxPage}`
    })
    .setColor(CATEGORY_COLORS[categoryId] || "#f1c40f")

   /* ---- Row 1 : Navigation ---- */
   const navRow = new ActionRowBuilder().addComponents(

    new ButtonBuilder()
     .setCustomId("ach_prev")
     .setLabel("⬅️")
     .setStyle(ButtonStyle.Primary)
     .setDisabled(page <= 1),

    new ButtonBuilder()
     .setCustomId("ach_page")
     .setLabel(`${page}/${maxPage}`)
     .setStyle(ButtonStyle.Secondary)
     .setDisabled(true),

    new ButtonBuilder()
     .setCustomId("ach_next")
     .setLabel("➡️")
     .setStyle(ButtonStyle.Primary)
     .setDisabled(page >= maxPage),

    new ButtonBuilder()
     .setCustomId("ach_reset")
     .setLabel("Tout afficher")
     .setStyle(categoryId === "all" ? ButtonStyle.Success : ButtonStyle.Danger)
     .setDisabled(categoryId === "all")

   )

   /* ---- Row 2 : Select catégorie ---- */
   const selectMenu = new StringSelectMenuBuilder()
    .setCustomId("ach_category")
    .setPlaceholder(`📂 Catégorie : ${cat.label}`)
    .addOptions(
     CATEGORIES.map(c => {

      /* Compte débloqués pour le menu */
      let catFiltered, catCount

      if(c.id === "battlepass"){
       catCount    = bpUnlocked
       catFiltered = { length: bpTotal }
      } else if(c.id === "all"){
       catFiltered = allList
       catCount    = allList.filter(([id]) => user.achievements?.includes(id)).length
      } else if(c.id === "secret"){
       catFiltered = allList.filter(([, d]) => d.secret === true)
       catCount    = catFiltered.filter(([id]) => user.achievements?.includes(id)).length
      } else {
       catFiltered = allList.filter(([, d]) => d.trigger === c.id && !d.secret)
       catCount    = catFiltered.filter(([id]) => user.achievements?.includes(id)).length
      }

      return new StringSelectMenuOptionBuilder()
       .setLabel(`${c.label} (${catCount}/${catFiltered.length})`)
       .setValue(c.id)
       .setEmoji(c.emoji)
       .setDefault(c.id === categoryId)
     })
    )

   const selectRow = new ActionRowBuilder().addComponents(selectMenu)

   return { embed, components: [navRow, selectRow], maxPage }
  }

  /* ---- Envoi initial ---- */
  const { embed, components } = build()

  const msg = await interaction.editReply({ embeds:[embed], components })

  /* ---- Collector ---- */
  const collector = msg.createMessageComponentCollector({ time:180000 })

  collector.on("collect", async i => {

   if(i.user.id !== interaction.user.id)
    return i.reply({ content:"Pas tes succès.", flags:64 })

   if(i.customId === "ach_next")  page++
   if(i.customId === "ach_prev")  page--

   if(i.customId === "ach_reset"){
    categoryId = "all"
    page = 1
   }

   if(i.customId === "ach_category"){
    categoryId = i.values[0]
    page = 1
   }

   const { embed: newEmbed, components: newComponents } = build()

   await i.update({ embeds:[newEmbed], components:newComponents })

  })

 }

}