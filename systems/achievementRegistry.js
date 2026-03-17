const achievements = {

/* ================= PACKS ================= */

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

/* ================= SSR ================= */

firstSSR:{
 name:"Première SSR",
 badge:"🌈",
 description:"Obtenir ta première carte SSR.",
 title:"Touché par le Destin",
 trigger:"pack",
 condition:u=>u.stats?.ssrPulled>=1
},

ssr5:{
 name:"5 SSR",
 badge:"⭐",
 description:"Obtenir 5 cartes SSR.",
 title:"Chasseur de Légendes",
 trigger:"pack",
 condition:u=>u.stats?.ssrPulled>=5
},

ssr10:{
 name:"10 SSR",
 badge:"💎",
 description:"Obtenir 10 cartes SSR.",
 title:"Collectionneur de Légendes",
 trigger:"pack",
 condition:u=>u.stats?.ssrPulled>=10
},

ssr25:{
 name:"25 SSR",
 badge:"🌟",
 description:"Obtenir 25 cartes SSR.",
 title:"Maître des Légendes",
 trigger:"pack",
 condition:u=>u.stats?.ssrPulled>=25
},

ssr50:{
 name:"50 SSR",
 badge:"👑",
 description:"Obtenir 50 cartes SSR.",
 title:"Seigneur des SSR",
 trigger:"pack",
 condition:u=>u.stats?.ssrPulled>=50
},

/* ================= SHINY ================= */

shiny1:{
 name:"Première SSR Shiny",
 badge:"✨",
 description:"Obtenir ta première SSR Shiny.",
 title:"Porteur de Lumière",
 trigger:"pack",
 condition:u=>u.stats?.shinySSR>=1
},

shiny3:{
 name:"3 SSR Shiny",
 badge:"🌟",
 description:"Obtenir 3 SSR Shiny.",
 title:"Aura Mystique",
 trigger:"pack",
 condition:u=>u.stats?.shinySSR>=3
},

shiny5:{
 name:"5 SSR Shiny",
 badge:"🌈",
 description:"Obtenir 5 SSR Shiny.",
 title:"Collectionneur de Lumière",
 trigger:"pack",
 condition:u=>u.stats?.shinySSR>=5
},

shiny10:{
 name:"10 SSR Shiny",
 badge:"💫",
 description:"Obtenir 10 SSR Shiny.",
 title:"Avatar de Lumière",
 trigger:"pack",
 condition:u=>u.stats?.shinySSR>=10
},

/* ================= FUSION ================= */

fusion1:{
 name:"Première fusion",
 badge:"⚗️",
 description:"Réaliser ta première fusion de cartes.",
 title:"Alchimiste",
 trigger:"fusion",
 condition:u=>u.stats?.fusions>=1
},

fusion10:{
 name:"10 fusions",
 badge:"🔥",
 description:"Réaliser 10 fusions.",
 title:"Transmutateur",
 trigger:"fusion",
 condition:u=>u.stats?.fusions>=10
},

fusion50:{
 name:"50 fusions",
 badge:"🧪",
 description:"Réaliser 50 fusions.",
 title:"Maître Alchimiste",
 trigger:"fusion",
 condition:u=>u.stats?.fusions>=50
},

fusion100:{
 name:"100 fusions",
 badge:"🌈",
 description:"Réaliser 100 fusions.",
 title:"Alchimiste Suprême",
 trigger:"fusion",
 condition:u=>u.stats?.fusions>=100
},

fusionCrit:{
 name:"Critique !",
 badge:"🔥",
 description:"Déclencher une fusion critique.",
 title:"Alchimiste Brutal",
 trigger:"fusion",
 condition:u=>u.stats?.fusionCrit>=1
},

fusionDouble:{
 name:"Fusion Double",
 badge:"✨",
 description:"Obtenir un résultat double lors d'une fusion.",
 title:"Duplication Parfaite",
 trigger:"fusion",
 condition:u=>u.stats?.fusionDouble>=1
},

fusionTriple:{
 name:"Triple Fusion",
 badge:"🌈",
 description:"Obtenir une triple fusion.",
 title:"Miracle Alchimique",
 trigger:"fusion",
 condition:u=>u.stats?.tripleFusion>=1
},

/* ================= COLLECTION ================= */

cards50:{
 name:"50 cartes",
 badge:"📚",
 description:"Posséder 50 cartes au total.",
 title:"Collectionneur",
 trigger:"collection",
 condition:u=>Object.values(u.cards||{}).reduce((a,b)=>a+b,0)>=50
},

cards100:{
 name:"100 cartes",
 badge:"🗃️",
 description:"Posséder 100 cartes au total.",
 title:"Archiviste",
 trigger:"collection",
 condition:u=>Object.values(u.cards||{}).reduce((a,b)=>a+b,0)>=100
},

cards250:{
 name:"250 cartes",
 badge:"🏛️",
 description:"Posséder 250 cartes au total.",
 title:"Conservateur",
 trigger:"collection",
 condition:u=>Object.values(u.cards||{}).reduce((a,b)=>a+b,0)>=250
},

cards500:{
 name:"500 cartes",
 badge:"📖",
 description:"Posséder 500 cartes au total.",
 title:"Bibliothécaire",
 trigger:"collection",
 condition:u=>Object.values(u.cards||{}).reduce((a,b)=>a+b,0)>=500
},

cards1000:{
 name:"1000 cartes",
 badge:"👑",
 description:"Posséder 1000 cartes au total.",
 title:"Gardien du Krosmoz",
 trigger:"collection",
 condition:u=>Object.values(u.cards||{}).reduce((a,b)=>a+b,0)>=1000
},

unique10:{
 name:"10 cartes uniques",
 badge:"📘",
 description:"Collectionner 10 cartes différentes.",
 title:"Découvreur",
 trigger:"collection",
 condition:u=>Object.keys(u.cards||{}).length>=10
},

unique100:{
 name:"100 cartes uniques",
 badge:"📚",
 description:"Collectionner 100 cartes différentes.",
 title:"Archiviste",
 trigger:"collection",
 condition:u=>Object.keys(u.cards||{}).length>=100
},

unique200:{
 name:"200 cartes uniques",
 badge:"📖",
 description:"Collectionner 200 cartes différentes.",
 title:"Historien",
 trigger:"collection",
 condition:u=>Object.keys(u.cards||{}).length>=200
},

unique300:{
 name:"300 cartes uniques",
 badge:"🏛️",
 description:"Collectionner 300 cartes différentes.",
 title:"Conservateur",
 trigger:"collection",
 condition:u=>Object.keys(u.cards||{}).length>=300
},

unique400:{
 name:"400 cartes uniques",
 badge:"📜",
 description:"Collectionner 400 cartes différentes.",
 title:"Grand Archiviste",
 trigger:"collection",
 condition:u=>Object.keys(u.cards||{}).length>=400
},

unique500:{
 name:"500 cartes uniques",
 badge:"👑",
 description:"Collectionner 500 cartes différentes.",
 title:"Maître Collectionneur",
 trigger:"collection",
 condition:u=>Object.keys(u.cards||{}).length>=500
},

unique600:{
 name:"600 cartes uniques",
 badge:"🌌",
 description:"Collectionner 600 cartes différentes.",
 title:"Gardien des Archives",
 trigger:"collection",
 condition:u=>Object.keys(u.cards||{}).length>=600
},

unique674:{
 name:"Collection Totale",
 badge:"💎",
 description:"Posséder les 674 cartes uniques.",
 title:"Collectionneur Absolu",
 trigger:"collection",
 condition:u=>Object.keys(u.cards||{}).length>=674
},

/* ================= ECONOMIE ================= */

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

/* ================= SOCIAL ================= */

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
 title:"En quête d'identité",
 trigger:"social",
 condition:u=>u.stats?.titleOpen>=1
},

