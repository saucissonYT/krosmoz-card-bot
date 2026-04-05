/* ═══════════════════════════════════════════════════════════════
   ACHIEVEMENTS — ÉCONOMIE
   systems/achievements/achievementEconomy.js

   Achievements liés à l'économie du jeu : kamas possédés,
   consultations de solde, daily claims/streaks, ouvertures
   d'inventaire, consultations d'aide, et changements de titre.

   Triggers utilisés : "economy", "daily", "inventory", "social"

   Catégories :
   - Kamas possédés        (kamas1000 → kamas1000000)
   - Kamas secrets         (kamas666, lucky777, jackpot7777)
   - Balance checks        (balance1 → balance1000)
   - Daily claims          (daily1 → daily100)
   - Daily streaks         (dailyStreak7 → dailyStreak365)
   - Ouvertures inventaire (inventory1 → inventory1000)
   - Consultations aide    (help1 → help1000)
   - Changements de titre  (title1 → title50)

   @module achievementEconomy
   @see achievementRegistry.js — agrégateur
   @see achievementEngine.js  — moteur de vérification
═══════════════════════════════════════════════════════════════ */

module.exports = {

/* ================= KAMAS ================= */

kamas1000:{
 name:"1000 kamas",
 badge:"💰",
 description:"Posséder 1 000 kamas.",
 title:"Petit Marchand",
 trigger:"economy",
 condition:u=>u.kamas>=1000
},

kamas10000:{
 name:"10000 kamas",
 badge:"🪙",
 description:"Posséder 10 000 kamas.",
 title:"Marchand",
 trigger:"economy",
 condition:u=>u.kamas>=10000
},

kamas50000:{
 name:"50000 kamas",
 badge:"💎",
 description:"Posséder 50 000 kamas.",
 title:"Banquier",
 trigger:"economy",
 condition:u=>u.kamas>=50000
},

kamas100000:{
 name:"100000 kamas",
 badge:"🏦",
 description:"Posséder 100 000 kamas.",
 title:"Magnat",
 trigger:"economy",
 condition:u=>u.kamas>=100000
},

kamas500000:{
 name:"500000 kamas",
 badge:"👑",
 description:"Posséder 500 000 kamas.",
 title:"Seigneur des Kamas",
 trigger:"economy",
 condition:u=>u.kamas>=500000
},

kamas1000000:{
 name:"1000000 kamas",
 badge:"💰👑",
 description:"Posséder 1 000 000 de kamas.",
 title:"Empereur des Kamas",
 trigger:"economy",
 condition:u=>u.kamas>=1000000
},

/* ================= SECRETS KAMAS ================= */

kamas666:{
 name:"666 kamas",
 badge:"😈",
 description:"Posséder exactement 666 kamas.",
 title:"Richesse Maudite",
 trigger:"economy",
 secret:true,
 condition:u=>u.kamas===666
},

lucky777:{
 name:"777 kamas",
 badge:"🎰",
 description:"Posséder exactement 777 kamas.",
 title:"Chance Mystique",
 trigger:"economy",
 secret:true,
 condition:u=>u.kamas===777
},

jackpot7777:{
 name:"7777 kamas",
 badge:"💰",
 description:"Posséder exactement 7777 kamas.",
 title:"Jackpot du Krosmoz",
 trigger:"economy",
 secret:true,
 condition:u=>u.kamas===7777
},

/* ================= BALANCE ================= */

balance1:{
 name:"Regarder son solde",
 badge:"💰",
 description:"Consulter ton solde une fois.",
 title:"Curieux Financier",
 trigger:"economy",
 condition:u=>u.stats?.balanceCheck>=1
},

balance10:{
 name:"10 consultations de solde",
 badge:"🧾",
 description:"Consulter ton solde 10 fois.",
 title:"Vérificateur",
 trigger:"economy",
 condition:u=>u.stats?.balanceCheck>=10
},

balance50:{
 name:"50 consultations de solde",
 badge:"📊",
 description:"Consulter ton solde 50 fois.",
 title:"Comptable",
 trigger:"economy",
 condition:u=>u.stats?.balanceCheck>=50
},

balance100:{
 name:"100 consultations de solde",
 badge:"🏦",
 description:"Consulter ton solde 100 fois.",
 title:"Banquier",
 trigger:"economy",
 condition:u=>u.stats?.balanceCheck>=100
},

balance500:{
 name:"500 consultations de solde",
 badge:"👀",
 description:"Consulter ton solde 500 fois.",
 title:"Obsédé du Solde",
 trigger:"economy",
 condition:u=>u.stats?.balanceCheck>=500
},

balance1000:{
 name:"1000 consultations de solde",
 badge:"🧠",
 description:"Consulter ton solde 1000 fois.",
 title:"Parano des Kamas",
 trigger:"economy",
 condition:u=>u.stats?.balanceCheck>=1000
},

/* ================= DAILY ================= */

daily1:{
 name:"Premier Daily",
 badge:"🎁",
 description:"Récupérer ton premier daily.",
 title:"Habitué",
 trigger:"daily",
 condition:u=>u.stats?.dailyClaims>=1
},

daily7:{
 name:"7 Daily",
 badge:"🔥",
 description:"Récupérer 7 daily.",
 title:"Régulier",
 trigger:"daily",
 condition:u=>u.stats?.dailyClaims>=7
},

daily30:{
 name:"30 Daily",
 badge:"📅",
 description:"Récupérer 30 daily.",
 title:"Fidèle du Krosmoz",
 trigger:"daily",
 condition:u=>u.stats?.dailyClaims>=30
},

daily100:{
 name:"100 Daily",
 badge:"🏆",
 description:"Récupérer 100 daily.",
 title:"Pilier du Krosmoz",
 trigger:"daily",
 condition:u=>u.stats?.dailyClaims>=100
},

dailyStreak7:{
 name:"Streak 7",
 badge:"🔥",
 description:"Maintenir une streak de 7 jours.",
 title:"Motivé",
 trigger:"daily",
 condition:u=>u.daily?.streak>=7
},

dailyStreak30:{
 name:"Streak 30",
 badge:"🌟",
 description:"Maintenir une streak de 30 jours.",
 title:"Dévoué",
 trigger:"daily",
 condition:u=>u.daily?.streak>=30
},

dailyStreak60:{
 name:"Streak 60",
 badge:"🌈",
 description:"Maintenir une streak de 60 jours.",
 title:"Inébranlable",
 trigger:"daily",
 condition:u=>u.daily?.streak>=60
},

dailyStreak90:{
 name:"Streak 90",
 badge:"💎",
 description:"Maintenir une streak de 90 jours.",
 title:"Fanatique du Daily",
 trigger:"daily",
 condition:u=>u.daily?.streak>=90
},

dailyStreak120:{
 name:"Streak 120",
 badge:"🏆",
 description:"Maintenir une streak de 120 jours.",
 title:"Pilier du Krosmoz",
 trigger:"daily",
 condition:u=>u.daily?.streak>=120
},

dailyStreak200:{
 name:"Streak 200",
 badge:"👑",
 description:"Maintenir une streak de 200 jours.",
 title:"Légende du Daily",
 trigger:"daily",
 condition:u=>u.daily?.streak>=200
},

dailyStreak300:{
 name:"Streak 300",
 badge:"🌌",
 description:"Maintenir une streak de 300 jours.",
 title:"Dieu du Daily",
 trigger:"daily",
 condition:u=>u.daily?.streak>=300
},

dailyStreak365:{
 name:"Streak 365",
 badge:"☀️",
 description:"Maintenir une streak de 365 jours.",
 title:"Année Parfaite",
 trigger:"daily",
 condition:u=>u.daily?.streak>=365
},

/* ================= INVENTAIRE ================= */

inventory1:{
 name:"Premier inventaire",
 badge:"🎒",
 description:"Ouvrir ton inventaire une fois.",
 title:"Curieux",
 trigger:"inventory",
 condition:u=>u.stats?.inventoryOpen>=1
},

inventory10:{
 name:"10 inventaires",
 badge:"📂",
 description:"Ouvrir ton inventaire 10 fois.",
 title:"Organisateur",
 trigger:"inventory",
 condition:u=>u.stats?.inventoryOpen>=10
},

inventory50:{
 name:"50 inventaires",
 badge:"🗃️",
 description:"Ouvrir ton inventaire 50 fois.",
 title:"Archiviste du Krosmoz",
 trigger:"inventory",
 condition:u=>u.stats?.inventoryOpen>=50
},

inventory100:{
 name:"100 inventaires",
 badge:"📚",
 description:"Ouvrir ton inventaire 100 fois.",
 title:"Collectionneur Méthodique",
 trigger:"inventory",
 condition:u=>u.stats?.inventoryOpen>=100
},

inventory1000:{
 name:"1000 inventaires",
 badge:"👁️",
 description:"Ouvrir ton inventaire 1000 fois.",
 title:"Gardien des Collections",
 trigger:"inventory",
 condition:u=>u.stats?.inventoryOpen>=1000
},

/* ================= HELP ================= */

help1:{
 name:"Besoin d'aide ?",
 badge:"❓",
 description:"Ouvrir l'aide une fois.",
 title:"Perdu dans le Krosmoz",
 trigger:"social",
 condition:u=>u.stats?.helpOpen>=1
},

help10:{
 name:"10 aides consultées",
 badge:"📖",
 description:"Consulter l'aide 10 fois.",
 title:"Lecteur du Manuel",
 trigger:"social",
 condition:u=>u.stats?.helpOpen>=10
},

help50:{
 name:"50 aides consultées",
 badge:"🧠",
 description:"Consulter l'aide 50 fois.",
 title:"Toujours un doute",
 trigger:"social",
 condition:u=>u.stats?.helpOpen>=50
},

help100:{
 name:"100 aides consultées",
 badge:"📚",
 description:"Consulter l'aide 100 fois.",
 title:"Expert en théorie",
 trigger:"social",
 condition:u=>u.stats?.helpOpen>=100
},

help500:{
 name:"500 aides consultées",
 badge:"🤯",
 description:"Consulter l'aide 500 fois.",
 title:"Besoin d'un tuteur",
 trigger:"social",
 condition:u=>u.stats?.helpOpen>=500
},

help1000:{
 name:"1000 aides consultées",
 badge:"🆘",
 description:"Consulter l'aide 1000 fois.",
 title:"Cas Désespéré",
 trigger:"social",
 condition:u=>u.stats?.helpOpen>=1000
},

/* ================= TITRES ================= */

title1:{
 name:"Premier titre",
 badge:"👑",
 description:"Changer de titre une fois.",
 title:"Stylé",
 trigger:"social",
 condition:u=>u.stats?.titleChanges>=1
},

title10:{
 name:"10 titres changés",
 badge:"🎭",
 description:"Changer de titre 10 fois.",
 title:"Indécis",
 trigger:"social",
 condition:u=>u.stats?.titleChanges>=10
},

title50:{
 name:"50 titres changés",
 badge:"🌀",
 description:"Changer de titre 50 fois.",
 title:"Caméléon du Krosmoz",
 trigger:"social",
 condition:u=>u.stats?.titleChanges>=50
},

}