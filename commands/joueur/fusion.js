const {
 SlashCommandBuilder,
 EmbedBuilder,
 ActionRowBuilder,
 StringSelectMenuBuilder,
 ButtonBuilder,
 ButtonStyle
} = require("discord.js")

const { RARITY_ORDER, RARITY_EMOJI, FUSION_COST } = require("../../systems/constants")
const { getCards } = require("../../systems/cardRegistry")
const { getUser, save } = require("../../systems/userSystem")
const { achievementCheck } = require("../../systems/achievementCheck")
const { notifyAchievements } = require("../../systems/achievementNotifier")
const { addXP } = require("../../systems/progressionSystem")
const { addBattlePassXP } = require("../../systems/battlePassService")
const { loadSets } = require("../../systems/setSystemFile")

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
  const { getPlayerBonuses } = require("../../systems/playerBonuses")
  const pb = getPlayerBonuses(user.progression?.level || 1)
  pCrit = pb.fusionCritBonus || 0
 }catch(e){}

 return { critBonus: gCrit + pCrit, doubleBonus: gDouble, tripleBonus: gTriple }
}

/* ================================================================
   CALCUL DES DOUBLONS + FUSIONS DISPONIBLES
================================================================ */

/**
 * Retourne le nombre de doublons disponibles par rareté pour un set donné.
 * Un doublon = toute copie au-delà de la 1ère.
 */
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

/**
 * Retourne le nombre de fusions COMPLÈTES possibles par rareté.
 * (floor(doublons / coût))
 */
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

/**
 * Construit les options du select menu des sets.
 * Description : fusions possibles par rareté ("⚪×3 · 🟢×1") ou "Aucune fusion disponible".
 */
function buildSetSelectOptions(user, cards, sets){
 return sets.slice(0, 25).map(set => {
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
   label: set.name.slice(0, 100),
   value: String(set.id),
   description,
   emoji: total > 0 ? "⚗️" : "❌"
  }
 })
}

/**
 * Construit les options du select menu des raretés pour un set donné.
 * N'affiche que les raretés où au moins 1 fusion est possible.
 */
function buildRaritySelectOptions(dups, counts){
 const options = []

 for(const rarity of ["C","U","R","SR","HR","UR","S"]){
  if(counts[rarity] === 0) continue

  const cost        = FUSION_COST[rarity]
  const available   = dups[rarity]
  const targetIdx   = Math.min(RARITY_ORDER.indexOf(rarity) + 1, RARITY_ORDER.indexOf("SSR"))
  const targetRarity = RARITY_ORDER[targetIdx]

  options.push({
   label: `${RARITY_EMOJI[rarity]} ${rarity} → ${RARITY_EMOJI[targetRarity]} ${targetRarity}`,
   value: rarity,
   description: `${counts[rarity]}× possible · ${available} dups dispo · Coût : ${cost}`.slice(0, 100),
   emoji: "⚗️"
  })
 }

 return options
}

/**
 * Construit l'embed de confirmation avant d'exécuter la fusion.
 */
function buildConfirmEmbed(setId, rarity, dups, counts, bonuses){
 const cost          = FUSION_COST[rarity]
 const available     = dups[rarity]
 const fusionsPoss   = counts[rarity]
 const targetIdx     = Math.min(RARITY_ORDER.indexOf(rarity) + 1, RARITY_ORDER.indexOf("SSR"))
 const targetRarity  = RARITY_ORDER[targetIdx]

 const critPct   = ((0.10 + bonuses.critBonus   / 100) * 100).toFixed(1)
 const doublePct = ((0.10 + bonuses.doubleBonus / 100) * 100).toFixed(1)
 const triplePct = ((0.005 + bonuses.tripleBonus / 100) * 100).toFixed(2)

 return new EmbedBuilder()
  .setTitle("⚗️ Confirmer la fusion")
  .setColor("#9b59b6")
  .setDescription(`Set : **${setId}**`)
  .addFields(
   { name: "🎯 Rareté fusionnée",    value: `${RARITY_EMOJI[rarity]} **${rarity}** → ${RARITY_EMOJI[targetRarity]} **${targetRarity}**`, inline: true },
   { name: "💸 Coût",                value: `${cost} doublons`, inline: true },
   { name: "📦 Doublons disponibles",value: `${available}`, inline: true },
   { name: "🔄 Fusions possibles",   value: `**${fusionsPoss}×**`, inline: true },
   {
    name: "📊 Chances (avec bonus)",
    value: `🔥 Crit : **${critPct}%** · ✨ Double : **${doublePct}%** · 🌈 Triple : **${triplePct}%**`,
    inline: false
   }
  )
}

