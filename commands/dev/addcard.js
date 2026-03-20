const fs = require("fs")
const sharp = require("sharp")
const fetch = require("node-fetch")

const { data, save, CARDS_IMAGES_DIR } = require("../../systems/dataManager")
const { isDev } = require("../../systems/devSystem")
const { getNextCardId } = require("../../systems/cardId")
const { resetRegistry } = require("../../systems/cardRegistry")

const setsData = require("../../cards/sets.json")
const sets = Array.isArray(setsData) ? setsData : setsData.sets

const allowedRarities=[
 "C","U","R","SR","HR","UR","S","SSR"
]

module.exports={

 name:"addcard",

 options:[
  { name:"nom", type:3, required:true },
  { name:"rarete", type:3, required:true },
  {
   name:"set",
   type:3,
   required:true,
   choices: sets.map(s=>({
    name:s.name,
    value:s.id
   }))
  },
  { name:"image", type:11, required:true }
 ],

 async execute(interaction){

  if(!isDev(interaction.user.id))
   return interaction.reply({
    content:"Commande dev.",
    ephemeral:true
   })

  const name = interaction.options.getString("nom")
  const rarity = interaction.options.getString("rarete")
  const setId = interaction.options.getString("set")
  const attachment = interaction.options.getAttachment("image")

  if(!allowedRarities.includes(rarity))
   return interaction.reply("Rareté invalide.")

  const setExists = sets.find(s => s.id === setId)

  if(!setExists)
   return interaction.reply("Set invalide.")

  const cards = data.cards || []

  const newId = getNextCardId()

  const safeName = name.replace(/\s/g,"_").toLowerCase()
  const fileName = `${newId}_${safeName}_${rarity}.png`

  // Fix : dossier correct par set
  const setFolder = `${CARDS_IMAGES_DIR}/${setId}`

  if(!fs.existsSync(setFolder))
   fs.mkdirSync(setFolder, { recursive:true })

  const response = await fetch(attachment.url)
  const buffer = await response.arrayBuffer()

  await sharp(Buffer.from(buffer))
   .png()
   .toFile(`${setFolder}/${fileName}`)

  const newCard={
   id:newId,
   name,
   rarity,
   set:setId, // Fix : champ set ajouté
   image:fileName
  }

  cards.push(newCard)

  data.cards = cards

  save()
  resetRegistry()

  interaction.reply(
`✅ Carte ajoutée

Nom : ${name}
ID : ${newId}
Rareté : ${rarity}
Set : ${setId}`
  )

 }

}