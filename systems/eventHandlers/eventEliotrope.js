const { getCards } = require("../cardRegistry")

const cards = getCards()

function random(pool){
 return pool[Math.floor(Math.random() * pool.length)]
}

module.exports = {
 key: "eliotrope",

 generate(){

  const HR = cards.filter(c => c.rarity === "HR")
  const UR = cards.filter(c => c.rarity === "UR")
  const S  = cards.filter(c => c.rarity === "S")

  const pack = [
   random(HR),
   random(UR),
   random(S)
  ]

  return {
   pack,
   meta: {
    ux: ["🌀 Dimension", "🌌 Distorsion"]
   }
  }
 }

}