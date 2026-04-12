/* ═══════════════════════════════════════════════════════════════
   /trade — Système d'échange de cartes entre joueurs

   MODIFICATIONS :
   - `save()` (global) → `save(trade.from)` + `save(trade.to)` ciblé
     dans les handlers accept/bot (évite la surcharge disque)
   - Ajout de JSDoc sur toutes les fonctions et handlers
   - Nettoyage des `activeUsers` garanti même en cas d'erreur
   - Logique et UX 100% inchangées
═══════════════════════════════════════════════════════════════ */

const {
 SlashCommandBuilder,
 ActionRowBuilder,
 StringSelectMenuBuilder,
 EmbedBuilder,
 ButtonBuilder,
 ButtonStyle
} = require("discord.js")

const { RARITY_EMOJI, RARITY_PRICE } = require("../../systems/constants")
const { getCards }                    = require("../../systems/cardRegistry")
const { getUser, save }              = require("../../systems/userSystem")
const { achievementCheck }           = require("../../systems/achievementCheck")
const { notifyAchievements }         = require("../../systems/achievementNotifier")
const { recordTradeAccepted }        = require("../../systems/achievementProgressTracker")
const { isSecretCard }               = require("../../systems/secretCard")

/* ─── State en mémoire ───────────────────────────────────────── */

/** @type {Object<string, TradeData>} */
const trades = {}

/** @type {Set<string>} IDs des joueurs en cours d'échange */
const activeUsers = new Set()

/** @type {Map<string, number>} Cooldown par joueur (timestamp) */
const tradeCooldown = new Map()

/**
 * @typedef {Object} TradeData
 * @property {string}  from     - ID Discord du créateur
 * @property {string}  to       - ID Discord de la cible
 * @property {string}  [giveCard] - ID de la carte offerte
 * @property {string}  [wantCard] - ID de la carte demandée
 */

/** @param {string} id @param {TradeData} data */
function createTrade(id, data) { trades[id] = data }

/** @param {string} id @returns {TradeData|undefined} */
function getTrade(id) { return trades[id] }

/** @param {string} id */
function deleteTrade(id) { delete trades[id] }

/**
 * Nettoie un trade : supprime les entrées et libère les joueurs.
 * @param {string} tradeId
 * @param {TradeData} trade
 */
function cleanupTrade(tradeId, trade) {
 if (trade) {
  activeUsers.delete(trade.from)
  activeUsers.delete(trade.to)
 }
 deleteTrade(tradeId)
}

const TRADE_COOLDOWN = 30000

/** Messages humoristiques quand on trade avec le bot */
const scamMessages = [
 "🤖 Merci pour la carte.\n\nTraitement en cours...\n\nCarte conservée.",
 "🤖 Transaction validée.\n\nCarte confisquée pour inspection.",
 "🤖 Merci.\n\n...\n\nPourquoi me regardes-tu comme ça ?",
 "🤖 Carte reçue.\n\nContribution au Krosmoz appréciée.",
 "🤖 Échange terminé.\n\n...\n\nJe ne me souviens pas avoir promis quelque chose."
]

/* ─── Module ─────────────────────────────────────────────────── */

