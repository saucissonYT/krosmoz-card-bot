const {
 SlashCommandBuilder,
 EmbedBuilder,
 ActionRowBuilder,
 ButtonBuilder,
 ButtonStyle
} = require("discord.js")

const { getUser } = require("../../systems/userSystem")
const { getCards } = require("../../systems/cardRegistry")
const { RARITY_EMOJI, RARITY_ORDER } = require("../../systems/constants")

/* FIX: import dynamique du registry pour compter les achievements */
const achievements = require("../../systems/achievementRegistry")
const TOTAL_ACHIEVEMENTS = Object.keys(achievements).length

/* ================= HELPERS ================= */

function bar(value, max, size=10){
 if(max <= 0) return "⬛".repeat(size)
 const filled = Math.min(size, Math.round((value / max) * size))
 return "🟩".repeat(filled) + "⬛".repeat(size - filled)
}

function pct(value, total){
 if(total <= 0) return "0%"
 return ((value / total) * 100).toFixed(1) + "%"
}

function timeSince(timestamp){
 if(!timestamp) return "Inconnu"
 const days = Math.floor((Date.now() - timestamp) / 86400000)
 if(days === 0) return "Aujourd'hui"
 if(days === 1) return "Hier"
 return `${days} jours`
}

function formatNumber(n){
 if(n >= 1000000) return (n/1000000).toFixed(1) + "M"
 if(n >= 1000) return (n/1000).toFixed(1) + "K"
 return String(n || 0)
}

/* ================= PAGES ================= */

const PAGES = [
 { id:"general",    emoji:"📊", label:"Général" },
 { id:"collection", emoji:"📚", label:"Collection" },
 { id:"rng",        emoji:"🎲", label:"Packs & RNG" },
 { id:"economy",    emoji:"💰", label:"Économie" },
 { id:"events",     emoji:"🎪", label:"Events" },
 { id:"social",     emoji:"💬", label:"Social" }
]

