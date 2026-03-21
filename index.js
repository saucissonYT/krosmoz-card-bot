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

/* ---------------- GUILD SYSTEM (init) ---------------- */

const { loadGuilds, cleanOrphanedGuildIds } = require("./systems/guildSystem")
loadGuilds()
cleanOrphanedGuildIds()

/* --------------------------------------------- */

const client = new Client({
 intents:[
  GatewayIntentBits.Guilds,
  GatewayIntentBits.GuildMessages,
  GatewayIntentBits.MessageContent
 ]
})

client.commands = new Collection()

/* ---------------- CHAT SYSTEM ---------------- */

const { handleMessage } = require("./systems/chatSystem")

/* ---------------- LOAD COMMANDS ---------------- */

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

/* ---------------- BOT READY ---------------- */

client.once("clientReady", async () => {

 console.log(`🤖 Bot connecté : ${client.user.tag}`)
 console.log(`📚 Commandes chargées : ${loaded}`)
 console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")

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

/* ========================================================= */
/* MESSAGE CREATE */
/* ========================================================= */

client.on("messageCreate",async message=>{

 try{

  await handleMessage(message,client)

 }catch(err){

  console.error("Erreur chatSystem :",err)

 }

})

/* ========================================================= */
/* INTERACTIONS */
/* ========================================================= */

client.on("interactionCreate",async interaction=>{

 console.log(`📩 Interaction reçue : ${interaction.type}`)

 try{

  if(interaction.isChatInputCommand()){

   const command = client.commands.get(interaction.commandName)
   if(!command) return

   await command.execute(interaction)

  }

  /* 🔥 SELECT MENUS */
  if(interaction.isStringSelectMenu()){

   /* ─────────── ROUTES EXPLICITES ─────────── */

   // ✅ KROSMOSHOP — customId = "krosmoshop_buy"
   if(interaction.customId === "krosmoshop_buy"){
    const command = client.commands.get("krosmoshop")
    if(command?.select) return command.select(interaction)
   }

   // ✅ TITRE — customId = "choose_title"
   if(interaction.customId === "choose_title"){
    const command = client.commands.get("titre")
    if(command?.select) return command.select(interaction)
   }

   // ✅ TRADE — customId = "trade_menu_give_*" ou "trade_menu_want_*"
   if(interaction.customId.startsWith("trade_menu_")){
    const command = client.commands.get("trade")
    if(command?.menu) return command.menu(interaction)
   }

   // ✅ HARDPITY — customId = "hardpityset:*" ou "hardpity:*:*"
   if(interaction.customId.startsWith("hardpityset:") || interaction.customId.startsWith("hardpity:")){
    const command = client.commands.get("hardpity")
    if(command?.select) return command.select(interaction)
   }

   /* ─────────── FALLBACK GÉNÉRIQUE ─────────── */
   /* Pour les select menus dont le customId commence
      par le nom exact de la commande avant le premier "_" */

   const commandName = interaction.customId.split("_")[0]
   const command = client.commands.get(commandName)

   if(command?.select)
    return command.select(interaction)

  }

  /* 🔥 BUTTONS */
  if(interaction.isButton()){

   /*
    * Les boutons guild_, leaderboard_, inventaire_, titre_,
    * trade_, market_, krosmohelp_, devhelp_, mystats_
    * sont gérés par leurs collectors internes. Pas besoin de
    * les router ici.
    */

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