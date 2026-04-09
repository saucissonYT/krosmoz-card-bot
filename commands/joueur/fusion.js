const {
 SlashCommandBuilder,
 EmbedBuilder,
 ActionRowBuilder,
 StringSelectMenuBuilder,
 ButtonBuilder,
 ButtonStyle
} = require("discord.js")

const { RARITY_ORDER, RARITY_EMOJI, FUSION_COST } = require("../../systems/constants")
const { getCards }          = require("../../systems/cardRegistry")
const { getUser, save }     = require("../../systems/userSystem")
const { achievementCheck }  = require("../../systems/achievementCheck")
const { notifyAchievements }= require("../../systems/achievementNotifier")
const { addXP }             = require("../../systems/progressionSystem")
const { addBattlePassXP }   = require("../../systems/battlePassService")
const { loadSets }          = require("../../systems/setSystemFile")
const {
 isSetUnlocked,
 getUnlockMessage
} = require("../../systems/setUnlockSystem")

function sleep(ms){
 return new Promise(r => setTimeout(r, ms))
}

/* ================================================================
   BONUS HELPERS
================================================================ */

function getFusionBonuses(userId, user){
 let gCrit = 0, gDouble = 0, gTriple = 0
 let pCrit = 0

 try{
  const { getUserGuildBonuses } = require("../../systems/guildBonuses")
  const gb = getUserGuildBonuses(userId)
  gCrit   = gb.fusionCritBonus   || 0
  gDouble = gb.fusionDoubleBonus || 0
  gTriple = gb.fusionTripleBonus || 0
 }catch(e){}

 try{
  const { getPlayerBonuses } = require("../../systems/playerbonuses")
  const pb = getPlayerBonuses(user.progression?.level || 1)
  pCrit = pb.fusionCritBonus || 0
 }catch(e){}

 return { critBonus: gCrit + pCrit, doubleBonus: gDouble, tripleBonus: gTriple }
}

/* ================================================================
   CALCUL DES DOUBLONS + FUSIONS DISPONIBLES
================================================================ */

function getDupsByRarity(user, cards, setId){
 const result = {}
 for(const rarity of ["C","U","R","SR","HR","UR","S"]){
  const pool = cards.filter(c => c.set === setId && c.rarity === rarity)
  let dups = 0
  for(const card of pool){
   const count = user.cards?.[card.id] || 0
   if(count > 1) dups += (count - 1)
  }
  result[rarity] = dups
 }
 return result
}

function getFusionCounts(dups){
 const result = {}
 for(const rarity of ["C","U","R","SR","HR","UR","S"]){
  result[rarity] = Math.floor((dups[rarity] || 0) / FUSION_COST[rarity])
 }
 return result
}

/* ================================================================
   BUILDERS DES MENUS
================================================================ */

function buildSetSelectOptions(user, cards, sets){
 return sets.slice(0, 25).map(set => {

  const unlocked = isSetUnlocked(user, set.id, cards)

  if(!unlocked){
   return {
    label:       `🔒 ${set.name}`.slice(0, 100),
    value:       String(set.id),
    description: "Set verrouillé — voir les conditions de déblocage",
    emoji:       "🔒"
   }
  }

  const dups   = getDupsByRarity(user, cards, set.id)
  const counts = getFusionCounts(dups)
  const total  = Object.values(counts).reduce((a, b) => a + b, 0)

  let description
  if(total === 0){
   description = "Aucune fusion disponible"
  }else{
   const parts = ["C","U","R","SR","HR","UR","S"]
    .filter(r => counts[r] > 0)
    .map(r => `${RARITY_EMOJI[r]}×${counts[r]}`)
   description = parts.join(" · ").slice(0, 100)
  }

  return {
   label:       set.name.slice(0, 100),
   value:       String(set.id),
   description,
   emoji:       total > 0 ? "⚗️" : "❌"
  }

 })
}

