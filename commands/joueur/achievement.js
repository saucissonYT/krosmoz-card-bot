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

const EMOJI = {
 trophy: "\u{1F3C6}",
 pack: "\u{1F4E6}",
 dice: "\u{1F3B2}",
 books: "\u{1F4DA}",
 money: "\u{1F4B0}",
 wrench: "\u{1F527}",
 calendar: "\u{1F4C5}",
 speech: "\u{1F4AC}",
 bag: "\u{1F392}",
 shop: "\u{1F3EA}",
 circus: "\u{1F3AA}",
 castle: "\u{1F3F0}",
 gift: "\u{1F381}",
 lock: "\u{1F512}",
 medal: "\u{1F396}\u{FE0F}",
 flower: "\u{1F338}",
 crown: "\u{1F451}",
 check: "\u{2705}",
 left: "\u{2B05}\u{FE0F}",
 right: "\u{27A1}\u{FE0F}",
 star: "\u{2B50}",
}

const CATEGORIES = [
 { id: "all",         label: "Tous (jeu)",   emoji: EMOJI.trophy },
 { id: "pack",        label: "Packs",        emoji: EMOJI.pack },
 { id: "rng",         label: "RNG",          emoji: EMOJI.dice },
 { id: "collection",  label: "Collection",   emoji: EMOJI.books },
 { id: "economy",     label: "Economie",     emoji: EMOJI.money },
 { id: "market",      label: "Marche",       emoji: "🛒" },
 { id: "fusion",      label: "Fusion",       emoji: EMOJI.wrench },
 { id: "daily",       label: "Daily",        emoji: EMOJI.calendar },
 { id: "social",      label: "Social",       emoji: EMOJI.speech },
 { id: "inventory",   label: "Inventaire",   emoji: EMOJI.bag },
 { id: "krosmoshop",  label: "KrosmoShop",   emoji: EMOJI.shop },
 { id: "event",       label: "Events",       emoji: EMOJI.circus },
 { id: "guild",       label: "Guildes",      emoji: EMOJI.castle },
 { id: "gift",        label: "Dons",         emoji: EMOJI.gift },
 { id: "progression", label: "Progression",  emoji: EMOJI.star },
 { id: "secret",      label: "Secrets",      emoji: EMOJI.lock },
 { id: "battlepass",  label: "Battle Pass",  emoji: EMOJI.medal },
]

const CATEGORY_COLORS = {
 all:         "#f1c40f",
 pack:        "#e67e22",
 rng:         "#9b59b6",
 collection:  "#2980b9",
 economy:     "#27ae60",
 market:      "#16a085",
 fusion:      "#e74c3c",
 daily:       "#f39c12",
 social:      "#1abc9c",
 inventory:   "#3498db",
 krosmoshop:  "#e91e63",
 event:       "#8e44ad",
 guild:       "#c0392b",
 gift:        "#e84393",
 progression: "#f1c40f",
 secret:      "#2c3e50",
 battlepass:  "#8e1f1f",
}

const PER_PAGE = 8

