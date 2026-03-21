const { getCards } = require("../cardRegistry")

function random(pool){
 return pool[Math.floor(Math.random() * pool.length)]
}

module.exports = {
 key: "iop",

 generate(user, basePack){

  const cards = getCards()

  const HR = cards.filter(c => c.rarity === "HR")
  const UR = cards.filter(c => c.rarity === "UR")
  const S  = cards.filter(c => c.rarity === "S")

  let pack = []

  // minimum garanti
  pack.push(random(HR))
  pack.push(random(UR))

  // reste boost
  while(pack.length < basePack.length){
   const pool = [...HR, ...UR, ...S]
   pack.push(random(pool))
  }

  return {
   pack,
   meta: {
    ux: ["🔥 HR/UR boost", "⚔️ Puissance brute"]
   }
  }
 }

}