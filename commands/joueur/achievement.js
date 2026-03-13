const {
 EmbedBuilder,
 ActionRowBuilder,
 ButtonBuilder,
 ButtonStyle
} = require("discord.js")

const { achievements } = require("../../systems/achievementSystem")
const { getUser } = require("../../systems/userSystem")

module.exports={

 name:"achievements",
 description:"Voir les succès",

 async execute(interaction){

  const user=getUser(interaction.user.id)

  const list=Object.entries(achievements)

  let page=1
  const perPage=8

  function build(){

   const start=(page-1)*perPage
   const slice=list.slice(start,start+perPage)

   const maxPage=Math.ceil(list.length/perPage)

   const lines=slice.map(([id,data])=>{

    const unlocked=user.achievements?.includes(id)

    return `${unlocked?"✔":"🔒"} ${data.badge} **${data.name}**`

   })

   const embed=new EmbedBuilder()

    .setTitle("🏆 Succès")

    .setDescription(lines.join("\n"))

    .setFooter({
     text:`Page ${page}/${maxPage}`
    })

    .setColor("#f1c40f")

   const row=new ActionRowBuilder().addComponents(

    new ButtonBuilder()
     .setCustomId("prev")
     .setLabel("⬅️")
     .setStyle(ButtonStyle.Primary)
     .setDisabled(page===1),

    new ButtonBuilder()
     .setCustomId("next")
     .setLabel("➡️")
     .setStyle(ButtonStyle.Primary)
     .setDisabled(page===maxPage)

   )

   return {embed,row,maxPage}

  }

  const {embed,row}=build()

  const msg=await interaction.reply({
   embeds:[embed],
   components:[row],
   fetchReply:true
  })

  const collector=msg.createMessageComponentCollector({
   time:180000
  })

  collector.on("collect",async i=>{

   if(i.user.id!==interaction.user.id)
    return i.reply({content:"Pas ton menu.",ephemeral:true})

   if(i.customId==="next") page++
   if(i.customId==="prev") page--

   const {embed,row,maxPage}=build()

   page=Math.max(1,Math.min(page,maxPage))

   await i.update({
    embeds:[embed],
    components:[row]
   })

  })

 }

}