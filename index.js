require("dotenv").config()

const {
 Client,
 Collection,
 GatewayIntentBits,
 SlashCommandBuilder,
 REST,
 Routes
} = require("discord.js")

const fs = require("fs")
const path = require("path")

/* ---------------- DATAMANAGER ---------------- */

const dataManager = require("./systems/dataManager")
dataManager.loadAll()

/* --------------------------------------------- */

const client = new Client({
 intents:[GatewayIntentBits.Guilds]
})

client.commands = new Collection()

const commandsPath = path.join(__dirname,"commands")
const commandFolders = fs.readdirSync(commandsPath)

let loaded = 0

console.log("\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
console.log("   SCAN DES COMMANDES")
console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n")

for(const folder of commandFolders){

 console.log(`[${folder.toUpperCase()}]`)

 const folderPath = path.join(commandsPath,folder)
 const commandFiles = fs.readdirSync(folderPath).filter(file=>file.endsWith(".js"))

 for(const file of commandFiles){

  const filePath = path.join(folderPath,file)

  try{

   const command = require(filePath)

   if(command.data){

    client.commands.set(command.data.name,command)
    console.log(`✔ ${command.data.name}`)
    loaded++
    continue

   }

   if(command.name && command.execute){

    const builder = new SlashCommandBuilder()
     .setName(command.name)
     .setDescription(command.description || "commande")

    command.data = builder

    client.commands.set(command.name,command)

    console.log(`➜ ${command.name}`)
    loaded++
    continue

   }

   console.log(`✖ ${file}`)

  }catch(err){

   console.log(`💥 ${file}`)
   console.error(err)

  }

 }

 console.log("")

}

console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")

client.once("clientReady", async () => {

 console.log(`🤖 Bot connecté : ${client.user.tag}`)
 console.log(`📚 Commandes chargées : ${loaded}`)
 console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")

 /* ---------------- DEPLOY COMMANDES ---------------- */

 const commands=[]

 for(const command of client.commands.values()){
  commands.push(command.data.toJSON())
 }

 const rest = new REST({version:"10"}).setToken(process.env.TOKEN)

 try{

  console.log("🚀 Mise à jour des slash commands...")

  await rest.put(
   Routes.applicationCommands(process.env.CLIENT_ID),
   { body:commands }
  )

  console.log("✅ Slash commands synchronisées")

 }catch(error){

  console.error("❌ Erreur deploy commands :",error)

 }

})

client.on("interactionCreate",async interaction=>{

 console.log(`📩 Interaction reçue : ${interaction.type}`)

 try{

  /* ---------------- SLASH COMMAND ---------------- */

  if(interaction.isChatInputCommand()){

   console.log(`⚡ Commande : ${interaction.commandName}`)

   const command = client.commands.get(interaction.commandName)

   if(!command){
    console.log("❌ Commande introuvable")
    return
   }

   await command.execute(interaction)

  }

  /* ---------------- SELECT MENU ---------------- */

  if(interaction.isStringSelectMenu()){

   console.log(`📦 Menu : ${interaction.customId}`)

   if(interaction.customId==="krosmoz_set"){

    const command = require("./commands/joueur/krosmoz")
    return command.select(interaction)

   }

   if(interaction.customId.startsWith("hardpity")){

    const command = require("./commands/dev/hardpity")
    return command.select(interaction)

   }

   if(interaction.customId==="choose_title"){

    const {getUser,save}=require("./systems/userSystem")

    const user = getUser(interaction.user.id)

    const title = interaction.values[0]

    user.title = title

    save()

    return interaction.update({
     content:`👑 Titre sélectionné : **${title}**`,
     components:[]
    })

   }

   if(interaction.customId.startsWith("trade_menu")){

    console.log("🔄 Menu trade détecté")

    const command = require("./commands/joueur/trade")
    return command.menu(interaction)

   }

  }

  /* ---------------- BOUTONS ---------------- */

  if(interaction.isButton()){

   if(interaction.customId.startsWith("help_")){

    const command = require("./commands/joueur/kroshelp")
    return command.button(interaction)

   }

   if(interaction.customId.startsWith("devhelp_")){

    const command = require("./commands/dev/devhelp")
    return command.button(interaction)

   }

   if(interaction.customId.startsWith("trade_")){

    console.log("🔄 Bouton trade détecté")

    const command = require("./commands/joueur/trade")
    return command.button(interaction)

   }

  }

 }catch(error){

  console.error("❌ ERREUR :",error)

  if(interaction.replied || interaction.deferred){

   await interaction.followUp({
    content:"❌ Une erreur est survenue.",
    ephemeral:true
   })

  }else{

   await interaction.reply({
    content:"❌ Une erreur est survenue.",
    ephemeral:true
   })

  }

 }

})

client.login(process.env.TOKEN)
