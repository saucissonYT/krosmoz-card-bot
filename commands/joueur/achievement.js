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

/* ---- Générateur de description BP depuis type + target ---- */
function bpDescription(type, target, seasonal){

 const n = target ?? "?"
 const s = seasonal ? " cette saison" : ""

 switch(type){
  case "daily_claims":    return `Récupérer le daily **${n}** fois${s}.`
  case "packs_opened":    return `Ouvrir **${n}** packs${s} via /krosmoz.`
  case "rare_cards":      return `Obtenir **${n}** carte${n>1?"s":""} rare${n>1?"s":""} (HR ou plus)${s}.`
  case "ssr_cards":       return `Obtenir **${n}** SSR 🌈${s}.`
  case "shiny_cards":     return `Obtenir **${n}** SSR Shiny ✨${s}.`
  case "sets_completed":  return `Compléter **${n}** set${n>1?"s":""}${s} (posséder toutes les cartes).`
  case "fusions":         return `Effectuer **${n}** fusion${n>1?"s":""}${s} via /fusion.`
  case "market_sales":    return `Vendre **${n}** carte${n>1?"s":""} sur le marché${s}.`
  case "events":          return `Participer à **${n}** event${n>1?"s":""} des Dieux${s}.`
  case "level":           return `Atteindre le niveau **${n}** du Battle Pass${s}.`
  case "season_level":    return `Atteindre le niveau **${n}** cette saison.`
  case "season_packs":    return `Ouvrir **${n}** packs cette saison.`
  case "season_sets":     return `Compléter **${n}** set${n>1?"s":""} cette saison.`
  case "season_rare":     return `Obtenir **${n}** carte${n>1?"s":""} rare${n>1?"s":""} cette saison.`
  case "season_exclusive":return `Obtenir **${n}** récompense${n>1?"s":""} exclusive${n>1?"s":""} de la saison.`
  case "all6":            return `Compléter les **6 saisons** du Battle Pass.`
  case "premium_buy":     return `Acheter le Pass Premium via /battlepass.`
  case "kamas_earned":    return `Gagner **${n.toLocaleString("fr-FR")}** kamas au total.`
  case "titles_owned":    return `Posséder **${n}** titre${n>1?"s":""} débloqués.`
  case "badges_owned":    return `Posséder **${n}** badge${n>1?"s":""} (succès débloqués).`
  default:                return `Objectif Battle Pass : **${type}** × ${n}.`
 }
}

/* ---- Formatage récompense BP ---- */
function bpRewardText(reward){
 if(!reward) return ""
 const parts = []
 if(reward.bpXp)  parts.push(`⭐ +${reward.bpXp} XP BP`)
 if(reward.kamas) parts.push(`💰 +${reward.kamas} kamas`)
 if(reward.packs) parts.push(`📦 +${reward.packs} pack${reward.packs>1?"s":""}`)
 return parts.length ? ` — ${parts.join(" • ")}` : ""
}

module.exports = {

 name: "achievements",
 description: "Voir les succès",

 async execute(interaction){

  await interaction.deferReply()

  const user    = getUser(interaction.user.id)
  const allList = Object.entries(achievements)
  const userId  = interaction.user.id

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
  const unlockedCount = user.achievements?.length || 0
  const totalMain     = allList.length
  const bpUnlocked    = bpData.unlocked?.length || 0
  const bpTotal       = bpData.total || 0
  const totalAll      = totalMain + bpTotal
  const unlockedAll   = unlockedCount + bpUnlocked

  /* ---- Filtrer la liste selon la catégorie ---- */
  function getFiltered(){
   if(categoryId === "battlepass"){
    return bpData.entries.map(e => [e.id, {
     name:     e.name,
     badge:    e.seasonal ? "🌸" : "🎖️",
     description: bpDescription(e.type, e.target, e.seasonal) + bpRewardText(e.reward),
     trigger:  "battlepass",
     _bp:      true,
     _unlocked: e.unlocked
    }])
   }
   if(categoryId === "all")    return allList
   if(categoryId === "secret") return allList.filter(([, d]) => d.secret === true)
   return allList.filter(([, d]) => d.trigger === categoryId && !d.secret)
  }

  /* ---- Constructeur d'embed + composants ---- */
  function build(){

   const filtered = getFiltered()
   const maxPage  = Math.max(1, Math.ceil(filtered.length / perPage))
   page           = Math.max(1, Math.min(page, maxPage))

   const start = (page - 1) * perPage
   const slice = filtered.slice(start, start + perPage)

   /* Débloqués dans cette catégorie */
   const catUnlocked = categoryId === "battlepass"
    ? bpUnlocked
    : filtered.filter(([id, d]) => d._bp ? d._unlocked : user.achievements?.includes(id)).length

   const catTotal = categoryId === "battlepass" ? bpTotal : filtered.length

   const lines = slice.map(([id, data]) => {
    const unlocked = data._bp ? data._unlocked : user.achievements?.includes(id)

    if(data.secret && !unlocked)
     return `🔒 **Succès secret** — ???`

    const titleTag = data.title ? ` • 👑 ${data.title}` : ""
    const status   = unlocked ? "✅" : "🔒"
    const descLine = data.description ? `\n　${data.description}` : ""

    return `${status} ${data.badge} **${data.name}**${titleTag}${descLine}`
   })

   const cat = CATEGORIES.find(c => c.id === categoryId) || CATEGORIES[0]

   const embed = new EmbedBuilder()
    .setTitle(`${cat.emoji} Succès — ${cat.label}`)
    .setDescription(lines.join("\n\n") || "Aucun succès dans cette catégorie.")
    .setFooter({
     text:`${catUnlocked}/${catTotal} débloqués ici • ${unlockedAll}/${totalAll} au total • Page ${page}/${maxPage}`
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

      let catLen, catC

      if(c.id === "battlepass"){
       catLen = bpTotal
       catC   = bpUnlocked
      } else if(c.id === "all"){
       catLen = allList.length
       catC   = allList.filter(([id]) => user.achievements?.includes(id)).length
      } else if(c.id === "secret"){
       const f = allList.filter(([, d]) => d.secret === true)
       catLen  = f.length
       catC    = f.filter(([id]) => user.achievements?.includes(id)).length
      } else {
       const f = allList.filter(([, d]) => d.trigger === c.id && !d.secret)
       catLen  = f.length
       catC    = f.filter(([id]) => user.achievements?.includes(id)).length
      }

      return new StringSelectMenuOptionBuilder()
       .setLabel(`${c.label} (${catC}/${catLen})`)
       .setValue(c.id)
       .setEmoji(c.emoji)
       .setDefault(c.id === categoryId)
     })
    )

   const selectRow = new ActionRowBuilder().addComponents(selectMenu)

   return { embed, components:[navRow, selectRow], maxPage }
  }

  /* ---- Envoi initial ---- */
  const { embed, components } = build()

  const msg = await interaction.editReply({ embeds:[embed], components })

  /* ---- Collector ---- */
  const collector = msg.createMessageComponentCollector({ time:180000 })

  collector.on("collect", async i => {

   if(i.user.id !== interaction.user.id)
    return i.reply({ content:"Pas tes succès.", flags:64 })

   if(i.customId === "ach_next") page++
   if(i.customId === "ach_prev") page--

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