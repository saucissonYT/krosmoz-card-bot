const { getCards } = require("../cardRegistry")

function random(pool){
 return pool[Math.floor(Math.random() * pool.length)]
}

module.exports = {
 key: "osamodas",

 generate(){

  const cards = getCards()

  const roll = Math.random()

  let rarity = "R"
  let count = 5

  if(roll < 0.05){
   rarity = "SSR"; count = 2
  } else if(roll < 0.12){
   rarity = "S"; count = 2
  } else if(roll < 0.20){
   rarity = "UR"; count = 3
  } else if(roll < 0.35){
   rarity = "HR"; count = 3
  } else if(roll < 0.55){
   rarity = "SR"; count = 4
  } else if(roll < 0.75){
   rarity = "R"; count = 4
  } else if(roll < 0.90){
   rarity = "U"; count = 6
  } else {
   rarity = "C"; count = 7
  }

  const pool = cards.filter(c => c.rarity === rarity)
  const base = random(pool)

  const pack = Array(count).fill(0).map(() => ({ ...base }))

  return {
   pack,
   meta: {
    ux: ["🐉 Invocation", "🐾 Uniformité"]
   }
  }
 }

}