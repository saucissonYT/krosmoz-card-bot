const fs = require("fs")
const sharp = require("sharp")

const {
 ActionRowBuilder,
 ButtonBuilder,
 ButtonStyle
} = require("discord.js")

const { data, save } = require("../../systems/dataManager")
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

  /* ---------------- LOAD SETS ---------------- */

  const setsPath = "./cards/sets.json"
  let setsData = require("../../cards/sets.json")
  let sets = Array.isArray(setsData) ? setsData : setsData.sets

  /* ---------------- DETECT SETS ---------------- */

  const detectedSets = new Set()

  for(const file of files){

   const base = file.split(".")[0]
   const split = base.split("_")

   if(split.length < 3) continue

   const set = split[split.length-2].toLowerCase()
   detectedSets.add(set)

  }

  const unknownSets = [...detectedSets].filter(
   s => !sets.find(set => set.id === s)
  )

  /* ---------------- CREATE SETS PROMPT ---------------- */

  if(unknownSets.length > 0){

   const row = new ActionRowBuilder().addComponents(

    new ButtonBuilder()
     .setCustomId("create_sets")
     .setLabel("Créer les sets")
     .setStyle(ButtonStyle.Success),

    new ButtonBuilder()
     .setCustomId("ignore_sets")
     .setLabel("Ignorer")
     .setStyle(ButtonStyle.Secondary)

   )

   const msg = await interaction.editReply({
    content:
`⚠️ Sets inconnus détectés :

${unknownSets.map(s => `• ${s}`).join("\n")}

Voulez-vous créer ces sets automatiquement ?`,
    components:[row]
   })

   const collector = msg.createMessageComponentCollector({
    time:30000
   })

   const decision = await new Promise(resolve => {

    collector.on("collect", async i => {

     if(i.user.id !== interaction.user.id)
      return i.reply({ content:"Pas pour toi.", ephemeral:true })

     collector.stop()

     if(i.customId === "create_sets")
      resolve("create")

     else
      resolve("ignore")

     await i.update({ components:[] })

    })

    collector.on("end", (_,reason)=>{

     if(reason === "time")
      resolve("ignore")

    })

   })

   if(decision === "create"){

    for(const setId of unknownSets){

     const name = setId.charAt(0).toUpperCase() + setId.slice(1)

     sets.push({
      id:setId,
      name
     })

    }

    fs.writeFileSync(
     setsPath,
     JSON.stringify(sets,null,2)
    )

   }

  }

  /* ---------------- CARTES DATA ---------------- */

  if(!data.cards)
   data.cards = []

  const cards = data.cards

  /* reload sets */

  delete require.cache[require.resolve("../../cards/sets.json")]
  setsData = require("../../cards/sets.json")
  sets = Array.isArray(setsData) ? setsData : setsData.sets

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

  await interaction.editReply({
   content:
`📦 Import terminé

✅ ${imported} cartes importées
⚠️ ${skipped} ignorées`,
   components:[]
  })

 }

}