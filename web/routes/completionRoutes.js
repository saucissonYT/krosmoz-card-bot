/* Routes: set pages and API */

const path = require("path")

const RARITY_ORDER = ["C", "U", "R", "SR", "HR", "UR", "S", "SSR"]
const SET_ID_LEVEL_SUFFIX_RE = /-lvl-\d+-\d+$/

const SET_META = [
 {
  id: "astrub",
  dir: "astrub-lvl-1-35",
  name: "Astrub",
  levels: "Niveaux 1 a 35",
  description: "La cite des aventuriers rassemble les premieres cartes du voyage, des reliques de debutant aux equipements qui ouvrent la route du Krosmoz."
 },
 {
  id: "amakna",
  dir: "amakna-lvl-36-50",
  name: "Amakna",
  levels: "Niveaux 36 a 50",
  description: "Un set royal, agricole et plein de vieux secrets, entre champs, bouftous et objets marques par les premieres grandes explorations."
 },
 {
  id: "sufokia",
  dir: "sufokia-lvl-51-65",
  name: "Sufokia",
  levels: "Niveaux 51 a 65",
  description: "Des cartes marines, mecaniques et lumineuses, faconnees par les profondeurs, les quais et les machines sufokiennes."
 },
 {
  id: "kelba",
  dir: "kelba-lvl-66-80",
  name: "Kelba",
  levels: "Niveaux 66 a 80",
  description: "Marchands, affaires louches et trouvailles rares composent une collection nerveuse, faite pour ceux qui aiment les bonnes occasions."
 },
 {
  id: "katrepat",
  dir: "katrepat-lvl-81-95",
  name: "Katrepat",
  levels: "Niveaux 81 a 95",
  description: "Un set sombre, dangereux et taille pour les audacieux, avec des pieces qui sentent la malediction et les expeditions risquees."
 },
 {
  id: "sberg",
  dir: "sberg-lvl-96-110",
  name: "Sberg",
  levels: "Niveaux 96 a 110",
  description: "Les terres glacees, les legendes froides et les cartes rares donnent a cette tranche une allure rude et majestueuse."
 },
 {
  id: "shukrute",
  dir: "shukrute-lvl-111-125",
  name: "Shukrute",
  levels: "Niveaux 111 a 125",
  description: "Un set nerveux, infernal et charge de reliques etranges, pour les collectionneurs qui aiment les artefacts instables."
 },
 {
  id: "saharach",
 dir: "saharach-lvl-126-140",
  name: "Saharach",
  levels: "Niveaux 126 a 140",
  description: "Poussiere, mirages et tresors perdus dans le sable composent une collection chaude, seche et pleine de surprises."
 },
 {
  id: "enutrosor",
  dir: "enutrosor-lvl-141-155",
  name: "Enutrosor",
  levels: "Niveaux 141 a 155",
  description: "Richesses enfouies et artefacts de grands chasseurs de tresors brillent dans une tranche pensee pour les amoureux du butin."
 },
 {
  id: "xelorium",
  dir: "xelorium-lvl-156-170",
  name: "Xelorium",
  levels: "Niveaux 156 a 170",
  description: "Le temps se plie autour des cartes les plus instables, entre mecanismes, paradoxes et equipements d'une autre horloge."
 },
 {
  id: "moon",
  dir: "moon-lvl-171-185",
  name: "Moon",
  levels: "Niveaux 171 a 185",
  description: "Jungle sacree, masques anciens et trophees sauvages donnent a cette collection une energie tribale et precieuse."
 },
 {
  id: "zinit",
  dir: "zinit-lvl-186-200",
  name: "Zinit",
  levels: "Niveaux 186 a 200",
  description: "L'ascension finale vers les cartes les plus convoitees, avec des objets puissants et une collection dense a maitriser."
 },
 {
  id: "osamosa",
  dir: "osamosa-lvl-201-215",
  name: "Osamosa",
  levels: "Niveaux 201 a 215",
  description: "Une collection bestiale, sauvage et pleine de puissance, marquee par les traces de creatures et d'equipements vivants."
 },
 {
  id: "ereboria",
  dir: "ereboria-lvl-216-230",
  name: "Ereboria",
  levels: "Niveaux 216 a 230",
  description: "Terres hostiles, ressources rares et equipements de legende nourrissent une tranche haute en tension et en recompenses."
 },
 {
  id: "brume",
  dir: "brume-lvl-231-245",
  name: "Brume",
  levels: "Niveaux 231 a 245",
  description: "Le set le plus haut, entre mystere et collection d'elite, pour les cartes qui se gagnent au bout de la progression."
 }
]