function buildRaritySelectOptions(dups, counts){
 const options = []

 for(const rarity of ["C","U","R","SR","HR","UR","S"]){
  if(counts[rarity] === 0) continue

  const cost         = FUSION_COST[rarity]
  const available    = dups[rarity]
  const targetIdx    = Math.min(RARITY_ORDER.indexOf(rarity) + 1, RARITY_ORDER.indexOf("SSR"))
  const targetRarity = RARITY_ORDER[targetIdx]

  options.push({
   label:       `${RARITY_EMOJI[rarity]} ${rarity} → ${RARITY_EMOJI[targetRarity]} ${targetRarity}`,
   value:       rarity,
   description: `${counts[rarity]}× possible · ${available} dups dispo · Coût : ${cost}`.slice(0, 100),
   emoji:       "⚗️"
  })
 }

 return options
}

function buildConfirmEmbed(setId, rarity, dups, counts, bonuses){
 const cost         = FUSION_COST[rarity]
 const available    = dups[rarity]
 const fusionsPoss  = counts[rarity]
 const targetIdx    = Math.min(RARITY_ORDER.indexOf(rarity) + 1, RARITY_ORDER.indexOf("SSR"))
 const targetRarity = RARITY_ORDER[targetIdx]

 const critPct   = ((0.10 + bonuses.critBonus   / 100) * 100).toFixed(1)
 const doublePct = ((0.10 + bonuses.doubleBonus / 100) * 100).toFixed(1)
 const triplePct = ((0.005 + bonuses.tripleBonus / 100) * 100).toFixed(2)

 return new EmbedBuilder()
  .setTitle("⚗️ Confirmer la fusion")
  .setColor("#9b59b6")
  .setDescription(`Set : **${setId}**`)
  .addFields(
   { name: "🎯 Rareté fusionnée",     value: `${RARITY_EMOJI[rarity]} **${rarity}** → ${RARITY_EMOJI[targetRarity]} **${targetRarity}**`, inline: true },
   { name: "💸 Coût",                 value: `${cost} doublons par fusion`,  inline: true },
   { name: "📦 Doublons disponibles", value: `${available}`,       inline: true },
   { name: "🔄 Fusions possibles",    value: `**${fusionsPoss}×**`, inline: true },
   {
    name:  "📊 Chances (avec bonus)",
    value: `🔥 Crit : **${critPct}%** · ✨ Double : **${doublePct}%** · 🌈 Triple : **${triplePct}%**`,
    inline: false
   }
  )
}

/* ================================================================
   ROWS DE CONFIRMATION
   - Si fusionsPoss > 1 : bouton "1×" + bouton "Max (Nx)" + retour
   - Si fusionsPoss === 1 : bouton normal + retour
================================================================ */

function buildConfirmRow(fusionsPoss){
 if(fusionsPoss > 1){
  return new ActionRowBuilder().addComponents(
   new ButtonBuilder()
    .setCustomId("fusion_confirm")
    .setLabel("⚗️ Fusionner (1×)")
    .setStyle(ButtonStyle.Success),
   new ButtonBuilder()
    .setCustomId("fusion_max")
    .setLabel(`⚡ Tout fusionner (${fusionsPoss}×)`)
    .setStyle(ButtonStyle.Primary),
   new ButtonBuilder()
    .setCustomId("fusion_back_rarity")
    .setLabel("← Retour")
    .setStyle(ButtonStyle.Secondary)
  )
 }

 return new ActionRowBuilder().addComponents(
  new ButtonBuilder()
   .setCustomId("fusion_confirm")
   .setLabel("⚗️ Fusionner")
   .setStyle(ButtonStyle.Success),
  new ButtonBuilder()
   .setCustomId("fusion_back_rarity")
   .setLabel("← Retour")
   .setStyle(ButtonStyle.Secondary)
 )
}

/* ================================================================
   COEUR RNG : un seul tirage (retourne les données, ne modifie rien)
   Utilisé par runFusion ET runFusionMax pour éviter la duplication.
================================================================ */

