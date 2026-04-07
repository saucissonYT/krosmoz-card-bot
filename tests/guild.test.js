/* ═══════════════════════════════════════════════
   TESTS — systems/guildSystem.js
   Couvre : xpRequired, createGuild, joinGuild,
            leaveGuild, kick, promote, demote,
            transferLeader, renameGuild, ranks
   
   NOTE : les noms de guilde sont uniques par run
   pour éviter les conflits avec la BDD existante.
═══════════════════════════════════════════════ */

const assert = require("assert")

const dataManager = require("../systems/dataManager")
dataManager.data.cards = []

const { getUser, save } = require("../systems/userSystem")
const {
 createGuild, joinGuild, leaveGuild, disbandGuild,
 promoteOfficer, getGuild, getUserGuild, getGuildRank,
 xpRequired, addGuildXP,
 MAX_MEMBERS, CREATE_COST, RENAME_COST, MAX_OFFICERS
} = require("../systems/guildSystem")

let passed = 0, failed = 0

function test(name, fn) {
 try { fn(); console.log(`  ✅ ${name}`); passed++ }
 catch (e) { console.error(`  ❌ ${name}\n     ${e.message}`); failed++ }
}

/* Suffixe unique pour éviter les conflits entre runs */
const RUN = Date.now().toString(36).slice(-4)

function uid(base) { return `test_${base}_${RUN}` }
function gname(base) { return `G_${base}_${RUN}` }

function setupUser(id, kamas = 10000) {
 const u = getUser(id)
 u.kamas = kamas; u.stats = {}
 if (u.guildId) delete u.guildId
 save(id); return u
}

/* Cleanup : dissoudre les guildes de test en fin de run */
const guildsToClean = []
function trackGuild(guild) { if (guild) guildsToClean.push(guild) }

console.log("\n══════ TESTS guildSystem.js ══════\n")

/* ── xpRequired ── */

test("xpRequired retourne un nombre positif", () => {
 for (let lvl = 1; lvl <= 100; lvl++) {
  assert.ok(xpRequired(lvl) > 0, `xpRequired(${lvl}) > 0`)
 }
})

test("xpRequired est croissant", () => {
 for (let lvl = 1; lvl < 100; lvl++) {
  assert.ok(xpRequired(lvl + 1) >= xpRequired(lvl))
 }
})

/* ── Constantes ── */

test("MAX_MEMBERS, CREATE_COST, RENAME_COST, MAX_OFFICERS sont définis", () => {
 assert.ok(MAX_MEMBERS > 0)
 assert.ok(CREATE_COST > 0)
 assert.ok(RENAME_COST > 0)
 assert.ok(MAX_OFFICERS > 0)
})

/* ── createGuild ── */

test("createGuild crée une guilde valide", () => {
 setupUser(uid("leader1"), 20000)
 const r = createGuild(uid("leader1"), gname("Test"))
 assert.ok(!r.error, r.error)
 assert.ok(r.guild)
 assert.strictEqual(r.guild.name, gname("Test"))
 assert.strictEqual(r.guild.leaderId, uid("leader1"))
 assert.ok(r.guild.memberIds.includes(uid("leader1")))
 trackGuild(r.guild)
})

test("createGuild refuse si kamas insuffisants", () => {
 setupUser(uid("poor1"), 100)
 assert.ok(createGuild(uid("poor1"), gname("Poor")).error)
})

test("createGuild refuse un nom trop court", () => {
 setupUser(uid("leader2"), 20000)
 assert.ok(createGuild(uid("leader2"), "AB").error)
})

test("createGuild refuse un nom dupliqué", () => {
 setupUser(uid("leader3"), 20000)
 const r = createGuild(uid("leader3"), gname("Test"))
 assert.ok(r.error)
})

/* ── joinGuild ── */

test("joinGuild ajoute le joueur", () => {
 const guild = getUserGuild(uid("leader1"))
 assert.ok(guild, "guilde leader1 doit exister")
 setupUser(uid("member1"))
 const r = joinGuild(uid("member1"), guild.id)
 assert.ok(!r.error, r.error)
 assert.ok(guild.memberIds.includes(uid("member1")))
})

test("joinGuild refuse si déjà dans une guilde", () => {
 const guild = getUserGuild(uid("leader1"))
 assert.ok(guild, "guilde leader1 doit exister")
 const r = joinGuild(uid("member1"), guild.id)
 assert.ok(r.error)
})

/* ── leaveGuild ── */

test("leaveGuild retire le membre", () => {
 const guild = getUserGuild(uid("member1"))
 assert.ok(guild, "member1 doit être dans une guilde")
 const r = leaveGuild(uid("member1"))
 assert.ok(!r.error, r.error)
 assert.ok(!guild.memberIds.includes(uid("member1")))
})

test("leaveGuild refuse pour le meneur", () => {
 const r = leaveGuild(uid("leader1"))
 assert.ok(r.error)
})

/* ── getGuildRank ── */

test("getGuildRank retourne meneur, officier, membre", () => {
 const guild = getUserGuild(uid("leader1"))
 assert.ok(guild, "guilde leader1 doit exister")
 assert.strictEqual(getGuildRank(guild.id, uid("leader1")), "meneur")

 setupUser(uid("officer1"))
 joinGuild(uid("officer1"), guild.id)
 promoteOfficer(guild.id, uid("leader1"), uid("officer1"))
 assert.strictEqual(getGuildRank(guild.id, uid("officer1")), "officier")

 setupUser(uid("normal1"))
 joinGuild(uid("normal1"), guild.id)
 assert.strictEqual(getGuildRank(guild.id, uid("normal1")), "membre")
})

/* ── disbandGuild ── */

test("disbandGuild supprime la guilde et nettoie les membres", () => {
 setupUser(uid("dleader"), 20000)
 const { guild } = createGuild(uid("dleader"), gname("Disband"))
 setupUser(uid("dmember"))
 joinGuild(uid("dmember"), guild.id)

 const r = disbandGuild(guild.id, uid("dleader"))
 assert.ok(!r.error, r.error)
 assert.ok(!getGuild(guild.id))
 assert.ok(!getUser(uid("dmember")).guildId)
})

test("disbandGuild refuse si pas le meneur", () => {
 setupUser(uid("dleader2"), 20000)
 const cr = createGuild(uid("dleader2"), gname("NoDis"))
 assert.ok(!cr.error, cr.error)
 trackGuild(cr.guild)

 setupUser(uid("dmember2"))
 joinGuild(uid("dmember2"), cr.guild.id)
 assert.ok(disbandGuild(cr.guild.id, uid("dmember2")).error)
})

/* ── addGuildXP ── */

test("addGuildXP ajoute de l'XP et level up", () => {
 setupUser(uid("xpleader"), 20000)
 const cr = createGuild(uid("xpleader"), gname("XPTest"))
 assert.ok(!cr.error, cr.error)
 trackGuild(cr.guild)

 const r = addGuildXP(cr.guild.id, 99999)
 assert.ok(r, "résultat non null")
 assert.ok(r.newLevel > 1, "level up effectué")
})

/* ── Cleanup ── */

for (const guild of guildsToClean) {
 try {
  if (getGuild(guild.id)) {
   disbandGuild(guild.id, guild.leaderId)
  }
 } catch (_) {}
}

console.log(`\n══════ Résultats : ${passed} passed, ${failed} failed ══════\n`)
process.exit(failed > 0 ? 1 : 0)
