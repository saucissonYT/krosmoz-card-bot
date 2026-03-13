const {
 EmbedBuilder,
 ActionRowBuilder,
 ButtonBuilder,
 ButtonStyle
} = require("discord.js")

const cardsData = require("../../cards/cards.json")
const cards = Array.isArray(cardsData) ? cardsData : cardsData.cards

const setsData = require("../../cards/sets.json")
const sets = Array.isArray(setsData) ? setsData : setsData.sets

const { playerSetProgress } = require("../../systems/setSystem")
const { getUser } = require("../../systems/userSystem")

const rarityEmoji={
 C:"⚪",
 U:"🟢",
 R:"🔵",
 SR:"🟣",
 HR:"🔴",
 UR:"🟡",
 S:"✨",
 SSR:"🌈"
}

const rarityOrder={
 C:1,U:2,R:3,SR:4,HR:5,UR:6,S:7,SSR:8
}

module.exports={

 name:"set",
 description:"Voir un set",

 options:[
  {
   name:"nom",
   description:"Nom du set",
   type:3,
   required:true
  }
 ],

 async execute(interaction){

  const user = getUser(interaction.user.id)

  const setId = interaction.options.getString("nom")

  const setData = sets.find(s=>s.id===setId)

  if(!setData)
   return interaction.reply("Set introuvable.")

  const setCards = cards
   .filter(c=>c.set===setId)
   .sort((a,b)=>rarityOrder[a.rarity]-rarityOrder[b.rarity])

  if(setCards.length===0)
   return interaction.reply("Aucune carte dans ce set.")

  const ownedIds = new Set(Object.keys(user.cards || {}).map(Number))

  const progress = playerSetProgress(user,setId)

  const perPage = 20
  let page = 1

  const totalPages = Math.ceil(setCards.length/perPage)

  function build(page){

   const start=(page-1)*perPage
   const pageCards=setCards.slice(start,start+perPage)

   const lines = pageCards.map(card=>{

    const owned = ownedIds.has(Number(card.id))

    const icon = owned ? "✅" : "▫️"
    const emoji = rarityEmoji[card.rarity] || ""

    return `${icon} ${emoji} ${card.name}`

   })

   const percent = Math.floor((progress.owned/progress.total)*100)

   const progressBarLength = 10
   const filled = Math.round((percent/100)*progressBarLength)

   const progressBar =
    "🟩".repeat(filled) +
    "⬛".repeat(progressBarLength-filled)

   const embed=new EmbedBuilder()
    .setTitle(`📦 Set : ${setData.name}`)
    .setDescription(lines.join("\n"))
    .addFields({
     name:"Progression",
     value:`${progressBar}\n${progress.owned}/${progress.total} (${percent}%)`
    })
    .setFooter({
     text:`Page ${page}/${totalPages}`
    })

   const row=new ActionRowBuilder().addComponents(

    new ButtonBuilder()
     .setCustomId("prev")
     .setLabel("⬅️")
     .setStyle(ButtonStyle.Secondary)
     .setDisabled(page===1),

    new ButtonBuilder()
     .setCustomId("next")
     .setLabel("➡️")
     .setStyle(ButtonStyle.Secondary)
     .setDisabled(page===totalPages)

   )

   return {embed,row}

  }

  const {embed,row}=build(page)

  const msg=await interaction.reply({
   embeds:[embed],
   components:[row],
   fetchReply:true
  })

  const collector=msg.createMessageComponentCollector({
   time:120000
  })

  collector.on("collect",async i=>{

   if(i.user.id!==interaction.user.id)
    return i.reply({
     content:"Pas ton menu.",
     ephemeral:true
    })

   if(i.customId==="next") page++
   if(i.customId==="prev") page--

   page=Math.max(1,Math.min(page,totalPages))

   const {embed,row}=build(page)

   await i.update({
    embeds:[embed],
    components:[row]
   })

  })

 }

}