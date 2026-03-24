const fs = require("fs")
const path = require("path")
const { getCard } = require("./cardRegistry")

const CYCLE = ["emeraude", "pourpre", "turquoise", "ocre", "ivoire", "ebene"]
const DEFAULT_DURATION_DAYS = 21

/* ─── Paths ──────────────────────────────────────────────────────────────── */

function getBaseDataPath() {
 let base = "/data"
 if (!fs.existsSync(base)) base = path.join(process.cwd(), "data")
 if (!fs.existsSync(base)) fs.mkdirSync(base, { recursive: true })
 return base
}

function getBattlePassPaths() {
 const base = getBaseDataPath()
 const bp   = path.join(base, "battlepass")
 return {
  base,
  battlepass:       bp,
  progress:         path.join(bp, "progress"),
  seasons:          path.join(bp, "seasons"),
  archive:          path.join(bp, "archive"),
  currentSeason:    path.join(bp, "current_season.json"),
  seasonsCycle:     path.join(bp, "seasons_cycle.json"),
  globalAchievements: path.join(bp, "global_achievements.json")
 }
}

function ensureDir(dirPath) {
 if (!fs.existsSync(dirPath)) fs.mkdirSync(dirPath, { recursive: true })
}

function writeAtomic(filePath, data) {
 const content = JSON.stringify(data, null, 2)
 const tmpPath = `${filePath}.tmp`
 let lastErr = null
 for (let attempt = 0; attempt < 3; attempt++) {
  try {
   fs.writeFileSync(tmpPath, content, "utf8")
   fs.renameSync(tmpPath, filePath)
   return true
  } catch (err) { lastErr = err }
 }
 if (lastErr) throw lastErr
 return false
}

function readJson(filePath, fallbackValue) {
 if (!fs.existsSync(filePath)) return JSON.parse(JSON.stringify(fallbackValue))
 try {
  const raw = fs.readFileSync(filePath, "utf8")
  if (!raw || raw.trim() === "") return JSON.parse(JSON.stringify(fallbackValue))
  return JSON.parse(raw)
 } catch (err) {
  console.error("[seasonService] JSON read error:", filePath, err.message)
  return JSON.parse(JSON.stringify(fallbackValue))
 }
}

function toDateOnly(date) {
 return date.toISOString().split("T")[0]
}

function addDaysDateOnly(dateOnly, days) {
 const date = new Date(`${dateOnly}T00:00:00.000Z`)
 date.setUTCDate(date.getUTCDate() + days)
 return toDateOnly(date)
}

/* ─── XP Curve ───────────────────────────────────────────────────────────── */

function buildXpCurve() {
 const curve = []
 let total = 0
 for (let level = 1; level <= 40; level++) {
  let step = 1200
  if (level <= 8)       step = 600
  else if (level <= 16) step = 900
  else if (level <= 28) step = 1200
  else if (level <= 36) step = 1600
  else if (level <= 39) step = 2200
  else                  step = 4200
  total += step
  curve.push(total)
 }
 return curve
}

/* ─── Season Themes ──────────────────────────────────────────────────────── */

function getSeasonTheme(seasonId) {
 const map = {
  emeraude: {
   name: "Saison Emeraude", subtitle: "Les Vents du Destin",
   emoji: "🟢", color: "#1B6B3A", prefix: "em",
   freeTitle20: "Cavalier du Vent", premiumTitle40: "Gardien de l'Emeraude",
   badge40: "badge_emeraude_gold",
   passiveBonus: { type: "xp_boost", value: 1.2, description: "+20% XP Battle Pass pendant la saison" }
  },
  pourpre: {
   name: "Saison Pourpre", subtitle: "Les Flammes Eternelles",
   emoji: "🔴", color: "#8E1F1F", prefix: "po",
   freeTitle20: "Enfant de la Flamme", premiumTitle40: "Porteur du Pourpre",
   badge40: "badge_pourpre_gold",
   passiveBonus: { type: "kamas_gain", value: 1.25, description: "+25% kamas sur les gains" }
  },
  turquoise: {
   name: "Saison Turquoise", subtitle: "Les Eaux Profondes",
   emoji: "🟡", color: "#0F8B8D", prefix: "tu",
   freeTitle20: "Plongeur des Abysses", premiumTitle40: "Gardien Turquoise",
   badge40: "badge_turquoise_gold",
   passiveBonus: { type: "pack_double_drop", value: 0.2, description: "20% chance de double drop sur pack" }
  },
  ocre: {
   name: "Saison Ocre", subtitle: "La Foret Ancestrale",
   emoji: "🟠", color: "#A35A1F", prefix: "oc",
   freeTitle20: "Enfant de la Foret", premiumTitle40: "Ancien de l'Ocre",
   badge40: "badge_ocre_gold",
   passiveBonus: { type: "guild_xp_boost", value: 1.35, description: "+35% XP guilde" }
  },
  ivoire: {
   name: "Saison Ivoire", subtitle: "Le Souffle Blanc",
   emoji: "⚪", color: "#9FA5AF", prefix: "iv",
   freeTitle20: "Sage du Souffle", premiumTitle40: "Porteur de l'Ivoire",
   badge40: "badge_ivoire_gold",
   passiveBonus: { type: "fusion_cost_reduction", value: 0.75, description: "-25% cout fusion" }
  },
  ebene: {
   name: "Saison Ebene", subtitle: "Les Tenebres Fecondes",
   emoji: "⚫", color: "#222222", prefix: "eb",
   freeTitle20: "Marcheur des Ombres", premiumTitle40: "Maitre de l'Ebene",
   badge40: "badge_ebene_gold",
   passiveBonus: { type: "market_sell_bonus", value: 1.4, description: "+40% kamas ventes market" }
  }
 }
 return map[seasonId] || map["emeraude"]
}

