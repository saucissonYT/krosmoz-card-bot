/* ═══════════════════════════════════════════════════════════════
   ACHIEVEMENTS — FUSION
   systems/achievements/achievementFusion.js

   Achievements liés à la fusion de cartes : nombre de fusions,
   résultats critiques, doubles et triples.

   Trigger utilisé : "fusion"

   Catégories :
   - Fusions totales  (fusion1 → fusion100)
   - Résultats spéciaux (fusionCrit, fusionDouble, fusionTriple)

   @module achievementFusion
   @see achievementRegistry.js — agrégateur
   @see achievementEngine.js  — moteur de vérification
═══════════════════════════════════════════════════════════════ */

module.exports = {

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

}