title10:{
 name:"10 changements de titre",
 badge:"🎭",
 description:"Changer de titre 10 fois.",
 title:"Changeur de Masques",
 trigger:"social",
 condition:u=>u.stats?.titleOpen>=10
},

title25:{
 name:"25 changements de titre",
 badge:"🪞",
 description:"Changer de titre 25 fois.",
 title:"Multiples Personnalités",
 trigger:"social",
 condition:u=>u.stats?.titleOpen>=25
},

title50:{
 name:"50 changements de titre",
 badge:"🧢",
 description:"Changer de titre 50 fois.",
 title:"Collectionneur de Titres",
 trigger:"social",
 condition:u=>u.stats?.titleOpen>=50
},

title100:{
 name:"100 changements de titre",
 badge:"🎩",
 description:"Changer de titre 100 fois.",
 title:"Seigneur des Titres",
 trigger:"social",
 condition:u=>u.stats?.titleOpen>=100
},

title500:{
 name:"500 changements de titre",
 badge:"🤡",
 description:"Changer de titre 500 fois.",
 title:"Indécis du Krosmoz",
 trigger:"social",
 condition:u=>u.stats?.titleOpen>=500
},

/* ================= PROFIL ================= */

profile1:{
 name:"Regarder son profil",
 badge:"🪞",
 description:"Consulter ton profil une fois.",
 title:"Admirateur",
 trigger:"social",
 condition:u=>u.stats?.profileViews>=1
},

