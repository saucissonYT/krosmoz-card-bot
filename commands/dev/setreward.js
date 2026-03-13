const { isDev } = require("../../systems/devSystem")
const { editSetReward, loadSets } = require("../../systems/setSystemFile")

module.exports = {

 name:"setreward",
 description:"Modifier la récompense d'un set",

 options:[
  {
   name:"set",
   description:"Set",
   type:3,
   required:true,
   choices: loadSets().map(s=>({
    name:s.name,
    value:s.id
   }))
  },
  {
   name:"reward",
   description:"Nouvelle récompense",
   type:4,
   required:true
  }
 ],

 async execute(interaction){

  if(!isDev(interaction.user.id))
   return interaction.reply({
    content:"Commande dev.",
    ephemeral:true
   })

  const id = interaction.options.getString("set")
  const reward = interaction.options.getInteger("reward")

  const result = editSetReward(id,reward)

  if(result.error)
   return interaction.reply(result.error)

  interaction.reply(
`💰 Récompense modifiée

Set : ${result.name}
Reward : ${result.reward}`
  )

 }

}