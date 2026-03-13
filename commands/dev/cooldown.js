const devData = require("../../database/devs.json")

let cooldownDisabled = false

function isDev(id){

 return (
  devData.owners.includes(id) ||
  devData.devs.includes(id)
 )

}

module.exports = {

 name:"cooldown",
 description:"Activer ou désactiver le cooldown global",

 options:[
  {
   name:"mode",
   description:"Mode",
   type:3,
   required:true,
   choices:[
    {name:"off (désactiver cooldown)",value:"off"},
    {name:"on (activer cooldown)",value:"on"},
    {name:"status",value:"status"}
   ]
  }
 ],

 async execute(interaction){

  if(!isDev(interaction.user.id))
   return interaction.reply({
    content:"Commande dev.",
    ephemeral:true
   })

  const mode = interaction.options.getString("mode")

  if(mode === "off"){

   cooldownDisabled = true

   return interaction.reply(
    "🟢 Cooldown **désactivé** pour tout le monde."
   )

  }

  if(mode === "on"){

   cooldownDisabled = false

   return interaction.reply(
    "🔴 Cooldown **réactivé**."
   )

  }

  if(mode === "status"){

   return interaction.reply(
    `⚙️ Cooldown : ${cooldownDisabled ? "OFF" : "ON"}`
   )

  }

 }

}

module.exports.cooldownDisabled = () => cooldownDisabled