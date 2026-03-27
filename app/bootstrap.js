require("dotenv").config()

const path = require("path")

const dataManager = require("../systems/dataManager")
const { loadGuilds, cleanOrphanedGuildIds } = require("../systems/guildSystem")
const { buildCraftableIndex } = require("../systems/fragmentService")

const { createClient, attachClientState } = require("./createClient")
const { loadCommands } = require("./handlers/loadCommands")
const { deployCommands } = require("./deployCommands")
const { registerMessageCreateHandler } = require("./handlers/messageCreate")
const { registerInteractionCreateHandler } = require("./handlers/interactionCreate")

function initializeSystems() {
 dataManager.loadAll()
 loadGuilds()
 cleanOrphanedGuildIds()
 buildCraftableIndex()
}

async function bootstrap() {
 initializeSystems()

 const client = attachClientState(createClient())
 const commandsPath = path.join(__dirname, "..", "commands")
 const loaded = loadCommands(client, commandsPath)

 client.once("clientReady", async () => {
  console.log(`Bot connecte : ${client.user.tag}`)
  console.log(`Commandes chargees : ${loaded}`)
  console.log("==============================")

  try {
   console.log("Mise a jour des slash commands...")
   const deployMode = await deployCommands(client.commands)
   if (deployMode === "guild") {
    console.log("Slash commands synchronisees en mode guild (dev)")
   } else {
    console.log("Slash commands synchronisees en mode global (prod)")
   }
  } catch (error) {
   console.error("Erreur deploy commands :", error)
  }
 })

 registerMessageCreateHandler(client)
 registerInteractionCreateHandler(client)

 await client.login(process.env.TOKEN)
 return client
}

module.exports = {
 bootstrap
}
