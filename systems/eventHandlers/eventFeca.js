const { getCards } = require("../cardRegistry")

const cards = getCards()

function random(pool){
 return pool[Math.floor(Math.random() * pool.length)]
}

module.exports = {
 key: "feca",

 generate(user, basePack){

  let pack = basePack.filter(c =>
   c.rarity !== "C" && c.rarity !== "U"
  )

  const R = cards.filter(c => c.rarity === "R")

  while(pack.length < basePack.length){
   pack.push(random(R))
  }

  return {
   pack,
   meta: {
    ux: ["🛡️ Protection", "✨ Filtrage"],
    jackpot: Math.random() < 0.01
   }
  }
 }

}