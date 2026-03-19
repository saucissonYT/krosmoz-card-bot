const { getCards } = require("../cardRegistry")

const cards = getCards()

function random(pool){
 return pool[Math.floor(Math.random() * pool.length)]
}

module.exports = {
 key: "ouginak",

 generate(user, basePack){

  const low = cards.filter(c =>
   c.rarity === "C" ||
   c.rarity === "U" ||
   c.rarity === "R"
  )

  let pack = basePack.map(c => {
   if(Math.random() < 0.7){
    return random(low)
   }
   return c
  })

  // +2 cartes
  pack.push(random(low))
  pack.push(random(low))

  return {
   pack,
   meta: {
    downgrades: ["🐺 RNG négative"],
    ux: ["🐺 Hostilité", "⚔️ Survie"]
   }
  }
 }

}