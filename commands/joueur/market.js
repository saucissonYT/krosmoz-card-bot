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
 removeListing,
 getAveragePrices
} = require("../../systems/market")

const { getCards } = require("../../systems/cardRegistry")
const { getUser } = require("../../systems/userSystem")

const cards = getCards()

const marketState={}

const rarityEmoji={
 C:"⚪",U:"🟢",R:"🔵",SR:"🟣",
 HR:"🔴",UR:"🟡",S:"✨",SSR:"🌈"
}

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

  if(interaction.customId==="market_back"){
   return this.execute(interaction)
  }

 },

 async renderMarket(interaction){

  const userId=interaction.user.id
  const state=marketState[userId]

  let market=getMarket()

  market.sort((a,b)=>a.price-b.price)

  const start=state.page*PAGE_SIZE
  const slice=market.slice(start,start+PAGE_SIZE)

  const lines=slice.map(l=>{

   const card=cards.find(c=>c.id==l.card)

   return `ID:${l.id} • ${rarityEmoji[card.rarity]} ${card.name} • ${l.price} kamas`

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

/* ---------------- SELL DEBUG ---------------- */

  if(interaction.customId==="marketSellModal"){

   const userId=interaction.user.id

   let cardId=interaction.fields.getTextInputValue("cardId").trim()
   const price=parseInt(interaction.fields.getTextInputValue("price"))

   const user=getUser(userId)

   console.log("=== MARKET SELL DEBUG ===")
   console.log("Input cardId:", cardId)
   console.log("Parsed price:", price)
   console.log("User cards:", user.cards)

   /* FIX TYPE */
   if(user.cards){

    // cas string vs number mismatch
    if(!user.cards[cardId]){

     const matchKey=Object.keys(user.cards).find(k=>String(k)===String(cardId))

     if(matchKey){
      console.log("Fix match key:", matchKey)
      cardId=matchKey
     }
    }

   }

   console.log("Final cardId used:", cardId)
   console.log("User has card?:", user.cards?.[cardId])

   if(!cardId || isNaN(price))
    return interaction.reply({
     content:"❌ Entrée invalide.",
     flags:64
    })

   const result=addListing(userId,cardId,price)

   console.log("Result:", result)

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

/* ---------------- BUY ---------------- */

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

/* ---------------- REMOVE ---------------- */

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