const SET_BY_ID = new Map(SET_META.map((set) => [set.id, set]))
const SET_BY_DIR = new Map(SET_META.map((set) => [set.dir, set]))
const SET_ALIAS_FIXES = new Map([
 ["incarnam", "astrub"],
 ["saharash", "saharach"]
])
const SET_ICON_BY_ALIAS = new Map([
 ["astrub", "\uD83C\uDFDB\uFE0F"],
 ["amakna", "\uD83C\uDF3E"],
 ["sufokia", "\uD83C\uDF0A"],
 ["kelba", "\uD83C\uDFAA"],
 ["katrepat", "\uD83E\uDD87"],
 ["sberg", "\u2744\uFE0F"],
 ["shukrute", "\uD83D\uDE08"],
 ["saharach", "\uD83C\uDFDC\uFE0F"],
 ["enutrosor", "\uD83D\uDC8E"],
 ["xelorium", "\u23F3"],
 ["moon", "\uD83C\uDF19"],
 ["zinit", "\u26F0\uFE0F"],
 ["osamosa", "\uD83D\uDC09"],
 ["ereboria", "\uD83C\uDF0B"],
 ["brume", "\uD83E\uDD96"]
])
const SET_DESCRIPTION_BY_ALIAS = new Map([
 ["astrub", "La cite des aventuriers rassemble les premieres cartes du voyage et ouvre la route du Krosmoz."],
 ["amakna", "Un set royal, agricole et plein de vieux secrets, entre champs et premieres grandes explorations."],
 ["sufokia", "Des cartes marines, mecaniques et lumineuses, faconnees par les profondeurs et les quais sufokiens."],
 ["kelba", "Marchands, affaires louches et trouvailles rares composent une collection nerveuse."],
 ["katrepat", "Un set sombre, dangereux et taille pour les expeditions risquees."],
 ["sberg", "Les terres glacees et les legendes froides donnent a cette tranche une allure rude et majestueuse."],
 ["shukrute", "Un set nerveux, infernal et charge de reliques etranges."],
 ["saharach", "Poussiere, mirages et tresors perdus dans le sable composent une collection chaude et seche."],
 ["enutrosor", "Richesses enfouies et artefacts de grands chasseurs de tresors brillent dans cette tranche."],
 ["xelorium", "Le temps se plie autour des cartes les plus instables, entre mecanismes et paradoxes."],
 ["moon", "Jungle sacree, masques anciens et trophees sauvages donnent a cette collection une energie tribale."],
 ["zinit", "L'ascension finale vers les cartes les plus convoitees, avec des objets puissants et une collection dense."],
 ["osamosa", "Une collection sauvage et pleine de puissance, marquee par les traces d'equipements vivants."],
 ["ereboria", "Terres hostiles, ressources rares et equipements de legende nourrissent une tranche haute en tension."],
 ["brume", "Le set le plus haut, entre mystere et collection d'elite."]
])

function normalizeSetId(value) {
 return String(value || "")
  .trim()
  .toLowerCase()
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .replace(/[^a-z0-9-]/g, "")
}

function getSetAlias(value) {
 const normalized = normalizeSetId(value).replace(SET_ID_LEVEL_SUFFIX_RE, "")
 return SET_ALIAS_FIXES.get(normalized) || normalized
}

function getSetIcon(set) {
 const alias = getSetAlias(set?.id || set?.name)
 const icon = SET_ICON_BY_ALIAS.get(alias)
 if (icon) return icon
 const label = String(set?.name || alias || "Set").trim()
 return label.charAt(0).toUpperCase() || "S"
}

function getSetLevels(set) {
 const min = Number(set?.levelMin || 0)
 const max = Number(set?.levelMax || 0)
 if (min > 0 && max > 0) return `Niveaux ${min} a ${max}`
 return String(set?.levels || "Set")
}

