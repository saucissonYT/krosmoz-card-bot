const { SlashCommandBuilder, EmbedBuilder } = require("discord.js")

const { isDev } = require("../../systems/devSystem")
const { getUser, save } = require("../../systems/userSystem")
const achievements = require("../../systems/achievementRegistry")

module.exports = {

 data: new SlashCommandBuilder()
  .setName("devachievement")
  .setDescription("Ajouter ou supprimer un achievement")
  .addUserOption(option =>
   option
    .setName("joueur")
    .setDescription("Joueur cible")
    .setRequired(true)
  )
  .addStringOption(option =>
   option
    .setName("achievement")
    .setDescription("ID ou nom du succès")
    .setRequired(true)
  )
  .addStringOption(option =>
   option
    .setName("action")
    .setDescription("Ajouter ou supprimer")
    .setRequired(true)
    .addChoices(
     { name:"add", value:"add" },
     { name:"remove", value:"remove" }
    )
  ),

 async execute(interaction){

  /* Fix : vérification dev manquante */
  if(!isDev(interaction.user.id))
   return interaction.reply({
    content:"⛔ Commande dev.",
    ephemeral:true
   })

  const target = interaction.options.getUser("joueur")
  const input = interaction.options.getString("achievement").toLowerCase()
  const action = interaction.options.getString("action")

  const user = getUser(target.id)

  /* Recherche intelligente */

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
   user.achievements = []

  if(!user.titles)
   user.titles = ["Nouveau"]

  const ach = achievements[id]
  let result = ""

  if(action === "add"){

   if(!user.achievements.includes(id)){

    user.achievements.push(id)
    result = "✅ Ajouté"

    /* Donner le titre associé si applicable */
    if(ach.title && !user.titles.includes(ach.title)){
     user.titles.push(ach.title)
     result += ` (+titre: ${ach.title})`
    }

   } else {
    result = "⚠️ Déjà possédé"
   }

  } else {

   const had = user.achievements.includes(id)

   user.achievements =
    user.achievements.filter(a => a !== id)

   if(had){
    result = "🗑 Supprimé"

    /* Retirer le titre si aucun autre achievement ne le donne */
    if(ach.title){

     const stillHasTitle = user.achievements.some(aId => {
      const other = achievements[aId]
      return other && other.title === ach.title
     })

     if(!stillHasTitle){
      user.titles = user.titles.filter(t => t !== ach.title)

      if(user.title === ach.title)
       user.title = user.titles[0] || "Nouveau"

      result += ` (-titre: ${ach.title})`
     }

    }

   } else {
    result = "⚠️ Non possédé"
   }

  }

  /* Fix : save avec userId */
  save(target.id)

  const embed = new EmbedBuilder()
   .setTitle("⚙️ Dev Achievement")
   .setColor("#e67e22")
   .setDescription(
`${result}

${ach.badge} **${ach.name}**
${ach.description || ""}

ID : \`${id}\`
Joueur : **${target.username}**
Achievements : **${user.achievements.length}**`
   )

  interaction.reply({ embeds:[embed], ephemeral:true })

 }

}