/* ─── Level Rewards ──────────────────────────────────────────────────────── */

function buildLevelRewards(seasonId) {
 const theme       = getSeasonTheme(seasonId)
 const freeRewards    = []
 const premiumRewards = []

 for (let level = 1; level <= 40; level++) {
  let freeReward = level % 3 === 0
   ? { level, type: "pack", value: 1 }
   : level % 2 === 0
    ? { level, type: "player_xp", value: 200 + Math.floor(level * 15) }
    : { level, type: "kamas", value: 500 + Math.floor(level * 80) }

  if ([10, 20, 30, 40].includes(level)) {
   if (level === 10) freeReward = { level, type: "pack", value: 2 }
   else if (level === 20) freeReward = { level, type: "title", value: theme.freeTitle20 }
   else if (level === 30) freeReward = { level, type: "card_random_rare", value: 1 }
   else if (level === 40) freeReward = { level, type: "card_random_ssr", value: 1 }
  }
  freeRewards.push(freeReward)

  let premiumReward = level % 2 === 0
   ? { level, type: "player_xp", value: 350 + Math.floor(level * 20) }
   : { level, type: "kamas", value: 900 + Math.floor(level * 120) }

  if ([5, 10, 15, 20, 25, 30, 35, 40].includes(level)) {
   if (level === 5)       premiumReward = { level, type: "kamas", value: 2000 }
   else if (level === 10) premiumReward = { level, type: "kamas", value: 3000 }
   else if (level === 15) premiumReward = { level, type: "pack", value: 2 }
   else if (level === 20) premiumReward = { level, type: "pack", value: 4 }
   else if (level === 25) premiumReward = { level, type: "kamas", value: 6000 }
   else if (level === 30) premiumReward = { level, type: "card_random_ssr", value: 2 }
   else if (level === 35) premiumReward = { level, type: "pack", value: 6 }
   else if (level === 40) premiumReward = { level, type: "badge", value: theme.badge40 }
  }
  premiumRewards.push(premiumReward)
 }

 premiumRewards.push({ level: 40, type: "title", value: theme.premiumTitle40 })
 premiumRewards.push({ level: 40, type: "kamas", value: 8000 })

 return { freeRewards, premiumRewards }
}

/* ─── Season Achievements (version 2 — tous réalisables) ─────────────────
   Types saisonniers disponibles :
     season_level    → progress.currentLevel
     season_packs    → progress.stats.packsOpened
     season_daily    → progress.stats.dailyClaims
     season_fusions  → progress.stats.fusions
     season_events   → progress.stats.events
     season_sets     → progress.stats.setsCompleted (1 = compléter 1 set entier)
   Tous les targets sont réalisables en 21 jours.
─────────────────────────────────────────────────────────────────────────── */

