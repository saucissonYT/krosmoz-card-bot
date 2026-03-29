const fs = require("fs")
const path = require("path")
const { SlashCommandBuilder } = require("discord.js")

function loadCommands(client, commandsPath) {
 const commandFolders = fs.readdirSync(commandsPath)
 let loaded = 0
 const requestedCacheClear = process.env.CLEAR_COMMAND_CACHE === "true"
 const shouldClearCache = process.env.CLEAR_COMMAND_CACHE === "true" && process.env.NODE_ENV !== "production"

 if (requestedCacheClear && !shouldClearCache) {
  console.warn("[loadCommands] CLEAR_COMMAND_CACHE ignore en production")
 }

 console.log("\n==============================")
 console.log("   SCAN DES COMMANDES")
 console.log("==============================\n")

 for (const folder of commandFolders) {
  console.log(`[${folder.toUpperCase()}]`)

  const folderPath = path.join(commandsPath, folder)
  const commandFiles = fs.readdirSync(folderPath).filter((file) => file.endsWith(".js"))

  for (const file of commandFiles) {
   const filePath = path.join(folderPath, file)

   try {
    if (shouldClearCache) {
     delete require.cache[require.resolve(filePath)]
    }

    const command = require(filePath)

    if (command.data) {
     command._folder = folder
     client.commands.set(command.data.name, command)
     console.log(`OK ${command.data.name}`)
     loaded++
     continue
    }

    if (command.name && command.execute) {
     const builder = new SlashCommandBuilder()
      .setName(command.name)
      .setDescription(command.description || "commande")

     command.data = builder
     command._folder = folder
     client.commands.set(command.name, command)
     console.log(`-> ${command.name}`)
     loaded++
     continue
    }

    console.log(`KO ${file}`)
   } catch (err) {
    console.log(`ERR ${file}`)
    console.error(err)
   }
  }

  console.log("")
 }

 console.log("==============================")
 return loaded
}

module.exports = {
 loadCommands
}
