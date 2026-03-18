const {
 EmbedBuilder,
 ActionRowBuilder,
 StringSelectMenuBuilder
} = require("discord.js")

const { getShop, buyFromShop } = require("../../systems/krosmoshop")
const { getCards } = require("../../systems/cardRegistry")
const { notifyAchievements } = require("../../systems/achievementNotifier")

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

   if(!card) return `❌ Carte inconnue (ID:${c.card})`

   return `${rarityEmoji[c.rarity]} ${card.name} • ${c.price} kamas • ID:${c.card}`

  })

  const embed = new EmbedBuilder()
   .setTitle("🛒 KrosmoShop du jour")
   .setDescription(lines.join("\n") || "Aucune carte.")

  const select = new StringSelectMenuBuilder()
   .setCustomId("krosmoshop_buy")
   .setPlaceholder("Acheter une carte")

  shop.forEach(c=>{

   const card = cards.find(card=>card.id==c.card)
   if(!card) return

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

  // 🔥 FIX INTERACTION FAILED
  await interaction.deferReply({ flags:64 })

  const cardId = parseInt(interaction.values[0])

  const result = buyFromShop(interaction.user.id, cardId)

  if(result?.error)
   return interaction.editReply(`❌ ${result.error}`)

  await interaction.editReply("🛒 Achat effectué.")

  /* -------- ACHIEVEMENTS -------- */

  if(result.unlocked?.length){
   await notifyAchievements(interaction,result.unlocked)
  }

 }

}