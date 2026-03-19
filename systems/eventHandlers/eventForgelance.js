const { getCards } = require("../cardRegistry")

const cards = getCards()

const order = ["C","U","R","SR","HR","UR","S","SSR"]

function random(pool){
 return pool[Math.floor(Math.random() * pool.length)]
}

module.exports = {
 key: "forgelance",

 generate(user, basePack){

  let pack = basePack.map(c => {

   const i = order.indexOf(c.rarity)

   if(i === -1 || i >= order.length - 1){
    return c
   }

   const next = order[i + 1]
   const pool = cards.filter(x => x.rarity === next)

   return random(pool)
  })

  return {
   pack,
   meta: {
    ux: ["⚔️ Forge", "🔥 Upgrade global"]
   }
  }
 }

}