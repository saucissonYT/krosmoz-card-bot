/* ===============================================
   ACHIEVEMENT REWARDS — Récompenses par tier
   
   Système centralisé de récompenses pour les succès.
   Chaque achievement est assigné à un tier (1-8) qui
   détermine ses récompenses en kamas, XP et packs.
   
   • Auto-détection du tier par patterns d'ID
   • Overrides manuels pour les cas spéciaux
   • Bonus +50% kamas pour les achievements secrets
=============================================== */

/* ================= TIERS DE RÉCOMPENSES ================= */

const REWARD_TIERS = {
 1: { kamas:100,   xp:15,   packs:0 },  /* Facile — premières actions */
 2: { kamas:200,   xp:30,   packs:0 },  /* Basique — petits paliers (10) */
 3: { kamas:400,   xp:60,   packs:0 },  /* Moyen — paliers moyens (25-50) */
 4: { kamas:750,   xp:120,  packs:0 },  /* Difficile — paliers élevés (100) */
 5: { kamas:1500,  xp:250,  packs:1 },  /* Très dur — gros paliers (250-300) */
 6: { kamas:3000,  xp:500,  packs:2 },  /* Extrême — paliers massifs (500) */
 7: { kamas:5000,  xp:1000, packs:3 },  /* Légendaire — top paliers (1000) */
 8: { kamas:10000, xp:2000, packs:5 },  /* Mythique — accomplissements ultimes */
}

/* ================= OVERRIDES MANUELS ================= */

const MANUAL_OVERRIDES = {

 /* ---- PACKS RNG (rares, déclenchés par condition spéciale) ---- */
 shinySSR:       3,
 packDivin:      4,
 pileOuFace:     2,
 impossible:     7,
 luckyStart:     5,
 hotHand:        6,
 threeStars:     3,
 pityBreaker:    4,
 nightPlayer:    2,
 ssrStreak:      5,

 /* ---- SPÉCIAUX COMPORTEMENTAUX ---- */
 packMinuit:     3,
 sellFast:       3,
 broke:          2,
 marketBothWays: 3,
 allTriggers:    7,
 hardPitySSR:    4,
 droughtSSR:     5,
 tradePartner5:  3,
 tradeBothWays:  3,
 allRarities:    4,
 veteran30:      3,
 active7days:    2,
 firstEventPack: 2,
 palindrome:     4,
 allC:           3,
 allU:           3,
 ssrLundi:       3,
 marketSSR:      3,
 speedTickets:   4,
 fusionSSR:      5,
 eventpackNoEvent:2,

 /* ---- HOARDER (même carte en masse) ---- */
 hoarder10:      2,
 hoarder25:      3,
 hoarder50:      4,
 hoarder100:     6,

 /* ---- JACKPOTS ---- */
 jackpotEnutrof1:  3,
 jackpotEnutrof5:  5,
 jackpotEnutrof10: 6,
 jackpotEnutrof25: 7,
 jackpotFeca1:     3,
 jackpotFeca5:     5,
 jackpotFeca10:    6,
 jackpotFeca25:    7,

 /* ---- KROSMOSHOP ---- */
 shopBuy1:    1,
 shopSSR:     4,
 shopS:       3,

 /* ---- PACKS EN STOCK (disponibles) ---- */
 packStock25:  3,
 packStock50:  4,
 packStock100: 5,
 packStock200: 6,
 packStock500: 7,

 /* ---- ROULETTE D'ECAFLIP ---- */
 roulette1:          1,
 roulette10:         2,
 roulette100:        4,
 roulette1000:       6,
 rouletteKamas5k:    2,
 rouletteKamas25k:   3,
 rouletteKamas100k:  5,
 rouletteKamas500k:  7,
 roulettePack1:      1,
 roulettePack10:     3,
 roulettePack50:     5,
 roulettePack150:    7,
 rouletteSSR1:       4,
 rouletteSSR3:       6,
 rouletteC10:        1,
 rouletteC25:        2,
 rouletteC50:        3,
 rouletteC100:       4,
 roulettePc10:       2,
 roulettePc25:       3,
 roulettePc50:       4,
 roulettePc100:      5,
 rouletteR5:         3,
 rouletteR20:        4,
 rouletteR40:        5,
 rouletteR70:        6,
 rouletteTr3:        4,
 rouletteTr10:       5,
 rouletteTr20:       6,
 rouletteTr40:       7,
 rouletteJ1:         7,
 rouletteJ3:         8,
 rouletteJ5:         8,
 rouletteJ10:        8,
 rouletteNuit:       3,
 rouletteMidi:       2,

 /* ---- NIVEAUX JOUEUR — paliers hauts (auto-détection insuffisante) ---- */
 level125:       6,  /* Extrême    — 3 000 kamas, 500 XP, 2 packs */
 level150:       7,  /* Légendaire — 5 000 kamas, 1 000 XP, 3 packs */
 level175:       7,  /* Légendaire — 5 000 kamas, 1 000 XP, 3 packs */
 level200:       8,  /* Mythique   — 10 000 kamas, 2 000 XP, 5 packs */

 /* ---- XP TOTALE — paliers hauts ---- */
 totalXP300k:    5,  /* Très dur   — 1 500 kamas, 250 XP, 1 pack */
 totalXP400k:    6,  /* Extrême    — 3 000 kamas, 500 XP, 2 packs */
 totalXP500k:    7,  /* Légendaire — 5 000 kamas, 1 000 XP, 3 packs */
 totalXP716k:    8,  /* Mythique   — 10 000 kamas, 2 000 XP, 5 packs */

 /* ---- GRIND QUOTIDIEN ---- */
 grind7:         2,  /* Basique    — 200 kamas, 30 XP */
 grind30:        4,  /* Difficile  — 750 kamas, 120 XP */
 grind100:       6,  /* Extrême    — 3 000 kamas, 500 XP, 2 packs */

 /* ---- FIDÉLITÉ ---- */
 fidelite7:      1,  /* Facile     — 100 kamas, 15 XP */
 fidelite30:     3,  /* Moyen      — 400 kamas, 60 XP */
 fidelite60:     4,  /* Difficile  — 750 kamas, 120 XP */
 fidelite100:    5,  /* Très dur   — 1 500 kamas, 250 XP, 1 pack */

 /* ---- PARCOURS COMPLET ---- */
 parcoursComplet: 7, /* Légendaire — 5 000 kamas, 1 000 XP, 3 packs */

 /* ---- SECRETS PROGRESSION ---- */
 levelPalindrome111: 4,  /* secret +50% → ~1 125 kamas */
 levelPalindrome151: 5,  /* secret +50% → ~2 250 kamas, 1 pack */
 levelPalindrome191: 5,  /* secret +50% → ~2 250 kamas, 1 pack */
 nightLevelUp:       4,  /* secret +50% → ~1 125 kamas */
 anniversaire:       6,  /* secret +50% → ~4 500 kamas, 2 packs */

 /* ---- PIÑATA D'ECAFLIP ---- */
 pinata1:            1,  /* Facile     — 100 kamas, 15 XP */
 pinata3:            2,  /* Basique    — 200 kamas, 30 XP */
 pinata10:           3,  /* Moyen      — 400 kamas, 60 XP */
 pinata25:           4,  /* Difficile  — 750 kamas, 120 XP */
 pinata50:           6,  /* Extrême    — 3 000 kamas, 500 XP, 2 packs */
 pinataSSR1:         4,  /* Difficile  — 750 kamas, 120 XP */
 pinataSSR3:         5,  /* Très dur   — 1 500 kamas, 250 XP, 1 pack */
 pinataSSR5:         6,  /* Extrême    — 3 000 kamas, 500 XP, 2 packs */
 pinataSSR10:        7,  /* Légendaire — 5 000 kamas, 1 000 XP, 3 packs (secret +50%) */
 pinataReact1:       1,  /* Facile */
 pinataReact50:      2,  /* Basique */
 pinataReact100:     3,  /* Moyen */
 pinataReact500:     5,  /* Très dur */
 pinataReact1000:    7,  /* Légendaire (secret +50%) */
 pinataKamas10k:     2,  /* Basique */
 pinataKamas50k:     4,  /* Difficile */
 pinataKamas200k:    6,  /* Extrême (secret +50%) */

}

