const {
 ActionRowBuilder,
 ButtonBuilder,
 ButtonStyle,
 EmbedBuilder,
 SlashCommandBuilder
} = require("discord.js")

const { getUser, save } = require("../../systems/userSystem")
const { achievementCheck } = require("../../systems/achievementCheck")
const { notifyAchievements } = require("../../systems/achievementNotifier")
const { PACK_PRICE } = require("../../systems/constants")

const MAX_QUANTITY = 25

module.exports = {
 data: new SlashCommandBuilder()
  .setName("buypack")
  .setDescription("Acheter un ou plusieurs packs")
  .addIntegerOption((option) =>
   option
    .setName("quantite")
    .setDescription("Nombre de packs a acheter")
    .setMinValue(1)
    .setMaxValue(MAX_QUANTITY)
  ),

 name: "buypack",
 description: "Acheter un ou plusieurs packs",

 async execute(interaction) {
  const user = getUser(interaction.user.id)
  const quantity = interaction.options?.getInteger("quantite") || 1
  const totalPrice = PACK_PRICE * quantity

  if (user.kamas < totalPrice) {
   return interaction.reply({
    content: `❌ Pas assez de kamas (il faut ${totalPrice}).`,
    flags: 64
   })
  }

  const embed = new EmbedBuilder()
   .setTitle("🎴 Acheter des packs")
   .setDescription(
`Prix unitaire : **${PACK_PRICE} kamas**
Quantite : **${quantity}**
Total : **${totalPrice} kamas**

💰 Solde : **${user.kamas}**
📦 Packs : **${user.packs || 0}**

Confirmer l'achat ?`
   )
   .setColor("#f1c40f")

  const row = new ActionRowBuilder().addComponents(
   new ButtonBuilder()
    .setCustomId("buy_pack_confirm")
    .setLabel(`Acheter x${quantity}`)
    .setStyle(ButtonStyle.Success),
   new ButtonBuilder()
    .setCustomId("buy_pack_cancel")
    .setLabel("Annuler")
    .setStyle(ButtonStyle.Secondary)
  )

  const msg = await interaction.reply({
   embeds: [embed],
   components: [row],
   fetchReply: true
  })

  const collector = msg.createMessageComponentCollector({ time: 30000 })

  collector.on("collect", async (i) => {
   if (i.user.id !== interaction.user.id) {
    return i.reply({
     content: "Pas ton achat.",
     flags: 64
    })
   }

   if (i.customId === "buy_pack_cancel") {
    return i.update({
     content: "❌ Achat annule.",
     embeds: [],
     components: []
    })
   }

   if (i.customId === "buy_pack_confirm") {
    if (user.kamas < totalPrice) {
     return i.update({
      content: "❌ Plus assez de kamas.",
      embeds: [],
      components: []
     })
    }

    user.kamas -= totalPrice
    user.packs = (user.packs || 0) + quantity

    if (!user.stats) user.stats = {}
    user.stats.packsBought = (user.stats.packsBought || 0) + quantity
    user.stats.maxBulkBuy = Math.max(user.stats.maxBulkBuy || 0, quantity)
    if (quantity >= 2) {
     user.stats.multiPackBuys = (user.stats.multiPackBuys || 0) + 1
    }

    save(interaction.user.id)

    const unlocked = achievementCheck(user, "economy")

    await i.update({
     content:
`🎴 **Packs achetes !**

📦 Packs disponibles : **${user.packs}**
💰 Solde : **${user.kamas} kamas**
📊 Achat : **x${quantity}** packs pour **${totalPrice} kamas**

Utilise **/krosmoz** pour les ouvrir.`,
     embeds: [],
     components: []
    })

    if (unlocked.length) {
      await notifyAchievements(i, unlocked)
    }
   }
  })
 }
}
