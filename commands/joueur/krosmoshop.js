const {
 EmbedBuilder,
 ActionRowBuilder,
 StringSelectMenuBuilder
} = require("discord.js")

const { getShop, buyFromShop } = require("../../systems/krosmoshop")
const { getCards } = require("../../systems/cardRegistry")

const cards = getCards()

const rarityEmoji={
 C:"⚪",U:"🟢",R:"🔵",SR:"🟣",
 HR:"🔴",UR:"🟡",S:"✨",SSR:"🌈"
}

module.exports={

 name:"krosmoshop",
 description:"Shop quotidien",

 async execute(interaction){

  const shopData = getShop()
  const shop = shopData.cards

  const lines = shop.map(c=>{

   const card = cards.find(card=>card.id==c.card)

   return `${rarityEmoji[c.rarity]} ${card.name} • ${c.price} kamas • ID:${c.card}`

  })

  const embed = new EmbedBuilder()
   .setTitle("🛒 KrosmoShop du jour")
   .setDescription(lines.join("\n"))

  const select = new StringSelectMenuBuilder()
   .setCustomId("krosmoshop_buy")
   .setPlaceholder("Acheter une carte")

  shop.forEach(c=>{

   const card = cards.find(card=>card.id==c.card)

   select.addOptions({
    label: card.name,
    description: `${c.price} kamas`,
    value: String(c.card)
   })

  })

  const row = new ActionRowBuilder().addComponents(select)

  await interaction.reply({
   embeds:[embed],
   components:[row]
  })

 },

 async select(interaction){

  if(interaction.customId !== "krosmoshop_buy") return

  const cardId = parseInt(interaction.values[0])

  const result = buyFromShop(interaction.user.id, cardId)

  if(result?.error)
   return interaction.reply({
    content:`❌ ${result.error}`,
    flags:64
   })

  return interaction.reply({
   content:"🛒 Achat effectué.",
   flags:64
  })

 }

}