/* ===============================================
   GUILD BONUSES — Bonus par niveau de guilde

   Fonctions exportées :
   - getGuildBonuses(level)       → calcule les bonus bruts pour un niveau donné
   - getUserGuildBonuses(userId)  → retourne les bonus de la guilde du joueur
   - formatBonuses(level)         → string affichable des bonus actifs
   - formatNextUnlocks(level)     → string affichable des prochains bonus

   Bonus de guilde (10 au total) :
   💰 kamasBonus         +1% / 5 niv.   → +20% max (niv. 100)
   🔥 fusionCritBonus    +0.5% / 10 niv. → +5% max  (niv. 100)
   ✨ fusionDoubleBonus  +0.5% / 15 niv. → +3% max  (niv. 45 → 3.5 arrondi à 3)
   🌈 fusionTripleBonus  +0.25% / 25 niv.→ +1% max  (niv. 100)
   🍀 luckyPackBonus     +1% / 10 niv.  → +10% max  (niv. 100)
   ⭐ xpBonus            +5% / 20 niv.  → +25% max  (niv. 100)
   📈 playerXpBonus      +2% / 10 niv.  → +20% max  (niv. 100)
   📉 shopDiscount       +2% / 25 niv.  → +8% max   (niv. 100)
   📦 dailyBonusPacks    +1 / 50 niv.   → +2 max    (niv. 100)
   🧧 doubleDailyBonus   +1% / 20 niv.  → +5% max   (niv. 100)
=============================================== */

/* ================= CALCUL DES BONUS ================= */

function getGuildBonuses(level){

 if(!level || level < 1) level = 1

 return {

  /* +1% kamas tous les 5 niveaux → +20% max au niveau 100 */
  kamasBonus: Math.floor(level / 5),

  /* +0.5% fusion critique tous les 10 niveaux → +5% max */
  fusionCritBonus: Math.floor(level / 10) * 0.5,

  /* +0.5% fusion double tous les 15 niveaux → +3% max */
  fusionDoubleBonus: Math.floor(level / 15) * 0.5,

  /* +0.25% fusion triple tous les 25 niveaux → +1% max */
  fusionTripleBonus: Math.floor(level / 25) * 0.25,

  /* +1% lucky pack tous les 10 niveaux → +10% max */
  luckyPackBonus: Math.floor(level / 10),

  /* +5% XP Battle Pass tous les 20 niveaux → +25% max */
  xpBonus: Math.floor(level / 20) * 5,

  /* +2% XP joueur tous les 10 niveaux → +20% max */
  playerXpBonus: Math.floor(level / 10) * 2,

  /* +2% réduction KrosmoShop tous les 25 niveaux → +8% max */
  shopDiscount: Math.floor(level / 25) * 2,

  /* +1 pack daily tous les 50 niveaux → +2 max */
  dailyBonusPacks: Math.floor(level / 50),

  /* +1% chance double daily tous les 20 niveaux → +5% max */
  doubleDailyBonus: Math.floor(level / 20)

 }
}

/* ================= WRAPPER PAR USER ================= */

function getUserGuildBonuses(userId){

 const empty = {
  kamasBonus:       0,
  fusionCritBonus:  0,
  fusionDoubleBonus:0,
  fusionTripleBonus:0,
  luckyPackBonus:   0,
  xpBonus:          0,
  playerXpBonus:    0,
  shopDiscount:     0,
  dailyBonusPacks:  0,
  doubleDailyBonus: 0
 }

 try{
  const { getUser }    = require("./userSystem")
  const { getGuild }   = require("./guildSystem")

  const user  = getUser(userId)
  if(!user?.guildId) return empty

  const guild = getGuild(user.guildId)
  if(!guild) return empty

  return getGuildBonuses(guild.level || 1)

 }catch(e){
  return empty
 }
}

/* ================= DESCRIPTIONS POUR AFFICHAGE ================= */

const BONUS_LIST = [
 { key:"kamasBonus",        emoji:"💰", name:"Kamas bonus",          unit:"%",  per:"tous les 5 niv."  },
 { key:"fusionCritBonus",   emoji:"🔥", name:"Fusion critique",      unit:"%",  per:"tous les 10 niv." },
 { key:"fusionDoubleBonus", emoji:"✨", name:"Fusion double",        unit:"%",  per:"tous les 15 niv." },
 { key:"fusionTripleBonus", emoji:"🌈", name:"Fusion triple",        unit:"%",  per:"tous les 25 niv." },
 { key:"luckyPackBonus",    emoji:"🍀", name:"Lucky pack",           unit:"%",  per:"tous les 10 niv." },
 { key:"xpBonus",           emoji:"⭐", name:"XP Battle Pass",       unit:"%",  per:"tous les 20 niv." },
 { key:"playerXpBonus",     emoji:"📈", name:"XP joueur",            unit:"%",  per:"tous les 10 niv." },
 { key:"shopDiscount",      emoji:"📉", name:"Réduction KrosmoShop", unit:"%",  per:"tous les 25 niv." },
 { key:"dailyBonusPacks",   emoji:"📦", name:"Packs daily bonus",    unit:"",   per:"tous les 50 niv." },
 { key:"doubleDailyBonus",  emoji:"🧧", name:"Chance double daily",  unit:"%",  per:"tous les 20 niv." }
]

function formatBonuses(level){

 const bonuses = getGuildBonuses(level)

 return BONUS_LIST.map(b => {

  const val = bonuses[b.key]

  if(val <= 0) return `${b.emoji} ${b.name} : —`

  const display = Number.isInteger(val) ? val : val.toFixed(1)
  const prefix  = "+"

  return `${b.emoji} ${b.name} : **${prefix}${display}${b.unit}**`

 }).join("\n")
}

function formatNextUnlocks(level){

 const lines = []
 const maxLevel = 100

 for(let l = level + 1; l <= Math.min(level + 20, maxLevel); l++){

  const before = getGuildBonuses(l - 1)
  const after  = getGuildBonuses(l)

  for(const b of BONUS_LIST){

   if(after[b.key] > before[b.key]){

    const diff    = after[b.key] - before[b.key]
    const display = Number.isInteger(diff) ? diff : diff.toFixed(1)

    lines.push(`Niv. ${l} → ${b.emoji} +${display}${b.unit} ${b.name}`)
   }
  }
 }

 return lines.slice(0, 6).join("\n") || "Aucun nouveau bonus proche."
}

/* ================= EXPORT ================= */

module.exports = {
 getGuildBonuses,
 getUserGuildBonuses,
 formatBonuses,
 formatNextUnlocks,
 BONUS_LIST
}