/* Routes: /auth/* */

const crypto = require("crypto")
const { getUser, save } = require("../../systems/userSystem")
const { recordWebLogin } = require("../../systems/achievementProgressTracker")

module.exports = function mount(app, ctx) {
 const {
  canUseLocalAuth, hasLocalAuthSignal, hasLocalAuthDisableSignal,
  oauthConfigured, parseCookies, sanitizeReturnPath,
  cookieStateOptions, isHttpsRequest, cookieSessionOptions,
  createWebSession, clearSession,
  WEB_LOCAL_AUTH_COOKIE, WEB_LOCAL_AUTH_USER_ID,
  OAUTH_CLIENT_ID, OAUTH_REDIRECT_URI, OAUTH_SCOPE,
  OAUTH_CLIENT_SECRET
 } = ctx

 app.get("/auth/discord", (req, res) => {
  const localAvailable = canUseLocalAuth(req)
  const localDisabled = hasLocalAuthDisableSignal(req)
  const localFallback = localAvailable && !localDisabled && (hasLocalAuthSignal(req) || !oauthConfigured())
  if (localFallback) {
   const returnTo = sanitizeReturnPath(req.query.returnTo) || "/"
   const localUser = getUser(String(WEB_LOCAL_AUTH_USER_ID))
   if (localUser) {
    recordWebLogin(localUser, Date.now())
    save(String(WEB_LOCAL_AUTH_USER_ID))
   }
   res.setHeader("Set-Cookie", `${WEB_LOCAL_AUTH_COOKIE}=1; Path=/; Max-Age=31536000; SameSite=Lax${isHttpsRequest(req) ? "; Secure" : ""}`)
   return res.redirect(returnTo)
  }

  if (!oauthConfigured()) {
   return res.status(503).send("OAuth Discord non configure (DISCORD_WEB_CLIENT_ID/SECRET/REDIRECT_URI).")
  }

  const state = crypto.randomBytes(24).toString("hex")
  const returnTo = sanitizeReturnPath(req.query.returnTo) || "/"
  res.setHeader("Set-Cookie", [
   `kc_oauth_state=${encodeURIComponent(state)}; ${cookieStateOptions()}${isHttpsRequest(req) ? "; Secure" : ""}`,
   `kc_oauth_return=${encodeURIComponent(returnTo)}; ${cookieStateOptions()}${isHttpsRequest(req) ? "; Secure" : ""}`
  ])

  const params = new URLSearchParams({
   client_id: OAUTH_CLIENT_ID,
   redirect_uri: OAUTH_REDIRECT_URI,
   response_type: "code",
   scope: OAUTH_SCOPE,
   state,
   prompt: "consent"
  })

  return res.redirect(`https://discord.com/oauth2/authorize?${params.toString()}`)
 })

 app.get("/auth/discord/callback", async (req, res) => {
  try {
   if (!oauthConfigured()) return res.status(503).send("OAuth Discord non configure.")
   if (req.query.error) return res.status(400).send(`Discord OAuth error: ${req.query.error}`)

   const cookies = parseCookies(req)
   const expectedState = cookies.kc_oauth_state
   const returnTo = sanitizeReturnPath(cookies.kc_oauth_return) || "/"
   const state = String(req.query.state || "")
   const code = String(req.query.code || "")

   if (!state || !expectedState || state !== expectedState) {
    return res.status(400).send("State OAuth invalide ou expire.")
   }
   if (!code) return res.status(400).send("Code OAuth manquant.")

   const tokenBody = new URLSearchParams({
    client_id: OAUTH_CLIENT_ID,
    client_secret: OAUTH_CLIENT_SECRET,
    grant_type: "authorization_code",
    code,
    redirect_uri: OAUTH_REDIRECT_URI
   })

   const tokenRes = await fetch("https://discord.com/api/v10/oauth2/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: tokenBody
   })

   if (!tokenRes.ok) {
    const txt = await tokenRes.text()
    return res.status(400).send(`Echec echange token Discord: ${txt}`)
   }

   const token = await tokenRes.json()
   const meRes = await fetch("https://discord.com/api/v10/users/@me", {
    headers: { Authorization: `Bearer ${token.access_token}` }
   })

   if (!meRes.ok) {
    const txt = await meRes.text()
    return res.status(400).send(`Echec recup user Discord: ${txt}`)
   }

   const me = await meRes.json()
   const sessionToken = createWebSession(me.id)
   res.setHeader("Set-Cookie", [
    `kc_oauth_state=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax${isHttpsRequest(req) ? "; Secure" : ""}`,
    `kc_oauth_return=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax${isHttpsRequest(req) ? "; Secure" : ""}`,
    `kc_session=${encodeURIComponent(sessionToken)}; ${cookieSessionOptions(req)}`
   ])
   return res.redirect(returnTo)
  } catch (e) {
   console.error("[WEB] /auth/discord/callback:", e)
   return res.status(500).send("Erreur OAuth.")
  }
 })

 app.get("/auth/logout-page", (req, res) => {
  const returnTo = sanitizeReturnPath(req.query.returnTo) || "/"
  clearSession(req, res)
  return res.redirect(returnTo)
 })

 app.get("/auth/switch", (req, res) => {
  const returnTo = sanitizeReturnPath(req.query.returnTo) || "/"
  clearSession(req, res)
  return res.redirect(`/auth/discord?returnTo=${encodeURIComponent(returnTo)}`)
 })

 app.post("/auth/logout", (req, res) => {
  clearSession(req, res)
  return res.json({ ok: true })
 })
}
