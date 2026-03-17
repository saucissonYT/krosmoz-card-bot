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
 getUserListings,
 removeListing
} = require("../../systems/market")

const { getCardsById } = require("../../systems/cardRegistry")
const { getUser } = require("../../systems/userSystem")

const cardsById = getCardsById()

const rarityEmoji={
 C:"⚪",U:"🟢",R:"🔵",SR:"🟣",
 HR:"🔴",UR:"🟡",S:"✨",SSR:"🌈"
}

const PAGE_SIZE=10
const SELL_PAGE_SIZE=4

const state={}

module.exports={

 name:"market",

 async execute(interaction){

  const userId=interaction.user.id

  state[userId]={
   page:0,
   sellPage:0
  }

  const embed=new EmbedBuilder()
   .setTitle("🛒 Marché")
   .setDescription(`Que veux-tu faire ?

🛍️ Acheter une carte  
💰 Vendre une carte  
📦 Voir mes ventes`)

  const row=new ActionRowBuilder().addComponents(

   new ButtonBuilder()
    .setCustomId("market_buy")
    .setLabel("Acheter")
    .setStyle(ButtonStyle.Success),

   new ButtonBuilder()
    .setCustomId("market_sell")
    .setLabel("Vendre")
    .setStyle(ButtonStyle.Primary),

   new ButtonBuilder()
    .setCustomId("market_my")
    .setLabel("Mes ventes")
    .setStyle(ButtonStyle.Secondary)

  )

  await interaction.reply({
   embeds:[embed],
   components:[row]
  })

 },

 async button(interaction){

  const userId=interaction.user.id
  const s=state[userId]

  if(!s)
   return interaction.reply({
    content:"❌ Menu expiré.",
    flags:64
   })

  /* ---------------- BUY MARKET ---------------- */

  if(interaction.customId==="market_buy"){
   s.page=0
   return this.renderMarket(interaction)
  }

  if(interaction.customId==="market_next"){
   s.page++
   return this.renderMarket(interaction)
  }

  if(interaction.customId==="market_prev"){
   if(s.page>0) s.page--
   return this.renderMarket(interaction)
  }

  if(interaction.customId.startsWith("market_buy_")){

   const listingId=parseInt(interaction.customId.split("_")[2])

   const result=buyCard(userId,listingId)

   if(result?.error)
    return interaction.reply({content:`❌ ${result.error}`,flags:64})

   return interaction.reply({
    content:"✅ Carte achetée.",
    flags:64
   })
  }

  /* ---------------- SELL MENU ---------------- */

  if(interaction.customId==="market_sell"){
   s.sellPage=0
   return this.renderSell(interaction)
  }

  if(interaction.customId==="sell_next"){
   s.sellPage++
   return this.renderSell(interaction)
  }

  if(interaction.customId==="sell_prev"){
   if(s.sellPage>0) s.sellPage--
   return this.renderSell(interaction)
  }

  if(interaction.customId.startsWith("sell_card_")){

   const cardId=interaction.customId.split("_")[2]

   const modal=new ModalBuilder()
    .setCustomId(`sellModal_${cardId}`)
    .setTitle("Prix de vente")

   const input=new TextInputBuilder()
    .setCustomId("price")
    .setLabel("Prix en kamas")
    .setStyle(TextInputStyle.Short)
    .setRequired(true)

   modal.addComponents(
    new ActionRowBuilder().addComponents(input)
   )

   return interaction.showModal(modal)
  }

  /* ---------------- MY LISTINGS ---------------- */

  if(interaction.customId==="market_my"){

   const listings=getUserListings(userId)

   if(!listings.length)
    return interaction.update({
     content:"Tu n'as aucune vente active.",
     embeds:[],
     components:[]
    })

   const embed=new EmbedBuilder()
    .setTitle("📦 Mes ventes")

   const rows=[]

   listings.slice(0,4).forEach(l=>{

    const card=cardsById[l.card]

    embed.addFields({
     name:`${rarityEmoji[card.rarity]} ${card.name}`,
     value:`${l.price} kamas`,
     inline:false
    })

    rows.push(
     new ActionRowBuilder().addComponents(
      new ButtonBuilder()
       .setCustomId(`remove_${l.id}`)
       .setLabel("Retirer")
       .setStyle(ButtonStyle.Danger)
     )
    )

   })

   rows.push(
    new ActionRowBuilder().addComponents(
     new ButtonBuilder()
      .setCustomId("market_back")
      .setLabel("Retour")
      .setStyle(ButtonStyle.Secondary)
    )
   )

   return interaction.update({
    embeds:[embed],
    components:rows
   })

  }

  if(interaction.customId.startsWith("remove_")){

   const listingId=parseInt(interaction.customId.split("_")[1])

   const result=removeListing(userId,listingId)

   if(result?.error)
    return interaction.reply({content:`❌ ${result.error}`,flags:64})

   return interaction.reply({
    content:"📦 Vente retirée.",
    flags:64
   })
  }

  if(interaction.customId==="market_back"){
   return this.execute(interaction)
  }

 },

 /* ---------------- MARKET VIEW ---------------- */

 async renderMarket(interaction){

  const userId=interaction.user.id
  const s=state[userId]

  const market=getMarket()

  const start=s.page*PAGE_SIZE
  const slice=market.slice(start,start+PAGE_SIZE)

  const embed=new EmbedBuilder()
   .setTitle("🛒 Marché")

  const rows=[]

  slice.forEach(l=>{

   const card=cardsById[l.card]

   embed.addFields({
    name:`${rarityEmoji[card.rarity]} ${card.name}`,
    value:`${l.price} kamas`,
    inline:false
   })

   rows.push(
    new ActionRowBuilder().addComponents(
     new ButtonBuilder()
      .setCustomId(`market_buy_${l.id}`)
      .setLabel("Acheter")
      .setStyle(ButtonStyle.Success)
    )
   )

  })

  rows.push(
   new ActionRowBuilder().addComponents(

    new ButtonBuilder()
     .setCustomId("market_prev")
     .setEmoji("⬅")
     .setStyle(ButtonStyle.Secondary),

    new ButtonBuilder()
     .setCustomId("market_next")
     .setEmoji("➡")
     .setStyle(ButtonStyle.Secondary),

    new ButtonBuilder()
     .setCustomId("market_back")
     .setLabel("Retour")
     .setStyle(ButtonStyle.Secondary)

   )
  )

  const payload={embeds:[embed],components:rows}

  if(interaction.isButton())
   return interaction.update(payload)

  return interaction.editReply(payload)

 },

 /* ---------------- SELL VIEW ---------------- */

 async renderSell(interaction){

  const userId=interaction.user.id
  const s=state[userId]

  const user=getUser(userId)

  const cards=Object.entries(user.cards||{})

  const start=s.sellPage*SELL_PAGE_SIZE
  const slice=cards.slice(start,start+SELL_PAGE_SIZE)

  const embed=new EmbedBuilder()
   .setTitle("💰 Choisis une carte à vendre")

  const rows=[]

  slice.forEach(([cardId,count])=>{

   const card=cardsById[cardId]

   embed.addFields({
    name:`${rarityEmoji[card.rarity]} ${card.name}`,
    value:`Quantité : ${count}`,
    inline:false
   })

   rows.push(
    new ActionRowBuilder().addComponents(
     new ButtonBuilder()
      .setCustomId(`sell_card_${cardId}`)
      .setLabel("Vendre")
      .setStyle(ButtonStyle.Success)
    )
   )

  })

  rows.push(
   new ActionRowBuilder().addComponents(

    new ButtonBuilder()
     .setCustomId("sell_prev")
     .setEmoji("⬅")
     .setStyle(ButtonStyle.Secondary),

    new ButtonBuilder()
     .setCustomId("sell_next")
     .setEmoji("➡")
     .setStyle(ButtonStyle.Secondary),

    new ButtonBuilder()
     .setCustomId("market_back")
     .setLabel("Retour")
     .setStyle(ButtonStyle.Secondary)

   )
  )

  const payload={embeds:[embed],components:rows}

  if(interaction.isButton())
   return interaction.update(payload)

  return interaction.editReply(payload)

 },

 /* ---------------- MODAL ---------------- */

 async modal(interaction){

  if(!interaction.customId.startsWith("sellModal_")) return

  const userId=interaction.user.id
  const cardId=interaction.customId.split("_")[1]

  const price=parseInt(
   interaction.fields.getTextInputValue("price")
  )

  const result=addListing(userId,cardId,price)

  if(result?.error)
   return interaction.reply({
    content:`❌ ${result.error}`,
    flags:64
   })

  return interaction.reply({
   content:"✅ Carte mise en vente.",
   flags:64
  })

 }

}