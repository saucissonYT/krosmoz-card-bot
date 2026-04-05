/* ═══════════════════════════════════════════════════════════════
   ACHIEVEMENTS — GUILDES
   systems/achievements/achievementGuild.js

   Achievements liés au système de guildes : création, adhésion,
   niveaux (5→100), quêtes hebdo, semaines parfaites, social
   (guilde complète, vétéran, dons), XP contribuée, secrets.

   Trigger utilisé : "guild"

   Catégories :
   - Création/adhésion  (guildJoin, guildCreate, guildOfficer)
   - Niveaux            (guildLv5 → guildLv100)
   - Quêtes             (guildQuest1 → guildQuest100 + perfect weeks)
   - Social             (guildFull, guildVeteran, guildDonor)
   - XP contribuée      (guildContrib1k → guildContrib50k)
   - Secrets            (guildFirstBlood, guildAllBonuses, guildRename, guildTransfer)

   @module achievementGuild
   @see guildSystem.js — CRUD guildes
   @see guildQuestSystem.js — quêtes hebdo
═══════════════════════════════════════════════════════════════ */

module.exports = {

/* ================= CRÉATION / ADHÉSION ================= */

guildJoin:{
 name:"Esprit d'Équipe",
 badge:"🏰",
 description:"Rejoindre une guilde.",
 title:"Membre de Guilde",
 trigger:"guild",
 condition:u=>!!u.guildId
},

guildCreate:{
 name:"Fondateur",
 badge:"🏗️",
 description:"Créer une guilde.",
 title:"Fondateur",
 trigger:"guild",
 condition:u=>(u.stats?.guildCreated||0)>=1
},

guildOfficer:{
 name:"Bras Droit",
 badge:"⚔️",
 description:"Devenir officier d'une guilde.",
 title:"Officier",
 trigger:"guild",
 condition:u=>(u.stats?.guildPromoted||0)>=1
},

/* ================= NIVEAUX DE GUILDE ================= */

guildLv5:{
 name:"Guilde Naissante",
 badge:"🌱",
 description:"Être dans une guilde niveau 5+.",
 trigger:"guild",
 condition:u=>(u.stats?.guildMaxLevel||0)>=5
},

guildLv10:{
 name:"Guilde Établie",
 badge:"🏠",
 description:"Être dans une guilde niveau 10+.",
 title:"Guildesien",
 trigger:"guild",
 condition:u=>(u.stats?.guildMaxLevel||0)>=10
},

guildLv25:{
 name:"Guilde Reconnue",
 badge:"🏛️",
 description:"Être dans une guilde niveau 25+.",
 title:"Vétéran de Guilde",
 trigger:"guild",
 condition:u=>(u.stats?.guildMaxLevel||0)>=25
},

guildLv50:{
 name:"Guilde Puissante",
 badge:"⚡",
 description:"Être dans une guilde niveau 50+.",
 title:"Élite de Guilde",
 trigger:"guild",
 condition:u=>(u.stats?.guildMaxLevel||0)>=50
},

guildLv75:{
 name:"Guilde Légendaire",
 badge:"🔥",
 description:"Être dans une guilde niveau 75+.",
 title:"Légende de Guilde",
 trigger:"guild",
 condition:u=>(u.stats?.guildMaxLevel||0)>=75
},

guildLv100:{
 name:"Guilde Absolue",
 badge:"👑",
 description:"Être dans une guilde niveau 100 !",
 title:"Maître de Guilde Absolu",
 trigger:"guild",
 condition:u=>(u.stats?.guildMaxLevel||0)>=100
},

/* ================= QUÊTES DE GUILDE ================= */

guildQuest1:{
 name:"Première Quête de Guilde",
 badge:"📋",
 description:"Compléter 1 quête de guilde.",
 trigger:"guild",
 condition:u=>(u.stats?.guildQuestsClaimed||0)>=1
},

guildQuest10:{
 name:"Travailleur d'Équipe",
 badge:"📝",
 description:"Compléter 10 quêtes de guilde.",
 title:"Travailleur d'Équipe",
 trigger:"guild",
 condition:u=>(u.stats?.guildQuestsClaimed||0)>=10
},

guildQuest25:{
 name:"Pilier de Guilde",
 badge:"🏗️",
 description:"Compléter 25 quêtes de guilde.",
 title:"Pilier de Guilde",
 trigger:"guild",
 condition:u=>(u.stats?.guildQuestsClaimed||0)>=25
},

guildQuest50:{
 name:"Machine à Quêtes",
 badge:"⚙️",
 description:"Compléter 50 quêtes de guilde.",
 title:"Machine de Guerre",
 trigger:"guild",
 condition:u=>(u.stats?.guildQuestsClaimed||0)>=50
},

guildQuest100:{
 name:"Héros de Guilde",
 badge:"🦸",
 description:"Compléter 100 quêtes de guilde.",
 title:"Héros de Guilde",
 trigger:"guild",
 condition:u=>(u.stats?.guildQuestsClaimed||0)>=100
},

guildQuestPerfect:{
 name:"Semaine Parfaite",
 badge:"🌟",
 description:"Compléter les 3 quêtes de guilde en une semaine.",
 title:"Semaine Parfaite",
 trigger:"guild",
 condition:u=>(u.stats?.guildPerfectWeeks||0)>=1
},

guildQuestPerfect10:{
 name:"10 Semaines Parfaites",
 badge:"💎",
 description:"Avoir 10 semaines parfaites de guilde.",
 title:"Régulier Absolu",
 trigger:"guild",
 condition:u=>(u.stats?.guildPerfectWeeks||0)>=10
},

/* ================= SOCIAL GUILDE ================= */

guildFull:{
 name:"Guilde Complète",
 badge:"👥",
 description:"Avoir une guilde avec 10/10 membres.",
 title:"Recruteur Légendaire",
 trigger:"guild",
 condition:u=>(u.stats?.guildWasFull||0)>=1
},

guildVeteran30:{
 name:"Vétéran 30 jours",
 badge:"📅",
 description:"Être dans la même guilde depuis 30 jours.",
 title:"Loyaliste",
 trigger:"guild",
 condition:u=>(u.stats?.guildDays||0)>=30
},

guildVeteran90:{
 name:"Vétéran 90 jours",
 badge:"🏆",
 description:"Être dans la même guilde depuis 90 jours.",
 title:"Ancien de la Guilde",
 trigger:"guild",
 condition:u=>(u.stats?.guildDays||0)>=90
},

guildVeteran180:{
 name:"Vétéran 6 mois",
 badge:"👑",
 description:"Être dans la même guilde depuis 180 jours.",
 title:"Gardien Éternel",
 trigger:"guild",
 secret:true,
 condition:u=>(u.stats?.guildDays||0)>=180
},

guildDonor:{
 name:"Donateur de Guilde",
 badge:"🎁",
 description:"Faire 25 dons à des membres de sa guilde.",
 title:"Généreux de la Guilde",
 trigger:"guild",
 condition:u=>(u.stats?.guildGifts||0)>=25
},

guildDonor100:{
 name:"Mécène de Guilde",
 badge:"💝",
 description:"Faire 100 dons à des membres de sa guilde.",
 title:"Mécène de la Guilde",
 trigger:"guild",
 condition:u=>(u.stats?.guildGifts||0)>=100
},

/* ================= XP CONTRIBUÉE ================= */

guildContrib1k:{
 name:"Contributeur",
 badge:"📊",
 description:"Contribuer à 1 000 XP de guilde.",
 trigger:"guild",
 condition:u=>(u.stats?.guildXpContributed||0)>=1000
},

guildContrib10k:{
 name:"Grand Contributeur",
 badge:"📈",
 description:"Contribuer à 10 000 XP de guilde.",
 title:"Grand Contributeur",
 trigger:"guild",
 condition:u=>(u.stats?.guildXpContributed||0)>=10000
},

guildContrib50k:{
 name:"Contributeur Légendaire",
 badge:"🏆",
 description:"Contribuer à 50 000 XP de guilde.",
 title:"Contributeur Légendaire",
 trigger:"guild",
 condition:u=>(u.stats?.guildXpContributed||0)>=50000
},

/* ================= SECRETS GUILDE ================= */

guildFirstBlood:{
 name:"Première Pierre",
 badge:"🧱",
 description:"Être le premier à compléter une quête de guilde après sa création.",
 trigger:"guild",
 secret:true,
 condition:u=>(u.stats?.guildFirstClaim||0)>=1
},

guildAllBonuses:{
 name:"Tous les Bonus",
 badge:"🌈",
 description:"Être dans une guilde qui a débloqué tous les bonus (niv. 100).",
 title:"Guilde Parfaite",
 trigger:"guild",
 secret:true,
 condition:u=>(u.stats?.guildMaxLevel||0)>=100
},

guildRename:{
 name:"Nouvelle Identité",
 badge:"✏️",
 description:"Renommer sa guilde.",
 trigger:"guild",
 secret:true,
 condition:u=>(u.stats?.guildRenamed||0)>=1
},

guildTransfer:{
 name:"Passation de Pouvoir",
 badge:"🤝",
 description:"Transférer le leadership de sa guilde.",
 trigger:"guild",
 secret:true,
 condition:u=>(u.stats?.guildTransferred||0)>=1
},

}