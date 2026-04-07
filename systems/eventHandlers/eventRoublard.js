const { getCards } = require("../cardRegistry")

function random(pool){
 return pool[Math.floor(Math.random() * pool.length)]
}

module.exports = {
 key: "roublard",

 generate(user, basePack){

  const cards = getCards()

  const pack = [...basePack]

  for(let i = 0; i < 3; i++){
   pack.push(random(cards))
  }

  return {
   pack,
   meta: {
    ux: ["💣 Explosion", "💥 Volume"]
   }
  }
 }

}