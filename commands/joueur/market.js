const {
 EmbedBuilder,
 ActionRowBuilder,
 ButtonBuilder,
 ButtonStyle,
 ModalBuilder,
 TextInputBuilder,
 TextInputStyle
} = require("discord.js")

const {
 getMarket,
 buyCard,
 addListing,
 removeListing,
 getUserListings,
 getAveragePrices
} = require("../../systems/market")

const { data } = require("../../systems/dataManager")
const cards = data.cards || []

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

 name:"market",
 description:"Marché des cartes",

 async execute(interaction){

  let market = getMarket()
  const averages = getAveragePrices()

  if(market.length===0)
   return interaction.reply("Le marché est vide.")

  let page=1
  const perPage=10

  function buildPage(page){

   const start=(page-1)*perPage
   const listings=market.slice(start,start+perPage)

   const lines=listings.map(l=>{

    const card=cards.find(c=>c.id==l.card)

    if(!card)
     return `ID:${l.id} • Carte supprimée • ${l.price}`

    const emoji=rarityEmoji[card.rarity]||""

    const avg = averages[l.card]
     ? ` • 📊 ${averages[l.card]}`
     : ""

    return `ID:${l.id} • ${emoji} ${card.name} • ${l.price} kamas${avg}`

   })

   const maxPage=Math.ceil(market.length/perPage)

   const embed=new EmbedBuilder()
    .setTitle("🛒 Marché")
    .setDescription(lines.join("\n"))
    .setFooter({text:`Page ${page}/${maxPage}`})

   const row=new ActionRowBuilder().addComponents(

    new ButtonBuilder()
     .setCustomId("prev")
     .setLabel("⬅️")
     .setStyle(ButtonStyle.Secondary)
     .setDisabled(page===1),

    new ButtonBuilder()
     .setCustomId("buy")
     .setLabel("Acheter")
     .setStyle(ButtonStyle.Success),

    new ButtonBuilder()
     .setCustomId("next")
     .setLabel("➡️")
     .setStyle(ButtonStyle.Secondary)
     .setDisabled(page===maxPage)

   )

   return {embed,row,maxPage}
  }

  const {embed,row}=buildPage(page)

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
    return i.reply({content:"Ce n'est pas ton menu.",ephemeral:true})

   if(i.customId==="next") page++
   if(i.customId==="prev") page--

   const {embed,row,maxPage}=buildPage(page)

   page=Math.max(1,Math.min(page,maxPage))

   await i.update({
    embeds:[embed],
    components:[row]
   })

  })

 }

}