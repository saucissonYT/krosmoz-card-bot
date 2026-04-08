/* ═══════════════════════════════════════════════════════════════
   PIÑATA EVENT — systems/pinataEvent.js

   Event communautaire : le dieu Ecaflip envoie une piñata.
   Les joueurs réagissent avec des emojis pendant 60 secondes.
   Quantité + variété de réactions = meilleurs paliers de rewards.

   Le nombre de participants booste un multiplicateur global.

   Rewards possibles : kamas, XP joueur, XP guilde, XP battle pass,
   fragments aléatoires, cartes de toutes raretés.

   @module pinataEvent
═══════════════════════════════════════════════════════════════ */

const { EmbedBuilder } = require("discord.js")

const { getUser, save }                     = require("./userSystem")
const { addXP }                             = require("./progressionSystem")
const { addBattlePassXP }                   = require("./battlePassService")
const { achievementCheck }                  = require("./achievementCheck")
const { getCards }                          = require("./cardRegistry")
const { rollFragmentForEvent, grantRolledFragment } = require("./fragmentService")
const { createLogger }                      = require("./logger")
const {
 getSchedulerNextRun,
 setSchedulerNextRun
} = require("./schedulerStateStore")

const log = createLogger("PINATA")

/* ═══════════════════════════════════════════════════════════════
   CONFIG
═══════════════════════════════════════════════════════════════ */

const PINATA_DURATION_MS = 60_000 /* 1 minute */

/*
 * Paliers individuels : basés sur le SCORE du joueur.
 * Score = nombre total de réactions + (nombre d'emojis uniques × 2)
 */
const TIERS = [
 { minScore: 1,  label: "🥉 Bronze",    kamas: [100, 300],   xp: 10,  bpXp: 30,  guildXp: 5,   cardChance: 0,     cardPool: [],                          fragmentChance: 0    },
 { minScore: 5,  label: "🥈 Argent",    kamas: [300, 700],   xp: 25,  bpXp: 60,  guildXp: 12,  cardChance: 0.25,  cardPool: ["C", "U"],                  fragmentChance: 0    },
 { minScore: 10, label: "🥇 Or",        kamas: [700, 1400],  xp: 50,  bpXp: 100, guildXp: 25,  cardChance: 0.40,  cardPool: ["C", "U", "R"],             fragmentChance: 0.10 },
 { minScore: 18, label: "💎 Diamant",   kamas: [1400, 2500], xp: 100, bpXp: 150, guildXp: 40,  cardChance: 0.55,  cardPool: ["C", "U", "R", "SR"],       fragmentChance: 0.18 },
 { minScore: 28, label: "🌈 Krosmique", kamas: [2500, 4000], xp: 160, bpXp: 220, guildXp: 60,  cardChance: 0.70,  cardPool: ["C", "U", "R", "SR", "UR"], fragmentChance: 0.25 },
]

/* Multiplicateur global basé sur le nombre de participants */
const PARTICIPANT_MULTIPLIERS = [
 { min: 1,  mult: 1.00 },
 { min: 4,  mult: 1.25 },
 { min: 8,  mult: 1.50 },
 { min: 13, mult: 1.75 },
 { min: 21, mult: 2.00 },
]

/* Chance SSR bonus : uniquement au tier Krosmique, très faible */
const SSR_CHANCE_KROSMIQUE = 0.02

/* ═══════════════════════════════════════════════════════════════
   HELPERS
═══════════════════════════════════════════════════════════════ */

function randInt(min, max) {
 return Math.floor(Math.random() * (max - min + 1)) + min
}

function getTier(score) {
 let result = null
 for (const tier of TIERS) {
  if (score >= tier.minScore) result = tier
 }
 return result
}

function getMultiplier(participantCount) {
 let mult = 1
 for (const entry of PARTICIPANT_MULTIPLIERS) {
  if (participantCount >= entry.min) mult = entry.mult
 }
 return mult
}

function pickRandomCard(rarityPool) {
 const allCards = getCards()
 const pool = allCards.filter(c => rarityPool.includes(c.rarity))
 if (pool.length === 0) return null
 return pool[Math.floor(Math.random() * pool.length)]
}

/* ═══════════════════════════════════════════════════════════════
   COLLECT REACTIONS — après la fin du timer
═══════════════════════════════════════════════════════════════ */

