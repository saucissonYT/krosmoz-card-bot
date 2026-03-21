const { getCards } = require("../cardRegistry")

function random(pool){
 return pool[Math.floor(Math.random() * pool.length)]
}

module.exports = {
 key: "huppermage",

 generate(user, basePack){

  const cards = getCards()

  let pack = [...basePack]
  let added = []

  const bonus = Math.floor(Math.random() * 3) + 1

  for(let i = 0; i < bonus; i++){

   const pool = Math.random() < 0.6
    ? cards.filter(c => c.rarity === "S" || c.rarity === "UR")
    : cards

   const c = random(pool)

   pack.push(c)
   added.push(c.name)
  }

  return {
   pack,
   meta: {
    added,
    ux: ["🧠 Équilibre", "✨ Énergie"]
   }
  }
 }

}