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

module.exports={

 name:"market",
 description:"Marché des cartes",

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

  /* ================= ACHETER ================= */

  if(interaction.customId==="market_buy"){

   const market=getMarket()

   if(!market || market.length===0)
    return interaction.update({
     content:"Le marché est vide.",
     embeds:[],
     components:[]
    })

   const averages=getAveragePrices()

   const lines=market.slice(0,20).map(l=>{

    const card=cards.find(c=>c.id==l.card)

    if(!card)
     return `ID:${l.id} • Carte inconnue`

    const avg=averages[l.card] ? ` • 📊 ${averages[l.card]}`:""

    return `ID:${l.id} • ${rarityEmoji[card.rarity]} ${card.name} • ${l.price} kamas${avg}`

   })

   const embed=new EmbedBuilder()
    .setTitle("🛒 Marché")
    .setDescription(lines.join("\n"))

   const row=new ActionRowBuilder().addComponents(

    new ButtonBuilder()
     .setCustomId("market_buy_modal")
     .setLabel("Acheter par ID")
     .setStyle(ButtonStyle.Success)

   )

   return interaction.update({
    embeds:[embed],
    components:[row]
   })

  }

  /* ================= MES VENTES ================= */

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
     .setStyle(ButtonStyle.Danger)

   )

   return interaction.update({
    embeds:[embed],
    components:[row]
   })

  }

  /* ================= MODAL BUY ================= */

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

  /* ================= MODAL REMOVE ================= */

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

 async modal(interaction){

  /* ACHAT */

  if(interaction.customId==="marketBuyModal"){

   const listingId=parseInt(
    interaction.fields.getTextInputValue("listingId")
   )

   const result=buyCard(interaction.user.id,listingId)

   if(result?.error)
    return interaction.reply({
     content:`❌ ${result.error}`,
     ephemeral:true
    })

   return interaction.reply({
    content:"✅ Carte achetée.",
    ephemeral:true
   })

  }

  /* RETRAIT VENTE */

  if(interaction.customId==="marketRemoveModal"){

   const listingId=parseInt(
    interaction.fields.getTextInputValue("listingId")
   )

   const result=removeListing(interaction.user.id,listingId)

   if(result?.error)
    return interaction.reply({
     content:`❌ ${result.error}`,
     ephemeral:true
    })

   return interaction.reply({
    content:"📦 Vente retirée.",
    ephemeral:true
   })

  }

 }

}