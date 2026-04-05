/* ═══════════════════════════════════════════════════════════════
   ACHIEVEMENTS — ROULETTE
   systems/achievements/achievementRoulette.js

   Achievements liés à la Roulette d'Ecaflip : spins, lots
   rares/très rares, jackpots, gains SSR/Shiny/kamas/packs,
   streaks consécutifs, horaires secrets (nuit, midi).

   Trigger utilisé : "roulette"

   @module achievementRoulette
   @see achievementRegistry.js — agrégateur
═══════════════════════════════════════════════════════════════ */

module.exports = {
 rouletteSpin1: {
  name: "Premier tour",
  badge: "🎰",
  description: "Jouer 1 fois a la roulette.",
  title: "Curieux d'Ecaflip",
  trigger: "roulette",
  condition: (u) => (u.stats?.rouletteSpins || 0) >= 1
 },

 rouletteSpin5: {
  name: "Main chanceuse",
  badge: "🍀",
  description: "Jouer 5 fois a la roulette.",
  trigger: "roulette",
  condition: (u) => (u.stats?.rouletteSpins || 0) >= 5
 },

 rouletteSpin25: {
  name: "Table chaude",
  badge: "🔥",
  description: "Jouer 25 fois a la roulette.",
  title: "Habitue du casino",
  trigger: "roulette",
  condition: (u) => (u.stats?.rouletteSpins || 0) >= 25
 },

 rouletteSpin75: {
  name: "Roi des tours",
  badge: "👑",
  description: "Jouer 75 fois a la roulette.",
  trigger: "roulette",
  condition: (u) => (u.stats?.rouletteSpins || 0) >= 75
 },

 rouletteSpin150: {
  name: "Mythe de la roue",
  badge: "🌌",
  description: "Jouer 150 fois a la roulette.",
  title: "Maitre d'Ecaflip",
  trigger: "roulette",
  condition: (u) => (u.stats?.rouletteSpins || 0) >= 150
 },

 rouletteRare1: {
  name: "Premier lot rare",
  badge: "💠",
  description: "Obtenir un lot de rarete Rare ou plus.",
  trigger: "roulette",
  condition: (u) =>
   ((u.stats?.rouletteLotRare || 0) + (u.stats?.rouletteLotTresRare || 0) + (u.stats?.rouletteJackpot || 0)) >= 1
 },

 rouletteRare20: {
  name: "Collection rare",
  badge: "🧿",
  description: "Obtenir 20 lots de rarete Rare ou plus.",
  trigger: "roulette",
  condition: (u) =>
   ((u.stats?.rouletteLotRare || 0) + (u.stats?.rouletteLotTresRare || 0) + (u.stats?.rouletteJackpot || 0)) >= 20
 },

 rouletteTresRare1: {
  name: "Tres rare touche",
  badge: "💎",
  description: "Obtenir un lot Tres rare.",
  trigger: "roulette",
  condition: (u) => (u.stats?.rouletteLotTresRare || 0) >= 1
 },

 rouletteTresRare10: {
  name: "Aimant aux tres rares",
  badge: "🔮",
  description: "Obtenir 10 lots Tres rares.",
  trigger: "roulette",
  condition: (u) => (u.stats?.rouletteLotTresRare || 0) >= 10
 },

 rouletteJackpot1: {
  name: "Jackpot !",
  badge: "🏆",
  description: "Decrocher le jackpot krosmique.",
  title: "Elu d'Ecaflip",
  trigger: "roulette",
  secret: true,
  condition: (u) => (u.stats?.rouletteJackpot || 0) >= 1
 },

 rouletteJackpot3: {
  name: "Triple jackpot",
  badge: "🌠",
  description: "Decrocher 3 jackpots krosmiques.",
  trigger: "roulette",
  secret: true,
  condition: (u) => (u.stats?.rouletteJackpot || 0) >= 3
 },

 rouletteSSR1: {
  name: "SSR du destin",
  badge: "🌈",
  description: "Gagner au moins 1 SSR via la roulette.",
  trigger: "roulette",
  condition: (u) => (u.stats?.rouletteWinSSR || 0) >= 1
 },

 rouletteShiny1: {
  name: "Reflet legendaire",
  badge: "✨",
  description: "Gagner au moins 1 SSR shiny via la roulette.",
  title: "Faveur cosmique",
  trigger: "roulette",
  secret: true,
  condition: (u) => (u.stats?.rouletteWinShiny || 0) >= 1
 },

 rouletteKamas50k: {
  name: "Banquier d'Ecaflip",
  badge: "💰",
  description: "Gagner 50 000 kamas via la roulette.",
  trigger: "roulette",
  condition: (u) => (u.stats?.rouletteWinKamas || 0) >= 50000
 },

 rouletteKamas250k: {
  name: "Fortune de la roue",
  badge: "🏦",
  description: "Gagner 250 000 kamas via la roulette.",
  trigger: "roulette",
  condition: (u) => (u.stats?.rouletteWinKamas || 0) >= 250000
 },

 roulettePacks25: {
  name: "Pluie de packs",
  badge: "📦",
  description: "Gagner 25 packs via la roulette.",
  trigger: "roulette",
  condition: (u) => (u.stats?.rouletteWinPacks || 0) >= 25
 },

 rouletteNightSpin: {
  name: "Insomnia d'Ecaflip",
  badge: "🌙",
  description: "Jouer a la roulette entre 2h et 5h (heure Paris).",
  trigger: "roulette",
  secret: true,
  condition: (u) => Boolean(u.stats?.rouletteNightSpin)
 },

 rouletteLunchSpin: {
  name: "Pause casino",
  badge: "🍽️",
  description: "Jouer a la roulette entre 13h et 14h (heure Paris).",
  trigger: "roulette",
  condition: (u) => Boolean(u.stats?.rouletteLunchSpin)
 },

 rouletteConsecDays7: {
  name: "Rituel du croupier",
  badge: "📅",
  description: "Jouer 7 jours consecutifs a la roulette.",
  trigger: "roulette",
  condition: (u) => (u.stats?.rouletteConsecDays || 0) >= 7
 },

 rouletteConsecDays30: {
  name: "Cycle d'Ecaflip",
  badge: "🗓️",
  description: "Jouer 30 jours consecutifs a la roulette.",
  title: "Pretre du hasard",
  trigger: "roulette",
  secret: true,
  condition: (u) => (u.stats?.rouletteConsecDays || 0) >= 30
 }
}