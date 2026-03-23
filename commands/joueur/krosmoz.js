const {
 SlashCommandBuilder,
 ActionRowBuilder,
 StringSelectMenuBuilder,
 ButtonBuilder,
 ButtonStyle,
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

/* ─── Cache sets ──────────────────────────────────────────────────────────── */

function getSetCache() {
 const cards = getCards()
 const cache = {}
 for (const card of cards) {
  if (!cache[card.set]) cache[card.set] = []
  cache[card.set].push(card)
 }
 return cache
}

/* ─── Cooldown ────────────────────────────────────────────────────────────── */

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

/* ─── Complétion set ─────────────────────────────────────────────────────── */

function getSetCompletion(user, setId) {
 const cache    = getSetCache()
 const setCards = cache[setId] || []
 let owned = 0
 for (const card of setCards) {
  if (user.cards?.[card.id]) owned++
 }
 return { owned, total: setCards.length }
}

/* ─── Sets jouables ──────────────────────────────────────────────────────── */

function getPlayableSets(rawSets) {
 const sets  = Array.isArray(rawSets) ? rawSets : rawSets?.sets || []
 const cache = getSetCache()
 return sets.filter((set) => (cache[set.id] || []).length > 0)
}

/* ─── Tri rareté ─────────────────────────────────────────────────────────── */

function rarityRank(rarity) {
 return RARITY_ORDER.indexOf(rarity)
}

/* ─── Agrégation cartes multi-pack ──────────────────────────────────────── */

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
  const d = rarityRank(b.card.rarity) - rarityRank(a.card.rarity)
  if (d !== 0) return d
  return String(a.card.name || "").localeCompare(String(b.card.name || ""))
 })
}

/* ─── Options du select menu sets ────────────────────────────────────────── */

function buildSetOptions(user) {
 const rawSets = loadSets()
 const sets    = getPlayableSets(rawSets)

 if (!user.pity)  user.pity  = {}
 if (!user.stats) user.stats = {}

 const options = [{
  label:       "🎲 Random",
  value:       "random",
  description: "Packs répartis aléatoirement entre tous les sets"
 }]

 for (const set of sets.slice(0, 24)) {
  if (!user.pity[set.id]) user.pity[set.id] = { SSR: 0, S: 0, UR: 0 }
  const { owned, total } = getSetCompletion(user, set.id)
  const pct = total > 0 ? Math.floor(owned / total * 100) : 0
  const ssr = user.pity[set.id].SSR ?? 0
  options.push({
   label:       `${set.name} (${owned}/${total})`,
   value:        set.id,
   description: `${pct}% complété · SSR pity : ${ssr}/50`
  })
 }

 return options
}

/* ─── Boutons de quantité ────────────────────────────────────────────────── */

function buildQuantityRow(user, hasFree) {
 const stock = user.packs || 0

 const canOpen = (n) => {
  const paid = Math.max(0, n - (hasFree ? 1 : 0))
  return paid <= stock
 }

 const row = new ActionRowBuilder()
 for (const n of [1, 5, 10, 25]) {
  row.addComponents(
   new ButtonBuilder()
    .setCustomId(`krosmoz_qty_${n}`)
    .setLabel(`x${n}`)
    .setStyle(n === 1 ? ButtonStyle.Primary : ButtonStyle.Secondary)
    .setDisabled(!canOpen(n))
  )
 }
 row.addComponents(
  new ButtonBuilder()
   .setCustomId("krosmoz_back")
   .setLabel("← Retour")
   .setStyle(ButtonStyle.Danger)
 )
 return row
}

/* ─── Ouverture des packs ────────────────────────────────────────────────── */

