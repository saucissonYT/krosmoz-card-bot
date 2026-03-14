const { EmbedBuilder } = require("discord.js")

const { data } = require("../../systems/dataManager")
const cards = data.cards || []

const setsData = require("../../cards/sets.json")
const sets = Array.isArray(setsData) ? setsData : setsData.sets

const { isDev } = require("../../systems/devSystem")

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

 name:"setstats",
 description:"Statistiques d'un set",

 options:[
  {
   name:"set",
   description:"Nom du set",
   type:3,
   required:true,
   choices: sets.map(s=>({
    name:s.name,
    value:s.id
   }))
  }
 ],

 async execute(interaction){

  if(!isDev(interaction.user.id))
   return interaction.reply({
    content:"Commande dev.",
    ephemeral:true
   })

  const setId = interaction.options.getString("set")

  const setData = sets.find(s=>s.id===setId)

  if(!setData)
   return interaction.reply("Set introuvable.")

  const setCards = cards.filter(c=>c.set===setId)

  if(setCards.length === 0)
   return interaction.reply("Aucune carte dans ce set.")

  const rarityStats = {}

  rarityList.forEach(r=>{
   rarityStats[r]=0
  })

  setCards.forEach(card=>{
   if(rarityStats[card.rarity] !== undefined)
    rarityStats[card.rarity]++
  })

  const lines = rarityList
   .filter(r=>rarityStats[r] > 0)
   .map(r=>`${rarityNames[r]} : ${rarityStats[r]}`)

  const embed = new EmbedBuilder()
   .setTitle(`📊 Stats du set : ${setData.name}`)
   .addFields(
    {
     name:"Nombre de cartes",
     value:String(setCards.length),
     inline:true
    },
    {
     name:"Récompense",
     value:`${setData.reward ?? 0} kamas`,
     inline:true
    }
   )
   .addFields({
    name:"Distribution des raretés",
    value:lines.join("\n")
   })

  interaction.reply({
   embeds:[embed],
   ephemeral:true
  })

 }

}