const { isDev } = require("../../systems/devSystem")
const { addSet } = require("../../systems/setSystemFile")

module.exports = {

 name:"setcreate",
 description:"Créer un set",

 options:[
  {
   name:"name",
   description:"Nom du set",
   type:3,
   required:true
  },
  {
   name:"reward",
   description:"Récompense en kamas",
   type:4,
   required:true
  }
 ],

 async execute(interaction){

  if(!isDev(interaction.user.id))
   return interaction.reply({content:"Commande dev.",ephemeral:true})

  const name = interaction.options.getString("name")
  const reward = interaction.options.getInteger("reward")

  const result = addSet(name,reward)

  if(result.error)
   return interaction.reply(result.error)

  interaction.reply(
`📦 Set créé

Nom : ${result.name}
ID : ${result.id}
Reward : ${result.reward}`
  )

 }

}