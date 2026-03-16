const {
 SlashCommandBuilder,
 EmbedBuilder,
 ActionRowBuilder,
 ButtonBuilder,
 ButtonStyle
} = require("discord.js")

const achievements = require("../../systems/achievementRegistry")
const { getUser } = require("../../systems/userSystem")

module.exports={

 data:new SlashCommandBuilder()
  .setName("checkachievement")
  .setDescription("DEV : vérifier les achievements"),

 async execute(interaction){

  const user=getUser(interaction.user.id)

  const list=Object.entries(achievements)

  let index=0

  function debugAchievement(id,data){

   console.log("━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
   console.log("CHECK ACHIEVEMENT :",id)

   console.log("Nom :",data.name)
   console.log("Titre :",data.title || "none")
   console.log("Secret :",data.secret || false)
   console.log("Trigger :",data.trigger || "none")

   const already=user.achievements?.includes(id)

   console.log("Déjà possédé :",already)

   try{

    if(typeof data.condition!=="function"){
     console.log("❌ CONDITION INVALID")
     return "error"
    }

    const result=data.condition(user)

    console.log("Condition result :",result)

    if(result && !already){
     console.log("✅ ACHIEVEMENT DISPONIBLE")
     return "available"
    }

    if(result && already){
     console.log("ℹ️ Déjà débloqué")
     return "owned"
    }

    if(!result){

     console.log("❌ CONDITION NON REMPLIE")

     console.log("USER STATS :",JSON.stringify(user.stats,null,2))
     console.log("USER KAMAS :",user.kamas)

     const totalCards=Object.values(user.cards||{})
      .reduce((a,b)=>a+b,0)

     console.log("TOTAL CARTES :",totalCards)

    }

    return "locked"

   }catch(err){

    console.error("⚠️ ERREUR CONDITION :",err)
    return "error"

   }

  }

  function build(){

   const [id,data]=list[index]

   const result=debugAchievement(id,data)

   const status=
    result==="available" ? "🟢 Débloquable"
    : result==="owned" ? "🔵 Déjà obtenu"
    : result==="error" ? "⚠️ Erreur"
    : "🔴 Non disponible"

   const embed=new EmbedBuilder()
    .setTitle("🔎 Debug Achievement")

    .setDescription(
`ID : **${id}**

${data.badge} **${data.name}**

👑 Titre : ${data.title || "aucun"}

🎯 Trigger : ${data.trigger || "none"}

🔒 Secret : ${data.secret ? "oui" : "non"}

📊 Statut : ${status}`
    )

    .setFooter({
     text:`${index+1}/${list.length}`
    })

   const row=new ActionRowBuilder().addComponents(

    new ButtonBuilder()
     .setCustomId("prev")
     .setLabel("⬅️")
     .setStyle(ButtonStyle.Secondary)
     .setDisabled(index===0),

    new ButtonBuilder()
     .setCustomId("next")
     .setLabel("➡️")
     .setStyle(ButtonStyle.Secondary)
     .setDisabled(index===list.length-1)

   )

   return {embed,row}

  }

  const {embed,row}=build()

  const msg=await interaction.reply({
   embeds:[embed],
   components:[row],
   fetchReply:true
  })

  const collector=msg.createMessageComponentCollector({
   time:600000
  })

  collector.on("collect",async i=>{

   if(i.user.id!==interaction.user.id)
    return i.reply({content:"Pas ton menu.",ephemeral:true})

   if(i.customId==="next") index++
   if(i.customId==="prev") index--

   index=Math.max(0,Math.min(index,list.length-1))

   const {embed,row}=build()

   await i.update({
    embeds:[embed],
    components:[row]
   })

  })

 }

}