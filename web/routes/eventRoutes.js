/* Routes: /api/events/* */

const { getUser, save } = require("../../systems/userSystem")
const { achievementCheck } = require("../../systems/achievementCheck")
const { addBattlePassXP } = require("../../systems/battlePassService")
const { isSecretCard } = require("../../systems/secretCard")
const {
 getEvent,
 isEventActive,
 initUserEvent,
 canUseEventPack,
 registerEventPack,
 claimFirstPack
} = require("../../systems/eventSystem")
const { generateEventPack } = require("../../systems/eventPackEngine")
const { applyEventRewards } = require("../../systems/rewardSystem")
const {
 rollFragmentForEvent,
 grantRolledFragment
} = require("../../systems/fragmentService")
const {
 USER_TOASTS_MAX_POP,
 enqueueWebRewardToast,
 popWebRewardToasts
} = require("../../systems/webToastQueue")
const { recordAction } = require("../../systems/achievementProgressTracker")
const rouletteGameplay = require("../../commands/joueur/roulette")

const {
 pickLot: pickRouletteLot,
 updateRouletteStats: updateRouletteStatsFromCommand,
 applyReward: applyRouletteRewardFromCommand,
 formatReward: formatRouletteReward
} = rouletteGameplay

module.exports = function mount(app, ctx) {
 const {
  requireSession, resolveSession,
  buildMePayload, countUnlockedAchievements,
  getSets, getCardSetNameMap,
  stripDiscordMarkdownForWeb, buildEventVoiceLine,
  appendRecruitHistoryEntries, pushActivity,
  webPinataState, ensureWebPinataLifecycle, getWebPinataView,
  buildCardImageUrl,
  WEB_PINATA_ALLOWED_EMOJIS, invalidateUserCaches
 } = ctx

 app.get("/api/events/state", async (req, res) => {
  try {
   await ensureWebPinataLifecycle()
   const session = resolveSession(req)
   const connected = Boolean(session)
   const event = getEvent()
   const eventActive = isEventActive() && Boolean(event)

   let me = null
   let roulette = { canSpin: false, cooldownMs: 0, lastSpin: null }
   const tickets = { total: 0, used: 0, remaining: 0 }
   if (connected && session) {
    const user = getUser(session.userId)
    me = buildMePayload(session.userId)
    const now = Date.now()
    const lastSpinTs = user.stats?.rouletteLastSpin ? new Date(user.stats.rouletteLastSpin).getTime() : 0
    const cooldownMs = Math.max(0, (60 * 60 * 1000) - Math.max(0, now - lastSpinTs))
    roulette = {
     canSpin: cooldownMs <= 0,
     cooldownMs,
     lastSpin: user.stats?.rouletteLastSpin || null,
     spins: Number(user.stats?.rouletteSpins || 0),
     jackpots: Number(user.stats?.rouletteJackpot || 0)
    }

    if (eventActive) {
     const beforeEventState = `${user.event?.uid || ""}:${user.event?.tickets || ""}:${user.event?.used || ""}`
     initUserEvent(user)
     tickets.total = Number(user.event?.tickets || 0)
     tickets.used = Number(user.event?.used || 0)
     tickets.remaining = Math.max(0, tickets.total - tickets.used)
     const afterEventState = `${user.event?.uid || ""}:${user.event?.tickets || ""}:${user.event?.used || ""}`
     if (beforeEventState !== afterEventState) {
      save(session.userId)
      invalidateUserCaches([session.userId], { invalidateLeaderboard: false })
     }
    }
   }

   const eventView = eventActive
    ? {
      active: true,
      key: String(event.key),
      name: String(event.name || "Event"),
      effect: stripDiscordMarkdownForWeb(event.effect),
      startText: stripDiscordMarkdownForWeb(event.start),
      midText: stripDiscordMarkdownForWeb(event.mid),
      endText: stripDiscordMarkdownForWeb(event.end),
      needsTarget: Boolean(event.needsTarget),
      targetName: String(event?.data?.targetName || ""),
      ticketsPerPlayer: Number(event.tickets || 0),
     stats: {
      packs: Number(event.stats?.packs || 0),
      ssr: Number(event.stats?.ssr || 0),
      totalCards: Number(event.stats?.totalCards || 0)
     },
     endTime: Number(event.endTime || 0)
    }
    : { active: false }

   res.json({
    connected,
    me,
    roulette,
    tickets,
    event: eventView,
    pinata: getWebPinataView(session?.userId || null)
   })
  } catch (e) {
   console.error("[WEB] /api/events/state:", e)
   res.status(500).json({ error: "Erreur serveur" })
  }
 })

 app.post("/api/events/roulette/spin", async (req, res) => {
  try {
   const session = requireSession(req, res)
   if (!session) return

   const user = getUser(session.userId)
   if (!user.stats) user.stats = {}
   const now = Date.now()
   const lastSpin = user.stats.rouletteLastSpin ? new Date(user.stats.rouletteLastSpin).getTime() : 0
   const elapsed = now - lastSpin
   const cooldownMs = (60 * 60 * 1000) - elapsed
   if (cooldownMs > 0) {
    return res.status(400).json({ error: "Roulette en recharge.", cooldownMs })
   }

   const lot = pickRouletteLot()
   updateRouletteStatsFromCommand(user, lot, now)
   await applyRouletteRewardFromCommand({ user: { id: String(session.userId) } }, user, lot)
   await addBattlePassXP(session.userId, "roulette_spin")
   recordAction(user, "roulette", now)
   const unlocked = achievementCheck(user, "roulette")

   save(session.userId)
   invalidateUserCaches([session.userId])

   enqueueWebRewardToast(session.userId, {
    type: "event",
    tone: "event",
    title: "🎲 Roulette d'Écaflip",
    subtitle: `${String(lot.emoji || "🎁")} ${String(lot.name || "Lot")}`,
    description: `Rareté: ${String(lot.rarity || "commun")}`,
    rewardText: formatRouletteReward(lot.reward || {}),
    chipLabel: "Gains"
   })

   res.json({
    ok: true,
    lot: {
     id: Number(lot.id || 0),
     name: String(lot.name || "Lot"),
     emoji: String(lot.emoji || "🎁"),
     rarity: String(lot.rarity || "commun")
    },
    rewardText: formatRouletteReward(lot.reward || {}),
    stats: {
     kamas: Number(user.kamas || 0),
     packs: Number(user.packs || 0),
     spins: Number(user.stats.rouletteSpins || 0),
     jackpots: Number(user.stats.rouletteJackpot || 0)
    },
    unlockedAchievements: countUnlockedAchievements(unlocked)
   })
  } catch (e) {
   console.error("[WEB] /api/events/roulette/spin:", e)
   res.status(500).json({ error: "Erreur serveur" })
  }
 })

 app.get("/api/events/reward-toasts", (req, res) => {
  try {
   const session = requireSession(req, res)
   if (!session) return
   const items = popWebRewardToasts(session.userId, USER_TOASTS_MAX_POP)
   res.json({ ok: true, items })
  } catch (e) {
   console.error("[WEB] /api/events/reward-toasts:", e)
   res.status(500).json({ error: "Erreur serveur" })
  }
 })

 app.post("/api/events/eventpack/open", async (req, res) => {
  try {
   const session = requireSession(req, res)
   if (!session) return

   const event = getEvent()
   if (!isEventActive() || !event) {
    return res.status(400).json({ error: "Aucun event des dieux n'est actif." })
   }

   const user = getUser(session.userId)
   const setNames = getCardSetNameMap(getSets())
   if (!user.stats) user.stats = {}
   if (!user.cards) user.cards = {}

   initUserEvent(user)
   const check = canUseEventPack(user)
   if (!check?.ok) return res.status(400).json({ error: String(check?.error || "Ticket indisponible.") })

   const isFirstPack = claimFirstPack()
   user.event.used = Number(user.event.used || 0) + 1

   const generated = generateEventPack(user, event)
   const pack = Array.isArray(generated?.pack) ? generated.pack.filter(Boolean) : []
   const meta = generated?.meta || {}
   if (!pack.length) return res.status(400).json({ error: "Pack d'event invalide." })

   const discoveredIds = new Set()
   for (const card of pack) {
    if (!card?.id) continue
    if (!user.cards[card.id] || Number(user.cards[card.id]) <= 0) discoveredIds.add(String(card.id))
   }
   for (const card of pack) {
    if (!card?.id) continue
    user.cards[card.id] = Number(user.cards[card.id] || 0) + 1
   }

   const kamasBefore = Number(user.kamas || 0)
   const reward = applyEventRewards(user, pack, event, meta) || {}
   const kamasGain = Math.max(0, Number(user.kamas || 0) - kamasBefore)
   await addBattlePassXP(session.userId, "event_pack")
   registerEventPack(pack)

   let fragment = null
   const rolled = rollFragmentForEvent(0.55)
   if (rolled) {
    grantRolledFragment(session.userId, rolled, "event-web")
    fragment = { cardId: String(rolled.cardId), fragmentNumber: Number(rolled.fragmentNumber || 0) }
   }

   user.stats.eventPacksOpened = Number(user.stats.eventPacksOpened || 0) + 1
   if (!user.stats.eventPacksByClass) user.stats.eventPacksByClass = {}
   user.stats.eventPacksByClass[event.key] = Number(user.stats.eventPacksByClass[event.key] || 0) + 1
   if (!Array.isArray(user.stats.eventsParticipated)) user.stats.eventsParticipated = []
   if (!user.stats.eventsParticipated.includes(event.key)) user.stats.eventsParticipated.push(event.key)
   if (isFirstPack) user.stats.firstEventPacks = Number(user.stats.firstEventPacks || 0) + 1
   if (Number(user.event?.used || 0) >= Number(user.event?.tickets || 0)) {
    user.stats.ticketsFullyUsed = Number(user.stats.ticketsFullyUsed || 0) + 1
    const elapsed = Date.now() - Number(user.event?.startTime || Date.now())
    if (elapsed <= 120000) user.stats.speedTickets = true
   }

   const ssrInPack = pack.filter((card) => String(card?.rarity || "") === "SSR").length
   if (ssrInPack > 0) {
    user.stats.ssrPulled = Number(user.stats.ssrPulled || 0) + ssrInPack
    user.stats.ssrFromEvent = Number(user.stats.ssrFromEvent || 0) + ssrInPack
    if (!user.stats.ssrByClass) user.stats.ssrByClass = {}
    user.stats.ssrByClass[event.key] = Number(user.stats.ssrByClass[event.key] || 0) + ssrInPack
   }
   if (event.key === "enutrof" && meta?.jackpot) user.stats.jackpotEnutrof = Number(user.stats.jackpotEnutrof || 0) + 1
   if (event.key === "feca" && reward?.jackpotMessage) user.stats.jackpotFeca = Number(user.stats.jackpotFeca || 0) + 1

   const groupedHistory = new Map()
   for (const card of pack) {
    if (!card?.id || isSecretCard(card)) continue
    const cardSetId = String(card?.set || "")
    const key = `${card.id}:${card.shiny ? 1 : 0}`
    if (!groupedHistory.has(key)) {
     groupedHistory.set(key, {
      setId: cardSetId,
      setName: String(setNames.get(cardSetId) || cardSetId || event?.name || "Event"),
      itemName: String(card?.name || `Carte ${card.id}`),
      recruitmentName: String(event?.name || "Event Pack"),
      rarity: String(card?.rarity || "C"),
      qty: 0,
      imageUrl: buildCardImageUrl(card?.set, card?.image)
     })
    }
    groupedHistory.get(key).qty += 1
   }
   appendRecruitHistoryEntries(user, [...groupedHistory.values()])

   const unlocked = [
    ...achievementCheck(user, "event"),
    ...achievementCheck(user, "fragment"),
    ...achievementCheck(user, "collection"),
    ...achievementCheck(user, "rng")
   ]
   save(session.userId)
   invalidateUserCaches([session.userId])

   for (const card of pack) {
    const rarity = String(card?.rarity || "").toUpperCase()
    if (rarity === "SSR") {
     pushActivity({
      kind: "drop_ssr",
      userId: String(session.userId),
      cardName: String(card?.name || "Carte inconnue"),
      shiny: Boolean(card?.shiny)
     })
    } else if (rarity === "S") {
     pushActivity({
      kind: "drop_s",
      userId: String(session.userId),
      cardName: String(card?.name || "Carte inconnue")
     })
    }
   }

   const cardsPayload = pack.filter((card) => !isSecretCard(card)).map((card, index) => ({
    key: `${card.id}-${index}`,
    cardId: String(card.id),
    cardName: String(card.name || `Carte ${card.id}`),
    rarity: String(card.rarity || "C"),
    set: String(card.set || ""),
    imageUrl: buildCardImageUrl(card?.set, card?.image),
    isNew: discoveredIds.has(String(card.id))
   }))

   const tickets = {
    total: Number(user.event?.tickets || 0),
    used: Number(user.event?.used || 0),
    remaining: Math.max(0, Number(user.event?.tickets || 0) - Number(user.event?.used || 0))
   }

   res.json({
    ok: true,
    event: {
     key: String(event.key),
     name: String(event.name || "Event"),
     jackpotMessage: reward?.jackpotMessage || null,
     voiceLine: buildEventVoiceLine(event, pack)
    },
    tickets,
    gains: {
     kamas: kamasGain,
     xp: Number(reward?.xp || 0),
     ssrInPack,
     fragment
    },
    cards: cardsPayload,
    unlockedAchievements: countUnlockedAchievements(unlocked)
   })
  } catch (e) {
   console.error("[WEB] /api/events/eventpack/open:", e)
   res.status(500).json({ error: "Erreur serveur" })
  }
 })

 app.post("/api/events/pinata/react", async (req, res) => {
  try {
   const session = requireSession(req, res)
   if (!session) return
   await ensureWebPinataLifecycle()

   if (!webPinataState.active) {
    return res.status(400).json({
     error: "Aucune piñata active.",
     nextStartAt: webPinataState.nextStartAt
    })
   }

   const emoji = String(req.body?.emoji || "").trim()
   if (!WEB_PINATA_ALLOWED_EMOJIS.includes(emoji)) {
    return res.status(400).json({ error: "Emoji de réaction invalide." })
   }

   const userId = String(session.userId)
   let participant = webPinataState.participants.get(userId)
   if (!participant) {
    participant = {
     totalReactions: 0,
     uniqueEmojis: new Set()
    }
    webPinataState.participants.set(userId, participant)
    const actor = getUser(userId)
    if (actor) {
     recordAction(actor, "pinata", Date.now())
     save(userId)
    }
   }

   if (participant.uniqueEmojis.has(emoji)) {
    return res.status(400).json({ error: "Tu as déjà utilisé cet emoji sur cette piñata." })
   }

   participant.uniqueEmojis.add(emoji)
   participant.totalReactions += 1
   const score = participant.totalReactions + (participant.uniqueEmojis.size * 2)

   res.json({
    ok: true,
    score,
    totalReactions: participant.totalReactions,
    uniqueCount: participant.uniqueEmojis.size,
    participants: webPinataState.participants.size,
    pinata: getWebPinataView(userId)
   })
  } catch (e) {
   console.error("[WEB] /api/events/pinata/react:", e)
   res.status(500).json({ error: "Erreur serveur" })
  }
 })
}
