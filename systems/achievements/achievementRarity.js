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

/* ================= KROSMOSHOP — ACHATS ================= */

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

shopBuy50:{
 name:"Accro au Shopping",
 badge:"🛍️",
 description:"Acheter 50 cartes au KrosmoShop.",
 title:"Accro du Shop",
 trigger:"krosmoshop",
 condition:u=>u.krosmoshopStats?.cardsBought>=50
},

shopBuy100:{
 name:"Marchand du Krosmoz",
 badge:"📦",
 description:"Acheter 100 cartes au KrosmoShop.",
 title:"Marchand du Krosmoz",
 trigger:"krosmoshop",
 condition:u=>u.krosmoshopStats?.cardsBought>=100
},

shopBuy500:{
 name:"Fortune Dépensée",
 badge:"💸",
 description:"Acheter 500 cartes au KrosmoShop.",
 title:"Millionnaire en Cartes",
 trigger:"krosmoshop",
 condition:u=>u.krosmoshopStats?.cardsBought>=500
},

shopBuy1000:{
 name:"Empereur du Shop",
 badge:"👑",
 description:"Acheter 1000 cartes au KrosmoShop.",
 title:"Empereur du KrosmoShop",
 trigger:"krosmoshop",
 condition:u=>u.krosmoshopStats?.cardsBought>=1000
},

/* ================= KROSMOSHOP — SSR ================= */

shopSSR:{
 name:"Client Premium",
 badge:"🌈",
 description:"Acheter une SSR au KrosmoShop.",
 title:"Client Premium",
 trigger:"krosmoshop",
 condition:u=>u.krosmoshopStats?.ssrBought>=1
},

shop5SSR:{
 name:"Chasseur de SSR",
 badge:"🎯",
 description:"Acheter 5 SSR au KrosmoShop.",
 title:"Chasseur Premium",
 trigger:"krosmoshop",
 condition:u=>u.krosmoshopStats?.ssrBought>=5
},

shop10SSR:{
 name:"Collectionneur Divin",
 badge:"✨",
 description:"Acheter 10 SSR au KrosmoShop.",
 title:"Collectionneur Divin",
 trigger:"krosmoshop",
 condition:u=>u.krosmoshopStats?.ssrBought>=10
},

shop25SSR:{
 name:"Obsédé des SSR",
 badge:"💎",
 description:"Acheter 25 SSR au KrosmoShop.",
 title:"Obsédé Premium",
 trigger:"krosmoshop",
 condition:u=>u.krosmoshopStats?.ssrBought>=25
},

/* ================= KROSMOSHOP — S ================= */

shopS1:{
 name:"Premier S au Shop",
 badge:"✨",
 description:"Acheter une carte S au KrosmoShop.",
 title:"Amateur de S",
 trigger:"krosmoshop",
 condition:u=>(u.krosmoshopStats?.sBought||0)>=1
},

shopS10:{
 name:"Collectionneur S",
 badge:"⭐",
 description:"Acheter 10 cartes S au KrosmoShop.",
 title:"Connaisseur de S",
 trigger:"krosmoshop",
 condition:u=>(u.krosmoshopStats?.sBought||0)>=10
},

/* ================= KROSMOSHOP — KAMAS DÉPENSÉS ================= */

shopSpend5000:{
 name:"Petit Investisseur",
 badge:"🪙",
 description:"Dépenser 5 000 kamas au KrosmoShop.",
 title:"Investisseur Prudent",
 trigger:"krosmoshop",
 condition:u=>(u.krosmoshopStats?.kamasSpent||0)>=5000
},

shopSpend25000:{
 name:"Gros Dépensier",
 badge:"💰",
 description:"Dépenser 25 000 kamas au KrosmoShop.",
 title:"Dépensier du Krosmoz",
 trigger:"krosmoshop",
 condition:u=>(u.krosmoshopStats?.kamasSpent||0)>=25000
},

shopSpend100000:{
 name:"Ruiné au Shop",
 badge:"💸",
 description:"Dépenser 100 000 kamas au KrosmoShop.",
 title:"Ruiné avec Style",
 trigger:"krosmoshop",
 condition:u=>(u.krosmoshopStats?.kamasSpent||0)>=100000
},

shopSpend500000:{
 name:"Fortune Engloutie",
 badge:"🏦",
 description:"Dépenser 500 000 kamas au KrosmoShop.",
 title:"Banquier du Krosmoz",
 trigger:"krosmoshop",
 condition:u=>(u.krosmoshopStats?.kamasSpent||0)>=500000
},

/* ================= KROSMOSHOP — JOURS DISTINCTS ================= */

shopDays7:{
 name:"Client Régulier",
 badge:"📅",
 description:"Acheter au KrosmoShop 7 jours différents.",
 title:"Habitué du Shop",
 trigger:"krosmoshop",
 condition:u=>(u.krosmoshopStats?.daysVisited||0)>=7
},

shopDays30:{
 name:"Client Mensuel",
 badge:"🗓️",
 description:"Acheter au KrosmoShop 30 jours différents.",
 title:"Abonné du Shop",
 trigger:"krosmoshop",
 condition:u=>(u.krosmoshopStats?.daysVisited||0)>=30
},

shopDays100:{
 name:"Centenaire du Shop",
 badge:"🏪",
 description:"Acheter au KrosmoShop 100 jours différents.",
 title:"Légende du KrosmoShop",
 trigger:"krosmoshop",
 condition:u=>(u.krosmoshopStats?.daysVisited||0)>=100
},

}