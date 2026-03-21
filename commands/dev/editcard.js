const { SlashCommandBuilder } = require("discord.js")

const { data, save } = require("../../systems/dataManager")
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

  return builder

 })(),

 async execute(interaction){

  if(!isDev(interaction.user.id))
   return interaction.reply({ content:"⛔ Commande dev.", ephemeral:true })

  const rawSets = loadSets()
  const sets = Array.isArray(rawSets) ? rawSets : rawSets?.sets || []

  const cards = data.cards || []

  const id = interaction.options.getInteger("id")
  const name = interaction.options.getString("nom")
  const rarity = interaction.options.getString("rarete")
  const setId = interaction.options.getString("set")

  const card = cards.find(c => c.id === id)

  if(!card)
   return interaction.reply("Carte introuvable.")

  if(name) card.name = name
  if(rarity) card.rarity = rarity

  if(setId){
   const setExists = sets.find(s => s.id === setId)
   if(!setExists)
    return interaction.reply("Set invalide.")
   card.set = setId
  }

  data.cards = cards
  save()
  resetRegistry()

  interaction.reply(`✅ Carte modifiée : **${card.name}** (#${card.id})`)

 }

}