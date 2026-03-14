const { data, save } = require("../../systems/dataManager")

const setsData=require("../../cards/sets.json")
const sets=Array.isArray(setsData)?setsData:setsData.sets

const { isDev } = require("../../systems/devSystem")

module.exports={

 name:"editcard",
 description:"Modifier une carte",

 options:[
  {name:"id",type:4,required:true},
  {name:"nom",type:3},
  {name:"rarete",type:3},
  {name:"set",type:3}
 ],

 async execute(interaction){

  if(!isDev(interaction.user.id))
   return interaction.reply({content:"Commande dev.",ephemeral:true})

  const cards = data.cards || []

  const id=interaction.options.getInteger("id")
  const name=interaction.options.getString("nom")
  const rarity=interaction.options.getString("rarete")
  const setId=interaction.options.getString("set")

  const card=cards.find(c=>c.id===id)

  if(!card)
   return interaction.reply("Carte introuvable.")

  if(name) card.name=name
  if(rarity) card.rarity=rarity

  if(setId){

   const setExists=sets.find(s=>s.id===setId)

   if(!setExists)
    return interaction.reply("Set invalide.")

   card.set=setId

  }

  data.cards = cards
  save()

  interaction.reply(`Carte modifiée : ${card.name}`)

 }

}