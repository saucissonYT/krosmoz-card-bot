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

const { getCardsById } = require("../../systems/cardRegistry")
const { getUser } = require("../../systems/userSystem")

const cardsById = getCardsById()

const PAGE_SIZE = 5

const rarityEmoji={
 C:"⚪",U:"🟢",R:"🔵",SR:"🟣",
 HR:"🔴",UR:"🟡",S:"✨",SSR:"🌈"
}

const rarityOrder={
 C:1,U:2,R:3,SR:4,HR:5,UR:6,S:7,SSR:8
}

const rarities=["C","U","R","SR","HR","UR","S","SSR"]

const state={}

module.exports={

 name:"market",

 async execute(interaction){

  const userId=interaction.user.id

  state[userId]={
   page:0,
   rarity:null,
   sort:"price"
  }

  const embed=new EmbedBuilder()
   .setTitle("🛒 Marché")
   .setDescription(`Que veux-tu faire ?

🛍️ Acheter une carte
💰 Vendre une carte
📦 Mes ventes`)

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

  if(!state[userId])
   state[userId]={page:0,rarity:null,sort:"price"}

  const s=state[userId]

/* ---------- ACHETER ---------- */

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

  if(interaction.customId==="sort_price"){
   s.sort="price"
   return this.renderMarket(interaction)
  }

  if(interaction.customId==="sort_rarity"){
   s.sort="rarity"
   return this.renderMarket(interaction)
  }

  if(interaction.customId==="filter_clear"){
   s.rarity=null
   return this.renderMarket(interaction)
  }

  if(interaction.customId.startsWith("filter_")){

   const rarity=interaction.customId.split("_")[1]

   if(rarities.includes(rarity)){
    s.rarity=rarity
    s.page=0
   }

   return this.renderMarket(interaction)

  }

  if(interaction.customId.startsWith("buy_")){

   const listingId=parseInt(interaction.customId.split("_")[1])

   const result=buyCard(userId,listingId)

   if(result?.error)
    return interaction.reply({content:`❌ ${result.error}`,flags:64})

   return interaction.reply({content:"✅ Carte achetée.",flags:64})

  }

/* ---------- VENDRE ---------- */

  if(interaction.customId==="market_sell"){

   const user=getUser(userId)

   const inventory=Object.entries(user.cards||{})

   if(inventory.length===0)
    return interaction.reply({content:"📦 Tu n'as aucune carte.",flags:64})

   const embed=new EmbedBuilder()
    .setTitle("💰 Choisis une carte à vendre")

   const rows=[]

   inventory.slice(0,10).forEach(([id,count])=>{

    const card=cardsById[id]

    embed.addFields({
     name:`${rarityEmoji[card.rarity]} ${card.name}`,
     value:`Quantité : x${count}`,
     inline:false
    })

    rows.push(
     new ActionRowBuilder().addComponents(
      new ButtonBuilder()
       .setCustomId(`sell_${id}`)
       .setLabel("Vendre")
       .setStyle(ButtonStyle.Danger)
     )
    )

   })

   return interaction.update({
    embeds:[embed],
    components:rows
   })

  }

  if(interaction.customId.startsWith("sell_")){

   const cardId=interaction.customId.split("_")[1]

   const modal=new ModalBuilder()
    .setCustomId(`sellmodal_${cardId}`)
    .setTitle("Prix de vente")

   const priceInput=new TextInputBuilder()
    .setCustomId("price")
    .setLabel("Prix en kamas")
    .setStyle(TextInputStyle.Short)
    .setRequired(true)

   modal.addComponents(
    new ActionRowBuilder().addComponents(priceInput)
   )

   return interaction.showModal(modal)

  }

/* ---------- MES VENTES ---------- */

  if(interaction.customId==="market_my"){

   const listings=getUserListings(userId)

   if(listings.length===0)
    return interaction.update({
     content:"Tu n'as aucune vente active.",
     embeds:[],
     components:[]
    })

   const embed=new EmbedBuilder()
    .setTitle("📦 Mes ventes")

   const rows=[]

   listings.forEach(l=>{

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

   return interaction.update({
    embeds:[embed],
    components:rows
   })

  }

  if(interaction.customId.startsWith("remove_")){

   const id=parseInt(interaction.customId.split("_")[1])

   const result=removeListing(userId,id)

   if(result?.error)
    return interaction.reply({content:`❌ ${result.error}`,flags:64})

   return interaction.reply({content:"📦 Vente retirée.",flags:64})
  }

 },

 async renderMarket(interaction){

  const userId=interaction.user.id
  const s=state[userId]

  let market=getMarket()

  const averages=getAveragePrices()

  if(s.rarity){

   market=market.filter(l=>{
    const card=cardsById[l.card]
    return card.rarity===s.rarity
   })

  }

  if(s.sort==="price")
   market.sort((a,b)=>a.price-b.price)

  if(s.sort==="rarity")
   market.sort((a,b)=>{

    const ca=cardsById[a.card]
    const cb=cardsById[b.card]

    return rarityOrder[cb.rarity]-rarityOrder[ca.rarity]

   })

  const start=s.page*PAGE_SIZE
  const slice=market.slice(start,start+PAGE_SIZE)

  const embed=new EmbedBuilder()
   .setTitle("🛒 Marché")

  const rows=[]

  slice.forEach(l=>{

   const card=cardsById[l.card]

   embed.addFields({
    name:`${rarityEmoji[card.rarity]} ${card.name}`,
    value:`${l.price} kamas${averages[l.card] ? ` • 📊 ${averages[l.card]}`:""}`,
    inline:false
   })

   rows.push(
    new ActionRowBuilder().addComponents(
     new ButtonBuilder()
      .setCustomId(`buy_${l.id}`)
      .setLabel("Acheter")
      .setStyle(ButtonStyle.Success)
    )
   )

  })

/* TRI */

  const sortRow=new ActionRowBuilder().addComponents(

   new ButtonBuilder()
    .setCustomId("sort_price")
    .setLabel("Prix")
    .setStyle(ButtonStyle.Primary),

   new ButtonBuilder()
    .setCustomId("sort_rarity")
    .setLabel("Rareté")
    .setStyle(ButtonStyle.Primary)

  )

/* FILTRES */

  const rarityRow1=new ActionRowBuilder()

  rarities.slice(0,4).forEach(r=>{
   rarityRow1.addComponents(
    new ButtonBuilder()
     .setCustomId(`filter_${r}`)
     .setLabel(r)
     .setStyle(ButtonStyle.Secondary)
   )
  })

  const rarityRow2=new ActionRowBuilder()

  rarities.slice(4).forEach(r=>{
   rarityRow2.addComponents(
    new ButtonBuilder()
     .setCustomId(`filter_${r}`)
     .setLabel(r)
     .setStyle(ButtonStyle.Secondary)
   )
  })

/* NAV */

  const nav=new ActionRowBuilder().addComponents(

   new ButtonBuilder()
    .setCustomId("market_prev")
    .setEmoji("⬅")
    .setStyle(ButtonStyle.Secondary),

   new ButtonBuilder()
    .setCustomId("market_next")
    .setEmoji("➡")
    .setStyle(ButtonStyle.Secondary),

   new ButtonBuilder()
    .setCustomId("filter_clear")
    .setLabel("Reset")
    .setStyle(ButtonStyle.Danger)

  )

  const payload={
   embeds:[embed],
   components:[...rows,sortRow,rarityRow1,rarityRow2,nav]
  }

  if(interaction.isButton())
   return interaction.update(payload)

  return interaction.editReply(payload)

 },

 async modal(interaction){

  if(!interaction.customId.startsWith("sellmodal_")) return

  const userId=interaction.user.id
  const cardId=interaction.customId.split("_")[1]

  const price=parseInt(interaction.fields.getTextInputValue("price"))

  const result=addListing(userId,cardId,price)

  if(result?.error)
   return interaction.reply({content:`❌ ${result.error}`,flags:64})

  return interaction.reply({
   content:"✅ Carte mise en vente.",
   flags:64
  })

 }

}