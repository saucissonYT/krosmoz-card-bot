const {
 EmbedBuilder,
 ActionRowBuilder,
 ButtonBuilder,
 ButtonStyle
} = require("discord.js")

const achievements = require("../../systems/achievementRegistry")
const { getUser } = require("../../systems/userSystem")

module.exports={

 name:"achievements",
 description:"Voir les succès",

 async execute(interaction){

  const user=getUser(interaction.user.id)

  const list=Object.entries(achievements)

  let page=1
  const perPage=8
  const maxPage=Math.max(1,Math.ceil(list.length/perPage))

  const unlockedCount=user.achievements?.length || 0
  const total=list.length

  function build(){

   const start=(page-1)*perPage
   const slice=list.slice(start,start+perPage)

   const lines=slice.map(([id,data])=>{

    const unlocked=user.achievements?.includes(id)

    if(data.secret && !unlocked)
     return `🔒 **Succès secret**`

    const title=data.title ? ` • 👑 ${data.title}` : ""

    return `${unlocked?"✔":"🔒"} ${data.badge} **${data.name}**${title}`

   })

   const embed=new EmbedBuilder()
    .setTitle("🏆 Succès")
    .setDescription(lines.join("\n") || "Aucun succès.")
    .addFields({
     name:"Progression",
     value:`${unlockedCount}/${total} succès débloqués`,
     inline:false
    })
    .setFooter({
     text:`Page ${page}/${maxPage}`
    })
    .setColor("#f1c40f")

   const row=new ActionRowBuilder().addComponents(

    new ButtonBuilder()
     .setCustomId("prev")
     .setLabel("⬅️")
     .setStyle(ButtonStyle.Primary)
     .setDisabled(page<=1),

    new ButtonBuilder()
     .setCustomId("next")
     .setLabel("➡️")
     .setStyle(ButtonStyle.Primary)
     .setDisabled(page>=maxPage)

   )

   return {embed,row}

  }

  const {embed,row}=build()

  const msg=await interaction.reply({
   embeds:[embed],
   components:[row],
   withResponse:true
  })

  const collector=msg.createMessageComponentCollector({
   time:180000
  })

  collector.on("collect",async i=>{

   if(i.user.id!==interaction.user.id)
    return i.reply({content:"Pas ton menu.",flags:64})

   if(i.customId==="next") page++
   if(i.customId==="prev") page--

   page=Math.max(1,Math.min(page,maxPage))

   const {embed,row}=build()

   await i.update({
    embeds:[embed],
    components:[row]
   })

  })

 }

}