async function collectReactions(message) {
 /*
  * On fetch le message pour avoir les réactions à jour.
  * Puis on parcourt chaque réaction et ses users.
  *
  * Retourne : Map<userId, { totalReactions, uniqueEmojis }>
  */
 const fresh = await message.fetch(true)
 const participants = new Map()

 for (const [emoji, reaction] of fresh.reactions.cache) {
  const users = await reaction.users.fetch()

  for (const [userId, user] of users) {
   if (user.bot) continue

   if (!participants.has(userId)) {
    participants.set(userId, { totalReactions: 0, uniqueEmojis: new Set() })
   }

   const data = participants.get(userId)
   data.totalReactions++
   data.uniqueEmojis.add(emoji)
  }
 }

 return participants
}

/* ═══════════════════════════════════════════════════════════════
   DISTRIBUTE REWARDS
═══════════════════════════════════════════════════════════════ */

function distributeRewards(userId, tier, multiplier) {
 const user = getUser(userId)
 const rewards = { kamas: 0, xp: 0, bpXp: tier.bpXp, guildXp: 0, card: null, fragment: null, ssrWon: false }

 /* ── Kamas ── */
 const baseKamas = randInt(tier.kamas[0], tier.kamas[1])
 rewards.kamas = Math.floor(baseKamas * multiplier)
 user.kamas = (user.kamas || 0) + rewards.kamas

 /* ── XP joueur ── */
 rewards.xp = Math.floor(tier.xp * multiplier)
 addXP(user, rewards.xp)

 /* ── XP guilde ── */
 rewards.guildXp = Math.floor(tier.guildXp * multiplier)
 if (rewards.guildXp > 0) {
  try {
   const { getUserGuild, addGuildXP, saveGuilds } = require("./guildSystem")
   const guild = getUserGuild(userId)
   if (guild) {
    addGuildXP(guild.id, rewards.guildXp)
    saveGuilds()
    user.stats.guildXpContributed = (user.stats.guildXpContributed || 0) + rewards.guildXp
   }
  } catch (_) {}
 }

 /* ── Carte ── */
 if (tier.cardChance > 0 && Math.random() < tier.cardChance) {
  /* Chance SSR uniquement au tier max */
  const isKrosmique = tier.minScore === TIERS[TIERS.length - 1].minScore
  if (isKrosmique && Math.random() < SSR_CHANCE_KROSMIQUE) {
   const ssrCard = pickRandomCard(["SSR"])
   if (ssrCard) {
    rewards.card = ssrCard
    rewards.ssrWon = true
    user.cards[ssrCard.id] = (user.cards[ssrCard.id] || 0) + 1
    user.stats.ssrPulled = (user.stats.ssrPulled || 0) + 1
    user.stats.pinataSSRWon = (user.stats.pinataSSRWon || 0) + 1
   }
  }

  if (!rewards.card) {
   const card = pickRandomCard(tier.cardPool)
   if (card) {
    rewards.card = card
    user.cards[card.id] = (user.cards[card.id] || 0) + 1
   }
  }
 }

 /* ── Fragment ── */
 if (tier.fragmentChance > 0) {
  const rolled = rollFragmentForEvent(tier.fragmentChance)
  if (rolled) {
   grantRolledFragment(userId, rolled, "pinata")
   rewards.fragment = rolled
  }
 }

 /* ── Stats piñata ── */
 if (!user.stats) user.stats = {}
 user.stats.pinataParticipations = (user.stats.pinataParticipations || 0) + 1
 user.stats.pinataReactionsTotal = (user.stats.pinataReactionsTotal || 0) + 0 /* sera mis à jour dans le caller */
 user.stats.pinataKamasWon       = (user.stats.pinataKamasWon || 0) + rewards.kamas

 save(userId)

 return rewards
}

/* ═══════════════════════════════════════════════════════════════
   MAIN — Lance une piñata dans un channel
═══════════════════════════════════════════════════════════════ */