function rollFusion(rarity, user, bonuses){
 const critChance = 0.10 + bonuses.critBonus   / 100
 const dblChance  = 0.10 + bonuses.doubleBonus / 100
 const triChance  = 0.005 + bonuses.tripleBonus / 100

 const roll = Math.random()

 let rarityGain = 1
 let quantity   = 1
 let type       = "normal"
 let xpGain     = 15

 if(roll < triChance && (user.stats.tripleFusionToday || 0) < 1){
  rarityGain = 3
  type       = "triple"
  xpGain     = 50
 }
 else if(roll < critChance){
  rarityGain = 2
  type       = "crit"
  xpGain     = 25
 }
 else if(roll < dblChance && ["C","U","R","SR"].includes(rarity)){
  quantity   = 2
  type       = "double"
  xpGain     = 20
 }

 const index      = RARITY_ORDER.indexOf(rarity)
 const targetIdx  = Math.min(index + rarityGain, RARITY_ORDER.indexOf("SSR"))
 const targetRarity = RARITY_ORDER[targetIdx]

 return { rarityGain, quantity, type, xpGain, targetRarity }
}

/* ================================================================
   CONSOMMER les doublons d'un set/rareté (une seule fusion)
   Retourne false si pas assez de doublons.
================================================================ */

function consumeDuplicates(user, pool, cost){
 let available = 0
 for(const card of pool){
  const count = user.cards?.[card.id] || 0
  if(count > 1) available += (count - 1)
 }

 if(available < cost) return null

 let remaining = cost
 const usedCards = {}

 for(const card of pool){
  const count  = user.cards?.[card.id] || 0
  const usable = Math.max(0, count - 1)
  if(usable <= 0) continue

  const take = Math.min(usable, remaining)
  user.cards[card.id] -= take
  remaining            -= take
  usedCards[card.id]   = (usedCards[card.id] || 0) + take

  if(user.cards[card.id] <= 0) delete user.cards[card.id]
  if(remaining <= 0) break
 }

 return { usedCards, available }
}

/* ================================================================
   EXÉCUTION — FUSION SIMPLE (1×)
   FIX : msg.edit() ne fonctionne pas sur les messages éphémères.
   On utilise originalInteraction.editReply() (token webhook slash).
================================================================ */

