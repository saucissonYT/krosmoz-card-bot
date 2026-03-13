const { isOwner } = require("../../systems/devSystem")
const fs = require("fs")
const devs = require("../../database/devs.json")

module.exports = {

 name:"removedev",

 async execute(interaction){

  if(!isOwner(interaction.user.id))
   return interaction.reply({
    content:"Commande réservée au propriétaire.",
    ephemeral:true
   })

  const user = interaction.options.getUser("joueur")

  devs.devs = devs.devs.filter(id => id !== user.id)

  fs.writeFileSync(
   "./database/devs.json",
   JSON.stringify(devs,null,2)
  )

  interaction.reply(`${user.username} retiré des développeurs.`)

 }

}