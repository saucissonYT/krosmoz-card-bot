/* ═══════════════════════════════════════════════════════════════
   ACHIEVEMENTS — PIÑATA
   systems/achievements/achievementPinata.js

   Achievements liés à la Piñata du Dieu Ecaflip : participations,
   réactions, SSR gagnées, kamas accumulés.

   Trigger utilisé : "pinata"

   @module achievementPinata
   @see pinataEvent.js — logique piñata
   @see achievementRegistry.js — agrégateur
═══════════════════════════════════════════════════════════════ */

module.exports = {

/* ================= PARTICIPATIONS ================= */

pinata1: {
 name: "Première Piñata",
 badge: "🪅",
 description: "Participer à ta première piñata d'Ecaflip.",
 title: "Fêtard",
 trigger: "pinata",
 condition: (u) => (u.stats?.pinataParticipations || 0) >= 1
},

pinata3: {
 name: "Habitué de la Fête",
 badge: "🎉",
 description: "Participer à 3 piñatas.",
 trigger: "pinata",
 condition: (u) => (u.stats?.pinataParticipations || 0) >= 3
},

pinata10: {
 name: "Fêtard Confirmé",
 badge: "🎊",
 description: "Participer à 10 piñatas.",
 title: "Fêtard du Krosmoz",
 trigger: "pinata",
 condition: (u) => (u.stats?.pinataParticipations || 0) >= 10
},

pinata25: {
 name: "Chasseur de Piñatas",
 badge: "🏹",
 description: "Participer à 25 piñatas.",
 title: "Chasseur de Piñatas",
 trigger: "pinata",
 condition: (u) => (u.stats?.pinataParticipations || 0) >= 25
},

pinata50: {
 name: "Légende de la Fête",
 badge: "👑",
 description: "Participer à 50 piñatas.",
 title: "Légende de la Piñata",
 trigger: "pinata",
 condition: (u) => (u.stats?.pinataParticipations || 0) >= 50
},

/* ================= SSR GAGNÉES À LA PIÑATA ================= */

pinataSSR1: {
 name: "Piñata Dorée",
 badge: "🌈",
 description: "Gagner 1 SSR grâce à la piñata.",
 title: "Chanceux d'Ecaflip",
 trigger: "pinata",
 condition: (u) => (u.stats?.pinataSSRWon || 0) >= 1
},

pinataSSR3: {
 name: "Triple Piñata Dorée",
 badge: "✨",
 description: "Gagner 3 SSR grâce à la piñata.",
 title: "Béni de la Piñata",
 trigger: "pinata",
 condition: (u) => (u.stats?.pinataSSRWon || 0) >= 3
},

pinataSSR5: {
 name: "Piñata Légendaire",
 badge: "💎",
 description: "Gagner 5 SSR grâce à la piñata.",
 title: "Roi de la Piñata",
 trigger: "pinata",
 condition: (u) => (u.stats?.pinataSSRWon || 0) >= 5
},

pinataSSR10: {
 name: "Piñata Mythique",
 badge: "🪽",
 description: "Gagner 10 SSR grâce à la piñata.",
 title: "Divinité de la Piñata",
 trigger: "pinata",
 secret: true,
 condition: (u) => (u.stats?.pinataSSRWon || 0) >= 10
},

/* ================= RÉACTIONS TOTALES ================= */

pinataReact1: {
 name: "Première Réaction",
 badge: "👆",
 description: "Cumuler 1 réaction sur les piñatas.",
 trigger: "pinata",
 condition: (u) => (u.stats?.pinataReactionsTotal || 0) >= 1
},

pinataReact50: {
 name: "Réactif",
 badge: "⚡",
 description: "Cumuler 50 réactions sur les piñatas.",
 title: "Réactif du Krosmoz",
 trigger: "pinata",
 condition: (u) => (u.stats?.pinataReactionsTotal || 0) >= 50
},

pinataReact100: {
 name: "Pluie d'Emojis",
 badge: "🌧️",
 description: "Cumuler 100 réactions sur les piñatas.",
 title: "Pluie d'Emojis",
 trigger: "pinata",
 condition: (u) => (u.stats?.pinataReactionsTotal || 0) >= 100
},

pinataReact500: {
 name: "Tempête d'Emojis",
 badge: "⛈️",
 description: "Cumuler 500 réactions sur les piñatas.",
 title: "Tempête d'Ecaflip",
 trigger: "pinata",
 condition: (u) => (u.stats?.pinataReactionsTotal || 0) >= 500
},

pinataReact1000: {
 name: "Ouragan d'Emojis",
 badge: "🌪️",
 description: "Cumuler 1000 réactions sur les piñatas.",
 title: "Ouragan d'Ecaflip",
 trigger: "pinata",
 secret: true,
 condition: (u) => (u.stats?.pinataReactionsTotal || 0) >= 1000
},

/* ================= KAMAS GAGNÉS ================= */

pinataKamas10k: {
 name: "Petit Butin",
 badge: "💰",
 description: "Gagner 10 000 kamas via les piñatas.",
 trigger: "pinata",
 condition: (u) => (u.stats?.pinataKamasWon || 0) >= 10000
},

pinataKamas50k: {
 name: "Gros Butin",
 badge: "🏦",
 description: "Gagner 50 000 kamas via les piñatas.",
 title: "Pilleur de Piñata",
 trigger: "pinata",
 condition: (u) => (u.stats?.pinataKamasWon || 0) >= 50000
},

pinataKamas200k: {
 name: "Trésor de la Piñata",
 badge: "👑",
 description: "Gagner 200 000 kamas via les piñatas.",
 title: "Trésorier d'Ecaflip",
 trigger: "pinata",
 secret: true,
 condition: (u) => (u.stats?.pinataKamasWon || 0) >= 200000
},

}