function buildPage(pageId, user, interaction){

 const s = user.stats || {}
 const cards = getCards()
 const totalCards = cards.length

 const ownedUnique = Object.keys(user.cards || {}).length
 const ownedTotal = Object.values(user.cards || {}).reduce((a,b)=>a+b, 0)
 const shinyUnique = Object.keys(user.shinyCards || {}).length
 const shinyTotal = Object.values(user.shinyCards || {}).reduce((a,b)=>a+b, 0)
 const achievementCount = user.achievements?.length || 0

 /* ===== GÉNÉRAL ===== */

 if(pageId === "general"){

  const level = user.progression?.level || 1
  const xp = user.progression?.xp || 0
  const totalXp = user.progression?.totalXp || 0

  return new EmbedBuilder()
   .setTitle(`📊 Stats de ${interaction.user.username}`)
   .setColor("#3498db")
   .setDescription(
`**Vue d'ensemble**

⭐ Niveau **${level}** • XP totale : **${formatNumber(totalXp)}**
💰 Kamas : **${formatNumber(user.kamas || 0)}**
🎴 Cartes : **${ownedTotal}** (${ownedUnique} uniques / ${totalCards})
${bar(ownedUnique, totalCards, 12)} ${pct(ownedUnique, totalCards)}

🏆 Achievements : **${achievementCount}** / ${TOTAL_ACHIEVEMENTS}
${bar(achievementCount, TOTAL_ACHIEVEMENTS, 12)} ${pct(achievementCount, TOTAL_ACHIEVEMENTS)}

📦 Packs ouverts : **${s.packsOpened || 0}**
📦 Packs achetés : **${s.packsBought || 0}**
🌈 SSR obtenues : **${s.ssrPulled || 0}**
✨ SSR Shiny : **${shinyTotal}** (${shinyUnique} uniques)

📅 Inscrit depuis : **${timeSince(s.createdAt)}**
🔥 Activité : **${s.activityStreak || 0}** jours consécutifs`
   )
   .setThumbnail(interaction.user.displayAvatarURL({size:128}))
 }

 /* ===== COLLECTION ===== */

 if(pageId === "collection"){

  const byRarity = {}
  for(const r of RARITY_ORDER) byRarity[r] = { owned:0, total:0 }

  for(const card of cards){
   if(byRarity[card.rarity]) byRarity[card.rarity].total++
  }

  for(const id in (user.cards || {})){
   const card = cards.find(c => String(c.id) === String(id))
   if(card && byRarity[card.rarity]) byRarity[card.rarity].owned++
  }

  const rarityLines = RARITY_ORDER.map(r => {
   const d = byRarity[r]
   return `${RARITY_EMOJI[r]} **${r}** : ${d.owned}/${d.total} ${bar(d.owned, d.total, 8)}`
  })

  const sets = [...new Set(cards.map(c=>c.set))]
  const setLines = sets.map(setId => {
   const setCards = cards.filter(c=>c.set===setId)
   const owned = setCards.filter(c=>user.cards?.[c.id]).length
   return `📦 **${setId}** : ${owned}/${setCards.length} ${bar(owned, setCards.length, 8)}`
  })

  const maxDupes = Math.max(0, ...Object.values(user.cards || {}))
  const maxDupeCard = Object.entries(user.cards || {}).find(([,v])=>v===maxDupes)
  let maxDupeName = "—"
  if(maxDupeCard){
   const c = cards.find(c=>String(c.id)===maxDupeCard[0])
   if(c) maxDupeName = `${RARITY_EMOJI[c.rarity]} ${c.name} (×${maxDupes})`
  }

  return new EmbedBuilder()
   .setTitle(`📚 Collection de ${interaction.user.username}`)
   .setColor("#9b59b6")
   .setDescription(
`**Par rareté**
${rarityLines.join("\n")}

**Par set**
${setLines.join("\n")}

**Shiny :** ✨ ${shinyTotal} (${shinyUnique} uniques)
**Plus gros stock :** ${maxDupeName}`
   )
 }

 /* ===== PACKS & RNG ===== */

 if(pageId === "rng"){

  const ssrRate = s.packsOpened > 0
   ? ((s.ssrPulled || 0) / s.packsOpened * 100).toFixed(2) + "%"
   : "—"

  return new EmbedBuilder()
   .setTitle(`🎲 Packs & RNG de ${interaction.user.username}`)
   .setColor("#e67e22")
   .setDescription(
`**Packs**
📦 Ouverts total : **${s.packsOpened || 0}**
📦 Via /krosmoz : **${s.krosmozOpened || 0}**
📦 Achetés : **${s.packsBought || 0}**

**Drops**
🌈 SSR obtenues : **${s.ssrPulled || 0}** (taux : ${ssrRate})
✨ SSR Shiny : **${s.shinySSR || 0}**
🌈🌈 SSR streak max : **${s.ssrStreak || 0}**

**Malchance**
🏜️ Dry streak actuel : **${s.dryStreak || 0}** packs sans S/SSR
🏜️ Dry streak max : **${s.dryStreakMax || 0}**
😭 Hard pity atteint : **${s.hardPityReached || 0}** fois

**Records**
🌙 Packs à minuit : **${s.packAtMidnight || 0}**
📆 SSR un lundi : **${s.ssrOnMonday || 0}**
⚪ Packs tout C : **${s.allCPack || 0}**
🟢 Packs tout U : **${s.allUPack || 0}**
🪞 Palindromes : **${s.palindromeReached || 0}**`
   )
 }

 /* ===== ÉCONOMIE ===== */

 if(pageId === "economy"){

  const ks = user.krosmoshopStats || {}

  return new EmbedBuilder()
   .setTitle(`💰 Économie de ${interaction.user.username}`)
   .setColor("#2ecc71")
   .setDescription(
`**Kamas**
💰 Solde actuel : **${formatNumber(user.kamas || 0)}**

**Ventes & Achats**
📤 Cartes vendues : **${s.cardsSold || 0}**
📥 Cartes achetées (market) : **${s.marketBought || 0}**
🌈 SSR mises au market : **${s.marketSSRListed || 0}**

**Daily**
🎁 Daily claims : **${s.dailyClaims || 0}**
🔥 Streak actuel : **${user.daily?.streak || 0}** / 7
🏆 Streak record : **${s.maxDailyStreak || 0}** jours

**KrosmoShop**
🛒 Cartes achetées : **${ks.cardsBought || 0}**
🌈 SSR achetées : **${ks.ssrBought || 0}**
✨ S achetées : **${ks.sBought || 0}**
💸 Kamas dépensés : **${formatNumber(ks.kamasSpent || 0)}**
📅 Jours visités : **${ks.daysVisited || 0}**

**Fusion**
⚗️ Fusions total : **${s.fusions || 0}**
🔥 Critiques : **${s.fusionCrit || 0}**
✨ Doubles : **${s.fusionDouble || 0}**
🌈 Triples : **${s.tripleFusion || 0}**
🌈 SSR via fusion : **${s.fusionSSRResult || 0}**`
   )
 }

 /* ===== EVENTS ===== */

 if(pageId === "events"){

  const participated = s.eventsParticipated || []
  const ssrByClass = s.ssrByClass || {}
  const packsByClass = s.eventPacksByClass || {}

  const classRanking = Object.entries(packsByClass)
   .sort((a,b)=>b[1]-a[1])
   .slice(0, 5)

  const classLines = classRanking.length
   ? classRanking.map(([k,v],i) => `${i+1}. **${k}** — ${v} packs`).join("\n")
   : "Aucun event joué"

  const ssrClasses = Object.entries(ssrByClass)
   .filter(([,v])=>v>=1)
   .length

  return new EmbedBuilder()
   .setTitle(`🎪 Events de ${interaction.user.username}`)
   .setColor("#8e44ad")
   .setDescription(
`**Général**
📦 EventPacks ouverts : **${s.eventPacksOpened || 0}**
🎰 Events distincts : **${participated.length}** / 19
${bar(participated.length, 19, 12)}
🎟️ Tickets épuisés : **${s.ticketsFullyUsed || 0}** fois
🥇 Premier pack d'event : **${s.firstEventPacks || 0}** fois

**SSR en Events**
🌈 SSR obtenues : **${s.ssrFromEvent || 0}**
🌈 Classes avec SSR : **${ssrClasses}** / 19
${bar(ssrClasses, 19, 12)}

**Jackpots**
💰 Jackpot Enutrof : **${s.jackpotEnutrof || 0}**
🛡️ Jackpot Feca : **${s.jackpotFeca || 0}**

**Top classes (packs ouverts)**
${classLines}`
   )
 }

 /* ===== SOCIAL ===== */

 if(pageId === "social"){

  const tradePartners = Object.keys(s.tradePartners || {}).length

  return new EmbedBuilder()
   .setTitle(`💬 Social de ${interaction.user.username}`)
   .setColor("#1abc9c")
   .setDescription(
`**Profil & Classements**
👤 Profil consulté : **${s.profileViews || 0}** fois
🏆 Leaderboard consulté : **${s.leaderboardViews || 0}** fois
💰 Balance consultée : **${s.balanceCheck || 0}** fois
🎒 Inventaire ouvert : **${s.inventoryOpen || 0}** fois
📖 Aide consultée : **${s.helpOpen || 0}** fois

**Interactions**
💬 Mentions du bot : **${s.botMentions || 0}**
🔄 Partenaires de trade : **${tradePartners}** joueurs

**Titres**
👑 Titre actuel : **${user.title || "Nouveau"}**
🎖️ Titres débloqués : **${user.titles?.length || 1}**

**Badges**
🏆 Achievements : **${achievementCount}** / ${TOTAL_ACHIEVEMENTS}`
   )
 }

 return new EmbedBuilder()
  .setTitle("❌ Page inconnue")
  .setColor("Red")
}

