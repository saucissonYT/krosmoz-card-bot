/* ===============================================
   PLAYER BONUSES — Bonus par niveau du joueur
   
   Fonctionne comme guildBonuses.js mais pour le joueur.
   Les bonus se stackent avec les bonus de guilde.
   
   Intégration :
   - packEngine.js → kamasBonus, luckyPackBonus
   - fusion.js → fusionCritBonus
   - progressionSystem.js → xpBonus
   - krosmoshop.js → shopDiscount
   - dailySystem.js → dailyKamasBonus
=============================================== */

const { getProgression } = require("./progressionSystem")
const { MAX_PLAYER_LEVEL } = require("./constants")

/* ================= CALCUL DES BONUS ================= */

function getPlayerBonuses(level){

 if(!level || level < 1) level = 1

 return {

  /* +1% kamas tous les 4 niveaux → +50% au niveau 200 */
  kamasBonus: Math.floor(level / 4),

  /* +0.5% fusion crit tous les 8 niveaux → +12.5% au niveau 200 */
  fusionCritBonus: Math.floor(level / 8) * 0.5,

  /* +1% lucky pack tous les 10 niveaux → +20% au niveau 200 */
  luckyPackBonus: Math.floor(level / 10),

  /* +5% XP bonus tous les 20 niveaux → +50% au niveau 200 */
  xpBonus: Math.floor(level / 20) * 5,

  /* +1% réduction shop tous les 15 niveaux → +13% au niveau 200 */
  shopDiscount: Math.floor(level / 15),

  /* +50 kamas daily tous les 10 niveaux → +1000 au niveau 200 */
  dailyKamasBonus: Math.floor(level / 10) * 50,

  /* +2% chance de double daily tous les 25 niveaux → +16% au niveau 200 */
  doubleDailyBonus: Math.floor(level / 25) * 2,

  /* +1% chance de shiny tous les 50 niveaux → +4% au niveau 200
     (s'ajoute au 0.5% de base → 4.5% max theorique) */
  shinyBonus: Math.floor(level / 50),

  /* Réduction cooldown pack (en minutes) tous les 20 niveaux
     (sur 60 min de base → 35 min minimum) */
  cooldownReduction: Math.floor(level / 20) * 5

 }
}

/* ================= WRAPPER PAR USER ================= */

function getUserPlayerBonuses(user){

 if(!user?.progression) return getPlayerBonuses(1)

 return getPlayerBonuses(user.progression.level || 1)
}

/* ================= DESCRIPTIONS POUR AFFICHAGE ================= */

const BONUS_LIST = [
 { key:"kamasBonus",        emoji:"💰", name:"Kamas bonus",          unit:"%",   per:"tous les 4 niv." },
 { key:"fusionCritBonus",   emoji:"🔥", name:"Fusion critique",      unit:"%",   per:"tous les 8 niv." },
 { key:"luckyPackBonus",    emoji:"🍀", name:"Lucky pack",           unit:"%",   per:"tous les 10 niv." },
 { key:"xpBonus",           emoji:"⭐", name:"XP bonus",             unit:"%",   per:"tous les 20 niv." },
 { key:"shopDiscount",      emoji:"🏪", name:"Réduction shop",       unit:"%",   per:"tous les 15 niv." },
 { key:"dailyKamasBonus",   emoji:"🎁", name:"Kamas daily bonus",    unit:"",    per:"tous les 10 niv." },
 { key:"doubleDailyBonus",  emoji:"🎲", name:"Double daily",         unit:"%",   per:"tous les 25 niv." },
 { key:"shinyBonus",        emoji:"✨", name:"Chance shiny",         unit:"%",   per:"tous les 50 niv." },
 { key:"cooldownReduction", emoji:"⏱️", name:"Réduction cooldown",  unit:" min", per:"tous les 20 niv." }
]

function formatPlayerBonuses(level){

 const bonuses = getPlayerBonuses(level)

 return BONUS_LIST.map(b => {

  const val = bonuses[b.key]

  if(val <= 0) return `${b.emoji} ${b.name} : —`

  const display = Number.isInteger(val) ? val : val.toFixed(1)
  const prefix = b.key === "cooldownReduction" ? "-" : "+"

  return `${b.emoji} ${b.name} : **${prefix}${display}${b.unit}**`

 }).join("\n")
}

function formatNextPlayerUnlocks(level){

 const lines = []
 const next = level + 1

 for(let l = next; l <= Math.min(level + 15, MAX_PLAYER_LEVEL); l++){

  const before = getPlayerBonuses(l - 1)
  const after = getPlayerBonuses(l)

  for(const b of BONUS_LIST){

   if(after[b.key] > before[b.key]){

    const diff = after[b.key] - before[b.key]
    const display = Number.isInteger(diff) ? diff : diff.toFixed(1)
    const prefix = b.key === "cooldownReduction" ? "-" : "+"

    lines.push(`Niv. ${l} → ${b.emoji} ${prefix}${display}${b.unit} ${b.name}`)
   }
  }
 }

 return lines.slice(0, 6).join("\n") || "Aucun nouveau bonus proche."
}

/* ================= EXPORT ================= */

module.exports = {
 getPlayerBonuses,
 getUserPlayerBonuses,
 formatPlayerBonuses,
 formatNextPlayerUnlocks,
 BONUS_LIST
}
