const {
 SlashCommandBuilder,
 ActionRowBuilder,
 StringSelectMenuBuilder,
 EmbedBuilder
} = require("discord.js")

const { RARITY_EMOJI, RARITY_COLOR } = require("../../systems/constants")
const { getCards } = require("../../systems/cardRegistry")
const { openPack } = require("../../systems/packEngine")
const { getUser, save, updateActivityStreak } = require("../../systems/userSystem")
const { addBattlePassXP } = require("../../systems/battlePassService")
const { achievementCheck } = require("../../systems/achievementCheck")
const { notifyAchievements } = require("../../systems/achievementNotifier")
const { loadSets } = require("../../systems/setSystemFile")
const cooldownDev = require("../dev/cooldown")

const RARITY_ORDER = ["C", "U", "R", "SR", "HR", "UR", "S", "SSR"]
const MAX_BATCH = 25

function sleep(ms) {
 return new Promise((resolve) => setTimeout(resolve, ms))
}

function getSetCache() {
 const cards = getCards()
 const cache = {}
 for (const card of cards) {
  if (!cache[card.set]) cache[card.set] = []
  cache[card.set].push(card)
 }
 return cache
}

function getCooldownMs(user) {
 const BASE_COOLDOWN = 3600000
 let reduction = 0

 try {
  const { getPlayerBonuses } = require("../../systems/playerBonuses")
  const pb = getPlayerBonuses(user.progression?.level || 1)
  reduction = (pb.cooldownReduction || 0) * 60000
 } catch (_) {}

 return Math.max(BASE_COOLDOWN - reduction, 35 * 60000)
}

function getCooldownText(user) {
 const now = Date.now()
 const cooldown = getCooldownMs(user)

 if (!user.lastPack) return "🎁 Pack gratuit : **disponible**"

 const remain = cooldown - (now - user.lastPack)
 if (remain <= 0) return "🎁 Pack gratuit : **disponible**"

 const minutes = Math.ceil(remain / 60000)
 const totalMinutes = Math.round(cooldown / 60000)
 return `⏳ Pack gratuit : **${minutes} min** (cooldown ${totalMinutes} min)`
}

function getSetCompletion(user, setId) {
 const setCache = getSetCache()
 const setCards = setCache[setId] || []
 let owned = 0

 for (const card of setCards) {
  if (user.cards?.[card.id]) owned++
 }

 return { owned, total: setCards.length }
}

function getPlayableSets(rawSets) {
 const sets = Array.isArray(rawSets) ? rawSets : rawSets?.sets || []
 const setCache = getSetCache()
 return sets.filter((set) => (setCache[set.id] || []).length > 0)
}

function rarityRank(rarity) {
 return RARITY_ORDER.indexOf(rarity)
}

function aggregateCards(results) {
 const byKey = new Map()

 for (const result of results) {
  for (const card of result.pack || []) {
   const key = `${card.id}|${card.shiny ? 1 : 0}`
   if (!byKey.has(key)) byKey.set(key, { card, qty: 0 })
   byKey.get(key).qty++
  }
 }

 return Array.from(byKey.values()).sort((a, b) => {
  const rankDiff = rarityRank(b.card.rarity) - rarityRank(a.card.rarity)
  if (rankDiff !== 0) return rankDiff
  return String(a.card.name || "").localeCompare(String(b.card.name || ""))
 })
}

