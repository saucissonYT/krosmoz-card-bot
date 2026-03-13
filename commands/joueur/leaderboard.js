const {
 EmbedBuilder,
 ActionRowBuilder,
 ButtonBuilder,
 ButtonStyle
} = require("discord.js")

const users=require("../../database/users.json")
const cards=require("../../cards/cards.json")

const medals=["🥇","🥈","🥉","🏅","🏅","🏅","🏅","🏅","🏅","🏅"]

module.exports={

 name:"leaderboard",
 description:"Voir les classements",

 async execute(interaction){

  const collection=[]
  const wealth=[]
  const ssr=[]
  const packs=[]
  const achievements=[]
  const level=[]

  const ssrIds = cards.cards
   .filter(c=>c.rarity==="SSR")
   .map(c=>Number(c.id))

  for(const id in users){

   const user = users[id]

   let totalCards=0
   let ssrCount=0

   if(user.cards){

    for(const cid in user.cards){

     const count=user.cards[cid]

     totalCards+=count

     if(ssrIds.includes(Number(cid)))
      ssrCount+=count

    }

   }

   collection.push({id,value:totalCards})
   wealth.push({id,value:user.kamas||0})
   ssr.push({id,value:ssrCount})

   const packsOpened=user.stats?.packsOpened || 0
   packs.push({id,value:packsOpened})

   const achCount=user.achievements?.length || 0
   achievements.push({id,value:achCount})

   const lvl=user.progression?.level || 1
   level.push({id,value:lvl})

  }

  const rankings={
   collection,
   wealth,
   ssr,
   packs,
   achievements,
   level
  }

  for(const key in rankings)
   rankings[key].sort((a,b)=>b.value-a.value)

  let mode="collection"
  let page=1
  const perPage=10

  function build(){

   const data=rankings[mode]

   const start=(page-1)*perPage
   const slice=data.slice(start,start+perPage)

   const maxPage=Math.max(1,Math.ceil(data.length/perPage))

   const lines=slice.map((r,i)=>
    `${medals[i]||"•"} <@${r.id}> — **${r.value}**`
   )

   const playerIndex=data.findIndex(r=>r.id===interaction.user.id)

   let playerLine="Non classé"

   if(playerIndex!==-1){

    const rank=playerIndex+1
    const value=data[playerIndex].value

    playerLine=`#${rank} — ${value}`

   }

   const titles={
    collection:"📚 Collection",
    wealth:"💰 Richesse",
    ssr:"🌈 Cartes SSR",
    packs:"📦 Packs ouverts",
    achievements:"🏆 Succès",
    level:"⭐ Niveau"
   }

   const embed=new EmbedBuilder()

    .setTitle(`🏆 Leaderboard — ${titles[mode]}`)
    .setDescription(lines.join("\n") || "Aucun joueur")
    .addFields({
     name:"Ta position",
     value:playerLine
    })
    .setFooter({
     text:`Page ${page}/${maxPage}`
    })
    .setColor("#f1c40f")

   const row1=new ActionRowBuilder().addComponents(

    new ButtonBuilder()
     .setCustomId("collection")
     .setLabel("📚")
     .setStyle(ButtonStyle.Secondary),

    new ButtonBuilder()
     .setCustomId("wealth")
     .setLabel("💰")
     .setStyle(ButtonStyle.Secondary),

    new ButtonBuilder()
     .setCustomId("ssr")
     .setLabel("🌈")
     .setStyle(ButtonStyle.Secondary),

    new ButtonBuilder()
     .setCustomId("packs")
     .setLabel("📦")
     .setStyle(ButtonStyle.Secondary),

    new ButtonBuilder()
     .setCustomId("achievements")
     .setLabel("🏆")
     .setStyle(ButtonStyle.Secondary),

    new ButtonBuilder()
     .setCustomId("level")
     .setLabel("⭐")
     .setStyle(ButtonStyle.Secondary)

   )

   const row2=new ActionRowBuilder().addComponents(

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

   return {embed,components:[row1,row2],maxPage}

  }

  const {embed,components}=build()

  const msg=await interaction.reply({
   embeds:[embed],
   components,
   fetchReply:true
  })

  const collector=msg.createMessageComponentCollector({
   time:180000
  })

  collector.on("collect",async i=>{

   if(i.user.id!==interaction.user.id)
    return i.reply({content:"Pas ton menu.",ephemeral:true})

   if(["collection","wealth","ssr","packs","achievements","level"].includes(i.customId)){
    mode=i.customId
    page=1
   }

   if(i.customId==="next") page++
   if(i.customId==="prev") page--

   const {embed,components,maxPage}=build()

   page=Math.max(1,Math.min(page,maxPage))

   await i.update({
    embeds:[embed],
    components
   })

  })

 }

}