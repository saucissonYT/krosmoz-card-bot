const { SlashCommandBuilder } = require("discord.js")

const { isDev } = require("../../systems/devSystem")
const { getUser, save } = require("../../systems/userSystem")

module.exports={

 name:"ecogive",

 data:new SlashCommandBuilder()

  .setName("ecogive")
  .setDescription("Modifier les kamas d'un joueur")

  .addUserOption(option=>
   option.setName("joueur")
   .setDescription("Joueur cible")
   .setRequired(true)
  )

  .addIntegerOption(option=>
   option.setName("montant")
   .setDescription("Montant de kamas")
   .setRequired(true)
  )

  .addStringOption(option=>
   option.setName("action")
   .setDescription("Type d'action")
   .setRequired(true)
   .addChoices(
    {name:"Ajouter",value:"add"},
    {name:"Retirer",value:"remove"},
    {name:"Définir",value:"set"}
   )
  ),

 async execute(interaction){

  if(!isDev(interaction.user.id))
   return interaction.reply({
    content:"Commande dev.",
    ephemeral:true
   })

  const target = interaction.options.getUser("joueur")
  const amount = interaction.options.getInteger("montant")
  const action = interaction.options.getString("action")

  const user = getUser(target.id)

  if(!user.kamas) user.kamas = 0

  let result = 0

  if(action === "add"){
   user.kamas += amount
  }

  if(action === "remove"){
   user.kamas -= amount
   if(user.kamas < 0) user.kamas = 0
  }

  if(action === "set"){
   user.kamas = amount
  }

  result = user.kamas

  save()

  interaction.reply(
`💰 Économie modifiée

Joueur : ${target.username}
Action : ${action}
Montant : ${amount}

Total actuel : **${result} kamas**`
  )

 }

}