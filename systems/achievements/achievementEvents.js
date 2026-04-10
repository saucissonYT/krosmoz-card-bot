/* ═══════════════════════════════════════════════════════════════
   ACHIEVEMENTS — EVENTS
   systems/achievements/achievementEvents.js

   Achievements liés aux events des 19 Dieux du Krosmoz :
   packs d'event, participation, tickets, SSR en event,
   SSR par classe, packs par classe, jackpots Enutrof/Feca,
   achievements croisés multi-dieux.

   Trigger utilisé : "event"

   @module achievementEvents
   @see eventRegistry.js — définition des 19 events
   @see achievementRegistry.js — agrégateur
═══════════════════════════════════════════════════════════════ */

module.exports = {

/* ================= EVENTPACKS GLOBAUX ================= */

eventPack1:{
 name:"Premier EventPack",
 badge:"🎪",
 description:"Ouvrir ton premier pack d'event.",
 title:"Aventurier de l'Event",
 trigger:"event",
 condition:u=>u.stats?.eventPacksOpened>=1
},

eventPack10:{
 name:"10 EventPacks",
 badge:"🎠",
 description:"Ouvrir 10 packs d'event.",
 title:"Habitué des Events",
 trigger:"event",
 condition:u=>u.stats?.eventPacksOpened>=10
},

eventPack100:{
 name:"100 EventPacks",
 badge:"🎯",
 description:"Ouvrir 100 packs d'event.",
 title:"Chasseur d'Events",
 trigger:"event",
 condition:u=>u.stats?.eventPacksOpened>=100
},

eventPack300:{
 name:"300 EventPacks",
 badge:"⚔️",
 description:"Ouvrir 300 packs d'event.",
 title:"Vétéran des Events",
 trigger:"event",
 condition:u=>u.stats?.eventPacksOpened>=300
},

eventPack500:{
 name:"500 EventPacks",
 badge:"🏆",
 description:"Ouvrir 500 packs d'event.",
 title:"Légende des Events",
 trigger:"event",
 condition:u=>u.stats?.eventPacksOpened>=500
},

eventPack1000:{
 name:"1000 EventPacks",
 badge:"👑",
 description:"Ouvrir 1000 packs d'event.",
 title:"Dieu de l'Event",
 trigger:"event",
 condition:u=>u.stats?.eventPacksOpened>=1000
},

/* ================= PARTICIPATION EVENTS DISTINCTS ================= */

eventsParticipated1:{
 name:"Premier Event",
 badge:"🌱",
 description:"Participer à ton premier event.",
 title:"Premier Pas",
 trigger:"event",
 condition:u=>(u.stats?.eventsParticipated?.length||0)>=1
},

eventsParticipated5:{
 name:"5 Events distincts",
 badge:"🗺️",
 description:"Participer à 5 events différents.",
 title:"Explorateur du Krosmoz",
 trigger:"event",
 condition:u=>(u.stats?.eventsParticipated?.length||0)>=5
},

eventsParticipated10:{
 name:"10 Events distincts",
 badge:"🌍",
 description:"Participer à 10 events différents.",
 title:"Voyageur des Dieux",
 trigger:"event",
 condition:u=>(u.stats?.eventsParticipated?.length||0)>=10
},

eventsParticipated25:{
 name:"25 Events distincts",
 badge:"🕍",
 description:"Participer à 25 events différents.",
 title:"Pèlerin Sacré",
 trigger:"event",
 condition:u=>(u.stats?.eventsParticipated?.length||0)>=25
},

eventsParticipated50:{
 name:"50 Events distincts",
 badge:"📜",
 description:"Participer à 50 events différents.",
 title:"Érudit Divin",
 trigger:"event",
 condition:u=>(u.stats?.eventsParticipated?.length||0)>=50
},

eventsParticipated100:{
 name:"100 Events distincts",
 badge:"🌌",
 description:"Participer à 100 events différents.",
 title:"Pèlerin du Krosmoz",
 trigger:"event",
 condition:u=>(u.stats?.eventsParticipated?.length||0)>=100
},

/* ================= TICKETS ENTIÈREMENT UTILISÉS ================= */

ticketsFull1:{
 name:"Tickets épuisés",
 badge:"🎟️",
 description:"Utiliser tous ses tickets lors d'un event.",
 title:"Dévoué",
 trigger:"event",
 condition:u=>(u.stats?.ticketsFullyUsed||0)>=1
},

ticketsFull5:{
 name:"5 fois tous les tickets",
 badge:"💪",
 description:"Utiliser tous ses tickets 5 fois.",
 title:"Sans Réserve",
 trigger:"event",
 condition:u=>(u.stats?.ticketsFullyUsed||0)>=5
},

ticketsFull10:{
 name:"10 fois tous les tickets",
 badge:"🔥",
 description:"Utiliser tous ses tickets 10 fois.",
 title:"Sans Relâche",
 trigger:"event",
 condition:u=>(u.stats?.ticketsFullyUsed||0)>=10
},

ticketsFull25:{
 name:"25 fois tous les tickets",
 badge:"🏃",
 description:"Utiliser tous ses tickets 25 fois.",
 title:"Jusqu'au Bout",
 trigger:"event",
 condition:u=>(u.stats?.ticketsFullyUsed||0)>=25
},

ticketsFull50:{
 name:"50 fois tous les tickets",
 badge:"⚡",
 description:"Utiliser tous ses tickets 50 fois.",
 title:"Implacable",
 trigger:"event",
 condition:u=>(u.stats?.ticketsFullyUsed||0)>=50
},

ticketsFull100:{
 name:"100 fois tous les tickets",
 badge:"💎",
 description:"Utiliser tous ses tickets 100 fois.",
 title:"Absolu",
 trigger:"event",
 condition:u=>(u.stats?.ticketsFullyUsed||0)>=100
},

/* ================= SSR EN EVENT ================= */

eventSSR1:{
 name:"Première SSR en Event",
 badge:"✨",
 description:"Obtenir ta première SSR lors d'un event.",
 title:"Touché par les Dieux",
 trigger:"event",
 condition:u=>(u.stats?.ssrFromEvent||0)>=1
},

eventSSR10:{
 name:"10 SSR en Event",
 badge:"🌟",
 description:"Obtenir 10 SSR lors d'events.",
 title:"Favori des Dieux",
 trigger:"event",
 condition:u=>(u.stats?.ssrFromEvent||0)>=10
},

eventSSR25:{
 name:"25 SSR en Event",
 badge:"💫",
 description:"Obtenir 25 SSR lors d'events.",
 title:"Élu des Dieux",
 trigger:"event",
 condition:u=>(u.stats?.ssrFromEvent||0)>=25
},

eventSSR50:{
 name:"50 SSR en Event",
 badge:"🌠",
 description:"Obtenir 50 SSR lors d'events.",
 title:"Béni du Krosmoz",
 trigger:"event",
 condition:u=>(u.stats?.ssrFromEvent||0)>=50
},

eventSSR100:{
 name:"100 SSR en Event",
 badge:"🌈",
 description:"Obtenir 100 SSR lors d'events.",
 title:"Enfant des Dieux",
 trigger:"event",
 condition:u=>(u.stats?.ssrFromEvent||0)>=100
},

/* ================= SSR PAR EVENT SPÉCIFIQUE (19) ================= */

ssrEventIop:{
 name:"SSR bénie d'Iop",
 badge:"👊",
 description:"Obtenir une SSR lors de l'event Iop.",
 title:"Béni d'Iop",
 trigger:"event",
 condition:u=>(u.stats?.ssrByClass?.iop||0)>=1
},

ssrEventCra:{
 name:"SSR bénie de Cra",
 badge:"🏹",
 description:"Obtenir une SSR lors de l'event Cra.",
 title:"Élu de Cra",
 trigger:"event",
 condition:u=>(u.stats?.ssrByClass?.cra||0)>=1
},

ssrEventXelor:{
 name:"SSR bénie de Xelor",
 badge:"⏳",
 description:"Obtenir une SSR lors de l'event Xelor.",
 title:"Grâce de Xelor",
 trigger:"event",
 condition:u=>(u.stats?.ssrByClass?.xelor||0)>=1
},

ssrEventSram:{
 name:"SSR bénie du Sram",
 badge:"🗝️",
 description:"Obtenir une SSR lors de l'event Sram.",
 title:"Don du Sram",
 trigger:"event",
 condition:u=>(u.stats?.ssrByClass?.sram||0)>=1
},

ssrEventSacrieur:{
 name:"SSR bénie du Sacrieur",
 badge:"🩸",
 description:"Obtenir une SSR lors de l'event Sacrieur.",
 title:"Sang Béni",
 trigger:"event",
 condition:u=>(u.stats?.ssrByClass?.sacrieur||0)>=1
},

ssrEventZobal:{
 name:"SSR bénie du Zobal",
 badge:"🎭",
 description:"Obtenir une SSR lors de l'event Zobal.",
 title:"Masque d'Or",
 trigger:"event",
 condition:u=>(u.stats?.ssrByClass?.zobal||0)>=1
},

ssrEventHuppermage:{
 name:"SSR bénie de Huppermage",
 badge:"✴️",
 description:"Obtenir une SSR lors de l'event Huppermage.",
 title:"Éclat Magique",
 trigger:"event",
 condition:u=>(u.stats?.ssrByClass?.huppermage||0)>=1
},

ssrEventPandawa:{
 name:"SSR bénie de Pandawa",
 badge:"🍀",
 description:"Obtenir une SSR lors de l'event Pandawa.",
 title:"Miracle Pandawa",
 trigger:"event",
 condition:u=>(u.stats?.ssrByClass?.pandawa||0)>=1
},

ssrEventOsamodas:{
 name:"SSR bénie d'Osamodas",
 badge:"🐉",
 description:"Obtenir une SSR lors de l'event Osamodas.",
 title:"Souffle du Dragon",
 trigger:"event",
 condition:u=>(u.stats?.ssrByClass?.osamodas||0)>=1
},

ssrEventEcaflip:{
 name:"SSR bénie d'Ecaflip",
 badge:"??",
 description:"Obtenir une SSR lors de l'event Ecaflip.",
 title:"Pile ou Face Divin",
 trigger:"event",
 condition:u=>(u.stats?.ssrByClass?.ecaflip||0)>=1
},

ssrEventOuginak:{
 name:"SSR bénie d'Ouginak",
 badge:"🐺",
 description:"Obtenir une SSR lors de l'event Ouginak.",
 title:"Croc de Légende",
 trigger:"event",
 condition:u=>(u.stats?.ssrByClass?.ouginak||0)>=1
},

ssrEventFeca:{
 name:"SSR bénie de Feca",
 badge:"🛡️",
 description:"Obtenir une SSR lors de l'event Feca.",
 title:"Bouclier Sacré",
 trigger:"event",
 condition:u=>(u.stats?.ssrByClass?.feca||0)>=1
},

ssrEventEnutrof:{
 name:"SSR bénie d'Enutrof",
 badge:"💰",
 description:"Obtenir une SSR lors de l'event Enutrof.",
 title:"Pépite Divine",
 trigger:"event",
 condition:u=>(u.stats?.ssrByClass?.enutrof||0)>=1
},

ssrEventRoublard:{
 name:"SSR bénie du Roublard",
 badge:"💥",
 description:"Obtenir une SSR lors de l'event Roublard.",
 title:"Explosion Parfaite",
 trigger:"event",
 condition:u=>(u.stats?.ssrByClass?.roublard||0)>=1
},

ssrEventSteamer:{
 name:"SSR bénie du Steamer",
 badge:"🤖",
 description:"Obtenir une SSR lors de l'event Steamer.",
 title:"Prototype Légendaire",
 trigger:"event",
 condition:u=>(u.stats?.ssrByClass?.steamer||0)>=1
},

ssrEventEliotrope:{
 name:"SSR bénie de l'Eliotrope",
 badge:"🌀",
 description:"Obtenir une SSR lors de l'event Eliotrope.",
 title:"Faille Sacrée",
 trigger:"event",
 condition:u=>(u.stats?.ssrByClass?.eliotrope||0)>=1
},

ssrEventEniripsa:{
 name:"SSR bénie de l'Eniripsa",
 badge:"💊",
 description:"Obtenir une SSR lors de l'event Eniripsa.",
 title:"Mot Béni",
 trigger:"event",
 condition:u=>(u.stats?.ssrByClass?.eniripsa||0)>=1
},

ssrEventSadida:{
 name:"SSR bénie de Sadida",
 badge:"🌱",
 description:"Obtenir une SSR lors de l'event Sadida.",
 title:"Graine d'Or",
 trigger:"event",
 condition:u=>(u.stats?.ssrByClass?.sadida||0)>=1
},

ssrEventForgelance:{
 name:"SSR bénie de Forgelance",
 badge:"⚔️",
 description:"Obtenir une SSR lors de l'event Forgelance.",
 title:"Métal Divin",
 trigger:"event",
 condition:u=>(u.stats?.ssrByClass?.forgelance||0)>=1
},

/* ================= PACKS PAR CLASSE — IOP ================= */

packIop1:{ name:"Aspirant Iop", badge:"🗡️", description:"Ouvrir 1 pack durant l'event Iop.", title:"Aspirant Iop", trigger:"event", condition:u=>(u.stats?.eventPacksByClass?.iop||0)>=1 },
packIop10:{ name:"Guerrier Iop", badge:"⚔️", description:"Ouvrir 10 packs durant l'event Iop.", title:"Guerrier Iop", trigger:"event", condition:u=>(u.stats?.eventPacksByClass?.iop||0)>=10 },
packIop25:{ name:"Champion Iop", badge:"🛡️", description:"Ouvrir 25 packs durant l'event Iop.", title:"Champion Iop", trigger:"event", condition:u=>(u.stats?.eventPacksByClass?.iop||0)>=25 },
packIop50:{ name:"Héros d'Iop", badge:"🔱", description:"Ouvrir 50 packs durant l'event Iop.", title:"Héros d'Iop", trigger:"event", condition:u=>(u.stats?.eventPacksByClass?.iop||0)>=50 },
packIop100:{ name:"Incarnation d'Iop", badge:"👊", description:"Ouvrir 100 packs durant l'event Iop.", title:"Incarnation d'Iop", trigger:"event", condition:u=>(u.stats?.eventPacksByClass?.iop||0)>=100 },

/* ================= PACKS PAR CLASSE — CRA ================= */

packCra1:{ name:"Tireur Cra", badge:"🏹", description:"Ouvrir 1 pack durant l'event Cra.", title:"Tireur Cra", trigger:"event", condition:u=>(u.stats?.eventPacksByClass?.cra||0)>=1 },
packCra10:{ name:"Archer Cra", badge:"🎯", description:"Ouvrir 10 packs durant l'event Cra.", title:"Archer Cra", trigger:"event", condition:u=>(u.stats?.eventPacksByClass?.cra||0)>=10 },
packCra25:{ name:"Sniper Cra", badge:"👁️", description:"Ouvrir 25 packs durant l'event Cra.", title:"Sniper Cra", trigger:"event", condition:u=>(u.stats?.eventPacksByClass?.cra||0)>=25 },
packCra50:{ name:"Maître Archer", badge:"🦅", description:"Ouvrir 50 packs durant l'event Cra.", title:"Maître Archer", trigger:"event", condition:u=>(u.stats?.eventPacksByClass?.cra||0)>=50 },
packCra100:{ name:"Œil de Cra", badge:"🌿", description:"Ouvrir 100 packs durant l'event Cra.", title:"Œil de Cra", trigger:"event", condition:u=>(u.stats?.eventPacksByClass?.cra||0)>=100 },

/* ================= PACKS PAR CLASSE — XELOR ================= */

packXelor1:{ name:"Apprenti du Temps", badge:"⏱️", description:"Ouvrir 1 pack durant l'event Xelor.", title:"Apprenti du Temps", trigger:"event", condition:u=>(u.stats?.eventPacksByClass?.xelor||0)>=1 },
packXelor10:{ name:"Gardien du Temps", badge:"⌛", description:"Ouvrir 10 packs durant l'event Xelor.", title:"Gardien du Temps", trigger:"event", condition:u=>(u.stats?.eventPacksByClass?.xelor||0)>=10 },
packXelor25:{ name:"Tisseur du Temps", badge:"🕰️", description:"Ouvrir 25 packs durant l'event Xelor.", title:"Tisseur du Temps", trigger:"event", condition:u=>(u.stats?.eventPacksByClass?.xelor||0)>=25 },
packXelor50:{ name:"Seigneur du Temps", badge:"⚙️", description:"Ouvrir 50 packs durant l'event Xelor.", title:"Seigneur du Temps", trigger:"event", condition:u=>(u.stats?.eventPacksByClass?.xelor||0)>=50 },
packXelor100:{ name:"Maître du Temps", badge:"🕳️", description:"Ouvrir 100 packs durant l'event Xelor.", title:"Maître du Temps", trigger:"event", condition:u=>(u.stats?.eventPacksByClass?.xelor||0)>=100 },

/* ================= PACKS PAR CLASSE — SRAM ================= */

packSram1:{ name:"Initié Sram", badge:"🗝️", description:"Ouvrir 1 pack durant l'event Sram.", title:"Initié Sram", trigger:"event", condition:u=>(u.stats?.eventPacksByClass?.sram||0)>=1 },
packSram10:{ name:"Espion Sram", badge:"🕵️", description:"Ouvrir 10 packs durant l'event Sram.", title:"Espion Sram", trigger:"event", condition:u=>(u.stats?.eventPacksByClass?.sram||0)>=10 },
packSram25:{ name:"Assassin Sram", badge:"🔪", description:"Ouvrir 25 packs durant l'event Sram.", title:"Assassin Sram", trigger:"event", condition:u=>(u.stats?.eventPacksByClass?.sram||0)>=25 },
packSram50:{ name:"Fantôme du Sram", badge:"💀", description:"Ouvrir 50 packs durant l'event Sram.", title:"Fantôme du Sram", trigger:"event", condition:u=>(u.stats?.eventPacksByClass?.sram||0)>=50 },
packSram100:{ name:"Ombre du Sram", badge:"🌑", description:"Ouvrir 100 packs durant l'event Sram.", title:"Ombre du Sram", trigger:"event", condition:u=>(u.stats?.eventPacksByClass?.sram||0)>=100 },

/* ================= PACKS PAR CLASSE — SACRIEUR ================= */

packSacrieur1:{ name:"Blessé Sacrieur", badge:"🩸", description:"Ouvrir 1 pack durant l'event Sacrieur.", title:"Blessé Sacrieur", trigger:"event", condition:u=>(u.stats?.eventPacksByClass?.sacrieur||0)>=1 },
packSacrieur10:{ name:"Enragé Sacrieur", badge:"💢", description:"Ouvrir 10 packs durant l'event Sacrieur.", title:"Enragé Sacrieur", trigger:"event", condition:u=>(u.stats?.eventPacksByClass?.sacrieur||0)>=10 },
packSacrieur25:{ name:"Martyr Sacrieur", badge:"⛓️", description:"Ouvrir 25 packs durant l'event Sacrieur.", title:"Martyr Sacrieur", trigger:"event", condition:u=>(u.stats?.eventPacksByClass?.sacrieur||0)>=25 },
packSacrieur50:{ name:"Fanatique Sacrieur", badge:"🔥", description:"Ouvrir 50 packs durant l'event Sacrieur.", title:"Fanatique Sacrieur", trigger:"event", condition:u=>(u.stats?.eventPacksByClass?.sacrieur||0)>=50 },
packSacrieur100:{ name:"Sang du Sacrieur", badge:"❤️‍🔥", description:"Ouvrir 100 packs durant l'event Sacrieur.", title:"Sang du Sacrieur", trigger:"event", condition:u=>(u.stats?.eventPacksByClass?.sacrieur||0)>=100 },

/* ================= PACKS PAR CLASSE — ZOBAL ================= */

packZobal1:{ name:"Porteur de Masque", badge:"🎭", description:"Ouvrir 1 pack durant l'event Zobal.", title:"Porteur de Masque", trigger:"event", condition:u=>(u.stats?.eventPacksByClass?.zobal||0)>=1 },
packZobal10:{ name:"Danseur Zobal", badge:"🃏", description:"Ouvrir 10 packs durant l'event Zobal.", title:"Danseur Zobal", trigger:"event", condition:u=>(u.stats?.eventPacksByClass?.zobal||0)>=10 },
packZobal25:{ name:"Illusionniste", badge:"🪄", description:"Ouvrir 25 packs durant l'event Zobal.", title:"Illusionniste", trigger:"event", condition:u=>(u.stats?.eventPacksByClass?.zobal||0)>=25 },
packZobal50:{ name:"Maître des Masques", badge:"🎪", description:"Ouvrir 50 packs durant l'event Zobal.", title:"Maître des Masques", trigger:"event", condition:u=>(u.stats?.eventPacksByClass?.zobal||0)>=50 },
packZobal100:{ name:"Masque Éternel", badge:"🌀", description:"Ouvrir 100 packs durant l'event Zobal.", title:"Masque Éternel", trigger:"event", condition:u=>(u.stats?.eventPacksByClass?.zobal||0)>=100 },

/* ================= PACKS PAR CLASSE — HUPPERMAGE ================= */

packHuppermage1:{ name:"Initié Huppermage", badge:"🔮", description:"Ouvrir 1 pack durant l'event Huppermage.", title:"Initié Huppermage", trigger:"event", condition:u=>(u.stats?.eventPacksByClass?.huppermage||0)>=1 },
packHuppermage10:{ name:"Tisseur de Magie", badge:"🌊", description:"Ouvrir 10 packs durant l'event Huppermage.", title:"Tisseur de Magie", trigger:"event", condition:u=>(u.stats?.eventPacksByClass?.huppermage||0)>=10 },
packHuppermage25:{ name:"Archétype Magique", badge:"🌪️", description:"Ouvrir 25 packs durant l'event Huppermage.", title:"Archétype Magique", trigger:"event", condition:u=>(u.stats?.eventPacksByClass?.huppermage||0)>=25 },
packHuppermage50:{ name:"Maître des Éléments", badge:"🌈", description:"Ouvrir 50 packs durant l'event Huppermage.", title:"Maître des Éléments", trigger:"event", condition:u=>(u.stats?.eventPacksByClass?.huppermage||0)>=50 },
packHuppermage100:{ name:"Archimage", badge:"✴️", description:"Ouvrir 100 packs durant l'event Huppermage.", title:"Archimage", trigger:"event", condition:u=>(u.stats?.eventPacksByClass?.huppermage||0)>=100 },

/* ================= PACKS PAR CLASSE — PANDAWA ================= */

packPandawa1:{ name:"Apprenti Brasseur", badge:"🍺", description:"Ouvrir 1 pack durant l'event Pandawa.", title:"Apprenti Brasseur", trigger:"event", condition:u=>(u.stats?.eventPacksByClass?.pandawa||0)>=1 },
packPandawa10:{ name:"Brasseur Pandawa", badge:"🥂", description:"Ouvrir 10 packs durant l'event Pandawa.", title:"Brasseur Pandawa", trigger:"event", condition:u=>(u.stats?.eventPacksByClass?.pandawa||0)>=10 },
packPandawa25:{ name:"Ivrogne Sacré", badge:"🍻", description:"Ouvrir 25 packs durant l'event Pandawa.", title:"Ivrogne Sacré", trigger:"event", condition:u=>(u.stats?.eventPacksByClass?.pandawa||0)>=25 },
packPandawa50:{ name:"Maître Brasseur", badge:"🎋", description:"Ouvrir 50 packs durant l'event Pandawa.", title:"Maître Brasseur", trigger:"event", condition:u=>(u.stats?.eventPacksByClass?.pandawa||0)>=50 },
packPandawa100:{ name:"Grand Brasseur", badge:"🐼", description:"Ouvrir 100 packs durant l'event Pandawa.", title:"Grand Brasseur", trigger:"event", condition:u=>(u.stats?.eventPacksByClass?.pandawa||0)>=100 },

/* ================= PACKS PAR CLASSE — OSAMODAS ================= */

packOsamodas1:{ name:"Apprivoiseur", badge:"🐾", description:"Ouvrir 1 pack durant l'event Osamodas.", title:"Apprivoiseur", trigger:"event", condition:u=>(u.stats?.eventPacksByClass?.osamodas||0)>=1 },
packOsamodas10:{ name:"Dresseur Osamodas", badge:"🦎", description:"Ouvrir 10 packs durant l'event Osamodas.", title:"Dresseur Osamodas", trigger:"event", condition:u=>(u.stats?.eventPacksByClass?.osamodas||0)>=10 },
packOsamodas25:{ name:"Gardien des Bêtes", badge:"🐉", description:"Ouvrir 25 packs durant l'event Osamodas.", title:"Gardien des Bêtes", trigger:"event", condition:u=>(u.stats?.eventPacksByClass?.osamodas||0)>=25 },
packOsamodas50:{ name:"Maître des Âmes", badge:"🌿", description:"Ouvrir 50 packs durant l'event Osamodas.", title:"Maître des Âmes", trigger:"event", condition:u=>(u.stats?.eventPacksByClass?.osamodas||0)>=50 },
packOsamodas100:{ name:"Seigneur des Bêtes", badge:"🦁", description:"Ouvrir 100 packs durant l'event Osamodas.", title:"Seigneur des Bêtes", trigger:"event", condition:u=>(u.stats?.eventPacksByClass?.osamodas||0)>=100 },

/* ================= PACKS PAR CLASSE — ECAFLIP ================= */

packEcaflip1:{ name:"Joueur Ecaflip", badge:"🎲", description:"Ouvrir 1 pack durant l'event Ecaflip.", title:"Joueur Ecaflip", trigger:"event", condition:u=>(u.stats?.eventPacksByClass?.ecaflip||0)>=1 },
packEcaflip10:{ name:"Parieur Ecaflip", badge:"🃏", description:"Ouvrir 10 packs durant l'event Ecaflip.", title:"Parieur Ecaflip", trigger:"event", condition:u=>(u.stats?.eventPacksByClass?.ecaflip||0)>=10 },
packEcaflip25:{ name:"Chanceux", badge:"🍀", description:"Ouvrir 25 packs durant l'event Ecaflip.", title:"Chanceux", trigger:"event", condition:u=>(u.stats?.eventPacksByClass?.ecaflip||0)>=25 },
packEcaflip50:{ name:"Favori du Destin", badge:"??", description:"Ouvrir 50 packs durant l'event Ecaflip.", title:"Favori du Destin", trigger:"event", condition:u=>(u.stats?.eventPacksByClass?.ecaflip||0)>=50 },
packEcaflip100:{ name:"Enfant du Destin", badge:"🌟", description:"Ouvrir 100 packs durant l'event Ecaflip.", title:"Enfant du Destin", trigger:"event", condition:u=>(u.stats?.eventPacksByClass?.ecaflip||0)>=100 },

/* ================= PACKS PAR CLASSE — OUGINAK ================= */

packOuginak1:{ name:"Pisteur Ouginak", badge:"🐺", description:"Ouvrir 1 pack durant l'event Ouginak.", title:"Pisteur Ouginak", trigger:"event", condition:u=>(u.stats?.eventPacksByClass?.ouginak||0)>=1 },
packOuginak10:{ name:"Chasseur Ouginak", badge:"🦴", description:"Ouvrir 10 packs durant l'event Ouginak.", title:"Chasseur Ouginak", trigger:"event", condition:u=>(u.stats?.eventPacksByClass?.ouginak||0)>=10 },
packOuginak25:{ name:"Traqueur", badge:"🌑", description:"Ouvrir 25 packs durant l'event Ouginak.", title:"Traqueur", trigger:"event", condition:u=>(u.stats?.eventPacksByClass?.ouginak||0)>=25 },
packOuginak50:{ name:"Prédateur", badge:"🐾", description:"Ouvrir 50 packs durant l'event Ouginak.", title:"Prédateur", trigger:"event", condition:u=>(u.stats?.eventPacksByClass?.ouginak||0)>=50 },
packOuginak100:{ name:"Chasseur Primordial", badge:"🔱", description:"Ouvrir 100 packs durant l'event Ouginak.", title:"Chasseur Primordial", trigger:"event", condition:u=>(u.stats?.eventPacksByClass?.ouginak||0)>=100 },

/* ================= PACKS PAR CLASSE — FECA ================= */

packFeca1:{ name:"Protégé Feca", badge:"🛡️", description:"Ouvrir 1 pack durant l'event Feca.", title:"Protégé Feca", trigger:"event", condition:u=>(u.stats?.eventPacksByClass?.feca||0)>=1 },
packFeca10:{ name:"Gardien Feca", badge:"⚖️", description:"Ouvrir 10 packs durant l'event Feca.", title:"Gardien Feca", trigger:"event", condition:u=>(u.stats?.eventPacksByClass?.feca||0)>=10 },
packFeca25:{ name:"Rempart Vivant", badge:"🏰", description:"Ouvrir 25 packs durant l'event Feca.", title:"Rempart Vivant", trigger:"event", condition:u=>(u.stats?.eventPacksByClass?.feca||0)>=25 },
packFeca50:{ name:"Égide Sacrée", badge:"✝️", description:"Ouvrir 50 packs durant l'event Feca.", title:"Égide Sacrée", trigger:"event", condition:u=>(u.stats?.eventPacksByClass?.feca||0)>=50 },
packFeca100:{ name:"Égide Divine", badge:"🌟", description:"Ouvrir 100 packs durant l'event Feca.", title:"Égide Divine", trigger:"event", condition:u=>(u.stats?.eventPacksByClass?.feca||0)>=100 },

/* ================= PACKS PAR CLASSE — ENUTROF ================= */

packEnutrof1:{ name:"Chercheur d'Or", badge:"💰", description:"Ouvrir 1 pack durant l'event Enutrof.", title:"Chercheur d'Or", trigger:"event", condition:u=>(u.stats?.eventPacksByClass?.enutrof||0)>=1 },
packEnutrof10:{ name:"Prospecteur", badge:"⛏️", description:"Ouvrir 10 packs durant l'event Enutrof.", title:"Prospecteur", trigger:"event", condition:u=>(u.stats?.eventPacksByClass?.enutrof||0)>=10 },
packEnutrof25:{ name:"Fortuné", badge:"💎", description:"Ouvrir 25 packs durant l'event Enutrof.", title:"Fortuné", trigger:"event", condition:u=>(u.stats?.eventPacksByClass?.enutrof||0)>=25 },
packEnutrof50:{ name:"Trésorier du Krosmoz", badge:"🏦", description:"Ouvrir 50 packs durant l'event Enutrof.", title:"Trésorier du Krosmoz", trigger:"event", condition:u=>(u.stats?.eventPacksByClass?.enutrof||0)>=50 },
packEnutrof100:{ name:"Doigt en Or", badge:"🤑", description:"Ouvrir 100 packs durant l'event Enutrof.", title:"Doigt en Or", trigger:"event", condition:u=>(u.stats?.eventPacksByClass?.enutrof||0)>=100 },

/* ================= PACKS PAR CLASSE — ROUBLARD ================= */

packRoublard1:{ name:"Artificier Novice", badge:"💣", description:"Ouvrir 1 pack durant l'event Roublard.", title:"Artificier Novice", trigger:"event", condition:u=>(u.stats?.eventPacksByClass?.roublard||0)>=1 },
packRoublard10:{ name:"Poseur de Bombes", badge:"💥", description:"Ouvrir 10 packs durant l'event Roublard.", title:"Poseur de Bombes", trigger:"event", condition:u=>(u.stats?.eventPacksByClass?.roublard||0)>=10 },
packRoublard25:{ name:"Saboteur", badge:"🧨", description:"Ouvrir 25 packs durant l'event Roublard.", title:"Saboteur", trigger:"event", condition:u=>(u.stats?.eventPacksByClass?.roublard||0)>=25 },
packRoublard50:{ name:"Expert en Explosifs", badge:"🔧", description:"Ouvrir 50 packs durant l'event Roublard.", title:"Expert en Explosifs", trigger:"event", condition:u=>(u.stats?.eventPacksByClass?.roublard||0)>=50 },
packRoublard100:{ name:"Ombre Explosive", badge:"💀", description:"Ouvrir 100 packs durant l'event Roublard.", title:"Ombre Explosive", trigger:"event", condition:u=>(u.stats?.eventPacksByClass?.roublard||0)>=100 },

/* ================= PACKS PAR CLASSE — STEAMER ================= */

packSteamer1:{ name:"Mécanicien", badge:"🔩", description:"Ouvrir 1 pack durant l'event Steamer.", title:"Mécanicien", trigger:"event", condition:u=>(u.stats?.eventPacksByClass?.steamer||0)>=1 },
packSteamer10:{ name:"Ingénieur Steamer", badge:"⚙️", description:"Ouvrir 10 packs durant l'event Steamer.", title:"Ingénieur Steamer", trigger:"event", condition:u=>(u.stats?.eventPacksByClass?.steamer||0)>=10 },
packSteamer25:{ name:"Technicien de Guerre", badge:"🤖", description:"Ouvrir 25 packs durant l'event Steamer.", title:"Technicien de Guerre", trigger:"event", condition:u=>(u.stats?.eventPacksByClass?.steamer||0)>=25 },
packSteamer50:{ name:"Maître Steamer", badge:"🛠️", description:"Ouvrir 50 packs durant l'event Steamer.", title:"Maître Steamer", trigger:"event", condition:u=>(u.stats?.eventPacksByClass?.steamer||0)>=50 },
packSteamer100:{ name:"Ingénieur de Légende", badge:"🚀", description:"Ouvrir 100 packs durant l'event Steamer.", title:"Ingénieur de Légende", trigger:"event", condition:u=>(u.stats?.eventPacksByClass?.steamer||0)>=100 },

/* ================= PACKS PAR CLASSE — ELIOTROPE ================= */

packEliotrope1:{ name:"Portailleur", badge:"🌀", description:"Ouvrir 1 pack durant l'event Eliotrope.", title:"Portailleur", trigger:"event", condition:u=>(u.stats?.eventPacksByClass?.eliotrope||0)>=1 },
packEliotrope10:{ name:"Tisserand Eliotrope", badge:"🌐", description:"Ouvrir 10 packs durant l'event Eliotrope.", title:"Tisserand Eliotrope", trigger:"event", condition:u=>(u.stats?.eventPacksByClass?.eliotrope||0)>=10 },
packEliotrope25:{ name:"Maître des Portails", badge:"🔵", description:"Ouvrir 25 packs durant l'event Eliotrope.", title:"Maître des Portails", trigger:"event", condition:u=>(u.stats?.eventPacksByClass?.eliotrope||0)>=25 },
packEliotrope50:{ name:"Architecte Dimensionnel", badge:"🌌", description:"Ouvrir 50 packs durant l'event Eliotrope.", title:"Architecte Dimensionnel", trigger:"event", condition:u=>(u.stats?.eventPacksByClass?.eliotrope||0)>=50 },
packEliotrope100:{ name:"Portail Infini", badge:"♾️", description:"Ouvrir 100 packs durant l'event Eliotrope.", title:"Portail Infini", trigger:"event", condition:u=>(u.stats?.eventPacksByClass?.eliotrope||0)>=100 },

/* ================= PACKS PAR CLASSE — ENIRIPSA ================= */

packEniripsa1:{ name:"Soigneur Eniripsa", badge:"💊", description:"Ouvrir 1 pack durant l'event Eniripsa.", title:"Soigneur Eniripsa", trigger:"event", condition:u=>(u.stats?.eventPacksByClass?.eniripsa||0)>=1 },
packEniripsa10:{ name:"Guérisseur", badge:"💉", description:"Ouvrir 10 packs durant l'event Eniripsa.", title:"Guérisseur", trigger:"event", condition:u=>(u.stats?.eventPacksByClass?.eniripsa||0)>=10 },
packEniripsa25:{ name:"Verbe Bienveillant", badge:"🕊️", description:"Ouvrir 25 packs durant l'event Eniripsa.", title:"Verbe Bienveillant", trigger:"event", condition:u=>(u.stats?.eventPacksByClass?.eniripsa||0)>=25 },
packEniripsa50:{ name:"Parole Divine", badge:"📿", description:"Ouvrir 50 packs durant l'event Eniripsa.", title:"Parole Divine", trigger:"event", condition:u=>(u.stats?.eventPacksByClass?.eniripsa||0)>=50 },
packEniripsa100:{ name:"Verbe Sacré", badge:"🌸", description:"Ouvrir 100 packs durant l'event Eniripsa.", title:"Verbe Sacré", trigger:"event", condition:u=>(u.stats?.eventPacksByClass?.eniripsa||0)>=100 },

/* ================= PACKS PAR CLASSE — SADIDA ================= */

packSadida1:{ name:"Semeur Sadida", badge:"🌱", description:"Ouvrir 1 pack durant l'event Sadida.", title:"Semeur Sadida", trigger:"event", condition:u=>(u.stats?.eventPacksByClass?.sadida||0)>=1 },
packSadida10:{ name:"Jardinier Sacré", badge:"🌿", description:"Ouvrir 10 packs durant l'event Sadida.", title:"Jardinier Sacré", trigger:"event", condition:u=>(u.stats?.eventPacksByClass?.sadida||0)>=10 },
packSadida25:{ name:"Maître des Poupées", badge:"🪆", description:"Ouvrir 25 packs durant l'event Sadida.", title:"Maître des Poupées", trigger:"event", condition:u=>(u.stats?.eventPacksByClass?.sadida||0)>=25 },
packSadida50:{ name:"Esprit de la Forêt", badge:"🌳", description:"Ouvrir 50 packs durant l'event Sadida.", title:"Esprit de la Forêt", trigger:"event", condition:u=>(u.stats?.eventPacksByClass?.sadida||0)>=50 },
packSadida100:{ name:"Racine Éternelle", badge:"🍃", description:"Ouvrir 100 packs durant l'event Sadida.", title:"Racine Éternelle", trigger:"event", condition:u=>(u.stats?.eventPacksByClass?.sadida||0)>=100 },

/* ================= PACKS PAR CLASSE — FORGELANCE ================= */

packForgelance1:{ name:"Apprenti Forgeron", badge:"🔨", description:"Ouvrir 1 pack durant l'event Forgelance.", title:"Apprenti Forgeron", trigger:"event", condition:u=>(u.stats?.eventPacksByClass?.forgelance||0)>=1 },
packForgelance10:{ name:"Forgeron Forgelance", badge:"⚒️", description:"Ouvrir 10 packs durant l'event Forgelance.", title:"Forgeron Forgelance", trigger:"event", condition:u=>(u.stats?.eventPacksByClass?.forgelance||0)>=10 },
packForgelance25:{ name:"Maître Forgeron", badge:"🗡️", description:"Ouvrir 25 packs durant l'event Forgelance.", title:"Maître Forgeron", trigger:"event", condition:u=>(u.stats?.eventPacksByClass?.forgelance||0)>=25 },
packForgelance50:{ name:"Artisan de Légende", badge:"🏅", description:"Ouvrir 50 packs durant l'event Forgelance.", title:"Artisan de Légende", trigger:"event", condition:u=>(u.stats?.eventPacksByClass?.forgelance||0)>=50 },
packForgelance100:{ name:"Lame Ancestrale", badge:"⚔️", description:"Ouvrir 100 packs durant l'event Forgelance.", title:"Lame Ancestrale", trigger:"event", condition:u=>(u.stats?.eventPacksByClass?.forgelance||0)>=100 },

/* ================= ACHIEVEMENTS CROISÉS SSR ================= */

ssrCross5:{
 name:"Favori Multiple",
 badge:"🌟",
 description:"Obtenir une SSR lors de 5 events différents.",
 title:"Favori Multiple",
 trigger:"event",
 condition:u=>Object.values(u.stats?.ssrByClass||{}).filter(v=>v>=1).length>=5
},

ssrCross10:{
 name:"Élu du Panthéon",
 badge:"💫",
 description:"Obtenir une SSR lors de 10 events différents.",
 title:"Élu du Panthéon",
 trigger:"event",
 condition:u=>Object.values(u.stats?.ssrByClass||{}).filter(v=>v>=1).length>=10
},

ssrCross19:{
 name:"Béni de Tous les Dieux",
 badge:"🌌",
 description:"Obtenir une SSR lors des 19 events différents.",
 title:"Béni de Tous les Dieux",
 trigger:"event",
 condition:u=>Object.values(u.stats?.ssrByClass||{}).filter(v=>v>=1).length>=19
},

/* ================= JACKPOT ENUTROF ================= */

jackpotEnutrof1:{
 name:"Touché par Enutrof",
 badge:"💰",
 description:"Déclencher le jackpot Enutrof une fois.",
 title:"Touché par Enutrof",
 trigger:"event",
 condition:u=>(u.stats?.jackpotEnutrof||0)>=1
},

jackpotEnutrof3:{
 name:"Protégé d'Enutrof",
 badge:"💎",
 description:"Déclencher le jackpot Enutrof 3 fois.",
 title:"Protégé d'Enutrof",
 trigger:"event",
 condition:u=>(u.stats?.jackpotEnutrof||0)>=3
},

jackpotEnutrof5:{
 name:"Fils d'Enutrof",
 badge:"🤑",
 description:"Déclencher le jackpot Enutrof 5 fois.",
 title:"Fils d'Enutrof",
 trigger:"event",
 condition:u=>(u.stats?.jackpotEnutrof||0)>=5
},

jackpotEnutrof10:{
 name:"Incarnation d'Enutrof",
 badge:"👑",
 description:"Déclencher le jackpot Enutrof 10 fois.",
 title:"Incarnation d'Enutrof",
 trigger:"event",
 condition:u=>(u.stats?.jackpotEnutrof||0)>=10
},

/* ================= JACKPOT FECA ================= */

jackpotFeca1:{
 name:"Touché par Feca",
 badge:"🛡️",
 description:"Déclencher le jackpot Feca une fois.",
 title:"Touché par Feca",
 trigger:"event",
 condition:u=>(u.stats?.jackpotFeca||0)>=1
},

jackpotFeca3:{
 name:"Protégé de Feca",
 badge:"⚖️",
 description:"Déclencher le jackpot Feca 3 fois.",
 title:"Protégé de Feca",
 trigger:"event",
 condition:u=>(u.stats?.jackpotFeca||0)>=3
},

jackpotFeca5:{
 name:"Fils de Feca",
 badge:"✝️",
 description:"Déclencher le jackpot Feca 5 fois.",
 title:"Fils de Feca",
 trigger:"event",
 condition:u=>(u.stats?.jackpotFeca||0)>=5
},

jackpotFeca10:{
 name:"Incarnation de Feca",
 badge:"🌟",
 description:"Déclencher le jackpot Feca 10 fois.",
 title:"Incarnation de Feca",
 trigger:"event",
 condition:u=>(u.stats?.jackpotFeca||0)>=10
},

}