async function openPacksBatch(interaction, setId, requestedCount) {
 const packCount = Math.max(1, Math.min(MAX_BATCH, requestedCount || 1))
 const user      = getUser(interaction.user.id)
 const rawSets   = loadSets()
 const playableSets = getPlayableSets(rawSets)
 const playableIds  = playableSets.map((s) => s.id)
 const isRandom     = setId === "random"

 if (playableIds.length === 0)
  return interaction.editReply("Aucun set jouable disponible actuellement.")

 if (!isRandom && !playableIds.includes(setId))
  return interaction.editReply("Ce set n'est pas disponible actuellement.")

 const setCache = getSetCache()
 if (!isRandom && (setCache[setId] || []).length === 0)
  return interaction.editReply("Ce set ne contient aucune carte jouable actuellement.")

 /* Snapshot de complétion avant ouverture */
 const beforeCompletionBySet = {}
 for (const sid of (isRandom ? playableIds : [setId])) {
  beforeCompletionBySet[sid] = getSetCompletion(user, sid)
 }

 if (!user.pity)  user.pity  = {}
 if (!user.stats) user.stats = {}
 if (!isRandom && !user.pity[setId]) user.pity[setId] = { SSR: 0, S: 0, UR: 0 }

 if (!isRandom) {
  const p = user.pity[setId]
  if (p.S   === undefined) p.S   = 0
  if (p.UR  === undefined) p.UR  = 0
  if (p.SSR === undefined) p.SSR = 0
 }

 const now      = Date.now()
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
  let msg =
`❌ Packs insuffisants.
Ouverture demandée : **${packCount}**
Packs payants nécessaires : **${paidNeeded}**
Packs en stock : **${ownedPacks}** (manque **${missing}**)`
  if (freePacks === 0 && !cooldownDev.cooldownDisabled()) {
   const remain = Math.ceil((cooldown - (now - user.lastPack)) / 60000)
   msg += `\n⏳ Prochain pack gratuit : **${Math.max(1, remain)} min**`
  }
  return interaction.editReply(msg)
 }

 if (freePacks > 0) user.lastPack = now
 if (paidNeeded > 0) user.packs = ownedPacks - paidNeeded

 user.stats.packsOpened   = (user.stats.packsOpened   || 0) + packCount
 user.stats.krosmozOpened = (user.stats.krosmozOpened || 0) + packCount
 user.stats.maxBulkOpen   = Math.max(user.stats.maxBulkOpen || 0, packCount)
 if (packCount >= 2) user.stats.multiPackOpens = (user.stats.multiPackOpens || 0) + 1

 updateActivityStreak(user)

 await interaction.editReply(`🎴 Ouverture de **${packCount}** pack(s) sur **${isRandom ? "random" : setId}**...`)

 const results      = []
 const setOpenCount = {}
 const progressStep = packCount >= 10 ? 3 : 2

 /* Snapshot des cartes AVANT pour savoir ce qui est nouveau */
 const cardsSnapshot = { ...user.cards }

 for (let i = 0; i < packCount; i++) {
  const chosenSetId = isRandom
   ? playableIds[Math.floor(Math.random() * playableIds.length)]
   : setId

  setOpenCount[chosenSetId] = (setOpenCount[chosenSetId] || 0) + 1
  user.lastSet = chosenSetId
  if (!user.pity[chosenSetId]) user.pity[chosenSetId] = { SSR: 0, S: 0, UR: 0 }

  const result = openPack(user, chosenSetId, interaction.user.id, {
   isSimpleCommandOpen: packCount === 1
  })
  result._setId = chosenSetId
  results.push(result)

  await addBattlePassXP(interaction.user.id, "pack_open")

  if ((i + 1) % progressStep === 0 || i + 1 === packCount) {
   const top = Object.entries(setOpenCount)
    .sort((a, b) => b[1] - a[1]).slice(0, 3)
    .map(([sid, qty]) => `${sid}:${qty}`).join(" | ")
   await interaction.editReply(`🎴 Ouverture en cours... **${i + 1}/${packCount}**${top ? `\n🎲 ${top}` : ""}`)
  }
 }

 /* Set completions */
 for (const sid of Object.keys(setOpenCount)) {
  const bc = beforeCompletionBySet[sid] || { owned: 0, total: 0 }
  const ac = getSetCompletion(user, sid)
  if (bc.total > 0 && bc.owned < bc.total && ac.owned === ac.total) {
   await addBattlePassXP(interaction.user.id, 480, "set_complete")
  }
 }

 const unlocked = []
 unlocked.push(...achievementCheck(user, "pack"))
 unlocked.push(...achievementCheck(user, "collection"))
 unlocked.push(...achievementCheck(user, "economy"))
 unlocked.push(...achievementCheck(user, "rng"))
 const uniqueUnlocked = [...new Set(unlocked)]
 save(interaction.user.id)

 /* ── Cartes nouvelles (absentes du snapshot AVANT) ───────────────────────── */
 const newCardIds = new Set()
 for (const r of results) {
  for (const card of r.pack || []) {
   if (card && card.id !== undefined && !cardsSnapshot[card.id]) {
    newCardIds.add(String(card.id))
    cardsSnapshot[card.id] = 1 /* marquer pour éviter doublons dans la même session */
   }
  }
 }

 /* ── Aggregation + lignes ────────────────────────────────────────────────── */
 const grouped   = aggregateCards(results)
 const displayed = grouped.slice(0, 45)
 const hidden    = Math.max(0, grouped.length - displayed.length)

 const lines = displayed.map(({ card, qty }) => {
  const isNew   = newCardIds.has(String(card.id))
  const qtyText = qty > 1 ? ` (x${qty})` : ""
  const newTag  = isNew ? " 🆕" : ""
  return `${RARITY_EMOJI[card.rarity]} **${card.name}${card.shiny ? " ✨" : ""}**${newTag} \`${card.rarity}\`${qtyText}`
 })
 if (hidden > 0) lines.push(`... +${hidden} carte(s) unique(s) supplémentaire(s)`)

 const totals = results.reduce((acc, r) => {
  acc.kamas += r.kamasGain || 0
  acc.xp    += r.xpGain    || 0
  if (r.luckyPack) acc.lucky++
  return acc
 }, { kamas: 0, xp: 0, lucky: 0 })

 let best = null
 for (const r of results) {
  if (!r.best) continue
  if (!best || rarityRank(r.best.rarity) > rarityRank(best.rarity)) best = r.best
 }

 /* ── Défilement rapide ───────────────────────────────────────────────────── */
 const scrollPreview = lines.slice(0, 18)
 if (scrollPreview.length > 0) {
  const step  = packCount >= 10 ? 6 : 4
  const delay = packCount >= 10 ? 180 : 240

  for (let i = step; i <= scrollPreview.length; i += step) {
   const chunk = scrollPreview.slice(0, i).join("\n")
   await interaction.editReply({
    embeds: [new EmbedBuilder()
     .setTitle(packCount === 1 ? "🎴 Pack en cours..." : `🎴 Giga Pack x${packCount} — Défilement`)
     .setDescription(`${chunk}${i < scrollPreview.length ? "\n\n..." : ""}`)
     .setColor(RARITY_COLOR[best?.rarity] || "#f1c40f")]
   })
   await sleep(delay)
  }
 }

 /* ── Embed final ─────────────────────────────────────────────────────────── */
 const title = packCount === 1 ? "🎴 Pack ouvert !" : `🎴 Giga Pack ouvert x${packCount}`

 const embed = new EmbedBuilder()
  .setTitle(title)
  .setDescription(lines.join("\n") || "Aucune carte.")
  .addFields(
   { name: "💰 Kamas gagnés",   value: `+${totals.kamas}`, inline: true },
   { name: "⭐ XP gagnée",       value: `+${totals.xp}`,   inline: true },
   { name: "📦 Packs consommés", value: `${packCount} (${freePacks} gratuit + ${paidNeeded} payants)`, inline: true },
   { name: "🌈 SSR Pity", value: isRandom ? "Par set (random)" : `${user.pity?.[setId]?.SSR ?? 0}/50`, inline: true },
   { name: "✨ S Pity",   value: isRandom ? "Par set (random)" : `${user.pity?.[setId]?.S   ?? 0}/30`, inline: true },
   { name: "🟡 UR Pity",  value: isRandom ? "Par set (random)" : `${user.pity?.[setId]?.UR  ?? 0}/10`, inline: true }
  )
  .setColor(RARITY_COLOR[best?.rarity] || "#f1c40f")

 if (totals.lucky > 0)
  embed.addFields({ name: "🎁 Lucky Packs", value: `${totals.lucky}`, inline: true })

 if (newCardIds.size > 0)
  embed.addFields({ name: "🆕 Nouvelles cartes", value: `${newCardIds.size}`, inline: true })

 if (isRandom) {
  const breakdown = Object.entries(setOpenCount)
   .sort((a, b) => b[1] - a[1])
   .map(([sid, qty]) => `• ${sid}: ${qty}`).join("\n")
  if (breakdown)
   embed.addFields({ name: "🎲 Répartition des sets", value: breakdown, inline: false })
 }

 await interaction.editReply({ embeds: [embed] })

 /* Nouvelle découverte (message privé conservé) */
 if (newCardIds.size > 0) {
  const newNames = Array.from(newCardIds)
   .map((id) => {
    for (const r of results) {
     for (const c of r.pack || []) {
      if (String(c.id) === id) return `🔎 **${c.name}**`
     }
    }
    return null
   })
   .filter(Boolean)
   .slice(0, 20)

  const more = newCardIds.size > newNames.length ? `\n... +${newCardIds.size - newNames.length}` : ""
  await interaction.followUp({ content: `Nouvelle découverte !\n${newNames.join("\n")}${more}`, flags: 64 })
 }

 if (uniqueUnlocked.length) {
  await notifyAchievements(interaction, uniqueUnlocked)
 }
}

