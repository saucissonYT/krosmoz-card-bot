const fs = require("fs")
const path = require("path")

const ALLOWED_RARITIES = ["C", "U", "R", "SR", "HR", "UR", "S", "SSR"]
const RESET_TOKEN = "YES_DELETE_EVERYTHING"

const REPO_ROOT = path.resolve(__dirname, "..")
const SOURCE_IMAGES_DIR = path.join(REPO_ROOT, "cards", "images")
const GENERATED_CATALOG_PATH = path.join(REPO_ROOT, "cards", "catalog.generated.json")
const SETS_PATH = path.join(REPO_ROOT, "cards", "sets.json")
const LOCAL_MANIFEST_PATH = path.join(
 REPO_ROOT,
 "data",
 "cards",
 "wakfu-encyclopedie",
 "manifest.json"
)

function parseArgs(argv) {
 const args = {
  prepareRepo: false,
  execute: false,
  dryRun: false,
  base: null,
  source: SOURCE_IMAGES_DIR,
  resetToken: process.env.RESET_KROSMOZ_DATA || "",
 }

 for (let i = 0; i < argv.length; i++) {
  const arg = argv[i]
  if (arg === "--prepare-repo") args.prepareRepo = true
  else if (arg === "--execute") args.execute = true
  else if (arg === "--dry-run") args.dryRun = true
  else if (arg === "--confirm-reset") args.resetToken = argv[++i] || ""
  else if (arg === "--base") args.base = argv[++i] || null
  else if (arg === "--source") args.source = path.resolve(argv[++i] || SOURCE_IMAGES_DIR)
  else if (arg === "--help") {
   printHelp()
   process.exit(0)
  }
  else {
   throw new Error(`Argument inconnu: ${arg}`)
  }
 }

 return args
}

function printHelp() {
 console.log(`
Usage:
  node scripts/resetAndImportCards.js --prepare-repo
  node scripts/resetAndImportCards.js --dry-run
  node scripts/resetAndImportCards.js --execute --confirm-reset ${RESET_TOKEN}

Options:
  --prepare-repo              Genere cards/catalog.generated.json et cards/sets.json.
  --dry-run                   Affiche le plan sans modifier /data.
  --execute                   Vide la data serveur et importe le nouveau catalogue.
  --confirm-reset <token>     Requis pour --execute. Token: ${RESET_TOKEN}
  --base <path>               Base data cible. Defaut: /data si present, sinon ./data.
  --source <path>             Dossier source des images. Defaut: cards/images.
`)
}

function getTargetBase(explicitBase) {
 if (explicitBase) return path.resolve(explicitBase)
 if (fs.existsSync("/data")) return "/data"
 return path.join(REPO_ROOT, "data")
}

function readJson(file, fallback) {
 try {
  if (!fs.existsSync(file)) return fallback
  return JSON.parse(fs.readFileSync(file, "utf8"))
 } catch (err) {
  throw new Error(`Impossible de lire ${file}: ${err.message}`)
 }
}

function writeJson(file, value) {
 fs.mkdirSync(path.dirname(file), { recursive: true })
 fs.writeFileSync(file, `${JSON.stringify(value, null, 2)}\n`, "utf8")
}

function toPosix(value) {
 return String(value || "").replace(/\\/g, "/")
}

function parseLevelFromSet(setId) {
 const match = String(setId || "").match(/lvl-(\d+)-(\d+)/i)
 if (!match) return { min: 9999, max: 9999 }
 return { min: Number(match[1]), max: Number(match[2]) }
}

function parseLevelFromFilename(file) {
 const match = String(file || "").match(/__lvl-(\d+)/i)
 return match ? Number(match[1]) : null
}

function setNameFromId(setId) {
 const level = parseLevelFromSet(setId)
 const base = String(setId || "")
  .replace(/-lvl-\d+-\d+$/i, "")
  .split("-")
  .filter(Boolean)
  .map(part => part.charAt(0).toUpperCase() + part.slice(1))
  .join(" ")

 if (level.min !== 9999) return `${base} (${level.min}-${level.max})`
 return base || setId
}

function fallbackNameFromFile(file) {
 const slug = path.parse(file).name.replace(/__lvl-\d+$/i, "")
 return slug
  .split("-")
  .filter(Boolean)
  .map((part, index) => {
   if (["d", "de", "des", "du", "la", "le", "les", "l", "a"].includes(part) && index > 0) {
    return part
   }
   return part.charAt(0).toUpperCase() + part.slice(1)
  })
  .join(" ")
  .replace(/\bD ([aeiouy])/gi, "d'$1")
  .replace(/\bL ([aeiouy])/gi, "l'$1")
}