function bpDescription(type, target, seasonal) {
 const n = target ?? "?"
 const seasonText = seasonal ? " cette saison" : ""

 switch (type) {
  case "daily_claims":   return `Recuperer le daily **${n}** fois${seasonText}.`
  case "packs_opened":   return `Ouvrir **${n}** pack${n > 1 ? "s" : ""}${seasonText} via /krosmoz.`
  case "rare_cards":     return `Obtenir **${n}** carte${n > 1 ? "s" : ""} rare${n > 1 ? "s" : ""} (HR ou plus)${seasonText}.`
  case "ssr_cards":      return `Obtenir **${n}** SSR${seasonText}.`
  case "shiny_cards":    return `Obtenir **${n}** SSR Shiny${seasonText}.`
  case "sets_completed": return `Completer **${n}** set${n > 1 ? "s" : ""}${seasonText}.`
  case "fusions":        return `Effectuer **${n}** fusion${n > 1 ? "s" : ""}${seasonText} via /fusion.`
  case "market_sales":   return `Vendre **${n}** carte${n > 1 ? "s" : ""} sur le marche${seasonText}.`
  case "events":         return `Ouvrir **${n}** pack${n > 1 ? "s" : ""} d'event${seasonText}.`
  case "level":          return `Atteindre le niveau **${n}** du Battle Pass${seasonText}.`
  case "season_level":   return `Atteindre le niveau **${n}** cette saison.`
  case "season_packs":   return `Ouvrir **${n}** pack${n > 1 ? "s" : ""} cette saison.`
  case "season_daily":   return `Recuperer le daily **${n}** fois cette saison.`
  case "season_fusions": return `Effectuer **${n}** fusion${n > 1 ? "s" : ""} cette saison.`
  case "season_events":  return `Ouvrir **${n}** pack${n > 1 ? "s" : ""} d'event cette saison.`
  case "season_sets":    return `Completer **${n}** set${n > 1 ? "s" : ""} cette saison.`
  case "all6":           return "Completer les 6 saisons du cycle Battle Pass."
  case "premium_buy":    return "Acheter le Pass Premium via /battlepass."
  case "kamas_earned":   return `Gagner **${Number(n).toLocaleString("fr-FR")}** kamas au total.`
  case "titles_owned":   return `Posseder **${n}** titre${n > 1 ? "s" : ""} debloque${n > 1 ? "s" : ""}.`
  case "badges_owned":   return `Posseder **${n}** badge${n > 1 ? "s" : ""}.`
  default:               return `Objectif Battle Pass : **${type}** x ${n}.`
 }
}

function bpRewardText(reward) {
 if (!reward) return ""
 const parts = []
 if (reward.bpXp)  parts.push(`+${reward.bpXp} XP BP`)
 if (reward.kamas) parts.push(`+${reward.kamas} kamas`)
 if (reward.packs) parts.push(`+${reward.packs} pack${reward.packs > 1 ? "s" : ""}`)
 return parts.length ? ` - ${parts.join(" * ")}` : ""
}

function loadBpAchievements(userId) {
 try {
  const { getBattlePassAchievements } = require("../../systems/battlePassService")
  const raw = getBattlePassAchievements(userId) || {}
  const globals  = raw.globals  || []
  const seasonal = raw.seasonal || []
  return {
   entries:  [...seasonal, ...globals],
   globals,
   seasonal,
   unlocked: raw.unlocked || [],
   total:    raw.total || globals.length + seasonal.length
  }
 } catch (_) {
  return { entries: [], globals: [], seasonal: [], unlocked: [], total: 0 }
 }
}

