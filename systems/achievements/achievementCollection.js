/* ===============================================
   ACHIEVEMENTS — COLLECTION
   Cartes totales, cartes uniques, sets
=============================================== */

module.exports = {

/* ================= CARTES TOTALES ================= */

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

/* ================= CARTES UNIQUES ================= */

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

/* ================= SETS ================= */

devilCards:{
 name:"666 cartes",
 badge:"😈",
 description:"Posséder exactement 666 cartes.",
 title:"Serviteur du Chaos",
 trigger:"collection",
 secret:true,
 condition:u=>Object.values(u.cards||{}).reduce((a,b)=>a+b,0)===666
},

}