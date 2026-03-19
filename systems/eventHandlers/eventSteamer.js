const { getCards } = require("../cardRegistry")

const cards = getCards()

function random(pool){
 return pool[Math.floor(Math.random() * pool.length)]
}

module.exports = {
 key: "steamer",

 generate(){

  let pack = []

  const size = 5

  for(let i = 0; i < size; i++){
   pack.push(random(cards))
  }

  return {
   pack,
   meta: {
    chaos: pack.map(c => c.rarity),
    ux: ["⚙️ Chaos", "⚙️ Instabilité"]
   }
  }
 }

}