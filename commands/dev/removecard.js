const fs = require("fs")
const cards = require("../../cards/cards.json")
const { isDev } = require("../../systems/devSystem")

module.exports = {

 name:"removecard",

 async execute(interaction){

  if(!isDev(interaction.user.id))
   return interaction.reply({
    content:"Commande dev.",
    ephemeral:true
   })

  const idsString = interaction.options.getString("ids")

  const ids = idsString
   .split(",")
   .map(id => parseInt(id.trim()))
   .filter(id => !isNaN(id))

  if(ids.length === 0)
   return interaction.reply("Aucun ID valide.")

  let removed = []

  for(const id of ids){

   const index = cards.cards.findIndex(c => Number(c.id) === id)

   if(index === -1) continue

   const card = cards.cards[index]

   const imagePath = `./cards/images/${card.set}/${card.image}`

   try{
    if(fs.existsSync(imagePath))
     fs.unlinkSync(imagePath)
   }catch(err){
    console.log("Erreur suppression image :",imagePath)
   }

   cards.cards.splice(index,1)

   removed.push(card.name)

  }

  fs.writeFileSync(
   "./cards/cards.json",
   JSON.stringify(cards,null,2)
  )

  if(removed.length === 0)
   return interaction.reply("Aucune carte supprimée.")

  interaction.reply(`Cartes supprimées : ${removed.join(", ")}`)

 }
}