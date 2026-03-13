const { isDev } = require("../../systems/devSystem")
const { getUsers, save } = require("../../systems/userSystem")

module.exports = {

 name:"resetpity",
 description:"Reset pity d'un joueur",

 options:[
  {
   name:"joueur",
   description:"Utilisateur",
   type:6,
   required:true
  }
 ],

 async execute(interaction){

  if(!isDev(interaction.user.id))
   return interaction.reply({
    content:"⛔ Commande dev uniquement.",
    ephemeral:true
   })

  const target = interaction.options.getUser("joueur")

  const users = getUsers()

  if(!users[target.id])
   return interaction.reply("Utilisateur introuvable.")

  users[target.id].pity={}

  save()

  interaction.reply(
`✅ Toutes les pity reset pour **${target.username}**`
  )

 }

}