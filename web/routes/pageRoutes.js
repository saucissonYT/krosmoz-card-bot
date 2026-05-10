/* Routes: HTML page routes */

const path = require("path")

module.exports = function mount(app, ctx) {
 const { requireSessionPage, canUseLocalAuth, PUBLIC_DIR } = ctx

 app.get("/", (req, res) => res.sendFile(path.join(PUBLIC_DIR, "index.html")))
 app.get("/leaderboard", (req, res) => res.redirect("/pages/classement.html"))
 app.get("/profile/:id", (req, res) => res.sendFile(path.join(PUBLIC_DIR, "Profile.html")))
 app.get("/profile", (req, res) => res.sendFile(path.join(PUBLIC_DIR, "Profile.html")))
 app.get("/cards", (req, res) => res.redirect("/sets"))
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
 app.get("/inventaire", (req, res) => {
  const session = requireSessionPage(req, res)
  if (!session) {
   if (!res.headersSent && canUseLocalAuth(req)) {
    return res.sendFile(path.join(PUBLIC_DIR, "Play.html"))
   }
   return
  }
  return res.sendFile(path.join(PUBLIC_DIR, "Play.html"))
 })
 app.get("/inventory", (req, res) => {
  const query = String(req.url || "").includes("?") ? String(req.url || "").slice(String(req.url || "").indexOf("?")) : ""
  return res.redirect(301, `/inventaire${query}`)
 })
 app.get("/play/:tab", (req, res) => {
  const tab = String(req.params.tab || "").toLowerCase()
  if (tab === "inventory" || tab === "inventaire") {
   const query = String(req.url || "").includes("?") ? String(req.url || "").slice(String(req.url || "").indexOf("?")) : ""
   return res.redirect(302, `/inventaire${query}`)
  }
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
   const query = String(req.url || "").includes("?") ? String(req.url || "").slice(String(req.url || "").indexOf("?")) : ""
   return res.redirect(301, `/quetes${query}`)
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
 app.get("/shop", (req, res) => res.sendFile(path.join(PUBLIC_DIR, "Krosmoshop.html")))
 app.get("/krosmoshop", (req, res) => res.sendFile(path.join(PUBLIC_DIR, "Krosmoshop.html")))
 app.get("/packs", (req, res) => res.sendFile(path.join(PUBLIC_DIR, "Packs.html")))
 app.get("/packs-test", (req, res) => res.sendFile(path.join(PUBLIC_DIR, "Packs.html")))
 app.get("/quetes", (req, res) => {
  const session = requireSessionPage(req, res)
  if (!session) {
   if (!res.headersSent && canUseLocalAuth(req)) {
    return res.sendFile(path.join(PUBLIC_DIR, "Quetes.html"))
   }
   return
  }
  return res.sendFile(path.join(PUBLIC_DIR, "Quetes.html"))
 })
 app.get("/quests", (req, res) => res.status(404).send("Route supprimée. Utilise /quetes."))
 app.get("/market", (req, res) => res.status(404).send("Route supprim?e. Utilise /shop."))
 app.get("/events", (req, res) => res.sendFile(path.join(PUBLIC_DIR, "Events.html")))
 app.get("/battlepass", (req, res) => res.sendFile(path.join(PUBLIC_DIR, "Battlepass.html")))
 app.get("/guild", (req, res) => res.sendFile(path.join(PUBLIC_DIR, "Guild.html")))
 app.get("/guild/detail/:id", (req, res) => res.sendFile(path.join(PUBLIC_DIR, "GuildDetail.html")))
 app.get("/guild/:id", (req, res) => res.redirect(`/guild/detail/${encodeURIComponent(String(req.params.id || ""))}`))
 app.get("/achievements", (req, res) => res.sendFile(path.join(PUBLIC_DIR, "Achievements.html")))
 app.get("/tutorial", (req, res) => res.redirect("/pages/tutoriel.html"))
 app.get("/about", (req, res) => res.redirect("/pages/a-propos.html"))

 /* Fallback: routes inconnues → page d'accueil (SPA-like) */
 app.use((req, res) => {
  if (req.path.startsWith("/api/")) return res.status(404).json({ error: "Route introuvable" })
  return res.sendFile(path.join(PUBLIC_DIR, "index.html"))
 })
}