/* ================= AUTO-DÉTECTION DU TIER ================= */

function autoDetectTier(id){

 const match = id.match(/(\d+)$/)

 if(!match) return 1

 const num = parseInt(match[1])

 if(num >= 1000) return 7
 if(num >= 500)  return 6
 if(num >= 250)  return 5
 if(num >= 100)  return 4
 if(num >= 50)   return 3
 if(num >= 10)   return 2

 return 1
}

/* ================= GET REWARD ================= */

function getAchievementReward(id, achievement){

 /* 1. Override manuel */
 let tier = MANUAL_OVERRIDES[id]

 /* 2. Auto-détection si pas d'override */
 if(tier === undefined){
  tier = autoDetectTier(id)
 }

 /* 3. Clamp le tier entre 1 et 8 */
 tier = Math.max(1, Math.min(8, tier))

 /* 4. Récupérer la récompense de base */
 const base = REWARD_TIERS[tier]

 const reward = {
  kamas: base.kamas,
  xp:    base.xp,
  packs: base.packs,
  tier:  tier
 }

 /* 5. Bonus secrets : +50% kamas */
 if(achievement && achievement.secret){
  reward.kamas = Math.floor(reward.kamas * 1.5)
 }

 return reward
}

/* ================= FORMAT TEXTE ================= */

function formatReward(reward){

 const parts = []

 if(reward.kamas > 0)
  parts.push(`💰 ${reward.kamas.toLocaleString("fr-FR")} kamas`)

 if(reward.xp > 0)
  parts.push(`⭐ ${reward.xp.toLocaleString("fr-FR")} XP`)

 if(reward.packs > 0)
  parts.push(`📦 ${reward.packs} pack${reward.packs > 1 ? "s" : ""}`)

 return parts.join(" · ") || "Aucune récompense"
}

module.exports = { REWARD_TIERS, MANUAL_OVERRIDES, getAchievementReward, formatReward }