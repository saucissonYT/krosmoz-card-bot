/* ===============================================
   ACHIEVEMENTS — SPÉCIAUX
   Comportementaux, malchance, market, trade,
   collection, vitesse, palindrome, prestige
=============================================== */

const ALL_TRIGGERS = ["pack","rng","economy","collection","fusion","social","inventory","daily","krosmoshop","event"]

module.exports = {

/* ================= PACK MINUIT ================= */

packMinuit:{
 name:"Minuit au Krosmoz",
 badge:"🌙",
 description:"Ouvrir un pack à minuit pile.",
 title:"Noctambule Absolu",
 trigger:"pack",
 condition:u=>u.stats?.packAtMidnight>=1
},

/* ================= VENDRE EN 10 SECONDES ================= */

sellFast:{
 name:"Sans Regret",
 badge:"💨",
 description:"Vendre une carte dans les 10 secondes après l'avoir obtenue.",
 title:"Vendeur Impulsif",
 trigger:"economy",
 secret:true,
 condition:u=>u.stats?.sellFast>=1
},

/* ================= 0 KAMAS ================= */

broke:{
 name:"Fauché mais Heureux",
 badge:"🪙",
 description:"Posséder exactement 0 kamas.",
 title:"Économe Forcé",
 trigger:"economy",
 condition:u=>u.kamas===0
},

/* ================= MARKET BOTH WAYS ================= */

marketBothWays:{
 name:"Marchand Équilibré",
 badge:"⚖️",
 description:"Avoir vendu ET acheté au moins une carte sur le market.",
 title:"Commerçant du Krosmoz",
 trigger:"economy",
 condition:u=>(u.stats?.cardsSold>=1) && (u.stats?.marketBought>=1)
},

/* ================= TOUS LES TRIGGERS ================= */

allTriggers:{
 name:"Touche-à-Tout",
 badge:"🎯",
 description:"Débloquer au moins un succès dans chaque catégorie du jeu.",
 title:"Maître du Krosmoz",
 trigger:"pack",
 secret:true,
 condition:u=>{
  if(!u.achievements?.length) return false
  /*
   * FIX: require("./achievementRegistry") → require("../achievementRegistry")
   * Ce fichier est dans systems/achievements/, le registry est dans systems/
   * L'ancien chemin créait une dépendance circulaire qui crash ou retourne {}
   */
  const achievements = require("../achievementRegistry")
  return ALL_TRIGGERS.every(trigger =>
   u.achievements.some(id => achievements[id]?.trigger === trigger)
  )
 }
},

/* ================= MALCHANCE — HARD PITY ================= */

hardPitySSR:{
 name:"Le Destin s'Acharne",
 badge:"😭",
 description:"Atteindre le hard pity SSR (50 packs) avant d'obtenir une SSR.",
 title:"Maudit du RNG",
 trigger:"pack",
 condition:u=>(u.stats?.hardPityReached||0)>=1
},

/* ================= MALCHANCE — SÉCHERESSE ================= */

droughtSSR:{
 name:"Sécheresse Légendaire",
 badge:"🏜️",
 description:"Ouvrir 100 packs consécutifs sans obtenir de S ni de SSR.",
 title:"Puni par les Dieux",
 trigger:"pack",
 condition:u=>(u.stats?.dryStreak||0)>=100
},

/* ================= TRADE PARTENAIRE ================= */

tradePartner5:{
 name:"Partenaire de Confiance",
 badge:"🤝",
 description:"Faire 5 trades avec le même joueur.",
 title:"Allié du Krosmoz",
 trigger:"economy",
 condition:u=>{
  const partners = u.stats?.tradePartners || {}
  return Object.values(partners).some(v=>v>=5)
 }
},

/* ================= TRADE BOTH WAYS ================= */

tradeBothWays:{
 name:"Troc du Jour",
 badge:"🔄",
 description:"Envoyer et recevoir un trade dans la même journée.",
 title:"Marchand Équitable",
 trigger:"economy",
 condition:u=>u.stats?.tradeBothWaysToday>=1
},

/* ================= SPECTRE COMPLET ================= */

allRarities:{
 name:"Spectre Complet",
 badge:"🌈",
 description:"Posséder au moins une carte de chaque rareté.",
 title:"Collectionneur Universel",
 trigger:"collection",
 condition:u=>{
  if(!u.cards) return false
  /*
   * FIX: require("./cardRegistry") → require("../cardRegistry")
   * Même raison : ce fichier est dans systems/achievements/
   */
  const { getCardsById } = require("../cardRegistry")
  const cardsById = getCardsById()
  const rarities = new Set(
   Object.keys(u.cards)
    .filter(id => u.cards[id] > 0)
    .map(id => cardsById[id]?.rarity)
    .filter(Boolean)
  )
  return ["C","U","R","SR","HR","UR","S","SSR"].every(r=>rarities.has(r))
 }
},

/* ================= HOARDER ================= */

hoarder10:{
 name:"Obsessionnel",
 badge:"🔁",
 description:"Posséder 10 exemplaires d'une même carte.",
 title:"Accumulateur",
 trigger:"collection",
 condition:u=>Math.max(0,...Object.values(u.cards||{}))>=10
},

hoarder25:{
 name:"Stockeur",
 badge:"📦",
 description:"Posséder 25 exemplaires d'une même carte.",
 title:"Entrepôt Ambulant",
 trigger:"collection",
 condition:u=>Math.max(0,...Object.values(u.cards||{}))>=25
},

hoarder50:{
 name:"Grande Réserve",
 badge:"🏭",
 description:"Posséder 50 exemplaires d'une même carte.",
 title:"Seigneur du Stock",
 trigger:"collection",
 condition:u=>Math.max(0,...Object.values(u.cards||{}))>=50
},

hoarder100:{
 name:"C'est ma carte",
 badge:"💎",
 description:"Posséder 100 exemplaires d'une même carte.",
 title:"Obsédé Absolu",
 trigger:"collection",
 condition:u=>Math.max(0,...Object.values(u.cards||{}))>=100
},

/* ================= VÉTÉRAN 30 JOURS ================= */

veteran30:{
 name:"Vétéran",
 badge:"📅",
 description:"Être inscrit depuis au moins 30 jours.",
 title:"Ancien du Krosmoz",
 trigger:"social",
 condition:u=>u.stats?.createdAt && (Date.now()-u.stats.createdAt)>=(30*86400000)
},

/* ================= ACTIF 7 JOURS ================= */

active7days:{
 name:"Présence Régulière",
 badge:"🔥",
 description:"Jouer 7 jours consécutifs.",
 title:"Fidèle du Krosmoz",
 trigger:"daily",
 condition:u=>(u.stats?.activityStreak||0)>=7
},

/* ================= PREMIER EVENTPACK ================= */

firstEventPack:{
 name:"Premier Arrivé",
 badge:"🥇",
 description:"Être le premier à ouvrir un pack lors d'un event.",
 title:"Réactif",
 trigger:"event",
 condition:u=>(u.stats?.firstEventPacks||0)>=1
},

/* ================= KROSMOZ 42 — 777 ================= */

krosmoz42:{
 name:"La Réponse",
 badge:"🌌",
 description:"Ouvrir 42 packs /krosmoz.",
 title:"42",
 trigger:"pack",
 secret:true,
 condition:u=>(u.stats?.krosmozOpened||0)>=42
},

krosmoz111:{
 name:"Triple Un",
 badge:"1️⃣",
 description:"Ouvrir 111 packs /krosmoz.",
 title:"Alignement Parfait",
 trigger:"pack",
 condition:u=>(u.stats?.krosmozOpened||0)>=111
},

krosmoz222:{
 name:"Double Paire",
 badge:"2️⃣",
 description:"Ouvrir 222 packs /krosmoz.",
 title:"Symétrique",
 trigger:"pack",
 condition:u=>(u.stats?.krosmozOpened||0)>=222
},

krosmoz333:{
 name:"Triple Trois",
 badge:"3️⃣",
 description:"Ouvrir 333 packs /krosmoz.",
 title:"Trinité du Pack",
 trigger:"pack",
 condition:u=>(u.stats?.krosmozOpened||0)>=333
},

krosmoz444:{
 name:"Carré d'As",
 badge:"4️⃣",
 description:"Ouvrir 444 packs /krosmoz.",
 title:"Quadruplé",
 trigger:"pack",
 condition:u=>(u.stats?.krosmozOpened||0)>=444
},

krosmoz555:{
 name:"Cinq Étoiles",
 badge:"5️⃣",
 description:"Ouvrir 555 packs /krosmoz.",
 title:"Quintuple",
 trigger:"pack",
 condition:u=>(u.stats?.krosmozOpened||0)>=555
},

krosmoz666:{
 name:"Nombre de la Bête",
 badge:"😈",
 description:"Ouvrir 666 packs /krosmoz.",
 title:"Maudit du Pack",
 trigger:"pack",
 secret:true,
 condition:u=>(u.stats?.krosmozOpened||0)>=666
},

krosmoz777:{
 name:"Jackpot",
 badge:"🎰",
 description:"Ouvrir 777 packs /krosmoz.",
 title:"Béni des Chiffres",
 trigger:"pack",
 condition:u=>(u.stats?.krosmozOpened||0)>=777
},

/* ================= PALINDROME ================= */

palindrome:{
 name:"Symétrie Parfaite",
 badge:"🪞",
 description:"Posséder un nombre de cartes palindrome.",
 title:"Mathématicien du Krosmoz",
 trigger:"collection",
 secret:true,
 condition:u=>u.stats?.palindromeReached>=1
},

/* ================= PACK ALL C / ALL U ================= */

allC:{
 name:"Krosmoz se Moque",
 badge:"😂",
 description:"Ouvrir un pack et n'obtenir que des cartes C.",
 title:"Humble",
 trigger:"pack",
 secret:true,
 condition:u=>u.stats?.allCPack>=1
},

allU:{
 name:"Rookie de Luxe",
 badge:"🟢",
 description:"Ouvrir un pack et n'obtenir que des cartes U.",
 title:"Vert",
 trigger:"pack",
 secret:true,
 condition:u=>u.stats?.allUPack>=1
},

/* ================= SSR UN LUNDI ================= */

ssrLundi:{
 name:"Lundi Chanceux",
 badge:"📆",
 description:"Obtenir une SSR un lundi.",
 title:"Béni du Lundi",
 trigger:"pack",
 condition:u=>u.stats?.ssrOnMonday>=1
},

/* ================= MARKET SSR ================= */

marketSSR:{
 name:"Vendeur Fou",
 badge:"😱",
 description:"Mettre une carte SSR en vente sur le market.",
 title:"Sans Pitié",
 trigger:"economy",
 condition:u=>u.stats?.marketSSRListed>=1
},

/* ================= SPEED TICKETS ================= */

speedTickets:{
 name:"Éclair du Krosmoz",
 badge:"⚡",
 description:"Utiliser tous ses tickets event en moins de 2 minutes.",
 title:"Fulgurant",
 trigger:"event",
 condition:u=>u.stats?.speedTickets>=1
},

/* ================= FUSION SSR ================= */

fusionSSR:{
 name:"Transmutation Divine",
 badge:"🌈",
 description:"Obtenir une SSR comme résultat d'une fusion.",
 title:"Alchimiste Suprême",
 trigger:"fusion",
 condition:u=>(u.stats?.fusionSSRResult||0)>=1
},

/* ================= EVENTPACK SANS EVENT ================= */

eventpackNoEvent:{
 name:"Trop Impatient",
 badge:"😅",
 description:"Utiliser /eventpack alors qu'aucun event n'est actif.",
 title:"En Avance",
 trigger:"secret",
 secret:true,
 condition:u=>u.stats?.eventpackNoEvent===true
},

/* ================= PRESTIGE — NOMBRE D'ACHIEVEMENTS ================= */

achieve10:{
 name:"En Route",
 badge:"🏅",
 description:"Débloquer 10 succès.",
 title:"Chasseur de Succès",
 trigger:"pack",
 condition:u=>(u.achievements?.length||0)>=10
},

achieve25:{
 name:"Prometteur",
 badge:"🎖️",
 description:"Débloquer 25 succès.",
 title:"Collecteur",
 trigger:"pack",
 condition:u=>(u.achievements?.length||0)>=25
},

achieve50:{
 name:"Sérieux",
 badge:"🏆",
 description:"Débloquer 50 succès.",
 title:"Chasseur Sérieux",
 trigger:"pack",
 condition:u=>(u.achievements?.length||0)>=50
},

achieve100:{
 name:"Centenaire",
 badge:"💎",
 description:"Débloquer 100 succès.",
 title:"Centurion",
 trigger:"pack",
 condition:u=>(u.achievements?.length||0)>=100
},

achieve200:{
 name:"Élite",
 badge:"👑",
 description:"Débloquer 200 succès.",
 title:"Légende Vivante",
 trigger:"pack",
 condition:u=>(u.achievements?.length||0)>=200
},

/* ================= KROSMOZ ABSOLU ================= */

achieveAll:{
 name:"Krosmoz Absolu",
 badge:"🌌",
 description:"Débloquer tous les succès du jeu.",
 title:"Krosmoz Absolu",
 trigger:"pack",
 condition:u=>{
  try{
   /*
    * FIX: require("./achievementRegistry") → require("../achievementRegistry")
    * Même fix que allTriggers
    */
   const all = require("../achievementRegistry")
   const total = Object.keys(all).length
   // -1 pour exclure cet achievement lui-même
   return (u.achievements?.length||0) >= total - 1
  }catch(e){
   return false
  }
 }
},

}
