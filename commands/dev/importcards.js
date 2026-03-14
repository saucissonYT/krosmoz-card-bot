const fs = require("fs")
const sharp = require("sharp")

const cards = require("../../cards/cards.json")

const setsData = require("../../cards/sets.json")
const sets = Array.isArray(setsData) ? setsData : setsData.sets

const { isDev } = require("../../systems/devSystem")
const { getNextCardId } = require("../../systems/cardId")

const allowedRarities = ["C","U","R","SR","HR","UR","S","SSR"]

module.exports = {

 name:"importcards",
 description:"Importer des cartes",

 async execute(interaction){

  if(!isDev(interaction.user.id))
   return interaction.reply({content:"Commande dev.",ephemeral:true})

  const importFolder="./cards/import"

  if(!fs.existsSync(importFolder))
   return interaction.reply("❌ Dossier `cards/import` introuvable.")

  const files = fs.readdirSync(importFolder)
   .filter(f => f.toLowerCase().endsWith(".png"))

  let imported = 0

  for(const file of files){

   const base = file.split(".")[0]
   const split = base.split("_")

   if(split.length < 3)
    continue

   const rarity = split.pop().toUpperCase()
   const set = split.pop().toLowerCase()
   const name = split.join(" ")

   if(!allowedRarities.includes(rarity))
    continue

   const setExists = sets.find(s => s.id === set)

   if(!setExists)
    continue

   const id = getNextCardId()

   const setFolder = `./cards/images/${set}`

   if(!fs.existsSync(setFolder))
    fs.mkdirSync(setFolder,{recursive:true})

   const newFile = `${id}_${name.replace(/\s/g,"_").toLowerCase()}_${rarity}.png`

   await sharp(`${importFolder}/${file}`)
    .png()
    .toFile(`${setFolder}/${newFile}`)

   if(!cards.cards)
    cards.cards = []

   cards.cards.push({
    id,
    name,
    rarity,
    set,
    image:newFile
   })

   imported++

  }

  fs.writeFileSync(
   "./cards/cards.json",
   JSON.stringify(cards,null,2)
  )

  interaction.reply(`📦 ${imported} cartes importées.`)

 }

}