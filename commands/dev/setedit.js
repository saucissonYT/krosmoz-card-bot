const { isDev } = require("../../systems/devSystem")
const { loadSets } = require("../../systems/setSystemFile")
const { data } = require("../../systems/dataManager")

const rarities = ["C","U","R","SR","HR","UR","S","SSR"]

module.exports = {

 name:"setedit",
 description:"Statistiques détaillées des sets",

 async execute(interaction){

  if(!isDev(interaction.user.id))
   return interaction.reply({
    content:"Commande dev.",
    ephemeral:true
   })

  const cards = data.cards || []

  const rawSets = loadSets()
  const sets = Array.isArray(rawSets) ? rawSets : rawSets?.sets || []

  let output = []

  for(const set of sets){

   const setCards = cards.filter(c => c.set === set.id)

   const total = setCards.length

   if(total === 0){

    output.push(
`📦 ${set.name}
Cartes : 0`
    )

    continue
   }

   const rarityStats = {}

   for(const r of rarities)
    rarityStats[r] = 0

   for(const card of setCards)
    rarityStats[card.rarity]++

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

  interaction.reply(output.join("\n\n"))

 }

}