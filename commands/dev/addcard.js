const fs = require("fs")
const sharp = require("sharp")
const fetch = require("node-fetch")

const { SlashCommandBuilder } = require("discord.js")

const { data, save, CARDS_IMAGES_DIR } = require("../../systems/dataManager")
const { isDev } = require("../../systems/devSystem")
const { getNextCardId } = require("../../systems/cardId")
const { resetRegistry } = require("../../systems/cardRegistry")
const { loadSets } = require("../../systems/setSystemFile")

const allowedRarities = [
 "C","U","R","SR","HR","UR","S","SSR"
]

module.exports = {

 data: (() => {

  const rawSets = loadSets()
  const sets = Array.isArray(rawSets) ? rawSets : rawSets?.sets || []

  const builder = new SlashCommandBuilder()
   .setName("addcard")
   .setDescription("Ajouter une carte")
   .addStringOption(o =>
    o.setName("nom")
     .setDescription("Nom de la carte")
     .setRequired(true)
   )
   .addStringOption(o =>
    o.setName("rarete")
     .setDescription("Rareté")
     .setRequired(true)
     .addChoices(
      ...allowedRarities.map(r => ({ name:r, value:r }))
     )
   )
   .addAttachmentOption(o =>
    o.setName("image")
     .setDescription("Image de la carte")
     .setRequired(true)
   )

  builder.addStringOption(o => {
   o.setName("set")
    .setDescription("Set")
    .setRequired(true)

   if(sets.length > 0){
    o.addChoices(
     ...sets.slice(0, 25).map(s => ({
      name:s.name,
      value:s.id
     }))
    )
   }

   return o
  })

  return builder

 })(),

 async execute(interaction){

  if(!isDev(interaction.user.id))
   return interaction.reply({
    content:"⛔ Commande dev.",
    ephemeral:true
   })

  const rawSets = loadSets()
  const sets = Array.isArray(rawSets) ? rawSets : rawSets?.sets || []

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

  const setFolder = `${CARDS_IMAGES_DIR}/${setId}`

  if(!fs.existsSync(setFolder))
   fs.mkdirSync(setFolder, { recursive:true })

  const response = await fetch(attachment.url)
  const buffer = await response.arrayBuffer()

  await sharp(Buffer.from(buffer))
   .png()
   .toFile(`${setFolder}/${fileName}`)

  const newCard = {
   id:newId,
   name,
   rarity,
   set:setId,
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