/* ===============================================
   ACHIEVEMENTS — DONS
   Donner et recevoir des cartes
=============================================== */

module.exports = {

/* ================= DONS DONNÉS ================= */

gift1:{
 name:"Premier Don",
 badge:"🎁",
 description:"Donner une carte à un joueur.",
 title:"Donateur",
 trigger:"gift",
 condition:u=>(u.stats?.giftsGiven||0)>=1
},

gift5:{
 name:"Main Ouverte",
 badge:"🤲",
 description:"Donner 5 cartes.",
 title:"Bienfaiteur",
 trigger:"gift",
 condition:u=>(u.stats?.giftsGiven||0)>=5
},

gift10:{
 name:"Cœur Généreux",
 badge:"💝",
 description:"Donner 10 cartes.",
 title:"Cœur d'Or",
 trigger:"gift",
 condition:u=>(u.stats?.giftsGiven||0)>=10
},

gift25:{
 name:"Philanthrope",
 badge:"🏛️",
 description:"Donner 25 cartes.",
 title:"Philanthrope",
 trigger:"gift",
 condition:u=>(u.stats?.giftsGiven||0)>=25
},

gift50:{
 name:"Mécène du Krosmoz",
 badge:"👑",
 description:"Donner 50 cartes.",
 title:"Mécène",
 trigger:"gift",
 condition:u=>(u.stats?.giftsGiven||0)>=50
},

gift100:{
 name:"Légende de Générosité",
 badge:"🌟",
 description:"Donner 100 cartes.",
 title:"Saint du Krosmoz",
 trigger:"gift",
 condition:u=>(u.stats?.giftsGiven||0)>=100
},

/* ================= DONS SPÉCIAUX ================= */

giftSSR:{
 name:"Cadeau Royal",
 badge:"🌈",
 description:"Donner une carte SSR.",
 title:"Généreux Absolu",
 trigger:"gift",
 condition:u=>(u.stats?.giftsSSRGiven||0)>=1
},

giftShiny:{
 name:"Étoile Filante",
 badge:"✨",
 description:"Donner une carte Shiny.",
 title:"Porteur d'Étoile",
 trigger:"gift",
 secret:true,
 condition:u=>(u.stats?.giftsShinyGiven||0)>=1
},

giftUR:{
 name:"Or en Barre",
 badge:"🟡",
 description:"Donner une carte UR.",
 trigger:"gift",
 condition:u=>(u.stats?.giftsURGiven||0)>=1
},

/* ================= DONS REÇUS ================= */

giftReceive1:{
 name:"Heureux Élu",
 badge:"📬",
 description:"Recevoir un don.",
 trigger:"gift",
 condition:u=>(u.stats?.giftsReceived||0)>=1
},

giftReceive10:{
 name:"Chouchou",
 badge:"💌",
 description:"Recevoir 10 dons.",
 title:"Chouchou du Krosmoz",
 trigger:"gift",
 condition:u=>(u.stats?.giftsReceived||0)>=10
},

giftReceive50:{
 name:"Aimant à Cadeaux",
 badge:"🧲",
 description:"Recevoir 50 dons.",
 title:"Aimant à Cadeaux",
 trigger:"gift",
 condition:u=>(u.stats?.giftsReceived||0)>=50
},

/* ================= DONS MUTUELS ================= */

giftBothWays:{
 name:"Donnant-Donnant",
 badge:"🔄",
 description:"Donner ET recevoir un don le même jour.",
 title:"Échangeur",
 trigger:"gift",
 secret:true,
 condition:u=>(u.stats?.giftBothWays||0)>=1
},

giftStreak7:{
 name:"7 Jours de Bonté",
 badge:"📅",
 description:"Donner une carte 7 jours de suite.",
 title:"Bienfaiteur Régulier",
 trigger:"gift",
 condition:u=>(u.stats?.giftStreak||0)>=7
},

giftDifferent10:{
 name:"Généreux Universel",
 badge:"🌍",
 description:"Donner des cartes à 10 joueurs différents.",
 title:"Ami de Tous",
 trigger:"gift",
 condition:u=>Object.keys(u.stats?.giftRecipients||{}).length>=10
},

}