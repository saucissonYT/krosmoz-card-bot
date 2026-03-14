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
const { loadSets } = require("../../systems/setSystemFile")

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
   .filter(f => /\.(png|webp)$/i.test(f))

  if(files.length === 0)
   return interaction.editReply("❌ Aucun fichier image dans `cards/import`.")

  /* ---------------- LOAD SETS ---------------- */

  const setsData = loadSets()

  const sets = Array.isArray(setsData)
   ? setsData
   : setsData.sets || []

  /* ---------------- DETECT UNKNOWN SETS ---------------- */

  const unknownSetCards = {}

  for(const file of files){

   const base = file.split(".")[0]
   const split = base.split("_")

   if(split.length < 3) continue

   const rarity = split.pop().toUpperCase()
   const set = split.pop().toLowerCase()
   const name = split.join(" ")

   if(!sets.find(s => s.id === set)){

    if(!unknownSetCards[set])
     unknownSetCards[set] = []

    unknownSetCards[set].push(name)

   }

  }

  const unknownSets = Object.keys(unknownSetCards)

  /* ---------------- ASK CREATE SETS ---------------- */

  if(unknownSets.length > 0){

   const details = unknownSets.map(set => {

    const cards = unknownSetCards[set]

    const preview = cards
     .slice(0,10)
     .map(c => `  • ${c}`)
     .join("\n")

    const more =
     cards.length > 10
      ? `\n  ... et ${cards.length-10} autres`
      : ""

    return `Set : **${set}**
Cartes détectées : ${cards.length}

${preview}${more}`

   }).join("\n\n")

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

${details}

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

    const setsPath = "./cards/sets.json"

    for(const setId of unknownSets){

     const name =
      setId.charAt(0).toUpperCase() + setId.slice(1)

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

  /* ---------------- DATA CARDS ---------------- */

  if(!data.cards)
   data.cards = []

  const cards = data.cards

  let imported = 0
  let skipped = 0

  /* -------- FIX ID DUPLICATION -------- */

  let nextId = getNextCardId()

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

   const id = nextId++
   
   const setFolder = `./cards/images/${set}`

   if(!fs.existsSync(setFolder))
    fs.mkdirSync(setFolder,{ recursive:true })

   const safeName =
    name.replace(/\s/g,"_").toLowerCase()

   const newFile =
    `${id}_${safeName}_${rarity}.png`

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