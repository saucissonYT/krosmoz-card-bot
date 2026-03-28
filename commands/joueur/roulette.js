// commands/joueur/roulette.js
// La Roulette d'Ecaflip - 31 lots - 46 succes - 1 jackpot secret

const { SlashCommandBuilder, EmbedBuilder } = require("discord.js")
const { getUser, save } = require("../../systems/userSystem")
const { addXP } = require("../../systems/progressionSystem")
const { addBattlePassXP } = require("../../systems/battlePassService")
const { achievementCheck } = require("../../systems/achievementCheck")
const { notifyAchievements } = require("../../systems/achievementNotifier")
const { getCards } = require("../../systems/cardRegistry")
const { rollFragmentForEvent, grantRolledFragment } = require("../../systems/fragmentService")

const COOLDOWN_MS = 60 * 60 * 1000
const spinLocks = new Set()

// Salons autorises pour /roulette - ajouter les IDs ici
const ALLOWED_CHANNELS = [
 "1487121269018329178",
 "1487121289393995776",
 "1487545856738590911"
]

const LOTS = [
 { id: 1, emoji: "🪙", name: "Bourse legere", rarity: "commun", weight: 15, reward: { kamas: 150 } },
 { id: 2, emoji: "🪙", name: "Poignee de kamas", rarity: "commun", weight: 14, reward: { kamas: 300 } },
 { id: 3, emoji: "🪙", name: "Bourse remplie", rarity: "commun", weight: 13, reward: { kamas: 500 } },
 { id: 4, emoji: "📦", name: "Pack simple", rarity: "commun", weight: 13, reward: { packs: 1 } },
 { id: 5, emoji: "🪙", name: "Kamas du chat", rarity: "commun", weight: 13, reward: { kamas: 750 } },
 { id: 6, emoji: "📦", name: "Double pack", rarity: "commun", weight: 12, reward: { packs: 2 } },
 { id: 7, emoji: "🪙", name: "Sac de kamas", rarity: "commun", weight: 12, reward: { kamas: 1000 } },
 { id: 8, emoji: "⭐", name: "Petite XP", rarity: "commun", weight: 12, reward: { xp: 100 } },
 { id: 9, emoji: "📦", name: "Duo de packs", rarity: "commun", weight: 12, reward: { packs: 2 } },
 { id: 10, emoji: "🪙", name: "Coffret leger", rarity: "commun", weight: 12, reward: { kamas: 1250 } },

 { id: 11, emoji: "🪙", name: "Reserve de kamas", rarity: "peucommun", weight: 9, reward: { kamas: 1500 } },
 { id: 12, emoji: "📦", name: "Trio de packs", rarity: "peucommun", weight: 9, reward: { packs: 3 } },
 { id: 13, emoji: "⭐", name: "XP solide", rarity: "peucommun", weight: 8, reward: { xp: 250 } },
 { id: 14, emoji: "🪙", name: "Bourse epaisse", rarity: "peucommun", weight: 8, reward: { kamas: 2000 } },
 { id: 15, emoji: "📦", name: "Pack triple", rarity: "peucommun", weight: 8, reward: { packs: 3 } },
 { id: 16, emoji: "🧩", name: "Fragment unique", rarity: "peucommun", weight: 8, reward: { fragments: 1 } },
 { id: 17, emoji: "🪙", name: "Sac de richesses", rarity: "peucommun", weight: 7, reward: { kamas: 2500 } },
 { id: 18, emoji: "📦", name: "Cinq packs", rarity: "peucommun", weight: 7, reward: { packs: 5 } },
 { id: 19, emoji: "⭐", name: "Bonne XP", rarity: "peucommun", weight: 7, reward: { xp: 500 } },
 { id: 20, emoji: "🧩", name: "Double fragment", rarity: "peucommun", weight: 7, reward: { fragments: 2 } },

 { id: 21, emoji: "🪙", name: "Tresor d'Ecaflip", rarity: "rare", weight: 5, reward: { kamas: 5000 } },
 { id: 22, emoji: "📦", name: "Lot de packs", rarity: "rare", weight: 4, reward: { packs: 8 } },
 { id: 23, emoji: "🧩", name: "Triple fragment", rarity: "rare", weight: 4, reward: { fragments: 3 } },
 { id: 24, emoji: "🃏", name: "Carte HR garantie", rarity: "rare", weight: 4, reward: { cardRarity: "HR" } },
 { id: 25, emoji: "🪙", name: "Grand Tresor", rarity: "rare", weight: 4, reward: { kamas: 7500 } },
 { id: 26, emoji: "📦", name: "Dix packs", rarity: "rare", weight: 4, reward: { packs: 10 } },

 { id: 27, emoji: "🪙", name: "Fortune d'Ecaflip", rarity: "tresrare", weight: 2, reward: { kamas: 15000 } },
 { id: 28, emoji: "🃏", name: "Carte UR garantie", rarity: "tresrare", weight: 2, reward: { cardRarity: "UR" } },
 { id: 29, emoji: "📦", name: "Mega lot packs", rarity: "tresrare", weight: 2, reward: { packs: 15, kamas: 1000 } },
 { id: 30, emoji: "🌈", name: "SSR du Destin", rarity: "tresrare", weight: 1, reward: { cardRarity: "SSR" } },

 { id: 31, emoji: "🎰", name: "JACKPOT KROSMIQUE !!!", rarity: "jackpot", weight: 0.1, reward: { cardShiny: true, kamas: 10000, packs: 5 } }
]

