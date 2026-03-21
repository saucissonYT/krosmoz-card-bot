/* ===============================================
   GUILD BONUSES — Calcul des bonus par niveau
   
   Intégration dans les autres systèmes :
   
   packEngine.js  → luckyPackBonus, kamasBonus
   fusion.js      → fusionCritBonus, fusionDoubleBonus, fusionTripleBonus
   progressionSystem.js → xpBonus
   krosmoshop.js  → shopDiscount
   
   Appeler getUserGuildBonuses(userId) pour obtenir
   les bonus du joueur selon le niveau de sa guilde.
=============================================== */

const { getUserGuild } = require("./guildSystem")

/* ================= CALCUL DES BONUS ================= */

function getGuildBonuses(level){

 if(!level || level < 1) level = 1

 return {

  /* +1% tous les 5 niveaux → +20% au niveau 100 */
  kamasBonus: Math.floor(level / 5),

  /* +0.5% tous les 10 niveaux → +5% au niveau 100 */
  fusionCritBonus: Math.floor(level / 10) * 0.5,

  /* +0.5% tous les 15 niveaux → +3% au niveau 100 */
  fusionDoubleBonus: Math.floor(level / 15) * 0.5,

  /* +0.25% tous les 25 niveaux → +1% au niveau 100 */
  fusionTripleBonus: Math.floor(level / 25) * 0.25,

  /* +1% tous les 10 niveaux → +10% au niveau 100 */
  luckyPackBonus: Math.floor(level / 10),

  /* +5% tous les 20 niveaux → +25% au niveau 100 */
  xpBonus: Math.floor(level / 20) * 5,

  /* +2% tous les 25 niveaux → +8% au niveau 100 */
  shopDiscount: Math.floor(level / 25) * 2,

  /* +1 pack gratuit par jour tous les 50 niveaux → +2 au niveau 100 */
  dailyBonusPacks: Math.floor(level / 50),

  /* +1% chance de double daily tous les 20 niveaux → +5% au niveau 100 */
  doubleDailyBonus: Math.floor(level / 20)

 }
}

/* ================= WRAPPER PAR JOUEUR ================= */

function getUserGuildBonuses(userId){

 const guild = getUserGuild(userId)

 if(!guild) return getGuildBonuses(0)

 return getGuildBonuses(guild.level)
}

/* ================= DESCRIPTIONS POUR AFFICHAGE ================= */

const BONUS_LIST = [
 { key:"kamasBonus",        emoji:"💰", name:"Kamas bonus",        unit:"%", per:"tous les 5 niv." },
 { key:"fusionCritBonus",   emoji:"🔥", name:"Fusion critique",    unit:"%", per:"tous les 10 niv." },
 { key:"fusionDoubleBonus", emoji:"✨", name:"Fusion double",      unit:"%", per:"tous les 15 niv." },
 { key:"fusionTripleBonus", emoji:"🌈", name:"Fusion triple",      unit:"%", per:"tous les 25 niv." },
 { key:"luckyPackBonus",    emoji:"🍀", name:"Lucky pack",         unit:"%", per:"tous les 10 niv." },
 { key:"xpBonus",           emoji:"⭐", name:"XP bonus",           unit:"%", per:"tous les 20 niv." },
 { key:"shopDiscount",      emoji:"🏪", name:"Réduction shop",     unit:"%", per:"tous les 25 niv." },
 { key:"dailyBonusPacks",   emoji:"📦", name:"Packs daily bonus",  unit:"",  per:"tous les 50 niv." },
 { key:"doubleDailyBonus",  emoji:"🎁", name:"Double daily",       unit:"%", per:"tous les 20 niv." }
]

function formatBonuses(level){

 const bonuses = getGuildBonuses(level)

 return BONUS_LIST.map(b => {

  const val = bonuses[b.key]

  if(val <= 0) return `${b.emoji} ${b.name} : —`

  const display = Number.isInteger(val) ? val : val.toFixed(1)

  return `${b.emoji} ${b.name} : **+${display}${b.unit}**`

 }).join("\n")
}

function formatNextUnlocks(level){

 const lines = []
 const next = level + 1

 for(let l = next; l <= Math.min(level + 20, 100); l++){

  const bonusesBefore = getGuildBonuses(l - 1)
  const bonusesAfter = getGuildBonuses(l)

  for(const b of BONUS_LIST){

   if(bonusesAfter[b.key] > bonusesBefore[b.key]){

    const diff = bonusesAfter[b.key] - bonusesBefore[b.key]
    const display = Number.isInteger(diff) ? diff : diff.toFixed(1)

    lines.push(`Niv. ${l} → ${b.emoji} +${display}${b.unit} ${b.name}`)
   }
  }
 }

 return lines.slice(0, 8).join("\n") || "Aucun nouveau bonus proche."
}

/* ================= EXPORT ================= */

module.exports = {
 getGuildBonuses,
 getUserGuildBonuses,
 formatBonuses,
 formatNextUnlocks,
 BONUS_LIST
}