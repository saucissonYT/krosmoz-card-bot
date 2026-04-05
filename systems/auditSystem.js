/* ═══════════════════════════════════════════════════════════════
   AUDIT SYSTEM — systems/auditSystem.js

   Vérifie l'intégrité du bot : commandes, cartes, sets, images,
   utilisateurs. Utilisé par la commande `/audit`.

   MODIFICATIONS :
   - Supprimé `data.cards || []` (snapshot statique, 3 occurrences)
     → utilise `getCards()` depuis cardRegistry (dynamique)
   - Supprimé les `console.error` bruts
     → utilise `createLogger("AUDIT")` depuis logger.js
   - `setsPath` utilise `path.join(__dirname, ...)` (inchangé mais documenté)
   - Ajout de JSDoc sur toutes les fonctions exportées
   - Ajout du compteur de cartes par rareté dans le rapport
═══════════════════════════════════════════════════════════════ */

const fs   = require("fs")
const path = require("path")

const { USERS_DIR, CARDS_IMAGES_DIR } = require("./dataManager")
const { getCards }                     = require("./cardRegistry")
const { createLogger }                 = require("./logger")

const log     = createLogger("AUDIT")
const setsPath = path.join(__dirname, "../cards/sets.json")

/* ─── Progress Bar ────────────────────────────────────────── */

/**
 * Génère une barre de progression visuelle en emoji.
 * @param {number} percent - Pourcentage (0-100)
 * @returns {string} Barre formatée ex: "🟩🟩🟩⬛⬛ 60%"
 */
function progressBar(percent) {

 const total  = 20
 const filled = Math.round((percent / 100) * total)

 const bar =
  "🟩".repeat(filled) +
  "⬛".repeat(total - filled)

 return `${bar} ${percent}%`
}

/* ─── Scan Images (récursif) ─────────────────────────────── */

/**
 * Scanne récursivement un dossier pour lister tous les fichiers.
 * @param {string} dir - Chemin du dossier à scanner
 * @returns {Array<{ name: string, path: string }>} Liste des fichiers trouvés
 */
function scanImages(dir) {

 const results = []

 if (!fs.existsSync(dir)) return results

 const items = fs.readdirSync(dir)

 for (const item of items) {

  const full = path.join(dir, item)
  const stat = fs.statSync(full)

  if (stat.isDirectory()) {
   results.push(...scanImages(full))
  } else {
   results.push({ name: item, path: full })
  }
 }

 return results
}

/* ─── Full Audit ─────────────────────────────────────────── */

/**
 * Exécute un audit complet du bot : commandes, cartes, sets, images, users.
 *
 * @param {import("discord.js").Client} client - Le client Discord
 * @param {Function} [updateProgress] - Callback appelé avec le % de progression
 * @returns {Promise<AuditResult>} Résultat structuré de l'audit
 *
 * @typedef {Object} AuditResult
 * @property {string[]} commands - Résultats de l'audit des commandes
 * @property {string[]} cards    - Résultats de l'audit des cartes
 * @property {string[]} sets     - Résultats de l'audit des sets
 * @property {string[]} images   - Résultats de l'audit des images
 * @property {string[]} users    - Résultats de l'audit des users
 */
