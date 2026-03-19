const { getCards } = require("../cardRegistry")

const cards = getCards()

const order = ["C","U","R","SR","HR","UR"]

function random(pool){
 return pool[Math.floor(Math.random() * pool.length)]
}

module.exports = {
 key: "sacrieur",

 generate(user, basePack){

  let pack = basePack.map(c => {

   if(c.rarity === "S" || c.rarity === "SSR"){
    return c
   }

   const i = order.indexOf(c.rarity)

   if(i === -1 || i >= order.length - 1){
    return c
   }

   if(Math.random() < 0.6){

    const next = order[i + 1]
    const pool = cards.filter(x => x.rarity === next)

    return random(pool)
   }

   return c
  })

  return {
   pack,
   meta: {
    ux: ["💀 Mutation", "🩸 Sacrifice"]
   }
  }
 }

}