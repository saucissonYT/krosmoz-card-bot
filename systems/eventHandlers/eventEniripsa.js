const { getCards } = require("../cardRegistry")

/*
 * ENIRIPSA — Le Miracle de Guérison
 * ───────────────────────────────────
 * Avant : filtre C/U/R, remplit avec SR → S/SSR quasi impossibles
 * Après : purification + soin qui upgrade chaque carte survivante
 *
 * Mécanique :
 * - Phase 1 — Purification : les cartes C, U et R sont retirées
 * - Phase 2 — Guérison : chaque carte restante a une chance
 *   d'être "soignée" (upgrade d'un rang) :
 *   • SR → HR (40%)
 *   • HR → UR (30%)
 *   • UR → S  (15%)
 *   • S  → SSR (5%) — Miracle !
 * - Phase 3 — Remplissage : les slots vides sont remplis
 *   avec des cartes SR/HR (base purifiée)
 * - +1 carte bonus "mot de guérison" (SR/HR/UR)
 *
 * RP : Eniripsa soigne les cartes blessées. Ses mots de
 *      pouvoir purifient le pack. Dans les cas les plus
 *      rares, un vrai miracle se produit.
 */

const order = ["C","U","R","SR","HR","UR","S","SSR"]

function random(pool){
 return pool[Math.floor(Math.random() * pool.length)]
}

/* Chance de soin selon la rareté */
function getHealChance(rarity){
 switch(rarity){
  case "SR": return 0.40
  case "HR": return 0.30
  case "UR": return 0.15
  case "S":  return 0.05
  default:   return 0
 }
}

module.exports = {
 key: "eniripsa",

 generate(user, basePack){

  const cards = getCards()

  const heals = []

  /* Phase 1 — Purification : retirer C/U/R */
  let pack = basePack.filter(c =>
   c.rarity !== "C" &&
   c.rarity !== "U" &&
   c.rarity !== "R"
  )

  /* Phase 2 — Guérison : upgrade chaque carte restante */
  pack = pack.map(c => {

   if(c.rarity === "SSR") return c

   const chance = getHealChance(c.rarity)

   if(Math.random() < chance){

    const i = order.indexOf(c.rarity)

    if(i === -1 || i >= order.length - 1) return c

    const next = order[i + 1]
    const pool = cards.filter(x => x.rarity === next)

    if(pool.length === 0) return c

    const healed = random(pool)

    if(next === "SSR"){
     heals.push(`💫 ${c.name} → **${healed.name}** (MIRACLE !)`)
    } else if(next === "S"){
     heals.push(`✨ ${c.name} → **${healed.name}** (Guérison Majeure)`)
    } else {
     heals.push(`💊 ${c.name} → **${healed.name}**`)
    }

    return healed
   }

   return c
  })

  /* Phase 3 — Remplissage des slots vides */
  const fillPool = [
   ...cards.filter(c => c.rarity === "HR"),
   ...cards.filter(c => c.rarity === "SR")
  ]

  while(pack.length < basePack.length){
   if(fillPool.length){
    pack.push(random(fillPool))
   } else {
    break
   }
  }

  /* Bonus : +1 carte "mot de guérison" */
  const bonusPool = cards.filter(c =>
   c.rarity === "SR" ||
   c.rarity === "HR" ||
   c.rarity === "UR"
  )

  if(bonusPool.length){
   pack.push(random(bonusPool))
  }

  return {
   pack,
   meta: {
    upgrades: heals,
    ux: heals.length
     ? ["✨ La lumière guérit...", "💊 Mot de soin"]
     : ["✨ Purification douce", "💫 Énergie bienveillante"]
   }
  }
 }

}