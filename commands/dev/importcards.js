const fs = require("fs")
const sharp = require("sharp")

const cards = require("../../cards/cards.json")
const sets = require("../../cards/sets.json")

const { isDev } = require("../../systems/devSystem")
const { getNextCardId } = require("../../systems/cardId")

const allowedRarities=[
 "C","U","R","SR","HR","UR","S","SSR"
]

module.exports={

 name:"importcards",
 description:"Importer des cartes",

 async execute(interaction){

  if(!isDev(interaction.user.id))
   return interaction.reply({content:"Commande dev.",ephemeral:true})

  const importFolder="./cards/import"

  const files=fs.readdirSync(importFolder)

  let imported=0

  for(const file of files){

   const base=file.split(".")[0]
   const split=base.split("_")

   const rarity=split.pop()
   const set=split.pop().toLowerCase()

   const name=split.join(" ")

   if(!allowedRarities.includes(rarity))
    continue

   const setExists = sets.sets.find(s=>s.id===set)

   if(!setExists)
    continue

   const id=getNextCardId()

   const setFolder=`./cards/images/${set}`

   if(!fs.existsSync(setFolder))
    fs.mkdirSync(setFolder)

   const newFile=`${id}_${name.replace(/\s/g,"_").toLowerCase()}_${rarity}.png`

   await sharp(`${importFolder}/${file}`)
    .png()
    .toFile(`${setFolder}/${newFile}`)

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