const RARITY_COLORS = {
 commun: "#9E9E9E",
 peucommun: "#4CAF50",
 rare: "#2196F3",
 tresrare: "#F44336",
 jackpot: "#FFD700"
}

const RARITY_LABELS = {
 commun: "⬜ Commun",
 peucommun: "🟩 Peu commun",
 rare: "🟦 Rare",
 tresrare: "🟥 Tres rare",
 jackpot: "🌟 JACKPOT"
}

const CARD_RARITY_ORDER = ["C", "U", "R", "SR", "HR", "UR", "S", "SSR"]

function pickLot() {
 const total = LOTS.reduce((s, l) => s + l.weight, 0)
 let rand = Math.random() * total
 for (const lot of LOTS) {
  rand -= lot.weight
  if (rand <= 0) return lot
 }
 return LOTS[0]
}

function getConfiguredAllowedChannels() {
 return ALLOWED_CHANNELS.filter((id) => /^\d{16,22}$/.test(String(id || "").trim()))
}

function isCommandAllowedInChannel(interaction) {
 const configured = getConfiguredAllowedChannels()
 if (configured.length === 0) return true
 const currentChannelId = interaction.channelId
 const parentId = interaction.channel?.parentId || null
 return configured.includes(currentChannelId) || (parentId && configured.includes(parentId))
}

function getFRHour() {
 return new Date(Date.now()).toLocaleString("fr-FR", {
  timeZone: "Europe/Paris",
  hour: "numeric",
  hour12: false
 }) | 0
}

function getDayId(offsetDays = 0) {
 const d = new Date(Date.now() + offsetDays * 86400000)
 return d.toLocaleDateString("fr-FR", {
  timeZone: "Europe/Paris",
  year: "numeric",
  month: "2-digit",
  day: "2-digit"
 })
}

function getPreviousDayId() {
 return getDayId(-1)
}

function updateRouletteStats(user, lot, now) {
 const s = user.stats

 s.rouletteSpins = (s.rouletteSpins || 0) + 1
 s.rouletteLastSpin = new Date(now).toISOString()

 const dayId = getDayId()
 if (s.rouletteLastDay === getPreviousDayId()) {
  s.rouletteConsecDays = (s.rouletteConsecDays || 0) + 1
 } else if (s.rouletteLastDay !== dayId) {
  s.rouletteConsecDays = 1
 }
 s.rouletteLastDay = dayId

 s.rouletteWinKamas = (s.rouletteWinKamas || 0) + (lot.reward.kamas || 0)
 s.rouletteWinPacks = (s.rouletteWinPacks || 0) + (lot.reward.packs || 0)

 const rarityMap = {
  commun: "rouletteLotCommun",
  peucommun: "rouletteLotPeuCommun",
  rare: "rouletteLotRare",
  tresrare: "rouletteLotTresRare"
 }
 if (rarityMap[lot.rarity]) {
  s[rarityMap[lot.rarity]] = (s[rarityMap[lot.rarity]] || 0) + 1
 }

 if (lot.reward.cardRarity === "SSR") s.rouletteWinSSR = (s.rouletteWinSSR || 0) + 1
 if (lot.reward.cardShiny) s.rouletteWinShiny = (s.rouletteWinShiny || 0) + 1
 if (lot.id === 31) s.rouletteJackpot = (s.rouletteJackpot || 0) + 1

 const frHour = getFRHour()
 if (frHour >= 2 && frHour < 5) s.rouletteNightSpin = true
 if (frHour >= 13 && frHour < 14) s.rouletteLunchSpin = true
}

