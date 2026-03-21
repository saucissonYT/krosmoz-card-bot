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

const { loadGuilds } = require("./systems/guildSystem")
loadGuilds()

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

   // ✅ FIX KROSMOSHOP
   if(interaction.customId==="krosmoshop_buy"){
    const command = require("./commands/joueur/krosmoshop")
    return command.select(interaction)
   }

   if(interaction.customId==="krosmoz_set"){
    const command = require("./commands/joueur/krosmoz")
    return command.select(interaction)
   }

   if(interaction.customId.startsWith("hardpity")){
    const command = require("./commands/dev/hardpity")
    return command.select(interaction)
   }

   if(interaction.customId==="choose_title"){
    const command = require("./commands/joueur/titre")
    return command.select(interaction)
   }

   if(interaction.customId.startsWith("trade_menu")){
    const command = require("./commands/joueur/trade")
    return command.menu(interaction)
   }

   if(interaction.customId==="sellcard_select"){
    const command = require("./commands/joueur/sellcard")
    return command.select(interaction)
   }

  }

  if(interaction.isButton()){

   if(interaction.customId.startsWith("help_")){
    const command = require("./commands/joueur/krosmohelp")
    return command.button(interaction)
   }

   if(interaction.customId.startsWith("devhelp_")){
    const command = require("./commands/dev/devhelp")
    return command.button(interaction)
   }

   if(interaction.customId.startsWith("trade_")){
    const command = require("./commands/joueur/trade")
    return command.button(interaction)
   }

   if(interaction.customId.startsWith("title_")){
    const command = require("./commands/joueur/titre")
    return command.button(interaction)
   }

   if(interaction.customId.startsWith("market_")){
    const command = require("./commands/joueur/market")
    return command.button(interaction)
   }

   /*
    * Note : les boutons guild_ (guild_back, guild_members, guild_quests,
    * guild_bonuses, guild_leave, guild_claim_quests, guild_create,
    * guild_accept, guild_decline, guild_transfer_confirm, guild_disband_confirm)
    * sont gérés par les collectors internes de guild.js et guildmanage.js.
    * Pas besoin de les router ici.
    */

  }

  /* ---------------- MODALS ---------------- */

  if(interaction.isModalSubmit()){

   console.log("📝 Modal :",interaction.customId)

   if(
    interaction.customId==="marketSellModal" ||
    interaction.customId==="marketBuyModal" ||
    interaction.customId==="marketRemoveModal"
   ){
    const command = require("./commands/joueur/market")
    return command.modal(interaction)
   }

   if(interaction.customId.startsWith("marketmodal_")){
    const command = require("./commands/joueur/carte")
    return command.modal(interaction)
   }

   /*
    * Note : le modal guild_create_modal est géré par le collector
    * interne de guild.js via awaitModalSubmit(). Pas besoin de le
    * router ici.
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