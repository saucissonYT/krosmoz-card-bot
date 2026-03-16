const { SlashCommandBuilder } = require("discord.js")

const achievements = require("../../systems/achievementRegistry")
const { getUser } = require("../../systems/userSystem")

module.exports = {

 data:new SlashCommandBuilder()
  .setName("checkachievement")
  .setDescription("DEV : audit complet des achievements"),

 async execute(interaction){

  const user=getUser(interaction.user.id)

  console.log("===================================")
  console.log("ACHIEVEMENT SYSTEM AUDIT")
  console.log("User :",interaction.user.username)
  console.log("===================================")

  let available=0
  let owned=0
  let locked=0
  let errors=0

  for(const [id,data] of Object.entries(achievements)){

   console.log("────────────────────────────")
   console.log("ID :",id)
   console.log("Nom :",data.name)
   console.log("Trigger :",data.trigger || "none")

   const already=user.achievements?.includes(id)

   try{

    if(typeof data.condition!=="function"){

     console.log("⚠️ CONDITION INVALID")
     errors++
     continue

    }

    const result=data.condition(user)

    if(result && !already){

     console.log("🟢 POSSIBLE A DEBLOQUER")
     available++

    }

    else if(result && already){

     console.log("🔵 DEJA OBTENU")
     owned++

    }

    else{

     console.log("🔴 NON DISPONIBLE")

     console.log("Stats user :",JSON.stringify(user.stats,null,2))
     console.log("Kamas :",user.kamas)

     const totalCards=Object.values(user.cards||{})
      .reduce((a,b)=>a+b,0)

     console.log("Cartes :",totalCards)

     locked++

    }

   }catch(err){

    console.log("💥 ERREUR CONDITION")
    console.error(err)

    errors++

   }

  }

  console.log("===================================")
  console.log("AUDIT RESULTATS")
  console.log("Disponibles :",available)
  console.log("Déjà obtenus :",owned)
  console.log("Bloqués :",locked)
  console.log("Erreurs :",errors)
  console.log("Total :",Object.keys(achievements).length)
  console.log("===================================")

  await interaction.reply({
   content:"✅ Audit des achievements envoyé dans la console.",
   ephemeral:true
  })

 }

}