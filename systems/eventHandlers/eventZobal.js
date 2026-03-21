const { getCards } = require("../cardRegistry")

const order = ["C","U","R","SR","HR","UR","S","SSR"]

function random(pool){
 return pool[Math.floor(Math.random() * pool.length)]
}

module.exports = {
 key: "zobal",

 generate(user, basePack){

  const cards = getCards()

  const upgrades = []

  let pack = basePack.map(c => {

   if(c.rarity === "SSR"){
    return c
   }

   const i = order.indexOf(c.rarity)

   if(i === -1 || i >= order.length - 1){
    return c
   }

   // Zobal : upgrade garanti mais d'un seul rang, sur toutes les cartes
   // contrairement à Sacrieur qui a 60% de chance mais saute S/SSR

   const next = order[i + 1]
   const pool = cards.filter(x => x.rarity === next)

   if(pool.length === 0) return c

   const upgraded = random(pool)

   upgrades.push(`${c.name} → ${upgraded.name}`)

   return upgraded
  })

  return {
   pack,
   meta: {
    upgrades,
    ux: ["🎭 Évolution", "🎭 Masque"]
   }
  }
 }

}