const { SlashCommandBuilder, EmbedBuilder } = require("discord.js")

const { getCards } = require("../../systems/cardRegistry")
const { loadSets } = require("../../systems/setSystemFile")
const { isDev } = require("../../systems/devSystem")
const { RARITY_EMOJI } = require("../../systems/constants")

const rarityList = ["C","U","R","SR","HR","UR","S","SSR"]

const rarityNames = {
 C:"Commune",
 U:"Peu Commune",
 R:"Rare",
 SR:"Super Rare",
 HR:"Hyper Rare",
 UR:"Ultra Rare",
 S:"Chromatique",
 SSR:"Super Chromatique"
}

module.exports = {

 data: (() => {

  const rawSets = loadSets()
  const sets = Array.isArray(rawSets) ? rawSets : rawSets?.sets || []

  const builder = new SlashCommandBuilder()
   .setName("setstats")
   .setDescription("Statistiques d'un set")

  builder.addStringOption(o => {
   o.setName("set")
    .setDescription("Set")
    .setRequired(true)

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
   return interaction.reply({
    content:"⛔ Commande dev.",
    ephemeral:true
   })

  const cards = getCards()
  const rawSets = loadSets()
  const sets = Array.isArray(rawSets) ? rawSets : rawSets?.sets || []

  const setId = interaction.options.getString("set")

  const setData = sets.find(s => s.id === setId)

  if(!setData)
   return interaction.reply("Set introuvable.")

  const setCards = cards.filter(c => c.set === setId)

  if(setCards.length === 0)
   return interaction.reply("Aucune carte dans ce set.")

  const rarityStats = {}

  rarityList.forEach(r => { rarityStats[r] = 0 })

  setCards.forEach(card => {
   if(rarityStats[card.rarity] !== undefined)
    rarityStats[card.rarity]++
  })

  const lines = rarityList
   .filter(r => rarityStats[r] > 0)
   .map(r => `${RARITY_EMOJI[r]} ${rarityNames[r]} : **${rarityStats[r]}**`)

  const embed = new EmbedBuilder()
   .setTitle(`📊 Stats du set : ${setData.name}`)
   .setColor("#3498db")
   .addFields(
    { name:"Nombre de cartes", value:String(setCards.length), inline:true },
    { name:"Récompense", value:`${setData.reward ?? 0} kamas`, inline:true }
   )
   .addFields({
    name:"Distribution des raretés",
    value:lines.join("\n")
   })

  interaction.reply({ embeds:[embed], ephemeral:true })

 }

}