function buildSeasonAchievements(seasonId) {
 const theme = getSeasonTheme(seasonId)
 const p     = theme.prefix
 return [
  {
   id: `${p}_01`, name: "Premiers Pas",
   description: "Atteindre le niveau 10 du Battle Pass cette saison.",
   type: "season_level", target: 10,
   reward: { bpXp: 200, kamas: 500 }
  },
  {
   id: `${p}_02`, name: "Montee en Puissance",
   description: "Atteindre le niveau 25 du Battle Pass cette saison.",
   type: "season_level", target: 25,
   reward: { bpXp: 500, kamas: 1500 }
  },
  {
   id: `${p}_03`, name: "Ouvreur de Saison",
   description: "Ouvrir 10 packs /krosmoz cette saison.",
   type: "season_packs", target: 10,
   reward: { bpXp: 300 }
  },
  {
   id: `${p}_04`, name: "Collectionneur de Saison",
   description: "Ouvrir 30 packs /krosmoz cette saison.",
   type: "season_packs", target: 30,
   reward: { bpXp: 700, kamas: 1000 }
  },
  {
   id: `${p}_05`, name: "Fidele du Quotidien",
   description: "Réclamer le daily 5 fois cette saison.",
   type: "season_daily", target: 5,
   reward: { bpXp: 250, kamas: 400 }
  },
  {
   id: `${p}_06`, name: "Alchimiste de Saison",
   description: "Effectuer 5 fusions cette saison.",
   type: "season_fusions", target: 5,
   reward: { bpXp: 300, kamas: 600 }
  },
  {
   id: `${p}_07`, name: "Completionniste",
   description: "Compléter entièrement 1 set de cartes cette saison.",
   type: "season_sets", target: 1,
   reward: { bpXp: 800, kamas: 2000 }
  }
 ]
}

/* ─── Season Template ────────────────────────────────────────────────────── */

function buildSeasonTemplate(seasonId) {
 const theme   = getSeasonTheme(seasonId)
 const xpCurve = buildXpCurve()
 const rewards = buildLevelRewards(seasonId)

 return {
  schemaVersion:      1,
  achievementsVersion: 2,
  seasonId,
  name:            theme.name,
  subtitle:        theme.subtitle,
  emoji:           theme.emoji,
  color:           theme.color,
  durationDays:    DEFAULT_DURATION_DAYS,
  totalLevels:     40,
  xpCurve,
  passiveBonus:    theme.passiveBonus,
  freeRewards:     rewards.freeRewards,
  premiumRewards:  rewards.premiumRewards,
  achievements:    buildSeasonAchievements(seasonId),
  bonusVersion:    2,
  rewardsVersion:  6,
  premiumPrice:    12000
 }
}

/* ─── sanitize card rewards ──────────────────────────────────────────────── */

function sanitizeMissingCardRewards(template) {
 let changed = false

 function replaceReward(reward, track) {
  if (!reward || reward.type !== "card") return reward
  if (reward.cardId && getCard(reward.cardId)) return reward
  changed = true
  if (track === "premium") return { level: reward.level, type: "kamas", value: 5000 }
  return { level: reward.level, type: "player_xp", value: 1600 }
 }

 template.freeRewards    = (template.freeRewards    || []).map((r) => replaceReward(r, "free"))
 template.premiumRewards = (template.premiumRewards || []).map((r) => replaceReward(r, "premium"))
 return changed
}

/* ─── Ensure Season Files ────────────────────────────────────────────────── */

