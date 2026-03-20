const fs = require("fs")

const { data, save, CARDS_IMAGES_DIR } = require("../../systems/dataManager")
const { isDev } = require("../../systems/devSystem")
const { resetRegistry } = require("../../systems/cardRegistry")

module.exports={

 name:"removecard",
 description:"Supprimer une ou plusieurs cartes",

 options:[
  {
   name:"ids",
   description:"ID(s) des cartes à supprimer (séparés par des virgules)",
   type:3,
   required:true
  }
 ],

 async execute(interaction){

  if(!isDev(interaction.user.id))
   return interaction.reply({
    content:"Commande dev.",
    ephemeral:true
   })

  const cards = data.cards || []

  const idsString = interaction.options.getString("ids")

  const ids = idsString
   .split(",")
   .map(id => parseInt(id.trim()))
   .filter(id => !isNaN(id))

  if(ids.length===0)
   return interaction.reply("Aucun ID valide.")

  let removed=[]
  let notFound=[]

  for(const id of ids){

   const index=cards.findIndex(c=>Number(c.id)===id)

   if(index===-1){
    notFound.push(id)
    continue
   }

   const card=cards[index]

   // Fix : chemin image correct avec le dossier set
   const imagePath=`${CARDS_IMAGES_DIR}/${card.set}/${card.image}`

   try{
    if(fs.existsSync(imagePath))
     fs.unlinkSync(imagePath)
   }catch(err){
    console.error(`Erreur suppression image ${imagePath}:`, err)
   }

   cards.splice(index,1)

   removed.push(card.name)

  }

  data.cards = cards
  save()
  resetRegistry()

  let reply = ""

  if(removed.length)
   reply += `✅ Cartes supprimées : ${removed.join(", ")}`

  if(notFound.length)
   reply += `\n❌ IDs introuvables : ${notFound.join(", ")}`

  if(!reply)
   reply = "Aucune carte supprimée."

  interaction.reply(reply.trim())

 }

}