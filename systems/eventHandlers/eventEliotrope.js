const { getCards } = require("../cardRegistry")

/*
 * ELIOTROPE — Le Portail Dimensionnel
 * ─────────────────────────────────────
 * Avant : pack fixe HR+UR+S (3 cartes), SSR impossible
 * Après : pack de 5 cartes de qualité avec brèche dimensionnelle
 *
 * Mécanique :
 * - Le basePack est ignoré : Eliotrope crée son propre pack
 * - 5 cartes tirées dans un pool HR/UR/S avec taux spéciaux
 * - Chaque carte a une chance de "brèche dimensionnelle" :
 *   • 8% → SSR (la faille s'ouvre sur une dimension légendaire)
 *   • 25% → S (distorsion favorable)
 *   • 35% → UR (énergie dimensionnelle)
 *   • 32% → HR (résidu de portail)
 *
 * RP : Eliotrope ouvre des portails vers d'autres dimensions.
 *      Chaque portail peut mener n'importe où — y compris
 *      vers des dimensions légendaires.
 */

function random(pool){
 return pool[Math.floor(Math.random() * pool.length)]
}

module.exports = {
 key: "eliotrope",

 generate(){

  const cards = getCards()

  const SSR = cards.filter(c => c.rarity === "SSR")
  const S   = cards.filter(c => c.rarity === "S")
  const UR  = cards.filter(c => c.rarity === "UR")
  const HR  = cards.filter(c => c.rarity === "HR")

  const pack = []
  const breaches = []

  for(let i = 0; i < 5; i++){

   const roll = Math.random()

   if(roll < 0.08 && SSR.length){
    const card = random(SSR)
    pack.push(card)
    breaches.push(`🌀 Brèche SSR → **${card.name}**`)

   } else if(roll < 0.33 && S.length){
    const card = random(S)
    pack.push(card)
    breaches.push(`🌌 Distorsion S → **${card.name}**`)

   } else if(roll < 0.68 && UR.length){
    pack.push(random(UR))

   } else if(HR.length){
    pack.push(random(HR))

   } else {
    pack.push(random(cards))
   }
  }

  return {
   pack,
   meta: {
    added: breaches.map(b => b.replace(/[*🌀🌌]/g, "").trim()),
    ux: breaches.length
     ? ["🌀 Un portail s'ouvre...", "🌌 Dimension atteinte"]
     : ["🌀 Distorsion spatiale", "🌌 Les portails vibrent"]
   }
  }
 }

}