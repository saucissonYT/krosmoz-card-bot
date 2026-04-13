const fs = require("fs")
const path = require("path")
const sharp = require("sharp")
const { SlashCommandBuilder } = require("discord.js")

const { data, save, CARDS_IMAGES_DIR } = require("../../systems/dataManager")
const { loadSets } = require("../../systems/setSystemFile")
const { isDev } = require("../../systems/devSystem")
const { resetRegistry, getCardsById } = require("../../systems/cardRegistry")
const { getBasePath } = require("../../systems/paths")
const { readJsonSafe } = require("../../systems/fileUtils")

const CARDS_PATH = path.join(getBasePath(), "cards.json")

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
   return interaction.reply({ content:"⛔ Commande dev.", flags:64 })

  let canReply = true

  const reply = async (content) => {
   if(!canReply) return

   try{
    if(interaction.deferred || interaction.replied)
     await interaction.editReply(content)
    else
     await interaction.reply({ content, flags:64 })
   }catch(err){
    if(err?.code === 10062 || err?.code === 40060){
     canReply = false
     return
    }
    throw err
   }
  }

  try{
   if(!interaction.deferred && !interaction.replied)
    await interaction.deferReply({ flags:64 })
  }catch(err){
   if(err?.code === 10062 || err?.code === 40060)
    canReply = false
   else
    throw err
  }

  const rawSets = loadSets()
  const sets = Array.isArray(rawSets) ? rawSets : rawSets?.sets || []

  const cardsFromDisk = readJsonSafe(CARDS_PATH, null)
  if(!Array.isArray(cardsFromDisk))
   return reply(`❌ Source cards invalide: ${CARDS_PATH}`)

  const cards = cardsFromDisk
  data.cards = cards

  const id = interaction.options.getInteger("id")
  const name = interaction.options.getString("nom")
  const rarity = interaction.options.getString("rarete")
  const setId = interaction.options.getString("set")
  const attachment = interaction.options.getAttachment("image")

  const cardId = String(id)
  const cardsById = getCardsById()
  const matches = cards.filter(c => String(c.id) === cardId)

  if(matches.length === 0)
   return reply("❌ Carte introuvable.")

  if(matches.length > 1){
   const preview = matches
    .slice(0, 5)
    .map((c) => `- ${c.name} (${c.rarity}, set:${c.set})`)
    .join("\n")

   return reply(
`❌ ID dupliqué détecté (#${cardId}).
${matches.length} cartes partagent cet ID.
Édition annulée pour éviter de modifier la mauvaise carte.

Conflits:
${preview}`
   )
  }

  const card = cardsById[cardId] || matches[0]

  if(name) card.name = name
  if(rarity) card.rarity = rarity

  if(setId){
   const setExists = sets.find(s => s.id === setId)
   if(!setExists)
    return reply("❌ Set invalide.")
   card.set = setId
  }

  if(attachment){

   if(!/\.(png|webp|jpg|jpeg)$/i.test(attachment.name))
    return reply("❌ Format image invalide (png, webp, jpg uniquement).")

   const setFolder = path.join(CARDS_IMAGES_DIR, card.set)

   if(!fs.existsSync(setFolder))
    fs.mkdirSync(setFolder, { recursive:true })

   if(card.image){
    const oldPath = path.join(setFolder, card.image)
    if(fs.existsSync(oldPath)){
     try{ fs.unlinkSync(oldPath) }catch(_){ }
    }
   }

   const response = await fetch(attachment.url)

   if(!response.ok)
    return reply("❌ Impossible de télécharger l'image.")

   const buffer = Buffer.from(await response.arrayBuffer())

   const safeName = String(card.name || "carte").replace(/\s/g, "_").toLowerCase()
   const newFile = `${card.id}_${safeName}_${card.rarity}.png`
   const newPath = path.join(setFolder, newFile)

   try{
    await sharp(buffer).png().toFile(newPath)
   }catch(_err){
    return reply("❌ Erreur conversion image (sharp).")
   }

   card.image = newFile
  }

  data.cards = cards
  save()
  resetRegistry()

  const persistedCards = readJsonSafe(CARDS_PATH, null)
  const persistedMatches = Array.isArray(persistedCards)
   ? persistedCards.filter(c => String(c.id) === cardId)
   : []

  const persisted = persistedMatches[0] || null
  const persistedOk = Boolean(
   persisted &&
   String(persisted.name || "") === String(card.name || "") &&
   String(persisted.rarity || "") === String(card.rarity || "") &&
   String(persisted.set || "") === String(card.set || "") &&
   String(persisted.image || "") === String(card.image || "")
  )

  if(!persistedOk){
   return reply(
`❌ Modification appliquée en mémoire mais non confirmée sur disque.
Source attendue: ${CARDS_PATH}
ID: #${cardId}

Vérifie les logs DATA pour "Erreur sauvegarde DataManager".`
   )
  }

  const parts = [`✅ Carte modifiée : **${card.name}** (#${card.id})`]
  if(name) parts.push(`📝 Nom → ${name}`)
  if(rarity) parts.push(`💎 Rareté → ${rarity}`)
  if(setId) parts.push(`📦 Set → ${setId}`)
  if(attachment) parts.push("🖼️ Image remplacée")

  await reply(parts.join("\n"))

 }

}
