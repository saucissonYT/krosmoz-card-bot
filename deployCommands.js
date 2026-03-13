require("dotenv").config()

const { REST, Routes, SlashCommandBuilder } = require("discord.js")
const fs = require("fs")

const TOKEN = process.env.TOKEN
const CLIENT_ID = process.env.CLIENT_ID
const DEV_GUILD_ID = process.env.DEV_GUILD_ID

const globalCommands = []
const guildCommands = []

const names = new Set()

console.log("Chargement des commandes...\n")

/* ---------- READ COMMAND FOLDERS ---------- */

const commandFolders = fs.readdirSync("./commands")

for (const folder of commandFolders){

 const commandFiles = fs
  .readdirSync(`./commands/${folder}`)
  .filter(f => f.endsWith(".js"))

 for(const file of commandFiles){

  try{

   const command = require(`./commands/${folder}/${file}`)

   /* ---------- SUPPORT SlashCommandBuilder ---------- */

   if(command.data){

    const name = command.data.name

    if(names.has(name)){
     console.log(`❌ DUPLICATE COMMAND : ${name}`)
     process.exit()
    }

    names.add(name)

    if(folder === "joueur")
     globalCommands.push(command.data.toJSON())
    else
     guildCommands.push(command.data.toJSON())

    console.log(`✅ ${name}`)

    continue
   }

   /* ---------- ANCIEN FORMAT ---------- */

   if(!command.name){
    console.log(`❌ ${file} : name manquant`)
    continue
   }

   if(names.has(command.name)){
    console.log(`❌ DUPLICATE COMMAND : ${command.name}`)
    process.exit()
   }

   names.add(command.name)

   const slash = new SlashCommandBuilder()
    .setName(command.name)
    .setDescription(command.description || "Commande")

   if(command.options){

    const sorted = command.options.sort((a,b)=>{
     return (b.required === true) - (a.required === true)
    })

    for(const option of sorted){

     /* ---------- SUBCOMMAND ---------- */

     if(option.type === 1){

      slash.addSubcommand(sub =>
       sub
        .setName(option.name)
        .setDescription(option.description || "subcommand")
      )

     }

     /* ---------- SUBCOMMAND GROUP ---------- */

     else if(option.type === 2){

      slash.addSubcommandGroup(group => {

       group
        .setName(option.name)
        .setDescription(option.description || "group")

       for(const sub of option.options){

        group.addSubcommand(s =>
         s.setName(sub.name)
          .setDescription(sub.description || "subcommand")
        )

       }

       return group

      })

     }

     /* ---------- STRING ---------- */

     else if(option.type === 3){

      slash.addStringOption(o=>{

       o.setName(option.name)
        .setDescription(option.description || "texte")
        .setRequired(option.required || false)

       if(option.choices)
        o.addChoices(...option.choices)

       return o

      })

     }

     /* ---------- INTEGER ---------- */

     else if(option.type === 4){

      slash.addIntegerOption(o=>
       o.setName(option.name)
        .setDescription(option.description || "nombre")
        .setRequired(option.required || false)
      )

     }

     /* ---------- BOOLEAN ---------- */

     else if(option.type === 5){

      slash.addBooleanOption(o=>
       o.setName(option.name)
        .setDescription(option.description || "true/false")
        .setRequired(option.required || false)
      )

     }

     /* ---------- USER ---------- */

     else if(option.type === 6){

      slash.addUserOption(o=>
       o.setName(option.name)
        .setDescription(option.description || "utilisateur")
        .setRequired(option.required || false)
      )

     }

     /* ---------- ATTACHMENT ---------- */

     else if(option.type === 11){

      slash.addAttachmentOption(o=>
       o.setName(option.name)
        .setDescription(option.description || "fichier")
        .setRequired(option.required || false)
      )

     }

    }

   }

   /* ---------- CLASSIFICATION ---------- */

   if(folder === "joueur")
    globalCommands.push(slash.toJSON())
   else
    guildCommands.push(slash.toJSON())

   console.log(`✅ ${command.name}`)

  }
  catch(err){

   console.log(`❌ ERREUR ${file}`)
   console.log(err)

  }

 }

}

/* ---------- DEPLOY ---------- */

const rest = new REST({version:"10"}).setToken(TOKEN)

async function deploy(){

 try{

  console.log(`\nDéploiement commandes joueurs : ${globalCommands.length}`)

  await rest.put(
   Routes.applicationCommands(CLIENT_ID),
   {body:globalCommands}
  )

  console.log("✅ Commandes joueurs installées")

  console.log(`\nDéploiement commandes dev/admin : ${guildCommands.length}`)

  await rest.put(
   Routes.applicationGuildCommands(CLIENT_ID, DEV_GUILD_ID),
   {body:guildCommands}
  )

  console.log("✅ Commandes dev/admin installées sur serveur dev")

 }
 catch(err){

  console.log("❌ ERREUR DEPLOY")
  console.log(err)

 }

}

deploy()