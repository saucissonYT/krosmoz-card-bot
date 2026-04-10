const fs = require("fs")
const path = require("path")
const sharp = require("sharp")
const { SlashCommandBuilder } = require("discord.js")

const { data, save, CARDS_IMAGES_DIR } = require("../../systems/dataManager")
const { loadSets } = require("../../systems/setSystemFile")
const { isDev } = require("../../systems/devSystem")
const { resetRegistry } = require("../../systems/cardRegistry")

module.exports = {

 data: (() => {

  const rawSets = loadSets()
  const sets = Array.isArray(rawSets) ? rawSets : rawSets?.sets || []

  const builder = new SlashCommandBuilder()
   .setName("editcard")
   .setDescription("Modifier une carte")
   .addIntegerOption(o =>
    o.setName("id")
     .setDescription("ID de la carte")
     .setRequired(true)
   )
   .addStringOption(o =>
    o.setName("nom")
     .setDescription("Nouveau nom")
     .setRequired(false)
   )
   .addStringOption(o =>
    o.setName("rarete")
     .setDescription("Nouvelle rareté")
     .setRequired(false)
     .addChoices(
      { name:"C", value:"C" },
      { name:"U", value:"U" },
      { name:"R", value:"R" },
      { name:"SR", value:"SR" },
      { name:"HR", value:"HR" },
      { name:"UR", value:"UR" },
      { name:"S", value:"S" },
      { name:"SSR", value:"SSR" }
     )
   )

  builder.addStringOption(o => {
   o.setName("set")
    .setDescription("Nouveau set")
    .setRequired(false)

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

  builder.addAttachmentOption(o =>
   o.setName("image")
    .setDescription("Nouvelle image de la carte")
    .setRequired(false)
  )

  return builder

 })(),

 async execute(interaction){

  if(!isDev(interaction.user.id))
   return interaction.reply({ content:"⛔ Commande dev.", ephemeral:true })

  await interaction.deferReply({ ephemeral:true })

  const rawSets = loadSets()
  const sets = Array.isArray(rawSets) ? rawSets : rawSets?.sets || []

  const cards = data.cards || []

  const id = interaction.options.getInteger("id")
  const name = interaction.options.getString("nom")
  const rarity = interaction.options.getString("rarete")
  const setId = interaction.options.getString("set")
  const attachment = interaction.options.getAttachment("image")

  const card = cards.find(c => c.id === id)

  if(!card)
   return interaction.editReply("❌ Carte introuvable.")

  if(name) card.name = name
  if(rarity) card.rarity = rarity

  if(setId){
   const setExists = sets.find(s => s.id === setId)
   if(!setExists)
    return interaction.editReply("❌ Set invalide.")
   card.set = setId
  }

  /* ── Remplacement image ── */

  if(attachment){

   if(!/\.(png|webp|jpg|jpeg)$/i.test(attachment.name))
    return interaction.editReply("❌ Format image invalide (png, webp, jpg uniquement).")

   const setFolder = path.join(CARDS_IMAGES_DIR, card.set)

   if(!fs.existsSync(setFolder))
    fs.mkdirSync(setFolder, { recursive:true })

   /* Supprimer l'ancienne image si elle existe */
   if(card.image){
    const oldPath = path.join(setFolder, card.image)
    if(fs.existsSync(oldPath)){
     try{ fs.unlinkSync(oldPath) }catch(_){}
    }
   }

   /* Télécharger la pièce jointe */
   const response = await fetch(attachment.url)

   if(!response.ok)
    return interaction.editReply("❌ Impossible de télécharger l'image.")

   const buffer = Buffer.from(await response.arrayBuffer())

   /* Générer le nouveau nom de fichier */
   const safeName = (card.name).replace(/\s/g, "_").toLowerCase()
   const newFile = `${card.id}_${safeName}_${card.rarity}.png`
   const newPath = path.join(setFolder, newFile)

   try{
    await sharp(buffer).png().toFile(newPath)
   }catch(err){
    return interaction.editReply("❌ Erreur conversion image (sharp).")
   }

   card.image = newFile

  }

  data.cards = cards
  save()
  resetRegistry()

  const parts = [`✅ Carte modifiée : **${card.name}** (#${card.id})`]
  if(name) parts.push(`📝 Nom → ${name}`)
  if(rarity) parts.push(`💎 Rareté → ${rarity}`)
  if(setId) parts.push(`📦 Set → ${setId}`)
  if(attachment) parts.push(`🖼️ Image remplacée`)

  await interaction.editReply(parts.join("\n"))

 }

}