/* ================================================================
   EXÉCUTION DE LA FUSION (logique inchangée)
================================================================ */

async function runFusion(i, msg, userId, setId, rarity){

 const cards = getCards()
 const user  = getUser(userId)

 const index = RARITY_ORDER.indexOf(rarity)
 const cost  = FUSION_COST[rarity]

 const pool = cards.filter(c => c.set === setId && c.rarity === rarity)

 if(pool.length === 0){
  return msg.edit({ content: "❌ Aucune carte trouvée pour ce set/rareté.", embeds: [], components: [] })
 }

 let available = 0
 for(const card of pool){
  const count = user.cards?.[card.id] || 0
  if(count > 1) available += (count - 1)
 }

 if(available < cost){
  return msg.edit({
   content: `❌ Plus assez de doublons (${available}/${cost}). Un autre joueur a peut-être fusionné entre temps.`,
   embeds: [], components: []
  })
 }

 /* ---- Embed "en cours" ---- */

 const loadingEmbed = new EmbedBuilder()
  .setTitle("⚗️ Fusion en cours...")
  .setDescription(`Fusion de **${cost} doublons ${RARITY_EMOJI[rarity]}**\n\nSet : **${setId}**`)
  .setColor("#9b59b6")

 await i.update({ embeds: [loadingEmbed], components: [] })

 /* ---- Consommation des cartes ---- */

 let remaining = cost
 const usedCards = {}

 for(const card of pool){
  const count = user.cards?.[card.id] || 0
  const usable = Math.max(0, count - 1)
  if(usable <= 0) continue

  const take = Math.min(usable, remaining)
  user.cards[card.id] -= take
  remaining -= take
  usedCards[card.id] = (usedCards[card.id] || 0) + take

  if(user.cards[card.id] <= 0) delete user.cards[card.id]
  if(remaining <= 0) break
 }

 /* ---- Stats ---- */

 if(!user.stats) user.stats = {}

 user.stats.fusions = (user.stats.fusions || 0) + 1

 const now = Date.now()

 if(!user.stats.lastTripleReset || now - user.stats.lastTripleReset > 86400000){
  user.stats.tripleFusionToday = 0
  user.stats.lastTripleReset   = now
 }

 /* ---- Bonus ---- */

 const fusionBonus = getFusionBonuses(userId, user)

 const critChance   = 0.10  + (fusionBonus.critBonus   / 100)
 const doubleChance = 0.10  + (fusionBonus.doubleBonus / 100)
 const tripleChance = 0.005 + (fusionBonus.tripleBonus / 100)

 /* ---- RNG ---- */

 const roll = Math.random()

 let rarityGain = 1
 let quantity   = 1
 let message    = ""
 let xpGain     = 15

 if(roll < tripleChance && user.stats.tripleFusionToday < 1){
  rarityGain = 3
  message    = "🌈 TRIPLE FUSION !!!"
  xpGain     = 50
  user.stats.tripleFusionToday++
  user.stats.tripleFusion = (user.stats.tripleFusion || 0) + 1
 }
 else if(roll < tripleChance + critChance){
  rarityGain = 2
  message    = "🔥 Fusion critique !"
  xpGain     = 25
  user.stats.fusionCrit = (user.stats.fusionCrit || 0) + 1
 }
 else if(roll < tripleChance + critChance + doubleChance && ["C","U","R","SR"].includes(rarity)){
  quantity = 2
  message  = "✨ Fusion double !"
  xpGain   = 25
  user.stats.fusionDouble = (user.stats.fusionDouble || 0) + 1
 }

 /* ---- Stats par type de rareté (achievements) ---- */

 if(rarity === "C")  user.stats.fusionCU    = true
 if(rarity === "U")  user.stats.fusionUR    = true
 if(rarity === "R")  user.stats.fusionRSR   = true
 if(rarity === "SR") user.stats.fusionSRHR  = true
 if(rarity === "HR") user.stats.fusionHRUR  = true
 if(rarity === "UR") user.stats.fusionURS   = true

 /* ---- Rareté cible ---- */

 let targetIndex = index + rarityGain
 const maxIndex  = RARITY_ORDER.indexOf("SSR")
 if(targetIndex > maxIndex) targetIndex = maxIndex

 const targetRarity = RARITY_ORDER[targetIndex]

 const rewardPool = cards.filter(c => c.set === setId && c.rarity === targetRarity)

 if(rewardPool.length === 0){
  return msg.edit({ content: "❌ Erreur : pool de récompenses vide.", embeds: [], components: [] })
 }

 /* ---- Animation intermédiaire ---- */

 await sleep(900)

 const transEmbed = new EmbedBuilder()
  .setTitle("⚗️ Fusion...")
  .setDescription(`\n${RARITY_EMOJI[rarity]}\n⬇\n${RARITY_EMOJI[targetRarity]}\n`)
  .setColor("#9b59b6")

 await msg.edit({ embeds: [transEmbed], components: [] })
 await sleep(900)

 /* ---- Résultat ---- */

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

 /* ---- Affichage ---- */

 const usedLines = Object.entries(usedCards).map(([id, q]) => {
  const card = cards.find(c => c.id == id)
  return `${RARITY_EMOJI[card?.rarity || rarity]} ${card?.name || id} ×${q}`
 })

 const rewardLines = rewards.map(c => `${RARITY_EMOJI[c.rarity]} ${c.name}`)

 const remainingDup = available - cost

 const critPct   = (critChance   * 100).toFixed(1)
 const doublePct = (doubleChance * 100).toFixed(1)
 const triplePct = (tripleChance * 100).toFixed(2)

 const fusionStats = `Fusions : **${user.stats.fusions || 0}** · 🔥 Crit : **${user.stats.fusionCrit || 0}** · ✨ Double : **${user.stats.fusionDouble || 0}** · 🌈 Triple : **${user.stats.tripleFusion || 0}**`

 const resultEmbed = new EmbedBuilder()
  .setTitle("⚗️ Fusion terminée")
  .setColor("#9b59b6")
  .setDescription(
`${message}

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

 await msg.edit({ embeds: [resultEmbed], components: [] })

 const unlocked = [
  ...achievementCheck(user, "fusion"),
  ...achievementCheck(user, "collection"),
  ...achievementCheck(user, "pack")
 ]

 if(unlocked.length)
  await notifyAchievements(i, unlocked)
}

/* ================================================================
   MODULE
================================================================ */

module.exports = {

 data: new SlashCommandBuilder()
  .setName("fusion")
  .setDescription("Fusionner des doublons pour obtenir une rareté supérieure"),

 async execute(interaction){

  const cards   = getCards()
  const user    = getUser(interaction.user.id)
  const rawSets = loadSets()
  const sets    = Array.isArray(rawSets) ? rawSets : (rawSets?.sets || [])

  /* ---- Menu sets ---- */

  const setOptions = buildSetSelectOptions(user, cards, sets)

  const setMenu = new StringSelectMenuBuilder()
   .setCustomId("fusion_set")
   .setPlaceholder("Choisis un set...")
   .addOptions(setOptions)

  const setRow = new ActionRowBuilder().addComponents(setMenu)

  const introEmbed = new EmbedBuilder()
   .setTitle("⚗️ Fusion de cartes")
   .setColor("#9b59b6")
   .setDescription(
`Choisis un set pour voir tes fusions disponibles.

💡 Chaque option indique les fusions complètes possibles par rareté.`
   )

  const msg = await interaction.reply({
   embeds: [introEmbed],
   components: [setRow],
   fetchReply: true
  })

  /* ---- Collector principal ---- */

  const collector = msg.createMessageComponentCollector({
   filter: i => i.user.id === interaction.user.id,
   time: 120000
  })

  let selectedSet    = null
  let selectedRarity = null

  collector.on("collect", async i => {

   /* ──────────────────────────────────────────
      ÉTAPE 1 : Sélection du set
   ────────────────────────────────────────── */

   if(i.customId === "fusion_set"){

    selectedSet    = i.values[0]
    selectedRarity = null

    const freshUser = getUser(interaction.user.id)
    const dups      = getDupsByRarity(freshUser, cards, selectedSet)
    const counts    = getFusionCounts(dups)
    const total     = Object.values(counts).reduce((a, b) => a + b, 0)

    /* Aucune fusion possible dans ce set */
    if(total === 0){

     const noFusionEmbed = new EmbedBuilder()
      .setTitle("⚗️ Aucune fusion disponible")
      .setColor("#e74c3c")
      .setDescription(
`❌ Tu n'as pas assez de doublons dans **${selectedSet}** pour effectuer une fusion.

**Coûts :**
⚪ C : 5 dups · 🟢 U : 6 · 🔵 R : 8 · 🟣 SR : 10 · 🔴 HR : 12 · 🟡 UR : 15 · ✨ S : 20`
      )

     return i.update({
      embeds: [noFusionEmbed],
      components: [new ActionRowBuilder().addComponents(
       new ButtonBuilder().setCustomId("fusion_back_sets").setLabel("← Retour aux sets").setStyle(ButtonStyle.Secondary)
      )]
     })
    }

    /* Menu raretés */
    const rarityOptions = buildRaritySelectOptions(dups, counts)

    const rarityMenu = new StringSelectMenuBuilder()
     .setCustomId("fusion_rarity")
     .setPlaceholder("Choisis la rareté à fusionner...")
     .addOptions(rarityOptions)

    const rarityRow  = new ActionRowBuilder().addComponents(rarityMenu)
    const backRow    = new ActionRowBuilder().addComponents(
     new ButtonBuilder().setCustomId("fusion_back_sets").setLabel("← Retour aux sets").setStyle(ButtonStyle.Secondary)
    )

    const setEmbed = new EmbedBuilder()
     .setTitle(`⚗️ Fusion — ${selectedSet}`)
     .setColor("#9b59b6")
     .setDescription("Choisis la rareté à fusionner.\n\nChaque option affiche les fusions complètes disponibles et le coût.")

    return i.update({ embeds: [setEmbed], components: [rarityRow, backRow] })
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

    const confirmRow = new ActionRowBuilder().addComponents(
     new ButtonBuilder().setCustomId("fusion_confirm").setLabel("⚗️ Fusionner").setStyle(ButtonStyle.Success),
     new ButtonBuilder().setCustomId("fusion_back_rarity").setLabel("← Retour").setStyle(ButtonStyle.Secondary)
    )

    return i.update({ embeds: [confirmEmbed], components: [confirmRow] })
   }

   /* ──────────────────────────────────────────
      BOUTON : Retour vers la liste des sets
   ────────────────────────────────────────── */

   if(i.customId === "fusion_back_sets"){

    selectedSet    = null
    selectedRarity = null

    const freshUser  = getUser(interaction.user.id)
    const freshOpts  = buildSetSelectOptions(freshUser, cards, sets)

    const freshMenu = new StringSelectMenuBuilder()
     .setCustomId("fusion_set")
     .setPlaceholder("Choisis un set...")
     .addOptions(freshOpts)

    return i.update({
     embeds: [introEmbed],
     components: [new ActionRowBuilder().addComponents(freshMenu)]
    })
   }

   /* ──────────────────────────────────────────
      BOUTON : Retour vers la liste des raretés
   ────────────────────────────────────────── */

   if(i.customId === "fusion_back_rarity"){

    selectedRarity = null

    const freshUser = getUser(interaction.user.id)
    const dups      = getDupsByRarity(freshUser, cards, selectedSet)
    const counts    = getFusionCounts(dups)

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
      ÉTAPE 3 : Confirmation → exécution
   ────────────────────────────────────────── */

   if(i.customId === "fusion_confirm"){
    collector.stop("done")
    await runFusion(i, msg, interaction.user.id, selectedSet, selectedRarity)
   }

  })

  collector.on("end", (_, reason) => {
   if(reason === "time")
    msg.edit({ components: [] }).catch(() => {})
  })

 }

}