async function runFusion(i, originalInteraction, userId, setId, rarity){

 const cards = getCards()
 const user  = getUser(userId)
 const cost  = FUSION_COST[rarity]
 const pool  = cards.filter(c => c.set === setId && c.rarity === rarity)

 if(pool.length === 0){
  return i.update({ content: "❌ Aucune carte trouvée pour ce set/rareté.", embeds: [], components: [] })
 }

 const consumed = consumeDuplicates(user, pool, cost)
 if(!consumed){
  return i.update({
   content: `❌ Plus assez de doublons. Un autre joueur a peut-être fusionné entre temps.`,
   embeds: [], components: []
  })
 }

 const { usedCards, available } = consumed

 /* ---- Embed "en cours" ---- */
 const loadingEmbed = new EmbedBuilder()
  .setTitle("⚗️ Fusion en cours...")
  .setDescription(`Fusion de **${cost} doublons ${RARITY_EMOJI[rarity]}**\n\nSet : **${setId}**`)
  .setColor("#9b59b6")

 await i.update({ embeds: [loadingEmbed], components: [] })

 /* ---- Stats init ---- */
 if(!user.stats) user.stats = {}
 user.stats.fusions = (user.stats.fusions || 0) + 1

 const now = Date.now()
 if(!user.stats.lastTripleReset || now - user.stats.lastTripleReset > 86400000){
  user.stats.tripleFusionToday = 0
  user.stats.lastTripleReset   = now
 }

 /* ---- RNG ---- */
 const bonuses = getFusionBonuses(userId, user)
 const { quantity, type, xpGain, targetRarity } = rollFusion(rarity, user, bonuses)

 if(type === "triple"){
  user.stats.tripleFusionToday++
  user.stats.tripleFusion = (user.stats.tripleFusion || 0) + 1
 }
 if(type === "crit")   user.stats.fusionCrit   = (user.stats.fusionCrit   || 0) + 1
 if(type === "double") user.stats.fusionDouble  = (user.stats.fusionDouble || 0) + 1

 /* ---- Marqueur de type fusion ---- */
 if(rarity === "C")  user.stats.fusionCU   = true
 if(rarity === "U")  user.stats.fusionUR   = true
 if(rarity === "R")  user.stats.fusionRSR  = true
 if(rarity === "SR") user.stats.fusionSRHR = true
 if(rarity === "HR") user.stats.fusionHRUR = true
 if(rarity === "UR") user.stats.fusionURS  = true

 /* ---- Pool récompenses ---- */
 const rewardPool = cards.filter(c => c.set === setId && c.rarity === targetRarity)
 if(rewardPool.length === 0){
  return originalInteraction.editReply({ content: `❌ Aucune carte ${targetRarity} dans ce set.`, embeds: [], components: [] })
 }

 /* ---- Animation ---- */
 await sleep(900)
 const transEmbed = new EmbedBuilder()
  .setTitle("⚗️ Fusion...")
  .setDescription(`\n${RARITY_EMOJI[rarity]}\n⬇\n${RARITY_EMOJI[targetRarity]}\n`)
  .setColor("#9b59b6")
 await originalInteraction.editReply({ embeds: [transEmbed], components: [] })
 await sleep(900)

 /* ---- Tirage ---- */
 const rewards = []
 for(let k = 0; k < quantity; k++){
  const card = rewardPool[Math.floor(Math.random() * rewardPool.length)]
  rewards.push(card)
  user.cards[card.id] = (user.cards[card.id] || 0) + 1
 }

 if(targetRarity === "SSR"){
  user.stats.fusionSSRResult = (user.stats.fusionSSRResult || 0) + quantity
  user.stats.ssrPulled       = (user.stats.ssrPulled       || 0) + quantity
 }

 addXP(user, xpGain)
 await addBattlePassXP(userId, "fusion")
 save(userId)

 /* ---- Labels ---- */
 const typeLabel = {
  triple: "🌈 TRIPLE FUSION !!!",
  crit:   "🔥 Fusion critique !",
  double: "✨ Fusion double !",
  normal: "✅ Fusion réussie."
 }[type]

 const usedLines   = Object.entries(usedCards).map(([id, q]) => {
  const card = cards.find(c => String(c.id) === String(id))
  return `${RARITY_EMOJI[card?.rarity || rarity]} ${card?.name || id} ×${q}`
 })
 const rewardLines = rewards.map(c => `${RARITY_EMOJI[c.rarity]} ${c.name}`)
 const remainingDup = available - cost

 const bonuses2    = getFusionBonuses(userId, user)
 const critPct   = ((0.10 + bonuses2.critBonus   / 100) * 100).toFixed(1)
 const doublePct = ((0.10 + bonuses2.doubleBonus / 100) * 100).toFixed(1)
 const triplePct = ((0.005 + bonuses2.tripleBonus / 100) * 100).toFixed(2)
 const fusionStats = `Fusions : **${user.stats.fusions || 0}** · 🔥 Crit : **${user.stats.fusionCrit || 0}** · ✨ Double : **${user.stats.fusionDouble || 0}** · 🌈 Triple : **${user.stats.tripleFusion || 0}**`

 const resultEmbed = new EmbedBuilder()
  .setTitle("⚗️ Fusion terminée")
  .setColor("#9b59b6")
  .setDescription(
`${typeLabel}

**Cartes utilisées**
${usedLines.join("\n")}

${cost} ${RARITY_EMOJI[rarity]} → ${RARITY_EMOJI[targetRarity]}

Doublons restants : **${remainingDup}**
⭐ XP gagnée : **${xpGain}**

**Résultat**
${rewardLines.join("\n")}

📊 **Chances (avec bonus)**
🔥 Critique : **${critPct}%** · 🌈 Triple : **${triplePct}%** · ✨ Double : **${doublePct}%**

📊 **Tes stats**
${fusionStats}`
  )

 await originalInteraction.editReply({ embeds: [resultEmbed], components: [] })

 const unlocked = [
  ...achievementCheck(user, "fusion"),
  ...achievementCheck(user, "collection"),
  ...achievementCheck(user, "pack")
 ]
 if(unlocked.length) await notifyAchievements(i, unlocked)
}

