const {
 EmbedBuilder,
 ActionRowBuilder,
 StringSelectMenuBuilder
} = require("discord.js")

const { getShop, buyFromShop } = require("../../systems/krosmoshop")
const { getCards } = require("../../systems/cardRegistry")
const { getUser } = require("../../systems/userSystem")
const { notifyAchievements } = require("../../systems/achievementNotifier")

/*
 * FIX: rarityEmoji hardcodé remplacé par RARITY_EMOJI depuis constants.js
 */
const { RARITY_EMOJI } = require("../../systems/constants")

module.exports={

 name:"krosmoshop",
 description:"Shop quotidien",

 async execute(interaction){

  /* Lecture dynamique des cartes */
  const cards = getCards()

  const user = getUser(interaction.user.id)

  const shopData = getShop()
  const shop = shopData.cards

  const lines = shop.map(c=>{

   const card = cards.find(card=>card.id==c.card)

   if(!card) return `❌ Carte inconnue (ID:${c.card})`

   /* CHECK OWNERSHIP */
   const count = user.cards?.[c.card] || 0
   const icon = count > 0 ? "✅" : "❌"

   return `${icon} ${RARITY_EMOJI[c.rarity]} ${card.name} • ${c.price} kamas • ID:${c.card}`

  })

  const embed = new EmbedBuilder()
   .setTitle("🛒 KrosmoShop du jour")
   .setDescription(lines.join("\n") || "Aucune carte.")
   .setFooter({ text:`💰 Tes kamas : ${user.kamas || 0}` })

  const select = new StringSelectMenuBuilder()
   .setCustomId("krosmoshop_buy")
   .setPlaceholder("Acheter une carte")

  shop.forEach(c=>{

   const card = cards.find(card=>card.id==c.card)
   if(!card) return

   /* CHECK OWNERSHIP */
   const count = user.cards?.[c.card] || 0
   const icon = count > 0 ? "✅" : "❌"

   select.addOptions({
    label: `${icon} ${card.name}`,
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

  // FIX INTERACTION FAILED
  await interaction.deferReply({ flags:64 })

  const cardId = parseInt(interaction.values[0])

  const result = buyFromShop(interaction.user.id, cardId)

  if(result?.error)
   return interaction.editReply(`❌ ${result.error}`)

  /* -------- BUILD REPLY -------- */

  const emoji = RARITY_EMOJI[result.rarity] || "🎴"
  const cardName = result.cardInfo?.name || `Carte #${cardId}`

  let text = `🛒 Achat effectué ! ${emoji} **${cardName}** \`${result.rarity}\` • -${result.price} kamas`

  /* -------- NOUVELLE CARTE -------- */

  if(result.isNew){
   text += `\n\n🔎 **Nouvelle découverte !** Tu ne possédais pas cette carte !`
  }

  await interaction.editReply(text)

  /* -------- ACHIEVEMENTS -------- */

  if(result.unlocked?.length){
   await notifyAchievements(interaction,result.unlocked)
  }

 }

}