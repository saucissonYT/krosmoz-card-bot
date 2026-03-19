const { getCards } = require("../cardRegistry")

const cards = getCards()

function random(pool){
 return pool[Math.floor(Math.random() * pool.length)]
}

module.exports = {
 key: "eniripsa",

 generate(user, basePack){

  let pack = basePack.filter(c =>
   c.rarity !== "C" &&
   c.rarity !== "U" &&
   c.rarity !== "R"
  )

  const SR = cards.filter(c => c.rarity === "SR")

  while(pack.length < basePack.length + 1){
   pack.push(random(SR))
  }

  return {
   pack,
   meta: {
    ux: ["✨ Purification", "💫 Filtre"]
   }
  }
 }

}