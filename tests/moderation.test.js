/* ═══════════════════════════════════════════════
   TESTS — systems/moderationSystem.js
   Couvre : sanctions (add, remove, check, expiry),
            noluck (add, remove, check, expiry),
            getAllSanctions cleanup
═══════════════════════════════════════════════ */

const assert = require("assert")

const {
 sanctionPlayer,
 unsanctionPlayer,
 isSanctioned,
 getSanction,
 getAllSanctions,
 setNoluck,
 removeNoluck,
 hasNoluck,
 getNoluck
} = require("../systems/moderationSystem")

let passed = 0
let failed = 0

function test(name, fn) {
 try {
  fn()
  console.log(`  ✅ ${name}`)
  passed++
 } catch (e) {
  console.error(`  ❌ ${name}`)
  console.error(`     ${e.message}`)
  failed++
 }
}

/* ── Helper : ID unique pour chaque test ── */
const RUN = Date.now().toString(36).slice(-5)
function uid(base) { return `mod_${base}_${RUN}` }

console.log("\n══════ TESTS moderationSystem.js ══════\n")

/* ═══════════════════════════════════════════════
   SANCTIONS
═══════════════════════════════════════════════ */

console.log("── Sanctions ──\n")

test("sanctionPlayer crée une sanction temporaire", () => {
 const id = uid("s1")
 const entry = sanctionPlayer(id, 60000, "test", "admin")
 assert.ok(entry, "entry existe")
 assert.ok(entry.endsAt > Date.now(), "endsAt dans le futur")
 assert.strictEqual(entry.reason, "test")
 assert.strictEqual(entry.by, "admin")
})

test("sanctionPlayer crée une sanction permanente (duration 0)", () => {
 const id = uid("s2")
 const entry = sanctionPlayer(id, 0, "permanent", "admin")
 assert.strictEqual(entry.endsAt, null, "endsAt est null pour permanent")
})

test("isSanctioned retourne true pour un joueur sanctionné", () => {
 const id = uid("s3")
 sanctionPlayer(id, 60000, "test", "admin")
 assert.strictEqual(isSanctioned(id), true)
})

test("isSanctioned retourne true pour une sanction permanente", () => {
 const id = uid("s4")
 sanctionPlayer(id, 0, "perma", "admin")
 assert.strictEqual(isSanctioned(id), true)
})

test("isSanctioned retourne false pour un joueur non sanctionné", () => {
 const id = uid("s5_clean")
 assert.strictEqual(isSanctioned(id), false)
})

test("isSanctioned nettoie les sanctions expirées", () => {
 const id = uid("s6")
 /* Sanction qui expire immédiatement (1ms dans le passé) */
 sanctionPlayer(id, 1, "expired", "admin")

 /* Petit délai pour garantir l'expiration */
 const start = Date.now()
 while (Date.now() - start < 5) { void 0 } /* busy wait 5ms */

 assert.strictEqual(isSanctioned(id), false, "sanction expirée = non sanctionné")
})

test("getSanction retourne l'entrée pour un joueur sanctionné", () => {
 const id = uid("s7")
 sanctionPlayer(id, 60000, "raison test", "mod123")
 const entry = getSanction(id)
 assert.ok(entry)
 assert.strictEqual(entry.reason, "raison test")
 assert.strictEqual(entry.by, "mod123")
})

test("getSanction retourne null pour un joueur non sanctionné", () => {
 const id = uid("s8_clean")
 assert.strictEqual(getSanction(id), null)
})

test("unsanctionPlayer lève une sanction existante", () => {
 const id = uid("s9")
 sanctionPlayer(id, 60000, "temp", "admin")
 assert.strictEqual(isSanctioned(id), true)

 const result = unsanctionPlayer(id)
 assert.strictEqual(result, true, "retourne true")
 assert.strictEqual(isSanctioned(id), false, "plus sanctionné")
})

test("unsanctionPlayer retourne false si pas de sanction", () => {
 const id = uid("s10_clean")
 assert.strictEqual(unsanctionPlayer(id), false)
})

test("getAllSanctions retourne les sanctions actives", () => {
 const id = uid("s11")
 sanctionPlayer(id, 60000, "active", "admin")
 const all = getAllSanctions()
 assert.ok(all[id], "sanction présente dans le résultat")
})

test("sanctionPlayer avec raison par défaut", () => {
 const id = uid("s12")
 const entry = sanctionPlayer(id, 5000)
 assert.strictEqual(entry.reason, "Aucune raison précisée")
 assert.strictEqual(entry.by, "inconnu")
})

/* ═══════════════════════════════════════════════
   NOLUCK (MALCHANCE)
═══════════════════════════════════════════════ */

console.log("\n── Noluck ──\n")

test("setNoluck active le mode malchance", () => {
 const id = uid("n1")
 const entry = setNoluck(id, 60000, "triche", "mod")
 assert.ok(entry)
 assert.ok(entry.endsAt > Date.now())
 assert.strictEqual(entry.reason, "triche")
})

test("setNoluck permanent (duration 0)", () => {
 const id = uid("n2")
 const entry = setNoluck(id, 0, "perma", "admin")
 assert.strictEqual(entry.endsAt, null)
})

test("hasNoluck retourne true pour un joueur en malchance", () => {
 const id = uid("n3")
 setNoluck(id, 60000, "test", "mod")
 assert.strictEqual(hasNoluck(id), true)
})

test("hasNoluck retourne false pour un joueur normal", () => {
 const id = uid("n4_clean")
 assert.strictEqual(hasNoluck(id), false)
})

test("hasNoluck nettoie les entrées expirées", () => {
 const id = uid("n5")
 setNoluck(id, 1, "expired", "mod")

 const start = Date.now()
 while (Date.now() - start < 5) { void 0 }

 assert.strictEqual(hasNoluck(id), false)
})

test("getNoluck retourne l'entrée active", () => {
 const id = uid("n6")
 setNoluck(id, 60000, "raison", "mod")
 const entry = getNoluck(id)
 assert.ok(entry)
 assert.strictEqual(entry.reason, "raison")
})

test("getNoluck retourne null si pas de malchance", () => {
 const id = uid("n7_clean")
 assert.strictEqual(getNoluck(id), null)
})

test("removeNoluck retire le mode malchance", () => {
 const id = uid("n8")
 setNoluck(id, 60000, "temp", "mod")
 assert.strictEqual(hasNoluck(id), true)

 const result = removeNoluck(id)
 assert.strictEqual(result, true)
 assert.strictEqual(hasNoluck(id), false)
})

test("removeNoluck retourne false si pas de malchance", () => {
 const id = uid("n9_clean")
 assert.strictEqual(removeNoluck(id), false)
})

/* ═══════════════════════════════════════════════
   RÉSULTATS
═══════════════════════════════════════════════ */

console.log(`\n══════ Résultats : ${passed} passed, ${failed} failed ══════\n`)
process.exit(failed > 0 ? 1 : 0)
