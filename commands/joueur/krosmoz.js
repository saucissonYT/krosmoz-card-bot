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
const MAX_BATCH = 20

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

 const beforeCompletion = getSetCompletion(user, setId)
 const setCache = getSetCache()

 if ((setCache[setId] || []).length === 0) {
  return interaction.editReply("Ce set ne contient aucune carte jouable actuellement.")
 }

 if (!user.pity) user.pity = {}
 if (!user.pity[setId]) user.pity[setId] = { SSR: 0, S: 0, UR: 0 }
 if (!user.stats) user.stats = {}

 const pity = user.pity[setId]
 if (pity.S === undefined) pity.S = 0
 if (pity.UR === undefined) pity.UR = 0
 if (pity.SSR === undefined) pity.SSR = 0

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
 user.lastSet = setId

 updateActivityStreak(user)

 await interaction.editReply(`🎴 Ouverture de **${packCount}** pack(s) sur **${setId}**...`)

 const results = []
 for (let i = 0; i < packCount; i++) {
  results.push(openPack(user, setId, interaction.user.id))
  await addBattlePassXP(interaction.user.id, "pack_open")
 }

 const afterCompletion = getSetCompletion(user, setId)
 if (
  beforeCompletion.total > 0 &&
  beforeCompletion.owned < beforeCompletion.total &&
  afterCompletion.owned === afterCompletion.total
 ) {
  await addBattlePassXP(interaction.user.id, 480, "set_complete")
 }

 save(interaction.user.id)

 const unlocked = []
 unlocked.push(...achievementCheck(user, "pack"))
 unlocked.push(...achievementCheck(user, "collection"))
 unlocked.push(...achievementCheck(user, "economy"))
 unlocked.push(...achievementCheck(user, "rng"))

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

 const embed = new EmbedBuilder()
  .setTitle(`🎴 Giga Pack ouvert x${packCount}`)
  .setDescription(lines.join("\n") || "Aucune carte.")
  .addFields(
   { name: "💰 Kamas gagnés", value: `+${totals.kamas}`, inline: true },
   { name: "⭐ XP gagnée", value: `+${totals.xp}`, inline: true },
   { name: "📦 Packs consommés", value: `${packCount} (${freePacks} gratuit + ${paidNeeded} payants)`, inline: true },
   { name: "🌈 SSR Pity", value: `${pity.SSR}/50`, inline: true },
   { name: "✨ S Pity", value: `${pity.S}/30`, inline: true },
   { name: "🟡 UR Pity", value: `${pity.UR}/10`, inline: true }
  )
  .setColor(RARITY_COLOR[best?.rarity] || "#f1c40f")

 if (totals.lucky > 0) {
  embed.addFields({ name: "🎁 Lucky Packs", value: `${totals.lucky}`, inline: true })
 }

 await interaction.editReply({ embeds: [embed] })

 if (discoveredById.size > 0) {
  const cards = Array.from(discoveredById.values())
  const linesDiscover = cards.slice(0, 20).map((c) => `🔎 **${c.name}**`)
  const more = cards.length > linesDiscover.length ? `\n... +${cards.length - linesDiscover.length}` : ""
  await interaction.followUp({ content: `Nouvelle découverte !\n${linesDiscover.join("\n")}${more}`, flags: 64 })
 }

 if (unlocked.length) {
  await notifyAchievements(interaction, unlocked)
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

    if (sets.length > 0) {
     option.addChoices(...sets.slice(0, 25).map((s) => ({ name: s.name, value: s.id })))
    }

    return option
   })
   .addIntegerOption((option) =>
    option
     .setName("packs")
     .setDescription("Nombre de packs à ouvrir (1-20)")
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
   await interaction.deferReply({ flags: 64 })
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
  const options = sets.slice(0, 25).map((set) => {
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
  })

  const menu = new StringSelectMenuBuilder()
   .setCustomId("krosmoz_set")
   .setPlaceholder("Choisis un set")
   .addOptions(options)

  const row = new ActionRowBuilder().addComponents(menu)

  await interaction.reply({
   content:
`🎴 **Choisis un set**

📦 Packs achetés : **${user.packs || 0}**
${getCooldownText(user)}`,
   components: [row],
   flags: 64
  })
 },

 async select(interaction) {
  await interaction.deferReply()
  const setId = interaction.values[0]
  return openPacksBatch(interaction, setId, 1)
 }
}
