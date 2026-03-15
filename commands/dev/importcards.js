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

function skip(file,reason){
 console.log(`⚠️ SKIP : ${file}`)
 console.log(`   raison : ${reason}`)
}

function createSet(setId){

 const setsDir="./data"
 const setsPath="./data/sets.json"

 if(!fs.existsSync(setsDir)){
  fs.mkdirSync(setsDir,{recursive:true})
 }

 let setsData={sets:[]}

 if(fs.existsSync(setsPath)){
  setsData=JSON.parse(fs.readFileSync(setsPath,"utf8"))
 }

 if(!setsData.sets)
  setsData.sets=[]

 const exists=setsData.sets.find(s=>s.id===setId)

 if(exists) return

 setsData.sets.push({
  id:setId,
  name:setId,
  reward:null
 })

 fs.writeFileSync(setsPath,JSON.stringify(setsData,null,2))

 console.log(`📦 SET AUTO CRÉÉ : ${setId}`)
}

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

  const cardLookup=new Set(
   cards.map(c=>`${c.name.toLowerCase()}_${c.set}`)
  )

  for(const file of files){

   const base=file.split(".")[0]
   const split=base.split("_")

   if(split.length<3){
    skip(file,"Format invalide (nom_set_rarity)")
    skipped++
    continue
   }

   const rarity=split.pop().toUpperCase()
   const set=split.pop().toLowerCase()
   const name=split.join(" ")

   if(!allowedRarities.includes(rarity)){
    skip(file,`Rareté invalide : ${rarity}`)
    skipped++
    continue
   }

   let setExists=sets.find(s=>s.id===set)

   if(!setExists){

    createSet(set)

    sets.push({
     id:set,
     name:set,
     reward:null
    })

   }

   const duplicateKey=`${name.toLowerCase()}_${set}`

   if(cardLookup.has(duplicateKey)){
    skip(file,`Doublon carte : ${name} (${set})`)
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

    skip(file,"Erreur conversion image (sharp)")
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

   cardLookup.add(duplicateKey)

   console.log(`✅ IMPORT : ${name} | ${set} | ${rarity}`)

   imported++

  }

  save()
  resetRegistry()

  await interaction.editReply({
   content:
`📦 Import terminé

✅ ${imported} cartes importées
⚠️ ${skipped} ignorées

📄 Voir la console pour le détail.`
  })

 }

}