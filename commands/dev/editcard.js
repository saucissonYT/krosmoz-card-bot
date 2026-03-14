const fs = require("fs")
const cards = require("../../cards/cards.json")

const setsData = require("../../cards/sets.json")
const sets = Array.isArray(setsData) ? setsData : setsData.sets

const { isDev } = require("../../systems/devSystem")

module.exports = {

 name:"editcard",
 description:"Modifier une carte",

 options:[
  { name:"id", type:4, required:true },
  { name:"nom", type:3, required:false },
  { name:"rarete", type:3, required:false },
  { name:"set", type:3, required:false }
 ],

 async execute(interaction){

  if(!isDev(interaction.user.id))
   return interaction.reply({content:"Commande dev.",ephemeral:true})

  const id = interaction.options.getInteger("id")
  const name = interaction.options.getString("nom")
  const rarity = interaction.options.getString("rarete")
  const setId = interaction.options.getString("set")

  const card = cards.cards.find(c=>c.id === id)

  if(!card)
   return interaction.reply("Carte introuvable.")

  if(name) card.name = name
  if(rarity) card.rarity = rarity

  if(setId){
   const setExists = sets.find(s=>s.id===setId)
   if(!setExists)
    return interaction.reply("Set invalide.")

   card.set = setId
  }

  fs.writeFileSync(
   "./cards/cards.json",
   JSON.stringify(cards,null,2)
  )

  interaction.reply(`Carte modifiée : ${card.name}`)

 }

}