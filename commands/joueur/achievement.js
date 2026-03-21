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

  await interaction.deferReply()

  const user=getUser(interaction.user.id)

  const list=Object.entries(achievements)

  let page=1
  const perPage=8

  const unlockedCount=user.achievements?.length || 0
  const total=list.length

  function build(){

   const maxPage=Math.max(1,Math.ceil(list.length/perPage))

   const start=(page-1)*perPage
   const slice=list.slice(start,start+perPage)

   const lines=slice.map(([id,data])=>{

    const unlocked=user.achievements?.includes(id)

    if(data.secret && !unlocked)
     return `🔒 **Succès secret**`

    const title=data.title ? ` • 👑 ${data.title}` : ""

    const status = unlocked ? "✅" : "🔒"

    return `${status} ${data.badge} **${data.name}**${title}\n　${data.description || ""}`

   })

   const embed=new EmbedBuilder()
    .setTitle("🏆 Succès")
    .setDescription(lines.join("\n\n") || "Aucun succès.")
    .setFooter({
     text:`Page ${page}/${maxPage} • ${unlockedCount}/${total} succès débloqués`
    })
    .setColor("#f1c40f")

   const row=new ActionRowBuilder().addComponents(

    new ButtonBuilder()
     .setCustomId("ach_prev")
     .setLabel("⬅️")
     .setStyle(ButtonStyle.Primary)
     .setDisabled(page<=1),

    new ButtonBuilder()
     .setCustomId("ach_page")
     .setLabel(`${page}/${maxPage}`)
     .setStyle(ButtonStyle.Secondary)
     .setDisabled(true),

    new ButtonBuilder()
     .setCustomId("ach_next")
     .setLabel("➡️")
     .setStyle(ButtonStyle.Primary)
     .setDisabled(page>=maxPage)

   )

   return {embed,row,maxPage}

  }

  const {embed,row}=build()

  await interaction.editReply({
   embeds:[embed],
   components:[row]
  })

  const msg = await interaction.fetchReply()

  const collector=msg.createMessageComponentCollector({
   time:180000
  })

  collector.on("collect",async i=>{

   if(i.user.id!==interaction.user.id)
    return i.reply({content:"Pas ton menu.",flags:64})

   if(i.customId==="ach_next") page++
   if(i.customId==="ach_prev") page--

   const {embed,row,maxPage}=build()

   page=Math.max(1,Math.min(page,maxPage))

   await i.update({
    embeds:[embed],
    components:[row]
   })

  })

 }

}