const { isDev } = require("../../systems/devSystem")
const { loadSets } = require("../../systems/setSystemFile")

const cards = require("../../cards/cards.json")

const rarities = ["C","U","R","SR","HR","UR","S","SSR"]

module.exports = {

 name:"setlist",
 description:"Lister les sets avec statistiques",

 async execute(interaction){

  if(!isDev(interaction.user.id))
   return interaction.reply({
    content:"Commande dev.",
    ephemeral:true
   })

  const sets = loadSets()

  if(!sets.sets || sets.sets.length === 0)
   return interaction.reply("Aucun set.")

  let output = []

  for(const set of sets.sets){

   const setCards = cards.cards.filter(c => c.set === set.id)

   const total = setCards.length

   if(total === 0){

    output.push(
`📦 ${set.name}
Cartes : 0`
    )

    continue
   }

   const rarityStats = {}

   for(const r of rarities){
    rarityStats[r] = 0
   }

   for(const card of setCards){
    if(rarityStats[card.rarity] !== undefined)
     rarityStats[card.rarity]++
   }

   const rarityLines = rarities
    .filter(r => rarityStats[r] > 0)
    .map(r => {

     const count = rarityStats[r]
     const percent = ((count / total) * 100).toFixed(1)

     return `${r.padEnd(3)} : ${count} (${percent}%)`

    })
    .join("\n")

   output.push(
`📦 ${set.name}
Cartes : ${total}

${rarityLines}`
   )

  }

  interaction.reply(
output.join("\n\n")
  )

 }

}