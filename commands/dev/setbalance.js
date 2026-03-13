const { EmbedBuilder } = require("discord.js")

const cards = require("../../cards/cards.json")
const { generatePack } = require("../../systems/pack")
const { isDev } = require("../../systems/devSystem")

const rarityEmoji={
 C:"⚪",
 U:"🟢",
 R:"🔵",
 SR:"🟣",
 HR:"🔴",
 UR:"🟡",
 S:"✨",
 SSR:"🌈"
}

module.exports={

 name:"setbalance",
 description:"Analyse complète d'un set",

 options:[
  {
   name:"set",
   description:"Nom du set",
   type:3,
   required:true
  }
 ],

 async execute(interaction){

  if(!isDev(interaction.user.id))
   return interaction.reply({
    content:"Commande dev uniquement.",
    ephemeral:true
   })

  const setName = interaction.options.getString("set").toLowerCase()

  const setCards = cards.cards.filter(c =>
   c.set.toLowerCase() === setName
  )

  if(setCards.length === 0)
   return interaction.reply("❌ Set introuvable.")

  /* ---------- répartition réelle ---------- */

  const rarityCount={
   C:0,U:0,R:0,SR:0,
   HR:0,UR:0,S:0,SSR:0
  }

  for(const card of setCards)
   rarityCount[card.rarity]++

  /* ---------- simulation gacha ---------- */

  const simulation={
   C:0,U:0,R:0,SR:0,
   HR:0,UR:0,S:0,SSR:0
  }

  const mockUser={
   cards:{},
   pity:{
    [setName]:{
     UR:0,
     SSR:0
    }
   }
  }

  const pulls=1000

  for(let i=0;i<pulls;i++){

   const pack=generatePack(mockUser,setName)

   for(const card of pack){

    simulation[card.rarity]++

   }

  }

  /* ---------- probabilités ---------- */

  const probabilities={}

  for(const r in simulation){

   probabilities[r] = (
    (simulation[r] / (pulls*5)) * 100
   ).toFixed(2)

  }

  /* ---------- analyse équilibrage ---------- */

  const warnings=[]
  const suggestions=[]

  if(rarityCount.UR < 2){
   warnings.push("Peu de cartes UR dans le set")
   suggestions.push("Ajouter 1-2 UR")
  }

  if(rarityCount.SSR < 1){
   warnings.push("Aucune SSR dans le set")
   suggestions.push("Ajouter au moins 1 SSR")
  }

  if(rarityCount.C > setCards.length*0.6){
   warnings.push("Trop de cartes communes")
   suggestions.push("Réduire les C ou ajouter des R/SR")
  }

  /* ---------- affichage ---------- */

  const rarityLines = Object.entries(rarityCount)
   .filter(([r,v])=>v>0)
   .map(([r,v]) =>
    `${rarityEmoji[r]} **${r}** : ${v}`
   )

  const simLines = Object.entries(simulation)
   .filter(([r,v])=>v>0)
   .map(([r,v]) =>
    `${rarityEmoji[r]} **${r}** : ${v} (${probabilities[r]}%)`
   )

  const embed = new EmbedBuilder()

   .setTitle(`📦 Analyse du set : ${setName}`)

   .addFields(
    {
     name:"🎴 Cartes dans le set",
     value:
`Total : **${setCards.length}**

${rarityLines.join("\n")}`
    },
    {
     name:"🎲 Simulation 1000 tirages",
     value:simLines.join("\n")
    }
   )

  if(warnings.length){

   embed.addFields({
    name:"⚠️ Problèmes détectés",
    value:warnings.join("\n")
   })

  }

  if(suggestions.length){

   embed.addFields({
    name:"🧠 Suggestions d'équilibrage",
    value:suggestions.join("\n")
   })

  }

  embed
   .setFooter({
    text:"Simulation avec pity active"
   })
   .setColor("#9b59b6")

  interaction.reply({
   embeds:[embed]
  })

 }

}