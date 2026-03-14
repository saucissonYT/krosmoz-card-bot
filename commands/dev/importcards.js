const fs = require("fs")
const sharp = require("sharp")

const { data, save } = require("../../systems/dataManager")

const setsData = require("../../cards/sets.json")
const sets = Array.isArray(setsData) ? setsData : setsData.sets

const { isDev } = require("../../systems/devSystem")
const { getNextCardId } = require("../../systems/cardId")

const allowedRarities = ["C","U","R","SR","HR","UR","S","SSR"]

module.exports = {

 name: "importcards",
 description: "Importer des cartes",

 async execute(interaction){

  await interaction.deferReply({ ephemeral: true })

  if(!isDev(interaction.user.id))
   return interaction.editReply("⛔ Commande dev uniquement.")

  const importFolder = "./cards/import"

  if(!fs.existsSync(importFolder))
   return interaction.editReply("❌ Dossier `cards/import` introuvable.")

  const files = fs.readdirSync(importFolder)
   .filter(f => f.toLowerCase().endsWith(".png"))

  if(files.length === 0)
   return interaction.editReply("❌ Aucun fichier PNG dans `cards/import`.")

  /* ---------------- CARTES DATA ---------------- */

  if(!data.cards)
   data.cards = []

  const cards = data.cards

  let imported = 0
  let skipped = 0

  /* ---------------- IMPORT ---------------- */

  for(const file of files){

   const base = file.split(".")[0]
   const split = base.split("_")

   if(split.length < 3){
    skipped++
    continue
   }

   const rarity = split.pop().toUpperCase()
   const set = split.pop().toLowerCase()
   const name = split.join(" ")

   if(!allowedRarities.includes(rarity)){
    skipped++
    continue
   }

   const setExists = sets.find(s => s.id === set)

   if(!setExists){
    skipped++
    continue
   }

   /* éviter doublons */

   const duplicate = cards.find(c =>
    c.name.toLowerCase() === name.toLowerCase() &&
    c.set === set
   )

   if(duplicate){
    skipped++
    continue
   }

   const id = getNextCardId()

   const setFolder = `./cards/images/${set}`

   if(!fs.existsSync(setFolder))
    fs.mkdirSync(setFolder,{ recursive:true })

   const safeName = name.replace(/\s/g,"_").toLowerCase()

   const newFile = `${id}_${safeName}_${rarity}.png`

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

  /* ---------------- SAVE ---------------- */

  save()

  /* ---------------- RESULT ---------------- */

  await interaction.editReply(
`📦 Import terminé

✅ ${imported} cartes importées
⚠️ ${skipped} ignorées`
  )

 }

}