async function launchPinata(channel) {
 if (!channel || !channel.isTextBased()) {
  log.warn("Canal piñata invalide")
  return null
 }

 log.info("Piñata lancée", { channel: channel.id })
 try { require("../web/Server").pushActivity({ kind: "pinata_start" }) } catch(_) {}

 /* ── Message d'annonce ── */
 const announceEmbed = new EmbedBuilder()
  .setTitle("🪅 La Piñata du Dieu Ecaflip est arrivée !")
  .setDescription(
   "**Réagissez un maximum pour obtenir le plus de surprises possibles !**\n\n" +
   "🎯 **Quantité** + **Variété** d'emojis = meilleurs paliers\n" +
   "👥 Plus il y a de participants, plus les récompenses sont élevées !\n\n" +
   "🪅 Kamas · XP · Cartes · Fragments · XP Guilde · XP Battle Pass\n\n" +
   "⏱️ Vous avez **60 secondes** — GO !"
  )
  .setColor("#f39c12")
  .setFooter({ text: "Piñata d'Ecaflip — le hasard sourit aux audacieux" })
  .setTimestamp()

 const pinataMsg = await channel.send({ embeds: [announceEmbed] })

 /* Ajouter quelques réactions de départ pour inciter */
 const starters = ["🪅", "🎉", "⭐", "🔥"]
 for (const emoji of starters) {
  try { await pinataMsg.react(emoji) } catch (_) {}
 }

 /* ── Attendre la fin du timer ── */
 await new Promise(resolve => setTimeout(resolve, PINATA_DURATION_MS))

 /* ── Collecter les réactions ── */
 const participants = await collectReactions(pinataMsg)

 if (participants.size === 0) {
  await channel.send({
   embeds: [new EmbedBuilder()
    .setTitle("🪅 Piñata terminée...")
    .setDescription("Personne n'a réagi ! Le dieu Ecaflip est déçu. 😿")
    .setColor("#95a5a6")]
  })
  return { participants: 0 }
 }

 const multiplier = getMultiplier(participants.size)

 /* ── Distribuer les récompenses ── */
 const results = []

 for (const [userId, data] of participants) {
  const score = data.totalReactions + (data.uniqueEmojis.size * 2)
  const tier  = getTier(score)

  if (!tier) continue

  const rewards = distributeRewards(userId, tier, multiplier)

  /* Mettre à jour les stats de réactions */
  const user = getUser(userId)
  user.stats.pinataReactionsTotal = (user.stats.pinataReactionsTotal || 0) + data.totalReactions

  /* Battle Pass XP */
  try { await addBattlePassXP(userId, rewards.bpXp, "manual") } catch (_) {}

  /* Achievements */
  try {
   achievementCheck(user, "pinata")
   /* On ne notifie pas inline pour éviter le spam — les joueurs verront au prochain /balance */
  } catch (_) {}

  save(userId)

  results.push({
   userId,
   score,
   tier:     tier.label,
   kamas:    rewards.kamas,
   xp:       rewards.xp,
   card:     rewards.card,
   fragment: rewards.fragment,
   ssrWon:   rewards.ssrWon,
   guildXp:  rewards.guildXp
  })
 }

 /* Trier par score décroissant */
 results.sort((a, b) => b.score - a.score)

 /* ── Embed de résultats ── */
 const lines = results.slice(0, 20).map((r, i) => {
  const medal   = i === 0 ? "👑" : i === 1 ? "🥈" : i === 2 ? "🥉" : "▸"
  const cardStr = r.card ? ` · 🃏 ${r.card.name} (${r.card.rarity})` : ""
  const fragStr = r.fragment ? " · 🧩 Fragment" : ""
  const ssrStr  = r.ssrWon ? " 🌈" : ""
  return `${medal} <@${r.userId}> — ${r.tier} · 💰 ${r.kamas}${cardStr}${fragStr}${ssrStr}`
 })

 if (results.length > 20) {
  lines.push(`... +${results.length - 20} autre(s) participant(s)`)
 }

 const totalKamas = results.reduce((s, r) => s + r.kamas, 0)
 const totalCards = results.filter(r => r.card).length
 const totalSSR   = results.filter(r => r.ssrWon).length
 const totalFrags = results.filter(r => r.fragment).length

 const resultEmbed = new EmbedBuilder()
  .setTitle("🪅 Piñata terminée !")
  .setDescription(lines.join("\n"))
  .addFields(
   { name: "👥 Participants", value: `${participants.size}`, inline: true },
   { name: "✨ Multiplicateur", value: `×${multiplier}`, inline: true },
   { name: "💰 Kamas distribués", value: `${totalKamas.toLocaleString("fr-FR")}`, inline: true }
  )
  .setColor("#f1c40f")
  .setFooter({ text: "Le dieu Ecaflip sourit à ceux qui participent !" })
  .setTimestamp()

 if (totalCards > 0)
  resultEmbed.addFields({ name: "🃏 Cartes gagnées", value: `${totalCards}`, inline: true })
 if (totalSSR > 0)
  resultEmbed.addFields({ name: "🌈 SSR gagnées", value: `${totalSSR}`, inline: true })
 if (totalFrags > 0)
  resultEmbed.addFields({ name: "🧩 Fragments", value: `${totalFrags}`, inline: true })

 await channel.send({ embeds: [resultEmbed] })

 log.info("Piñata terminée", {
  participants: participants.size,
  multiplier,
  totalKamas,
  totalCards,
  totalSSR
 })

 try { require("../web/Server").pushActivity({ kind: "pinata_end", participants: participants.size }) } catch(_) {}

 return { participants: participants.size, results }
}

