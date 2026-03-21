const { getCards } = require("../cardRegistry")

const order = ["C","U","R","SR","HR","UR","S","SSR"]

function random(pool){
 return pool[Math.floor(Math.random() * pool.length)]
}

module.exports = {
 key: "xelor",

 generate(user, basePack){

  const cards = getCards()

  let pack = [...basePack]

  pack.sort((a,b)=> order.indexOf(a.rarity) - order.indexOf(b.rarity))

  const removeCount = Math.floor(Math.random() * 2) + 1
  const removed = pack.splice(0, removeCount)

  const addCount = Math.floor(Math.random() * 3) + 1
  let added = []

  for(let i=0;i<addCount;i++){
   const c = random(cards)
   pack.push(c)
   added.push(c.name)
  }

  return {
   pack,
   meta: {
    removed: removed.map(c=>c.name),
    added: added,
    ux: ["⏳ Distorsion temporelle", "⌛ Réécriture"]
   }
  }
 }

}