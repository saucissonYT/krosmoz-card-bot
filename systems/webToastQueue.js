const { getUser, save } = require("./userSystem")

const USER_TOASTS_KEY = "webRewardToasts"
const USER_TOASTS_MAX = 50
const USER_TOASTS_MAX_POP = 5

function buildWebRewardToastId(prefix = "evt") {
 return `${String(prefix || "evt")}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function normalizeToastEntry(row = {}) {
 return {
  id: String(row.id || buildWebRewardToastId(String(row.type || "evt"))),
  type: String(row.type || "event"),
  tone: String(row.tone || "event"),
  title: String(row.title || "Recompense obtenue"),
  subtitle: String(row.subtitle || ""),
  description: String(row.description || ""),
  rewardText: String(row.rewardText || ""),
  chipLabel: String(row.chipLabel || "Gagne"),
  createdAt: Number(row.createdAt || Date.now())
 }
}

function ensureUserToastsQueue(user) {
 if (!user || typeof user !== "object") return []
 const before = Array.isArray(user[USER_TOASTS_KEY]) ? user[USER_TOASTS_KEY] : []
 const normalized = before
  .filter((row) => row && typeof row === "object")
  .map((row) => normalizeToastEntry(row))
  .slice(-USER_TOASTS_MAX)
 user[USER_TOASTS_KEY] = normalized
 return user[USER_TOASTS_KEY]
}

function enqueueWebRewardToast(userId, toastPayload = {}) {
 const safeUserId = String(userId || "").trim()
 if (!safeUserId) return null

 const user = getUser(safeUserId)
 if (!user) return null

 const queue = ensureUserToastsQueue(user)
 const entry = normalizeToastEntry(toastPayload)
 queue.push(entry)
 if (queue.length > USER_TOASTS_MAX) {
  queue.splice(0, queue.length - USER_TOASTS_MAX)
 }
 user[USER_TOASTS_KEY] = queue
 save(safeUserId)
 return entry
}

function popWebRewardToasts(userId, limit = USER_TOASTS_MAX_POP) {
 const safeUserId = String(userId || "").trim()
 if (!safeUserId) return []

 const user = getUser(safeUserId)
 if (!user) return []

 const queue = ensureUserToastsQueue(user)
 if (!Array.isArray(queue) || queue.length <= 0) return []

 const safeLimit = Math.max(1, Math.min(20, Number(limit || USER_TOASTS_MAX_POP)))
 const items = queue.splice(0, safeLimit)
 user[USER_TOASTS_KEY] = queue
 save(safeUserId)
 return items
}

module.exports = {
 USER_TOASTS_MAX_POP,
 buildWebRewardToastId,
 enqueueWebRewardToast,
 popWebRewardToasts
}
