(async function initGlobalAuthButton() {
 const btn = document.getElementById("globalAuthBtn")
 const right = btn ? btn.parentElement : null
 const navLinks = document.getElementById("navLinks")
 const navbar = document.querySelector(".navbar")
 const heroPlayBtn = document.getElementById("heroPlayBtn")
 const EVENT_TOAST_DISMISS_STORAGE_KEY = "kc_event_toast_dismiss_until"
 let eventToastDismissedUntil = (() => {
  try {
   const raw = Number(window.sessionStorage?.getItem(EVENT_TOAST_DISMISS_STORAGE_KEY) || 0)
   return Number.isFinite(raw) && raw > 0 ? raw : 0
  } catch (_) {
   return 0
  }
 })()
 const QUEST_TOAST_POLL_MS = 9000
 const ACHIEVEMENT_TOAST_POLL_MS = 9000
 const EVENT_REWARD_TOAST_POLL_MS = 6000
 const PLAYER_PROGRESS_POLL_MS = 8000
 const MAX_GLOBAL_PROGRESS_TOASTS = 5
 const PLAYER_MAX_LEVEL = 200
 let questToastPollHandle = null
 let questToastBusy = false
 let questProgressSnapshot = null
 let achievementToastPollHandle = null
 let achievementToastBusy = false
 let achievementUnlockedSnapshot = null
 let eventRewardToastPollHandle = null
 let eventRewardToastBusy = false
 let playerProgressPollHandle = null
 let progressToastQueue = []
 let progressToastVisibleCount = 0
 let progressRefreshTimer = null
 let playerProgressSnapshot = null
 let playerProgressBusy = false
 let levelUpAnimationQueue = []
 let levelUpAnimationActive = false
 let levelUpAnimationAutoCloseTimer = null
 let levelUpAnimationsPaused = false
 const LOCAL_MODE_STORAGE_KEY = "kc_local_mode"
 const LOCAL_MODE_COOKIE_NAME = "kc_local_auth"
 const BAN_OVERLAY_ID = "kcBanOverlay"
 const BAN_IMAGE_FALLBACK = "/assets/ui/ban%20krosmoz.png"
 const MAINTENANCE_OVERLAY_ID = "kcMaintenanceOverlay"
 const MAINTENANCE_IMAGE_FALLBACK = "/assets/ui/site-construction.svg"
 const GATE_ACTION_ATTR = "data-kc-gate-action"
 let banOverlayActive = false
 let maintenanceOverlayActive = false
 const DAILY_BUTTON_REFRESH_MS = 60000
 const DAILY_BUTTON_TICK_MS = 1000
 let dailyButtonRefreshHandle = null
 let dailyButtonTickHandle = null
 let dailyStateRefreshBusy = false
 let dailyButtonBusy = false
 let dailyState = {
  canClaim: false,
  nextClaimAt: 0,
  remainingMs: 0,
  streak: 0,
  lastDaily: 0
 }
 const CARD_PREVIEW_SELECTOR = "img[data-card-preview='1']"
 let cardPreviewImages = []
 let cardPreviewIndex = -1

 function dismissEventToastFor(ms = 15 * 60 * 1000) {
  const duration = Math.max(1000, Number(ms || 0))
  eventToastDismissedUntil = Date.now() + duration
  try {
   window.sessionStorage?.setItem(EVENT_TOAST_DISMISS_STORAGE_KEY, String(eventToastDismissedUntil))
  } catch (_) {}
  const eventToast = document.getElementById("globalEventToast")
  if (eventToast) eventToast.hidden = true
 }

 function buildGateConnectHref() {
  const returnTo = `${window.location.pathname || "/"}${window.location.search || ""}`
  const authPath = `/auth/discord?returnTo=${encodeURIComponent(returnTo || "/")}`
  return `/auth/logout-page?returnTo=${encodeURIComponent(authPath)}`
 }

 async function performGateLogout(button) {
  const btnEl = button instanceof HTMLButtonElement ? button : null
  if (btnEl?.disabled) return
  const initialText = btnEl ? btnEl.textContent : ""
  if (btnEl) {
   btnEl.disabled = true
   btnEl.textContent = "Déconnexion..."
  }
  window.location.href = "/auth/logout-page"
  if (btnEl) {
   window.setTimeout(() => {
    btnEl.disabled = false
    btnEl.textContent = initialText
   }, 1200)
  }
 }

 function styleGateActionButton(button, tone = "primary") {
  const isSecondary = tone === "secondary"
  button.style.display = "block"
  button.style.appearance = "none"
  button.style.minHeight = "84px"
  button.style.border = isSecondary ? "2px solid rgba(255,214,214,.4)" : "2px solid rgba(255,255,255,.42)"
  button.style.borderRadius = "22px"
  button.style.padding = "22px 28px"
  button.style.font = "900 28px/1 Arial,sans-serif"
  button.style.letterSpacing = ".03em"
  button.style.color = "#fff9ea"
  button.style.background = isSecondary
   ? "linear-gradient(180deg, rgba(152,41,41,.99) 0%, rgba(101,16,16,.99) 100%)"
   : "linear-gradient(180deg, rgba(110,54,21,.98) 0%, rgba(66,28,10,.98) 100%)"
  button.style.backdropFilter = "blur(6px)"
  button.style.boxShadow = "0 18px 40px rgba(0,0,0,.38)"
  button.style.cursor = "pointer"
  button.style.textAlign = "center"
  button.style.transition = "transform .14s ease, opacity .14s ease, background .14s ease"
  button.addEventListener("mouseenter", () => {
   if (button.disabled) return
   button.style.transform = "translateY(-2px)"
   button.style.background = isSecondary
    ? "linear-gradient(180deg, rgba(182,56,56,.99) 0%, rgba(121,20,20,.99) 100%)"
    : "linear-gradient(180deg, rgba(138,72,30,.99) 0%, rgba(78,34,12,.99) 100%)"
  })
  button.addEventListener("mouseleave", () => {
   button.style.transform = "translateY(0)"
   button.style.background = isSecondary
    ? "linear-gradient(180deg, rgba(152,41,41,.99) 0%, rgba(101,16,16,.99) 100%)"
    : "linear-gradient(180deg, rgba(110,54,21,.98) 0%, rgba(66,28,10,.98) 100%)"
  })
 }

 function buildGateActionPanel() {
  const panel = document.createElement("div")
  panel.style.position = "fixed"
  panel.style.left = "50%"
  panel.style.bottom = "max(24px, calc(env(safe-area-inset-bottom, 0px) + 12px))"
  panel.style.transform = "translateX(-50%)"
  panel.style.zIndex = "1000001"
  panel.style.pointerEvents = "auto"
  panel.style.display = "flex"
  panel.style.flexDirection = "column"
  panel.style.alignItems = "stretch"
  panel.style.gap = "16px"
  panel.style.width = "min(560px, calc(100vw - 24px))"
  panel.style.padding = "22px"
  panel.style.borderRadius = "28px"
  panel.style.background = "rgba(14,10,8,.9)"
  panel.style.border = "2px solid rgba(255,255,255,.28)"
  panel.style.boxShadow = "0 24px 64px rgba(0,0,0,.5)"
  panel.style.backdropFilter = "blur(10px)"

  const connectBtn = document.createElement("button")
  connectBtn.type = "button"
  connectBtn.textContent = "Se connecter"
  connectBtn.setAttribute(GATE_ACTION_ATTR, "connect")
  styleGateActionButton(connectBtn, "primary")
  connectBtn.addEventListener("click", () => { window.location.href = buildGateConnectHref() })

  const logoutBtn = document.createElement("button")
  logoutBtn.type = "button"
  logoutBtn.textContent = "Se déconnecter"
  logoutBtn.setAttribute(GATE_ACTION_ATTR, "logout")
  styleGateActionButton(logoutBtn, "secondary")
  logoutBtn.addEventListener("click", () => { performGateLogout(logoutBtn) })

  panel.appendChild(connectBtn)
  panel.appendChild(logoutBtn)
  return panel
 }

 function isGateActionEvent(event) {
  const target = event?.target
  return Boolean(target && typeof target.closest === "function" && target.closest(`[${GATE_ACTION_ATTR}]`))
 }

 function activateBanOverlay(options = {}) {
  if (banOverlayActive || maintenanceOverlayActive) return
  banOverlayActive = true

  stopQuestToastPolling()
  stopAchievementToastPolling()
  stopEventRewardToastPolling()
  stopPlayerProgressPolling()
  setDailyButton(null)
  setPlaySubnav(false)
  setConnectedNavLink(false)
  setTopMarketLinkVisibility(false)
  setTopEventsLinkVisibility()
  setAuthState("Compte banni")

  if (btn) {
   btn.textContent = "Compte banni"
   btn.href = "#"
   btn.setAttribute("aria-disabled", "true")
   btn.style.pointerEvents = "none"
   btn.style.opacity = "0.6"
  }
  if (heroPlayBtn) {
   heroPlayBtn.textContent = "COMPTE BANNI"
   heroPlayBtn.href = "#"
   heroPlayBtn.setAttribute("aria-disabled", "true")
   heroPlayBtn.style.pointerEvents = "none"
   heroPlayBtn.style.opacity = "0.6"
  }

  const imagePath = String(options?.image || BAN_IMAGE_FALLBACK).trim() || BAN_IMAGE_FALLBACK
  const overlay = document.createElement("div")
  overlay.id = BAN_OVERLAY_ID
  overlay.style.position = "fixed"
  overlay.style.inset = "0"
  overlay.style.zIndex = "999999"
  overlay.style.background = "#000"
  overlay.style.pointerEvents = "auto"
  overlay.style.touchAction = "none"
  overlay.style.display = "grid"
  overlay.style.placeItems = "center"
  overlay.style.userSelect = "none"
  overlay.style.cursor = "not-allowed"
  overlay.innerHTML = `<img src=\"${imagePath}\" alt=\"Ban Krosmoz\" draggable=\"false\" style=\"width:100vw;height:100vh;object-fit:cover;pointer-events:none;-webkit-user-drag:none;\">`
  overlay.appendChild(buildGateActionPanel())

  document.documentElement.style.overflow = "hidden"
  document.body.style.overflow = "hidden"
  document.body.appendChild(overlay)

  const blockEvent = (event) => {
   if (isGateActionEvent(event)) return
   event.preventDefault()
   event.stopPropagation()
   if (typeof event.stopImmediatePropagation === "function") {
    event.stopImmediatePropagation()
   }
  }

  ;[
   "click",
   "dblclick",
   "mousedown",
   "mouseup",
   "pointerdown",
   "pointerup",
   "touchstart",
   "touchmove",
   "keydown",
   "keypress",
   "keyup",
   "submit",
   "contextmenu"
  ].forEach((eventName) => {
   window.addEventListener(eventName, blockEvent, true)
  })
 }

 function activateMaintenanceOverlay(options = {}) {
  if (maintenanceOverlayActive || banOverlayActive) return
  maintenanceOverlayActive = true

  stopQuestToastPolling()
  stopAchievementToastPolling()
  stopEventRewardToastPolling()
  stopPlayerProgressPolling()
  setDailyButton(null)
  setPlaySubnav(false)
  setConnectedNavLink(false)
  setTopMarketLinkVisibility(false)
  setTopEventsLinkVisibility()
  setAuthState("Site en construction")

  if (btn) {
   btn.textContent = "Maintenance"
   btn.href = "#"
   btn.setAttribute("aria-disabled", "true")
   btn.style.pointerEvents = "none"
   btn.style.opacity = "0.6"
  }
  if (heroPlayBtn) {
   heroPlayBtn.textContent = "MAINTENANCE"
   heroPlayBtn.href = "#"
   heroPlayBtn.setAttribute("aria-disabled", "true")
   heroPlayBtn.style.pointerEvents = "none"
   heroPlayBtn.style.opacity = "0.6"
  }

  const imagePath = String(options?.image || MAINTENANCE_IMAGE_FALLBACK).trim() || MAINTENANCE_IMAGE_FALLBACK
  const overlay = document.createElement("div")
  overlay.id = MAINTENANCE_OVERLAY_ID
  overlay.style.position = "fixed"
  overlay.style.inset = "0"
  overlay.style.zIndex = "999998"
  overlay.style.background = "#000"
  overlay.style.pointerEvents = "auto"
  overlay.style.touchAction = "none"
  overlay.style.display = "grid"
  overlay.style.placeItems = "center"
  overlay.style.userSelect = "none"
  overlay.style.cursor = "progress"
  overlay.innerHTML = `<img src=\"${imagePath}\" alt=\"Site en construction\" draggable=\"false\" style=\"width:100vw;height:100vh;object-fit:cover;pointer-events:none;-webkit-user-drag:none;\">`
  overlay.appendChild(buildGateActionPanel())

  document.documentElement.style.overflow = "hidden"
  document.body.style.overflow = "hidden"
  document.body.appendChild(overlay)

  const blockEvent = (event) => {
   if (isGateActionEvent(event)) return
   event.preventDefault()
   event.stopPropagation()
   if (typeof event.stopImmediatePropagation === "function") {
    event.stopImmediatePropagation()
   }
  }

  ;[
   "click",
   "dblclick",
   "mousedown",
   "mouseup",
   "pointerdown",
   "pointerup",
   "touchstart",
   "touchmove",
   "keydown",
   "keypress",
   "keyup",
   "submit",
   "contextmenu"
  ].forEach((eventName) => {
   window.addEventListener(eventName, blockEvent, true)
  })
 }

 function getCardPreviewSrc(imageEl) {
  const safeImage = imageEl instanceof HTMLImageElement ? imageEl : null
  if (!safeImage) return ""
  return String(safeImage.dataset.cardPreviewSrc || safeImage.currentSrc || safeImage.src || "").trim()
 }

 function refreshCardPreviewImages() {
  const list = Array.from(document.querySelectorAll(CARD_PREVIEW_SELECTOR))
   .filter((node) => node instanceof HTMLImageElement)
   .filter((node) => getCardPreviewSrc(node))
  cardPreviewImages = list
  if (!cardPreviewImages.length) cardPreviewIndex = -1
 }

 function ensureCardPreviewStyle() {
  if (document.getElementById("kcCardPreviewStyle")) return
  const style = document.createElement("style")
  style.id = "kcCardPreviewStyle"
  style.textContent = `
   img[data-card-preview="1"]{cursor:zoom-in;}
   .kc-card-preview-overlay{
    position:fixed;inset:0;z-index:22000;display:grid;
    grid-template-columns:minmax(44px,72px) 1fr minmax(44px,72px);
    align-items:center;justify-items:center;
    padding:24px;opacity:0;pointer-events:none;transition:opacity .2s ease;
   }
   .kc-card-preview-overlay.show{opacity:1;pointer-events:auto;}
   .kc-card-preview-overlay[hidden]{display:none;}
   .kc-card-preview-backdrop{
    position:absolute;inset:0;background:rgba(3,6,16,.86);backdrop-filter:blur(2px);
   }
   .kc-card-preview-stage{
    position:relative;z-index:1;width:100%;height:100%;
    display:grid;place-items:center;pointer-events:none;
   }
   .kc-card-preview-image{
    display:block;max-width:min(94vw,860px);max-height:min(90vh,980px);
    width:auto;height:auto;object-fit:contain;
    user-select:none;-webkit-user-drag:none;cursor:zoom-out;pointer-events:auto;
    filter:drop-shadow(0 28px 48px rgba(0,0,0,.58));
   }
   .kc-card-preview-nav{
    z-index:2;width:40px;height:40px;border-radius:999px;
    border:1px solid rgba(255,255,255,.3);background:rgba(5,8,20,.74);color:#fff;
    font-size:1.25rem;line-height:1;cursor:pointer;
    display:grid;place-items:center;
    transition:transform .12s ease, background .12s ease, border-color .12s ease;
   }
   .kc-card-preview-nav:hover{
    transform:scale(1.06);background:rgba(12,20,48,.9);border-color:rgba(255,255,255,.52);
   }
   .kc-card-preview-nav:disabled{
    opacity:.35;cursor:default;transform:none;
   }
   .kc-card-preview-nav.prev{justify-self:start;}
   .kc-card-preview-nav.next{justify-self:end;}
   @media (max-width:700px){
    .kc-card-preview-overlay{
     grid-template-columns:44px 1fr 44px;
     padding:14px;
    }
    .kc-card-preview-nav{
     width:34px;height:34px;font-size:1rem;
    }
   }
  `
  document.head.appendChild(style)
 }

 function closeCardPreview(overlay) {
  const target = overlay || document.getElementById("kcCardPreviewOverlay")
  if (!target) return
  target.classList.remove("show")
  window.setTimeout(() => { target.hidden = true }, 200)
 }

 function syncCardPreviewContent(overlay) {
  const target = overlay || document.getElementById("kcCardPreviewOverlay")
  if (!target) return
  const preview = target.querySelector("#kcCardPreviewImage")
  const prevBtn = target.querySelector("[data-kc-card-preview-prev]")
  const nextBtn = target.querySelector("[data-kc-card-preview-next]")
  if (!(preview instanceof HTMLImageElement)) return
  if (!cardPreviewImages.length || cardPreviewIndex < 0 || cardPreviewIndex >= cardPreviewImages.length) return
  const current = cardPreviewImages[cardPreviewIndex]
  const src = getCardPreviewSrc(current)
  if (!src) return
  preview.src = src
  const alt = String(current.dataset.cardPreviewName || current.alt || "Carte agrandie").trim()
  preview.alt = alt || "Carte agrandie"
  const disableNav = cardPreviewImages.length <= 1
  if (prevBtn instanceof HTMLButtonElement) prevBtn.disabled = disableNav
  if (nextBtn instanceof HTMLButtonElement) nextBtn.disabled = disableNav
 }

 function moveCardPreview(step = 1) {
  const overlay = document.getElementById("kcCardPreviewOverlay")
  if (!overlay || overlay.hidden) return
  if (!cardPreviewImages.length || cardPreviewIndex < 0) return
  if (cardPreviewImages.length === 1) return
  const len = cardPreviewImages.length
  const delta = Number(step) >= 0 ? 1 : -1
  cardPreviewIndex = (cardPreviewIndex + delta + len) % len
  syncCardPreviewContent(overlay)
 }

 function ensureCardPreviewOverlay() {
  let overlay = document.getElementById("kcCardPreviewOverlay")
  if (overlay) return overlay
  ensureCardPreviewStyle()
  overlay = document.createElement("aside")
  overlay.id = "kcCardPreviewOverlay"
  overlay.className = "kc-card-preview-overlay"
  overlay.hidden = true
  overlay.innerHTML = `
   <div class="kc-card-preview-backdrop" data-kc-card-preview-close></div>
   <button type="button" class="kc-card-preview-nav prev" data-kc-card-preview-prev aria-label="Carte precedente">&lt;</button>
   <section class="kc-card-preview-stage" role="dialog" aria-modal="true" aria-label="Aperçu carte">
    <img id="kcCardPreviewImage" class="kc-card-preview-image" src="" alt="Carte agrandie" data-kc-card-preview-close>
   </section>
   <button type="button" class="kc-card-preview-nav next" data-kc-card-preview-next aria-label="Carte suivante">&gt;</button>
  `
  document.body.appendChild(overlay)
  overlay.querySelectorAll("[data-kc-card-preview-close]").forEach((node) => {
   node.addEventListener("click", () => closeCardPreview(overlay))
  })
  overlay.querySelectorAll("[data-kc-card-preview-prev]").forEach((node) => {
   node.addEventListener("click", (event) => {
    event.preventDefault()
    event.stopPropagation()
    moveCardPreview(-1)
   })
  })
  overlay.querySelectorAll("[data-kc-card-preview-next]").forEach((node) => {
   node.addEventListener("click", (event) => {
    event.preventDefault()
    event.stopPropagation()
    moveCardPreview(1)
   })
  })
  document.addEventListener("keydown", (event) => {
   if (overlay.hidden) return
   if (event.key === "Escape") {
    closeCardPreview(overlay)
    return
   }
   if (event.key === "ArrowLeft") {
    event.preventDefault()
    moveCardPreview(-1)
    return
   }
   if (event.key === "ArrowRight") {
    event.preventDefault()
    moveCardPreview(1)
   }
  })
  return overlay
 }

 function openCardPreviewFromImage(imageEl) {
  const safeImage = imageEl instanceof HTMLImageElement ? imageEl : null
  if (!safeImage) return
  const src = getCardPreviewSrc(safeImage)
  if (!src) return
  refreshCardPreviewImages()
  cardPreviewIndex = cardPreviewImages.indexOf(safeImage)
  if (cardPreviewIndex < 0) {
   cardPreviewImages.unshift(safeImage)
   cardPreviewIndex = 0
  }
  const overlay = ensureCardPreviewOverlay()
  syncCardPreviewContent(overlay)
  overlay.hidden = false
  requestAnimationFrame(() => overlay.classList.add("show"))
 }

 function setupCardPreviewInteractions() {
  if (window.__kcCardPreviewBound) return
  window.__kcCardPreviewBound = true
  document.addEventListener("click", (event) => {
   const target = event.target instanceof Element ? event.target.closest(CARD_PREVIEW_SELECTOR) : null
   if (!(target instanceof HTMLImageElement)) return
   event.preventDefault()
   openCardPreviewFromImage(target)
  })
 }
 setupCardPreviewInteractions()

 function isTruthyFlag(value) {
  const raw = String(value || "").trim().toLowerCase()
  return raw === "1" || raw === "true" || raw === "yes" || raw === "on"
 }

 function isLoopbackHost() {
  const host = String(window.location.hostname || "").toLowerCase()
  return host === "localhost" || host === "127.0.0.1" || host === "::1"
 }

 function readLocalModeFromStorage() {
  try {
   const raw = window.localStorage.getItem(LOCAL_MODE_STORAGE_KEY)
   if (raw === null) return null
   return isTruthyFlag(raw)
  } catch (_) {
   return null
  }
 }

 function writeLocalModeToStorage(enabled) {
  try {
   window.localStorage.setItem(LOCAL_MODE_STORAGE_KEY, enabled ? "1" : "0")
  } catch (_) {}
 }

 function syncLocalModeCookie(enabled) {
  if (enabled) {
   document.cookie = `${LOCAL_MODE_COOKIE_NAME}=1; Path=/; Max-Age=31536000; SameSite=Lax`
   return
  }
  document.cookie = `${LOCAL_MODE_COOKIE_NAME}=0; Path=/; Max-Age=31536000; SameSite=Lax`
 }

 function readLocalModeFromUrl() {
  const params = new URLSearchParams(window.location.search || "")
  if (!params.has("local")) return null
  return isTruthyFlag(params.get("local"))
 }

 const localModeFromUrl = readLocalModeFromUrl()
 const localModeFromStorage = readLocalModeFromStorage()
 let localModeEnabled = localModeFromUrl !== null
  ? Boolean(localModeFromUrl)
  : (localModeFromStorage !== null ? Boolean(localModeFromStorage) : isLoopbackHost())
  writeLocalModeToStorage(localModeEnabled)
  syncLocalModeCookie(localModeEnabled)

 function hasLegacyBottomToasts() {
  return document.querySelectorAll(".toast").length > 0
 }

 function removeLegacyBottomToasts() {
  const toasts = document.querySelectorAll(".toast")
  for (const toast of toasts) {
   if (toast && typeof toast.remove === "function") toast.remove()
  }
 }

 function dismissProgressToasts() {
  progressToastQueue = []
  progressToastVisibleCount = 0
  const host = document.getElementById("globalQuestToastHost")
  if (!host || !host.children) return
  for (const child of Array.from(host.children)) {
   if (child && typeof child.remove === "function") child.remove()
  }
 }

 function dismissBottomNotifications(options = {}) {
  const keepLegacyToast = Boolean(options?.keepLegacyToast)
  const keepProgressToasts = Boolean(options?.keepProgressToasts)
  const keepEventToast = Boolean(options?.keepEventToast)

  if (!keepLegacyToast) removeLegacyBottomToasts()
  if (!keepProgressToasts) dismissProgressToasts()
  if (!keepEventToast) {
   const eventToast = document.getElementById("globalEventToast")
   if (eventToast) eventToast.hidden = true
  }
 }

 window.__kcDismissBottomNotifs = dismissBottomNotifications

function ensureEventToast() {
 let toast = document.getElementById("globalEventToast")
 if (toast) return toast
 toast = document.createElement("aside")
 toast.id = "globalEventToast"
 toast.className = "event-live-toast"
 toast.hidden = true
 toast.innerHTML = `
  <button id="globalEventToastClose" type="button" class="event-live-toast-close" aria-label="Fermer">&times;</button>
  <h4 id="globalEventToastTitle">Événement en direct</h4>
  <p id="globalEventToastText"></p>
  <div class="event-live-toast-row">
   <a id="globalEventToastOpen" class="btn btn-gold" href="/events">Voir l'event</a>
  </div>
 `
  document.body.appendChild(toast)
  const closeBtn = toast.querySelector("#globalEventToastClose")
  if (closeBtn) {
   closeBtn.addEventListener("click", () => {
    dismissEventToastFor(15 * 60 * 1000)
   })
  }
  const openBtn = toast.querySelector("#globalEventToastOpen")
  if (openBtn) {
   openBtn.addEventListener("click", () => {
    dismissEventToastFor(15 * 60 * 1000)
   })
  }
  return toast
 }

 function setEventToastContent(payload) {
  const toast = ensureEventToast()
  const title = toast.querySelector("#globalEventToastTitle")
  const text = toast.querySelector("#globalEventToastText")
  const connected = Boolean(payload?.connected)
  const participatedGodsEvent = Number(payload?.tickets?.used || 0) > 0
  const participatedPinata = Number(payload?.pinata?.my?.totalReactions || 0) > 0
 const eventActive = Boolean(payload?.event?.active) && !participatedGodsEvent
 const pinataActive = Boolean(payload?.pinata?.active) && !participatedPinata
 const rouletteReady = Boolean(payload?.roulette?.canSpin)
 const pagePath = String(window.location.pathname || "").toLowerCase()

  if (!connected) {
   toast.hidden = true
   return
  }
  if (!eventActive && !pinataActive && !rouletteReady) {
   toast.hidden = true
   return
  }
  if (pagePath.startsWith("/events")) {
   toast.hidden = true
   return
  }
  if (Date.now() < eventToastDismissedUntil) {
   toast.hidden = true
   return
  }
  if (hasActiveProgressToasts() || hasLegacyBottomToasts()) {
   toast.hidden = true
   return
  }

  const messages = []
  if (eventActive) {
   messages.push(`⚡ ${String(payload?.event?.name || "Event des Dieux")} actif`)
  }
  if (pinataActive) {
   messages.push(`🎉 Piñata d'Ecaflip active`)
  }
  if (rouletteReady) {
   messages.push(`🎡 Roulette d'Ecaflip disponible`)
  }

  if (title) title.textContent = "Activités en direct"
  if (text) text.textContent = messages.join(" · ")
  toast.hidden = false
 }

 async function refreshEventToast() {
  try {
   const res = await fetch("/api/events/state", { credentials: "same-origin" })
   if (!res.ok) return
   const data = await res.json()
   setEventToastContent(data)
  } catch (_) {}
 }

function ensureQuestToastHost() {
 let host = document.getElementById("globalQuestToastHost")
 if (host) return host
 host = document.createElement("div")
 host.id = "globalQuestToastHost"
 host.className = "quest-toast-host"
 document.body.appendChild(host)
 return host
}

 function hasActiveProgressToasts() {
  const host = document.getElementById("globalQuestToastHost")
  const hasVisible = Number(progressToastVisibleCount || 0) > 0
  const hasQueued = Array.isArray(progressToastQueue) && progressToastQueue.length > 0
  const hasMounted = Boolean(host && host.children && host.children.length > 0)
  return hasVisible || hasQueued || hasMounted
 }

function enqueueProgressToast(toast, ttl = 7000) {
 if (!(toast instanceof HTMLElement)) return
  dismissBottomNotifications({
   keepLegacyToast: false,
   keepProgressToasts: true,
   keepEventToast: false
  })
  progressToastQueue.push({
   toast,
   ttl: Math.max(2500, Number(ttl || 7000))
  })
  drainProgressToastQueue()
 }

function drainProgressToastQueue() {
 const host = ensureQuestToastHost()
 while (progressToastVisibleCount < MAX_GLOBAL_PROGRESS_TOASTS && progressToastQueue.length > 0) {
  const entry = progressToastQueue.shift()
  const toast = entry?.toast
  if (!(toast instanceof HTMLElement)) continue

  progressToastVisibleCount += 1
  host.appendChild(toast)
  const eventToast = document.getElementById("globalEventToast")
  if (eventToast) eventToast.hidden = true

  if (typeof toast.__onToastMount === "function") {
   toast.__onToastMount()
  }

  let hideTimer = null
  const dismissToast = () => {
   if (toast.dataset.dismissed === "1") return
   toast.dataset.dismissed = "1"
   if (hideTimer) {
    window.clearTimeout(hideTimer)
    hideTimer = null
   }
   toast.classList.remove("show")
   window.setTimeout(() => {
    if (toast.isConnected) toast.remove()
    progressToastVisibleCount = Math.max(0, progressToastVisibleCount - 1)
    drainProgressToastQueue()
    if (progressToastVisibleCount <= 0 && progressToastQueue.length <= 0) {
     window.setTimeout(() => {
      refreshEventToast().catch(() => {})
     }, 160)
    }
   }, 260)
  }

  const closeBtn = toast.querySelector(".quest-toast-close")
  if (closeBtn) {
   closeBtn.addEventListener("click", dismissToast)
  }

  requestAnimationFrame(() => toast.classList.add("show"))

  const ttl = Math.max(2500, Number(entry?.ttl || 7000))
  hideTimer = window.setTimeout(() => {
   dismissToast()
  }, ttl)
 }
}

 function scheduleProgressRefresh(delayMs = 450) {
  const nextDelay = Math.max(120, Number(delayMs || 450))
  if (progressRefreshTimer) {
   window.clearTimeout(progressRefreshTimer)
   progressRefreshTimer = null
  }
 progressRefreshTimer = window.setTimeout(() => {
  progressRefreshTimer = null
  refreshQuestProgressToasts().catch(() => {})
  refreshAchievementToasts().catch(() => {})
  refreshPlayerProgressToasts().catch(() => {})
 }, nextDelay)
}

 function installGlobalFetchToastHook() {
 if (!window || typeof window.fetch !== "function" || window.__kcProgressToastHooked) return
 const nativeFetch = window.fetch.bind(window)
 window.fetch = async function kcProgressToastFetch(input, init) {
  const requestUrlRaw = typeof input === "string"
   ? input
   : String(input?.url || "")
  const isSameOrigin = requestUrlRaw.startsWith("/") || requestUrlRaw.startsWith(window.location.origin)
  let outboundInit = init
  if (localModeEnabled && isSameOrigin) {
   const headers = new Headers((init && init.headers) || (input && typeof input === "object" ? input.headers : undefined))
   headers.set("x-kc-local-auth", "1")
   outboundInit = {
    ...(init || {}),
    headers
   }
  }

  const response = await nativeFetch(input, outboundInit)
  try {
   if (response?.status === 403) {
    try {
     const payload = await response.clone().json()
     if (payload?.banned) {
      activateBanOverlay({ image: payload?.banImage || payload?.image || BAN_IMAGE_FALLBACK })
      } else if (payload?.maintenance) {
       activateMaintenanceOverlay({ image: payload?.maintenanceImage || payload?.image || MAINTENANCE_IMAGE_FALLBACK })
     }
    } catch (_) {}
   }

   const method = String(outboundInit?.method || (input && typeof input === "object" ? input.method : "") || "GET").toUpperCase()
   const requestUrl = requestUrlRaw.startsWith(window.location.origin)
     ? requestUrlRaw.slice(window.location.origin.length)
     : requestUrlRaw
    if (response?.ok && method !== "GET" && String(requestUrl || "").startsWith("/api/")) {
     scheduleProgressRefresh(500)
    }
   } catch (_) {}
   return response
  }
  window.__kcProgressToastHooked = true
 }

 function toQuestPercent(current, goal) {
  const safeGoal = Math.max(1, Number(goal || 1))
  const safeCurrent = Math.max(0, Number(current || 0))
  return Math.max(0, Math.min(100, Math.round((safeCurrent / safeGoal) * 100)))
 }

function toQuestKey(type, id) {
 return `${String(type || "daily")}:${String(id || "")}`
}

function getPlayerXpRequiredForLevel(level) {
 const safeLevel = Math.max(1, Math.floor(Number(level || 1)))
 if (safeLevel >= PLAYER_MAX_LEVEL) return 0
 return 100 + (safeLevel * 35)
}

function getPlayerTotalXp(level, xpInLevel = 0) {
 const safeLevel = Math.max(1, Math.floor(Number(level || 1)))
 let total = Math.max(0, Number(xpInLevel || 0))
 for (let i = 1; i < safeLevel; i += 1) {
  total += getPlayerXpRequiredForLevel(i)
 }
 return total
}

function normalizePlayerProgressState(payload = {}) {
 if (!payload || typeof payload !== "object") return null
 const level = Math.max(1, Math.floor(Number(payload.level || 1)))
 const xp = Math.max(0, Number(payload.xp || 0))
 const xpRequiredRaw = Math.max(0, Number(payload.xpRequired || 0))
 const xpRequired = xpRequiredRaw > 0 ? xpRequiredRaw : getPlayerXpRequiredForLevel(level)
 return {
  id: String(payload.id || ""),
  level,
  xp,
  xpRequired,
  totalXp: getPlayerTotalXp(level, xp)
 }
}

const PLAYER_LEVEL_TITLES = Object.freeze({
 10: "Aspirant du Krosmoz",
 20: "Eclaireur des Douze",
 30: "Gardien des Portails",
 40: "Traqueur des Reliques",
 50: "Maitre des Etincelles",
 60: "Sentinelle Astrale",
 70: "Passeur de Dimensions",
 80: "Archiviste Arcane",
 90: "Veilleur des Constellations",
 100: "Champion du Krosmoz",
 110: "Seigneur des Fragments",
 120: "Strategue des Arcanes",
 130: "Commandeur des Cartes",
 140: "Oracle des Douze",
 150: "Heroe des Mondes",
 160: "Regent des Portails",
 170: "Legat Celeste",
 180: "Maitre des Legendes",
 190: "Parangon du Nexus",
 200: "Legende Eternelle"
})

function getPlayerKamasRewardAmount(level) {
 const safeLevel = Math.max(1, Math.min(PLAYER_MAX_LEVEL, Math.floor(Number(level || 1))))
 if (safeLevel <= 1) return 0
 const t = (safeLevel - 2) / 198
 return Math.round(100 + ((100000 - 100) * Math.max(0, Math.min(1, t))))
}

function getPlayerFragmentRewardAmount(level) {
 const safeLevel = Math.max(1, Math.min(PLAYER_MAX_LEVEL, Math.floor(Number(level || 1))))
 if (safeLevel <= 1) return 0
 if (safeLevel <= 189) {
  const t = (safeLevel - 2) / 187
  return Math.round(1 + ((10 - 1) * Math.max(0, Math.min(1, t))))
 }
 const tThl = (safeLevel - 190) / 10
 return Math.round(11 + ((30 - 11) * Math.max(0, Math.min(1, tThl))))
}

function getPlayerPackRewardAmount(level) {
 const safeLevel = Math.max(1, Math.min(PLAYER_MAX_LEVEL, Math.floor(Number(level || 1))))
 if (safeLevel <= 1) return 0
 if (safeLevel <= 189) {
  const t = (safeLevel - 2) / 187
  return Math.round(1 + ((10 - 1) * Math.max(0, Math.min(1, t))))
 }
 const tThl = (safeLevel - 190) / 10
 return Math.round(11 + ((30 - 11) * Math.max(0, Math.min(1, tThl))))
}

function getPlayerCardRewardProfile(level) {
 const safeLevel = Math.max(1, Math.min(PLAYER_MAX_LEVEL, Math.floor(Number(level || 1))))

 if (safeLevel === 200) return { rarity: "UR", amount: 6 }
 if (safeLevel >= 195) return { rarity: "UR", amount: 4 }
 if (safeLevel >= 190) return { rarity: "SSR", amount: 6 }
 if (safeLevel >= 180) return { rarity: "SSR", amount: 5 }
 if (safeLevel >= 170) return { rarity: "SR", amount: 4 }
 if (safeLevel >= 150) return { rarity: "S", amount: 4 }
 if (safeLevel >= 130) return { rarity: "S", amount: 3 }
 if (safeLevel >= 100) return { rarity: "R", amount: 3 }
 if (safeLevel >= 80) return { rarity: "R", amount: 2 }
 if (safeLevel >= 50) return { rarity: "U", amount: 2 }
 return { rarity: "C", amount: 1 }
}

function getPlayerTitleForLevel(level) {
 const safeLevel = Math.max(1, Math.min(PLAYER_MAX_LEVEL, Math.floor(Number(level || 1))))
 return PLAYER_LEVEL_TITLES[safeLevel] || `Parangon ${safeLevel}`
}

function getPlayerBadgeForTitle(title) {
 return `Insigne ${String(title || "").trim()}`.trim()
}

function getPlayerLevelReward(level) {
 const safeLevel = Math.max(1, Math.min(PLAYER_MAX_LEVEL, Math.floor(Number(level || 1))))
 const kamasAmount = getPlayerKamasRewardAmount(safeLevel)
 const fragmentAmount = getPlayerFragmentRewardAmount(safeLevel)
 const packAmount = getPlayerPackRewardAmount(safeLevel)
 const cardProfile = getPlayerCardRewardProfile(safeLevel)
 const isTitleLevel = safeLevel % 10 === 0
 const isThlLevel = safeLevel >= 190

 const slots = [
  { type: "kamas", amount: kamasAmount },
  { type: "packs", amount: packAmount },
  { type: "fragments", amount: fragmentAmount }
 ]

 if (isTitleLevel) {
  const title = getPlayerTitleForLevel(safeLevel)
  slots.push({ type: "title", value: title })
  slots.push({ type: "badge", value: getPlayerBadgeForTitle(title) })
 } else {
  slots.push({ type: "cards", amount: cardProfile.amount, rarity: cardProfile.rarity })

  if (isThlLevel) {
   slots.push({
    type: "cards",
    amount: 1 + Math.floor((safeLevel - 190) / 2),
    rarity: safeLevel >= 195 ? "UR" : "SSR"
   })
  }
 }

 const totalKamas = slots.reduce((sum, slot) => {
  if (String(slot?.type || "") !== "kamas") return sum
  return sum + Math.max(0, Number(slot?.amount || 0))
 }, 0)

 const totalPacks = slots.reduce((sum, slot) => {
  if (String(slot?.type || "") !== "packs") return sum
  return sum + Math.max(0, Number(slot?.amount || 0))
 }, 0)

 return {
  level: safeLevel,
  slots,
  milestone: Boolean(isTitleLevel || isThlLevel),
  milestoneText: isTitleLevel
   ? `Niveau ${safeLevel}: ${getPlayerTitleForLevel(safeLevel)}`
   : (isThlLevel ? `Niveau ${safeLevel}: recompenses THL renforcees` : ""),
  kamas: totalKamas,
  packs: totalPacks
 }
}

function buildLevelRewards(fromLevel, toLevel) {
 const rewards = []
 const start = Math.max(1, Math.floor(Number(fromLevel || 1)))
 const end = Math.max(start, Math.floor(Number(toLevel || start)))
 for (let lvl = start + 1; lvl <= end; lvl += 1) {
  rewards.push(getPlayerLevelReward(lvl))
 }
 return rewards
}

function formatLevelUpRewardText(levelRewards = []) {
 if (!Array.isArray(levelRewards) || levelRewards.length <= 0) return ""

 let totalKamas = 0
 let totalPacks = 0
 let totalFragments = 0
 let totalCards = 0
 const cardRarityTotals = {}
 const unlockedTitles = []
 const unlockedBadges = []

 for (const reward of levelRewards) {
  const slots = Array.isArray(reward?.slots) ? reward.slots : []
  for (const slot of slots) {
   const type = String(slot?.type || "").toLowerCase()
   if (type === "kamas") {
    totalKamas += Math.max(0, Number(slot?.amount || 0))
   } else if (type === "packs") {
    totalPacks += Math.max(0, Number(slot?.amount || 0))
   } else if (type === "fragments") {
    totalFragments += Math.max(0, Number(slot?.amount || 0))
   } else if (type === "cards") {
    const amount = Math.max(0, Number(slot?.amount || 0))
    totalCards += amount
    const rarity = String(slot?.rarity || "C").toUpperCase()
    cardRarityTotals[rarity] = (cardRarityTotals[rarity] || 0) + amount
   } else if (type === "title") {
    const value = String(slot?.value || "").trim()
    if (value) unlockedTitles.push(value)
   } else if (type === "badge") {
    const value = String(slot?.value || "").trim()
    if (value) unlockedBadges.push(value)
   }
  }
 }

 const parts = []
 if (totalKamas > 0) parts.push(`💰 +${totalKamas.toLocaleString("fr-FR")} kamas`)
 if (totalPacks > 0) parts.push(`📦 +${totalPacks.toLocaleString("fr-FR")} pack(s)`)
 if (totalFragments > 0) parts.push(`🧩 +${totalFragments.toLocaleString("fr-FR")} fragment(s)`)
 if (totalCards > 0) {
  const rarityPart = Object.entries(cardRarityTotals)
   .map(([rarity, amount]) => `${rarity} x${Number(amount || 0).toLocaleString("fr-FR")}`)
   .join(", ")
  parts.push(`🃏 +${totalCards.toLocaleString("fr-FR")} carte(s)${rarityPart ? ` (${rarityPart})` : ""}`)
 }
 if (unlockedTitles.length > 0) {
  const maxTitles = 2
  const preview = unlockedTitles.slice(0, maxTitles).join(", ")
  const extra = unlockedTitles.length > maxTitles ? ` +${unlockedTitles.length - maxTitles}` : ""
  parts.push(`🏷️ ${preview}${extra}`)
 }
 if (unlockedBadges.length > 0) {
  parts.push(`🏅 +${unlockedBadges.length.toLocaleString("fr-FR")} badge(s)`)
 }

 return parts.length ? `🎁 Récompense level up: ${parts.join(" • ")}` : ""
}

function ensureLevelUpAnimationStyles() {
 if (document.getElementById("kcLevelUpAnimStyle")) return
 const style = document.createElement("style")
 style.id = "kcLevelUpAnimStyle"
 style.textContent = `
  .kc-levelup-overlay{
   position:fixed;inset:0;z-index:20060;display:grid;place-items:center;
   padding:16px;opacity:0;pointer-events:none;transition:opacity .22s ease;
  }
  .kc-levelup-overlay.show{opacity:1;pointer-events:auto;}
  .kc-levelup-overlay[hidden]{display:none;}
  .kc-levelup-backdrop{
   position:absolute;inset:0;
   background:radial-gradient(circle at center, rgba(255,223,120,.18), rgba(0,0,0,.86));
   backdrop-filter: blur(2px);
  }
  .kc-levelup-bg{
   position:absolute;inset:0;pointer-events:none;overflow:hidden;z-index:1;
  }
  .kc-levelup-rays{
   position:absolute;left:50%;top:50%;
   width:240vmax;height:240vmax;border-radius:50%;
   transform:translate(-50%,-50%);
   background:
    radial-gradient(circle at center, rgba(245,196,84,.16) 0 56%, rgba(245,196,84,0) 82%),
    repeating-conic-gradient(from 0deg, rgba(245,196,84,.15) 0deg 9deg, rgba(245,196,84,0) 9deg 19deg);
   opacity:.34;mix-blend-mode:screen;animation:kc-levelup-rays 18s linear infinite;
  }
  .kc-levelup-particles{
   position:absolute;inset:0;overflow:hidden;
  }
  .kc-levelup-particles span{
   position:absolute;bottom:-8%;width:4px;height:4px;border-radius:999px;
   background:rgba(255,228,160,.86);box-shadow:0 0 10px rgba(255,219,135,.7);
   animation:kc-levelup-particle var(--dur,8s) linear infinite;
   animation-delay:var(--delay,0s);
  }
  .kc-levelup-modal{
   position:relative;width:min(820px,96vw);border-radius:12px;
   border:1px solid rgba(246,210,77,.42);
   background:linear-gradient(180deg, rgba(12,12,16,.98), rgba(5,5,8,.99));
   box-shadow:0 24px 64px rgba(0,0,0,.62);
   padding:72px 18px 16px;
   transform:translateY(14px) scale(.97);
   animation:kc-levelup-pop .32s ease-out forwards;
   z-index:3;
   overflow:visible;
   font-family:"Jost",sans-serif;
  }
  @keyframes kc-levelup-pop{
   to{transform:translateY(0) scale(1);}
  }
  @keyframes kc-levelup-rays{
   from{transform:translate(-50%,-50%) rotate(0deg) scale(1);}
   to{transform:translate(-50%,-50%) rotate(360deg) scale(1.03);}
  }
  @keyframes kc-levelup-particle{
   0%{transform:translate3d(0,0,0) scale(.8);opacity:0;}
   14%{opacity:.95;}
   100%{transform:translate3d(var(--drift, 18px),-108vh,0) scale(1.15);opacity:0;}
  }
  .kc-levelup-ribbon{
   position:absolute;left:50%;top:-72px;transform:translateX(-50%);
   width:min(620px,86vw);height:145px;pointer-events:none;
  }
  .kc-levelup-ribbon img{
   position:absolute;left:0;top:50%;width:100%;height:auto;transform:translateY(-48.2%);
  }
  .kc-levelup-ribbon-text{
   position:absolute;left:50%;top:40%;transform:translate(-50%,-58%);
   font-family:"Cinzel","Times New Roman",serif;font-weight:900;
   letter-spacing:.06em;font-size:clamp(1.45rem,3vw,2.05rem);color:#1b1304;
  }
  .kc-levelup-title{
   margin:0;text-align:center;color:#f8df72;font-size:clamp(1.4rem,2.6vw,1.95rem);
   letter-spacing:.15em;font-family:"Cinzel","Times New Roman",serif;font-weight:800;
  }
  .kc-levelup-rewards{
   margin-top:14px;padding:14px 8px;border-top:1px solid rgba(255,255,255,.22);
   border-bottom:1px solid rgba(255,255,255,.16);
   display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px;
  }
  .kc-levelup-reward{
   border:1px solid rgba(255,255,255,.12);border-radius:10px;
   background:linear-gradient(165deg, rgba(22,22,24,.96), rgba(10,10,12,.98));
   padding:8px 6px;text-align:center;
   animation:kc-levelup-reward-in .25s ease-out both;
   animation-delay:var(--d,0ms);
  }
  @keyframes kc-levelup-reward-in{
   from{opacity:0;transform:translateY(8px) scale(.96);}
   to{opacity:1;transform:translateY(0) scale(1);}
  }
  .kc-levelup-reward-icon-wrap{
   width:58px;height:58px;margin:0 auto 6px;display:grid;place-items:center;position:relative;
  }
  .kc-levelup-reward-icon{
   width:100%;height:100%;object-fit:contain;display:block;
  }
  .kc-levelup-reward-fallback{
   display:none;font-size:1.45rem;line-height:1;
  }
  .kc-levelup-reward-icon-wrap.is-missing .kc-levelup-reward-icon{display:none;}
  .kc-levelup-reward-icon-wrap.is-missing .kc-levelup-reward-fallback{display:block;}
  .kc-levelup-reward-label{
   margin:0;color:#c8c8cf;font-size:.78rem;font-weight:600;letter-spacing:.02em;text-transform:uppercase;
  }
  .kc-levelup-reward-value{
   margin:2px 0 0;color:#fff;font-size:1.72rem;font-weight:900;line-height:1;
  }
  .kc-levelup-meta{
   margin:10px 0 0;text-align:center;color:#c8c8d1;font-size:.96rem;
  }
  .kc-levelup-actions{
   margin-top:12px;padding-top:12px;border-top:1px solid rgba(255,255,255,.14);
   display:flex;justify-content:center;
  }
  .kc-levelup-continue{
   min-width:170px;min-height:44px;border-radius:9px;cursor:pointer;
   border:1px solid rgba(240,202,109,.72);
   background:linear-gradient(180deg, #e0c26f, #b6862c);
   color:#201303;font-weight:900;font-size:1rem;letter-spacing:.03em;
  }
  .kc-levelup-continue:hover{filter:brightness(1.05);}
  @media (max-width: 720px){
   .kc-levelup-modal{padding-top:58px;}
   .kc-levelup-ribbon{top:-56px;height:120px;width:min(520px,92vw);}
   .kc-levelup-rewards{grid-template-columns:repeat(3,minmax(0,1fr));}
   .kc-levelup-reward-icon-wrap{width:52px;height:52px;}
   .kc-levelup-reward-value{font-size:1.45rem;}
  }
 `
 document.head.appendChild(style)
}

function ensureLevelUpAnimationOverlay() {
 let root = document.getElementById("kcLevelUpOverlay")
 if (root) return root
 ensureLevelUpAnimationStyles()
 root = document.createElement("div")
 root.id = "kcLevelUpOverlay"
 root.className = "kc-levelup-overlay"
 root.hidden = true
 root.innerHTML = `
  <div class="kc-levelup-backdrop" data-kc-levelup-close></div>
  <div class="kc-levelup-bg" aria-hidden="true">
   <div class="kc-levelup-rays"></div>
   <div class="kc-levelup-particles">
    ${Array.from({ length: 22 }, (_, index) => {
     const left = ((index * 97) % 100)
     const delay = -((index * 0.43) % 5.2).toFixed(2)
     const dur = (7.6 + ((index * 0.59) % 4.7)).toFixed(2)
     const drift = (((index % 2 === 0 ? 1 : -1) * (12 + ((index * 11) % 26)))).toFixed(0)
     return `<span style="left:${left}%;--delay:${delay}s;--dur:${dur}s;--drift:${drift}px"></span>`
    }).join("")}
   </div>
  </div>
  <section class="kc-levelup-modal" aria-label="Level up">
   <div class="kc-levelup-ribbon">
    <img src="/assets/ui/ruban%20niveau.png" alt="" aria-hidden="true">
    <span class="kc-levelup-ribbon-text" id="kcLevelUpRibbonText">NIVEAU 2</span>
   </div>
   <h2 class="kc-levelup-title">GAINS</h2>
   <div class="kc-levelup-rewards" id="kcLevelUpRewards"></div>
   <p class="kc-levelup-meta" id="kcLevelUpMeta"></p>
   <div class="kc-levelup-actions">
    <button type="button" class="kc-levelup-continue" id="kcLevelUpContinue">CONTINUER</button>
   </div>
  </section>
 `
 document.body.appendChild(root)
 const closeEls = root.querySelectorAll("[data-kc-levelup-close], #kcLevelUpContinue")
 for (const closeEl of closeEls) {
  closeEl.addEventListener("click", () => advanceLevelUpAnimationQueue())
 }
 return root
}

function getLevelUpRewardIconSrc(type) {
 const key = String(type || "").toLowerCase()
 if (key === "kamas") return "/assets/ui/gain%20kamas%20level%20up.png"
 if (key === "packs") return "/assets/ui/gain%20packs%20level%20up.png"
 if (key === "fragments") return "/assets/ui/gain%20fragments%20level%20up.png"
 if (key === "cards") return "/assets/ui/gain%20carte%20level%20up.png"
 if (key === "title") return "/assets/ui/gain%20titre%20level%20up.png"
 if (key === "badge") return "/assets/ui/gain%20badge%20level%20up.png?v=20260418-0828"
 return "/assets/ui/gain%20titre%20level%20up.png"
}

function getLevelUpRewardFallbackEmoji(type) {
 const key = String(type || "").toLowerCase()
 if (key === "kamas") return "💰"
 if (key === "packs") return "📦"
 if (key === "fragments") return "🧩"
 if (key === "cards") return "🃏"
 if (key === "badge") return "🏅"
 return "🏷️"
}

function toLevelUpAnimationRewards(levelReward = {}) {
 const slots = Array.isArray(levelReward?.slots) ? levelReward.slots : []
 return slots.slice(0, 5).map((slot) => {
  const type = String(slot?.type || "").toLowerCase()
  if (type === "cards") {
   const rarity = String(slot?.rarity || "").toUpperCase()
   return {
    type,
    label: rarity ? `CARTES ${rarity}` : "CARTES",
    amount: Math.max(0, Number(slot?.amount || 0))
   }
  }
  if (type === "title") {
   return { type, label: "TITRE", amount: 1, value: String(slot?.value || "") }
  }
  if (type === "badge") {
   return { type, label: "BADGE", amount: 1, value: String(slot?.value || "") }
  }
  if (type === "kamas") return { type, label: "KAMAS", amount: Math.max(0, Number(slot?.amount || 0)) }
  if (type === "packs") return { type, label: "PACKS", amount: Math.max(0, Number(slot?.amount || 0)) }
  if (type === "fragments") return { type, label: "FRAGMENTS", amount: Math.max(0, Number(slot?.amount || 0)) }
  return { type: "title", label: "GAIN", amount: Math.max(0, Number(slot?.amount || 0)) }
 })
}

function clearLevelUpAnimationTimer() {
 if (!levelUpAnimationAutoCloseTimer) return
 window.clearTimeout(levelUpAnimationAutoCloseTimer)
 levelUpAnimationAutoCloseTimer = null
}

function renderCurrentLevelUpAnimation() {
 const root = ensureLevelUpAnimationOverlay()
 const current = levelUpAnimationQueue[0]
 if (!current) {
  clearLevelUpAnimationTimer()
  root.classList.remove("show")
  window.setTimeout(() => { root.hidden = true }, 220)
  levelUpAnimationActive = false
  return
 }

 const ribbonText = root.querySelector("#kcLevelUpRibbonText")
 const rewardsHost = root.querySelector("#kcLevelUpRewards")
 const meta = root.querySelector("#kcLevelUpMeta")
 const continueBtn = root.querySelector("#kcLevelUpContinue")

 const safeLevel = Math.max(1, Math.floor(Number(current?.level || 1)))
 if (ribbonText) ribbonText.textContent = `NIVEAU ${safeLevel}`

 const rewards = Array.isArray(current?.rewards) ? current.rewards : []
 if (rewardsHost) {
  rewardsHost.innerHTML = rewards.map((reward, index) => `
   <article class="kc-levelup-reward" style="--d:${index * 60}ms">
    <div class="kc-levelup-reward-icon-wrap">
     <img class="kc-levelup-reward-icon" src="${getLevelUpRewardIconSrc(reward?.type)}" alt="">
     <span class="kc-levelup-reward-fallback">${getLevelUpRewardFallbackEmoji(reward?.type)}</span>
    </div>
    <p class="kc-levelup-reward-label">${String(reward?.label || "GAIN")}</p>
    <p class="kc-levelup-reward-value">+${Math.max(0, Number(reward?.amount || 0)).toLocaleString("fr-FR")}</p>
   </article>
  `).join("")

  rewardsHost.querySelectorAll(".kc-levelup-reward-icon-wrap").forEach((wrap) => {
   const img = wrap.querySelector(".kc-levelup-reward-icon")
   if (!img) return
   img.addEventListener("error", () => wrap.classList.add("is-missing"), { once: true })
   img.addEventListener("load", () => wrap.classList.remove("is-missing"), { once: true })
  })
 }

 const metaTextRaw = String(current?.milestoneText || "").trim()
 const queueInfo = levelUpAnimationQueue.length > 1
  ? `(${levelUpAnimationQueue.length} niveaux en attente)`
  : ""
 const metaText = metaTextRaw || `Bravo, tu as atteint le niveau ${safeLevel}.`
 if (meta) meta.textContent = queueInfo ? `${metaText} ${queueInfo}` : metaText
 if (continueBtn) continueBtn.textContent = levelUpAnimationQueue.length > 1 ? "SUIVANT" : "FERMER"

 root.hidden = false
 requestAnimationFrame(() => root.classList.add("show"))
 clearLevelUpAnimationTimer()
 levelUpAnimationAutoCloseTimer = window.setTimeout(() => {
  advanceLevelUpAnimationQueue()
 }, 6500)
}

function advanceLevelUpAnimationQueue() {
 clearLevelUpAnimationTimer()
 if (levelUpAnimationQueue.length > 0) {
  levelUpAnimationQueue.shift()
 }
 renderCurrentLevelUpAnimation()
}

function enqueueLevelUpAnimations(levelRewards = []) {
 const rows = Array.isArray(levelRewards) ? levelRewards : []
 if (rows.length <= 0) return
 for (const reward of rows) {
  levelUpAnimationQueue.push({
   level: Math.max(1, Math.floor(Number(reward?.level || 1))),
   rewards: toLevelUpAnimationRewards(reward),
   milestoneText: String(reward?.milestoneText || "")
  })
 }
 if (levelUpAnimationsPaused) return
 if (levelUpAnimationActive) return
 levelUpAnimationActive = true
 renderCurrentLevelUpAnimation()
}

function stopLevelUpAnimations() {
 clearLevelUpAnimationTimer()
 levelUpAnimationQueue = []
 levelUpAnimationActive = false
 const root = document.getElementById("kcLevelUpOverlay")
 if (!root) return
 root.classList.remove("show")
 root.hidden = true
}

function setLevelUpAnimationsPaused(paused = true) {
 levelUpAnimationsPaused = Boolean(paused)
 if (levelUpAnimationsPaused) return
 if (levelUpAnimationActive) return
 if (levelUpAnimationQueue.length <= 0) return
 levelUpAnimationActive = true
 renderCurrentLevelUpAnimation()
}

window.__kcSetLevelUpAnimationsPaused = setLevelUpAnimationsPaused

function spawnPlayerXpToast({
 previous = null,
 current = null,
 gainedXp = 0
} = {}) {
 if (!previous || !current) return
 const levelUp = Number(current.level || 1) > Number(previous.level || 1)
 const levelRewards = levelUp ? buildLevelRewards(previous.level, current.level) : []
 const fromPct = toQuestPercent(previous.xp, Math.max(1, Number(previous.xpRequired || 1)))
 const toPct = toQuestPercent(current.xp, Math.max(1, Number(current.xpRequired || 1)))
 const safeGainedXp = Math.max(0, Number(gainedXp || 0))
 const rewardText = levelUp
  ? formatLevelUpRewardText(levelRewards)
  : `⭐ +${safeGainedXp.toLocaleString("fr-FR")} XP`

 const toast = document.createElement("article")
 toast.className = `quest-progress-toast xp-progress-toast toast-tone-xp${levelUp ? " xp-progress-toast-levelup" : ""}`
 toast.innerHTML = `
  <button type="button" class="quest-toast-close" aria-label="Fermer">&times;</button>
  <div class="quest-toast-head">
   <strong>${levelUp ? `NIVEAU ${Number(current.level || 1)} !` : "XP gagnée"}</strong>
   <span class="quest-toast-chip">${levelUp ? "LEVEL UP" : `Niveau ${Number(current.level || 1)}`}</span>
  </div>
  <p>${levelUp ? `Niveau ${Number(previous.level || 1)} → ${Number(current.level || 1)}` : `Niveau ${Number(current.level || 1)}`}</p>
  <small class="quest-toast-desc">${Math.max(0, Number(current.xp || 0)).toLocaleString("fr-FR")}/${Math.max(0, Number(current.xpRequired || 0)).toLocaleString("fr-FR")} XP • +${safeGainedXp.toLocaleString("fr-FR")} XP</small>
  <div class="quest-toast-bar"><span></span></div>
  ${rewardText ? `<small class="quest-toast-reward xp-toast-level-reward">${rewardText}</small>` : ""}
 `

 toast.__onToastMount = () => {
  const fill = toast.querySelector(".quest-toast-bar span")
  if (!fill) return
  fill.style.width = `${Math.max(0, Math.min(100, fromPct))}%`
  requestAnimationFrame(() => {
   fill.style.width = `${Math.max(0, Math.min(100, toPct))}%`
  })
 }

 enqueueProgressToast(toast, levelUp ? 12000 : 8500)
}

async function refreshPlayerProgressToasts() {
 if (playerProgressBusy) return
 playerProgressBusy = true
 try {
  const res = await fetch("/api/me", { credentials: "same-origin" })
  if (!res.ok) return
  let me = null
  try { me = await res.json() } catch (_) {}
  const current = normalizePlayerProgressState(me || {})
  if (!current) return

  if (!playerProgressSnapshot || playerProgressSnapshot.id !== current.id) {
   playerProgressSnapshot = current
   return
  }

  const previous = playerProgressSnapshot
  const gainedXp = Math.max(0, Number(current.totalXp || 0) - Number(previous.totalXp || 0))
  const levelUp = Number(current.level || 1) > Number(previous.level || 1)
  const levelRewards = levelUp ? buildLevelRewards(previous.level, current.level) : []

  if (gainedXp > 0 || levelUp) {
   spawnPlayerXpToast({
    previous,
    current,
    gainedXp
   })
  }
  if (levelUp && levelRewards.length > 0) {
   enqueueLevelUpAnimations(levelRewards)
  }

  playerProgressSnapshot = current
 } catch (_) {
 } finally {
  playerProgressBusy = false
 }
}

function formatQuestRewardPreview(reward) {
 if (!reward) return ""
 const parts = []
 if (Number(reward.kamas || 0) > 0) parts.push(`💰 +${Number(reward.kamas || 0).toLocaleString("fr-FR")}`)
 if (Number(reward.xp || 0) > 0) parts.push(`⭐ +${Number(reward.xp || 0).toLocaleString("fr-FR")} XP joueur`)
 if (Number(reward.packs || 0) > 0) parts.push(`📦 +${Number(reward.packs || 0).toLocaleString("fr-FR")}`)
 if (Number(reward.fragments || 0) > 0) parts.push(`🧩 +${Number(reward.fragments || 0).toLocaleString("fr-FR")}`)
 if (Number(reward.bpXp || 0) > 0) parts.push(`🎟️ +${Number(reward.bpXp || 0).toLocaleString("fr-FR")} XP BP`)
 return parts.join(" • ")
}

function normalizeUiText(value) {
 const raw = String(value || "")
 if (!raw) return ""
 const hasMojibake = /(?:Ã.|â.|ð[\u0080-\u00BF]|œ|�)/.test(raw)
 if (!hasMojibake) return raw
 try {
  return decodeURIComponent(escape(raw))
 } catch (_) {
  return raw
 }
}

function normalizeUiEmoji(value, fallback = "") {
 const normalized = normalizeUiText(value).trim()
 const emojiMap = {
  "\u{1FA99}": "\u{1F4B0}",
  "\u{1FA85}": "\u{1F389}"
 }
 return emojiMap[normalized] || normalized || String(fallback || "")
}

function spawnQuestToast({
 title = "Quête",
 subtitle = "",
 description = "",
 fromPct = 0,
 toPct = 0,
 variant = "progress",
 rewardText = "",
 actionHref = "",
 actionLabel = ""
} = {}) {
 const toast = document.createElement("article")
 toast.className = `quest-progress-toast quest-progress-toast-${variant} toast-tone-quest`
 const hasAction = String(actionHref || "").trim() && String(actionLabel || "").trim()
  toast.innerHTML = `
  <button type="button" class="quest-toast-close" aria-label="Fermer">&times;</button>
  <div class="quest-toast-head">
   <strong>${title}</strong>
   <span class="quest-toast-chip">${variant === "complete" ? "Complétée" : `${toPct}%`}</span>
  </div>
  <p>${subtitle}</p>
  ${description ? `<small class="quest-toast-desc">${description}</small>` : ""}
  <div class="quest-toast-bar"><span></span></div>
  ${rewardText ? `<small class="quest-toast-reward">${rewardText}</small>` : ""}
 ${hasAction ? `<div class="quest-toast-actions"><a class="quest-toast-action-btn" href="${actionHref}">${actionLabel}</a></div>` : ""}
 `

  toast.__onToastMount = () => {
   const fill = toast.querySelector(".quest-toast-bar span")
   if (!fill) return
   fill.style.width = `${Math.max(0, Math.min(100, fromPct))}%`
   requestAnimationFrame(() => {
    fill.style.width = `${Math.max(0, Math.min(100, toPct))}%`
   })
  }

 const ttl = hasAction ? 12000 : (variant === "complete" ? 9500 : 7000)
 enqueueProgressToast(toast, ttl)
}

function spawnAchievementToast({
 id = "",
 name = "Achievement",
 badge = "🏆",
 description = "",
 title = "",
 rewardText = ""
} = {}) {
 const toast = document.createElement("article")
 toast.className = "quest-progress-toast achievement-progress-toast toast-tone-achievement"
 toast.dataset.achievementId = String(id || "")
 const badgeSafe = normalizeUiEmoji(badge, "🏆")
 const nameSafe = normalizeUiText(name).trim()
 const titleText = normalizeUiText(title).trim()
 const descriptionText = normalizeUiText(description).trim()
 const rewardTextSafe = normalizeUiText(rewardText).trim()
 toast.innerHTML = `
  <button type="button" class="quest-toast-close" aria-label="Fermer">&times;</button>
  <div class="quest-toast-head">
   <strong>${badgeSafe} Achievement débloqué</strong>
   <span class="quest-toast-chip">Nouveau</span>
  </div>
  <p>${nameSafe}</p>
  ${descriptionText ? `<small class="quest-toast-desc">${descriptionText}</small>` : ""}
  ${titleText ? `<small class="quest-toast-reward">Titre: ${titleText}</small>` : ""}
  ${rewardTextSafe ? `<small class="quest-toast-reward">${rewardTextSafe}</small>` : ""}
 `

 enqueueProgressToast(toast, 12000)
}

function spawnRewardToast({
 title = "Récompense obtenue",
 subtitle = "",
 description = "",
 rewardText = "",
 chipLabel = "Gagné",
 tone = "event",
 size = "normal"
} = {}) {
 const toast = document.createElement("article")
 const safeTone = String(tone || "event").toLowerCase()
 const toneClass = safeTone === "shop" ? "toast-tone-shop" : "toast-tone-event"
 const safeSize = String(size || "normal").toLowerCase()
 toast.className = `quest-progress-toast ${toneClass}${safeSize === "double" ? " toast-size-double" : ""}`
 const titleSafe = normalizeUiText(title).trim() || "Récompense obtenue"
 const subtitleSafe = normalizeUiText(subtitle).trim()
 const descriptionSafe = normalizeUiText(description).trim()
 const rewardSafe = normalizeUiText(rewardText).trim()
 const chipSafe = normalizeUiText(chipLabel).trim() || "Gagné"
 toast.innerHTML = `
  <button type="button" class="quest-toast-close" aria-label="Fermer">&times;</button>
  <div class="quest-toast-head">
   <strong>${titleSafe}</strong>
   <span class="quest-toast-chip">${chipSafe}</span>
  </div>
  ${subtitleSafe ? `<p>${subtitleSafe}</p>` : ""}
  ${descriptionSafe ? `<small class="quest-toast-desc">${descriptionSafe}</small>` : ""}
  ${rewardSafe ? `<small class="quest-toast-reward">${rewardSafe}</small>` : ""}
 `

 enqueueProgressToast(toast, 10500)
}

 function getPlayerQuestEntries(payload) {
  const map = new Map()
  if (!payload || !payload.player) return map

  const addType = (type, quests) => {
   for (const quest of quests || []) {
    const id = String(quest?.id || "")
    if (!id) continue
    map.set(toQuestKey(type, id), {
     id,
     type,
     name: String(quest?.name || "Quête"),
     desc: String(quest?.desc || ""),
     current: Number(quest?.current || 0),
     goal: Number(quest?.goal || 1),
     done: Boolean(quest?.done),
     claimed: Boolean(quest?.claimed),
     reward: quest?.reward || {}
    })
   }
  }

  addType("daily", payload?.player?.daily?.quests || [])
  addType("weekly", payload?.player?.weekly?.quests || [])
  return map
 }

 async function refreshQuestProgressToasts() {
  if (questToastBusy) return
  questToastBusy = true

  try {
   const stateRes = await fetch("/api/quests/state", { credentials: "same-origin" })
   if (!stateRes.ok) return
   let stateData = null
   try { stateData = await stateRes.json() } catch (_) {}
   if (!stateData || !stateData.connected) {
    questProgressSnapshot = null
    return
   }

   const currentEntries = getPlayerQuestEntries(stateData)
   if (!questProgressSnapshot) {
    questProgressSnapshot = currentEntries
    return
   }

   const progressEvents = []
   const completionEvents = []

   for (const [key, nextQuest] of currentEntries.entries()) {
    const prevQuest = questProgressSnapshot.get(key)
    if (!prevQuest) continue

    const prevCurrent = Number(prevQuest.current || 0)
    const nextCurrent = Number(nextQuest.current || 0)
    const progressed = nextCurrent > prevCurrent
    const completedNow = !Boolean(prevQuest.done) && Boolean(nextQuest.done)

    if (completedNow) {
     completionEvents.push({ prev: prevQuest, next: nextQuest })
    } else if (progressed) {
     progressEvents.push({ prev: prevQuest, next: nextQuest })
    }
   }

   for (const event of progressEvents) {
    const fromPct = toQuestPercent(event.prev.current, event.next.goal)
    const toPct = toQuestPercent(event.next.current, event.next.goal)
    spawnQuestToast({
     title: `${event.next.type === "weekly" ? "Hebdo" : "Quotidienne"}: ${event.next.name}`,
     subtitle: `${Math.min(event.next.current, event.next.goal)}/${event.next.goal}`,
     description: String(event.next.desc || ""),
     fromPct,
     toPct,
     variant: "progress"
    })
   }

   for (const event of completionEvents) {
    const rewardText = formatQuestRewardPreview(event.next.reward) || "Récompense prête"
    spawnQuestToast({
     title: `${event.next.type === "weekly" ? "Hebdo" : "Quotidienne"}: ${event.next.name}`,
     subtitle: "Quête complétée",
     description: String(event.next.desc || ""),
     fromPct: 0,
     toPct: 100,
     variant: "complete",
     rewardText,
     actionHref: "/play/quests",
     actionLabel: "Récupérer la récompense"
    })
   }

   questProgressSnapshot = getPlayerQuestEntries(stateData)
  } catch (_) {
  } finally {
   questToastBusy = false
  }
 }

 function getAchievementUnlockedEntries(payload) {
  const map = new Map()
  if (!payload || !Array.isArray(payload.items)) return map
  for (const item of payload.items) {
   const id = String(item?.id || "")
   if (!id || !item?.unlocked) continue
   map.set(id, {
    id,
    name: String(item?.name || "Achievement"),
    badge: String(item?.badge || "🏆"),
    description: String(item?.description || ""),
    title: String(item?.title || ""),
    rewardText: String(item?.rewardText || "")
   })
  }
  return map
 }

 async function refreshAchievementToasts() {
  if (achievementToastBusy) return
  achievementToastBusy = true
  try {
   const achRes = await fetch("/api/achievements?category=all", { credentials: "same-origin" })
   if (!achRes.ok) return
   let achData = null
   try { achData = await achRes.json() } catch (_) {}
   if (!achData || !achData.connected) {
    achievementUnlockedSnapshot = null
    return
   }

   const unlockedNow = getAchievementUnlockedEntries(achData)
   if (!achievementUnlockedSnapshot) {
    achievementUnlockedSnapshot = unlockedNow
    return
   }

   const newlyUnlocked = []
   for (const [id, item] of unlockedNow.entries()) {
    if (!achievementUnlockedSnapshot.has(id)) {
     newlyUnlocked.push(item)
    }
   }

   for (const item of newlyUnlocked) {
    spawnAchievementToast(item)
   }

   achievementUnlockedSnapshot = unlockedNow
  } catch (_) {
  } finally {
   achievementToastBusy = false
  }
 }

function stopQuestToastPolling() {
  if (questToastPollHandle) {
   clearInterval(questToastPollHandle)
   questToastPollHandle = null
  }
  questProgressSnapshot = null
 }

 function startQuestToastPolling() {
  stopQuestToastPolling()
  refreshQuestProgressToasts().catch(() => {})
  questToastPollHandle = window.setInterval(() => {
   refreshQuestProgressToasts().catch(() => {})
  }, QUEST_TOAST_POLL_MS)
 }

 function stopAchievementToastPolling() {
  if (achievementToastPollHandle) {
   clearInterval(achievementToastPollHandle)
   achievementToastPollHandle = null
  }
  achievementUnlockedSnapshot = null
 }

 function startAchievementToastPolling() {
  stopAchievementToastPolling()
  refreshAchievementToasts().catch(() => {})
  achievementToastPollHandle = window.setInterval(() => {
   refreshAchievementToasts().catch(() => {})
  }, ACHIEVEMENT_TOAST_POLL_MS)
 }

 function stopPlayerProgressPolling() {
  if (playerProgressPollHandle) {
   clearInterval(playerProgressPollHandle)
   playerProgressPollHandle = null
  }
  playerProgressSnapshot = null
  stopLevelUpAnimations()
 }

 function startPlayerProgressPolling() {
  stopPlayerProgressPolling()
  refreshPlayerProgressToasts().catch(() => {})
  playerProgressPollHandle = window.setInterval(() => {
   refreshPlayerProgressToasts().catch(() => {})
  }, PLAYER_PROGRESS_POLL_MS)
 }

 async function refreshEventRewardToasts() {
  if (eventRewardToastBusy) return
  eventRewardToastBusy = true
  try {
   const res = await fetch("/api/events/reward-toasts", { credentials: "same-origin" })
   if (!res.ok) return
   let data = null
   try { data = await res.json() } catch (_) {}
   const items = Array.isArray(data?.items) ? data.items : []
   for (const item of items) {
    spawnRewardToast({
     title: String(item?.title || "Récompense obtenue"),
     subtitle: String(item?.subtitle || ""),
     description: String(item?.description || ""),
     rewardText: String(item?.rewardText || ""),
     chipLabel: String(item?.chipLabel || "Gagné"),
     tone: String(item?.tone || "event")
    })
   }
  } catch (_) {
  } finally {
   eventRewardToastBusy = false
  }
 }

 function stopEventRewardToastPolling() {
  if (eventRewardToastPollHandle) {
   clearInterval(eventRewardToastPollHandle)
   eventRewardToastPollHandle = null
  }
 }

 function startEventRewardToastPolling() {
  stopEventRewardToastPolling()
  refreshEventRewardToasts().catch(() => {})
  eventRewardToastPollHandle = window.setInterval(() => {
   refreshEventRewardToasts().catch(() => {})
  }, EVENT_REWARD_TOAST_POLL_MS)
 }

 window.__kcQuestToastNotify = function questToastNotify(payload = {}) {
  const fromRaw = Number(payload?.fromPct)
  const toRaw = Number(payload?.toPct)
 spawnQuestToast({
  title: String(payload?.title || "Quête"),
  subtitle: String(payload?.subtitle || ""),
  description: String(payload?.description || ""),
  fromPct: Number.isFinite(fromRaw) ? fromRaw : 0,
  toPct: Number.isFinite(toRaw) ? toRaw : 100,
  variant: payload?.variant === "progress" ? "progress" : "complete",
  rewardText: String(payload?.rewardText || ""),
  actionHref: String(payload?.actionHref || ""),
  actionLabel: String(payload?.actionLabel || "")
  })
 }

window.__kcQuestToastPreview = function questToastPreview() {
 spawnQuestToast({
  title: "Quotidienne: Ouverture Rapide",
  subtitle: "2/3",
  description: "Faire 3 fusions",
  fromPct: 33,
  toPct: 66,
  variant: "progress"
  })
  window.setTimeout(() => {
  spawnQuestToast({
   title: "Quotidienne: Ouverture Rapide",
   subtitle: "Quête complétée",
   description: "Faire 3 fusions",
   fromPct: 0,
   toPct: 100,
   variant: "complete",
   rewardText: "💰 +300 • ⭐ +50 XP • 🎟️ +80 XP BP",
   actionHref: "/play/quests",
   actionLabel: "Récupérer la récompense"
  })
 }, 800)
}

window.__kcAchievementToastPreview = function achievementToastPreview() {
 spawnAchievementToast({
  id: "preview-achievement",
  name: "Vitesse Lumière",
  badge: "⚡",
  description: "Gagner 1000 kamas",
  title: "Éclair du Krosmoz",
 rewardText: "💰 750 kamas · ⭐ 120 XP"
 })
}

window.__kcRewardToastNotify = function rewardToastNotify(payload = {}) {
 spawnRewardToast({
  title: String(payload?.title || "Récompense obtenue"),
  subtitle: String(payload?.subtitle || ""),
  description: String(payload?.description || ""),
  rewardText: String(payload?.rewardText || ""),
  chipLabel: String(payload?.chipLabel || "Gagné"),
  tone: String(payload?.tone || "event"),
  size: String(payload?.size || "normal")
 })
}

window.__kcShopToastNotify = function shopToastNotify(payload = {}) {
 spawnRewardToast({
  title: String(payload?.title || "🛍️ KrosmoShop"),
  subtitle: String(payload?.subtitle || ""),
  description: String(payload?.description || ""),
  rewardText: String(payload?.rewardText || ""),
  chipLabel: String(payload?.chipLabel || "Shop"),
  tone: "shop",
  size: String(payload?.size || "normal")
 })
}

window.__kcPullEventRewardToasts = function pullEventRewardToasts() {
 return refreshEventRewardToasts()
}

 installGlobalFetchToastHook()

 ensureEventToast()
 refreshEventToast().catch(() => {})
 window.setInterval(() => { refreshEventToast().catch(() => {}) }, 15000)
 if (!btn) {
  try {
   const res = await fetch("/api/oauth/status", { credentials: "same-origin" })
   if (res.ok) {
   const status = await res.json()
   if (status?.banned) {
    activateBanOverlay({ image: status?.banImage || BAN_IMAGE_FALLBACK })
    } else if (status?.maintenance) {
     activateMaintenanceOverlay({ image: status?.maintenanceImage || MAINTENANCE_IMAGE_FALLBACK })
    }
   }
   } catch (_) {}
  return
 }

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
      <li><a href="/packs" data-play-mode="packs">Packs</a></li>
      <li><a href="/play/fusion" data-play-mode="fusion">Fusion</a></li>
      <li><a href="/play/fabrication" data-play-mode="craft">Fabrication</a></li>
      <li><a href="/play/quests" data-play-mode="quests">Quêtes</a></li>
      <li><a href="/events">Events</a></li>
      <li><a href="/battlepass">Battlepass</a></li>
      <li><a href="/krosmoshop">KrosmoShop</a></li>
      <li><a href="/market">Marché</a></li>
      <li><a href="/guild">Guildes</a></li>
      <li><a href="/achievements">Achievements</a></li>
      <li><a href="/profile/">Profil</a></li>
     </ul>
    </div>
   `
   navbar.appendChild(subnav)
  }

   const p = String(window.location.pathname || "")
   const normalizedPlayPath = p === "/play/craft" ? "/play/fabrication" : p
   subnav.querySelectorAll("a").forEach((a) => {
    const href = String(a.getAttribute("href") || "")
    const isPlayMode = Boolean(a.dataset.playMode) && p.startsWith("/play/")
    const active = isPlayMode
     ? (href === normalizedPlayPath)
     : (href === p || (href !== "/" && p.startsWith(`${href}/`)))
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

 function formatDailyCountdown(ms) {
  const totalSeconds = Math.max(0, Math.floor(Number(ms || 0) / 1000))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`
 }

 function stopDailyButtonTimers() {
  if (dailyButtonRefreshHandle) {
   window.clearInterval(dailyButtonRefreshHandle)
   dailyButtonRefreshHandle = null
  }
  if (dailyButtonTickHandle) {
   window.clearInterval(dailyButtonTickHandle)
   dailyButtonTickHandle = null
  }
 }

 function syncDailyState(nextState) {
  dailyState = {
   canClaim: Boolean(nextState?.canClaim),
   nextClaimAt: Number(nextState?.nextClaimAt || 0),
   remainingMs: Math.max(0, Number(nextState?.remainingMs || 0)),
   streak: Math.max(0, Number(nextState?.streak || 0)),
   lastDaily: Math.max(0, Number(nextState?.lastDaily || 0))
  }
 }

 function renderDailyButton() {
  if (!right) return
  const dailyEl = right.querySelector("#globalDailyBtn")
  if (!dailyEl) return

  const now = Date.now()
  const remainingMs = dailyState.canClaim
   ? 0
   : Math.max(0, Number(dailyState.nextClaimAt || 0) - now || Number(dailyState.remainingMs || 0))

  dailyEl.classList.toggle("btn-daily-ready", Boolean(dailyState.canClaim) && !dailyButtonBusy)
  dailyEl.classList.toggle("btn-daily-wait", !Boolean(dailyState.canClaim) && !dailyButtonBusy)

  if (dailyButtonBusy) {
   dailyEl.textContent = "🎁 Claim daily..."
   dailyEl.setAttribute("aria-disabled", "true")
   dailyEl.style.pointerEvents = "none"
   dailyEl.style.opacity = "0.7"
   return
  }

  if (dailyState.canClaim) {
   dailyEl.textContent = "🎁 Claim daily"
   dailyEl.setAttribute("aria-disabled", "false")
   dailyEl.style.pointerEvents = ""
   dailyEl.style.opacity = ""
   dailyEl.title = "Réclamer ta récompense /daily"
   return
  }

  dailyEl.textContent = `🎁 Daily ${formatDailyCountdown(remainingMs)}`
  dailyEl.setAttribute("aria-disabled", "true")
  dailyEl.style.pointerEvents = "none"
  dailyEl.style.opacity = "0.85"
  dailyEl.title = "Prochaine claim à minuit (heure Paris)"
 }

 async function refreshDailyButtonState() {
  if (dailyStateRefreshBusy) return
  dailyStateRefreshBusy = true
  try {
   const res = await fetch("/api/daily/state", { credentials: "same-origin" })
   if (!res.ok) return
   const data = await res.json()
   if (!data?.connected) return
   syncDailyState(data?.state || {})
   renderDailyButton()
  } catch (_) {
  } finally {
   dailyStateRefreshBusy = false
  }
 }

 function setDailyButton(userId) {
  if (!right) return
  let dailyEl = right.querySelector("#globalDailyBtn")
  const profileEl = right.querySelector("#globalProfileBtn")

  if (!userId) {
   if (dailyEl) dailyEl.remove()
   stopDailyButtonTimers()
   syncDailyState({ canClaim: false, nextClaimAt: 0, remainingMs: 0, streak: 0, lastDaily: 0 })
   dailyButtonBusy = false
   return
  }

  if (!dailyEl) {
   dailyEl = document.createElement("a")
   dailyEl.id = "globalDailyBtn"
   dailyEl.className = "btn btn-outline btn-auth-top btn-daily-top"
   dailyEl.href = "#"
   dailyEl.textContent = "🎁 Daily --:--:--"
   right.insertBefore(dailyEl, profileEl || btn)
   dailyEl.addEventListener("click", async (event) => {
    event.preventDefault()
    if (dailyButtonBusy || !dailyState.canClaim) return
    dailyButtonBusy = true
    renderDailyButton()
    try {
     const claimRes = await fetch("/api/daily/claim", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({})
     })
     const claimData = await claimRes.json().catch(() => ({}))
     if (!claimRes.ok) {
      if (claimData?.state) syncDailyState(claimData.state)
      throw new Error(String(claimData?.error || "Claim daily impossible."))
     }

     if (claimData?.state) syncDailyState(claimData.state)
     const reward = claimData?.result?.reward || {}
     let rewardText = ""
     if (reward?.type === "pack") rewardText = `📦 +${Number(reward?.value || 0)} pack(s)`
     else if (reward?.type === "kamas") rewardText = `💰 +${Number(reward?.value || 0).toLocaleString("fr-FR")} kamas`
     else if (reward?.type === "ssr") rewardText = `🌈 ${String(reward?.value?.name || "Carte SSR")}`
     spawnRewardToast({
      title: "🎁 Daily récupérée",
      subtitle: `Streak ${Number(claimData?.result?.streak || 0)}/7`,
      description: "Récompense quotidienne obtenue.",
      rewardText,
      chipLabel: "Daily",
      tone: "event"
     })
     scheduleProgressRefresh(180)
    } catch (error) {
     spawnRewardToast({
      title: "⏳ Daily indisponible",
      description: String(error?.message || "Réessaie un peu plus tard."),
      chipLabel: "Daily",
      tone: "event"
     })
    } finally {
      dailyButtonBusy = false
      renderDailyButton()
      refreshDailyButtonState().catch(() => {})
    }
   })
  } else {
   right.insertBefore(dailyEl, profileEl || btn)
  }

  stopDailyButtonTimers()
  renderDailyButton()
  refreshDailyButtonState().catch(() => {})
  dailyButtonRefreshHandle = window.setInterval(() => {
   refreshDailyButtonState().catch(() => {})
  }, DAILY_BUTTON_REFRESH_MS)
  dailyButtonTickHandle = window.setInterval(() => {
   if (!dailyState.canClaim && Number(dailyState.nextClaimAt || 0) > 0 && Date.now() >= Number(dailyState.nextClaimAt || 0)) {
    refreshDailyButtonState().catch(() => {})
   }
   renderDailyButton()
  }, DAILY_BUTTON_TICK_MS)
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
   a.href = "/packs"
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

 function setTopEventsLinkVisibility() {
  if (!navLinks) return
  const eventsLink = navLinks.querySelector('a[href="/events"]')
  if (!eventsLink || !eventsLink.parentElement) return
  eventsLink.parentElement.style.display = "none"
  eventsLink.classList.remove("active")
 }

 let status = null
 try {
  const res = await fetch("/api/oauth/status", { credentials: "same-origin" })
  if (res.ok) status = await res.json()
 } catch (_) {}

 const returnTo = `${window.location.pathname || "/"}${window.location.search || ""}`
 const localSessionActive = Boolean(localModeEnabled || status?.localAuthSession || status?.localAuthEnabled)

 if (status?.banned) {
  activateBanOverlay({ image: status?.banImage || BAN_IMAGE_FALLBACK })
  return
 }
 if (status?.maintenance) {
  activateMaintenanceOverlay({ image: status?.maintenanceImage || MAINTENANCE_IMAGE_FALLBACK })
  return
 }

 if (!status?.enabled && !localModeEnabled) {
  setAuthBodyClass(false)
  setPlaySubnav(false)
  setAuthState("")
  setProfileLink(null)
  setDailyButton(null)
  setConnectedNavLink(false)
  setTopMarketLinkVisibility(false)
  setTopEventsLinkVisibility()
  stopQuestToastPolling()
  stopAchievementToastPolling()
  stopEventRewardToastPolling()
  stopPlayerProgressPolling()
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

 if (!status?.connected) {
  if (localModeEnabled) {
   setAuthBodyClass(false)
   setPlaySubnav(false)
   setAuthState("Mode local (hors ligne)")
   setProfileLink(null)
   setDailyButton(null)
   setConnectedNavLink(false)
   setTopMarketLinkVisibility(false)
   setTopEventsLinkVisibility()
   stopQuestToastPolling()
   stopAchievementToastPolling()
   stopEventRewardToastPolling()
   stopPlayerProgressPolling()
   if (heroPlayBtn) {
    heroPlayBtn.textContent = "JOUER"
    heroPlayBtn.href = "/auth/discord?local=1&returnTo=%2Fplay%2Finventory"
    heroPlayBtn.removeAttribute("aria-disabled")
    heroPlayBtn.style.pointerEvents = ""
    heroPlayBtn.style.opacity = ""
   }
   btn.textContent = "Activer mode local"
   btn.href = `/auth/discord?local=1&returnTo=${encodeURIComponent(returnTo)}`
   return
  }

  setAuthBodyClass(false)
  setPlaySubnav(false)
  setAuthState("")
  setProfileLink(null)
  setDailyButton(null)
  setConnectedNavLink(false)
  setTopMarketLinkVisibility(false)
  setTopEventsLinkVisibility()
  stopQuestToastPolling()
  stopAchievementToastPolling()
  stopEventRewardToastPolling()
  stopPlayerProgressPolling()
  if (heroPlayBtn) {
   heroPlayBtn.textContent = "JOUER"
   heroPlayBtn.href = "/auth/discord?returnTo=%2Fplay"
   heroPlayBtn.removeAttribute("aria-disabled")
   heroPlayBtn.style.pointerEvents = ""
   heroPlayBtn.style.opacity = ""
  }
  btn.textContent = "Connexion Discord"
  btn.href = `/auth/discord?returnTo=${encodeURIComponent(returnTo)}`
  return
 }

 let me = null
 try {
  const meRes = await fetch("/api/me", { credentials: "same-origin" })
  if (meRes.ok) me = await meRes.json()
 } catch (_) {}
 playerProgressSnapshot = normalizePlayerProgressState(me || {})

 setAuthBodyClass(true)
 setPlaySubnav(true)
 setAuthState(localSessionActive ? "Mode local" : "")
 const connectedUserId = me?.id || status.userId || null
 setProfileLink(connectedUserId)
 setDailyButton(connectedUserId)
 setConnectedNavLink(true)
 setTopMarketLinkVisibility(true)
 setTopEventsLinkVisibility()
 startQuestToastPolling()
 startAchievementToastPolling()
 startEventRewardToastPolling()
 startPlayerProgressPolling()
 if (heroPlayBtn) {
  heroPlayBtn.textContent = "JOUER"
  heroPlayBtn.href = localSessionActive ? "/play/inventory?local=1" : "/play"
  heroPlayBtn.removeAttribute("aria-disabled")
  heroPlayBtn.style.pointerEvents = ""
  heroPlayBtn.style.opacity = ""
 }

 btn.textContent = localSessionActive ? "Quitter mode local" : "Deconnexion"
 btn.href = "#"
 btn.addEventListener("click", async (event) => {
  event.preventDefault()
  setDailyButton(null)
  stopQuestToastPolling()
  stopAchievementToastPolling()
  stopEventRewardToastPolling()
  stopPlayerProgressPolling()
  if (localSessionActive) {
   localModeEnabled = false
   writeLocalModeToStorage(false)
   syncLocalModeCookie(false)
  }
  try {
   await fetch("/auth/logout", {
    method: "POST",
    credentials: "same-origin"
   })
  } catch (_) {}
  window.location.reload()
 })
})()
