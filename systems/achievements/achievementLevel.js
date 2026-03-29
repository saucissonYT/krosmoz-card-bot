/* ===============================================
   ACHIEVEMENTS — NIVEAUX
   Progression du joueur, milestones, XP
=============================================== */

module.exports = {

/* ================= NIVEAUX ================= */

level5:{
 name:"Niveau 5",
 badge:"🌱",
 description:"Atteindre le niveau 5.",
 title:"Débutant",
 trigger:"pack",
 condition:u=>(u.progression?.level||1)>=5
},

level10:{
 name:"Niveau 10",
 badge:"🌿",
 description:"Atteindre le niveau 10.",
 title:"Apprenti",
 trigger:"pack",
 condition:u=>(u.progression?.level||1)>=10
},

level15:{
 name:"Niveau 15",
 badge:"🍀",
 description:"Atteindre le niveau 15.",
 trigger:"pack",
 condition:u=>(u.progression?.level||1)>=15
},

level20:{
 name:"Niveau 20",
 badge:"🌳",
 description:"Atteindre le niveau 20.",
 title:"Initié",
 trigger:"pack",
 condition:u=>(u.progression?.level||1)>=20
},

level25:{
 name:"Niveau 25",
 badge:"⭐",
 description:"Atteindre le niveau 25.",
 title:"Aventurier",
 trigger:"pack",
 condition:u=>(u.progression?.level||1)>=25
},

level30:{
 name:"Niveau 30",
 badge:"🌟",
 description:"Atteindre le niveau 30.",
 trigger:"pack",
 condition:u=>(u.progression?.level||1)>=30
},

level40:{
 name:"Niveau 40",
 badge:"💫",
 description:"Atteindre le niveau 40.",
 title:"Éclaireur",
 trigger:"pack",
 condition:u=>(u.progression?.level||1)>=40
},

level50:{
 name:"Niveau 50",
 badge:"🏆",
 description:"Atteindre le niveau 50.",
 title:"Vétéran",
 trigger:"pack",
 condition:u=>(u.progression?.level||1)>=50
},

level60:{
 name:"Niveau 60",
 badge:"🔥",
 description:"Atteindre le niveau 60.",
 title:"Expert",
 trigger:"pack",
 condition:u=>(u.progression?.level||1)>=60
},

level70:{
 name:"Niveau 70",
 badge:"⚡",
 description:"Atteindre le niveau 70.",
 title:"Maître",
 trigger:"pack",
 condition:u=>(u.progression?.level||1)>=70
},

level75:{
 name:"Niveau 75",
 badge:"💎",
 description:"Atteindre le niveau 75.",
 title:"Élite du Krosmoz",
 trigger:"pack",
 condition:u=>(u.progression?.level||1)>=75
},

level80:{
 name:"Niveau 80",
 badge:"🌠",
 description:"Atteindre le niveau 80.",
 title:"Légende",
 trigger:"pack",
 condition:u=>(u.progression?.level||1)>=80
},

level90:{
 name:"Niveau 90",
 badge:"🔱",
 description:"Atteindre le niveau 90.",
 title:"Demi-Dieu",
 trigger:"pack",
 condition:u=>(u.progression?.level||1)>=90
},

level95:{
 name:"Niveau 95",
 badge:"🌌",
 description:"Atteindre le niveau 95.",
 title:"Transcendant",
 trigger:"pack",
 condition:u=>(u.progression?.level||1)>=95
},

level100:{
 name:"Niveau 100 !",
 badge:"👑",
 description:"Atteindre le niveau 100.",
 title:"Divinité du Krosmoz",
 trigger:"pack",
 condition:u=>(u.progression?.level||1)>=100
},

level125:{
 name:"Niveau 125 !",
 badge:"🏛️",
 description:"Atteindre le niveau 125.",
 title:"Gardien du Krosmoz",
 trigger:"pack",
 condition:u=>(u.progression?.level||1)>=125
},

level150:{
 name:"Niveau 150 !",
 badge:"🌋",
 description:"Atteindre le niveau 150.",
 title:"Héros du Krosmoz",
 trigger:"pack",
 condition:u=>(u.progression?.level||1)>=150
},

level175:{
 name:"Niveau 175 !",
 badge:"🌠",
 description:"Atteindre le niveau 175.",
 title:"Élu du Krosmoz",
 trigger:"pack",
 condition:u=>(u.progression?.level||1)>=175
},

level200:{
 name:"Niveau 200 !!",
 badge:"🪽",
 description:"Atteindre le niveau maximum absolu.",
 title:"Incarnation du Krosmoz",
 trigger:"pack",
 condition:u=>(u.progression?.level||1)>=200
},

/* ================= XP TOTAL ================= */

totalXP10k:{
 name:"10 000 XP",
 badge:"📊",
 description:"Accumuler 10 000 XP au total.",
 trigger:"pack",
 condition:u=>(u.progression?.totalXp||0)>=10000
},

totalXP50k:{
 name:"50 000 XP",
 badge:"📈",
 description:"Accumuler 50 000 XP au total.",
 title:"Grincheur",
 trigger:"pack",
 condition:u=>(u.progression?.totalXp||0)>=50000
},

totalXP100k:{
 name:"100 000 XP",
 badge:"💹",
 description:"Accumuler 100 000 XP au total.",
 title:"Grindeur Infatigable",
 trigger:"pack",
 condition:u=>(u.progression?.totalXp||0)>=100000
},

totalXP200k:{
 name:"200 000 XP",
 badge:"🏅",
 description:"Accumuler 200 000 XP au total.",
 title:"Marathon du Krosmoz",
 trigger:"pack",
 condition:u=>(u.progression?.totalXp||0)>=200000
},

/* ================= SECRETS NIVEAUX ================= */

levelPalindrome:{
 name:"Niveau Miroir",
 badge:"🪞",
 description:"Atteindre un niveau palindrome (11, 22, 33...).",
 trigger:"pack",
 secret:true,
 condition:u=>{
  const lvl = u.progression?.level || 1
  const str = String(lvl)
  return str.length >= 2 && str === str.split("").reverse().join("")
 }
},

}