async function openPacksBatch(interaction, setId, requestedCount) {
 const packCount = Math.max(1, Math.min(MAX_BATCH, requestedCount || 1))
 const user = getUser(interaction.user.id)
 const rawSets = loadSets()
 const playableSets = getPlayableSets(rawSets)
 const playableIds = playableSets.map((s) => s.id)
 const isRandom = setId === "random"

 if (playableIds.length === 0) {
  return interaction.editReply("Aucun set jouable disponible actuellement.")
 }

 if (!isRandom && !playableIds.includes(setId)) {
  return interaction.editReply("Ce set n'est pas disponible actuellement.")
 }

 const setCache = getSetCache()

 if (!isRandom && (setCache[setId] || []).length === 0) {
  return interaction.editReply("Ce set ne contient aucune carte jouable actuellement.")
 }

 const beforeCompletionBySet = {}
 for (const sid of (isRandom ? playableIds : [setId])) {
  beforeCompletionBySet[sid] = getSetCompletion(user, sid)
 }

 if (!user.pity) user.pity = {}
 if (!isRandom && !user.pity[setId]) user.pity[setId] = { SSR: 0, S: 0, UR: 0 }
 if (!user.stats) user.stats = {}

 if (!isRandom) {
  const pity = user.pity[setId]
  if (pity.S === undefined) pity.S = 0
  if (pity.UR === undefined) pity.UR = 0
  if (pity.SSR === undefined) pity.SSR = 0
 }

 const now = Date.now()
 const cooldown = getCooldownMs(user)

 let freePacks = 0
 if (cooldownDev.cooldownDisabled()) {
  freePacks = packCount
 } else if (!user.lastPack || now - user.lastPack >= cooldown) {
  freePacks = 1
 }

 const paidNeeded = Math.max(0, packCount - freePacks)
 const ownedPacks = user.packs || 0

 if (ownedPacks < paidNeeded) {
  const missing = paidNeeded - ownedPacks
  let message =
`❌ Packs insuffisants.
Ouverture demandée : **${packCount}**
Packs payants nécessaires : **${paidNeeded}**
Packs en stock : **${ownedPacks}** (manque **${missing}**)`

  if (freePacks === 0 && !cooldownDev.cooldownDisabled()) {
   const remain = Math.ceil((cooldown - (now - user.lastPack)) / 60000)
   message += `\n⏳ Prochain pack gratuit : **${Math.max(1, remain)} min**`
  }

  return interaction.editReply(message)
 }

 if (freePacks > 0) user.lastPack = now
 if (paidNeeded > 0) user.packs = ownedPacks - paidNeeded

 user.stats.packsOpened = (user.stats.packsOpened || 0) + packCount
 user.stats.krosmozOpened = (user.stats.krosmozOpened || 0) + packCount
 user.stats.maxBulkOpen = Math.max(user.stats.maxBulkOpen || 0, packCount)
 if (packCount >= 2) {
  user.stats.multiPackOpens = (user.stats.multiPackOpens || 0) + 1
 }

 updateActivityStreak(user)

 await interaction.editReply(`🎴 Ouverture de **${packCount}** pack(s) sur **${isRandom ? "random" : setId}**...`)

 const results = []
 const setOpenCount = {}
 const progressStep = packCount >= 10 ? 3 : 2

 for (let i = 0; i < packCount; i++) {
  const chosenSetId = isRandom
   ? playableIds[Math.floor(Math.random() * playableIds.length)]
   : setId

  setOpenCount[chosenSetId] = (setOpenCount[chosenSetId] || 0) + 1
  user.lastSet = chosenSetId

  const result = openPack(user, chosenSetId, interaction.user.id, {
   isSimpleCommandOpen: packCount === 1
  })
  result._setId = chosenSetId
  results.push(result)

  await addBattlePassXP(interaction.user.id, "pack_open")

  if ((i + 1) % progressStep === 0 || i + 1 === packCount) {
   const top = Object.entries(setOpenCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([sid, qty]) => `${sid}:${qty}`)
    .join(" | ")
   await interaction.editReply(`🎴 Ouverture en cours... **${i + 1}/${packCount}**${top ? `\n🎲 ${top}` : ""}`)
  }
 }

 for (const sid of Object.keys(setOpenCount)) {
  const beforeCompletion = beforeCompletionBySet[sid] || { owned: 0, total: 0 }
  const afterCompletion = getSetCompletion(user, sid)
  if (
   beforeCompletion.total > 0 &&
   beforeCompletion.owned < beforeCompletion.total &&
   afterCompletion.owned === afterCompletion.total
  ) {
   await addBattlePassXP(interaction.user.id, 480, "set_complete")
  }
 }

 save(interaction.user.id)

 const unlocked = []
 unlocked.push(...achievementCheck(user, "pack"))
 unlocked.push(...achievementCheck(user, "collection"))
 unlocked.push(...achievementCheck(user, "economy"))
 unlocked.push(...achievementCheck(user, "rng"))
 const uniqueUnlocked = [...new Set(unlocked)]

 const grouped = aggregateCards(results)
 const displayed = grouped.slice(0, 45)
 const hidden = Math.max(0, grouped.length - displayed.length)

  const lines = displayed.map(({ card, qty }) => {
   const qtyText = qty > 1 ? ` (x${qty})` : ""
   return `${RARITY_EMOJI[card.rarity]} **${card.name}${card.shiny ? " ✨" : ""}** \`${card.rarity}\`${qtyText}`
  })
  if (hidden > 0) lines.push(`... +${hidden} carte(s) unique(s) supplémentaire(s)`)

 const totals = results.reduce((acc, r) => {
  acc.kamas += r.kamasGain || 0
  acc.xp += r.xpGain || 0
  if (r.luckyPack) acc.lucky++
  return acc
 }, { kamas: 0, xp: 0, lucky: 0 })

 const discoveredById = new Map()
 for (const r of results) {
  for (const c of r.discovered || []) discoveredById.set(c.id, c)
 }

 let best = null
 for (const r of results) {
  if (!r.best) continue
  if (!best || rarityRank(r.best.rarity) > rarityRank(best.rarity)) best = r.best
 }

  // Défilement rapide: plus fluide qu'un pack normal, mais garde l'effet reveal.
  const scrollPreview = lines.slice(0, 18)
  if (scrollPreview.length > 0) {
   const step = packCount >= 10 ? 6 : 4
   const delay = packCount >= 10 ? 180 : 240

   for (let i = step; i <= scrollPreview.length; i += step) {
    const chunk = scrollPreview.slice(0, i).join("\n")
    const revealEmbed = new EmbedBuilder()
     .setTitle(`🎴 Giga Pack x${packCount} — Défilement`)
     .setDescription(`${chunk}${i < scrollPreview.length ? "\n\n..." : ""}`)
     .setColor(RARITY_COLOR[best?.rarity] || "#f1c40f")

    await interaction.editReply({ embeds: [revealEmbed] })
    await sleep(delay)
   }
  }

 const embed = new EmbedBuilder()
  .setTitle(`🎴 Giga Pack ouvert x${packCount}`)
  .setDescription(lines.join("\n") || "Aucune carte.")
  .addFields(
   { name: "💰 Kamas gagnés", value: `+${totals.kamas}`, inline: true },
   { name: "⭐ XP gagnée", value: `+${totals.xp}`, inline: true },
   { name: "📦 Packs consommés", value: `${packCount} (${freePacks} gratuit + ${paidNeeded} payants)`, inline: true },
   { name: "🌈 SSR Pity", value: isRandom ? "Mode random" : `${user.pity?.[setId]?.SSR ?? 0}/50`, inline: true },
   { name: "✨ S Pity", value: isRandom ? "Mode random" : `${user.pity?.[setId]?.S ?? 0}/30`, inline: true },
   { name: "🟡 UR Pity", value: isRandom ? "Mode random" : `${user.pity?.[setId]?.UR ?? 0}/10`, inline: true }
  )
  .setColor(RARITY_COLOR[best?.rarity] || "#f1c40f")

 if (totals.lucky > 0) {
  embed.addFields({ name: "🎁 Lucky Packs", value: `${totals.lucky}`, inline: true })
 }

 const breakdown = Object.entries(setOpenCount)
  .sort((a, b) => b[1] - a[1])
  .map(([sid, qty]) => `• ${sid}: ${qty}`)
  .join("\n")

 if (breakdown) {
  embed.addFields({ name: "🎲 Répartition des sets", value: breakdown, inline: false })
 }

 await interaction.editReply({ embeds: [embed] })

 if (discoveredById.size > 0) {
  const cards = Array.from(discoveredById.values())
  const linesDiscover = cards.slice(0, 20).map((c) => `🔎 **${c.name}**`)
  const more = cards.length > linesDiscover.length ? `\n... +${cards.length - linesDiscover.length}` : ""
  await interaction.followUp({ content: `Nouvelle découverte !\n${linesDiscover.join("\n")}${more}`, flags: 64 })
 }

 if (uniqueUnlocked.length) {
  await notifyAchievements(interaction, uniqueUnlocked)
 }
}

