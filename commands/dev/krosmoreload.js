const { SlashCommandBuilder } = require("discord.js")
const fs = require("fs")
const path = require("path")

module.exports = {

 data: new SlashCommandBuilder()
  .setName("krosmoreload")
  .setDescription("Recharger toutes les commandes et systèmes du bot"),

 async execute(interaction){

  console.log("♻️ KROSMOZ GLOBAL RELOAD")

  let systemsReloaded = 0
  let commandsReloaded = 0

  /* ---------------- RELOAD SYSTEMS ---------------- */

  const systemsPath = path.join(__dirname,"../../systems")
  const systemFiles = fs.readdirSync(systemsPath).filter(f=>f.endsWith(".js"))

  for(const file of systemFiles){

   const filePath = path.join(systemsPath,file)

   try{

    delete require.cache[require.resolve(filePath)]

    require(filePath)

    console.log("🔧 System reload :",file)

    systemsReloaded++

   }catch(err){

    console.error("❌ System reload error :",file)
    console.error(err)

   }

  }

  /* ---------------- RESET COMMAND CACHE ---------------- */

  interaction.client.commands.clear()

  /* ---------------- RELOAD COMMANDS ---------------- */

  const commandsPath = path.join(__dirname,"..")

  const commandFolders = fs.readdirSync(commandsPath)

  for(const folder of commandFolders){

   const folderPath = path.join(commandsPath,folder)

   if(!fs.lstatSync(folderPath).isDirectory()) continue

   const commandFiles = fs.readdirSync(folderPath).filter(file => file.endsWith(".js"))

   for(const file of commandFiles){

    const filePath = path.join(folderPath,file)

    try{

     delete require.cache[require.resolve(filePath)]

     const command = require(filePath)

     if(!command.data) continue

     interaction.client.commands.set(command.data.name,command)

     console.log(`📜 Command reload : ${command.data.name}`)

     commandsReloaded++

    }catch(err){

     console.error("❌ Command reload error :",file)
     console.error(err)

    }

   }

  }

  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
  console.log(`🔧 Systems rechargés : ${systemsReloaded}`)
  console.log(`📜 Commandes rechargées : ${commandsReloaded}`)
  console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")

  await interaction.reply({
   content:
`♻️ **Reload terminé**

🔧 Systems rechargés : **${systemsReloaded}**
📜 Commandes rechargées : **${commandsReloaded}**`,
   ephemeral:true
  })

 }

}