function getSetLevelBounds(set) {
 const alias = getSetAlias(set?.id || set?.name)
 const legacy = SET_BY_ID.get(alias) || SET_BY_DIR.get(String(set?.id || ""))
 const min = Number(set?.levelMin || legacy?.levelMin || 0)
 const max = Number(set?.levelMax || legacy?.levelMax || 0)
 if (min > 0) return { min, max: max > 0 ? max : min }

 const source = `${set?.id || ""} ${set?.name || ""} ${set?.levels || legacy?.levels || ""}`
 const match = source.match(/(?:lvl-|\s)(\d+)\s*(?:-|a)\s*(\d+)/i)
 if (match) return { min: Number(match[1]), max: Number(match[2]) }

 return { min: 9999, max: 9999 }
}

function compareSetsByLevel(a, b) {
 const aBounds = getSetLevelBounds(a)
 const bBounds = getSetLevelBounds(b)
 if (aBounds.min !== bBounds.min) return aBounds.min - bBounds.min
 if (aBounds.max !== bBounds.max) return aBounds.max - bBounds.max
 return String(a?.name || a?.id || "").localeCompare(String(b?.name || b?.id || ""), "fr")
}

function enrichSet(set) {
 const alias = getSetAlias(set?.id || set?.name)
 const legacy = SET_BY_ID.get(alias) || SET_BY_DIR.get(String(set?.id || ""))
 return {
  id: set.id,
  name: set.name || legacy?.name || set.id,
  icon: getSetIcon(set),
  levels: getSetLevels(set),
  description: SET_DESCRIPTION_BY_ALIAS.get(alias) || legacy?.description || "",
  count: Number(set.totalCards || set.count || 0)
 }
}

function buildSetList(ctx) {
 return ctx.getSetsWithCounts().map(enrichSet).sort(compareSetsByLevel)
}

function findSet(ctx, value) {
 const wanted = normalizeSetId(value)
 const wantedAlias = getSetAlias(wanted)
 return ctx.getSets().find((set) => {
  const id = normalizeSetId(set?.id)
  if (id === wanted) return true
  return getSetAlias(id) === wantedAlias
 })
}

function buildSetCompletion(ctx, set) {
 const enriched = enrichSet({
  ...set,
  totalCards: ctx.getSetsWithCounts().find((item) => String(item.id) === String(set.id))?.totalCards || 0
 })
 const groups = Object.fromEntries(RARITY_ORDER.map((rarity) => [rarity, []]))
 const items = ctx.computeCardsCatalog({ set: set.id, sort: "name", order: "asc" }).items

 for (const item of items) {
  const rarity = String(item?.rarity || "").toUpperCase()
  if (!groups[rarity]) continue

  groups[rarity].push({
   id: String(item?.id || ""),
   name: String(item?.name || `Carte ${item?.id || ""}`),
   level: String(item?.level || ""),
   category: String(item?.category || ""),
   rarity,
   imageUrl: String(item?.imageUrl || ""),
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
  id: enriched.id,
  name: enriched.name,
  icon: enriched.icon,
  levels: enriched.levels,
  description: enriched.description,
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
   return res.json({ sets: buildSetList(ctx) })
  } catch (error) {
   console.error("[WEB] /api/set-catalog:", error)
   return res.status(500).json({ error: "Erreur serveur" })
  }
 })

 app.get("/api/set-catalog/:set", (req, res) => {
  try {
   const id = normalizeSetId(req.params.set)
   const set = findSet(ctx, id)
   if (!set) return res.status(404).json({ error: "Set introuvable" })
   return res.json(buildSetCompletion(ctx, set))
  } catch (error) {
   console.error("[WEB] /api/set-catalog/:set:", error)
   return res.status(500).json({ error: "Erreur serveur" })
  }
 })

 app.get("/api/completion/sets", (req, res) => {
  try {
   return res.json({ sets: buildSetList(ctx) })
  } catch (error) {
   console.error("[WEB] /api/completion/sets:", error)
   return res.status(500).json({ error: "Erreur serveur" })
  }
 })

 app.get("/api/completion/sets/:set", (req, res) => {
  try {
   const id = normalizeSetId(req.params.set)
   const set = findSet(ctx, id)
   if (!set) return res.status(404).json({ error: "Set introuvable" })
   return res.json(buildSetCompletion(ctx, set))
  } catch (error) {
   console.error("[WEB] /api/completion/sets/:set:", error)
   return res.status(500).json({ error: "Erreur serveur" })
  }
 })
}
