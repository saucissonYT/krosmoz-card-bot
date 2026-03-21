const { getCards } = require("../cardRegistry")

const order = ["C","U","R","SR","HR","UR"]

function random(pool){
 return pool[Math.floor(Math.random() * pool.length)]
}

module.exports = {
 key: "sacrieur",

 generate(user, basePack){

  const cards = getCards()

  const mutations = []

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

    if(pool.length === 0) return c

    const mutated = random(pool)

    mutations.push(`${c.name} → ${mutated.name}`)

    return mutated
   }

   return c
  })

  return {
   pack,
   meta: {
    mutations,
    ux: ["💀 Mutation", "🩸 Sacrifice"]
   }
  }
 }

}