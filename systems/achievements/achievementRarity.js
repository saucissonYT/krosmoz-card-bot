/* ===============================================
   ACHIEVEMENTS — RARETÉS
   SSR, Shiny, KrosmoShop
=============================================== */

module.exports = {

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

/* ================= KROSMOSHOP ================= */

shopBuy1:{
 name:"Premier Achat",
 badge:"🛒",
 description:"Acheter une carte au KrosmoShop.",
 title:"Client du KrosmoShop",
 trigger:"krosmoshop",
 condition:u=>u.krosmoshopStats?.cardsBought>=1
},

shopBuy10:{
 name:"Client Fidèle",
 badge:"💰",
 description:"Acheter 10 cartes au KrosmoShop.",
 title:"Collectionneur du KrosmoShop",
 trigger:"krosmoshop",
 condition:u=>u.krosmoshopStats?.cardsBought>=10
},

shopBuy100:{
 name:"Marchand du Krosmoz",
 badge:"📦",
 description:"Acheter 100 cartes au KrosmoShop.",
 title:"Marchand du Krosmoz",
 trigger:"krosmoshop",
 condition:u=>u.krosmoshopStats?.cardsBought>=100
},

shopBuy1000:{
 name:"Empereur du Shop",
 badge:"👑",
 description:"Acheter 1000 cartes au KrosmoShop.",
 title:"Empereur du KrosmoShop",
 trigger:"krosmoshop",
 condition:u=>u.krosmoshopStats?.cardsBought>=1000
},

shopSSR:{
 name:"Client Premium",
 badge:"🌈",
 description:"Acheter une SSR au KrosmoShop.",
 title:"Client Premium",
 trigger:"krosmoshop",
 condition:u=>u.krosmoshopStats?.ssrBought>=1
},

shop10SSR:{
 name:"Collectionneur Divin",
 badge:"✨",
 description:"Acheter 10 SSR au KrosmoShop.",
 title:"Collectionneur Divin",
 trigger:"krosmoshop",
 condition:u=>u.krosmoshopStats?.ssrBought>=10
},

}