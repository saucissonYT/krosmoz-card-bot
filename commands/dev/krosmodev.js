const {isOwner, toggleDev} = require("../../systems/devSystem")

module.exports = {

 name:"krosmodev",

 async execute(interaction){

  if(!isOwner(interaction.user.id))
   return interaction.reply({
    content:"Commande réservée au propriétaire.",
    ephemeral:true
   })

  const target = interaction.options.getUser("joueur")

  const result = toggleDev(target.id)

  if(result){

   interaction.reply(`${target.username} est maintenant développeur.`)

  }else{

   interaction.reply(`${target.username} n'est plus développeur.`)

  }

 }

}