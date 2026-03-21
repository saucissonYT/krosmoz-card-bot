const { getCards } = require("../cardRegistry")

/*
 * SACRIEUR — Le Sacrifice de Sang
 * ────────────────────────────────
 * Avant : order s'arrêtait à UR → S/SSR impossibles
 * Après : order complet C→U→R→SR→HR→UR→S→SSR
 *
 * Mécanique :
 * - Chaque carte a une chance de "mutation sanglante"
 * - La mutation upgrade la carte d'un rang
 * - Chance de mutation décroissante selon la rareté :
 *   • C/U/R : 70% de mutation (sacrifice facile)
 *   • SR/HR : 50% de mutation (résistance)
 *   • UR : 30% de mutation (sacrifice douloureux)
 *   • S : 10% de mutation → SSR (sacrifice ultime)
 * - Les SSR ne mutent pas (déjà au sommet)
 *
 * RP : Plus la carte souffre (basse rareté), plus le sacrifice
 *      est efficace. Les cartes fortes résistent davantage.
 *      Le sang versé nourrit la puissance.
 */

const order = ["C","U","R","SR","HR","UR","S","SSR"]

function random(pool){
 return pool[Math.floor(Math.random() * pool.length)]
}

/* Chance de mutation selon la rareté actuelle */
function getMutationChance(rarity){
 switch(rarity){
  case "C":
  case "U":
  case "R":  return 0.70
  case "SR":
  case "HR": return 0.50
  case "UR": return 0.30
  case "S":  return 0.10
  default:   return 0
 }
}

module.exports = {
 key: "sacrieur",

 generate(user, basePack){

  const cards = getCards()

  const mutations = []

  let pack = basePack.map(c => {

   /* SSR : déjà au sommet, pas de mutation */
   if(c.rarity === "SSR"){
    return c
   }

   const i = order.indexOf(c.rarity)

   if(i === -1 || i >= order.length - 1){
    return c
   }

   const chance = getMutationChance(c.rarity)

   if(Math.random() < chance){

    const next = order[i + 1]
    const pool = cards.filter(x => x.rarity === next)

    if(pool.length === 0) return c

    const mutated = random(pool)

    /* Messages RP selon le niveau de mutation */
    if(next === "SSR"){
     mutations.push(`🩸 ${c.name} → **${mutated.name}** (SACRIFICE ULTIME)`)
    } else if(next === "S"){
     mutations.push(`💀 ${c.name} → **${mutated.name}** (Sang Versé)`)
    } else {
     mutations.push(`🩸 ${c.name} → **${mutated.name}**`)
    }

    return mutated
   }

   return c
  })

  return {
   pack,
   meta: {
    mutations,
    ux: mutations.length
     ? ["💀 Le sang coule...", "🩸 Sacrifice accepté"]
     : ["💀 Le Sacrieur grogne...", "🩸 Pas assez de sang"]
   }
  }
 }

}