function buildManifestLookup(preferGenerated) {
 const generated = preferGenerated ? readJson(GENERATED_CATALOG_PATH, null) : null
 if (generated && Array.isArray(generated.cards)) {
  const lookup = new Map()
  for (const card of generated.cards) {
   if (!card.sourcePath) continue
   lookup.set(toPosix(card.sourcePath), card)
  }
  return lookup
 }

 const manifest = readJson(LOCAL_MANIFEST_PATH, null)
 const items = Array.isArray(manifest?.items) ? manifest.items : []
 const lookup = new Map()

 for (const item of items) {
  const file = toPosix(item.file)
  const marker = "/images/"
  const markerIndex = file.indexOf(marker)
  if (markerIndex === -1) continue
  const sourcePath = file.slice(markerIndex + marker.length)
  lookup.set(sourcePath, {
   sourceId: item.id ? String(item.id) : undefined,
   name: item.name || undefined,
   level: item.level || undefined,
   category: item.category || undefined,
   pageUrl: item.pageUrl || undefined,
   imageUrl: item.imageUrl || undefined,
  })
 }

 return lookup
}

function listSourceCards(sourceDir, options = {}) {
 if (!fs.existsSync(sourceDir)) {
  throw new Error(`Dossier source introuvable: ${sourceDir}`)
 }

 const manifestLookup = buildManifestLookup(options.preferGenerated !== false)
 const sets = fs.readdirSync(sourceDir, { withFileTypes: true })
  .filter(entry => entry.isDirectory())
  .map(entry => entry.name)
  .sort((a, b) => {
   const la = parseLevelFromSet(a)
   const lb = parseLevelFromSet(b)
   if (la.min !== lb.min) return la.min - lb.min
   return a.localeCompare(b, "fr")
  })

 const cards = []

 for (const setId of sets) {
  const setDir = path.join(sourceDir, setId)
  const rarities = fs.readdirSync(setDir, { withFileTypes: true })
   .filter(entry => entry.isDirectory())
   .map(entry => entry.name.toUpperCase())
   .filter(rarity => ALLOWED_RARITIES.includes(rarity))
   .sort((a, b) => ALLOWED_RARITIES.indexOf(a) - ALLOWED_RARITIES.indexOf(b))

  for (const rarity of rarities) {
   const rarityDir = path.join(setDir, rarity)
   const files = fs.readdirSync(rarityDir, { withFileTypes: true })
    .filter(entry => entry.isFile() && /\.(png|webp)$/i.test(entry.name))
    .map(entry => entry.name)
    .sort((a, b) => a.localeCompare(b, "fr"))

   for (const file of files) {
    const sourcePath = toPosix(path.join(setId, rarity, file))
    const meta = manifestLookup.get(sourcePath) || {}
    const level = meta.level || (parseLevelFromFilename(file) ? `Niv. ${parseLevelFromFilename(file)}` : undefined)
    cards.push({
     id: cards.length + 1,
     name: meta.name || fallbackNameFromFile(file),
     set: setId,
     rarity,
     image: file,
     level,
     sourceId: meta.sourceId,
     category: meta.category,
     pageUrl: meta.pageUrl,
     imageUrl: meta.imageUrl,
     sourcePath,
    })
   }
  }
 }

 return {
  generatedAt: new Date().toISOString(),
  source: "cards/images",
  sets: buildSets(sets),
  cards,
 }
}

function buildSets(setIds) {
 return setIds.map(setId => ({
  id: setId,
  name: setNameFromId(setId),
  reward: 20000,
  levelMin: parseLevelFromSet(setId).min === 9999 ? null : parseLevelFromSet(setId).min,
  levelMax: parseLevelFromSet(setId).max === 9999 ? null : parseLevelFromSet(setId).max,
 }))
}

function summarize(cards, sets) {
 const bySet = new Map()
 const byRarity = new Map()

 for (const card of cards) {
  bySet.set(card.set, (bySet.get(card.set) || 0) + 1)
  byRarity.set(card.rarity, (byRarity.get(card.rarity) || 0) + 1)
 }

 return {
  cards: cards.length,
  sets: sets.length,
  bySet: Object.fromEntries(bySet),
  byRarity: Object.fromEntries(ALLOWED_RARITIES.map(rarity => [rarity, byRarity.get(rarity) || 0])),
 }
}

function assertCatalog(catalog) {
 const ids = new Set()
 const imageKeys = new Set()
 const errors = []

 for (const card of catalog.cards) {
  if (!card.id || ids.has(card.id)) errors.push(`ID invalide ou doublon: ${card.id}`)
  ids.add(card.id)
  if (!card.name) errors.push(`Carte ${card.id} sans nom`)
  if (!card.set) errors.push(`Carte ${card.id} sans set`)
  if (!ALLOWED_RARITIES.includes(card.rarity)) errors.push(`Carte ${card.id} rarete invalide: ${card.rarity}`)
  if (!card.image) errors.push(`Carte ${card.id} sans image`)
  const imageKey = `${card.set}/${card.image}`
  if (imageKeys.has(imageKey)) errors.push(`Image cible en doublon: ${imageKey}`)
  imageKeys.add(imageKey)
 }

 if (errors.length > 0) {
  throw new Error(`Catalogue invalide:\n${errors.slice(0, 30).join("\n")}`)
 }
}

