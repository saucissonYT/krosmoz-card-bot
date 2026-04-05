/* ═══════════════════════════════════════════════
   TEST RUNNER — lance tous les tests du dossier tests/
═══════════════════════════════════════════════ */

const { execSync } = require("child_process")
const fs = require("fs")
const path = require("path")

const TESTS_DIR = path.join(__dirname)
const files = fs.readdirSync(TESTS_DIR).filter(f => f.endsWith(".test.js"))

console.log("╔══════════════════════════════════════╗")
console.log("║       KROSMOZ CARD — TEST SUITE      ║")
console.log("╚══════════════════════════════════════╝\n")

let totalPassed = 0
let totalFailed = 0

for (const file of files) {
 console.log(`▸ ${file}`)
 try {
  execSync(`node ${path.join(TESTS_DIR, file)}`, {
   stdio: "inherit",
   timeout: 30000
  })
  totalPassed++
 } catch (e) {
  totalFailed++
 }
}

console.log("\n╔══════════════════════════════════════╗")
console.log(`║  Suites : ${totalPassed} ok, ${totalFailed} failed`)
console.log("╚══════════════════════════════════════╝\n")

process.exit(totalFailed > 0 ? 1 : 0)