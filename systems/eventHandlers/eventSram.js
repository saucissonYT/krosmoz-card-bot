const { getCards } = require("../cardRegistry")

const cards = getCards()

function random(pool){
 return pool[Math.floor(Math.random() * pool.length)]
}

module.exports = {
 key: "sram",

 generate(user, basePack){

  let pack = [...basePack]

  // +1 carte bonus
  pack.push(random(cards))

  return {
   pack,
   meta: {
    hidden: true,
    ux: ["🕶️ Invisible", "🔪 Ombre"]
   }
  }
 }

}