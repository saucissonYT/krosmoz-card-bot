const {
 EmbedBuilder,
 ActionRowBuilder,
 ButtonBuilder,
 ButtonStyle
} = require("discord.js")

const achievements = require("../../systems/achievementRegistry")
const { getUser } = require("../../systems/userSystem")
const { getAchievementReward, formatRewardCompact } = require("../../systems/achievementRewards")

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

  /* Calculer les totaux de récompenses restantes */
  let totalKamasRemaining = 0
  let totalXpRemaining = 0
  let totalPacksRemaining = 0

  for(const [id,data] of list){
   if(!user.achievements?.includes(id)){
    const r = getAchievementReward(id, data)
    totalKamasRemaining += r.kamas
    totalXpRemaining += r.xp
    totalPacksRemaining += r.packs
   }
  }

  function build(){

   const maxPage=Math.max(1,Math.ceil(list.length/perPage))

   const start=(page-1)*perPage
   const slice=list.slice(start,start+perPage)

   const lines=slice.map(([id,data])=>{

    const unlocked=user.achievements?.includes(id)

    if(data.secret && !unlocked)
     return `🔒 **Succès secret**`

    const title=data.title ? ` • 👑 ${data.title}` : ""

    const reward = getAchievementReward(id, data)
    const rewardStr = formatRewardCompact(reward)

    const status = unlocked ? "✔" : "🔒"
    const rewardLine = unlocked ? ` ✅` : ` → ${rewardStr}`

    return `${status} ${data.badge} **${data.name}**${title}\n　${rewardLine}`

   })

   const embed=new EmbedBuilder()
    .setTitle("🏆 Succès")
    .setDescription(lines.join("\n") || "Aucun succès.")
    .addFields(
     {
      name:"Progression",
      value:`${unlockedCount}/${total} succès débloqués`,
      inline:true
     },
     {
      name:"🎁 Récompenses restantes",
      value:`💰 ${totalKamasRemaining.toLocaleString("fr-FR")} • ⭐ ${totalXpRemaining.toLocaleString("fr-FR")} • 📦 ${totalPacksRemaining}`,
      inline:false
     }
    )
    .setFooter({
     text:`Page ${page}/${maxPage} • Kamas gagnés via succès : ${(user.stats?.achievementKamasEarned||0).toLocaleString("fr-FR")}`
    })
    .setColor("#f1c40f")

   const row=new ActionRowBuilder().addComponents(

    new ButtonBuilder()
     .setCustomId("ach_prev")
     .setLabel("⬅️")
     .setStyle(ButtonStyle.Primary)
     .setDisabled(page<=1),

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