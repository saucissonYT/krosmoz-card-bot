/* ═══════════════════════════════════════════════
   TESTS — Web Routes (integration)
   Lance le serveur Express et teste les endpoints :
     1. GET /health
     2. GET /api/stats
     3. GET /api/cards
     4. GET /api/leaderboard/:category
     5. GET /api/achievements
     6. GET /api/events/state
     7. GET /api/oauth/status
     8. GET /api/daily/state
     9. Auth-required endpoints return 401
    10. POST Content-Type enforcement (415)
    11. Local auth session grants access
    12. GET /api/sets
═══════════════════════════════════════════════ */

const assert = require("assert")
const http = require("http")

/* ── Setup: seed minimal data so the app can boot ── */
const dataManager = require("../systems/dataManager")

const mockCards = []
let cardId = 1
for (const set of ["incarnam", "astrub"]) {
 for (const rarity of ["C", "U", "R", "SR", "HR", "UR", "S", "SSR"]) {
  for (let i = 0; i < 3; i++) {
   mockCards.push({ id: cardId++, name: `${set}_${rarity}_${i}`, set, rarity, image: `${set}_${rarity}_${i}.png` })
  }
 }
}
dataManager.data.cards = mockCards

const { resetRegistry } = require("../systems/cardRegistry")
resetRegistry()

const { createWebApp } = require("../web/Server")

let passed = 0
let failed = 0

function test(name, fn) {
 return fn()
  .then(() => { console.log(`  ✅ ${name}`); passed++ })
  .catch((e) => { console.error(`  ❌ ${name}\n     ${e.message}`); failed++ })
}

/**
 * HTTP helper.
 * By default sends x-kc-local-auth: 0 to disable the automatic
 * local-auth session that activates on loopback requests.
 * Pass extraHeaders to override.
 */
function request(server, method, urlPath, body, extraHeaders) {
 return new Promise((resolve, reject) => {
  const addr = server.address()
  const headers = { "x-kc-local-auth": "0", ...extraHeaders }
  let payload = null
  if (body !== undefined) {
   payload = JSON.stringify(body)
   headers["Content-Type"] = "application/json"
   headers["Content-Length"] = Buffer.byteLength(payload)
  }
  const req = http.request({
   hostname: "127.0.0.1",
   port: addr.port,
   path: urlPath,
   method,
   headers
  }, (res) => {
   let data = ""
   res.on("data", (chunk) => { data += chunk })
   res.on("end", () => {
    let json = null
    try { json = JSON.parse(data) } catch (_) {}
    resolve({ status: res.statusCode, headers: res.headers, body: json, raw: data })
   })
  })
  req.on("error", reject)
  if (payload) req.write(payload)
  req.end()
 })
}