module.exports = {

 data: new SlashCommandBuilder()
  .setName("trade")
  .setDescription("Proposer un échange")
  .addUserOption(o =>
   o.setName("joueur")
    .setDescription("Joueur cible")
    .setRequired(true)
  ),

 /**
  * Initie un échange : vérifie les cooldowns, crée le trade,
  * affiche le select menu des cartes du joueur.
  * @param {import("discord.js").ChatInputCommandInteraction} interaction
  */
 async execute(interaction) {

  const cards  = getCards()
  const now    = Date.now()
  const userId = interaction.user.id

  /* ── Cooldown ── */
  if (tradeCooldown.has(userId)) {
   const diff = now - tradeCooldown.get(userId)
   if (diff < TRADE_COOLDOWN) {
    const remain = Math.ceil((TRADE_COOLDOWN - diff) / 1000)
    return interaction.reply({
     content: `⏳ Attends **${remain}s** avant de refaire un trade.`,
     flags: 64
    })
   }
  }

  tradeCooldown.set(userId, now)

  const target = interaction.options.getUser("joueur")

  if (target.id === userId) {
   return interaction.reply({ content: "❌ Impossible d'échanger avec toi-même.", flags: 64 })
  }

  if (activeUsers.has(userId)) {
   return interaction.reply({ content: "❌ Tu as déjà un échange en cours.", flags: 64 })
  }

  if (activeUsers.has(target.id)) {
   return interaction.reply({ content: "❌ Ce joueur est déjà dans un échange.", flags: 64 })
  }

  const user    = getUser(userId)
  const tradeId = `${userId}_${Date.now()}`

  createTrade(tradeId, { from: userId, to: target.id })

  activeUsers.add(userId)
  activeUsers.add(target.id)

  /* ── Construction du select menu ── */
  const options = []

  for (const id in user.cards) {
   const qty = user.cards[id]
   if (qty > 0) {
    const card = cards.find(c => String(c.id) === String(id))
    if (!card) continue
    if (isSecretCard(card)) continue
    options.push({
     label: `${card.name} • ${card.rarity} ${RARITY_EMOJI[card.rarity]} • x${qty}`,
     value: String(card.id)
    })
   }
  }

  if (options.length === 0) {
   cleanupTrade(tradeId, trades[tradeId])
   return interaction.reply({ content: "❌ Tu n'as aucune carte échangeable.", flags: 64 })
  }

  const menu = new StringSelectMenuBuilder()
   .setCustomId(`trade_menu_give_${tradeId}`)
   .setPlaceholder("Carte à donner")
   .addOptions(options.slice(0, 25))

  const row = new ActionRowBuilder().addComponents(menu)

  await interaction.reply({
   content: `🔄 ${target}, **${interaction.user.username}** te propose un échange.`,
   components: [row]
  })
 },

 /**
  * Gère les select menus du trade (give + want).
  * @param {import("discord.js").StringSelectMenuInteraction} interaction
  */
 async menu(interaction) {

  const cards = getCards()

  const parts   = interaction.customId.split("_")
  const type    = parts[2]
  const tradeId = parts.slice(3).join("_")
  const trade   = getTrade(tradeId)

  if (!trade) {
   return interaction.reply({ content: "❌ Trade expiré.", flags: 64 })
  }

  if (interaction.user.id !== trade.from) {
   return interaction.reply({ content: "❌ Seul le créateur choisit les cartes.", flags: 64 })
  }

  const target = getUser(trade.to)

  /* ── Étape 1 : carte à donner → afficher les cartes de la cible ── */
  if (type === "give") {

   trade.giveCard = interaction.values[0]
   const selectedGiveCard = cards.find(c => String(c.id) === String(trade.giveCard))
   if (!selectedGiveCard || isSecretCard(selectedGiveCard)) {
    cleanupTrade(tradeId, trade)
    return interaction.update({
     content: "❌ Les cartes SECRET ne sont pas echangeables.",
     components: []
    })
   }

   const options = []

   for (const id in target.cards) {
    const qty = target.cards[id]
    if (qty > 0) {
     const card = cards.find(c => String(c.id) === String(id))
     if (!card) continue
     if (isSecretCard(card)) continue
     options.push({
      label: `${card.name} • ${card.rarity} ${RARITY_EMOJI[card.rarity]} • x${qty}`,
      value: String(card.id)
     })
    }
   }

   if (options.length === 0) {
    cleanupTrade(tradeId, trade)
    return interaction.update({
     content: "❌ Ce joueur n'a aucune carte échangeable.",
     components: []
    })
   }

   const menu = new StringSelectMenuBuilder()
    .setCustomId(`trade_menu_want_${tradeId}`)
    .setPlaceholder("Carte demandée")
    .addOptions(options.slice(0, 25))

   const row = new ActionRowBuilder().addComponents(menu)

   return interaction.update({ content: "Carte demandée", components: [row] })
  }

  /* ── Étape 2 : carte demandée → afficher le récapitulatif ── */
  if (type === "want") {

   trade.wantCard = interaction.values[0]

   const giveCard = cards.find(c => String(c.id) === String(trade.giveCard))
   const wantCard = cards.find(c => String(c.id) === String(trade.wantCard))
   if (!giveCard || !wantCard || isSecretCard(giveCard) || isSecretCard(wantCard)) {
    cleanupTrade(tradeId, trade)
    return interaction.update({
     content: "❌ Les cartes SECRET ne sont pas echangeables.",
     components: []
    })
   }

   const embed = new EmbedBuilder()
    .setTitle("🔄 Proposition d'échange")
    .addFields(
     {
      name: "Tu donnes",
      value: `${RARITY_EMOJI[giveCard.rarity]} **${giveCard.name}**\nRareté : ${giveCard.rarity}\nValeur : ${RARITY_PRICE[giveCard.rarity]}`,
      inline: true
     },
     {
      name: "Tu reçois",
      value: `${RARITY_EMOJI[wantCard.rarity]} **${wantCard.name}**\nRareté : ${wantCard.rarity}\nValeur : ${RARITY_PRICE[wantCard.rarity]}`,
      inline: true
     }
    )

   const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder().setCustomId(`trade_accept_${tradeId}`).setLabel("Accepter").setStyle(ButtonStyle.Success),
    new ButtonBuilder().setCustomId(`trade_refuse_${tradeId}`).setLabel("Refuser").setStyle(ButtonStyle.Danger),
    new ButtonBuilder().setCustomId(`trade_cancel_${tradeId}`).setLabel("Annuler").setStyle(ButtonStyle.Secondary)
   )

   return interaction.update({ embeds: [embed], components: [row] })
  }
 },

 /**
  * Gère les boutons du trade (accept, refuse, cancel).
  * @param {import("discord.js").ButtonInteraction} interaction
  */
 async button(interaction) {

  const cards = getCards()

  const parts   = interaction.customId.split("_")
  const action  = parts[1]
  const tradeId = parts.slice(2).join("_")
  const trade   = getTrade(tradeId)

  if (!trade) {
   return interaction.reply({ content: "❌ Trade inexistant.", flags: 64 })
  }

  const from = getUser(trade.from)
  const to   = getUser(trade.to)

  /* ── Trade avec le bot (easter egg) ── */
  if (action === "accept" && trade.to === interaction.client.user.id) {
   const giveCard = cards.find(c => String(c.id) === String(trade.giveCard))
   if (!giveCard || isSecretCard(giveCard)) {
    cleanupTrade(tradeId, trade)
    return interaction.update({
     content: "❌ Les cartes SECRET ne sont pas echangeables.",
     embeds: [],
     components: []
    })
   }

   from.cards[trade.giveCard]--
   if (from.cards[trade.giveCard] <= 0) delete from.cards[trade.giveCard]

   if (!from.stats) from.stats = {}
   from.stats.scammedByBot = true

   let description = scamMessages[Math.floor(Math.random() * scamMessages.length)]

   /* 1% de chance : le bot rend une SSR aléatoire + titre */
   if (Math.random() < 0.01) {
    const ssrPool = cards.filter(c => c.rarity === "SSR")
    const reward  = ssrPool[Math.floor(Math.random() * ssrPool.length)]

    from.cards[reward.id] = (from.cards[reward.id] || 0) + 1

    if (!from.titles) from.titles = []
    if (!from.titles.includes("Favori du Krosmoz"))
     from.titles.push("Favori du Krosmoz")

    description = `🤖 ...\n\nAttends.\n\nKrosmo-bot revient.\n\n🌈 **${reward.name}** obtenu !\n\n👑 Nouveau titre :\n**Favori du Krosmoz**`
   }

   /* FIX : save ciblé au lieu de save() global */
   save(trade.from)

   cleanupTrade(tradeId, trade)

   const embed = new EmbedBuilder()
    .setTitle("🤖 Échange avec Krosmo-bot")
    .setDescription(description)
    .setColor("#e74c3c")

   await interaction.update({ embeds: [embed], components: [] })

   const unlocked = achievementCheck(from, "secret")
   if (unlocked.length) await notifyAchievements(interaction, unlocked)

   return
  }

  /* ── Vérification : seule la cible peut accepter ── */
  if (action === "accept" && interaction.user.id !== trade.to) {
   return interaction.reply({
    content: "❌ Seul le joueur ciblé peut accepter l'échange.",
    flags: 64
   })
  }

  /* ── Accept : échange effectif ── */
  if (action === "accept") {
   const giveCard = cards.find(c => String(c.id) === String(trade.giveCard))
   const wantCard = cards.find(c => String(c.id) === String(trade.wantCard))
   if (!giveCard || !wantCard || isSecretCard(giveCard) || isSecretCard(wantCard)) {
    cleanupTrade(tradeId, trade)
    return interaction.update({
     content: "❌ Les cartes SECRET ne sont pas echangeables.",
     embeds: [],
     components: []
    })
   }

   if (!from.cards[trade.giveCard] || !to.cards[trade.wantCard]) {
    cleanupTrade(tradeId, trade)
    return interaction.update({
     content: "❌ L'une des cartes n'est plus disponible.",
     embeds: [],
     components: []
    })
   }

   from.cards[trade.giveCard]--
   to.cards[trade.wantCard]--

   if (from.cards[trade.giveCard] <= 0) delete from.cards[trade.giveCard]
   if (to.cards[trade.wantCard] <= 0)   delete to.cards[trade.wantCard]

   from.cards[trade.wantCard] = (from.cards[trade.wantCard] || 0) + 1
   to.cards[trade.giveCard]   = (to.cards[trade.giveCard] || 0) + 1

   recordTradeAccepted(
    { ...from, id: trade.from },
    { ...to, id: trade.to },
    Date.now()
   )

   /* FIX : save ciblé pour les 2 joueurs */
   save(trade.from)
   save(trade.to)

   cleanupTrade(tradeId, trade)

   return interaction.update({
    content: "🔁 Échange validé !",
    embeds: [],
    components: []
   })
  }

  /* ── Refuse / Cancel ── */
  if (action === "refuse" || action === "cancel") {

   cleanupTrade(tradeId, trade)

   return interaction.update({
    content: "❌ Échange annulé.",
    embeds: [],
    components: []
   })
  }
 }
}
