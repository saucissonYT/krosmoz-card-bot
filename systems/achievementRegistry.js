const achievements = {

/* ================= PACKS ================= */

pack1:{
 name:"Premier Pack",
 badge:"📦",
 title:"Apprenti Invocateur",
 trigger:"pack",
 condition:u=>u.stats?.packsOpened>=1
},

pack10:{
 name:"10 Packs",
 badge:"🎴",
 title:"Ouvreur de Packs",
 trigger:"pack",
 condition:u=>u.stats?.packsOpened>=10
},

pack50:{
 name:"50 Packs",
 badge:"🔥",
 title:"Briseur de Pity",
 trigger:"pack",
 condition:u=>u.stats?.packsOpened>=50
},

pack100:{
 name:"100 Packs",
 badge:"🌌",
 title:"Dévoreur de Packs",
 trigger:"pack",
 condition:u=>u.stats?.packsOpened>=100
},

pack250:{
 name:"250 Packs",
 badge:"🌀",
 title:"Addict au Gacha",
 trigger:"pack",
 condition:u=>u.stats?.packsOpened>=250
},

pack500:{
 name:"500 Packs",
 badge:"💫",
 title:"Maître des Packs",
 trigger:"pack",
 condition:u=>u.stats?.packsOpened>=500
},

pack1000:{
 name:"1000 Packs",
 badge:"👑",
 title:"Seigneur du Gacha",
 trigger:"pack",
 condition:u=>u.stats?.packsOpened>=1000
},

/* ================= RNG PACK ================= */

shinySSR:{
 name:"SSR Shiny",
 badge:"✨",
 title:"Touché par la Lumière",
 trigger:"pack",
 condition:()=>false
},

packDivin:{
 name:"Pack Divin",
 badge:"🌟",
 title:"Favori des Dieux",
 trigger:"pack",
 condition:()=>false
},

pileOuFace:{
 name:"Pile ou Face",
 badge:"🪙",
 title:"Joueur Chanceux",
 trigger:"pack",
 condition:()=>false
},

impossible:{
 name:"Impossible",
 badge:"💥",
 title:"Miracle du Krosmoz",
 trigger:"pack",
 condition:()=>false
},

/* ================= SSR ================= */

firstSSR:{
 name:"Première SSR",
 badge:"🌈",
 title:"Touché par le Destin",
 trigger:"pack",
 condition:u=>u.stats?.ssrPulled>=1
},

ssr5:{
 name:"5 SSR",
 badge:"⭐",
 title:"Chasseur de Légendes",
 trigger:"pack",
 condition:u=>u.stats?.ssrPulled>=5
},

ssr10:{
 name:"10 SSR",
 badge:"💎",
 title:"Collectionneur de Légendes",
 trigger:"pack",
 condition:u=>u.stats?.ssrPulled>=10
},

ssr25:{
 name:"25 SSR",
 badge:"🌟",
 title:"Maître des Légendes",
 trigger:"pack",
 condition:u=>u.stats?.ssrPulled>=25
},

ssr50:{
 name:"50 SSR",
 badge:"👑",
 title:"Seigneur des SSR",
 trigger:"pack",
 condition:u=>u.stats?.ssrPulled>=50
},

/* ================= SHINY ================= */

shiny1:{
 name:"Première SSR Shiny",
 badge:"✨",
 title:"Porteur de Lumière",
 trigger:"pack",
 condition:u=>u.stats?.shinySSR>=1
},

shiny3:{
 name:"3 SSR Shiny",
 badge:"🌟",
 title:"Aura Mystique",
 trigger:"pack",
 condition:u=>u.stats?.shinySSR>=3
},

shiny5:{
 name:"5 SSR Shiny",
 badge:"🌈",
 title:"Collectionneur de Lumière",
 trigger:"pack",
 condition:u=>u.stats?.shinySSR>=5
},

shiny10:{
 name:"10 SSR Shiny",
 badge:"💫",
 title:"Avatar de Lumière",
 trigger:"pack",
 condition:u=>u.stats?.shinySSR>=10
},

/* ================= FUSION ================= */

fusion1:{
 name:"Première fusion",
 badge:"⚗️",
 title:"Alchimiste",
 trigger:"fusion",
 condition:u=>u.stats?.fusions>=1
},

fusion10:{
 name:"10 fusions",
 badge:"🔥",
 title:"Transmutateur",
 trigger:"fusion",
 condition:u=>u.stats?.fusions>=10
},

fusion50:{
 name:"50 fusions",
 badge:"🧪",
 title:"Maître Alchimiste",
 trigger:"fusion",
 condition:u=>u.stats?.fusions>=50
},

fusion100:{
 name:"100 fusions",
 badge:"🌈",
 title:"Alchimiste Suprême",
 trigger:"fusion",
 condition:u=>u.stats?.fusions>=100
},

/* ================= COLLECTION ================= */

cards50:{
 name:"50 cartes",
 badge:"📚",
 title:"Collectionneur",
 trigger:"collection",
 condition:u=>Object.values(u.cards||{}).reduce((a,b)=>a+b,0)>=50
},

cards100:{
 name:"100 cartes",
 badge:"🗃️",
 title:"Archiviste",
 trigger:"collection",
 condition:u=>Object.values(u.cards||{}).reduce((a,b)=>a+b,0)>=100
},

cards250:{
 name:"250 cartes",
 badge:"🏛️",
 title:"Conservateur",
 trigger:"collection",
 condition:u=>Object.values(u.cards||{}).reduce((a,b)=>a+b,0)>=250
},

cards500:{
 name:"500 cartes",
 badge:"📖",
 title:"Bibliothécaire",
 trigger:"collection",
 condition:u=>Object.values(u.cards||{}).reduce((a,b)=>a+b,0)>=500
},

cards1000:{
 name:"1000 cartes",
 badge:"👑",
 title:"Gardien du Krosmoz",
 trigger:"collection",
 condition:u=>Object.values(u.cards||{}).reduce((a,b)=>a+b,0)>=1000
},

/* ================= ECONOMIE ================= */

kamas1000:{
 name:"1000 kamas",
 badge:"💰",
 title:"Petit Marchand",
 trigger:"economy",
 condition:u=>u.kamas>=1000
},

kamas10000:{
 name:"10000 kamas",
 badge:"🪙",
 title:"Marchand",
 trigger:"economy",
 condition:u=>u.kamas>=10000
},

kamas50000:{
 name:"50000 kamas",
 badge:"💎",
 title:"Banquier",
 trigger:"economy",
 condition:u=>u.kamas>=50000
},

kamas100000:{
 name:"100000 kamas",
 badge:"🏦",
 title:"Magnat",
 trigger:"economy",
 condition:u=>u.kamas>=100000
},

kamas500000:{
 name:"500000 kamas",
 badge:"👑",
 title:"Seigneur des Kamas",
 trigger:"economy",
 condition:u=>u.kamas>=500000
},

kamas1000000:{
 name:"1000000 kamas",
 badge:"💰👑",
 title:"Empereur des Kamas",
 trigger:"economy",
 condition:u=>u.kamas>=1000000
},

/* ================= SOCIAL ================= */

mention1:{
 name:"Mention du bot",
 badge:"💬",
 title:"Ami du Bot",
 trigger:"social",
 condition:u=>u.stats?.botMentions>=1
},

mention10:{
 name:"10 mentions",
 badge:"🗨️",
 title:"Bavard",
 trigger:"social",
 condition:u=>u.stats?.botMentions>=10
},

mention100:{
 name:"100 mentions",
 badge:"📢",
 title:"Voix du Krosmoz",
 trigger:"social",
 condition:u=>u.stats?.botMentions>=100
},

/* ================= SECRETS ================= */

nightPlayer:{
 name:"Jouer entre 2h et 5h",
 badge:"🌙",
 title:"Noctambule",
 trigger:"pack",
 secret:true,
 condition:u=>u.stats?.nightPing
},

devilCards:{
 name:"666 cartes",
 badge:"😈",
 title:"Serviteur du Chaos",
 trigger:"collection",
 secret:true,
 condition:u=>Object.values(u.cards||{}).reduce((a,b)=>a+b,0)===666
},

lucky777:{
 name:"777 kamas",
 badge:"🎰",
 title:"Chance Mystique",
 trigger:"economy",
 secret:true,
 condition:u=>u.kamas===777
}

}

module.exports = achievements