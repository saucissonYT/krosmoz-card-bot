const { EmbedBuilder } = require("discord.js")

const setsData = require("../../cards/sets.json")
const sets = Array.isArray(setsData) ? setsData : setsData.sets

const cardsData = require("../../cards/cards.json")
const cards = Array.isArray(cardsData) ? cardsData : cardsData.cards

module.exports = {

 name:"sets",
 description:"Afficher les sets disponibles",

 async execute(interaction){

  const lines = sets.map(set => {

   const count = cards.filter(c => c.set === set.id).length

   return `📚 **${set.name}**
ID : \`${set.id}\`
Cartes : **${count}**`

  })

  const embed = new EmbedBuilder()
   .setTitle("📦 Sets disponibles")
   .setDescription(lines.join("\n\n"))
   .setColor("#3498db")

  interaction.reply({
   embeds:[embed]
  })

 }

}