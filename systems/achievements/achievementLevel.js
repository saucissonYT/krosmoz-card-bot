/* ═══════════════════════════════════════════════════════════════
   ACHIEVEMENTS — NIVEAUX & PROGRESSION
   systems/achievements/achievementLevel.js

   Achievements liés à la progression du joueur : paliers de
   niveau (5→200), XP totale cumulée, grind quotidien, fidélité,
   parcours complet, et secrets (palindromes, nuit, anniversaire).

   Trigger utilisé : "progression"

   Catégories :
   - Niveaux           (level5 → level200)
   - XP totale         (totalXP10k → totalXP716k)
   - Grind quotidien   (grind7 → grind100)
   - Fidélité          (fidelite7 → fidelite100)
   - Parcours complet  (parcoursComplet)
   - Secrets           (levelPalindrome, nightLevelUp, anniversaire)

   @module achievementLevel
   @see progressionSystem.js — XP et level-up
   @see achievementRegistry.js — agrégateur
═══════════════════════════════════════════════════════════════ */

module.exports = {

/* ================= NIVEAUX ================= */

level5:{
 name:"Niveau 5",
 badge:"🌱",
 description:"Atteindre le niveau 5.",
 title:"Débutant",
 trigger:"progression",
 condition:u=>(u.progression?.level||1)>=5
},

level10:{
 name:"Niveau 10",
 badge:"🌿",
 description:"Atteindre le niveau 10.",
 title:"Apprenti",
 trigger:"progression",
 condition:u=>(u.progression?.level||1)>=10
},

level15:{
 name:"Niveau 15",
 badge:"🍀",
 description:"Atteindre le niveau 15.",
 trigger:"progression",
 condition:u=>(u.progression?.level||1)>=15
},

level20:{
 name:"Niveau 20",
 badge:"🌳",
 description:"Atteindre le niveau 20.",
 title:"Initié",
 trigger:"progression",
 condition:u=>(u.progression?.level||1)>=20
},

level25:{
 name:"Niveau 25",
 badge:"⭐",
 description:"Atteindre le niveau 25.",
 title:"Aventurier",
 trigger:"progression",
 condition:u=>(u.progression?.level||1)>=25
},

level30:{
 name:"Niveau 30",
 badge:"🌟",
 description:"Atteindre le niveau 30.",
 trigger:"progression",
 condition:u=>(u.progression?.level||1)>=30
},

level40:{
 name:"Niveau 40",
 badge:"💫",
 description:"Atteindre le niveau 40.",
 title:"Éclaireur",
 trigger:"progression",
 condition:u=>(u.progression?.level||1)>=40
},

level50:{
 name:"Niveau 50",
 badge:"🏆",
 description:"Atteindre le niveau 50.",
 title:"Vétéran",
 trigger:"progression",
 condition:u=>(u.progression?.level||1)>=50
},

level60:{
 name:"Niveau 60",
 badge:"🔥",
 description:"Atteindre le niveau 60.",
 title:"Expert",
 trigger:"progression",
 condition:u=>(u.progression?.level||1)>=60
},

level70:{
 name:"Niveau 70",
 badge:"⚡",
 description:"Atteindre le niveau 70.",
 title:"Maître",
 trigger:"progression",
 condition:u=>(u.progression?.level||1)>=70
},

level75:{
 name:"Niveau 75",
 badge:"💎",
 description:"Atteindre le niveau 75.",
 title:"Élite du Krosmoz",
 trigger:"progression",
 condition:u=>(u.progression?.level||1)>=75
},

level80:{
 name:"Niveau 80",
 badge:"🌠",
 description:"Atteindre le niveau 80.",
 title:"Légende",
 trigger:"progression",
 condition:u=>(u.progression?.level||1)>=80
},

level90:{
 name:"Niveau 90",
 badge:"🔱",
 description:"Atteindre le niveau 90.",
 title:"Demi-Dieu",
 trigger:"progression",
 condition:u=>(u.progression?.level||1)>=90
},

level95:{
 name:"Niveau 95",
 badge:"🌌",
 description:"Atteindre le niveau 95.",
 title:"Transcendant",
 trigger:"progression",
 condition:u=>(u.progression?.level||1)>=95
},

level100:{
 name:"Niveau 100 !",
 badge:"👑",
 description:"Atteindre le niveau 100.",
 title:"Divinité du Krosmoz",
 trigger:"progression",
 condition:u=>(u.progression?.level||1)>=100
},

level125:{
 name:"Niveau 125 !",
 badge:"🏛️",
 description:"Atteindre le niveau 125.",
 title:"Gardien du Krosmoz",
 trigger:"progression",
 condition:u=>(u.progression?.level||1)>=125
},

level150:{
 name:"Niveau 150 !",
 badge:"🌋",
 description:"Atteindre le niveau 150.",
 title:"Héros du Krosmoz",
 trigger:"progression",
 condition:u=>(u.progression?.level||1)>=150
},

level175:{
 name:"Niveau 175 !",
 badge:"🌠",
 description:"Atteindre le niveau 175.",
 title:"Élu du Krosmoz",
 trigger:"progression",
 condition:u=>(u.progression?.level||1)>=175
},

level200:{
 name:"Niveau 200 !!",
 badge:"🪽",
 description:"Atteindre le niveau maximum absolu.",
 title:"Incarnation du Krosmoz",
 trigger:"progression",
 condition:u=>(u.progression?.level||1)>=200
},

/* ================= XP TOTAL ================= */

totalXP10k:{
 name:"10 000 XP",
 badge:"📊",
 description:"Accumuler 10 000 XP au total.",
 trigger:"progression",
 condition:u=>(u.progression?.totalXp||0)>=10000
},

totalXP50k:{
 name:"50 000 XP",
 badge:"📈",
 description:"Accumuler 50 000 XP au total.",
 title:"Grincheur",
 trigger:"progression",
 condition:u=>(u.progression?.totalXp||0)>=50000
},

totalXP100k:{
 name:"100 000 XP",
 badge:"💹",
 description:"Accumuler 100 000 XP au total.",
 title:"Grindeur Infatigable",
 trigger:"progression",
 condition:u=>(u.progression?.totalXp||0)>=100000
},

totalXP200k:{
 name:"200 000 XP",
 badge:"🏅",
 description:"Accumuler 200 000 XP au total.",
 title:"Marathon du Krosmoz",
 trigger:"progression",
 condition:u=>(u.progression?.totalXp||0)>=200000
},

totalXP300k:{
 name:"300 000 XP",
 badge:"🔝",
 description:"Accumuler 300 000 XP au total.",
 title:"Chasseur d'XP",
 trigger:"progression",
 condition:u=>(u.progression?.totalXp||0)>=300000
},

totalXP400k:{
 name:"400 000 XP",
 badge:"💥",
 description:"Accumuler 400 000 XP au total.",
 title:"Bûcheron du Krosmoz",
 trigger:"progression",
 condition:u=>(u.progression?.totalXp||0)>=400000
},

totalXP500k:{
 name:"500 000 XP",
 badge:"🌊",
 description:"Accumuler 500 000 XP au total.",
 title:"Titan de l'XP",
 trigger:"progression",
 condition:u=>(u.progression?.totalXp||0)>=500000
},

totalXP716k:{
 name:"716 400 XP",
 badge:"🪽",
 description:"Atteindre le plafond absolu d'XP cumulée — niveau 200 complet.",
 title:"Légende de l'XP",
 trigger:"progression",
 condition:u=>(u.progression?.totalXp||0)>=716400
},

/* ================= GRIND QUOTIDIEN ================= */

grind7:{
 name:"7 jours d'affilée",
 badge:"📅",
 description:"Jouer activement 7 jours consécutifs.",
 title:"Joueur Régulier",
 trigger:"progression",
 condition:u=>(u.stats?.activityStreak||0)>=7
},

grind30:{
 name:"30 jours d'affilée",
 badge:"🗓️",
 description:"Jouer activement 30 jours consécutifs.",
 title:"Habitué",
 trigger:"progression",
 condition:u=>(u.stats?.activityStreak||0)>=30
},

grind100:{
 name:"100 jours d'affilée",
 badge:"⚡",
 description:"Jouer activement 100 jours consécutifs.",
 title:"Indestructible",
 trigger:"progression",
 condition:u=>(u.stats?.activityStreak||0)>=100
},

/* ================= FIDÉLITÉ ================= */

fidelite7:{
 name:"1 semaine avec nous",
 badge:"🌱",
 description:"Jouer depuis au moins 7 jours.",
 trigger:"progression",
 condition:u=>{
  if(!u.stats?.createdAt) return false
  const days = Math.floor((Date.now() - new Date(u.stats.createdAt).getTime()) / 86400000)
  return days >= 7
 }
},

fidelite30:{
 name:"1 mois avec nous",
 badge:"🌿",
 description:"Jouer depuis au moins 30 jours.",
 title:"Fidèle",
 trigger:"progression",
 condition:u=>{
  if(!u.stats?.createdAt) return false
  const days = Math.floor((Date.now() - new Date(u.stats.createdAt).getTime()) / 86400000)
  return days >= 30
 }
},

fidelite60:{
 name:"2 mois avec nous",
 badge:"🍀",
 description:"Jouer depuis au moins 60 jours.",
 title:"Loyal",
 trigger:"progression",
 condition:u=>{
  if(!u.stats?.createdAt) return false
  const days = Math.floor((Date.now() - new Date(u.stats.createdAt).getTime()) / 86400000)
  return days >= 60
 }
},

fidelite100:{
 name:"100 jours avec nous",
 badge:"🌳",
 description:"Jouer depuis au moins 100 jours.",
 title:"Ancien",
 trigger:"progression",
 condition:u=>{
  if(!u.stats?.createdAt) return false
  const days = Math.floor((Date.now() - new Date(u.stats.createdAt).getTime()) / 86400000)
  return days >= 100
 }
},

/* ================= PARCOURS COMPLET ================= */

parcoursComplet:{
 name:"Le Long Chemin",
 badge:"🗺️",
 description:"Atteindre toutes les grandes milestones de niveau (10 → 200).",
 title:"Pèlerin du Krosmoz",
 trigger:"progression",
 condition:u=>{
  const milestones = [
   "level10","level25","level50","level75","level100",
   "level125","level150","level175","level200"
  ]
  return milestones.every(id => u.achievements?.includes(id))
 }
},

/* ================= SECRETS ================= */

levelPalindrome:{
 name:"Niveau Miroir",
 badge:"🪞",
 description:"Atteindre un niveau palindrome (11, 22, 33...).",
 trigger:"progression",
 secret:true,
 condition:u=>{
  const lvl = u.progression?.level || 1
  const str = String(lvl)
  return str.length >= 2 && str === str.split("").reverse().join("")
 }
},

levelPalindrome111:{
 name:"Miroir Triple",
 badge:"🪞",
 description:"Atteindre le niveau 111.",
 trigger:"progression",
 secret:true,
 condition:u=>(u.progression?.level||1)>=111
},

levelPalindrome151:{
 name:"Miroir du Milieu",
 badge:"🪞",
 description:"Atteindre le niveau 151.",
 trigger:"progression",
 secret:true,
 condition:u=>(u.progression?.level||1)>=151
},

levelPalindrome191:{
 name:"Miroir Final",
 badge:"🪞",
 description:"Atteindre le niveau 191.",
 trigger:"progression",
 secret:true,
 condition:u=>(u.progression?.level||1)>=191
},

nightLevelUp:{
 name:"Progression Nocturne",
 badge:"🌙",
 description:"Gagner un niveau entre minuit et 6h du matin.",
 title:"Noctambule du Krosmoz",
 trigger:"progression",
 secret:true,
 condition:u=>(u.stats?.nightLevelUp||0)>=1
},

anniversaire:{
 name:"Bon Anniversaire !",
 badge:"🎂",
 description:"Jouer depuis au moins 365 jours.",
 title:"Anniversaire du Krosmoz",
 trigger:"progression",
 secret:true,
 condition:u=>{
  if(!u.stats?.createdAt) return false
  const days = Math.floor((Date.now() - new Date(u.stats.createdAt).getTime()) / 86400000)
  return days >= 365
 }
},

}