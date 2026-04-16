/* Routes: /api/quests/* */

const { getUser, save } = require("../../systems/userSystem")
const { achievementCheck } = require("../../systems/achievementCheck")
const { addBattlePassXP } = require("../../systems/battlePassService")
const {
 ensureUserQuests,
 claimQuest,
 claimAll,
 DAILY_BONUS,
 WEEKLY_BONUS
} = require("../../systems/questSystem")
const {
 getUserGuild
} = require("../../systems/guildSystem")
const {
 claimGuildQuests
} = require("../../systems/guildQuestSystem")

module.exports = function mount(app, ctx) {
 const {
  requireSession, resolveSession,
  buildQuestStatePayload, buildQuestPreviewPayload,
  normalizeQuestType, normalizeQuestScope,
  countUnlockedAchievements, invalidateUserCaches
 } = ctx

 app.get("/api/quests/state", (req, res) => {
  try {
   const session = resolveSession(req)
   if (!session) {
    return res.json(buildQuestPreviewPayload())
   }

   const user = getUser(session.userId)
   const prevDailyId = String(user?.quests?.daily?.dayId || "")
   const prevWeeklyId = String(user?.quests?.weekly?.weekId || "")

   const payload = buildQuestStatePayload(session.userId)

   const nextDailyId = String(user?.quests?.daily?.dayId || "")
   const nextWeeklyId = String(user?.quests?.weekly?.weekId || "")
   if (prevDailyId !== nextDailyId || prevWeeklyId !== nextWeeklyId) {
    save(session.userId)
    invalidateUserCaches([session.userId], { invalidateLeaderboard: false })
   }

   res.json(payload)
  } catch (e) {
   console.error("[WEB] /api/quests/state:", e)
   res.status(500).json({ error: "Erreur serveur" })
  }
 })

 app.post("/api/quests/claim", async (req, res) => {
  try {
   const session = requireSession(req, res)
   if (!session) return

   const scope = normalizeQuestScope(req.body?.scope)
   const type = normalizeQuestType(req.body?.type)
   const questId = String(req.body?.questId || "").trim()

   if (scope === "guild") {
    const guild = getUserGuild(session.userId)
    if (!guild) return res.status(400).json({ error: "Tu n'es dans aucune guilde." })

    const result = claimGuildQuests(guild.id, session.userId, type, questId)
    if (result?.error) return res.status(400).json({ error: String(result.error) })

    const user = getUser(session.userId)
    if (user) {
     if (!user.stats || typeof user.stats !== "object") user.stats = {}
     user.stats.guildQuestsClaimed = Number(user.stats.guildQuestsClaimed || 0) + Number(result.claimed || 0)
     user.stats.guildXpContributed = Number(user.stats.guildXpContributed || 0) + Number(result.totalXP || 0)
     if (result.isPerfect) {
      user.stats.guildPerfectWeeks = Number(user.stats.guildPerfectWeeks || 0) + 1
     }
     user.stats.guildMaxLevel = Math.max(Number(user.stats.guildMaxLevel || 0), Number(guild.level || 0))
     if (Number(user.stats.guildQuestsClaimed || 0) <= Number(result.claimed || 0)) {
      user.stats.guildFirstClaim = 1
     }
    }

    if (result?.levelResult?.leveled) {
     for (const memberId of guild.memberIds || []) {
      const member = getUser(memberId)
      if (!member) continue
      if (!member.stats || typeof member.stats !== "object") member.stats = {}
      member.stats.guildMaxLevel = Math.max(Number(member.stats.guildMaxLevel || 0), Number(guild.level || 0))
      save(memberId)
     }
    }

    const unlocked = user ? achievementCheck(user, "guild") : []
    if (user) save(session.userId)

    invalidateUserCaches([session.userId])
    return res.json({
     ok: true,
     scope,
     type,
     result: {
      claimed: Number(result.claimed || 0),
      totalXP: Number(result.totalXP || 0),
      bonusXP: Number(result.bonusXP || 0),
      allDone: Boolean(result.allDone),
      isPerfect: Boolean(result.isPerfect),
      levelResult: result.levelResult || null
     },
     unlockedAchievements: countUnlockedAchievements(unlocked),
     state: buildQuestStatePayload(session.userId)
    })
   }

   const user = getUser(session.userId)
   ensureUserQuests(user)

   let claimResult = null
   let claimedCount = 0
   let completionBonus = false
   let totalKamas = 0
   let totalXp = 0
   let totalPacks = 0
   let totalFragments = 0

   if (questId) {
    const single = claimQuest(user, questId, type, { userId: session.userId })
    if (!single?.success) {
     return res.status(400).json({ error: String(single?.error || "Récompense indisponible.") })
    }

    const questReward = single?.quest?.reward || {}
    const bonus = type === "weekly" ? WEEKLY_BONUS : DAILY_BONUS
    claimedCount = 1
    completionBonus = Boolean(single.completionBonus)
    totalKamas = Number(questReward.kamas || 0)
    totalXp = Number(questReward.xp || 0)
    totalPacks = Number(questReward.packs || 0)
    totalFragments = Number(questReward.fragments || 0)

    if (completionBonus) {
     totalKamas += Number(bonus?.kamas || 0)
     totalXp += Number(bonus?.xp || 0)
     totalPacks += Number(bonus?.packs || 0)
     totalFragments += Number(single?.bonusGrantedFragments || 0)
    }
    claimResult = single
   } else {
    const multi = claimAll(user, type, { userId: session.userId })
    if (Number(multi?.claimedCount || 0) <= 0) {
     return res.status(400).json({ error: "Aucune quête à récupérer." })
    }
    claimedCount = Number(multi.claimedCount || 0)
    completionBonus = Boolean(multi.completionBonus)
    totalKamas = Number(multi.totalKamas || 0)
    totalXp = Number(multi.totalXp || 0)
    totalPacks = Number(multi.totalPacks || 0)
    totalFragments = Number(multi.totalFragments || 0)
    claimResult = multi
   }

   let totalBpXp = 0
   const bpSource = type === "weekly" ? "quest_weekly_claim" : "quest_daily_claim"
   const bpBonusSource = type === "weekly" ? "quest_weekly_bonus" : "quest_daily_bonus"

   for (let i = 0; i < claimedCount; i++) {
    const bpResult = await addBattlePassXP(session.userId, bpSource)
    totalBpXp += Number(bpResult?.addedXP || 0)
   }
   if (completionBonus) {
    const bpBonus = await addBattlePassXP(session.userId, bpBonusSource)
    totalBpXp += Number(bpBonus?.addedXP || 0)
   }

   const unlockedSet = new Set()
   const addUnlocked = (entries = []) => {
    for (const id of entries) {
     const safeId = String(id || "").trim()
     if (!safeId) continue
     unlockedSet.add(safeId)
    }
   }
   addUnlocked(achievementCheck(user, "daily"))
   addUnlocked(achievementCheck(user, "event"))
   const unlocked = [...unlockedSet]
   save(session.userId)
   invalidateUserCaches([session.userId])

   res.json({
    ok: true,
    scope,
    type,
    result: {
     claimedCount,
    totalKamas,
    totalXp,
    totalPacks,
    totalFragments,
    completionBonus,
    totalBpXp,
    raw: claimResult
    },
    unlockedAchievements: countUnlockedAchievements(unlocked),
    state: buildQuestStatePayload(session.userId)
   })
  } catch (e) {
   console.error("[WEB] /api/quests/claim:", e)
   res.status(500).json({ error: "Erreur serveur" })
  }
 })
}
