/* ═══════════════════════════════════════════════════════════════
   ACHIEVEMENTS — SOCIAL
   systems/achievements/achievementSocial.js

   Achievements liés aux interactions sociales : consultations
   de profil, leaderboard, mentions du bot.

   Trigger utilisé : "social"

   Catégories :
   - Profil       (profile1 → profile1000)
   - Leaderboard  (leaderboard1 → leaderboard1000)
   - Mentions     (mention1 → mention1000)

   @module achievementSocial
   @see achievementRegistry.js — agrégateur
═══════════════════════════════════════════════════════════════ */

module.exports = {

/* ================= PROFIL ================= */

profile1:{
 name:"Premier profil consulté",
 badge:"👤",
 description:"Consulter ton profil une fois.",
 title:"Narcissique",
 trigger:"social",
 condition:u=>u.stats?.profileViews>=1
},

profile10:{
 name:"10 consultations de profil",
 badge:"🪞",
 description:"Consulter ton profil 10 fois.",
 title:"Miroir Brisé",
 trigger:"social",
 condition:u=>u.stats?.profileViews>=10
},

profile100:{
 name:"100 consultations de profil",
 badge:"🌟",
 description:"Consulter ton profil 100 fois.",
 title:"Centre de l'Univers",
 trigger:"social",
 condition:u=>u.stats?.profileViews>=100
},

profile250:{
 name:"250 consultations de profil",
 badge:"✨",
 description:"Consulter ton profil 250 fois.",
 title:"Star du Krosmoz",
 trigger:"social",
 condition:u=>u.stats?.profileViews>=250
},

profile500:{
 name:"500 consultations de profil",
 badge:"🌟",
 description:"Consulter ton profil 500 fois.",
 title:"Icône Vivante",
 trigger:"social",
 condition:u=>u.stats?.profileViews>=500
},

profile1000:{
 name:"1000 consultations de profil",
 badge:"🪩",
 description:"Consulter ton profil 1000 fois.",
 title:"Culte de la Personnalité",
 trigger:"social",
 condition:u=>u.stats?.profileViews>=1000
},

/* ================= LEADERBOARD ================= */

leaderboard1:{
 name:"Un petit coup d'œil",
 badge:"👀",
 description:"Consulter le leaderboard une fois.",
 title:"Curieux du Classement",
 trigger:"social",
 condition:u=>u.stats?.leaderboardViews>=1
},

leaderboard10:{
 name:"10 classements consultés",
 badge:"📊",
 description:"Consulter le leaderboard 10 fois.",
 title:"Observateur du Krosmoz",
 trigger:"social",
 condition:u=>u.stats?.leaderboardViews>=10
},

leaderboard25:{
 name:"25 classements consultés",
 badge:"🕵️",
 description:"Consulter le leaderboard 25 fois.",
 title:"Espion des Statistiques",
 trigger:"social",
 condition:u=>u.stats?.leaderboardViews>=25
},

leaderboard50:{
 name:"50 classements consultés",
 badge:"📈",
 description:"Consulter le leaderboard 50 fois.",
 title:"Analyste du Gacha",
 trigger:"social",
 condition:u=>u.stats?.leaderboardViews>=50
},

leaderboard100:{
 name:"100 classements consultés",
 badge:"🧠",
 description:"Consulter le leaderboard 100 fois.",
 title:"Obsédé du Classement",
 trigger:"social",
 condition:u=>u.stats?.leaderboardViews>=100
},

leaderboard250:{
 name:"250 classements consultés",
 badge:"🔭",
 description:"Consulter le leaderboard 250 fois.",
 title:"Voyeur du Leaderboard",
 trigger:"social",
 condition:u=>u.stats?.leaderboardViews>=250
},

leaderboard500:{
 name:"500 classements consultés",
 badge:"🤯",
 description:"Consulter le leaderboard 500 fois.",
 title:"Classement Addict",
 trigger:"social",
 condition:u=>u.stats?.leaderboardViews>=500
},

leaderboard1000:{
 name:"1000 classements consultés",
 badge:"🧾",
 description:"Consulter le leaderboard 1000 fois.",
 title:"Archiviste des Ego",
 trigger:"social",
 condition:u=>u.stats?.leaderboardViews>=1000
},

/* ================= MENTIONS ================= */

mention1:{
 name:"Mention du bot",
 badge:"💬",
 description:"Mentionner le bot une fois.",
 title:"Ami du Bot",
 trigger:"social",
 condition:u=>u.stats?.botMentions>=1
},

mention10:{
 name:"10 mentions",
 badge:"🗨️",
 description:"Mentionner le bot 10 fois.",
 title:"Bavard",
 trigger:"social",
 condition:u=>u.stats?.botMentions>=10
},

mention100:{
 name:"100 mentions",
 badge:"📢",
 description:"Mentionner le bot 100 fois.",
 title:"Voix du Krosmoz",
 trigger:"social",
 condition:u=>u.stats?.botMentions>=100
},

mention1000:{
 name:"1000 mentions",
 badge:"📣",
 description:"Mentionner le bot 1000 fois.",
 title:"Fan du Bot",
 trigger:"social",
 condition:u=>u.stats?.botMentions>=1000
},

}