/* Liste complète des achievements globaux (schemaVersion 2) */
const GLOBAL_ACHIEVEMENTS_V2 = [
 { id: "global_daily_1",   name: "Premier Lever",           description: "Réclamer le daily 1 fois.",             type: "daily_claims",  target: 1,      reward: { bpXp: 50 } },
 { id: "global_daily_7",   name: "Regulier",                description: "Réclamer le daily 7 fois.",             type: "daily_claims",  target: 7,      reward: { bpXp: 300,  kamas: 200 } },
 { id: "global_daily_21",  name: "Discipline",              description: "Réclamer le daily 21 fois.",            type: "daily_claims",  target: 21,     reward: { bpXp: 800,  kamas: 500 } },
 { id: "global_pack_1",    name: "Premier Pack",            description: "Ouvrir 1 pack via /krosmoz.",           type: "packs_opened",  target: 1,      reward: { bpXp: 100 } },
 { id: "global_pack_10",   name: "Collectionneur",          description: "Ouvrir 10 packs via /krosmoz.",         type: "packs_opened",  target: 10,     reward: { bpXp: 400 } },
 { id: "global_pack_50",   name: "Grand Collectionneur",    description: "Ouvrir 50 packs via /krosmoz.",         type: "packs_opened",  target: 50,     reward: { bpXp: 1000 } },
 { id: "global_ssr_1",     name: "L'Elu",                   description: "Obtenir 1 carte SSR 🌈.",               type: "ssr_cards",     target: 1,      reward: { bpXp: 300 } },
 { id: "global_ssr_5",     name: "Destine",                 description: "Obtenir 5 cartes SSR 🌈.",              type: "ssr_cards",     target: 5,      reward: { bpXp: 800 } },
 { id: "global_shiny_1",   name: "Rayon de Lumiere",        description: "Obtenir 1 SSR Shiny ✨.",               type: "shiny_cards",   target: 1,      reward: { bpXp: 500 } },
 { id: "global_rare_1",    name: "Chasse au Tresor",        description: "Obtenir 1 carte rare (HR ou plus).",    type: "rare_cards",    target: 1,      reward: { bpXp: 150 } },
 { id: "global_rare_10",   name: "Chasseur d'Elites",       description: "Obtenir 10 cartes rares (HR ou plus).", type: "rare_cards",    target: 10,     reward: { bpXp: 500 } },
 { id: "global_set_1",     name: "Architecte",              description: "Compléter 1 set de cartes.",            type: "sets_completed",target: 1,      reward: { bpXp: 400 } },
 { id: "global_set_5",     name: "Batisseur",               description: "Compléter 5 sets de cartes.",           type: "sets_completed",target: 5,      reward: { bpXp: 900 } },
 { id: "global_set_10",    name: "Maitre Architecte",       description: "Compléter 10 sets de cartes.",          type: "sets_completed",target: 10,     reward: { bpXp: 1500 } },
 { id: "global_fusion_1",  name: "Alchimiste",              description: "Effectuer 1 fusion via /fusion.",       type: "fusions",       target: 1,      reward: { bpXp: 150 } },
 { id: "global_fusion_10", name: "Grand Alchimiste",        description: "Effectuer 10 fusions.",                 type: "fusions",       target: 10,     reward: { bpXp: 600 } },
 { id: "global_fusion_25", name: "Maitre de la Fusion",     description: "Effectuer 25 fusions.",                 type: "fusions",       target: 25,     reward: { bpXp: 1200 } },
 { id: "global_market_1",  name: "Marchand",                description: "Vendre 1 carte sur le marché.",         type: "market_sales",  target: 1,      reward: { bpXp: 100 } },
 { id: "global_market_20", name: "Negociant",               description: "Vendre 20 cartes sur le marché.",       type: "market_sales",  target: 20,     reward: { bpXp: 500 } },
 { id: "global_event_1",   name: "Participant",             description: "Ouvrir 1 pack d'event.",                type: "events",        target: 1,      reward: { bpXp: 200 } },
 { id: "global_event_5",   name: "Heros des Evenements",    description: "Ouvrir 5 packs d'event.",               type: "events",        target: 5,      reward: { bpXp: 700 } },
 { id: "global_bp_20",     name: "Ascendant",               description: "Atteindre le niveau 20 du Battle Pass.",type: "level",         target: 20,     reward: { bpXp: 400 } },
 { id: "global_bp_40",     name: "Transcendant",            description: "Atteindre le niveau 40 du Battle Pass.",type: "level",         target: 40,     reward: { bpXp: 1000 } },
 { id: "global_bp_all6",   name: "Collectionneur des Dofus",description: "Compléter les 6 saisons du cycle Battle Pass.",type: "all6",  target: 6,      reward: { bpXp: 2000 } },
 { id: "global_premium_1", name: "Investissement",          description: "Acheter le Pass Premium une fois.",     type: "premium_buy",   target: 1,      reward: { bpXp: 300 } },
 { id: "global_kamas_5k",  name: "Petite Fortune",          description: "Gagner 5 000 kamas au total.",          type: "kamas_earned",  target: 5000,   reward: { bpXp: 200 } },
 { id: "global_kamas_20k", name: "Grande Fortune",          description: "Gagner 20 000 kamas au total.",         type: "kamas_earned",  target: 20000,  reward: { bpXp: 600 } },
 { id: "global_kamas_50k", name: "Richesse Legendaire",     description: "Gagner 50 000 kamas au total.",         type: "kamas_earned",  target: 50000,  reward: { bpXp: 1000 } },
 { id: "global_title_5",   name: "Porte-Voix",              description: "Posséder 5 titres débloqués.",          type: "titles_owned",  target: 5,      reward: { bpXp: 300 } },
 { id: "global_badge_3",   name: "Arborant la Gloire",      description: "Posséder 3 badges (succès débloqués).", type: "badges_owned",  target: 3,      reward: { bpXp: 400 } }
]

