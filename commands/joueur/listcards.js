const cardsData = require("../../cards/cards.json")
const cards = Array.isArray(cardsData) ? cardsData : cardsData.cards

const sets = require("../../cards/sets.json")
const { isDev } = require("../../systems/devSystem")

const rarityOrder = {
 SSR:8,
 S:7,
 UR:6,
 HR:5,
 SR:4,
 R:3,
 U:2,
 C:1
}

const setChoices = sets.map(s=>({
 name:s.name,
 value:s.id
}))

module.exports = {

 name:"listcards",
 description:"Lister les cartes d'un set",

 options:[
  {
   name:"set",
   description:"Nom du set",
   type:3,
   required:true,
   choices:setChoices
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

  setCards.sort((a,b)=>{

   const ra = rarityOrder[a.rarity] || 0
   const rb = rarityOrder[b.rarity] || 0

   if(rb !== ra)
    return rb - ra

   return a.id - b.id

  })

  const text = setCards
   .slice(0,100)
   .map(c=>`ID:${c.id} | ${c.name} | ${c.rarity}`)
   .join("\n")

  interaction.reply({
   content:
`📦 Set : ${setData.name}

${text}`,
   ephemeral:true
  })

 }

}