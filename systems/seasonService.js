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
  } else if ([8, 12, 24, 32].includes(level)) {
   freeReward = { level, type: "fragment_random", quantity: 1, value: 1, pool: "all" }
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
  } else if ([12, 18, 24, 38].includes(level)) {
   premiumReward = { level, type: "fragment_random", quantity: 3, value: 3, pool: "season" }
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

function buildSeasonAchievementsV3(seasonId) {
 const theme = getSeasonTheme(seasonId)
 const p = theme.prefix

 const fixed = [
  { id: `${p}_fixed_01`, name: "Eveil de saison", description: "Atteindre le niveau 5 du Battle Pass cette saison.", type: "season_level", target: 5, reward: { bpXp: 150, kamas: 300 } },
  { id: `${p}_fixed_02`, name: "Premier cap", description: "Atteindre le niveau 10 du Battle Pass cette saison.", type: "season_level", target: 10, reward: { bpXp: 250, kamas: 500 } },
  { id: `${p}_fixed_03`, name: "Montee reguliere", description: "Atteindre le niveau 20 du Battle Pass cette saison.", type: "season_level", target: 20, reward: { bpXp: 400, kamas: 900 } },
  { id: `${p}_fixed_04`, name: "Ascension", description: "Atteindre le niveau 30 du Battle Pass cette saison.", type: "season_level", target: 30, reward: { bpXp: 700, kamas: 1400 } },
  { id: `${p}_fixed_05`, name: "Sommet de saison", description: "Atteindre le niveau 40 du Battle Pass cette saison.", type: "season_level", target: 40, reward: { bpXp: 1200, kamas: 2500 }, secret: true },
  { id: `${p}_fixed_06`, name: "Ouverture simple", description: "Ouvrir 10 packs /krosmoz cette saison.", type: "season_packs", target: 10, reward: { bpXp: 250, kamas: 400 } },
  { id: `${p}_fixed_07`, name: "Ouverture soutenue", description: "Ouvrir 25 packs /krosmoz cette saison.", type: "season_packs", target: 25, reward: { bpXp: 500, kamas: 900 } },
  { id: `${p}_fixed_08`, name: "Routine solide", description: "Reclamer le daily 7 fois cette saison.", type: "season_daily", target: 7, reward: { bpXp: 300, kamas: 500 } },
  { id: `${p}_fixed_09`, name: "Main d'alchimiste", description: "Effectuer 10 fusions cette saison.", type: "season_fusions", target: 10, reward: { bpXp: 450, kamas: 700 } },
  { id: `${p}_fixed_10`, name: "Set complet", description: "Completer 1 set entier cette saison.", type: "season_sets", target: 1, reward: { bpXp: 900, kamas: 2000 } },
  { id: `${p}_fixed_11`, name: "Ecaflip prudent", description: "Jouer 10 fois a la roulette cette saison.", type: "season_roulette", target: 10, reward: { bpXp: 350, kamas: 600 } },
  { id: `${p}_fixed_12`, name: "Ecaflip dechaine", description: "Jouer 30 fois a la roulette cette saison.", type: "season_roulette", target: 30, reward: { bpXp: 900, kamas: 1600 }, secret: true }
 ]

 const themed = [
  { id: `${p}_theme_01`, name: `${theme.name} - Eclaireur`, description: `Ouvrir 5 packs pendant ${theme.name}.`, type: "season_packs", target: 5, reward: { bpXp: 150, kamas: 250 } },
  { id: `${p}_theme_02`, name: `${theme.name} - Habitude`, description: `Reclamer le daily 3 fois pendant ${theme.name}.`, type: "season_daily", target: 3, reward: { bpXp: 120, kamas: 200 } },
  { id: `${p}_theme_03`, name: `${theme.name} - Artisan`, description: `Effectuer 3 fusions pendant ${theme.name}.`, type: "season_fusions", target: 3, reward: { bpXp: 150, kamas: 250 } },
  { id: `${p}_theme_04`, name: `${theme.name} - Curieux`, description: `Ouvrir 1 pack d'event pendant ${theme.name}.`, type: "season_events", target: 1, reward: { bpXp: 180, kamas: 300 } },
  { id: `${p}_theme_05`, name: `${theme.name} - Constance`, description: `Atteindre le niveau 15 pendant ${theme.name}.`, type: "season_level", target: 15, reward: { bpXp: 260, kamas: 450 } },
  { id: `${p}_theme_06`, name: `${theme.name} - Marathon`, description: `Ouvrir 40 packs pendant ${theme.name}.`, type: "season_packs", target: 40, reward: { bpXp: 850, kamas: 1800 }, secret: true },
  { id: `${p}_theme_07`, name: `${theme.name} - Fidelite`, description: `Reclamer le daily 14 fois pendant ${theme.name}.`, type: "season_daily", target: 14, reward: { bpXp: 650, kamas: 1200 } },
  { id: `${p}_theme_08`, name: `${theme.name} - Technique`, description: `Effectuer 20 fusions pendant ${theme.name}.`, type: "season_fusions", target: 20, reward: { bpXp: 800, kamas: 1500 } },
  { id: `${p}_theme_09`, name: `${theme.name} - Spectacle`, description: `Ouvrir 3 packs d'event pendant ${theme.name}.`, type: "season_events", target: 3, reward: { bpXp: 700, kamas: 1300 } },
  { id: `${p}_theme_10`, name: `${theme.name} - Collection`, description: `Completer 2 sets entiers pendant ${theme.name}.`, type: "season_sets", target: 2, reward: { bpXp: 1200, kamas: 3000 }, secret: true }
 ]

 return [...fixed, ...themed]
}

/* ─── Season Template ────────────────────────────────────────────────────── */

function buildSeasonTemplate(seasonId) {
 const theme   = getSeasonTheme(seasonId)
 const xpCurve = buildXpCurve()
 const rewards = buildLevelRewards(seasonId)

 return {
  schemaVersion:      1,
  achievementsVersion: 5,
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
  achievements:    buildSeasonAchievementsV3(seasonId),
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

const GLOBAL_ACHIEVEMENTS_V3 = [
 { id: "global_daily_1",    name: "Premier Lever",           description: "Reclamer le daily 1 fois.",             type: "daily_claims",   target: 1,      reward: { bpXp: 50 } },
 { id: "global_daily_7",    name: "Regulier",                description: "Reclamer le daily 7 fois.",             type: "daily_claims",   target: 7,      reward: { bpXp: 300, kamas: 200 } },
 { id: "global_daily_21",   name: "Discipline",              description: "Reclamer le daily 21 fois.",            type: "daily_claims",   target: 21,     reward: { bpXp: 800, kamas: 500 } },
 { id: "global_daily_50",   name: "Rituel absolu",           description: "Reclamer le daily 50 fois.",            type: "daily_claims",   target: 50,     reward: { bpXp: 1400, kamas: 1200 } },
 { id: "global_pack_1",     name: "Premier Pack",            description: "Ouvrir 1 pack via /krosmoz.",           type: "packs_opened",   target: 1,      reward: { bpXp: 100 } },
 { id: "global_pack_10",    name: "Collectionneur",          description: "Ouvrir 10 packs via /krosmoz.",         type: "packs_opened",   target: 10,     reward: { bpXp: 400 } },
 { id: "global_pack_50",    name: "Grand Collectionneur",    description: "Ouvrir 50 packs via /krosmoz.",         type: "packs_opened",   target: 50,     reward: { bpXp: 1000 } },
 { id: "global_pack_100",   name: "Avaleur de packs",        description: "Ouvrir 100 packs via /krosmoz.",        type: "packs_opened",   target: 100,    reward: { bpXp: 1700, kamas: 1500 } },
 { id: "global_pack_250",   name: "Archive vivante",         description: "Ouvrir 250 packs via /krosmoz.",        type: "packs_opened",   target: 250,    reward: { bpXp: 2600, kamas: 3000 }, secret: true },
 { id: "global_ssr_1",      name: "L'Elu",                   description: "Obtenir 1 carte SSR.",                  type: "ssr_cards",      target: 1,      reward: { bpXp: 300 } },
 { id: "global_ssr_5",      name: "Destine",                 description: "Obtenir 5 cartes SSR.",                 type: "ssr_cards",      target: 5,      reward: { bpXp: 800 } },
 { id: "global_ssr_15",     name: "Aimant legendaire",       description: "Obtenir 15 cartes SSR.",                type: "ssr_cards",      target: 15,     reward: { bpXp: 1500, kamas: 1200 } },
 { id: "global_ssr_30",     name: "Convergence doree",       description: "Obtenir 30 cartes SSR.",                type: "ssr_cards",      target: 30,     reward: { bpXp: 2400, kamas: 2200 } },
 { id: "global_shiny_1",    name: "Rayon de lumiere",        description: "Obtenir 1 SSR Shiny.",                  type: "shiny_cards",    target: 1,      reward: { bpXp: 500 } },
 { id: "global_shiny_3",    name: "Miroir du destin",        description: "Obtenir 3 SSR Shiny.",                  type: "shiny_cards",    target: 3,      reward: { bpXp: 1400, kamas: 1600 } },
 { id: "global_rare_1",     name: "Chasse au tresor",        description: "Obtenir 1 carte rare (HR ou plus).",    type: "rare_cards",     target: 1,      reward: { bpXp: 150 } },
 { id: "global_rare_10",    name: "Chasseur d'elites",       description: "Obtenir 10 cartes rares (HR ou plus).", type: "rare_cards",     target: 10,     reward: { bpXp: 500 } },
 { id: "global_rare_25",    name: "Radar HR+",               description: "Obtenir 25 cartes rares (HR ou plus).", type: "rare_cards",     target: 25,     reward: { bpXp: 1000, kamas: 900 } },
 { id: "global_rare_50",    name: "Collection premium",      description: "Obtenir 50 cartes rares (HR ou plus).", type: "rare_cards",     target: 50,     reward: { bpXp: 1800, kamas: 1800 } },
 { id: "global_set_1",      name: "Architecte",              description: "Completer 1 set de cartes.",            type: "sets_completed", target: 1,      reward: { bpXp: 400 } },
 { id: "global_set_3",      name: "Macon runique",           description: "Completer 3 sets de cartes.",           type: "sets_completed", target: 3,      reward: { bpXp: 700, kamas: 600 } },
 { id: "global_set_5",      name: "Batisseur",               description: "Completer 5 sets de cartes.",           type: "sets_completed", target: 5,      reward: { bpXp: 900 } },
 { id: "global_set_10",     name: "Maitre architecte",       description: "Completer 10 sets de cartes.",          type: "sets_completed", target: 10,     reward: { bpXp: 1500 } },
 { id: "global_set_25",     name: "Cartographe total",       description: "Completer 25 sets de cartes.",          type: "sets_completed", target: 25,     reward: { bpXp: 2800, kamas: 2500 }, secret: true },
 { id: "global_fusion_1",   name: "Alchimiste",              description: "Effectuer 1 fusion via /fusion.",       type: "fusions",        target: 1,      reward: { bpXp: 150 } },
 { id: "global_fusion_10",  name: "Grand alchimiste",        description: "Effectuer 10 fusions.",                 type: "fusions",        target: 10,     reward: { bpXp: 600 } },
 { id: "global_fusion_25",  name: "Maitre de la fusion",     description: "Effectuer 25 fusions.",                 type: "fusions",        target: 25,     reward: { bpXp: 1200 } },
 { id: "global_fusion_50",  name: "Forge de saison",         description: "Effectuer 50 fusions.",                 type: "fusions",        target: 50,     reward: { bpXp: 1800, kamas: 1400 } },
 { id: "global_fusion_100", name: "Transmutateur supreme",   description: "Effectuer 100 fusions.",                type: "fusions",        target: 100,    reward: { bpXp: 2600, kamas: 2400 } },
 { id: "global_market_1",   name: "Marchand",                description: "Vendre 1 carte sur le marche.",         type: "market_sales",   target: 1,      reward: { bpXp: 100 } },
 { id: "global_market_20",  name: "Negociant",               description: "Vendre 20 cartes sur le marche.",       type: "market_sales",   target: 20,     reward: { bpXp: 500 } },
 { id: "global_market_50",  name: "Courtier",                description: "Vendre 50 cartes sur le marche.",       type: "market_sales",   target: 50,     reward: { bpXp: 900, kamas: 800 } },
 { id: "global_market_100", name: "Salle des ventes",        description: "Vendre 100 cartes sur le marche.",      type: "market_sales",   target: 100,    reward: { bpXp: 1500, kamas: 1500 } },
 { id: "global_event_1",    name: "Participant",             description: "Ouvrir 1 pack d'event.",                type: "events",         target: 1,      reward: { bpXp: 200 } },
 { id: "global_event_5",    name: "Heros des evenements",    description: "Ouvrir 5 packs d'event.",               type: "events",         target: 5,      reward: { bpXp: 700 } },
 { id: "global_event_10",   name: "Habitue des portails",    description: "Ouvrir 10 packs d'event.",              type: "events",         target: 10,     reward: { bpXp: 1200, kamas: 900 } },
 { id: "global_event_25",   name: "Spectateur cosmique",     description: "Ouvrir 25 packs d'event.",              type: "events",         target: 25,     reward: { bpXp: 2200, kamas: 1800 } },
 { id: "global_roulette_5",  name: "Main d'Ecaflip",          description: "Jouer 5 fois a la roulette.",           type: "roulette_spins", target: 5,      reward: { bpXp: 250, kamas: 300 } },
 { id: "global_roulette_25", name: "Table chaude",            description: "Jouer 25 fois a la roulette.",          type: "roulette_spins", target: 25,     reward: { bpXp: 900, kamas: 900 } },
 { id: "global_roulette_75", name: "Roi des tours",           description: "Jouer 75 fois a la roulette.",          type: "roulette_spins", target: 75,     reward: { bpXp: 2000, kamas: 2200 }, secret: true },
 { id: "global_bp_10",      name: "Apprenti passeur",        description: "Atteindre le niveau 10 du Battle Pass.", type: "level",         target: 10,     reward: { bpXp: 200 } },
 { id: "global_bp_20",      name: "Ascendant",               description: "Atteindre le niveau 20 du Battle Pass.", type: "level",         target: 20,     reward: { bpXp: 400 } },
 { id: "global_bp_40",      name: "Transcendant",            description: "Atteindre le niveau 40 du Battle Pass.", type: "level",         target: 40,     reward: { bpXp: 1000 }, secret: true },
 { id: "global_bp_60",      name: "Au-dela du pass",         description: "Atteindre le niveau 60 du Battle Pass.", type: "level",         target: 60,     reward: { bpXp: 1800, kamas: 1500 } },
 { id: "global_bp_100",     name: "Infini en marche",        description: "Atteindre le niveau 100 du Battle Pass.", type: "level",        target: 100,    reward: { bpXp: 3000, kamas: 3000 }, secret: true },
 { id: "global_bp_all6",    name: "Collectionneur des Dofus",description: "Completer les 6 saisons du cycle Battle Pass.", type: "all6",   target: 6,      reward: { bpXp: 2000 }, secret: true },
 { id: "global_premium_1",  name: "Investissement",          description: "Acheter le Pass Premium une fois.",     type: "premium_buy",    target: 1,      reward: { bpXp: 300 } },
 { id: "global_premium_3",  name: "Fidele premium",          description: "Acheter le Pass Premium 3 fois.",       type: "premium_buy",    target: 3,      reward: { bpXp: 1000, kamas: 1200 } },
 { id: "global_premium_6",  name: "Pilier premium",          description: "Acheter le Pass Premium 6 fois.",       type: "premium_buy",    target: 6,      reward: { bpXp: 2200, kamas: 2600 } },
 { id: "global_kamas_5k",   name: "Petite fortune",          description: "Gagner 5 000 kamas au total.",          type: "kamas_earned",   target: 5000,   reward: { bpXp: 200 } },
 { id: "global_kamas_20k",  name: "Grande fortune",          description: "Gagner 20 000 kamas au total.",         type: "kamas_earned",   target: 20000,  reward: { bpXp: 600 } },
 { id: "global_kamas_50k",  name: "Richesse legendaire",     description: "Gagner 50 000 kamas au total.",         type: "kamas_earned",   target: 50000,  reward: { bpXp: 1000 } },
 { id: "global_kamas_100k", name: "Moteur economique",       description: "Gagner 100 000 kamas au total.",        type: "kamas_earned",   target: 100000, reward: { bpXp: 1800, kamas: 1600 } },
 { id: "global_kamas_250k", name: "Banque du pass",          description: "Gagner 250 000 kamas au total.",        type: "kamas_earned",   target: 250000, reward: { bpXp: 2800, kamas: 3000 }, secret: true },
 { id: "global_title_5",    name: "Porte-voix",              description: "Posseder 5 titres debloques.",          type: "titles_owned",   target: 5,      reward: { bpXp: 300 } },
 { id: "global_title_10",   name: "Collection de noms",      description: "Posseder 10 titres debloques.",         type: "titles_owned",   target: 10,     reward: { bpXp: 700, kamas: 700 } },
 { id: "global_title_25",   name: "Galerie d'identites",     description: "Posseder 25 titres debloques.",         type: "titles_owned",   target: 25,     reward: { bpXp: 1400, kamas: 1500 } },
 { id: "global_title_50",   name: "Bibliotheque de titres",  description: "Posseder 50 titres debloques.",         type: "titles_owned",   target: 50,     reward: { bpXp: 2400, kamas: 2600 } },
 { id: "global_title_100",  name: "Couronne des noms",       description: "Posseder 100 titres debloques.",        type: "titles_owned",   target: 100,    reward: { bpXp: 4000, kamas: 4000 }, secret: true },
 { id: "global_badge_5",    name: "Arborant la gloire",      description: "Posseder 5 badges debloques.",          type: "badges_owned",   target: 5,      reward: { bpXp: 500 } },
 { id: "global_badge_10",   name: "Mur de medailles",        description: "Posseder 10 badges debloques.",         type: "badges_owned",   target: 10,     reward: { bpXp: 900, kamas: 800 } },
 { id: "global_badge_25",   name: "Vitrine complete",        description: "Posseder 25 badges debloques.",         type: "badges_owned",   target: 25,     reward: { bpXp: 1800, kamas: 1600 } },
 { id: "global_badge_50",   name: "Parade d'honneur",        description: "Posseder 50 badges debloques.",         type: "badges_owned",   target: 50,     reward: { bpXp: 2800, kamas: 2800 } },
 { id: "global_badge_100",  name: "Hall of fame",            description: "Posseder 100 badges debloques.",        type: "badges_owned",   target: 100,    reward: { bpXp: 4500, kamas: 4500 }, secret: true }
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
   return (existing.schemaVersion || 1) < 5
  } catch (_) { return true }
 })()

 if (needsRegen) {
  writeAtomic(globalPath, { schemaVersion: 5, achievements: GLOBAL_ACHIEVEMENTS_V3 })
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
 if (!current.activeSeason || !CYCLE.includes(current.activeSeason)) { current.activeSeason = CYCLE[0]; changed = true }
 if (!Number.isInteger(current.cycleIndex) || current.cycleIndex < 0 || current.cycleIndex >= CYCLE.length) {
  current.cycleIndex = CYCLE.indexOf(current.activeSeason)
  if (current.cycleIndex < 0) current.cycleIndex = 0
  changed = true
 }
 if (!current.startDate) { current.startDate = today; changed = true }
 if (!current.endDate) { current.endDate = addDaysDateOnly(current.startDate, DEFAULT_DURATION_DAYS); changed = true }
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
if (!Array.isArray(data.achievements) || data.achievements.length < 20 || (data.achievementsVersion || 1) < 5) {
  merged.achievements        = fallback.achievements
  merged.achievementsVersion = 5
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