/* ================================================================
   EXÉCUTION — FUSION MAX (toutes les fusions d'un coup)
   Boucle sur toutes les fusions disponibles, agrège les résultats,
   affiche un seul embed résumé.
================================================================ */

async function runFusionMax(i, originalInteraction, userId, setId, rarity, totalFusions){

 const cards = getCards()
 const user  = getUser(userId)
 const cost  = FUSION_COST[rarity]
 const pool  = cards.filter(c => c.set === setId && c.rarity === rarity)

 if(pool.length === 0){
  return i.update({ content: "❌ Aucune carte trouvée pour ce set/rareté.", embeds: [], components: [] })
 }

 /* ---- Embed "en cours" ---- */
 const loadingEmbed = new EmbedBuilder()
  .setTitle("⚡ Fusion max en cours...")
  .setDescription(`**${totalFusions}** fusions de **${RARITY_EMOJI[rarity]} ${rarity}** sur le set **${setId}**...\n\n⏳ Calcul en cours`)
  .setColor("#9b59b6")

 await i.update({ embeds: [loadingEmbed], components: [] })

 /* ---- Stats init ---- */
 if(!user.stats) user.stats = {}

 const now = Date.now()
 if(!user.stats.lastTripleReset || now - user.stats.lastTripleReset > 86400000){
  user.stats.tripleFusionToday = 0
  user.stats.lastTripleReset   = now
 }

 /* ---- Marqueur type fusion (une seule fois) ---- */
 if(rarity === "C")  user.stats.fusionCU   = true
 if(rarity === "U")  user.stats.fusionUR   = true
 if(rarity === "R")  user.stats.fusionRSR  = true
 if(rarity === "SR") user.stats.fusionSRHR = true
 if(rarity === "HR") user.stats.fusionHRUR = true
 if(rarity === "UR") user.stats.fusionURS  = true

 const bonuses = getFusionBonuses(userId, user)

 /* ---- Agrégats ---- */
 let totalXP         = 0
 let fusionsDone     = 0
 let countNormal     = 0
 let countCrit       = 0
 let countDouble     = 0
 let countTriple     = 0
 let totalConsumed   = 0
 const allRewards    = {}   // { cardId: count }
 const rewardsByRarity = {} // pour le résumé par rareté

 /* ---- Boucle de fusion ---- */
 for(let n = 0; n < totalFusions; n++){

  /* Recalcul des doublons restants à chaque itération */
  const consumed = consumeDuplicates(user, pool, cost)
  if(!consumed) break   // plus assez de doublons (cas edge)

  totalConsumed += cost
  fusionsDone++
  user.stats.fusions = (user.stats.fusions || 0) + 1

  const { quantity, type, xpGain, targetRarity } = rollFusion(rarity, user, bonuses)

  /* Stats par type */
  if(type === "triple"){
   user.stats.tripleFusionToday++
   user.stats.tripleFusion = (user.stats.tripleFusion || 0) + 1
   countTriple++
  }
  if(type === "crit")   { user.stats.fusionCrit   = (user.stats.fusionCrit   || 0) + 1; countCrit++ }
  if(type === "double") { user.stats.fusionDouble  = (user.stats.fusionDouble || 0) + 1; countDouble++ }
  if(type === "normal") countNormal++

  /* Pool de récompenses */
  const rewardPool = cards.filter(c => c.set === setId && c.rarity === targetRarity)
  if(rewardPool.length === 0) continue

  for(let k = 0; k < quantity; k++){
   const card = rewardPool[Math.floor(Math.random() * rewardPool.length)]
   user.cards[card.id] = (user.cards[card.id] || 0) + 1
   allRewards[card.id]     = (allRewards[card.id] || 0) + 1
   rewardsByRarity[targetRarity] = (rewardsByRarity[targetRarity] || 0) + quantity
  }

  if(targetRarity === "SSR"){
   user.stats.fusionSSRResult = (user.stats.fusionSSRResult || 0) + quantity
   user.stats.ssrPulled       = (user.stats.ssrPulled       || 0) + quantity
  }

  totalXP += xpGain
 }

 addXP(user, totalXP)
 await addBattlePassXP(userId, "fusion")
 save(userId)

 /* ---- Construction de l'embed résumé ---- */

 /* Résumé des résultats par rareté */
 const rarityOrder = ["SSR","S","UR","HR","SR","R","U","C"]
 const rewardSummaryLines = rarityOrder
  .filter(r => rewardsByRarity[r])
  .map(r => `${RARITY_EMOJI[r]} **${r}** : ${rewardsByRarity[r]} carte${rewardsByRarity[r] > 1 ? "s" : ""}`)

 /* Top 10 des cartes obtenues (triées par count desc) */
 const topCards = Object.entries(allRewards)
  .sort((a, b) => b[1] - a[1])
  .slice(0, 10)
  .map(([id, count]) => {
   const card = cards.find(c => String(c.id) === String(id))
   return `${RARITY_EMOJI[card?.rarity || "?"]} ${card?.name || id}${count > 1 ? ` ×${count}` : ""}`
  })

 /* Ligne de stats des types */
 const typeLine = [
  countNormal  > 0 ? `✅ Normales : **${countNormal}**` : null,
  countCrit    > 0 ? `🔥 Critiques : **${countCrit}**`  : null,
  countDouble  > 0 ? `✨ Doubles : **${countDouble}**`  : null,
  countTriple  > 0 ? `🌈 Triples : **${countTriple}**`  : null
 ].filter(Boolean).join(" · ")

 const fusionStats = `Fusions : **${user.stats.fusions || 0}** · 🔥 Crit : **${user.stats.fusionCrit || 0}** · ✨ Double : **${user.stats.fusionDouble || 0}** · 🌈 Triple : **${user.stats.tripleFusion || 0}**`

 const totalCardsObtained = Object.values(allRewards).reduce((a, b) => a + b, 0)

 const resultEmbed = new EmbedBuilder()
  .setTitle(`⚡ Fusion max terminée — ${fusionsDone}× ${RARITY_EMOJI[rarity]}${rarity}`)
  .setColor("#9b59b6")
  .setDescription(`Set : **${setId}**`)
  .addFields(
   {
    name:   "📊 Résultats",
    value:  typeLine || "Aucune",
    inline: false
   },
   {
    name:   "🎁 Cartes obtenues",
    value:  rewardSummaryLines.length > 0 ? rewardSummaryLines.join("\n") : "Aucune",
    inline: true
   },
   {
    name:   "💸 Doublons consommés",
    value:  `**${totalConsumed}** doublons **${RARITY_EMOJI[rarity]}${rarity}**`,
    inline: true
   },
   {
    name:   "🃏 Total cartes",
    value:  `**${totalCardsObtained}** carte${totalCardsObtained > 1 ? "s" : ""} obtenue${totalCardsObtained > 1 ? "s" : ""}`,
    inline: true
   },
   {
    name:   "⭐ XP gagnée",
    value:  `**${totalXP}** XP`,
    inline: true
   },
   {
    name:   `🔝 Top cartes${Object.keys(allRewards).length > 10 ? " (top 10)" : ""}`,
    value:  topCards.length > 0 ? topCards.join("\n") : "Aucune",
    inline: false
   },
   {
    name:   "📈 Tes stats de fusion",
    value:  fusionStats,
    inline: false
   }
  )

 await originalInteraction.editReply({ embeds: [resultEmbed], components: [] })

 const unlocked = [
  ...achievementCheck(user, "fusion"),
  ...achievementCheck(user, "collection"),
  ...achievementCheck(user, "pack")
 ]
 if(unlocked.length) await notifyAchievements(i, unlocked)
}

