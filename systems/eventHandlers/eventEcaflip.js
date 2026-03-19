const { getCards } = require("../cardRegistry")

const cards = getCards()

const order = ["C","U","R","SR","HR","UR","S","SSR"]

function random(pool){
 return pool[Math.floor(Math.random() * pool.length)]
}

function upgrade(card){
 const i = order.indexOf(card.rarity)
 const next = order[Math.min(i + 2, order.length - 1)]
 const pool = cards.filter(c => c.rarity === next)
 return random(pool)
}

module.exports = {
 key: "ecaflip",

 generate(user, basePack){

  let pack
  let meta = {}

  if(Math.random() < 0.6){

   meta.jackpot = true

   const pool = cards.filter(c =>
    c.rarity === "HR" ||
    c.rarity === "UR" ||
    c.rarity === "S" ||
    c.rarity === "SSR"
   )

   pack = Array(5).fill(0).map(() => random(pool))

  } else {

   meta.luck = true

   pack = basePack.map(c => {
    if(Math.random() < 0.7){
     return upgrade(upgrade(c))
    }
    return upgrade(c)
   })
  }

  return {
   pack,
   meta: {
    ...meta,
    ux: ["🎲 Chance", "🎰 Jackpot"]
   }
  }
 }

}