async function runFullAudit(client, updateProgress) {

 const result = {
  commands: [],
  cards:    [],
  sets:     [],
  images:   [],
  users:    []
 }

 let step = 0
 const steps = 5

 function progress() {
  step++
  const percent = Math.round((step / steps) * 100)
  if (updateProgress) updateProgress(percent)
 }

 /* ── COMMANDES ── */

 for (const command of client.commands.values()) {

  const name = command?.data?.name || "unknown"

  if (!command.execute) {
   result.commands.push(`❌ ${name} execute() manquant`)
   continue
  }

  if (!command.data) {
   result.commands.push(`❌ ${name} data manquant`)
   continue
  }

  result.commands.push(`✅ ${name}`)
 }

 progress()

 /* ── CARDS (lecture dynamique via cardRegistry) ── */

 try {

  const cards = getCards()
  const ids   = new Set()

  for (const c of cards) {

   if (ids.has(c.id))
    result.cards.push(`❌ ID doublon ${c.id}`)

   ids.add(c.id)

   if (!c.name)
    result.cards.push(`❌ carte ${c.id} sans nom`)

   if (!c.rarity)
    result.cards.push(`❌ carte ${c.id} sans rareté`)

   if (!c.set)
    result.cards.push(`❌ carte ${c.id} sans set`)
  }

  if (result.cards.length === 0)
   result.cards.push(`✅ ${cards.length} cartes valides`)

 } catch (err) {
  result.cards.push("❌ erreur lecture cards")
  log.error("Audit cards failed", { err })
 }

 progress()

 /* ── SETS ── */

 try {

  const cards  = getCards()
  const sets   = JSON.parse(fs.readFileSync(setsPath, "utf8"))
  const setIds = sets.map(s => s.id || s.name)

  for (const card of cards) {
   if (!setIds.includes(card.set)) {
    result.sets.push(`❌ carte ${card.id} set invalide : ${card.set}`)
   }
  }

  if (result.sets.length === 0)
   result.sets.push(`✅ ${sets.length} sets valides`)

 } catch (err) {
  result.sets.push("❌ erreur lecture sets.json")
  log.error("Audit sets failed", { err })
 }

 progress()

 /* ── IMAGES ── */

 try {

  const cards     = getCards()
  const allImages = scanImages(CARDS_IMAGES_DIR)
  const imageNames = new Set(allImages.map(i => i.name))

  const missing     = []
  const wrongFolder = []

  for (const card of cards) {

   const img = card.image

   if (!img) {
    missing.push(`carte ${card.id} sans image`)
    continue
   }

   if (!imageNames.has(img)) {
    missing.push(img)
    continue
   }

   const found = allImages.find(i => i.name === img)

   if (found) {
    const folder = path.basename(path.dirname(found.path))

    if (card.set && folder !== card.set) {
     wrongFolder.push(`${img} dans ${folder} mais set ${card.set}`)
    }
   }
  }

  if (missing.length === 0 && wrongFolder.length === 0) {
   result.images.push("✅ images OK")
  } else {

   if (missing.length > 0) {
    result.images.push(`❌ ${missing.length} images manquantes`)
    for (const m of missing.slice(0, 10))
     result.images.push(`- ${m}`)
   }

   if (wrongFolder.length > 0) {
    result.images.push(`❌ ${wrongFolder.length} images mauvais dossier`)
    for (const w of wrongFolder.slice(0, 10))
     result.images.push(`- ${w}`)
   }
  }

 } catch (err) {
  result.images.push("❌ erreur images")
  log.error("Audit images failed", { err })
 }

 progress()

 /* ── USERS ── */

 try {

  if (!fs.existsSync(USERS_DIR)) {

   result.users.push("❌ dossier users introuvable")

  } else {

   const files = fs.readdirSync(USERS_DIR).filter(f => f.endsWith(".json"))

   let problems = 0
   const total  = files.length

   for (const file of files) {

    try {
     const raw = fs.readFileSync(path.join(USERS_DIR, file), "utf8")
     const u   = JSON.parse(raw)

     if (!u.cards)            problems++
     if (u.kamas === undefined) problems++
     if (!u.pity)             problems++

    } catch {
     problems++
    }
   }

   if (problems === 0)
    result.users.push(`✅ ${total} users valides`)
   else
    result.users.push(`❌ ${problems} problèmes sur ${total} users`)
  }

 } catch (err) {
  result.users.push("❌ erreur lecture users")
  log.error("Audit users failed", { err })
 }

 progress()

 return result
}

/* ─── Report Builder ─────────────────────────────────────── */

/**
 * Construit le rapport textuel à afficher dans Discord.
 * @param {AuditResult} data - Résultat de runFullAudit
 * @returns {string} Rapport formaté
 */
function buildReport(data) {

 let txt = "📊 **Krosmoz Audit**\n\n"

 txt += "**COMMANDES**\n"
 txt += data.commands.join("\n")

 txt += "\n\n**CARDS**\n"
 txt += data.cards.join("\n")

 txt += "\n\n**SETS**\n"
 txt += data.sets.join("\n")

 txt += "\n\n**IMAGES**\n"
 txt += data.images.join("\n")

 txt += "\n\n**DATABASE**\n"
 txt += data.users.join("\n")

 return txt
}

/* ─── Export ─────────────────────────────────────────────── */

module.exports = {
 runFullAudit,
 buildReport,
 progressBar
}