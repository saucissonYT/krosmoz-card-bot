const { SlashCommandBuilder, EmbedBuilder } = require("discord.js")

const { getUser, save } = require("../../systems/userSystem")
const { achievements, giveAchievement } = require("../../systems/achievementSystem")

module.exports = {

 data: new SlashCommandBuilder()
  .setName("devachievement")
  .setDescription("Ajouter ou supprimer un achievement")
  .addUserOption(option =>
   option.setName("joueur")
    .setDescription("Joueur cible")
    .setRequired(true))
  .addStringOption(option =>
   option.setName("achievement")
    .setDescription("ID ou nom du succès")
    .setRequired(true))
  .addStringOption(option =>
   option.setName("action")
    .setDescription("Ajouter ou supprimer")
    .setRequired(true)
    .addChoices(
     {name:"add", value:"add"},
     {name:"remove", value:"remove"}
    )),

 async execute(interaction){

  const target = interaction.options.getUser("joueur")
  const input = interaction.options.getString("achievement").toLowerCase()
  const action = interaction.options.getString("action")

  const user = getUser(target.id)

  /* recherche intelligente */

  let id = null

  if(achievements[input]){
   id = input
  } else {

   for(const key in achievements){

    const name = achievements[key].name.toLowerCase()
    const title = (achievements[key].title || "").toLowerCase()

    if(
     key.toLowerCase() === input ||
     name.includes(input) ||
     title.includes(input)
    ){
     id = key
     break
    }

   }

  }

  if(!id)
   return interaction.reply({
    content:"❌ Achievement introuvable.",
    ephemeral:true
   })

  if(!user.achievements)
   user.achievements=[]

  let result=""

  if(action === "add"){

   const added=giveAchievement(user,id)

   result = added ? "Ajouté" : "Déjà possédé"

  } else {

   user.achievements =
    user.achievements.filter(a => a !== id)

   result="Supprimé"

  }

  save()

  const ach=achievements[id]

  const embed = new EmbedBuilder()

   .setTitle("⚙️ Dev Achievement")

   .setDescription(
`${result} : **${ach.name}**

ID : \`${id}\`

Joueur : ${target.username}`
   )

   .setColor("#e67e22")

  interaction.reply({embeds:[embed]})

 }

}