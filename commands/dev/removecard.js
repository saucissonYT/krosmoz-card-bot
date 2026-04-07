const fs = require("fs")
const { SlashCommandBuilder, EmbedBuilder } = require("discord.js")

const { data, save, CARDS_IMAGES_DIR } = require("../../systems/dataManager")
const { isDev } = require("../../systems/devSystem")
const { resetRegistry } = require("../../systems/cardRegistry")

module.exports = {

 data: new SlashCommandBuilder()
  .setName("removecard")
  .setDescription("Supprimer une ou plusieurs cartes")
  .addStringOption(option =>
   option
    .setName("ids")
    .setDescription("ID(s) des cartes à supprimer (séparés par des virgules)")
    .setRequired(true)
  ),

 async execute(interaction){

  if(!isDev(interaction.user.id))
   return interaction.reply({
    content:"⛔ Commande dev.",
    ephemeral:true
   })

  const cards = data.cards || []

  const idsString = interaction.options.getString("ids")

  const ids = idsString
   .split(",")
   .map(id => parseInt(id.trim()))
   .filter(id => !isNaN(id))

  if(ids.length === 0)
   return interaction.reply({
    content:"❌ Aucun ID valide.",
    ephemeral:true
   })

  const removed = []
  const notFound = []

  for(const id of ids){

   const index = cards.findIndex(c => Number(c.id) === id)

   if(index === -1){
    notFound.push(id)
    continue
   }

   const card = cards[index]

   /* Suppression image */
   const imagePath = `${CARDS_IMAGES_DIR}/${card.set}/${card.image}`

   try{
    if(fs.existsSync(imagePath))
     fs.unlinkSync(imagePath)
   }catch(err){
    console.error(`Erreur suppression image ${imagePath}:`, err)
   }

   cards.splice(index, 1)

   removed.push(`#${id} ${card.name} (${card.rarity})`)

  }

  data.cards = cards
  save()
  resetRegistry()

  /* Embed résultat */

  const embed = new EmbedBuilder()
   .setTitle("🗑 Suppression de cartes")
   .setColor(removed.length ? "#e74c3c" : "#95a5a6")

  if(removed.length)
   embed.addFields({
    name:`✅ Supprimées (${removed.length})`,
    value:removed.join("\n")
   })

  if(notFound.length)
   embed.addFields({
    name:`❌ Introuvables (${notFound.length})`,
    value:notFound.join(", ")
   })

  if(!removed.length && !notFound.length)
   embed.setDescription("Aucune carte supprimée.")

  interaction.reply({ embeds:[embed], ephemeral:true })

 }

}