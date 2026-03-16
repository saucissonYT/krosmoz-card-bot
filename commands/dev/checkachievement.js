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
   console.log("Titre :",data.title)
   console.log("Secret :",data.secret || false)

   try{

    const result=data.condition(user)

    console.log("Condition result :",result)

    if(!result){

     console.log("USER STATS :",JSON.stringify(user.stats,null,2))
     console.log("USER KAMAS :",user.kamas)

     const totalCards=Object.values(user.cards||{})
      .reduce((a,b)=>a+b,0)

     console.log("TOTAL CARTES :",totalCards)

    }

    return result

   }catch(err){

    console.error("ERREUR CONDITION :",err)
    return "error"

   }

  }

  function build(){

   const [id,data]=list[index]

   const result=debugAchievement(id,data)

   const status=
    result===true ? "✅ Disponible"
    : result==="error" ? "⚠️ Erreur"
    : "❌ Non disponible"

   const embed=new EmbedBuilder()
    .setTitle("🔎 Test Achievement")
    .setDescription(
`ID : **${id}**

${data.badge} **${data.name}**

👑 Titre : ${data.title || "aucun"}

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