/* ═══════════════════════════════════════════════════════════════
   ACHIEVEMENTS — PACKS
   systems/achievements/achievementPacks.js

   Achievements liés à l'ouverture de packs, aux achats, aux
   ouvertures multi (bulk), au RNG, et au stock de packs.

   Triggers utilisés : "pack", "economy", "rng"

   Catégories :
   - Packs ouverts     (pack1 → pack1000)
   - Packs achetés     (packBuy1 → packBuy500)
   - Achats multi x2+  (bulkBuy1 → bulkBuy50 + secrets)
   - Ouvertures multi  (bulkOpen1 → bulkOpen50 + secrets)
   - RNG spéciaux      (shinySSR, packDivin, pityBreaker...)
   - Combos bulk       (bulkCombo20, bulkDual100...)
   - Stock de packs    (packStock25 → packStock500)

   @module achievementPacks
   @see achievementRegistry.js — agrégateur
   @see achievementEngine.js  — moteur de vérification
═══════════════════════════════════════════════════════════════ */

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
 title:"Devoreur de Packs",
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
 title:"Maitre des Packs",
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

/* ================= PACKS ACHETES ================= */

packBuy1:{
 name:"Premier Achat",
 badge:"🛍️",
 description:"Acheter ton premier pack.",
 title:"Client du Marche",
 trigger:"economy",
 condition:u=>u.stats?.packsBought>=1
},

packBuy10:{
 name:"10 Packs achetes",
 badge:"📦",
 description:"Acheter 10 packs.",
 title:"Acheteur Regulier",
 trigger:"economy",
 condition:u=>u.stats?.packsBought>=10
},

packBuy50:{
 name:"50 Packs achetes",
 badge:"💰",
 description:"Acheter 50 packs.",
 title:"Investisseur du Gacha",
 trigger:"economy",
 condition:u=>u.stats?.packsBought>=50
},

packBuy100:{
 name:"100 Packs achetes",
 badge:"🏪",
 description:"Acheter 100 packs.",
 title:"Marchand de Packs",
 trigger:"economy",
 condition:u=>u.stats?.packsBought>=100
},

packBuy500:{
 name:"500 Packs achetes",
 badge:"👑",
 description:"Acheter 500 packs.",
 title:"Magnat du Gacha",
 trigger:"economy",
 condition:u=>u.stats?.packsBought>=500
},

/* ================= ACHATS MULTI (x2+) ================= */

bulkBuy1:{
 name:"Achat Groupe",
 badge:"🧺",
 description:"Acheter plusieurs packs d'un coup (x2+) 1 fois.",
 title:"Client Groupe",
 trigger:"economy",
 condition:u=>(u.stats?.multiPackBuys||0)>=1
},

bulkBuy5:{
 name:"5 Achats Groupes",
 badge:"📦",
 description:"Acheter plusieurs packs d'un coup (x2+) 5 fois.",
 title:"Acheteur en Serie",
 trigger:"economy",
 condition:u=>(u.stats?.multiPackBuys||0)>=5
},

bulkBuy10:{
 name:"10 Achats Groupes",
 badge:"🛒",
 description:"Acheter plusieurs packs d'un coup (x2+) 10 fois.",
 title:"Grossiste du Krosmoz",
 trigger:"economy",
 condition:u=>(u.stats?.multiPackBuys||0)>=10
},

bulkBuy25:{
 name:"25 Achats Groupes",
 badge:"🏬",
 description:"Acheter plusieurs packs d'un coup (x2+) 25 fois.",
 title:"Negociant des Lots",
 trigger:"economy",
 condition:u=>(u.stats?.multiPackBuys||0)>=25
},

bulkBuy50:{
 name:"50 Achats Groupes",
 badge:"🏦",
 description:"Acheter plusieurs packs d'un coup (x2+) 50 fois.",
 title:"Seigneur des Commandes",
 trigger:"economy",
 condition:u=>(u.stats?.multiPackBuys||0)>=50
},

bulkBuy20:{
 name:"Commande XXL",
 badge:"🛰️",
 description:"Acheter 20 packs d'un seul coup.",
 title:"Intendant Galactique",
 trigger:"economy",
 secret:true,
 condition:u=>(u.stats?.maxBulkBuy||0)>=20
},

/* ================= OUVERTURES MULTI (x2+) ================= */

bulkOpen1:{
 name:"Giga Pack",
 badge:"⚙️",
 description:"Ouvrir plusieurs packs en une commande (x2+) 1 fois.",
 title:"Pilote de Giga Pack",
 trigger:"pack",
 condition:u=>(u.stats?.multiPackOpens||0)>=1
},