/* ═══════════════════════════════════════════════════════════════
   SCHEDULER — intervalle aléatoire entre piñatas
   Appeler startPinataScheduler(client, channelIds) dans bootstrap
═══════════════════════════════════════════════════════════════ */

const MIN_INTERVAL_MS = 4 * 60 * 60 * 1000  /* 4 heures */
const MAX_INTERVAL_MS = 5 * 60 * 60 * 1000  /* 5 heures */
const NO_ACTIVITY_PENALTY_MS = 3 * 60 * 60 * 1000 /* +3h si 0 participant */
const PINATA_SCHEDULER_KEY = "discord_pinata"

/* Salon Discord unique pour les piñatas automatiques */
const DEFAULT_PINATA_CHANNELS = [
 "1487121269018329178"
]

let schedulerTimeout = null

function getNextDelay() {
 return randInt(MIN_INTERVAL_MS, MAX_INTERVAL_MS)
}

function scheduleNextTick(tick, nextAt) {
 const safeNextAt = Math.max(Date.now(), Number(nextAt || 0))
 const delay = Math.max(0, safeNextAt - Date.now())
 if (schedulerTimeout) clearTimeout(schedulerTimeout)
 setSchedulerNextRun(PINATA_SCHEDULER_KEY, safeNextAt)
 schedulerTimeout = setTimeout(tick, delay)
 return delay
}

function startPinataScheduler(client, channelIds) {
 const channels = Array.isArray(channelIds) && channelIds.length > 0
  ? channelIds
  : DEFAULT_PINATA_CHANNELS

 if (channels.length === 0) {
  log.warn("Aucun salon configuré pour la piñata — scheduler désactivé")
  return
 }

 async function tick() {
  try {
   const chosenId = channels[0]
   const channel = await client.channels.fetch(chosenId)
   if (channel && channel.isTextBased()) {
    const result = await launchPinata(channel)
    let delay = getNextDelay()
    if (Number(result?.participants || 0) === 0) {
     delay += NO_ACTIVITY_PENALTY_MS
     log.info("Bonus anti-spam appliqué (piñata sans participants)", {
      addedMinutes: Math.round(NO_ACTIVITY_PENALTY_MS / 60000)
     })
    }
    const nextAt = Date.now() + delay
    log.info("Prochaine piñata dans", { minutes: Math.round(delay / 60000) })
    scheduleNextTick(tick, nextAt)
    return
   }
  } catch (err) {
   log.error("Erreur piñata scheduler", { err: err.message })
  }

  const delay = getNextDelay()
  const nextAt = Date.now() + delay
  log.info("Prochaine piñata dans", { minutes: Math.round(delay / 60000) })
  scheduleNextTick(tick, nextAt)
 }

 const restoredNextAt = getSchedulerNextRun(PINATA_SCHEDULER_KEY)
 const firstNextAt = restoredNextAt || (Date.now() + getNextDelay())
 const firstDelay = scheduleNextTick(tick, firstNextAt)
 log.info("Piñata scheduler initialisé", {
  restored: Boolean(restoredNextAt),
  minutes: Math.round(firstDelay / 60000),
  channels: channels.length
 })
}

function stopPinataScheduler() {
 if (schedulerTimeout) {
  clearTimeout(schedulerTimeout)
  schedulerTimeout = null
 }
}

/* ═══════════════════════════════════════════════════════════════
   EXPORTS
═══════════════════════════════════════════════════════════════ */

module.exports = {
 launchPinata,
 startPinataScheduler,
 stopPinataScheduler,
 PINATA_DURATION_MS
}
