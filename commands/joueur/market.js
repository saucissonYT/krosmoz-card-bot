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
 getAveragePrices,
 getUserListings,
 removeListing
} = require("../../systems/market")

const { getCards } = require("../../systems/cardRegistry")
const cards = getCards()

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
 SSR:8,
 S:7,
 UR:6,
 HR:5,
 SR:4,
 R:3,
 U:2,
 C:1
}

const rarities=["C","U","R","SR","HR","UR","S","SSR"]

const PAGE_SIZE=10

module.exports={

 name:"market",
 description:"Marché des cartes",

 marketPage:0,
 marketSort:"price",
 rarityFilter:null,
 nameFilter:null,

 async execute(interaction){

  const embed=new EmbedBuilder()
   .setTitle("🛒 Marché")
   .setDescription(
`Que veux-tu faire ?

🛍️ **Acheter une carte**
📦 **Voir mes ventes**`
   )

  const row=new ActionRowBuilder().addComponents(

   new ButtonBuilder()
    .setCustomId("market_buy")
    .setLabel("Acheter")
    .setStyle(ButtonStyle.Success),

   new ButtonBuilder()
    .setCustomId("market_my")
    .setLabel("Mes ventes")
    .setStyle(ButtonStyle.Primary)

  )

  await interaction.reply({
   embeds:[embed],
   components:[row]
  })

 },

 async button(interaction){

  if(interaction.customId==="market_buy"){
   this.marketPage=0
   this.rarityFilter=null
   this.nameFilter=null
   return this.renderMarket(interaction)
  }

  if(interaction.customId==="market_next"){
   this.marketPage++
   return this.renderMarket(interaction)
  }

  if(interaction.customId==="market_prev"){
   if(this.marketPage>0) this.marketPage--
   return this.renderMarket(interaction)
  }

  if(interaction.customId==="market_sort_price"){
   this.marketSort="price"
   return this.renderMarket(interaction)
  }

  if(interaction.customId==="market_sort_rarity"){
   this.marketSort="rarity"
   return this.renderMarket(interaction)
  }

  if(interaction.customId==="market_filter_clear"){
   this.rarityFilter=null
   this.nameFilter=null
   this.marketPage=0
   return this.renderMarket(interaction)
  }

  if(interaction.customId.startsWith("market_filter_rarity_")){

   const rarity=interaction.customId.split("_")[3]

   this.rarityFilter=rarity
   this.marketPage=0

   return this.renderMarket(interaction)
  }

  if(interaction.customId==="market_search_name"){

   const modal=new ModalBuilder()
    .setCustomId("marketSearchModal")
    .setTitle("Recherche de carte")

   const input=new TextInputBuilder()
    .setCustomId("cardName")
    .setLabel("Nom de la carte")
    .setStyle(TextInputStyle.Short)
    .setRequired(true)

   modal.addComponents(
    new ActionRowBuilder().addComponents(input)
   )

   return interaction.showModal(modal)

  }

  /* MES VENTES */

  if(interaction.customId==="market_my"){

   const listings=getUserListings(interaction.user.id)

   if(listings.length===0)
    return interaction.update({
     content:"Tu n'as aucune vente active.",
     embeds:[],
     components:[]
    })

   const lines=listings.map(l=>{

    const card=cards.find(c=>c.id==l.card)

    return `ID:${l.id} • ${rarityEmoji[card.rarity]} ${card.name} • ${l.price} kamas`

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
     .setEmoji("⬅")
     .setStyle(ButtonStyle.Secondary)

   )

   return interaction.update({
    embeds:[embed],
    components:[row]
   })

  }

  /* RETOUR */

  if(interaction.customId==="market_back"){

   const embed=new EmbedBuilder()
    .setTitle("🛒 Marché")
    .setDescription(
`Que veux-tu faire ?

🛍️ **Acheter une carte**
📦 **Voir mes ventes**`
    )

   const row=new ActionRowBuilder().addComponents(

    new ButtonBuilder()
     .setCustomId("market_buy")
     .setLabel("Acheter")
     .setStyle(ButtonStyle.Success),

    new ButtonBuilder()
     .setCustomId("market_my")
     .setLabel("Mes ventes")
     .setStyle(ButtonStyle.Primary)

   )

   return interaction.update({
    embeds:[embed],
    components:[row]
   })

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

 },

 async renderMarket(interaction){

  let market=getMarket()

  const averages=getAveragePrices()

  /* FILTRE RARETE */

  if(this.rarityFilter){

   market=market.filter(l=>{
    const card=cards.find(c=>c.id==l.card)
    return card?.rarity===this.rarityFilter
   })

  }

  /* FILTRE NOM */

  if(this.nameFilter){

   const name=this.nameFilter.toLowerCase()

   market=market.filter(l=>{
    const card=cards.find(c=>c.id==l.card)
    return card?.name.toLowerCase().includes(name)
   })

  }

  /* TRI */

  if(this.marketSort==="price")
   market.sort((a,b)=>a.price-b.price)

  if(this.marketSort==="rarity")
   market.sort((a,b)=>{

    const cardA=cards.find(c=>c.id==a.card)
    const cardB=cards.find(c=>c.id==b.card)

    return rarityOrder[cardB.rarity]-rarityOrder[cardA.rarity]

   })

  const start=this.marketPage*PAGE_SIZE
  const slice=market.slice(start,start+PAGE_SIZE)

  const lines=slice.map(l=>{

   const card=cards.find(c=>c.id==l.card)

   const avg=averages[l.card] ? ` • 📊 ${averages[l.card]}`:""

   return `ID:${l.id} • ${rarityEmoji[card.rarity]} ${card.name} • ${l.price} kamas${avg}`

  })

  const totalPages=Math.max(1,Math.ceil(market.length/PAGE_SIZE))

  const embed=new EmbedBuilder()
   .setTitle(`🛒 Marché — Page ${this.marketPage+1}/${totalPages}`)
   .setDescription(lines.join("\n")||"Aucun résultat.")

  /* NAVIGATION */

  const nav=new ActionRowBuilder().addComponents(

   new ButtonBuilder()
    .setCustomId("market_prev")
    .setEmoji("⬅")
    .setStyle(ButtonStyle.Secondary),

   new ButtonBuilder()
    .setCustomId("market_next")
    .setEmoji("➡")
    .setStyle(ButtonStyle.Secondary)

  )

  /* TRI */

  const sort=new ActionRowBuilder().addComponents(

   new ButtonBuilder()
    .setCustomId("market_sort_price")
    .setLabel("Prix")
    .setStyle(ButtonStyle.Primary),

   new ButtonBuilder()
    .setCustomId("market_sort_rarity")
    .setLabel("Rareté")
    .setStyle(ButtonStyle.Primary),

   new ButtonBuilder()
    .setCustomId("market_search_name")
    .setLabel("Nom")
    .setStyle(ButtonStyle.Success),

   new ButtonBuilder()
    .setCustomId("market_buy_modal")
    .setLabel("Acheter ID")
    .setStyle(ButtonStyle.Success)

  )

  /* FILTRE RARETE */

  const rarityButtons=new ActionRowBuilder()

  rarities.slice(0,5).forEach(r=>{
   rarityButtons.addComponents(
    new ButtonBuilder()
     .setCustomId(`market_filter_rarity_${r}`)
     .setLabel(r)
     .setStyle(ButtonStyle.Secondary)
   )
  })

  const rarityButtons2=new ActionRowBuilder()

  rarities.slice(5).forEach(r=>{
   rarityButtons2.addComponents(
    new ButtonBuilder()
     .setCustomId(`market_filter_rarity_${r}`)
     .setLabel(r)
     .setStyle(ButtonStyle.Secondary)
   )
  })

  const clear=new ActionRowBuilder().addComponents(

   new ButtonBuilder()
    .setCustomId("market_filter_clear")
    .setLabel("Reset filtres")
    .setStyle(ButtonStyle.Danger),

   new ButtonBuilder()
    .setCustomId("market_back")
    .setLabel("Retour")
    .setEmoji("⬅")
    .setStyle(ButtonStyle.Secondary)

  )

  return interaction.update({
   embeds:[embed],
   components:[nav,sort,rarityButtons,rarityButtons2,clear]
  })

 },

 async modal(interaction){

  if(interaction.customId==="marketBuyModal"){

   const listingId=parseInt(
    interaction.fields.getTextInputValue("listingId")
   )

   const result=buyCard(interaction.user.id,listingId)

   if(result?.error)
    return interaction.reply({
     content:`❌ ${result.error}`,
     flags:64
    })

   return interaction.reply({
    content:"✅ Carte achetée.",
    flags:64
   })

  }

  if(interaction.customId==="marketRemoveModal"){

   const listingId=parseInt(
    interaction.fields.getTextInputValue("listingId")
   )

   const result=removeListing(interaction.user.id,listingId)

   if(result?.error)
    return interaction.reply({
     content:`❌ ${result.error}`,
     flags:64
    })

   return interaction.reply({
    content:"📦 Vente retirée.",
    flags:64
   })

  }

  if(interaction.customId==="marketSearchModal"){

   const name=interaction.fields.getTextInputValue("cardName")

   this.nameFilter=name
   this.marketPage=0

   return this.renderMarket(interaction)

  }

 }

}