/* ================================================================
   MODULE
================================================================ */

module.exports = {

 data: new SlashCommandBuilder()
  .setName("fusion")
  .setDescription("Fusionner des doublons pour obtenir une rareté supérieure"),

 async execute(interaction){

  const cards    = getCards()
  const user     = getUser(interaction.user.id)
  const rawSets  = loadSets()
  const sets     = Array.isArray(rawSets) ? rawSets : rawSets?.sets || []

  if(sets.length === 0)
   return interaction.reply({ content: "❌ Aucun set disponible.", flags: 64 })

  let selectedSet    = null
  let selectedRarity = null

  const setOptions = buildSetSelectOptions(user, cards, sets)

  const setMenu = new StringSelectMenuBuilder()
   .setCustomId("fusion_set")
   .setPlaceholder("Choisis un set...")
   .addOptions(setOptions)

  const introEmbed = new EmbedBuilder()
   .setTitle("⚗️ Fusion")
   .setColor("#9b59b6")
   .setDescription("Choisis un set pour voir les fusions disponibles.\n🔒 Les sets verrouillés ne peuvent pas être fusionnés.")

  await interaction.reply({
   embeds:     [introEmbed],
   components: [new ActionRowBuilder().addComponents(setMenu)],
   flags:      64
  })

  const msg = await interaction.fetchReply()

  const collector = msg.createMessageComponentCollector({
   filter: i => i.user.id === interaction.user.id,
   time:   120000
  })

  collector.on("collect", async i => {

   /* ──────────────────────────────────────────
      ÉTAPE 1 : Sélection du set
   ────────────────────────────────────────── */

   if(i.customId === "fusion_set"){

    selectedSet    = i.values[0]
    selectedRarity = null

    const freshUser = getUser(interaction.user.id)
    const allCards  = getCards()

    if(!isSetUnlocked(freshUser, selectedSet, allCards)){
     const msg = getUnlockMessage(freshUser, selectedSet, allCards)
     return i.reply({ content: msg || "🔒 Ce set est verrouillé.", flags: 64 })
    }

    const dups   = getDupsByRarity(freshUser, cards, selectedSet)
    const counts = getFusionCounts(dups)

    const rarityOptions = buildRaritySelectOptions(dups, counts)

    if(rarityOptions.length === 0){
     const noFusionEmbed = new EmbedBuilder()
      .setTitle(`⚗️ Fusion — ${selectedSet}`)
      .setColor("#9b59b6")
      .setDescription("❌ Aucun doublon suffisant dans ce set pour fusionner.")

     const backRow = new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId("fusion_back_sets").setLabel("← Retour aux sets").setStyle(ButtonStyle.Secondary)
     )

     return i.update({ embeds: [noFusionEmbed], components: [backRow] })
    }

    const rarityMenu = new StringSelectMenuBuilder()
     .setCustomId("fusion_rarity")
     .setPlaceholder("Choisis la rareté à fusionner...")
     .addOptions(rarityOptions)

    const setEmbed = new EmbedBuilder()
     .setTitle(`⚗️ Fusion — ${selectedSet}`)
     .setColor("#9b59b6")
     .setDescription("Choisis la rareté à fusionner.")

    return i.update({
     embeds: [setEmbed],
     components: [
      new ActionRowBuilder().addComponents(rarityMenu),
      new ActionRowBuilder().addComponents(
       new ButtonBuilder().setCustomId("fusion_back_sets").setLabel("← Retour aux sets").setStyle(ButtonStyle.Secondary)
      )
     ]
    })
   }

   /* ──────────────────────────────────────────
      ÉTAPE 2 : Sélection de la rareté
   ────────────────────────────────────────── */

   if(i.customId === "fusion_rarity"){

    selectedRarity = i.values[0]

    const freshUser = getUser(interaction.user.id)
    const dups      = getDupsByRarity(freshUser, cards, selectedSet)
    const counts    = getFusionCounts(dups)
    const bonuses   = getFusionBonuses(interaction.user.id, freshUser)

    const confirmEmbed = buildConfirmEmbed(selectedSet, selectedRarity, dups, counts, bonuses)
    const confirmRow   = buildConfirmRow(counts[selectedRarity])

    return i.update({ embeds: [confirmEmbed], components: [confirmRow] })
   }

   /* ──────────────────────────────────────────
      BOUTON : Retour vers la liste des sets
   ────────────────────────────────────────── */

   if(i.customId === "fusion_back_sets"){

    selectedSet    = null
    selectedRarity = null

    const freshUser = getUser(interaction.user.id)
    const freshOpts = buildSetSelectOptions(freshUser, cards, sets)

    const freshMenu = new StringSelectMenuBuilder()
     .setCustomId("fusion_set")
     .setPlaceholder("Choisis un set...")
     .addOptions(freshOpts)

    return i.update({
     embeds:     [introEmbed],
     components: [new ActionRowBuilder().addComponents(freshMenu)]
    })
   }

   /* ──────────────────────────────────────────
      BOUTON : Retour vers la liste des raretés
   ────────────────────────────────────────── */

   if(i.customId === "fusion_back_rarity"){

    selectedRarity = null

    const freshUser    = getUser(interaction.user.id)
    const dups         = getDupsByRarity(freshUser, cards, selectedSet)
    const counts       = getFusionCounts(dups)
    const rarityOptions = buildRaritySelectOptions(dups, counts)

    const rarityMenu = new StringSelectMenuBuilder()
     .setCustomId("fusion_rarity")
     .setPlaceholder("Choisis la rareté à fusionner...")
     .addOptions(rarityOptions)

    const setEmbed = new EmbedBuilder()
     .setTitle(`⚗️ Fusion — ${selectedSet}`)
     .setColor("#9b59b6")
     .setDescription("Choisis la rareté à fusionner.")

    return i.update({
     embeds: [setEmbed],
     components: [
      new ActionRowBuilder().addComponents(rarityMenu),
      new ActionRowBuilder().addComponents(
       new ButtonBuilder().setCustomId("fusion_back_sets").setLabel("← Retour aux sets").setStyle(ButtonStyle.Secondary)
      )
     ]
    })
   }

   /* ──────────────────────────────────────────
      BOUTON : Fusion 1×
   ────────────────────────────────────────── */

   if(i.customId === "fusion_confirm"){
    collector.stop("done")
    await runFusion(i, interaction, interaction.user.id, selectedSet, selectedRarity)
    return
   }

   /* ──────────────────────────────────────────
      BOUTON : Fusion Max (toutes les fusions d'un coup)
   ────────────────────────────────────────── */

   if(i.customId === "fusion_max"){
    collector.stop("done")

    /* Recalcul du nombre de fusions disponibles au moment du clic */
    const freshUser    = getUser(interaction.user.id)
    const dups         = getDupsByRarity(freshUser, cards, selectedSet)
    const counts       = getFusionCounts(dups)
    const fusionsPoss  = counts[selectedRarity] || 0

    if(fusionsPoss === 0){
     return i.update({
      content: "❌ Plus aucune fusion disponible.",
      embeds: [], components: []
     })
    }

    await runFusionMax(i, interaction, interaction.user.id, selectedSet, selectedRarity, fusionsPoss)
    return
   }

  })

  collector.on("end", (_, reason) => {
   if(reason === "time")
    interaction.editReply({ components: [] }).catch(() => {})
  })

 }

}
