const { Client, Collection, GatewayIntentBits } = require("discord.js")

function createClient() {
 return new Client({
  intents: [
   GatewayIntentBits.Guilds,
   GatewayIntentBits.GuildMessages,
   GatewayIntentBits.MessageContent
  ]
 })
}

function attachClientState(client) {
 client.commands = new Collection()
 return client
}

module.exports = {
 createClient,
 attachClientState
}
