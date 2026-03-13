const fs = require("fs")
const sharp = require("sharp")
const fetch = require("node-fetch")

const cards = require("../../cards/cards.json")

const { isDev } = require("../../systems/devSystem")
const { getNextCardId } = require("../../systems/cardId")

const allowedRarities = [
 "C","U","R","SR","HR","UR","S","SSR"
]

module.exports = {

 name:"addcard",

 async execute(interaction){

  if(!isDev(interaction.user.id))
   return interaction.reply({
    content:"Commande dev.",
    ephemeral:true
   })

  const name = interaction.options.getString("nom")
  const rarity = interaction.options.getString("rarete")
  const attachment = interaction.options.getAttachment("image")

  if(!allowedRarities.includes(rarity))
   return interaction.reply("Rareté invalide.")

  const newId = getNextCardId()

  const fileName = `${newId}.png`

  const response = await fetch(attachment.url)
  const buffer = await response.arrayBuffer()

  await sharp(Buffer.from(buffer))
   .png()
   .toFile(`./cards/images/${fileName}`)

  const newCard = {
   id:newId,
   name,
   rarity,
   image:fileName
  }

  cards.cards.push(newCard)

  fs.writeFileSync(
   "./cards/cards.json",
   JSON.stringify(cards,null,2)
  )

  interaction.reply(`Carte ajoutée : ${name}`)

 }

}