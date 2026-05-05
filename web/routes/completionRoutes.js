/* Routes: set pages and API */

const fs = require("fs")
const path = require("path")

const RARITY_ORDER = ["C", "U", "R", "SR", "HR", "UR", "S", "SSR"]
const WAKFU_DATA_DIR = path.join(process.cwd(), "data", "cards", "wakfu-encyclopedie")
const WAKFU_MANIFEST_PATH = path.join(WAKFU_DATA_DIR, "manifest.json")

const SET_META = [
 {
  id: "astrub",
  dir: "astrub-lvl-1-35",
  name: "Astrub",
  icon: "🏛️",
  levels: "Niveaux 1 a 35",
  description: "La cite des aventuriers rassemble les premieres cartes du voyage, des reliques de debutant aux equipements qui ouvrent la route du Krosmoz."
 },
 {
  id: "amakna",
  dir: "amakna-lvl-36-50",
  name: "Amakna",
  icon: "🌾",
  levels: "Niveaux 36 a 50",
  description: "Un set royal, agricole et plein de vieux secrets, entre champs, bouftous et objets marques par les premieres grandes explorations."
 },
 {
  id: "sufokia",
  dir: "sufokia-lvl-51-65",
  name: "Sufokia",
  icon: "🌊",
  levels: "Niveaux 51 a 65",
  description: "Des cartes marines, mecaniques et lumineuses, faconnees par les profondeurs, les quais et les machines sufokiennes."
 },
 {
  id: "kelba",
  dir: "kelba-lvl-66-80",
  name: "Kelba",
  icon: "🎪",
  levels: "Niveaux 66 a 80",
  description: "Marchands, affaires louches et trouvailles rares composent une collection nerveuse, faite pour ceux qui aiment les bonnes occasions."
 },
 {
  id: "katrepat",
  dir: "katrepat-lvl-81-95",
  name: "Katrepat",
  icon: "🔥",
  levels: "Niveaux 81 a 95",
  description: "Un set sombre, dangereux et taille pour les audacieux, avec des pieces qui sentent la malediction et les expeditions risquees."
 },
 {
  id: "sberg",
  dir: "sberg-lvl-96-110",
  name: "Sberg",
  icon: "❄️",
  levels: "Niveaux 96 a 110",
  description: "Les terres glacees, les legendes froides et les cartes rares donnent a cette tranche une allure rude et majestueuse."
 },
 {
  id: "shukrute",
  dir: "shukrute-lvl-111-125",
  name: "Shukrute",
  icon: "🜏",
  levels: "Niveaux 111 a 125",
  description: "Un set nerveux, infernal et charge de reliques etranges, pour les collectionneurs qui aiment les artefacts instables."
 },
 {
  id: "saharach",
  dir: "saharash-lvl-126-140",
  name: "Saharach",
  icon: "🏜️",
  levels: "Niveaux 126 a 140",
  description: "Poussiere, mirages et tresors perdus dans le sable composent une collection chaude, seche et pleine de surprises."
 },
 {
  id: "enutrosor",
  dir: "enutrosor-lvl-141-155",
  name: "Enutrosor",
  icon: "💎",
  levels: "Niveaux 141 a 155",
  description: "Richesses enfouies et artefacts de grands chasseurs de tresors brillent dans une tranche pensee pour les amoureux du butin."
 },
 {
  id: "xelorium",
  dir: "xelorium-lvl-156-170",
  name: "Xelorium",
  icon: "⏳",
  levels: "Niveaux 156 a 170",
  description: "Le temps se plie autour des cartes les plus instables, entre mecanismes, paradoxes et equipements d'une autre horloge."
 },
 {
  id: "moon",
  dir: "moon-lvl-171-185",
  name: "Moon",
  icon: "🌙",
  levels: "Niveaux 171 a 185",
  description: "Jungle sacree, masques anciens et trophees sauvages donnent a cette collection une energie tribale et precieuse."
 },
 {
  id: "zinit",
  dir: "zinit-lvl-186-200",
  name: "Zinit",
  icon: "⛰️",
  levels: "Niveaux 186 a 200",
  description: "L'ascension finale vers les cartes les plus convoitees, avec des objets puissants et une collection dense a maitriser."
 },
 {
  id: "osamosa",
  dir: "osamosa-lvl-201-215",
  name: "Osamosa",
  icon: "🐉",
  levels: "Niveaux 201 a 215",
  description: "Une collection bestiale, sauvage et pleine de puissance, marquee par les traces de creatures et d'equipements vivants."
 },
 {
  id: "ereboria",
  dir: "ereboria-lvl-216-230",
  name: "Ereboria",
  icon: "🌋",
  levels: "Niveaux 216 a 230",
  description: "Terres hostiles, ressources rares et equipements de legende nourrissent une tranche haute en tension et en recompenses."
 },
 {
  id: "brume",
  dir: "brume-lvl-231-245",
  name: "Brume",
  icon: "🦖",
  levels: "Niveaux 231 a 245",
  description: "Le set le plus haut, entre mystere et collection d'elite, pour les cartes qui se gagnent au bout de la progression."
 }
]

