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
 right: "\u{27A1}\u{FE0F}"
}

const CATEGORIES = [
 { id: "all",        label: "Tous (jeu)",  emoji: EMOJI.trophy },
 { id: "pack",       label: "Packs",       emoji: EMOJI.pack },
 { id: "rng",        label: "RNG",         emoji: EMOJI.dice },
 { id: "collection", label: "Collection",  emoji: EMOJI.books },
 { id: "economy",    label: "Economie",    emoji: EMOJI.money },
 { id: "fusion",     label: "Fusion",      emoji: EMOJI.wrench },
 { id: "daily",      label: "Daily",       emoji: EMOJI.calendar },
 { id: "social",     label: "Social",      emoji: EMOJI.speech },
 { id: "inventory",  label: "Inventaire",  emoji: EMOJI.bag },
 { id: "krosmoshop", label: "KrosmoShop",  emoji: EMOJI.shop },
 { id: "event",      label: "Events",      emoji: EMOJI.circus },
 { id: "guild",      label: "Guildes",     emoji: EMOJI.castle },
 { id: "gift",       label: "Dons",        emoji: EMOJI.gift },
 { id: "secret",     label: "Secrets",     emoji: EMOJI.lock },
 { id: "battlepass", label: "Battle Pass", emoji: EMOJI.medal }
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
 krosmoshop: "#e91e63",
 event:      "#8e44ad",
 guild:      "#c0392b",
 gift:       "#e84393",
 secret:     "#2c3e50",
 battlepass: "#8e1f1f"
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
 if (reward.bpXp) parts.push(`+${reward.bpXp} XP BP`)
 if (reward.kamas) parts.push(`+${reward.kamas} kamas`)
 if (reward.packs) parts.push(`+${reward.packs} pack${reward.packs > 1 ? "s" : ""}`)
 return parts.length ? ` - ${parts.join(" * ")}` : ""
}

function loadBpAchievements(userId) {
 try {
  const { getBattlePassAchievements } = require("../../systems/battlePassService")
  const raw = getBattlePassAchievements(userId) || {}
  const globals = raw.globals || []
  const seasonal = raw.seasonal || []
  return {
   entries: [...seasonal, ...globals],
   globals,
   seasonal,
   unlocked: raw.unlocked || [],
   total: raw.total || globals.length + seasonal.length
  }
 } catch (_) {
  return { entries: [], globals: [], seasonal: [], unlocked: [], total: 0 }
 }
}