bulkOpen5:{
 name:"5 Giga Packs",
 badge:"🚀",
 description:"Ouvrir plusieurs packs en une commande (x2+) 5 fois.",
 title:"Accelerateur de Loot",
 trigger:"pack",
 condition:u=>(u.stats?.multiPackOpens||0)>=5
},

bulkOpen10:{
 name:"10 Giga Packs",
 badge:"🎛️",
 description:"Ouvrir plusieurs packs en une commande (x2+) 10 fois.",
 title:"Chef d'Orchestre RNG",
 trigger:"pack",
 condition:u=>(u.stats?.multiPackOpens||0)>=10
},

bulkOpen25:{
 name:"25 Giga Packs",
 badge:"🧠",
 description:"Ouvrir plusieurs packs en une commande (x2+) 25 fois.",
 title:"Architecte du Farm",
 trigger:"pack",
 condition:u=>(u.stats?.multiPackOpens||0)>=25
},

bulkOpen50:{
 name:"50 Giga Packs",
 badge:"👑",
 description:"Ouvrir plusieurs packs en une commande (x2+) 50 fois.",
 title:"Empereur des Ouvertures",
 trigger:"pack",
 condition:u=>(u.stats?.multiPackOpens||0)>=50
},

bulkOpen20:{
 name:"Tempete de Packs",
 badge:"🌪️",
 description:"Ouvrir 20 packs d'un seul coup.",
 title:"Briseur de Serveur",
 trigger:"pack",
 secret:true,
 condition:u=>(u.stats?.maxBulkOpen||0)>=20
},

/* ================= RNG PACK ================= */

shinySSR:{
 name:"SSR Shiny",
 badge:"✨",
 description:"Obtenir une SSR Shiny.",
 title:"Touche par la Lumiere",
 trigger:"pack",
 condition:()=>false
},

packDivin:{
 name:"Pack Divin",
 badge:"🌟",
 description:"Obtenir un pack extremement chanceux.",
 title:"Favori des Dieux",
 trigger:"pack",
 condition:()=>false
},

pileOuFace:{
 name:"Pile ou Face",
 badge:"🪙",
 description:"Declencher un evenement RNG rare.",
 title:"Joueur Chanceux",
 trigger:"pack",
 condition:()=>false
},

impossible:{
 name:"Impossible",
 badge:"💥",
 description:"Obtenir un resultat statistiquement improbable.",
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
 name:"SSR Consecutives",
 badge:"🌈🌈",
 description:"Obtenir plusieurs SSR a la suite.",
 title:"Main Chanceuse",
 trigger:"rng",
 condition:()=>false
},

threeStars:{
 name:"Trois Etoiles",
 badge:"⭐",
 description:"Aligner plusieurs resultats chanceux.",
 title:"Alignement Parfait",
 trigger:"rng",
 condition:()=>false
},

