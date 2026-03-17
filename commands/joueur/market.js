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
 getAveragePrices,
 getUserListings,
 removeListing
} = require("../../systems/market")

const { getCards } = require("../../systems/cardRegistry")
const cards = getCards()

const marketState = {}

const rarityEmoji = {
 C:"⚪",U:"🟢",R:"🔵",SR:"🟣",
 HR:"🔴",UR:"🟡",S:"✨",SSR:"🌈"
}

const rarityOrder = {
 SSR:8,S:7,UR:6,HR:5,SR:4,R:3,U:2,C:1
}

const rarities=["C","U","R","SR","HR","UR","S","SSR"]

const PAGE_SIZE = 10

module.exports = {

 name:"market",

 async execute(interaction){

  const userId = interaction.user.id

  marketState[userId] = {
   page:0,
   sort:"price",
   rarity:null,
   name:null
  }

  const embed = new EmbedBuilder()
   .setTitle("🛒 Marché")
   .setDescription(`Que veux-tu faire ?

🛍️ **Acheter une carte**
📦 **Voir mes ventes**
💰 **Vendre une carte**`)

  const row = new ActionRowBuilder().addComponents(

   new ButtonBuilder()
    .setCustomId("market_buy")
    .setLabel("Acheter")
    .setStyle(ButtonStyle.Success),

   new ButtonBuilder()
    .setCustomId("market_my")
    .setLabel("Mes ventes")
    .setStyle(ButtonStyle.Primary),

   new ButtonBuilder()
    .setCustomId("market_sell")
    .setLabel("Vendre")
    .setStyle(ButtonStyle.Danger)

  )

  await interaction.reply({
   embeds:[embed],
   components:[row]
  })

 },

 async button(interaction){

  const userId = interaction.user.id

  if(!marketState[userId])
   return interaction.reply({
    content:"❌ Ce menu ne t'appartient pas.",
    flags:64
   })

  const state = marketState[userId]

  if(interaction.customId === "market_buy"){
   state.page = 0
   return this.renderMarket(interaction)
  }

  if(interaction.customId === "market_sell"){

   const modal = new ModalBuilder()
    .setCustomId("marketSellModal")
    .setTitle("Vendre une carte")

   const cardInput = new TextInputBuilder()
    .setCustomId("cardId")
    .setLabel("ID de la carte (visible dans /inventaire)")
    .setStyle(TextInputStyle.Short)
    .setRequired(true)

   const priceInput = new TextInputBuilder()
    .setCustomId("price")
    .setLabel("Prix en kamas")
    .setStyle(TextInputStyle.Short)
    .setRequired(true)

   modal.addComponents(
    new ActionRowBuilder().addComponents(cardInput),
    new ActionRowBuilder().addComponents(priceInput)
   )

   return interaction.showModal(modal)
  }

  if(interaction.customId === "market_next"){
   state.page++
   return this.renderMarket(interaction)
  }

  if(interaction.customId === "market_prev"){
   if(state.page > 0) state.page--
   return this.renderMarket(interaction)
  }

  if(interaction.customId.startsWith("market_buy_")){

   const listingId = parseInt(interaction.customId.split("_")[2])

   const result = buyCard(userId, listingId)

   if(result?.error)
    return interaction.reply({content:`❌ ${result.error}`,flags:64})

   return interaction.reply({content:"✅ Carte achetée.",flags:64})
  }

  if(interaction.customId === "market_my"){

   const listings = getUserListings(userId)

   if(listings.length === 0)
    return interaction.update({
     content:"Tu n'as aucune vente active.",
     embeds:[],
     components:[]
    })

   const embed = new EmbedBuilder()
    .setTitle("📦 Mes ventes")

   const rows = []

   listings.forEach(l => {

    const card = cards.find(c=>c.id==l.card)

    embed.addFields({
     name:`${rarityEmoji[card.rarity]} ${card.name}`,
     value:`${l.price} kamas`,
     inline:false
    })

    rows.push(
     new ActionRowBuilder().addComponents(
      new ButtonBuilder()
       .setCustomId(`market_remove_${l.id}`)
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

  if(interaction.customId.startsWith("market_remove_")){

   const listingId = parseInt(interaction.customId.split("_")[2])

   const result = removeListing(userId, listingId)

   if(result?.error)
    return interaction.reply({content:`❌ ${result.error}`,flags:64})

   return interaction.reply({content:"📦 Vente retirée.",flags:64})
  }

  if(interaction.customId === "market_back"){
   return this.execute(interaction)
  }

 },

 async renderMarket(interaction){

  const userId = interaction.user.id
  const state = marketState[userId]

  let market = getMarket()
  const averages = getAveragePrices()

  market.sort((a,b)=>a.price-b.price)

  const start = state.page * PAGE_SIZE
  const slice = market.slice(start,start+PAGE_SIZE)

  const embed = new EmbedBuilder()
   .setTitle("🛒 Marché")

  const rows = []

  slice.forEach(l=>{

   const card = cards.find(c=>c.id==l.card)

   embed.addFields({
    name:`${rarityEmoji[card.rarity]} ${card.name}`,
    value:`${l.price} kamas${averages[l.card] ? ` • 📊 ${averages[l.card]}`:""}`,
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

  const nav = new ActionRowBuilder().addComponents(

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

  rows.push(nav)

  const payload = {
   embeds:[embed],
   components:rows
  }

  if(interaction.isButton())
   return interaction.update(payload)

  return interaction.editReply(payload)

 },

 async modal(interaction){

  if(interaction.customId === "marketSellModal"){

   const userId = interaction.user.id

   const cardId = interaction.fields.getTextInputValue("cardId")
   const price = parseInt(interaction.fields.getTextInputValue("price"))

   const result = addListing(userId, cardId, price)

   if(result?.error)
    return interaction.reply({content:`❌ ${result.error}`,flags:64})

   return interaction.reply({
    content:"✅ Carte mise en vente.",
    flags:64
   })

  }

 }

}