const fs = require("fs")
const path = require("path")

const {
 SlashCommandBuilder
} = require("discord.js")

const {
 data,
 save,
 USERS_DIR,
 CARDS_IMAGES_DIR
} = require("../../systems/dataManager")

const { isDev } = require("../../systems/devSystem")

module.exports = {

 data: new SlashCommandBuilder()
  .setName("resetdata")
  .setDescription("⚠️ Reset COMPLET de la base de données"),

 async execute(interaction){

  await interaction.deferReply({ephemeral:true})

  if(!isDev(interaction.user.id))
   return interaction.editReply("⛔ Commande développeur uniquement.")

  /* ---------------- DELETE USERS ---------------- */

  if(fs.existsSync(USERS_DIR)){

   const files = fs.readdirSync(USERS_DIR)

   for(const file of files){

    fs.unlinkSync(
     path.join(USERS_DIR,file)
    )

   }

  }

  data.users = {}

  /* ---------------- RESET MARKET ---------------- */

  data.market = []
  data.marketHistory = []

  /* ---------------- RESET CARDS ---------------- */

  data.cards = []

  /* ---------------- DELETE IMAGES ---------------- */

  if(fs.existsSync(CARDS_IMAGES_DIR)){

   const sets = fs.readdirSync(CARDS_IMAGES_DIR)

   for(const set of sets){

    const setPath = path.join(CARDS_IMAGES_DIR,set)

    const files = fs.readdirSync(setPath)

    for(const file of files){

     fs.unlinkSync(
      path.join(setPath,file)
     )

    }

   }

  }

  /* ---------------- SAVE ---------------- */

  save()

  await interaction.editReply(
`🧹 **Reset complet effectué**

✔ users supprimés  
✔ market vidé  
✔ marketHistory vidé  
✔ cartes supprimées  
✔ images supprimées  

La base est maintenant **propre**.`
  )

 }

}