/* ── Main ── */
async function run() {
 console.log("\n══════ TESTS Web Routes (integration) ══════\n")

 const app = createWebApp()
 const server = await new Promise((resolve) => {
  const s = app.listen(0, "127.0.0.1", () => resolve(s))
 })

 try {
  /* ═══════════════════════════════════════════════
     1. HEALTH
  ═══════════════════════════════════════════════ */
  await test("1. GET /health returns 200 with status ok", async () => {
   const res = await request(server, "GET", "/health")
   assert.strictEqual(res.status, 200)
   assert.strictEqual(res.body.status, "ok")
   assert.ok(typeof res.body.uptime === "number", "uptime is a number")
   assert.ok(res.body.memory, "memory info present")
  })

  /* ═══════════════════════════════════════════════
     2. STATS
  ═══════════════════════════════════════════════ */
  await test("2. GET /api/stats returns global stats", async () => {
   const res = await request(server, "GET", "/api/stats")
   assert.strictEqual(res.status, 200)
   assert.ok(typeof res.body.players === "number", "players count")
   assert.ok(typeof res.body.totalCards === "number", "totalCards")
  })

  /* ═══════════════════════════════════════════════
     3. CARDS CATALOG
  ═══════════════════════════════════════════════ */
  await test("3. GET /api/cards returns paginated cards", async () => {
   const res = await request(server, "GET", "/api/cards?limit=5")
   assert.strictEqual(res.status, 200)
   assert.ok(typeof res.body.total === "number", "total present")
   assert.ok(Array.isArray(res.body.items), "items is array")
   assert.ok(res.body.items.length <= 5, "respects limit")
   assert.ok(res.body.pages >= 1, "pages >= 1")
  })

  /* ═══════════════════════════════════════════════
     4. LEADERBOARD
  ═══════════════════════════════════════════════ */
  await test("4. GET /api/leaderboard/kamas returns array", async () => {
   const res = await request(server, "GET", "/api/leaderboard/kamas")
   assert.strictEqual(res.status, 200)
   assert.ok(Array.isArray(res.body), "response is array")
  })

  /* ═══════════════════════════════════════════════
     5. ACHIEVEMENTS
  ═══════════════════════════════════════════════ */
  await test("5. GET /api/achievements returns achievement list", async () => {
   const res = await request(server, "GET", "/api/achievements")
   assert.strictEqual(res.status, 200)
   assert.ok(typeof res.body.total === "number", "total present")
   assert.ok(Array.isArray(res.body.items), "items is array")
   assert.ok(res.body.categories, "categories present")
   assert.strictEqual(res.body.connected, false, "not connected without session")
  })

  /* ═══════════════════════════════════════════════
     6. EVENTS STATE
  ═══════════════════════════════════════════════ */
  await test("6. GET /api/events/state returns event state", async () => {
   const res = await request(server, "GET", "/api/events/state")
   assert.strictEqual(res.status, 200)
   assert.strictEqual(res.body.connected, false, "not connected")
   assert.ok("event" in res.body, "event field present")
   assert.ok("roulette" in res.body, "roulette field present")
  })

  /* ═══════════════════════════════════════════════
     7. OAUTH STATUS
  ═══════════════════════════════════════════════ */
  await test("7. GET /api/oauth/status returns auth state", async () => {
   const res = await request(server, "GET", "/api/oauth/status")
   assert.strictEqual(res.status, 200)
   assert.strictEqual(res.body.connected, false, "not connected")
   assert.ok("enabled" in res.body, "enabled field present")
   assert.strictEqual(res.body.banned, false, "not banned")
  })

  /* ═══════════════════════════════════════════════
     8. DAILY STATE (unauthenticated)
  ═══════════════════════════════════════════════ */
  await test("8. GET /api/daily/state returns disconnected state", async () => {
   const res = await request(server, "GET", "/api/daily/state")
   assert.strictEqual(res.status, 200)
   assert.strictEqual(res.body.connected, false)
   assert.ok(res.body.state, "state object present")
   assert.strictEqual(res.body.state.canClaim, false)
  })

  /* ═══════════════════════════════════════════════
     9. AUTH-REQUIRED ENDPOINTS RETURN 401
  ═══════════════════════════════════════════════ */
  const authEndpoints = [
   ["GET", "/api/me"],
   ["GET", "/api/me/inventory"],
   ["POST", "/api/me/title"],
   ["POST", "/api/daily/claim"],
   ["POST", "/api/events/roulette/spin"],
   ["POST", "/api/events/eventpack/open"],
   ["POST", "/api/achievements/claim"],
   ["GET", "/api/events/reward-toasts"]
  ]

  for (const [method, endpoint] of authEndpoints) {
   await test(`9. ${method} ${endpoint} returns 401 without auth`, async () => {
    const body = method === "POST" ? {} : undefined
    const res = await request(server, method, endpoint, body)
    assert.strictEqual(res.status, 401, `expected 401, got ${res.status}`)
   })
  }

  /* ═══════════════════════════════════════════════
     10. CONTENT-TYPE ENFORCEMENT
  ═══════════════════════════════════════════════ */
  await test("10. POST /api/* without JSON Content-Type returns 415", async () => {
   const res = await new Promise((resolve, reject) => {
    const addr = server.address()
    const req = http.request({
     hostname: "127.0.0.1",
     port: addr.port,
     path: "/api/me/title",
     method: "POST",
     headers: {
      "Content-Type": "text/plain",
      "x-kc-local-auth": "0"
     }
    }, (r) => {
     let data = ""
     r.on("data", (chunk) => { data += chunk })
     r.on("end", () => {
      let json = null
      try { json = JSON.parse(data) } catch (_) {}
      resolve({ status: r.statusCode, body: json })
     })
    })
    req.on("error", reject)
    req.write("hello")
    req.end()
   })
   assert.strictEqual(res.status, 415)
  })

  /* ═══════════════════════════════════════════════
     11. LOCAL AUTH SESSION GRANTS ACCESS
  ═══════════════════════════════════════════════ */
  await test("11. Local auth cookie grants access to /api/me", async () => {
   const { getUser, save } = require("../systems/userSystem")
   const testUserId = "900000000000000001"
   const user = getUser(testUserId)
   user.kamas = 100
   save(testUserId)

   const res = await request(server, "GET", "/api/me", undefined, {
    "x-kc-local-auth": "1",
    Cookie: `kc_local_auth=${testUserId}`
   })

   assert.strictEqual(res.status, 200, `expected 200, got ${res.status}`)
   assert.ok(res.body.kamas !== undefined, "kamas present in /api/me")
  })

  /* ═══════════════════════════════════════════════
     12. SETS ENDPOINT
  ═══════════════════════════════════════════════ */
  await test("12. GET /api/sets returns set list", async () => {
   const res = await request(server, "GET", "/api/sets")
   assert.strictEqual(res.status, 200)
   assert.ok(Array.isArray(res.body), "sets is array")
  })

 } finally {
  server.close()
 }

 console.log(`\n  Résultat : ${passed} ok, ${failed} failed\n`)
 process.exit(failed > 0 ? 1 : 0)
}

run().catch((e) => {
 console.error("Fatal:", e)
 process.exit(1)
})
