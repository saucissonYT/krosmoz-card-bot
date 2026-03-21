const { getCards } = require("../cardRegistry")

/*
 * IOP — La Rage
 * ─────────────
 * Avant : pool HR/UR/S uniquement → SSR impossible
 * Après : basePack boosté + rage critique sur chaque carte
 *
 * Mécanique :
 * - Le basePack (déjà boosté par eventPackEngine) est conservé
 * - Chaque carte a une chance de "rage" qui l'upgrade :
 *   • 5% → RAGE TOTALE → remplacée par une SSR
 *   • 15% → Colère → remplacée par une S
 *   • 25% → Fureur → remplacée par une UR ou HR
 * - Les cartes déjà S/SSR ne sont pas affectées (la rage ne touche pas les forts)
 *
 * RP : Iop frappe de plus en plus fort, chaque carte peut
 *      être touchée par sa rage et devenir plus puissante.
 */

function random(pool){
 return pool[Math.floor(Math.random() * pool.length)]
}

module.exports = {
 key: "iop",

 generate(user, basePack){

  const cards = getCards()

  const SSR = cards.filter(c => c.rarity === "SSR")
  const S   = cards.filter(c => c.rarity === "S")
  const UR  = cards.filter(c => c.rarity === "UR")
  const HR  = cards.filter(c => c.rarity === "HR")

  const rageLog = []

  let pack = basePack.map(c => {

   /* Les S et SSR résistent à la rage */
   if(c.rarity === "S" || c.rarity === "SSR"){
    return c
   }

   const roll = Math.random()

   /* RAGE TOTALE → SSR */
   if(roll < 0.05 && SSR.length){
    const upgraded = random(SSR)
    rageLog.push(`🔥 ${c.name} → **${upgraded.name}** (RAGE TOTALE)`)
    return upgraded
   }

   /* Colère → S */
   if(roll < 0.20 && S.length){
    const upgraded = random(S)
    rageLog.push(`💥 ${c.name} → **${upgraded.name}** (Colère)`)
    return upgraded
   }

   /* Fureur → UR ou HR */
   if(roll < 0.45){
    const pool = [...UR, ...HR]
    if(pool.length){
     const upgraded = random(pool)
     rageLog.push(`⚔️ ${c.name} → **${upgraded.name}** (Fureur)`)
     return upgraded
    }
   }

   return c
  })

  return {
   pack,
   meta: {
    upgrades: rageLog,
    ux: rageLog.length
     ? ["🔥 La rage d'Iop transforme le pack !", "⚔️ Puissance brute"]
     : ["🔥 Iop grogne...", "⚔️ La rage couve"]
   }
  }
 }

}