profile10:{
 name:"10 consultations",
 badge:"😏",
 description:"Consulter ton profil 10 fois.",
 title:"Auto-satisfait",
 trigger:"social",
 condition:u=>u.stats?.profileViews>=10
},

profile50:{
 name:"50 consultations",
 badge:"🧴",
 description:"Consulter ton profil 50 fois.",
 title:"Narcissique",
 trigger:"social",
 condition:u=>u.stats?.profileViews>=50
},

profile100:{
 name:"100 consultations",
 badge:"👑",
 description:"Consulter ton profil 100 fois.",
 title:"Centre de l'Univers",
 trigger:"social",
 condition:u=>u.stats?.profileViews>=100
},

profile250:{
 name:"250 consultations",
 badge:"✨",
 description:"Consulter ton profil 250 fois.",
 title:"Star du Krosmoz",
 trigger:"social",
 condition:u=>u.stats?.profileViews>=250
},

profile500:{
 name:"500 consultations",
 badge:"🌟",
 description:"Consulter ton profil 500 fois.",
 title:"Icône Vivante",
 trigger:"social",
 condition:u=>u.stats?.profileViews>=500
},

profile1000:{
 name:"1000 consultations",
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
 name:"10 consultations",
 badge:"🧾",
 description:"Consulter ton solde 10 fois.",
 title:"Vérificateur",
 trigger:"economy",
 condition:u=>u.stats?.balanceCheck>=10
},

balance50:{
 name:"50 consultations",
 badge:"📊",
 description:"Consulter ton solde 50 fois.",
 title:"Comptable",
 trigger:"economy",
 condition:u=>u.stats?.balanceCheck>=50
},

balance100:{
 name:"100 consultations",
 badge:"🏦",
 description:"Consulter ton solde 100 fois.",
 title:"Banquier",
 trigger:"economy",
 condition:u=>u.stats?.balanceCheck>=100
},

balance500:{
 name:"500 consultations",
 badge:"👀",
 description:"Consulter ton solde 500 fois.",
 title:"Obsédé du Solde",
 trigger:"economy",
 condition:u=>u.stats?.balanceCheck>=500
},

balance1000:{
 name:"1000 consultations",
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

/* ================= SECRETS ================= */

nightPlayer:{
 name:"Jouer entre 2h et 5h",
 badge:"🌙",
 description:"Ouvrir un pack entre 2h et 5h du matin.",
 title:"Noctambule",
 trigger:"pack",
 secret:true,
 condition:u=>u.stats?.nightPing
},

devilCards:{
 name:"666 cartes",
 badge:"😈",
 description:"Posséder exactement 666 cartes.",
 title:"Serviteur du Chaos",
 trigger:"collection",
 secret:true,
 condition:u=>Object.values(u.cards||{}).reduce((a,b)=>a+b,0)===666
},

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

krosmoScammed:{
 name:"Arnaqué par Krosmo-bot",
 badge:"🦝",
 description:"Se faire voler une carte par Krosmo-bot.",
 title:"Marchand naïf",
 trigger:"secret",
 secret:true,
 condition:u=>u.stats?.scammedByBot
},

krosmoFavor:{
 name:"Favori du Krosmoz",
 badge:"🌈",
 description:"Recevoir une SSR mystérieuse de Krosmo-bot.",
 title:"Favori du Krosmoz",
 trigger:"secret",
 secret:true,
 condition:u=>u.titles?.includes("Favori du Krosmoz")
},

}

module.exports = achievements