/* ================= NAVIGATION ================= */

function buildNav(currentIndex){

 const row1 = new ActionRowBuilder()
 const row2 = new ActionRowBuilder()

 PAGES.forEach((page, i) => {

  const btn = new ButtonBuilder()
   .setCustomId(`mystats_${page.id}`)
   .setLabel(page.label)
   .setEmoji(page.emoji)
   .setStyle(i === currentIndex ? ButtonStyle.Success : ButtonStyle.Secondary)

  if(i < 4) row1.addComponents(btn)
  else row2.addComponents(btn)

 })

 return [row1, row2]
}

/* ================= COMMAND ================= */

module.exports = {

 data: new SlashCommandBuilder()
  .setName("mystats")
  .setDescription("Voir tes statistiques détaillées"),

 async execute(interaction){

  const user = getUser(interaction.user.id)

  const embed = buildPage("general", user, interaction)
  const components = buildNav(0)

  const msg = await interaction.reply({
   embeds:[embed],
   components,
   fetchReply:true
  })

  const collector = msg.createMessageComponentCollector({ time:180000 })

  collector.on("collect", async i => {

   if(i.user.id !== interaction.user.id)
    return i.reply({ content:"Pas tes stats.", flags:64 })

   const pageId = i.customId.replace("mystats_","")
   const pageIndex = PAGES.findIndex(p => p.id === pageId)

   if(pageIndex === -1) return

   /* Relecture du user pour données fraîches */
   const freshUser = getUser(interaction.user.id)

   const newEmbed = buildPage(pageId, freshUser, interaction)
   const newComponents = buildNav(pageIndex)

   await i.update({
    embeds:[newEmbed],
    components:newComponents
   })

  })

 }

}