function ensureSeasonFiles() {
 const paths = getBattlePassPaths()

 ensureDir(paths.battlepass)
 ensureDir(paths.progress)
 ensureDir(paths.seasons)
 ensureDir(paths.archive)

 if (!fs.existsSync(paths.seasonsCycle)) {
  writeAtomic(paths.seasonsCycle, { schemaVersion: 1, cycle: CYCLE })
 }

 for (const seasonId of CYCLE) {
  const filePath = path.join(paths.seasons, `${seasonId}.json`)
  if (!fs.existsSync(filePath)) {
   writeAtomic(filePath, buildSeasonTemplate(seasonId))
  }
 }

 /* Global achievements — version 2 : régénérer si schemaVersion < 2 */
 const globalPath = paths.globalAchievements
 const globalExists = fs.existsSync(globalPath)
 const needsRegen = !globalExists || (() => {
  try {
   const existing = JSON.parse(fs.readFileSync(globalPath, "utf8"))
   return (existing.schemaVersion || 1) < 2
  } catch (_) { return true }
 })()

 if (needsRegen) {
  writeAtomic(globalPath, { schemaVersion: 2, achievements: GLOBAL_ACHIEVEMENTS_V2 })
 }
}

/* ─── ensureCurrentSeason ────────────────────────────────────────────────── */

function ensureCurrentSeason() {
 ensureSeasonFiles()

 const paths   = getBattlePassPaths()
 const today   = toDateOnly(new Date())
 const defaultCurrent = {
  schemaVersion: 1,
  activeSeason:  CYCLE[0],
  cycleIndex:    0,
  startDate:     today,
  endDate:       addDaysDateOnly(today, DEFAULT_DURATION_DAYS),
  previousSeasons: [],
  forcedByDev:   false
 }

 if (!fs.existsSync(paths.currentSeason)) {
  writeAtomic(paths.currentSeason, defaultCurrent)
  return defaultCurrent
 }

 const current = readJson(paths.currentSeason, defaultCurrent)
 let changed = false

 if (current.schemaVersion !== 1) { current.schemaVersion = 1; changed = true }
 if (!Array.isArray(current.previousSeasons)) { current.previousSeasons = []; changed = true }
 if (current.forcedByDev === undefined) { current.forcedByDev = false; changed = true }

 if (changed) writeAtomic(paths.currentSeason, current)
 return current
}

/* ─── getSeasonTemplate ──────────────────────────────────────────────────── */

function getSeasonTemplate(seasonId) {
 ensureSeasonFiles()

 const paths    = getBattlePassPaths()
 const fallback = buildSeasonTemplate(seasonId)
 const filePath = path.join(paths.seasons, `${seasonId}.json`)
 const data     = readJson(filePath, fallback)

 let changed = false
 const merged = { ...fallback, ...data }

 if (!Array.isArray(data.xpCurve) || data.xpCurve.length !== 40) {
  merged.xpCurve = fallback.xpCurve; changed = true
 }
 if (!Array.isArray(data.freeRewards) || data.freeRewards.length < 40) {
  merged.freeRewards = fallback.freeRewards; changed = true
 }
 if (!Array.isArray(data.premiumRewards) || data.premiumRewards.length < 8) {
  merged.premiumRewards = fallback.premiumRewards; changed = true
 }
 /* Régénérer les achievements si version < 2 */
 if (!Array.isArray(data.achievements) || data.achievements.length < 5 || (data.achievementsVersion || 1) < 2) {
  merged.achievements        = fallback.achievements
  merged.achievementsVersion = 2
  changed = true
 }
 if (!merged.passiveBonus) { merged.passiveBonus = fallback.passiveBonus; changed = true }
 if ((data.bonusVersion || 0) < 2) {
  merged.passiveBonus = fallback.passiveBonus; merged.bonusVersion = 2; changed = true
 }
 if ((data.rewardsVersion || 0) < 6) {
  merged.freeRewards    = fallback.freeRewards
  merged.premiumRewards = fallback.premiumRewards
  merged.rewardsVersion = 6; changed = true
 }

 if (sanitizeMissingCardRewards(merged)) changed = true
 if (changed) writeAtomic(filePath, merged)

 return merged
}

/* ─── misc ───────────────────────────────────────────────────────────────── */

function getSeasonCycle() {
 const paths = getBattlePassPaths()
 const data  = readJson(paths.seasonsCycle, { schemaVersion: 1, cycle: CYCLE })
 if (!Array.isArray(data.cycle) || data.cycle.length === 0) return [...CYCLE]
 return data.cycle
}

function setCurrentSeasonState(nextState) {
 const paths = getBattlePassPaths()
 writeAtomic(paths.currentSeason, nextState)
}

/* ─── Exports ────────────────────────────────────────────────────────────── */

module.exports = {
 CYCLE,
 DEFAULT_DURATION_DAYS,
 addDaysDateOnly,
 ensureCurrentSeason,
 ensureSeasonFiles,
 getBattlePassPaths,
 getSeasonCycle,
 getSeasonTemplate,
 readJson,
 setCurrentSeasonState,
 toDateOnly,
 writeAtomic
}