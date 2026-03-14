const { isDev } = require("../../systems/devSystem")
const { giveCard } = require("../../systems/pack")
const { data } = require("../../systems/dataManager")

module.exports={

 name:"devgive",
 description:"Donner une carte",

 options:[
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

 async execute(interaction,user,save){

  if(!isDev(interaction.user.id))
   return interaction.reply({
    content:"Commande dev.",
    ephemeral:true
   })

  const cards = data.cards || []

  const rarity = interaction.options.getString("rarete")

  const card = cards.find(c=>c.rarity===rarity)

  if(!card)
   return interaction.reply("Carte introuvable.")

  giveCard(user,card)

  save()

  interaction.reply(
   `🎴 Carte donnée : ${card.name} (${rarity})`
  )

 }

}