function getPageFromMessage(message) {
 const text  = message?.embeds?.[0]?.footer?.text || ""
 const match = text.match(/Page\s+(\d+)\//i)
 return match ? Number(match[1]) : 1
}

function getCategoryFromMessage(message) {
 for (const row of message?.components || []) {
  for (const component of row.components || []) {
   if (component.customId !== "ach_category") continue
   for (const option of component.options || []) {
    if (option.default || option.data?.default) return option.value
   }
  }
 }
 return "all"
}

/* FIX : lit l'état du filtre "non validés" depuis le footer */
function getOnlyLockedFromMessage(message) {
 const text = message?.embeds?.[0]?.footer?.text || ""
 return text.includes("filtre:locked")
}

function getFilteredAchievements(user, categoryId, bpData) {
 const allList = Object.entries(achievements)

 if (categoryId === "battlepass") {
  return bpData.entries.map((entry) => [entry.id, {
   name:        entry.name,
   badge:       entry.seasonal ? EMOJI.flower : EMOJI.medal,
   description: bpDescription(entry.type, entry.target, entry.seasonal) + bpRewardText(entry.reward),
   trigger:     "battlepass",
   secret:      !!entry.secret,
   _bp:         true,
   _unlocked:   !!entry.unlocked
  }])
 }

 if (categoryId === "all")    return allList
 if (categoryId === "secret") return allList.filter(([, data]) => data.secret === true)
 return allList.filter(([, data]) => data.trigger === categoryId && !data.secret)
}

function getCategoryStats(user, categoryId, filtered, bpData) {
 if (categoryId === "battlepass") {
  return {
   unlocked: bpData.entries.filter((entry) => entry.unlocked).length,
   total:    bpData.entries.length
  }
 }

 return {
  unlocked: filtered.filter(([id, data]) => data._bp ? data._unlocked : user.achievements?.includes(id)).length,
  total:    filtered.length
 }
}

function buildAchievementResponse(userId, categoryId = "all", page = 1, onlyLocked = false) {
 const user    = getUser(userId)
 const allList = Object.entries(achievements)
 const bpData  = loadBpAchievements(userId)

 /* Liste de base selon la catégorie */
 const baseFiltered = getFilteredAchievements(user, categoryId, bpData)

 /* FIX : filtre "non validés" appliqué après la sélection de catégorie */
 const filtered = onlyLocked
  ? baseFiltered.filter(([id, data]) => {
   if (data._bp) return !data._unlocked
   return !user.achievements?.includes(id)
  })
  : baseFiltered

 const maxPage  = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
 const safePage = Math.max(1, Math.min(page, maxPage))
 const start    = (safePage - 1) * PER_PAGE
 const slice    = filtered.slice(start, start + PER_PAGE)

 const mainUnlocked = user.achievements?.length || 0
 const totalMain    = allList.length
 const bpUnlocked   = bpData.entries.filter((entry) => entry.unlocked).length
 const totalAll     = totalMain + bpData.total
 const unlockedAll  = mainUnlocked + bpUnlocked

 /* FIX : stats toujours calculées sur la liste non-filtrée par onlyLocked */
 const categoryStats = getCategoryStats(user, categoryId, baseFiltered, bpData)

 const lines = slice.map(([id, data]) => {
  const unlocked = data._bp ? data._unlocked : user.achievements?.includes(id)

  if (data.secret && !unlocked) {
   return `${EMOJI.lock} **Succes secret** - ???`
  }

  const titleTag  = data.title       ? ` * ${EMOJI.crown} ${data.title}` : ""
  const status    = unlocked         ? EMOJI.check : EMOJI.lock
  const descLine  = data.description ? `\n${data.description}` : ""
  return `${status} ${data.badge} **${data.name}**${titleTag}${descLine}`
 })

 const category = CATEGORIES.find((entry) => entry.id === categoryId) || CATEGORIES[0]

 /* Footer : inclut le marqueur du filtre si actif */
 const filterInfo = onlyLocked
  ? `${filtered.length} restant${filtered.length > 1 ? "s" : ""} a debloquer`
  : `${categoryStats.unlocked}/${categoryStats.total} debloques ici`

 const embed = new EmbedBuilder()
  .setTitle(`${category.emoji} Succes - ${category.label}${onlyLocked ? " — Non valides" : ""}`)
  .setDescription(lines.join("\n\n") || "Aucun succes dans cette categorie.")
  .setFooter({
   text: `${filterInfo} * ${unlockedAll}/${totalAll} au total * Page ${safePage}/${maxPage}${onlyLocked ? " * filtre:locked" : ""}`
  })
  .setColor(CATEGORY_COLORS[categoryId] || "#f1c40f")

 /* FIX : 5e bouton ajouté — toggle "Non validés" */
 const isDefault = categoryId === "all" && !onlyLocked

 const navRow = new ActionRowBuilder().addComponents(
  new ButtonBuilder()
   .setCustomId("ach_prev")
   .setLabel(EMOJI.left)
   .setStyle(ButtonStyle.Primary)
   .setDisabled(safePage <= 1),
  new ButtonBuilder()
   .setCustomId("ach_page")
   .setLabel(`${safePage}/${maxPage}`)
   .setStyle(ButtonStyle.Secondary)
   .setDisabled(true),
  new ButtonBuilder()
   .setCustomId("ach_next")
   .setLabel(EMOJI.right)
   .setStyle(ButtonStyle.Primary)
   .setDisabled(safePage >= maxPage),
  new ButtonBuilder()
   .setCustomId("ach_reset")
   .setLabel("Tout afficher")
   .setStyle(isDefault ? ButtonStyle.Success : ButtonStyle.Danger)
   .setDisabled(isDefault),
  new ButtonBuilder()
   .setCustomId("ach_only_locked")
   .setLabel("🔒 Non valides")
   .setStyle(onlyLocked ? ButtonStyle.Success : ButtonStyle.Secondary)
 )

 const selectMenu = new StringSelectMenuBuilder()
  .setCustomId("ach_category")
  .setPlaceholder(`Categorie : ${category.label}`)
  .addOptions(CATEGORIES.map((entry) => {
   const entryFiltered = getFilteredAchievements(user, entry.id, bpData)
   const stats         = getCategoryStats(user, entry.id, entryFiltered, bpData)
   return new StringSelectMenuOptionBuilder()
    .setLabel(`${entry.label} (${stats.unlocked}/${stats.total})`)
    .setValue(entry.id)
    .setEmoji(entry.emoji)
    .setDefault(entry.id === categoryId)
  }))

 const selectRow = new ActionRowBuilder().addComponents(selectMenu)

 /* ROW 3 : lien web */
 const linkRow = new ActionRowBuilder().addComponents(
  new ButtonBuilder()
   .setLabel("Succès web")
   .setEmoji("🌐")
   .setStyle(ButtonStyle.Link)
   .setURL("https://www.krosmozcard.fr/achievements")
 )

 return { embed, components: [navRow, selectRow, linkRow] }
}

module.exports = {
 name:        "achievements",
 description: "Voir les succes",

 async execute(interaction) {
  await interaction.deferReply()

  /*
   * FIX : le collector a été supprimé.
   * Il entrait en conflit avec les handlers globaux button() / select()
   * routés dans buttonRoutes.js et selectRoutes.js.
   * Les deux appelaient interaction.update() simultanément
   * → "Interaction already acknowledged" (crash).
   * button() et select() gèrent tout désormais.
   */
  const response = buildAchievementResponse(interaction.user.id, "all", 1, false)
  await interaction.editReply({ embeds: [response.embed], components: response.components })
 },

 async button(interaction) {
  let page       = getPageFromMessage(interaction.message)
  let categoryId = getCategoryFromMessage(interaction.message)
  let onlyLocked = getOnlyLockedFromMessage(interaction.message)

  if (interaction.customId === "ach_next") page++
  if (interaction.customId === "ach_prev") page--

  if (interaction.customId === "ach_reset") {
   /* FIX : reset remet aussi onlyLocked à false */
   categoryId = "all"
   page       = 1
   onlyLocked = false
  }

  if (interaction.customId === "ach_only_locked") {
   /* FIX : toggle du filtre non validés */
   onlyLocked = !onlyLocked
   page       = 1
  }

  const response = buildAchievementResponse(interaction.user.id, categoryId, page, onlyLocked)
  return interaction.update({ embeds: [response.embed], components: response.components })
 },

 async select(interaction) {
  const categoryId = interaction.values?.[0] || "all"
  /* FIX : conserver l'état onlyLocked lors du changement de catégorie */
  const onlyLocked = getOnlyLockedFromMessage(interaction.message)
  const response   = buildAchievementResponse(interaction.user.id, categoryId, 1, onlyLocked)
  return interaction.update({ embeds: [response.embed], components: response.components })
 }
}
