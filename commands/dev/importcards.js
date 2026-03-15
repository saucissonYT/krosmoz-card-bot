const fs = require("fs")
const sharp = require("sharp")

const {
 ActionRowBuilder,
 ButtonBuilder,
 ButtonStyle
} = require("discord.js")

const { data, save, CARDS_IMAGES_DIR } = require("../../systems/dataManager")
const { resetRegistry } = require("../../systems/cardRegistry")
const { isDev } = require("../../systems/devSystem")
const { getNextCardId } = require("../../systems/cardId")
const { loadSets } = require("../../systems/setSystemFile")

const importFolder="./cards/import"

const allowedRarities=["C","U","R","SR","HR","UR","S","SSR"]

module.exports={

 name:"importcards",
 description:"Importer des cartes",

 async execute(interaction){

  await interaction.deferReply({ephemeral:true})

  if(!isDev(interaction.user.id))
   return interaction.editReply("⛔ Commande dev uniquement.")

  if(!fs.existsSync(importFolder))
   fs.mkdirSync(importFolder,{recursive:true})

  const files=fs.readdirSync(importFolder)
   .filter(f=>/\.(png|webp)$/i.test(f))

  if(files.length===0)
   return interaction.editReply("❌ Aucun fichier image dans cards/import")

  const setsData=loadSets()

  const sets=Array.isArray(setsData)
   ? setsData
   : setsData.sets||[]

  if(!data.cards)
   data.cards=[]

  const cards=data.cards

  let imported=0
  let skipped=0

  let nextId=getNextCardId()

  for(const file of files){

   const base=file.split(".")[0]
   const split=base.split("_")

   if(split.length<3){
    skipped++
    continue
   }

   const rarity=split.pop().toUpperCase()
   const set=split.pop().toLowerCase()
   const name=split.join(" ")

   if(!allowedRarities.includes(rarity)){
    skipped++
    continue
   }

   const setExists=sets.find(s=>s.id===set)

   if(!setExists){
    skipped++
    continue
   }

   const duplicate=cards.find(c=>
    c.name.toLowerCase()===name.toLowerCase() &&
    c.set===set
   )

   if(duplicate){
    skipped++
    continue
   }

   const id=nextId++

   const setFolder=`${CARDS_IMAGES_DIR}/${set}`

   if(!fs.existsSync(setFolder))
    fs.mkdirSync(setFolder,{recursive:true})

   const safeName=name.replace(/\s/g,"_").toLowerCase()

   const newFile=`${id}_${safeName}_${rarity}.png`

   try{

    await sharp(`${importFolder}/${file}`)
     .png()
     .toFile(`${setFolder}/${newFile}`)

   }catch(err){

    console.log("Erreur image:",file)
    skipped++
    continue

   }

   cards.push({
    id,
    name,
    rarity,
    set,
    image:newFile
   })

   imported++

  }

  save()
  resetRegistry()

  await interaction.editReply({
   content:
`📦 Import terminé

✅ ${imported} cartes importées
⚠️ ${skipped} ignorées`,
   components:[]
  })

 }

}