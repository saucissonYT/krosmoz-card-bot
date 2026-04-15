/* Routes: /api/stats, /api/activity, /api/leaderboard */

module.exports = function mount(app, ctx) {
 const {
  apiCache, computeGlobalStats, computeActivityFeed,
  computeLeaderboard, resolveDiscordUser, normalizeText,
  MAX_MEMBERS
 } = ctx

 app.get("/api/stats", (req, res) => {
  try {
   const stats = apiCache.getOrCompute("global:stats", () => computeGlobalStats(), 60000)
   res.json(stats)
  } catch (e) {
   console.error("[WEB] /api/stats:", e)
   res.status(500).json({ error: "Erreur serveur" })
  }
 })

 app.get("/api/activity", async (req, res) => {
  try {
   const limit = Number(req.query.limit || 10)
   const items = await computeActivityFeed(limit)
   res.json({ items })
  } catch (e) {
   console.error("[WEB] /api/activity:", e)
   res.status(500).json({ error: "Erreur serveur" })
  }
 })

 app.get("/api/leaderboard/:category", async (req, res) => {
  try {
   const category = req.params.category
   const valid = ["cards", "unique", "kamas", "level", "achievements", "ssr", "packs", "guilds"]
   if (!valid.includes(category)) return res.status(400).json({ error: "Categorie invalide" })
   const blockedLeaderboardNames = new Set(["krosmoz-card", "nouveau"])

   const entries = apiCache.getOrCompute(
    `leaderboard:${category}`,
    () => computeLeaderboard(category),
    60000
   )

   if (category === "guilds") {
    const rows = (entries || [])
     .slice(0, 50)
     .map((entry, index) => ({
      rank: index + 1,
      guildId: String(entry.guildId || entry.id || ""),
      name: String(entry.name || "Guilde"),
      emoji: String(entry.emoji || "🛡️"),
      level: Number(entry.level || entry.value || 1),
      members: Number(entry.members || 0),
      maxMembers: Number(entry.maxMembers || MAX_MEMBERS),
      value: Number(entry.value || entry.level || 1)
     }))
    return res.json(rows)
   }

   const resolved = await Promise.all(
    entries.map(async (entry) => {
     const discord = await resolveDiscordUser(entry.userId)
     return { ...entry, discord }
    })
   )

   const filtered = resolved
    .filter((entry) => {
     const displayName = normalizeText(entry.discord?.displayName)
     const username = normalizeText(entry.discord?.username)
     const title = normalizeText(entry.title)
     return (
      !blockedLeaderboardNames.has(displayName) &&
      !blockedLeaderboardNames.has(username) &&
      !blockedLeaderboardNames.has(title)
     )
    })
    .slice(0, 50)
    .map((entry, index) => ({ ...entry, rank: index + 1 }))

   res.json(filtered)
  } catch (e) {
   console.error("[WEB] /api/leaderboard:", e)
   res.status(500).json({ error: "Erreur serveur" })
  }
 })
}
