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

  /* ========================================= */
  /* SLASH COMMANDS                            */
  /* ========================================= */

  if(interaction.isChatInputCommand()){

   const command = client.commands.get(interaction.commandName)
   if(!command) return

   await command.execute(interaction)

  }

  /* ========================================= */
  /* SELECT MENUS                              */
  /* ========================================= */

  if(interaction.isStringSelectMenu()){

   const id = interaction.customId

   // ✅ KROSMOSHOP — customId = "krosmoshop_buy"
   if(id === "krosmoshop_buy"){
    const command = client.commands.get("krosmoshop")
    if(command?.select) return command.select(interaction)
   }

   // ✅ TITRE — customId = "choose_title"
   if(id === "choose_title"){
    const command = client.commands.get("titre")
    if(command?.select) return command.select(interaction)
   }

   // ✅ TRADE — customId = "trade_menu_give_*" ou "trade_menu_want_*"
   if(id.startsWith("trade_menu_")){
    const command = client.commands.get("trade")
    if(command?.menu) return command.menu(interaction)
   }

   // ✅ HARDPITY — customId = "hardpityset:*" ou "hardpity:*:*"
   if(id.startsWith("hardpityset:") || id.startsWith("hardpity:")){
    const command = client.commands.get("hardpity")
    if(command?.select) return command.select(interaction)
   }

   /* ─── FALLBACK GÉNÉRIQUE ─── */
   const commandName = id.split("_")[0]
   const command = client.commands.get(commandName)

   if(command?.select)
    return command.select(interaction)

  }

  /* ========================================= */
  /* BUTTONS                                   */
  /* ========================================= */

  if(interaction.isButton()){

   const id = interaction.customId

   // ✅ MARKET — market_buy, market_sell, market_my, market_next, market_prev,
   //             market_buy_modal, market_remove_modal, market_back
   if(id.startsWith("market_")){
    const command = client.commands.get("market")
    if(command?.button) return command.button(interaction)
   }

   // ✅ TITRE — title_prev, title_next
   if(id === "title_prev" || id === "title_next"){
    const command = client.commands.get("titre")
    if(command?.button) return command.button(interaction)
   }

   // ✅ TRADE — trade_accept_*, trade_refuse_*, trade_cancel_*
   if(id.startsWith("trade_accept_") || id.startsWith("trade_refuse_") || id.startsWith("trade_cancel_")){
    const command = client.commands.get("trade")
    if(command?.button) return command.button(interaction)
   }

   // ✅ KROSMOHELP — help_packs, help_collection, etc.
   if(id.startsWith("help_")){
    const command = client.commands.get("krosmohelp")
    if(command?.button) return command.button(interaction)
   }

   // ✅ DEVHELP — devhelp_admin, devhelp_cards, etc.
   if(id.startsWith("devhelp_")){
    const command = client.commands.get("devhelp")
    if(command?.button) return command.button(interaction)
   }

   /*
    * Boutons gérés par collectors internes (PAS de routing ici) :
    *
    * guild_*             → guild.js / guildmanage.js
    * lb_*, leaderboard_* → leaderboard.js
    * inventaire_*        → inventaire.js
    * mystats_*           → mystats.js
    * pity_*              → pity.js
    * ach_*               → achievement.js
    * sell_*, market_*    → carte.js (boutons vente/market sur fiche carte)
    * buy_pack_*          → buypack.js
    * confirm_sell_*      → sellduplicate.js
    * cancel_sell_*       → sellduplicate.js
    * simpack_*           → simpack.js
    * list_*              → listcards.js
    */

  }

  /* ========================================= */
  /* MODALS                                    */
  /* ========================================= */

  if(interaction.isModalSubmit()){

   const id = interaction.customId

   // ✅ MARKET — marketBuyModal, marketSellModal, marketRemoveModal
   if(id === "marketBuyModal" || id === "marketSellModal" || id === "marketRemoveModal"){
    const command = client.commands.get("market")
    if(command?.modal) return command.modal(interaction)
   }

   // ✅ CARTE — marketmodal_* (mise en vente depuis /carte)
   if(id.startsWith("marketmodal_")){
    const command = client.commands.get("carte")
    if(command?.modal) return command.modal(interaction)
   }

   /*
    * Modals gérés par awaitModalSubmit() interne :
    * guild_create_modal → guild.js
    */

  }

 }catch(error){

  console.error("❌ ERREUR :",error)

  try{
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
  }catch(e){
   console.error("❌ Impossible d'envoyer le message d'erreur :",e.message)
  }

 }

})

client.login(process.env.TOKEN)