module.exports = {
 name: "krosmoz",

 data: (() => {
  const rawSets = loadSets()
  const sets = getPlayableSets(rawSets)

  const builder = new SlashCommandBuilder()
   .setName("krosmoz")
   .setDescription("Ouvrir un ou plusieurs packs Krosmoz")
   .addStringOption((option) => {
    option
     .setName("set")
     .setDescription("Set à ouvrir")
     .setRequired(false)

    const choices = [{ name: "🎲 Random", value: "random" }]
    if (sets.length > 0) {
     choices.push(...sets.slice(0, 24).map((s) => ({ name: s.name, value: s.id })))
    }
    option.addChoices(...choices)

    return option
   })
   .addIntegerOption((option) =>
    option
     .setName("packs")
     .setDescription("Nombre de packs à ouvrir (1-25)")
     .setRequired(false)
     .setMinValue(1)
     .setMaxValue(MAX_BATCH)
   )

  return builder
 })(),

 async execute(interaction) {
  const user = getUser(interaction.user.id)
  const quickSet = interaction.options.getString("set")
  const quickCount = interaction.options.getInteger("packs") || 1

  if (quickSet) {
   await interaction.deferReply()
   return openPacksBatch(interaction, quickSet, quickCount)
  }

  const rawSets = loadSets()
  const sets = getPlayableSets(rawSets)

  if (!sets || sets.length === 0) {
   return interaction.reply({ content: "❌ Aucun set disponible.", flags: 64 })
  }

  if (!user.pity) user.pity = {}
  if (!user.stats) user.stats = {}

  const setCache = getSetCache()
  const options = []
  options.push({
   label: "🎲 Random",
   value: "random",
   description: "Packs répartis aléatoirement entre tous les sets"
  })

  options.push(...sets.slice(0, 24).map((set) => {
   if (!user.pity[set.id]) user.pity[set.id] = { SSR: 0, S: 0, UR: 0 }

   const pity = user.pity[set.id]
   const ssr = pity.SSR ?? 0
   const s = pity.S ?? 0
   const ur = pity.UR ?? 0

   const completion = getSetCompletion(user, set.id)
   const setCardCount = (setCache[set.id] || []).length

   return {
    label: set.name,
    value: set.id,
    description: `SSR ${ssr}/50 | S ${s}/30 | UR ${ur}/10 | ${completion.owned}/${completion.total} (${setCardCount} cartes)`
   }
  }))

  const menu = new StringSelectMenuBuilder()
   .setCustomId(`krosmoz_set_${interaction.user.id}`)
   .setPlaceholder("Choisis un set")
   .addOptions(options)

  const row = new ActionRowBuilder().addComponents(menu)

  await interaction.reply({
   content:
`🎴 **Choisis un set**

📦 Packs achetés : **${user.packs || 0}**
${getCooldownText(user)}`,
   components: [row]
  })
 },

 async select(interaction) {
  const ownerId = String(interaction.customId || "").replace("krosmoz_set_", "")
  if (ownerId && ownerId !== interaction.user.id) {
   return interaction.reply({ content: "Ce menu n'est pas pour toi.", flags: 64 })
  }

  await interaction.deferReply()
  const setId = interaction.values[0]
  return openPacksBatch(interaction, setId, 1)
 }
}
