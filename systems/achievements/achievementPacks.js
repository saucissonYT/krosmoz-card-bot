/* ===============================================
   ACHIEVEMENTS — PACKS
   Packs ouverts + RNG spéciaux
=============================================== */

module.exports = {

/* ================= PACKS OUVERTS ================= */

pack1:{
 name:"Premier Pack",
 badge:"📦",
 description:"Ouvrir ton tout premier pack.",
 title:"Apprenti Invocateur",
 trigger:"pack",
 condition:u=>u.stats?.packsOpened>=1
},

pack10:{
 name:"10 Packs",
 badge:"🎴",
 description:"Ouvrir 10 packs.",
 title:"Ouvreur de Packs",
 trigger:"pack",
 condition:u=>u.stats?.packsOpened>=10
},

pack50:{
 name:"50 Packs",
 badge:"🔥",
 description:"Ouvrir 50 packs.",
 title:"Briseur de Pity",
 trigger:"pack",
 condition:u=>u.stats?.packsOpened>=50
},

pack100:{
 name:"100 Packs",
 badge:"🌌",
 description:"Ouvrir 100 packs.",
 title:"Dévoreur de Packs",
 trigger:"pack",
 condition:u=>u.stats?.packsOpened>=100
},

pack250:{
 name:"250 Packs",
 badge:"🌀",
 description:"Ouvrir 250 packs.",
 title:"Addict au Gacha",
 trigger:"pack",
 condition:u=>u.stats?.packsOpened>=250
},

pack500:{
 name:"500 Packs",
 badge:"💫",
 description:"Ouvrir 500 packs.",
 title:"Maître des Packs",
 trigger:"pack",
 condition:u=>u.stats?.packsOpened>=500
},

pack1000:{
 name:"1000 Packs",
 badge:"👑",
 description:"Ouvrir 1000 packs.",
 title:"Seigneur du Gacha",
 trigger:"pack",
 condition:u=>u.stats?.packsOpened>=1000
},

/* ================= PACKS ACHETÉS ================= */

packBuy1:{
 name:"Premier Achat",
 badge:"🛍️",
 description:"Acheter ton premier pack.",
 title:"Client du Marché",
 trigger:"economy",
 condition:u=>u.stats?.packsBought>=1
},

packBuy10:{
 name:"10 Packs achetés",
 badge:"📦",
 description:"Acheter 10 packs.",
 title:"Acheteur Régulier",
 trigger:"economy",
 condition:u=>u.stats?.packsBought>=10
},

packBuy50:{
 name:"50 Packs achetés",
 badge:"💰",
 description:"Acheter 50 packs.",
 title:"Investisseur du Gacha",
 trigger:"economy",
 condition:u=>u.stats?.packsBought>=50
},

packBuy100:{
 name:"100 Packs achetés",
 badge:"🏪",
 description:"Acheter 100 packs.",
 title:"Marchand de Packs",
 trigger:"economy",
 condition:u=>u.stats?.packsBought>=100
},

packBuy500:{
 name:"500 Packs achetés",
 badge:"👑",
 description:"Acheter 500 packs.",
 title:"Magnat du Gacha",
 trigger:"economy",
 condition:u=>u.stats?.packsBought>=500
},

/* ================= RNG PACK ================= */

shinySSR:{
 name:"SSR Shiny",
 badge:"✨",
 description:"Obtenir une SSR Shiny.",
 title:"Touché par la Lumière",
 trigger:"pack",
 condition:()=>false
},

packDivin:{
 name:"Pack Divin",
 badge:"🌟",
 description:"Obtenir un pack extrêmement chanceux.",
 title:"Favori des Dieux",
 trigger:"pack",
 condition:()=>false
},

pileOuFace:{
 name:"Pile ou Face",
 badge:"🪙",
 description:"Déclencher un événement RNG rare.",
 title:"Joueur Chanceux",
 trigger:"pack",
 condition:()=>false
},

impossible:{
 name:"Impossible",
 badge:"💥",
 description:"Obtenir un résultat statistiquement improbable.",
 title:"Miracle du Krosmoz",
 trigger:"pack",
 condition:()=>false
},

pityBreaker:{
 name:"Briseur de Pity",
 badge:"💥",
 description:"Obtenir une carte rare juste avant le pity.",
 title:"Briseur du Destin",
 trigger:"rng",
 condition:()=>false
},

luckyStart:{
 name:"Chance Insolente",
 badge:"🍀",
 description:"Commencer avec une chance exceptionnelle.",
 title:"Favori du RNG",
 trigger:"rng",
 condition:()=>false
},

ssrStreak:{
 name:"SSR Consécutives",
 badge:"🌈🌈",
 description:"Obtenir plusieurs SSR à la suite.",
 title:"Main Chanceuse",
 trigger:"rng",
 condition:()=>false
},

threeStars:{
 name:"Trois Étoiles",
 badge:"⭐",
 description:"Aligner plusieurs résultats chanceux.",
 title:"Alignement Parfait",
 trigger:"rng",
 condition:()=>false
},

hotHand:{
 name:"Main Chaude",
 badge:"🔥",
 description:"Obtenir une série de tirages chanceux.",
 title:"Béni par les Dieux",
 trigger:"rng",
 condition:()=>false
},

nightPlayer:{
 name:"Jouer entre 2h et 5h",
 badge:"🌙",
 description:"Ouvrir un pack entre 2h et 5h du matin.",
 title:"Noctambule",
 trigger:"pack",
 secret:true,
 condition:u=>u.stats?.nightPing
},

}