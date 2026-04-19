/* Routes: HTML page routes */

const path = require("path")

module.exports = function mount(app, ctx) {
 const { requireSessionPage, canUseLocalAuth, PUBLIC_DIR } = ctx

 app.get("/", (req, res) => res.sendFile(path.join(PUBLIC_DIR, "Index.html")))
 app.get("/leaderboard", (req, res) => res.sendFile(path.join(PUBLIC_DIR, "Leaderboard.html")))
 app.get("/profile/:id", (req, res) => res.sendFile(path.join(PUBLIC_DIR, "Profile.html")))
 app.get("/profile", (req, res) => res.sendFile(path.join(PUBLIC_DIR, "Profile.html")))
 app.get("/cards", (req, res) => res.sendFile(path.join(PUBLIC_DIR, "Cards.html")))
 app.get("/fusion", (req, res) => {
  if (!canUseLocalAuth(req)) return res.redirect("/play/fusion")
  const session = requireSessionPage(req, res)
  if (!session) {
   if (!res.headersSent) return res.sendFile(path.join(PUBLIC_DIR, "Play.html"))
   return
  }
  return res.sendFile(path.join(PUBLIC_DIR, "Play.html"))
 })
 app.get("/play", (req, res) => {
  const session = requireSessionPage(req, res)
  if (!session) {
   if (!res.headersSent && canUseLocalAuth(req)) {
    return res.sendFile(path.join(PUBLIC_DIR, "Play.html"))
   }
   return
  }
  return res.sendFile(path.join(PUBLIC_DIR, "Play.html"))
 })
 app.get("/play/:tab", (req, res) => {
  const tab = String(req.params.tab || "").toLowerCase()
  if (tab === "packs") {
   const session = requireSessionPage(req, res)
   if (!session) {
    if (!res.headersSent && canUseLocalAuth(req)) {
     return res.sendFile(path.join(PUBLIC_DIR, "Packs.html"))
    }
    return
   }
   return res.sendFile(path.join(PUBLIC_DIR, "Packs.html"))
  }
  if (tab === "quests" || tab === "missions") {
   return res.sendFile(path.join(PUBLIC_DIR, "Play.html"))
  }
  const session = requireSessionPage(req, res)
  if (!session) {
   if (!res.headersSent && canUseLocalAuth(req)) {
    return res.sendFile(path.join(PUBLIC_DIR, "Play.html"))
   }
   return
  }
  return res.sendFile(path.join(PUBLIC_DIR, "Play.html"))
 })
 app.get("/krosmoshop", (req, res) => res.sendFile(path.join(PUBLIC_DIR, "Krosmoshop.html")))
 app.get("/packs", (req, res) => res.sendFile(path.join(PUBLIC_DIR, "Packs.html")))
 app.get("/packs-test", (req, res) => res.sendFile(path.join(PUBLIC_DIR, "Packs.html")))
 app.get("/market", (req, res) => res.sendFile(path.join(PUBLIC_DIR, "Market.html")))
 app.get("/events", (req, res) => res.sendFile(path.join(PUBLIC_DIR, "Events.html")))
 app.get("/battlepass", (req, res) => res.sendFile(path.join(PUBLIC_DIR, "Battlepass.html")))
 app.get("/guild", (req, res) => res.sendFile(path.join(PUBLIC_DIR, "Guild.html")))
 app.get("/guild/detail/:id", (req, res) => res.sendFile(path.join(PUBLIC_DIR, "GuildDetail.html")))
 app.get("/guild/:id", (req, res) => res.redirect(`/guild/detail/${encodeURIComponent(String(req.params.id || ""))}`))
 app.get("/achievements", (req, res) => res.sendFile(path.join(PUBLIC_DIR, "Achievements.html")))
 app.get("/tutorial", (req, res) => res.sendFile(path.join(PUBLIC_DIR, "Tutorial.html")))
 app.get("/about", (req, res) => res.sendFile(path.join(PUBLIC_DIR, "About.html")))

 /* Fallback: routes inconnues → page d'accueil (SPA-like) */
 app.use((req, res) => {
  if (req.path.startsWith("/api/")) return res.status(404).json({ error: "Route introuvable" })
  return res.sendFile(path.join(PUBLIC_DIR, "Index.html"))
 })
}
