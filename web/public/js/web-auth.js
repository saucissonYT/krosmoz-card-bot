(async function initGlobalAuthButton() {
 const btn = document.getElementById("globalAuthBtn")
 if (!btn) return
 const right = btn.parentElement
 const navLinks = document.getElementById("navLinks")

 function setAuthState(text) {
  if (!right) return
  let stateEl = right.querySelector("#globalAuthState")
  if (!text) {
   if (stateEl) stateEl.remove()
   return
  }
  if (!stateEl) {
   stateEl = document.createElement("span")
   stateEl.id = "globalAuthState"
   stateEl.className = "auth-state-top"
   right.insertBefore(stateEl, btn)
  }
  stateEl.textContent = text
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

 function setConnectedNavLink(connected) {
  if (!navLinks) return
  const existingPlayLink = navLinks.querySelector('a[href="/play"]')
  if (existingPlayLink && existingPlayLink.parentElement && existingPlayLink.parentElement.id !== "globalPlayNavItem") {
   if (!connected) {
    existingPlayLink.parentElement.style.display = "none"
    existingPlayLink.classList.remove("active")
    return
   }
   existingPlayLink.parentElement.style.display = ""
   const p = String(window.location.pathname || "")
   existingPlayLink.classList.toggle("active", p === "/play" || p.startsWith("/play/"))
   return
  }

  let playLi = navLinks.querySelector("#globalPlayNavItem")
  if (!connected) {
   if (playLi) playLi.remove()
   return
  }

  if (!playLi) {
   playLi = document.createElement("li")
   playLi.id = "globalPlayNavItem"
   const a = document.createElement("a")
   a.href = "/play"
   a.textContent = "Mon Jeu"
   playLi.appendChild(a)
   navLinks.appendChild(playLi)
  }

  const link = playLi.querySelector("a")
  if (!link) return
  const p = String(window.location.pathname || "")
  link.classList.toggle("active", p === "/play" || p.startsWith("/play/"))
 }

 let status = null
 try {
  const res = await fetch("/api/oauth/status", { credentials: "same-origin" })
  if (res.ok) status = await res.json()
 } catch (_) {}

 if (!status?.enabled) {
  setAuthState("")
  setProfileLink(null)
  setConnectedNavLink(false)
  btn.textContent = "Connexion indisponible"
  btn.setAttribute("aria-disabled", "true")
  btn.style.pointerEvents = "none"
  btn.style.opacity = "0.6"
  return
 }

 if (!status.connected) {
  setAuthState("")
  setProfileLink(null)
  setConnectedNavLink(false)
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

 setAuthState("")
 setProfileLink(me?.id || status.userId)
 setConnectedNavLink(true)

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
