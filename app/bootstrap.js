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
const { registerReactionRolesHandler } = require("./handlers/reactionRoles") /* ← reaction roles */

/* ← AJOUT : serveur web krosmozcard.fr */
const { startWebServer } = require("../web/Server")

const ONLINE_RP_CHANNEL_ID = "1487121269018329178"

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

  try {
   const channel = await client.channels.fetch(ONLINE_RP_CHANNEL_ID)
   if (channel && channel.isTextBased()) {
    await channel.send(
     "Les runes vibrent, les cartes s'eveillent. Krosmoz Card est a nouveau operationnel."
    )
   } else {
    console.warn(`[ready-rp] Salon non textuel : ${ONLINE_RP_CHANNEL_ID}`)
   }
  } catch (error) {
   console.error(`[ready-rp] Impossible d'envoyer le message de demarrage (${ONLINE_RP_CHANNEL_ID}) :`, error.message)
  }
 })

 registerMessageCreateHandler(client)
 registerInteractionCreateHandler(client)
 registerReactionRolesHandler(client) /* ← enregistrement du handler reaction roles */

 await client.login(process.env.TOKEN)

 /* ← AJOUT : démarrage du serveur web (krosmozcard.fr)
    Utilise process.env.PORT assigné par Railway automatiquement.
    En local, fallback sur le port 3000. */
 startWebServer()

 return client
}

module.exports = {
 bootstrap
}
