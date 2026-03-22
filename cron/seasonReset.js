const { runSeasonReset } = require("../systems/battlePassService")

function run() {
 const dryRun = process.argv.includes("--dry-run")
 const result = runSeasonReset({ dryRun })
 console.log(`[seasonReset] ${dryRun ? "dry-run" : "live"} result:`)
 console.log(JSON.stringify(result, null, 2))
}

run()