function removeContents(dir) {
 if (!fs.existsSync(dir)) return
 for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
  const target = path.join(dir, entry.name)
  fs.rmSync(target, { recursive: true, force: true })
 }
}

function resetSqlite(base) {
 const dbPath = path.join(base, "krosmoz.db")
 if (!fs.existsSync(dbPath)) return { skipped: true }

 const Database = require("better-sqlite3")
 const db = new Database(dbPath)
 const tables = [
  "web_sessions",
  "battlepass_progress",
  "guilds",
  "market_history",
  "market",
  "user_recruit_history",
  "user_fragments",
  "user_cards",
  "users",
 ]

 const before = {}
 const after = {}

 db.transaction(() => {
  for (const table of tables) {
   const exists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name=?").get(table)
   if (!exists) continue
   before[table] = db.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get().count
   db.prepare(`DELETE FROM ${table}`).run()
   after[table] = db.prepare(`SELECT COUNT(*) AS count FROM ${table}`).get().count
  }
  db.prepare("DELETE FROM sqlite_sequence WHERE name IN ('market','market_history','user_fragments')").run()
 })()

 db.pragma("wal_checkpoint(TRUNCATE)")
 db.close()

 return { skipped: false, before, after }
}

function resetJsonState(base) {
 const filesToOverwrite = {
  [path.join(base, "cards.json")]: [],
  [path.join(base, "guilds.json")]: {},
  [path.join(base, "krosmoshop.json")]: { cards: [], updatedAt: null },
  [path.join(base, "scheduler-state.json")]: {},
  [path.join(base, "sets.json")]: [],
 }

 const filesToRemove = [
  "users.json",
  "market.json",
  "marketHistory.json",
  "market.json.migrated",
  "marketHistory.json.migrated",
 ]

 for (const [file, value] of Object.entries(filesToOverwrite)) {
  writeJson(file, value)
 }

 for (const file of filesToRemove) {
  fs.rmSync(path.join(base, file), { force: true })
 }

 fs.rmSync(path.join(base, "users"), { recursive: true, force: true })
 fs.rmSync(path.join(base, "users.migrated"), { recursive: true, force: true })
 fs.rmSync(path.join(base, "battlepass", "progress"), { recursive: true, force: true })
 fs.rmSync(path.join(base, "battlepass", "progress.migrated"), { recursive: true, force: true })
}

function copyImages(catalog, sourceDir, targetImagesDir) {
 removeContents(targetImagesDir)
 fs.mkdirSync(targetImagesDir, { recursive: true })

 let copied = 0
 for (const card of catalog.cards) {
  const source = path.join(sourceDir, ...card.sourcePath.split("/"))
  const targetDir = path.join(targetImagesDir, card.set)
  const target = path.join(targetDir, card.image)
  fs.mkdirSync(targetDir, { recursive: true })
  fs.copyFileSync(source, target)
  copied++
 }
 return copied
}

function writeImportedCatalog(base, catalog) {
 const runtimeCards = catalog.cards.map(card => ({
  id: card.id,
  name: card.name,
  set: card.set,
  rarity: card.rarity,
  image: card.image,
  level: card.level,
  sourceId: card.sourceId,
  category: card.category,
  pageUrl: card.pageUrl,
 }))

 writeJson(path.join(base, "cards.json"), runtimeCards)
 writeJson(path.join(base, "sets.json"), catalog.sets)
}

function prepareRepo(catalog) {
 writeJson(GENERATED_CATALOG_PATH, catalog)
 writeJson(SETS_PATH, catalog.sets)
}

function main() {
 const args = parseArgs(process.argv.slice(2))
 const catalog = listSourceCards(args.source, { preferGenerated: !args.prepareRepo })
 assertCatalog(catalog)
 const summary = summarize(catalog.cards, catalog.sets)

 if (args.prepareRepo) {
  prepareRepo(catalog)
  console.log("Preparation repo OK")
  console.log(JSON.stringify(summary, null, 2))
 }

 if (args.dryRun) {
  const base = getTargetBase(args.base)
  console.log("Dry-run reset/import")
  console.log(JSON.stringify({ base, source: args.source, ...summary }, null, 2))
 }

 if (args.execute) {
  if (args.resetToken !== RESET_TOKEN) {
   throw new Error(`Confirmation manquante. Relance avec --confirm-reset ${RESET_TOKEN}`)
  }

  const base = getTargetBase(args.base)
  const targetImagesDir = path.join(base, "cards", "images")

  fs.mkdirSync(base, { recursive: true })
  const sqlite = resetSqlite(base)
  resetJsonState(base)
  const copied = copyImages(catalog, args.source, targetImagesDir)
  writeImportedCatalog(base, catalog)

  console.log("Reset/import termine")
  console.log(JSON.stringify({
   base,
   source: args.source,
   copiedImages: copied,
   sqlite,
   ...summary,
  }, null, 2))
 }

 if (!args.prepareRepo && !args.dryRun && !args.execute) {
  printHelp()
 }
}

try {
 main()
} catch (err) {
 console.error(err.stack || err.message)
 process.exit(1)
}
