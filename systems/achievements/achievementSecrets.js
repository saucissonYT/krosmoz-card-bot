/* ===============================================
   ACHIEVEMENTS — SECRETS & RNG EXTRÊMES
=============================================== */

module.exports = {

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