function pickCardByRarity(rarity) {
 const cards = getCards().filter((card) => card.rarity === rarity)
 if (!cards.length) return null
 return cards[Math.floor(Math.random() * cards.length)]
}

function grantRandomCard(user, rarity, options = {}) {
 const card = pickCardByRarity(rarity)
 if (!card) return null

 if (!user.cards) user.cards = {}
 user.cards[card.id] = (user.cards[card.id] || 0) + 1

 if (!user.stats) user.stats = {}
 if (rarity === "SSR") user.stats.ssrPulled = (user.stats.ssrPulled || 0) + 1

 if (options.shiny && rarity === "SSR") {
  if (!user.shinyCards) user.shinyCards = {}
  user.shinyCards[card.id] = (user.shinyCards[card.id] || 0) + 1
  user.stats.shinySSR = (user.stats.shinySSR || 0) + 1
 }

 return {
  id: card.id,
  name: card.name,
  rarity,
  shiny: Boolean(options.shiny)
 }
}

async function applyReward(interaction, user, lot) {
 const r = lot.reward

 if (r.kamas) {
  user.kamas = (user.kamas || 0) + r.kamas
  if (!user.stats) user.stats = {}
  user.stats.kamasEarned = (user.stats.kamasEarned || 0) + r.kamas
  user.stats.totalKamasEarned = (user.stats.totalKamasEarned || 0) + r.kamas
 }

 if (r.xp) addXP(user, r.xp)
 if (r.packs) user.packs = (user.packs || 0) + r.packs

 if (r.fragments) {
  for (let i = 0; i < r.fragments; i++) {
   const rolled = rollFragmentForEvent(1)
   if (rolled) grantRolledFragment(interaction.user.id, rolled, "roulette")
  }
 }

 if (r.cardRarity && CARD_RARITY_ORDER.includes(r.cardRarity)) {
  grantRandomCard(user, r.cardRarity)
 }
 if (r.cardShiny) {
  grantRandomCard(user, "SSR", { shiny: true })
 }
}

function formatReward(reward) {
 const parts = []
 if (reward.kamas) parts.push(`💰 ${reward.kamas.toLocaleString("fr-FR")} kamas`)
 if (reward.packs) parts.push(`📦 ${reward.packs} pack${reward.packs > 1 ? "s" : ""}`)
 if (reward.xp) parts.push(`⭐ ${reward.xp} XP joueur`)
 if (reward.fragments) parts.push(`🧩 ${reward.fragments} fragment${reward.fragments > 1 ? "s" : ""} aleatoire${reward.fragments > 1 ? "s" : ""}`)
 if (reward.cardRarity) parts.push(`🃏 1 carte **${reward.cardRarity}** aleatoire`)
 if (reward.cardShiny) parts.push("✨ 1 SSR **Shiny** aleatoire")
 return parts.join("\n") || "—"
}

