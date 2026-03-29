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

 /* ---- NIVEAUX JOUEUR (paliers hauts — auto-détection insuffisante) ---- */
 level125:       6,  /* Extrême   — 3 000 kamas, 500 XP, 2 packs */
 level150:       7,  /* Légendaire — 5 000 kamas, 1 000 XP, 3 packs */
 level175:       7,  /* Légendaire — 5 000 kamas, 1 000 XP, 3 packs */
 level200:       8,  /* Mythique   — 10 000 kamas, 2 000 XP, 5 packs */

}

module.exports = { REWARD_TIERS, MANUAL_OVERRIDES }