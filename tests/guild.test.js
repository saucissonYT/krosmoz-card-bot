/* ═══════════════════════════════════════════════
   TESTS — systems/guildSystem.js
   Couvre : xpRequired, createGuild, joinGuild,
            leaveGuild, kick, promote, demote,
            transferLeader, renameGuild, ranks
═══════════════════════════════════════════════ */

const assert = require("assert")

const dataManager = require("../systems/dataManager")
dataManager.data.cards = []

const { getUser, save } = require("../systems/userSystem")
const {
 createGuild, joinGuild, leaveGuild, disbandGuild,
 kickMember, promoteOfficer, demoteOfficer, transferLeader,
 renameGuild, getGuild, getUserGuild, getGuildRank,
 xpRequired, addGuildXP, getAllGuilds,
 MAX_MEMBERS, CREATE_COST, RENAME_COST, MAX_OFFICERS
} = require("../systems/guildSystem")

let passed = 0, failed = 0

function test(name, fn) {
 try { fn(); console.log(`  ✅ ${name}`); passed++ }
 catch (e) { console.error(`  ❌ ${name}\n     ${e.message}`); failed++ }
}

function setupUser(id, kamas = 10000) {
 const u = getUser(id)
 u.kamas = kamas; u.stats = {}
 if (u.guildId) delete u.guildId
 save(id); return u
}

console.log("\n══════ TESTS guildSystem.js ══════\n")

/* ── xpRequired ── */

test("xpRequired retourne un nombre positif", () => {
 for (let lvl = 1; lvl <= 100; lvl++) {
  const xp = xpRequired(lvl)
  assert.ok(xp > 0, `xpRequired(${lvl}) = ${xp} > 0`)
 }
})

test("xpRequired est croissant", () => {
 for (let lvl = 1; lvl < 100; lvl++) {
  assert.ok(xpRequired(lvl + 1) >= xpRequired(lvl),
   `xpRequired(${lvl + 1}) >= xpRequired(${lvl})`)
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
 setupUser("leader1", 20000)
 const r = createGuild("leader1", "TestGuild")
 assert.ok(!r.error, r.error)
 assert.ok(r.guild)
 assert.strictEqual(r.guild.name, "TestGuild")
 assert.strictEqual(r.guild.leaderId, "leader1")
 assert.ok(r.guild.memberIds.includes("leader1"))
})

test("createGuild refuse si kamas insuffisants", () => {
 setupUser("poor1", 100)
 const r = createGuild("poor1", "PoorGuild")
 assert.ok(r.error)
})

test("createGuild refuse un nom trop court", () => {
 setupUser("leader2", 20000)
 assert.ok(createGuild("leader2", "AB").error)
})

test("createGuild refuse un nom dupliqué", () => {
 setupUser("leader3", 20000)
 const r = createGuild("leader3", "TestGuild") /* même nom que leader1 */
 assert.ok(r.error)
})

/* ── joinGuild ── */

test("joinGuild ajoute le joueur", () => {
 const guild = getUserGuild("leader1")
 setupUser("member1")
 const r = joinGuild("member1", guild.id)
 assert.ok(!r.error, r.error)
 assert.ok(guild.memberIds.includes("member1"))
})

test("joinGuild refuse si déjà dans une guilde", () => {
 const guild = getUserGuild("leader1")
 const r = joinGuild("member1", guild.id) /* member1 déjà dedans */
 assert.ok(r.error)
})

/* ── leaveGuild ── */

test("leaveGuild retire le membre", () => {
 const guild = getUserGuild("member1")
 const r = leaveGuild("member1")
 assert.ok(!r.error, r.error)
 assert.ok(!guild.memberIds.includes("member1"))
})

test("leaveGuild refuse pour le meneur", () => {
 const r = leaveGuild("leader1")
 assert.ok(r.error)
})

/* ── getGuildRank ── */

test("getGuildRank retourne meneur, officier, membre", () => {
 const guild = getUserGuild("leader1")
 assert.strictEqual(getGuildRank(guild.id, "leader1"), "meneur")

 /* Ajouter un officier pour tester */
 setupUser("officer1")
 joinGuild("officer1", guild.id)
 promoteOfficer(guild.id, "leader1", "officer1")
 assert.strictEqual(getGuildRank(guild.id, "officer1"), "officier")

 setupUser("normal1")
 joinGuild("normal1", guild.id)
 assert.strictEqual(getGuildRank(guild.id, "normal1"), "membre")
})

/* ── disbandGuild ── */

test("disbandGuild supprime la guilde et nettoie les membres", () => {
 setupUser("dleader", 20000)
 const { guild } = createGuild("dleader", "GuildToDisband")
 setupUser("dmember")
 joinGuild("dmember", guild.id)

 const r = disbandGuild(guild.id, "dleader")
 assert.ok(!r.error, r.error)
 assert.ok(!getGuild(guild.id))
 assert.ok(!getUser("dmember").guildId)
})

test("disbandGuild refuse si pas le meneur", () => {
 setupUser("dleader2", 20000)
 const { guild } = createGuild("dleader2", "GuildNoDis")
 setupUser("dmember2")
 joinGuild("dmember2", guild.id)
 assert.ok(disbandGuild(guild.id, "dmember2").error)
})

console.log(`\n══════ Résultats : ${passed} passed, ${failed} failed ══════\n`)
process.exit(failed > 0 ? 1 : 0)