function buildResultEmbed(discordUser, lot, user) {
 const isJackpot = lot.id === 31

 if (isJackpot) {
  return new EmbedBuilder()
   .setTitle("🎰 JACKPOT KROSMIQUE 🎰")
   .setColor("#FFD700")
   .setDescription(
    `## **JE N'Y CROIS PAS. APRES TOUT CE TEMPS.**\n` +
    `**${discordUser.username.toUpperCase()} VIENT DE DECROCHER LE JACKPOT KROSMIQUE.\n` +
    `J'AVAIS PARIE SUR TOI. ENFIN PRESQUE. PEU IMPORTE.**\n\n` +
    `*- Ecaflip, aussi surpris que toi*`
   )
   .addFields(
    { name: "🌟 Lot obtenu", value: "**JACKPOT KROSMIQUE SECRET**", inline: false },
    { name: "🎁 Recompenses", value: "✨ 1 SSR Shiny aleatoire\n💰 10 000 kamas\n📦 5 packs", inline: false },
    { name: "🎡 Tours effectues", value: `${user.stats.rouletteSpins}`, inline: true },
    { name: "🏆 Jackpots", value: `${user.stats.rouletteJackpot}`, inline: true }
   )
   .setFooter({ text: "Ecaflip te regarde avec un melange d'admiration et de jalousie." })
 }

 return new EmbedBuilder()
  .setTitle("🎡 Roulette d'Ecaflip")
  .setColor(RARITY_COLORS[lot.rarity])
  .setDescription(`${lot.emoji} **${lot.name}**\n${RARITY_LABELS[lot.rarity]}`)
  .addFields(
   { name: "🎁 Recompense", value: formatReward(lot.reward), inline: true },
   { name: "🎡 Tours totaux", value: `${user.stats.rouletteSpins}`, inline: true }
  )
  .setFooter({ text: "Prochain tour disponible dans 1 heure." })
}

async function sendJackpotAnnounce(interaction) {
 await interaction.channel.send({
  content:
   `## 🎰 JACKPOT KROSMIQUE 🎰\n` +
   `**${interaction.user.toString()} VIENT DE DECROCHER LE JACKPOT SECRET` +
   ` DE LA ROULETTE D'ECAFLIP !**\n` +
   `**SSR SHINY + 10 000 KAMAS + 5 PACKS. ECAFLIP EST FURIEUX. ET ADMIRATIF.**`
 })
}

module.exports = {
 data: new SlashCommandBuilder()
  .setName("roulette")
  .setDescription("🎡 Tenter sa chance a la Roulette d'Ecaflip (1 fois / heure)"),

 async execute(interaction) {
  if (!isCommandAllowedInChannel(interaction)) {
   return interaction.reply({
    content: "🎡 La Roulette d'Ecaflip n'est disponible que dans les salons dedies.",
    flags: 64
   })
  }

  if (spinLocks.has(interaction.user.id)) {
   return interaction.reply({
    content: "⏳ Une roulette est deja en cours pour toi. Attends la fin du tirage.",
    flags: 64
   })
  }

  spinLocks.add(interaction.user.id)

  try {
   const user = getUser(interaction.user.id)
   if (!user.stats) user.stats = {}

   const now = Date.now()
   const last = user.stats.rouletteLastSpin ? new Date(user.stats.rouletteLastSpin).getTime() : 0
   const elapsed = now - last

   if (elapsed < COOLDOWN_MS) {
    const remaining = COOLDOWN_MS - elapsed
    const min = Math.floor(remaining / 60000)
    const sec = Math.floor((remaining % 60000) / 1000)
    return interaction.reply({
     content: `⏳ La roulette se recharge... Reviens dans **${min}m ${sec}s**.`,
     flags: 64
    })
   }

   await interaction.deferReply()

   const lot = pickLot()
   updateRouletteStats(user, lot, now)
   await applyReward(interaction, user, lot)

   await addBattlePassXP(interaction.user.id, "roulette_spin")
   const unlocked = achievementCheck(user, "roulette")
   save(interaction.user.id)

   const embed = buildResultEmbed(interaction.user, lot, user)
   await interaction.editReply({ embeds: [embed] })

   if (lot.id === 31) {
    await sendJackpotAnnounce(interaction)
   }

   if (unlocked.length) {
    await notifyAchievements(interaction, unlocked, user)
   }
  } finally {
   spinLocks.delete(interaction.user.id)
  }
 },

 LOTS,
 pickLot,
 applyReward,
 buildResultEmbed,
 updateRouletteStats,
 formatReward
}
