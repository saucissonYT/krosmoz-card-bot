/* ═══════════════════════════════════════════════════════════════
   ACHIEVEMENTS — SECRETS & RNG EXTRÊMES
   systems/achievements/achievementSecrets.js

   Achievements secrets liés aux interactions cachées :
   se faire arnaquer par le bot, recevoir une SSR mystérieuse.

   Trigger utilisé : "secret"

   @module achievementSecrets
   @see achievementRegistry.js — agrégateur
═══════════════════════════════════════════════════════════════ */

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