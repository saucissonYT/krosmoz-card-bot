const { REST, Routes } = require("discord.js")

async function deployCommands(commands) {
 const slashPayload = []

 for (const command of commands.values()) {
  slashPayload.push(command.data.toJSON())
 }

 const rest = new REST({ version: "10" }).setToken(process.env.TOKEN)
 const guildId = process.env.GUILD_ID

 if (guildId) {
  await rest.put(
   Routes.applicationGuildCommands(process.env.CLIENT_ID, guildId),
   { body: slashPayload }
  )
  return "guild"
 }

 await rest.put(
  Routes.applicationCommands(process.env.CLIENT_ID),
  { body: slashPayload }
 )
 return "global"
}

module.exports = {
 deployCommands
}
