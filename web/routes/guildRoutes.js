/* Routes: /api/guilds, /api/guild/* */

const { getUser, save } = require("../../systems/userSystem")
const { achievementCheck } = require("../../systems/achievementCheck")
const {
 createGuild,
 disbandGuild,
 joinGuild,
 leaveGuild,
 kickMember,
 promoteOfficer,
 demoteOfficer,
 transferLeader,
 renameGuild,
 getUserGuild,
 getGuildRank
} = require("../../systems/guildSystem")
const { recordGuildRecruitment } = require("../../systems/achievementProgressTracker")

module.exports = function mount(app, ctx) {
 const {
  requireSession, apiCache, parsePagination,
  computeGuildSummary, computeGuildProfile,
  buildGuildStatePayload, countUnlockedAchievements,
  asGuildId, addGuildApplication, respondGuildApplication,
  removeGuildApplicationsForUser, switchLocalGuildRole
 } = ctx

 const invalidateGuildCaches = (userIds = []) => {
  apiCache.invalidatePrefix("leaderboard:")
  for (const id of userIds) {
   const safeId = asGuildId(id)
   if (!safeId) continue
   apiCache.invalidate(`profile:${safeId}`)
  }
 }

 app.get("/api/guilds", (req, res) => {
  try {
   const { page, limit, offset } = parsePagination(req, 20, 100)
   const all = computeGuildSummary(req.query)
   const items = all.slice(offset, offset + limit)
   const pages = Math.max(1, Math.ceil(all.length / limit))

   res.json({
    total: all.length,
    page,
    pages,
    limit,
    items
   })
  } catch (e) {
   console.error("[WEB] /api/guilds:", e)
   res.status(500).json({ error: "Erreur serveur" })
  }
 })

 app.get("/api/guild/me", async (req, res) => {
  try {
   const session = requireSession(req, res)
   if (!session) return
   const payload = await buildGuildStatePayload(session.userId)
   return res.json(payload || { connected: true, inGuild: false })
  } catch (e) {
   console.error("[WEB] /api/guild/me:", e)
   return res.status(500).json({ error: "Erreur serveur" })
  }
 })

 app.post("/api/guild/create", async (req, res) => {
  try {
   const session = requireSession(req, res)
   if (!session) return

   const name = String(req.body?.name || "").trim()
   const result = createGuild(session.userId, name)
   if (result?.error) return res.status(400).json({ error: String(result.error) })

   const actor = getUser(session.userId)
   const unlocked = actor ? achievementCheck(actor, "guild") : []
   if (actor) save(session.userId)

   invalidateGuildCaches([session.userId])
   const payload = await buildGuildStatePayload(session.userId)
   return res.json({
    ok: true,
    guild: payload?.guild || null,
    state: payload,
    unlockedAchievements: countUnlockedAchievements(unlocked)
   })
  } catch (e) {
   console.error("[WEB] /api/guild/create:", e)
   return res.status(500).json({ error: "Erreur serveur" })
  }
 })

 app.post("/api/guild/leave", async (req, res) => {
  try {
   const session = requireSession(req, res)
   if (!session) return

   const result = leaveGuild(session.userId)
   if (result?.error) return res.status(400).json({ error: String(result.error) })

   invalidateGuildCaches([session.userId])
   const payload = await buildGuildStatePayload(session.userId)
   return res.json({ ok: true, state: payload })
  } catch (e) {
   console.error("[WEB] /api/guild/leave:", e)
   return res.status(500).json({ error: "Erreur serveur" })
  }
 })

 app.post("/api/guild/apply", async (req, res) => {
  try {
   const session = requireSession(req, res)
   if (!session) return

   const guildId = asGuildId(req.body?.guildId)
   if (!guildId) return res.status(400).json({ error: "Guilde invalide." })

   const result = addGuildApplication(guildId, session.userId)
   if (result?.error) return res.status(400).json({ error: String(result.error) })

   const actor = getUser(session.userId)
   const unlocked = actor ? achievementCheck(actor, "guild") : []
   if (actor) save(session.userId)

   const payload = await buildGuildStatePayload(session.userId)
   return res.json({
    ok: true,
    state: payload,
    unlockedAchievements: countUnlockedAchievements(unlocked)
   })
  } catch (e) {
   console.error("[WEB] /api/guild/apply:", e)
   return res.status(500).json({ error: "Erreur serveur" })
  }
 })

 app.post("/api/guild/application/respond", async (req, res) => {
  try {
   const session = requireSession(req, res)
   if (!session) return

   const currentGuild = getUserGuild(session.userId)
   if (!currentGuild) return res.status(400).json({ error: "Tu n'es dans aucune guilde." })

   const guildId = asGuildId(req.body?.guildId || currentGuild.id)
   const applicantId = asGuildId(req.body?.applicantId)
   const action = String(req.body?.action || "").trim().toLowerCase()
   const accept = action === "accept" || action === "accepted" || action === "approve"
   if (!applicantId) return res.status(400).json({ error: "Candidature invalide." })

   const result = respondGuildApplication(guildId, session.userId, applicantId, accept)
   if (result?.error) return res.status(400).json({ error: String(result.error) })

   const reviewer = getUser(session.userId)
   const reviewerUnlocked = reviewer ? achievementCheck(reviewer, "guild") : []
   if (reviewer) save(session.userId)

   const applicant = getUser(applicantId)
   const applicantUnlocked = (accept && applicant) ? achievementCheck(applicant, "guild") : []
   if (accept && applicant) save(applicantId)

   invalidateGuildCaches([session.userId, applicantId])
   const payload = await buildGuildStatePayload(session.userId)
   return res.json({
    ok: true,
    action: result.action,
    state: payload,
    unlockedAchievements: countUnlockedAchievements(reviewerUnlocked),
    targetUnlockedAchievements: countUnlockedAchievements(applicantUnlocked)
   })
  } catch (e) {
   console.error("[WEB] /api/guild/application/respond:", e)
   return res.status(500).json({ error: "Erreur serveur" })
  }
 })

 app.post("/api/guild/manage/invite", async (req, res) => {
  try {
   const session = requireSession(req, res)
   if (!session) return
   if (!session.local) {
    return res.status(403).json({ error: "Invitation directe disponible uniquement en local." })
   }

   const guild = getUserGuild(session.userId)
   if (!guild) return res.status(400).json({ error: "Tu n'es dans aucune guilde." })
   const rank = getGuildRank(guild.id, session.userId)
   if (rank !== "meneur" && rank !== "officier") {
    return res.status(403).json({ error: "Seuls le meneur et les officiers peuvent inviter." })
   }

   const targetId = asGuildId(req.body?.targetId)
   if (!/^\d{16,22}$/.test(targetId)) {
    return res.status(400).json({ error: "ID Discord invalide." })
   }
   if (targetId === asGuildId(session.userId)) {
    return res.status(400).json({ error: "Tu es déjà dans cette guilde." })
   }

   const result = joinGuild(targetId, guild.id)
   if (result?.error) return res.status(400).json({ error: String(result.error) })
   const recruiter = getUser(String(session.userId))
   if (recruiter) {
    recordGuildRecruitment(recruiter)
    achievementCheck(recruiter, "guild")
    save(String(session.userId))
   }
   const invited = getUser(targetId)
   const invitedUnlocked = invited ? achievementCheck(invited, "guild") : []
   if (invited) save(targetId)

   removeGuildApplicationsForUser(targetId)
   invalidateGuildCaches([session.userId, targetId])
   const payload = await buildGuildStatePayload(session.userId)
   return res.json({
    ok: true,
    state: payload,
    targetUnlockedAchievements: countUnlockedAchievements(invitedUnlocked)
   })
  } catch (e) {
   console.error("[WEB] /api/guild/manage/invite:", e)
   return res.status(500).json({ error: "Erreur serveur" })
  }
 })

 app.post("/api/guild/manage/kick", async (req, res) => {
  try {
   const session = requireSession(req, res)
   if (!session) return
   const guild = getUserGuild(session.userId)
   if (!guild) return res.status(400).json({ error: "Tu n'es dans aucune guilde." })

   const targetId = asGuildId(req.body?.targetId)
   if (!targetId) return res.status(400).json({ error: "Membre invalide." })

   const result = kickMember(guild.id, session.userId, targetId)
   if (result?.error) return res.status(400).json({ error: String(result.error) })

   const actor = getUser(session.userId)
   const unlocked = actor ? achievementCheck(actor, "guild") : []
   if (actor) save(session.userId)

   invalidateGuildCaches([session.userId, targetId])
   const payload = await buildGuildStatePayload(session.userId)
   return res.json({
    ok: true,
    state: payload,
    unlockedAchievements: countUnlockedAchievements(unlocked)
   })
  } catch (e) {
   console.error("[WEB] /api/guild/manage/kick:", e)
   return res.status(500).json({ error: "Erreur serveur" })
  }
 })

 app.post("/api/guild/manage/promote", async (req, res) => {
  try {
   const session = requireSession(req, res)
   if (!session) return
   const guild = getUserGuild(session.userId)
   if (!guild) return res.status(400).json({ error: "Tu n'es dans aucune guilde." })
   const targetId = asGuildId(req.body?.targetId)
   if (!targetId) return res.status(400).json({ error: "Membre invalide." })

   const result = promoteOfficer(guild.id, session.userId, targetId)
   if (result?.error) return res.status(400).json({ error: String(result.error) })

   const target = getUser(targetId)
   const targetUnlocked = target ? achievementCheck(target, "guild") : []
   if (target) save(targetId)

   invalidateGuildCaches([session.userId, targetId])
   const payload = await buildGuildStatePayload(session.userId)
   return res.json({
    ok: true,
    state: payload,
    targetUnlockedAchievements: countUnlockedAchievements(targetUnlocked)
   })
  } catch (e) {
   console.error("[WEB] /api/guild/manage/promote:", e)
   return res.status(500).json({ error: "Erreur serveur" })
  }
 })

 app.post("/api/guild/manage/demote", async (req, res) => {
  try {
   const session = requireSession(req, res)
   if (!session) return
   const guild = getUserGuild(session.userId)
   if (!guild) return res.status(400).json({ error: "Tu n'es dans aucune guilde." })
   const targetId = asGuildId(req.body?.targetId)
   if (!targetId) return res.status(400).json({ error: "Membre invalide." })

   const result = demoteOfficer(guild.id, session.userId, targetId)
   if (result?.error) return res.status(400).json({ error: String(result.error) })

   invalidateGuildCaches([session.userId, targetId])
   const payload = await buildGuildStatePayload(session.userId)
   return res.json({ ok: true, state: payload })
  } catch (e) {
   console.error("[WEB] /api/guild/manage/demote:", e)
   return res.status(500).json({ error: "Erreur serveur" })
  }
 })

 app.post("/api/guild/manage/transfer", async (req, res) => {
  try {
   const session = requireSession(req, res)
   if (!session) return
   const guild = getUserGuild(session.userId)
   if (!guild) return res.status(400).json({ error: "Tu n'es dans aucune guilde." })
   const targetId = asGuildId(req.body?.targetId)
   if (!targetId) return res.status(400).json({ error: "Membre invalide." })

   const result = transferLeader(guild.id, session.userId, targetId)
   if (result?.error) return res.status(400).json({ error: String(result.error) })

   const actor = getUser(session.userId)
   const unlocked = actor ? achievementCheck(actor, "guild") : []
   if (actor) save(session.userId)

   invalidateGuildCaches([session.userId, targetId])
   const payload = await buildGuildStatePayload(session.userId)
   return res.json({
    ok: true,
    state: payload,
    unlockedAchievements: countUnlockedAchievements(unlocked)
   })
  } catch (e) {
   console.error("[WEB] /api/guild/manage/transfer:", e)
   return res.status(500).json({ error: "Erreur serveur" })
  }
 })

 app.post("/api/guild/manage/rename", async (req, res) => {
  try {
   const session = requireSession(req, res)
   if (!session) return
   const guild = getUserGuild(session.userId)
   if (!guild) return res.status(400).json({ error: "Tu n'es dans aucune guilde." })

   const name = String(req.body?.name || "").trim()
   const result = renameGuild(guild.id, session.userId, name)
   if (result?.error) return res.status(400).json({ error: String(result.error) })

   const actor = getUser(session.userId)
   const unlocked = actor ? achievementCheck(actor, "guild") : []
   if (actor) save(session.userId)

   invalidateGuildCaches([session.userId])
   const payload = await buildGuildStatePayload(session.userId)
   return res.json({
    ok: true,
    state: payload,
    unlockedAchievements: countUnlockedAchievements(unlocked)
   })
  } catch (e) {
   console.error("[WEB] /api/guild/manage/rename:", e)
   return res.status(500).json({ error: "Erreur serveur" })
  }
 })

 app.post("/api/guild/manage/disband", async (req, res) => {
  try {
   const session = requireSession(req, res)
   if (!session) return
   const guild = getUserGuild(session.userId)
   if (!guild) return res.status(400).json({ error: "Tu n'es dans aucune guilde." })

   const memberIds = Array.isArray(guild.memberIds) ? [...guild.memberIds] : [session.userId]
   const result = disbandGuild(guild.id, session.userId)
   if (result?.error) return res.status(400).json({ error: String(result.error) })

   invalidateGuildCaches(memberIds)
   const payload = await buildGuildStatePayload(session.userId)
   return res.json({ ok: true, state: payload })
  } catch (e) {
   console.error("[WEB] /api/guild/manage/disband:", e)
   return res.status(500).json({ error: "Erreur serveur" })
  }
 })

 app.post("/api/guild/dev/switch-role", async (req, res) => {
  try {
   const session = requireSession(req, res)
   if (!session) return
   if (!session.local) return res.status(403).json({ error: "Disponible uniquement en mode local." })

   const mode = String(req.body?.mode || "").trim().toLowerCase()
   if (!["leader", "meneur", "officer", "officier", "member", "membre", "none", "sans_guilde"].includes(mode)) {
    return res.status(400).json({ error: "Mode invalide." })
   }

   const switched = switchLocalGuildRole(session.userId, mode)
   if (switched?.error) return res.status(400).json({ error: String(switched.error) })

   invalidateGuildCaches([session.userId])
   const payload = await buildGuildStatePayload(session.userId)
   return res.json({ ok: true, mode: switched.mode, state: payload })
  } catch (e) {
   console.error("[WEB] /api/guild/dev/switch-role:", e)
   return res.status(500).json({ error: "Erreur serveur" })
  }
 })

 app.get("/api/guild/:id", async (req, res) => {
  try {
   const profile = await computeGuildProfile(req.params.id)
   if (!profile) return res.status(404).json({ error: "Guilde introuvable" })
   return res.json(profile)
  } catch (e) {
   console.error("[WEB] /api/guild/:id:", e)
   return res.status(500).json({ error: "Erreur serveur" })
  }
 })
}
