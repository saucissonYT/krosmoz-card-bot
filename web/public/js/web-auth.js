(async function initGlobalAuthButton() {
 const btn = document.getElementById("globalAuthBtn")
 if (!btn) return
 const right = btn.parentElement

 function setAuthState(text) {
  if (!right) return
  let stateEl = right.querySelector("#globalAuthState")
  if (!stateEl) {
   stateEl = document.createElement("span")
   stateEl.id = "globalAuthState"
   stateEl.className = "auth-state-top"
   right.insertBefore(stateEl, btn)
  }
  stateEl.textContent = text || ""
 }

 function setProfileLink(userId) {
  if (!right) return
  let profileEl = right.querySelector("#globalProfileBtn")

  if (!userId) {
    if (profileEl) profileEl.remove()
    return
  }

  if (!profileEl) {
   profileEl = document.createElement("a")
   profileEl.id = "globalProfileBtn"
   profileEl.className = "btn btn-outline btn-auth-top"
   profileEl.textContent = "Profil"
   right.insertBefore(profileEl, btn)
  }

  profileEl.href = `/profile/${encodeURIComponent(String(userId))}`
 }

 let status = null
 try {
  const res = await fetch("/api/oauth/status", { credentials: "same-origin" })
  if (res.ok) status = await res.json()
 } catch (_) {}

 if (!status?.enabled) {
  setAuthState("")
  setProfileLink(null)
  btn.textContent = "Connexion indisponible"
  btn.setAttribute("aria-disabled", "true")
  btn.style.pointerEvents = "none"
  btn.style.opacity = "0.6"
  return
 }

 if (!status.connected) {
  setAuthState("")
  setProfileLink(null)
  btn.textContent = "Connexion Discord"
  const returnTo = `${window.location.pathname || "/"}${window.location.search || ""}`
  btn.href = `/auth/discord?returnTo=${encodeURIComponent(returnTo)}`
  return
 }

 let me = null
 try {
  const meRes = await fetch("/api/me", { credentials: "same-origin" })
  if (meRes.ok) me = await meRes.json()
 } catch (_) {}
 const name = me?.discord?.displayName || me?.discord?.username || status.userId || "inconnu"
 setAuthState(`Connecté en tant que ${name}`)
 setProfileLink(me?.id || status.userId)

 btn.textContent = "Deconnexion"
 btn.href = "#"
 btn.addEventListener("click", async (event) => {
  event.preventDefault()
  try {
   await fetch("/auth/logout", {
    method: "POST",
    credentials: "same-origin"
   })
  } catch (_) {}
  window.location.reload()
 })
})()