const SET_BY_ID = new Map(SET_META.map((set) => [set.id, set]))
const SET_BY_DIR = new Map(SET_META.map((set) => [set.dir, set]))

function normalizeSetId(value) {
 return String(value || "")
  .trim()
  .toLowerCase()
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .replace(/[^a-z0-9-]/g, "")
}

function readManifestItems() {
 const raw = fs.readFileSync(WAKFU_MANIFEST_PATH, "utf8")
 const parsed = JSON.parse(raw)
 return Array.isArray(parsed.items) ? parsed.items : []
}

function rarityFromFile(file) {
 const match = String(file || "").match(/\/(C|U|R|SR|HR|UR|S|SSR)\/[^/]+$/)
 return match ? match[1] : ""
}

function dirFromFile(file) {
 const match = String(file || "").match(/images\/([^/]+)\//)
 return match ? match[1] : ""
}

function publicImageUrl(file) {
 const normalized = String(file || "").replace(/\\/g, "/")
 return normalized.startsWith("/") ? normalized : `/${normalized}`
}

function getSetCounts(items) {
 const counts = new Map(SET_META.map((set) => [set.dir, 0]))
 for (const item of items) {
  const dir = dirFromFile(item?.file)
  if (counts.has(dir)) counts.set(dir, counts.get(dir) + 1)
 }
 return counts
}

function buildSetList() {
 const items = readManifestItems()
 const counts = getSetCounts(items)
 return SET_META.map((set) => ({
  id: set.id,
  name: set.name,
  icon: set.icon,
  levels: set.levels,
  description: set.description,
  count: counts.get(set.dir) || 0
 }))
}

function buildSetCompletion(set) {
 const groups = Object.fromEntries(RARITY_ORDER.map((rarity) => [rarity, []]))
 const items = readManifestItems()

 for (const item of items) {
  const file = String(item?.file || "")
  if (dirFromFile(file) !== set.dir) continue

  const rarity = rarityFromFile(file)
  if (!groups[rarity]) continue

  groups[rarity].push({
   id: String(item?.id || ""),
   name: String(item?.name || path.basename(file)),
   level: String(item?.level || ""),
   category: String(item?.category || ""),
   rarity,
   imageUrl: publicImageUrl(file),
   pageUrl: String(item?.pageUrl || "")
  })
 }

 for (const rarity of RARITY_ORDER) {
  groups[rarity].sort((a, b) => (
   a.name.localeCompare(b.name, "fr", { sensitivity: "base" }) ||
   a.id.localeCompare(b.id, "fr")
  ))
 }

 return {
  id: set.id,
  name: set.name,
  icon: set.icon,
  levels: set.levels,
  description: set.description,
  total: RARITY_ORDER.reduce((sum, rarity) => sum + groups[rarity].length, 0),
  rarities: RARITY_ORDER.map((rarity) => ({
   id: rarity,
   count: groups[rarity].length,
   cards: groups[rarity]
  }))
 }
}

module.exports = function mount(app, ctx) {
 const { PUBLIC_DIR } = ctx

 app.get("/sets", (req, res) => {
  return res.sendFile(path.join(PUBLIC_DIR, "Sets.html"))
 })

 app.get("/sets/:set", (req, res) => {
  return res.sendFile(path.join(PUBLIC_DIR, "SetDetail.html"))
 })

 app.get("/completion/:set", (req, res) => {
  return res.redirect(301, `/sets/${encodeURIComponent(String(req.params.set || ""))}`)
 })

 app.get("/api/set-catalog", (req, res) => {
  try {
   return res.json({ sets: buildSetList() })
  } catch (error) {
   console.error("[WEB] /api/set-catalog:", error)
   return res.status(500).json({ error: "Erreur serveur" })
  }
 })

 app.get("/api/set-catalog/:set", (req, res) => {
  try {
   const id = normalizeSetId(req.params.set)
   const set = SET_BY_ID.get(id) || SET_BY_DIR.get(id)
   if (!set) return res.status(404).json({ error: "Set introuvable" })
   return res.json(buildSetCompletion(set))
  } catch (error) {
   console.error("[WEB] /api/set-catalog/:set:", error)
   return res.status(500).json({ error: "Erreur serveur" })
  }
 })

 app.get("/api/completion/sets", (req, res) => {
  try {
   return res.json({ sets: buildSetList() })
  } catch (error) {
   console.error("[WEB] /api/completion/sets:", error)
   return res.status(500).json({ error: "Erreur serveur" })
  }
 })

 app.get("/api/completion/sets/:set", (req, res) => {
  try {
   const id = normalizeSetId(req.params.set)
   const set = SET_BY_ID.get(id) || SET_BY_DIR.get(id)
   if (!set) return res.status(404).json({ error: "Set introuvable" })
   return res.json(buildSetCompletion(set))
  } catch (error) {
   console.error("[WEB] /api/completion/sets/:set:", error)
   return res.status(500).json({ error: "Erreur serveur" })
  }
 })
}
