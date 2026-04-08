require("dotenv").config()

const path = require("path")

const { createLogger, createTimer } = require("../systems/logger")
const dataManager = require("../systems/dataManager")
const { loadGuilds, cleanOrphanedGuildIds } = require("../systems/guildSystem")
const { buildCraftableIndex } = require("../systems/fragmentService")
const { getCards } = require("../systems/cardRegistry")

const { createClient, attachClientState } = require("./createClient")
const { loadCommands } = require("./handlers/loadCommands")
const { deployCommands } = require("./deployCommands")
const { registerMessageCreateHandler } = require("./handlers/messageCreate")
const { registerInteractionCreateHandler } = require("./handlers/interactionCreate")
const { registerReactionRolesHandler } = require("./handlers/reactionRoles")

const { startWebServer, setWebHooks } = require("../web/Server")
const { startPinataScheduler } = require("../systems/pinataEvent")
const { startEventScheduler } = require("../systems/eventSystem")

const log = createLogger("BOOT")
const DISCORD_AUTO_EVENT_CHANNEL_ID = "1487121269018329178"

function initializeSystems() {
 const timer = createTimer("initSystems")
 dataManager.loadAll()
 loadGuilds()
 cleanOrphanedGuildIds()
 buildCraftableIndex()
 log.info("Systemes initialises", timer.end({ cards: getCards().length }))
}

async function bootstrap() {
 initializeSystems()

 const client = attachClientState(createClient())
 const commandsPath = path.join(__dirname, "..", "commands")
 const loaded = loadCommands(client, commandsPath)

 client.once("clientReady", async () => {
  log.info("Bot connecte : " + client.user.tag)
  log.info("Commandes chargees : " + loaded)
  log.info("==============================")

  try {
   log.info("Mise a jour des slash commands...")
   const deployMode = await deployCommands(client.commands)
   if (deployMode === "guild") {
    log.info("Slash commands synchronisees en mode guild (dev)")
   } else {
    log.info("Slash commands synchronisees en mode global (prod)")
   }
  } catch (error) {
   log.error("Erreur deploy commands", { err: error })
  }
  /* Piñata scheduler */
  startPinataScheduler(client, [DISCORD_AUTO_EVENT_CHANNEL_ID])

  /* Events des dieux scheduler */
  startEventScheduler(client, [DISCORD_AUTO_EVENT_CHANNEL_ID])
 })

 registerMessageCreateHandler(client)
 registerInteractionCreateHandler(client)
 registerReactionRolesHandler(client)

 setWebHooks({
  onWebMarketBuy: async ({ buyerId, listing }) => {
   if (!buyerId || !listing) return

   const cards = getCards()
   const card = cards.find((c) => String(c.id) === String(listing.card))
   const isFragment = String(listing.type || "card") === "fragment"
   const itemLabel = isFragment
    ? "fragment " + listing.fragmentNumber + "/5 de " + (card ? card.name : "carte #" + listing.card)
    : (card ? card.name : "carte #" + listing.card)
   const price = Number(listing.price || 0).toLocaleString("fr-FR")

   try {
    const user = await client.users.fetch(String(buyerId))
    await user.send(
     "Achat confirme sur le site: " + itemLabel + " pour " + price + " kamas.\nL'objet a ete ajoute a ton inventaire Krosmoz Card."
    )
   } catch (error) {
    log.warn("Impossible d'envoyer le DM achat", {
     buyerId: buyerId,
     err: error.message || String(error)
    })
   }
  }
 })

 await client.login(process.env.TOKEN)

 startWebServer()

 return client
}

module.exports = {
 bootstrap
}