/* ─── Exports ────────────────────────────────────────────────────────────── */

module.exports = {
 name: "krosmoz",

 data: new SlashCommandBuilder()
  .setName("krosmoz")
  .setDescription("Ouvrir un ou plusieurs packs Krosmoz")
  .addStringOption((option) =>
   option.setName("set")
    .setDescription("Set à ouvrir (laisser vide pour le menu interactif)")
    .setRequired(false)
    .setAutocomplete(true)
  )
  .addIntegerOption((option) =>
   option.setName("packs")
    .setDescription("Nombre de packs à ouvrir (1-25)")
    .setRequired(false)
    .setMinValue(1)
    .setMaxValue(MAX_BATCH)
  ),

 /* ── Autocomplete ─────────────────────────────────────────────────────────── */
 async autocomplete(interaction) {
  const focused      = interaction.options.getFocused().toLowerCase()
  const rawSets      = loadSets()
  const playableSets = getPlayableSets(rawSets)

  let user = null
  try { user = getUser(interaction.user.id) } catch (_) {}

  const choices = [{ name: "🎲 Random — tous les sets", value: "random" }]

  for (const set of playableSets.slice(0, 24)) {
   let label = set.name
   if (user) {
    const { owned, total } = getSetCompletion(user, set.id)
    const pct = total > 0 ? Math.floor(owned / total * 100) : 0
    if (!user.pity)        user.pity = {}
    if (!user.pity[set.id]) user.pity[set.id] = { SSR: 0, S: 0, UR: 0 }
    const ssr = user.pity[set.id].SSR ?? 0
    label = `${set.name} (${owned}/${total}) — ${pct}% · SSR pity : ${ssr}/50`
   }
   choices.push({ name: label, value: set.id })
  }

  const filtered = focused
   ? choices.filter((c) => c.name.toLowerCase().includes(focused) || c.value.toLowerCase().includes(focused))
   : choices

  await interaction.respond(filtered.slice(0, 25))
 },

 /* ── Execute ──────────────────────────────────────────────────────────────── */
 async execute(interaction) {
  const user       = getUser(interaction.user.id)
  const quickSet   = interaction.options.getString("set")
  const quickCount = interaction.options.getInteger("packs") || 1

  /* Ouverture directe via paramètre set */
  if (quickSet) {
   await interaction.deferReply()
   return openPacksBatch(interaction, quickSet, quickCount)
  }

  /* Menu interactif */
  const rawSets = loadSets()
  const sets    = getPlayableSets(rawSets)

  if (!sets || sets.length === 0)
   return interaction.reply({ content: "❌ Aucun set disponible.", flags: 64 })

  const options = buildSetOptions(user)

  const menu = new StringSelectMenuBuilder()
   .setCustomId(`krosmoz_set_${interaction.user.id}`)
   .setPlaceholder("Choisis un set...")
   .addOptions(options)

  const row = new ActionRowBuilder().addComponents(menu)

  await interaction.reply({
   content:
`🎴 **Choisis un set**

📦 Packs en stock : **${user.packs || 0}**
${getCooldownText(user)}`,
   components: [row]
  })
 },

 /* ── Select (set choisi → boutons de quantité) ────────────────────────────── */
 async select(interaction) {
  const ownerId = String(interaction.customId || "").replace("krosmoz_set_", "")
  if (ownerId && ownerId !== interaction.user.id)
   return interaction.reply({ content: "Ce menu n'est pas pour toi.", flags: 64 })

  const setId    = interaction.values[0]
  const user     = getUser(interaction.user.id)
  const isRandom = setId === "random"

  if (!user.pity)        user.pity  = {}
  if (!user.pity[setId]) user.pity[setId] = { SSR: 0, S: 0, UR: 0 }
  if (!user.stats)       user.stats = {}

  const pity = user.pity[setId]
  if (pity.S   === undefined) pity.S   = 0
  if (pity.UR  === undefined) pity.UR  = 0
  if (pity.SSR === undefined) pity.SSR = 0

  const now      = Date.now()
  const cooldown = getCooldownMs(user)
  const hasFree  = cooldownDev.cooldownDisabled() || !user.lastPack || now - user.lastPack >= cooldown

  /* Complétion du set */
  let completionLine = ""
  if (!isRandom) {
   const { owned, total } = getSetCompletion(user, setId)
   const pct = total > 0 ? Math.floor(owned / total * 100) : 0
   completionLine = `📚 Complétion : **${owned}/${total}** (${pct}%)\n`
  }

  const content =
`🎴 **${isRandom ? "🎲 Random — tous les sets" : setId}**
${completionLine}📦 Packs en stock : **${user.packs || 0}**
${getCooldownText(user)}${!isRandom ? `\n🌈 SSR Pity : **${pity.SSR}/50** · ✨ S : **${pity.S}/30** · 🟡 UR : **${pity.UR}/10**` : ""}

**Combien de packs ouvrir ?**`

  const quantityRow = buildQuantityRow(user, hasFree)

  await interaction.update({ content, components: [quantityRow], embeds: [] })

  const msg       = interaction.message
  const collector = msg.createMessageComponentCollector({
   filter: (i) => i.user.id === interaction.user.id,
   time:   60000
  })

  collector.on("collect", async i => {

   /* ← Retour au menu sets */
   if (i.customId === "krosmoz_back") {
    const freshUser = getUser(interaction.user.id)
    const opts      = buildSetOptions(freshUser)

    const menu = new StringSelectMenuBuilder()
     .setCustomId(`krosmoz_set_${interaction.user.id}`)
     .setPlaceholder("Choisis un set...")
     .addOptions(opts)

    const row = new ActionRowBuilder().addComponents(menu)

    collector.stop("back")
    return i.update({
     content:
`🎴 **Choisis un set**

📦 Packs en stock : **${freshUser.packs || 0}**
${getCooldownText(freshUser)}`,
     components: [row],
     embeds: []
    })
   }

   /* Ouverture x1/5/10/25 */
   if (i.customId.startsWith("krosmoz_qty_")) {
    const count = parseInt(i.customId.replace("krosmoz_qty_", ""))
    collector.stop("open")
    await i.deferReply()
    return openPacksBatch(i, setId, count)
   }
  })

  collector.on("end", (_, reason) => {
   if (reason === "time") {
    msg.edit({ content: "⏱️ Menu expiré.", components: [], embeds: [] }).catch(() => {})
   }
  })
 }
}