hotHand:{
 name:"Main Chaude",
 badge:"🔥",
 description:"Obtenir une serie de tirages chanceux.",
 title:"Beni par les Dieux",
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

/* ================= HIDDEN SHOTS - ACHAT (exact gros lot) ================= */

bulkBuyShot5:{
 name:"Main Lourde",
 badge:"🫥",
 description:"Acheter 5 packs d'un seul coup.",
 title:"Main Lourde",
 trigger:"economy",
 secret:true,
 condition:u=>(u.stats?.maxBulkBuy||0)>=5
},

bulkBuyShot10:{
 name:"Caddie Charge",
 badge:"🛒",
 description:"Acheter 10 packs d'un seul coup.",
 title:"Caddie Charge",
 trigger:"economy",
 secret:true,
 condition:u=>(u.stats?.maxBulkBuy||0)>=10
},

bulkBuyShot15:{
 name:"Acheteur Serieux",
 badge:"📚",
 description:"Acheter 15 packs d'un seul coup.",
 title:"Acheteur Serieux",
 trigger:"economy",
 secret:true,
 condition:u=>(u.stats?.maxBulkBuy||0)>=15
},

bulkBuyShot20:{
 name:"Commande de Guerre",
 badge:"🛡️",
 description:"Acheter 20 packs d'un seul coup.",
 title:"Logisticien du Krosmoz",
 trigger:"economy",
 secret:true,
 condition:u=>(u.stats?.maxBulkBuy||0)>=20
},

bulkBuyShot25:{
 name:"Terminal Carte Bleue",
 badge:"💳",
 description:"Acheter 25 packs d'un seul coup.",
 title:"Prince des Commandes",
 trigger:"economy",
 secret:true,
 condition:u=>(u.stats?.maxBulkBuy||0)>=25
},

/* ================= HIDDEN SHOTS - OUVERTURE (exact gros lot) ================= */

bulkOpenShot5:{
 name:"Petite Rafale",
 badge:"🍃",
 description:"Ouvrir 5 packs d'un seul coup.",
 title:"Rafaleur",
 trigger:"pack",
 secret:true,
 condition:u=>(u.stats?.maxBulkOpen||0)>=5
},

bulkOpenShot10:{
 name:"Double Digit",
 badge:"🔟",
 description:"Ouvrir 10 packs d'un seul coup.",
 title:"Cadence x10",
 trigger:"pack",
 secret:true,
 condition:u=>(u.stats?.maxBulkOpen||0)>=10
},

bulkOpenShot15:{
 name:"Machine de Guerre",
 badge:"⚔️",
 description:"Ouvrir 15 packs d'un seul coup.",
 title:"Mitrailleur de Loot",
 trigger:"pack",
 secret:true,
 condition:u=>(u.stats?.maxBulkOpen||0)>=15
},

bulkOpenShot20:{
 name:"Orage de Cartes",
 badge:"⛈️",
 description:"Ouvrir 20 packs d'un seul coup.",
 title:"Maitre de l'Orage",
 trigger:"pack",
 secret:true,
 condition:u=>(u.stats?.maxBulkOpen||0)>=20
},

bulkOpenShot25:{
 name:"Supernova",
 badge:"🌋",
 description:"Ouvrir 25 packs d'un seul coup.",
 title:"Supernova du Krosmoz",
 trigger:"pack",
 secret:true,
 condition:u=>(u.stats?.maxBulkOpen||0)>=25
},

/* ================= HIDDEN INNOVATION - COMBOS ================= */

bulkCombo20:{
 name:"Twin Turbo",
 badge:"🏁",
 description:"Atteindre x20 en achat et x20 en ouverture.",
 title:"Twin Turbo",
 trigger:"pack",
 secret:true,
 condition:u=>(u.stats?.maxBulkBuy||0)>=20 && (u.stats?.maxBulkOpen||0)>=20
},

bulkCombo25:{
 name:"Surcharge Totale",
 badge:"🧨",
 description:"Atteindre x25 en achat et x25 en ouverture.",
 title:"Surcharge Totale",
 trigger:"pack",
 secret:true,
 condition:u=>(u.stats?.maxBulkBuy||0)>=25 && (u.stats?.maxBulkOpen||0)>=25
},

bulkFlow50:{
 name:"Routier du Multi",
 badge:"🚛",
 description:"Faire 50 achats multi et 50 ouvertures multi.",
 title:"Routier du Multi",
 trigger:"pack",
 secret:true,
 condition:u=>(u.stats?.multiPackBuys||0)>=50 && (u.stats?.multiPackOpens||0)>=50
},

bulkRush25:{
 name:"Rush 25",
 badge:"🧿",
 description:"Ouvrir au moins 25 fois en multi-pack (x2+).",
 title:"Marathonien des Packs",
 trigger:"pack",
 secret:true,
 condition:u=>(u.stats?.multiPackOpens||0)>=25
},

bulkTrader25:{
 name:"Patron des Lots",
 badge:"🏛️",
 description:"Acheter au moins 25 fois en multi-achat (x2+).",
 title:"Patron des Lots",
 trigger:"economy",
 secret:true,
 condition:u=>(u.stats?.multiPackBuys||0)>=25
},

bulkDual100:{
 name:"Centurion du Multi",
 badge:"💠",
 description:"Cumuler 100 actions multi (achat + ouverture).",
 title:"Centurion du Multi",
 trigger:"pack",
 secret:true,
 condition:u=>((u.stats?.multiPackBuys||0) + (u.stats?.multiPackOpens||0))>=100
},

/* ================= PACKS EN STOCK (disponibles) ================= */

packStock25:{
 name:"Petite Réserve",
 badge:"📦",
 description:"Avoir 25 packs disponibles en stock.",
 title:"Préparateur",
 trigger:"economy",
 condition:u=>(u.packs||0)>=25
},

packStock50:{
 name:"Bonne Réserve",
 badge:"🗃️",
 description:"Avoir 50 packs disponibles en stock.",
 title:"Stockeur",
 trigger:"economy",
 condition:u=>(u.packs||0)>=50
},

packStock100:{
 name:"Grande Réserve",
 badge:"🏦",
 description:"Avoir 100 packs disponibles en stock.",
 title:"Entrepôt du Krosmoz",
 trigger:"economy",
 condition:u=>(u.packs||0)>=100
},

packStock200:{
 name:"Stock Massif",
 badge:"🏰",
 description:"Avoir 200 packs disponibles en stock.",
 title:"Baron des Packs",
 trigger:"economy",
 condition:u=>(u.packs||0)>=200
},

packStock500:{
 name:"Trésor de Packs",
 badge:"💎",
 description:"Avoir 500 packs disponibles en stock.",
 title:"Trésorier du Krosmoz",
 trigger:"economy",
 condition:u=>(u.packs||0)>=500
},

}