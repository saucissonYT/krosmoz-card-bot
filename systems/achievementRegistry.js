const achievements = {

/* ================= PACKS ================= */

pack1:{
 name:"Premier Pack",
 badge:"📦",
 title:"Apprenti Invocateur",
 condition:u=>u.stats?.packsOpened>=1
},

pack10:{
 name:"10 Packs",
 badge:"🎴",
 title:"Ouvreur de Packs",
 condition:u=>u.stats?.packsOpened>=10
},

pack50:{
 name:"50 Packs",
 badge:"🔥",
 title:"Briseur de Pity",
 condition:u=>u.stats?.packsOpened>=50
},

pack100:{
 name:"100 Packs",
 badge:"🌌",
 title:"Dévoreur de Packs",
 condition:u=>u.stats?.packsOpened>=100
},

pack250:{
 name:"250 Packs",
 badge:"🌀",
 title:"Addict au Gacha",
 condition:u=>u.stats?.packsOpened>=250
},

pack500:{
 name:"500 Packs",
 badge:"💫",
 title:"Maître des Packs",
 condition:u=>u.stats?.packsOpened>=500
},

pack1000:{
 name:"1000 Packs",
 badge:"👑",
 title:"Seigneur du Gacha",
 condition:u=>u.stats?.packsOpened>=1000
},

lucky1:{
 name:"Premier Lucky Pack",
 badge:"🎁",
 title:"Chance Insolente",
 condition:u=>u.stats?.luckyPacks>=1
},

lucky10:{
 name:"10 Lucky Packs",
 badge:"🍀",
 title:"Favori du Destin",
 condition:u=>u.stats?.luckyPacks>=10
},

lucky50:{
 name:"50 Lucky Packs",
 badge:"🌈",
 title:"Béni par RNG",
 condition:u=>u.stats?.luckyPacks>=50
},

/* ================= SSR ================= */

firstSSR:{
 name:"Première SSR",
 badge:"🌈",
 title:"Touché par le Destin",
 condition:u=>u.stats?.ssrPulled>=1
},

ssr5:{
 name:"5 SSR",
 badge:"⭐",
 title:"Chasseur de Légendes",
 condition:u=>u.stats?.ssrPulled>=5
},

ssr10:{
 name:"10 SSR",
 badge:"💎",
 title:"Collectionneur de Légendes",
 condition:u=>u.stats?.ssrPulled>=10
},

ssr25:{
 name:"25 SSR",
 badge:"🌟",
 title:"Maître des Légendes",
 condition:u=>u.stats?.ssrPulled>=25
},

ssr50:{
 name:"50 SSR",
 badge:"👑",
 title:"Seigneur des SSR",
 condition:u=>u.stats?.ssrPulled>=50
},

/* ================= UR / HR ================= */

firstUR:{
 name:"Première UR",
 badge:"🟡",
 title:"Briseur d’UR",
 condition:u=>u.stats?.urPulled>=1
},

ur10:{
 name:"10 UR",
 badge:"🔶",
 title:"Chasseur d’UR",
 condition:u=>u.stats?.urPulled>=10
},

firstHR:{
 name:"Première HR",
 badge:"🔴",
 title:"Découvreur d’HR",
 condition:u=>u.stats?.hrPulled>=1
},

/* ================= SHINY ================= */

shiny1:{
 name:"Première SSR Shiny",
 badge:"✨",
 title:"Porteur de Lumière",
 condition:u=>u.stats?.shinySSR>=1
},

shiny3:{
 name:"3 SSR Shiny",
 badge:"🌟",
 title:"Aura Mystique",
 condition:u=>u.stats?.shinySSR>=3
},

shiny5:{
 name:"5 SSR Shiny",
 badge:"🌈",
 title:"Collectionneur de Lumière",
 condition:u=>u.stats?.shinySSR>=5
},

shiny10:{
 name:"10 SSR Shiny",
 badge:"💫",
 title:"Avatar de Lumière",
 condition:u=>u.stats?.shinySSR>=10
},

/* ================= FUSION ================= */

fusion1:{
 name:"Première fusion",
 badge:"⚗️",
 title:"Alchimiste",
 condition:u=>u.stats?.fusions>=1
},

fusion10:{
 name:"10 fusions",
 badge:"🔥",
 title:"Transmutateur",
 condition:u=>u.stats?.fusions>=10
},

fusion50:{
 name:"50 fusions",
 badge:"🧪",
 title:"Maître Alchimiste",
 condition:u=>u.stats?.fusions>=50
},

fusion100:{
 name:"100 fusions",
 badge:"🌈",
 title:"Alchimiste Suprême",
 condition:u=>u.stats?.fusions>=100
},

/* ================= COLLECTION ================= */

cards50:{
 name:"50 cartes",
 badge:"📚",
 title:"Collectionneur",
 condition:u=>Object.values(u.cards||{}).reduce((a,b)=>a+b,0)>=50
},

cards100:{
 name:"100 cartes",
 badge:"🗃️",
 title:"Archiviste",
 condition:u=>Object.values(u.cards||{}).reduce((a,b)=>a+b,0)>=100
},

cards250:{
 name:"250 cartes",
 badge:"🏛️",
 title:"Conservateur",
 condition:u=>Object.values(u.cards||{}).reduce((a,b)=>a+b,0)>=250
},

cards500:{
 name:"500 cartes",
 badge:"📖",
 title:"Bibliothécaire",
 condition:u=>Object.values(u.cards||{}).reduce((a,b)=>a+b,0)>=500
},

cards1000:{
 name:"1000 cartes",
 badge:"👑",
 title:"Gardien du Krosmoz",
 condition:u=>Object.values(u.cards||{}).reduce((a,b)=>a+b,0)>=1000
},

/* ================= ECONOMIE ================= */

kamas1000:{
 name:"1000 kamas",
 badge:"💰",
 title:"Petit Marchand",
 condition:u=>u.kamas>=1000
},

kamas10000:{
 name:"10000 kamas",
 badge:"🪙",
 title:"Marchand",
 condition:u=>u.kamas>=10000
},

kamas50000:{
 name:"50000 kamas",
 badge:"💎",
 title:"Banquier",
 condition:u=>u.kamas>=50000
},

kamas100000:{
 name:"100000 kamas",
 badge:"🏦",
 title:"Magnat",
 condition:u=>u.kamas>=100000
},

kamas500000:{
 name:"500000 kamas",
 badge:"👑",
 title:"Seigneur des Kamas",
 condition:u=>u.kamas>=500000
},

kamas1000000:{
 name:"1000000 kamas",
 badge:"💰👑",
 title:"Empereur des Kamas",
 condition:u=>u.kamas>=1000000
},

/* ================= SOCIAL ================= */

mention1:{
 name:"Mention du bot",
 badge:"💬",
 title:"Ami du Bot",
 condition:u=>u.stats?.botMentions>=1
},

mention10:{
 name:"10 mentions",
 badge:"🗨️",
 title:"Bavard",
 condition:u=>u.stats?.botMentions>=10
},

mention100:{
 name:"100 mentions",
 badge:"📢",
 title:"Voix du Krosmoz",
 condition:u=>u.stats?.botMentions>=100
},

/* ================= SECRETS ================= */

nightPlayer:{
 name:"Jouer entre 2h et 5h",
 badge:"🌙",
 title:"Noctambule",
 secret:true,
 condition:u=>u.stats?.nightPing
},

devilCards:{
 name:"666 cartes",
 badge:"😈",
 title:"Serviteur du Chaos",
 secret:true,
 condition:u=>Object.values(u.cards||{}).reduce((a,b)=>a+b,0)===666
},

lucky777:{
 name:"777 kamas",
 badge:"🎰",
 title:"Chance Mystique",
 secret:true,
 condition:u=>u.kamas===777
}

}

module.exports = achievements