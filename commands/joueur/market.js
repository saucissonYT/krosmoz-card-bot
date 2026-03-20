const {
 EmbedBuilder,
 ActionRowBuilder,
 ButtonBuilder,
 ButtonStyle,
 ModalBuilder,
 TextInputBuilder,
 TextInputStyle
} = require("discord.js")

const { RARITY_EMOJI } = require("../../systems/constants")

const {
 getMarket,
 buyCard,
 addListing,
 getUserListings,
 removeListing,
 getAveragePrices
} = require("../../systems/market")

const { getCards } = require("../../systems/cardRegistry")
const cards = getCards()

const marketState={}

const PAGE_SIZE=10

module.exports={

 name:"market",

 async execute(interaction){

  const userId=interaction.user.id

  marketState[userId]={ page:0 }

  const embed=new EmbedBuilder()
   .setTitle("🛒 Marché")
   .setDescription(`Que veux-tu faire ?

🛍️ Acheter une carte  
📦 Voir mes ventes  
💰 Vendre une carte`)

  const row=new ActionRowBuilder().addComponents(

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

  const userId=interaction.user.id

  if(!marketState[userId])
   return interaction.reply({
    content:"❌ Menu expiré.",
    flags:64
   })

  const state=marketState[userId]

  if(interaction.customId==="market_buy"){
   state.page=0
   return this.renderMarket(interaction)
  }

  if(interaction.customId==="market_next"){
   state.page++
   return this.renderMarket(interaction)
  }

  if(interaction.customId==="market_prev"){
   if(state.page>0) state.page--
   return this.renderMarket(interaction)
  }

  if(interaction.customId==="market_buy_modal"){

   const modal=new ModalBuilder()
    .setCustomId("marketBuyModal")
    .setTitle("Acheter une carte")

   const input=new TextInputBuilder()
    .setCustomId("listingId")
    .setLabel("ID du listing")
    .setStyle(TextInputStyle.Short)
    .setRequired(true)

   modal.addComponents(
    new ActionRowBuilder().addComponents(input)
   )

   return interaction.showModal(modal)
  }

  if(interaction.customId==="market_sell"){

   const modal=new ModalBuilder()
    .setCustomId("marketSellModal")
    .setTitle("Vendre une carte")

   const cardInput=new TextInputBuilder()
    .setCustomId("cardId")
    .setLabel("ID de la carte (visible dans /inventaire)")
    .setStyle(TextInputStyle.Short)
    .setRequired(true)

   const priceInput=new TextInputBuilder()
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

  if(interaction.customId==="market_my"){

   const listings=getUserListings(userId)

   if(listings.length===0)
    return interaction.update({
     content:"Tu n'as aucune vente active.",
     embeds:[],
     components:[]
    })

   const lines=listings.map(l=>{
    const card=cards.find(c=>c.id==l.card)
    return `ID:${l.id} • ${RARITY_EMOJI[card.rarity]} ${card.name} • ${l.price} kamas`
   })

   const embed=new EmbedBuilder()
    .setTitle("📦 Mes ventes")
    .setDescription(lines.join("\n"))

   const row=new ActionRowBuilder().addComponents(

    new ButtonBuilder()
     .setCustomId("market_remove_modal")
     .setLabel("Retirer une vente")
     .setStyle(ButtonStyle.Danger),

    new ButtonBuilder()
     .setCustomId("market_back")
     .setLabel("Retour")
     .setStyle(ButtonStyle.Secondary)

   )

   return interaction.update({
    embeds:[embed],
    components:[row]
   })
  }

  if(interaction.customId==="market_remove_modal"){

   const modal=new ModalBuilder()
    .setCustomId("marketRemoveModal")
    .setTitle("Retirer une vente")

   const input=new TextInputBuilder()
    .setCustomId("listingId")
    .setLabel("ID du listing")
    .setStyle(TextInputStyle.Short)
    .setRequired(true)

   modal.addComponents(
    new ActionRowBuilder().addComponents(input)
   )

   return interaction.showModal(modal)
  }

  if(interaction.customId==="market_back"){
   return this.execute(interaction)
  }

 },

 async renderMarket(interaction){

  const userId=interaction.user.id
  const state=marketState[userId]

  let market=getMarket()
  const averages=getAveragePrices()

  market.sort((a,b)=>a.price-b.price)

  const start=state.page*PAGE_SIZE
  const slice=market.slice(start,start+PAGE_SIZE)

  const lines=slice.map(l=>{

   const card=cards.find(c=>c.id==l.card)
   const avg=averages[l.card] ? ` • 📊 ${averages[l.card]}`:""

   return `ID:${l.id} • ${RARITY_EMOJI[card.rarity]} ${card.name} • ${l.price} kamas${avg}`

  })

  const embed=new EmbedBuilder()
   .setTitle(`🛒 Marché`)
   .setDescription(lines.join("\n")||"Aucun résultat.")

  const row1=new ActionRowBuilder().addComponents(

   new ButtonBuilder()
    .setCustomId("market_prev")
    .setEmoji("⬅")
    .setStyle(ButtonStyle.Secondary),

   new ButtonBuilder()
    .setCustomId("market_next")
    .setEmoji("➡")
    .setStyle(ButtonStyle.Secondary)

  )

  const row2=new ActionRowBuilder().addComponents(

   new ButtonBuilder()
    .setCustomId("market_buy_modal")
    .setLabel("Acheter ID")
    .setStyle(ButtonStyle.Success),

   new ButtonBuilder()
    .setCustomId("market_back")
    .setLabel("Retour")
    .setStyle(ButtonStyle.Secondary)

  )

  const payload={embeds:[embed],components:[row1,row2]}

  if(interaction.isButton())
   return interaction.update(payload)

  return interaction.editReply(payload)

 },

 async modal(interaction){

  /* ---------- BUY ---------- */

  if(interaction.customId==="marketBuyModal"){

   const listingId=parseInt(
    interaction.fields.getTextInputValue("listingId")
   )

   const result=buyCard(interaction.user.id,listingId)

   if(result?.error)
    return interaction.reply({content:`❌ ${result.error}`,flags:64})

   return interaction.reply({
    content:"✅ Carte achetée.",
    flags:64
   })
  }

  /* ---------- SELL ---------- */

  if(interaction.customId==="marketSellModal"){

   await interaction.deferReply({ flags:64 })

   const cardId=parseInt(
    interaction.fields.getTextInputValue("cardId")
   )

   const price=parseInt(
    interaction.fields.getTextInputValue("price")
   )

   if(isNaN(cardId) || isNaN(price)){
    return interaction.editReply("❌ ID ou prix invalide.")
   }

   const result=addListing(interaction.user.id,cardId,price)

   if(result?.error)
    return interaction.editReply(`❌ ${result.error}`)

   return interaction.editReply({
    content:"🛒 Carte mise en vente."
   })
  }

  /* ---------- REMOVE ---------- */

  if(interaction.customId==="marketRemoveModal"){

   const listingId=parseInt(
    interaction.fields.getTextInputValue("listingId")
   )

   const result=removeListing(interaction.user.id,listingId)

   if(result?.error)
    return interaction.reply({content:`❌ ${result.error}`,flags:64})

   return interaction.reply({
    content:"📦 Vente retirée.",
    flags:64
   })
  }

 }

}