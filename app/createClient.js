const { Client, Collection, GatewayIntentBits } = require("discord.js")

function createClient() {
 return new Client({
  intents: [
   GatewayIntentBits.Guilds,
   GatewayIntentBits.GuildMessages,
   GatewayIntentBits.MessageContent,
   GatewayIntentBits.GuildMessageReactions, /* ← nécessaire pour détecter les réactions */
   GatewayIntentBits.GuildMembers           /* ← nécessaire pour fetch les membres et modifier les rôles */
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