function getPageFromMessage(message) {
 const text = message?.embeds?.[0]?.footer?.text || ""
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

function getFilteredAchievements(user, categoryId, bpData) {
 const allList = Object.entries(achievements)

 if (categoryId === "battlepass") {
  return bpData.entries.map((entry) => [entry.id, {
   name: entry.name,
   badge: entry.seasonal ? EMOJI.flower : EMOJI.medal,
   description: bpDescription(entry.type, entry.target, entry.seasonal) + bpRewardText(entry.reward),
   trigger: "battlepass",
   secret: !!entry.secret,
   _bp: true,
   _unlocked: !!entry.unlocked
  }])
 }

 if (categoryId === "all") return allList
 if (categoryId === "secret") return allList.filter(([, data]) => data.secret === true)
 return allList.filter(([, data]) => data.trigger === categoryId && !data.secret)
}

function getCategoryStats(user, categoryId, filtered, bpData) {
 if (categoryId === "battlepass") {
  return {
   unlocked: bpData.entries.filter((entry) => entry.unlocked).length,
   total: bpData.entries.length
  }
 }

 return {
  unlocked: filtered.filter(([id, data]) => data._bp ? data._unlocked : user.achievements?.includes(id)).length,
  total: filtered.length
 }
}

function buildAchievementResponse(userId, categoryId = "all", page = 1) {
 const user = getUser(userId)
 const allList = Object.entries(achievements)
 const bpData = loadBpAchievements(userId)
 const filtered = getFilteredAchievements(user, categoryId, bpData)

 const maxPage = Math.max(1, Math.ceil(filtered.length / PER_PAGE))
 const safePage = Math.max(1, Math.min(page, maxPage))
 const start = (safePage - 1) * PER_PAGE
 const slice = filtered.slice(start, start + PER_PAGE)

 const mainUnlocked = user.achievements?.length || 0
 const totalMain = allList.length
 const bpUnlocked = bpData.entries.filter((entry) => entry.unlocked).length
 const totalAll = totalMain + bpData.total
 const unlockedAll = mainUnlocked + bpUnlocked

 const categoryStats = getCategoryStats(user, categoryId, filtered, bpData)

 const lines = slice.map(([id, data]) => {
  const unlocked = data._bp ? data._unlocked : user.achievements?.includes(id)

  if (data.secret && !unlocked) {
   return `${EMOJI.lock} **Succes secret** - ???`
  }

  const titleTag = data.title ? ` * ${EMOJI.crown} ${data.title}` : ""
  const status = unlocked ? EMOJI.check : EMOJI.lock
  const descLine = data.description ? `\n${data.description}` : ""
  return `${status} ${data.badge} **${data.name}**${titleTag}${descLine}`
 })

 const category = CATEGORIES.find((entry) => entry.id === categoryId) || CATEGORIES[0]

 const embed = new EmbedBuilder()
  .setTitle(`${category.emoji} Succes - ${category.label}`)
  .setDescription(lines.join("\n\n") || "Aucun succes dans cette categorie.")
  .setFooter({
   text: `${categoryStats.unlocked}/${categoryStats.total} debloques ici * ${unlockedAll}/${totalAll} au total * Page ${safePage}/${maxPage}`
  })
  .setColor(CATEGORY_COLORS[categoryId] || "#f1c40f")

 const navRow = new ActionRowBuilder().addComponents(
  new ButtonBuilder().setCustomId("ach_prev").setLabel(EMOJI.left).setStyle(ButtonStyle.Primary).setDisabled(safePage <= 1),
  new ButtonBuilder().setCustomId("ach_page").setLabel(`${safePage}/${maxPage}`).setStyle(ButtonStyle.Secondary).setDisabled(true),
  new ButtonBuilder().setCustomId("ach_next").setLabel(EMOJI.right).setStyle(ButtonStyle.Primary).setDisabled(safePage >= maxPage),
  new ButtonBuilder()
   .setCustomId("ach_reset")
   .setLabel("Tout afficher")
   .setStyle(categoryId === "all" ? ButtonStyle.Success : ButtonStyle.Danger)
   .setDisabled(categoryId === "all")
 )

 const selectMenu = new StringSelectMenuBuilder()
  .setCustomId("ach_category")
  .setPlaceholder(`Categorie : ${category.label}`)
  .addOptions(CATEGORIES.map((entry) => {
   const entryFiltered = getFilteredAchievements(user, entry.id, bpData)
   const stats = getCategoryStats(user, entry.id, entryFiltered, bpData)
   return new StringSelectMenuOptionBuilder()
    .setLabel(`${entry.label} (${stats.unlocked}/${stats.total})`)
    .setValue(entry.id)
    .setEmoji(entry.emoji)
    .setDefault(entry.id === categoryId)
  }))

 const selectRow = new ActionRowBuilder().addComponents(selectMenu)

 return { embed, components: [navRow, selectRow] }
}

module.exports = {
 name: "achievements",
 description: "Voir les succes",

 async execute(interaction) {
  await interaction.deferReply()
  const response = buildAchievementResponse(interaction.user.id, "all", 1)
  const message = await interaction.editReply({ embeds: [response.embed], components: response.components })

  const collector = message.createMessageComponentCollector({ time: 180000 })
  collector.on("collect", async (component) => {
   if (component.user.id !== interaction.user.id) {
    return component.reply({ content: "Pas tes succes.", flags: 64 })
   }

   let page = getPageFromMessage(component.message)
   let categoryId = getCategoryFromMessage(component.message)

   if (component.customId === "ach_next") page++
   if (component.customId === "ach_prev") page--
   if (component.customId === "ach_reset") {
    categoryId = "all"
    page = 1
   }
   if (component.customId === "ach_category") {
    categoryId = component.values[0]
    page = 1
   }

   const next = buildAchievementResponse(interaction.user.id, categoryId, page)
   await component.update({ embeds: [next.embed], components: next.components })
  })
 },

 async button(interaction) {
  let page = getPageFromMessage(interaction.message)
  let categoryId = getCategoryFromMessage(interaction.message)

  if (interaction.customId === "ach_next") page++
  if (interaction.customId === "ach_prev") page--
  if (interaction.customId === "ach_reset") {
   categoryId = "all"
   page = 1
  }

  const response = buildAchievementResponse(interaction.user.id, categoryId, page)
  return interaction.update({ embeds: [response.embed], components: response.components })
 },

 async select(interaction) {
  const categoryId = interaction.values?.[0] || "all"
  const response = buildAchievementResponse(interaction.user.id, categoryId, 1)
  return interaction.update({ embeds: [response.embed], components: response.components })
 }
}
