const { isDev } = require("../../systems/devSystem")
const { giveCard } = require("../../systems/pack")
const { data } = require("../../systems/dataManager")
const { getUser, save } = require("../../systems/userSystem")

const setsData = require("../../cards/sets.json")
const sets = Array.isArray(setsData) ? setsData : setsData.sets

module.exports={

 name:"devgive",
 description:"Donner une carte",

 options:[

  {
   name:"joueur",
   description:"Joueur cible",
   type:6,
   required:true
  },

  {
   name:"set",
   description:"Set",
   type:3,
   required:true,
   choices:sets.map(s=>({
    name:s.name,
    value:s.id
   }))
  },

  {
   name:"rarete",
   description:"Rareté",
   type:3,
   required:true,
   choices:[
    {name:"C",value:"C"},
    {name:"U",value:"U"},
    {name:"R",value:"R"},
    {name:"SR",value:"SR"},
    {name:"HR",value:"HR"},
    {name:"UR",value:"UR"},
    {name:"S",value:"S"},
    {name:"SSR",value:"SSR"}
   ]
  }

 ],

 async execute(interaction){

  if(!isDev(interaction.user.id))
   return interaction.reply({
    content:"Commande dev.",
    ephemeral:true
   })

  const cards = data.cards || []

  const target = interaction.options.getUser("joueur")
  const setId = interaction.options.getString("set")
  const rarity = interaction.options.getString("rarete")

  const user = getUser(target.id)

  const pool = cards.filter(c =>
   c.set === setId &&
   c.rarity === rarity
  )

  if(pool.length === 0)
   return interaction.reply("Aucune carte trouvée.")

  const card = pool[Math.floor(Math.random()*pool.length)]

  giveCard(user,card)

  save()

  interaction.reply(
`🎴 Carte donnée

Joueur : ${target.username}
Carte : ${card.name}
Rareté : ${rarity}
Set : ${setId}`
  )

 }

}