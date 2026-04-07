(async function initGlobalAuthButton() {
 const btn = document.getElementById("globalAuthBtn")
 if (!btn) return
 const right = btn.parentElement
 const navLinks = document.getElementById("navLinks")
 const navbar = document.querySelector(".navbar")
 const heroPlayBtn = document.getElementById("heroPlayBtn")

 function setAuthBodyClass(connected) {
  if (!document || !document.body) return
  document.body.classList.toggle("auth-connected", Boolean(connected))
 }

 function setPlaySubnav(connected) {
  if (!navbar) return
  let subnav = navbar.querySelector("#globalPlaySubnav")

  if (!connected) {
    if (subnav) subnav.remove()
    return
  }

  if (!subnav) {
   subnav = document.createElement("div")
   subnav.id = "globalPlaySubnav"
   subnav.className = "navbar-subnav"
   subnav.innerHTML = `
   <div class="navbar-subnav-inner">
     <ul class="navbar-subnav-links">
      <li><a href="/play/inventory" data-play-mode="inventory">Inventaire</a></li>
      <li><a href="/play/packs" data-play-mode="packs">Packs</a></li>
      <li><a href="/play/fusion" data-play-mode="fusion">Fusion</a></li>
      <li><a href="/play/craft" data-play-mode="craft">Craft</a></li>
      <li><a href="/market">Marché</a></li>
      <li><a href="/achievements">Achievements</a></li>
      <li><a href="/profile/">Profil</a></li>
     </ul>
    </div>
   `
   navbar.appendChild(subnav)
  }

  const p = String(window.location.pathname || "")
  subnav.querySelectorAll("a").forEach((a) => {
   const href = String(a.getAttribute("href") || "")
   const isPlayMode = Boolean(a.dataset.playMode) && p.startsWith("/play/")
   const active = isPlayMode ? (href === p) : (href === p || (href !== "/" && p.startsWith(`${href}/`)))
   a.classList.toggle("active", active)
  })
 }

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

 function setTopMarketLinkVisibility(connected) {
  if (!navLinks) return
  const marketLink = navLinks.querySelector('a[href="/market"]')
  if (!marketLink || !marketLink.parentElement) return
  if (connected) {
   marketLink.parentElement.style.display = "none"
   marketLink.classList.remove("active")
   return
  }
  marketLink.parentElement.style.display = ""
  const p = String(window.location.pathname || "")
  marketLink.classList.toggle("active", p === "/market" || p.startsWith("/market/"))
 }

 let status = null
 try {
  const res = await fetch("/api/oauth/status", { credentials: "same-origin" })
  if (res.ok) status = await res.json()
 } catch (_) {}

 if (!status?.enabled) {
  setAuthBodyClass(false)
  setPlaySubnav(false)
  setAuthState("")
  setProfileLink(null)
  setConnectedNavLink(false)
  setTopMarketLinkVisibility(false)
  if (heroPlayBtn) {
   heroPlayBtn.textContent = "JOUER"
   heroPlayBtn.href = "#"
   heroPlayBtn.setAttribute("aria-disabled", "true")
   heroPlayBtn.style.pointerEvents = "none"
   heroPlayBtn.style.opacity = "0.6"
  }
  btn.textContent = "Connexion indisponible"
  btn.setAttribute("aria-disabled", "true")
  btn.style.pointerEvents = "none"
  btn.style.opacity = "0.6"
  return
 }

 if (!status.connected) {
  setAuthBodyClass(false)
  setPlaySubnav(false)
  setAuthState("")
  setProfileLink(null)
  setConnectedNavLink(false)
  setTopMarketLinkVisibility(false)
  if (heroPlayBtn) {
   heroPlayBtn.textContent = "JOUER"
   heroPlayBtn.href = "/auth/discord?returnTo=%2Fplay"
   heroPlayBtn.removeAttribute("aria-disabled")
   heroPlayBtn.style.pointerEvents = ""
   heroPlayBtn.style.opacity = ""
  }
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

 setAuthBodyClass(true)
 setPlaySubnav(true)
 setAuthState("")
 setProfileLink(me?.id || status.userId)
 setConnectedNavLink(true)
 setTopMarketLinkVisibility(true)
 if (heroPlayBtn) {
  heroPlayBtn.textContent = "JOUER"
  heroPlayBtn.href = "/play"
  heroPlayBtn.removeAttribute("aria-disabled")
  heroPlayBtn.style.pointerEvents = ""
  heroPlayBtn.style.opacity = ""
 }

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
