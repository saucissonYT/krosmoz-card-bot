const {
 SlashCommandBuilder,
 EmbedBuilder,
 ActionRowBuilder,
 ButtonBuilder,
 ButtonStyle
} = require("discord.js")

const { getCardsById } = require("../../systems/cardRegistry")
const { getUser, save } = require("../../systems/userSystem")
const { achievementCheck } = require("../../systems/achievementCheck")
const { notifyAchievements } = require("../../systems/achievementNotifier")
const { getUserGuild } = require("../../systems/guildSystem")
const { RARITY_EMOJI } = require("../../systems/constants")

const MAX_GIFTS_PER_DAY = 3

function getTodayFR(){
 return new Date().toLocaleDateString("fr-FR", { timeZone:"Europe/Paris" })
}

module.exports = {

 data: new SlashCommandBuilder()
  .setName("gift")
  .setDescription("Donner une carte à un joueur")
  .addUserOption(o =>
   o.setName("joueur")
    .setDescription("Le joueur qui recevra la carte")
    .setRequired(true)
  )
  .addStringOption(o =>
   o.setName("carte")
    .setDescription("ID de la carte à donner")
    .setRequired(true)
  ),

 async execute(interaction){

  await interaction.deferReply()

  const target = interaction.options.getUser("joueur")
  const cardId = interaction.options.getString("carte")

  /* ---- Validations ---- */

  if(target.id === interaction.user.id)
   return interaction.editReply("❌ Tu ne peux pas te donner une carte à toi-même.")

  if(target.bot)
   return interaction.editReply("❌ Tu ne peux pas donner de carte à un bot.")

  const cardsById = getCardsById()
  const card = cardsById[String(cardId)]

  if(!card)
   return interaction.editReply("❌ Carte introuvable.")

  const user = getUser(interaction.user.id)
  const receiver = getUser(target.id)

  if(!user.cards || !user.cards[cardId] || user.cards[cardId] < 1)
   return interaction.editReply("❌ Tu ne possèdes pas cette carte.")

  /* ---- Limite quotidienne ---- */

  if(!user.stats) user.stats = {}

  const today = getTodayFR()

  if(!user.giftHistory) user.giftHistory = {}

  if(user.giftHistory.date !== today){
   user.giftHistory = { date: today, count: 0 }
  }

  if(user.giftHistory.count >= MAX_GIFTS_PER_DAY)
   return interaction.editReply(`❌ Tu as déjà donné ${MAX_GIFTS_PER_DAY} cartes aujourd'hui. Reviens demain !`)

  /* ---- Confirmation ---- */

  const emoji = RARITY_EMOJI[card.rarity] || ""

  const confirmEmbed = new EmbedBuilder()
   .setTitle("🎁 Confirmer le don")
   .setColor("#e67e22")
   .setDescription(
`Tu vas donner :

${emoji} **${card.name}** (#${card.id}) — ${card.rarity}

à **${target.username}**

Tes dons restants aujourd'hui : **${MAX_GIFTS_PER_DAY - user.giftHistory.count - 1}**/${MAX_GIFTS_PER_DAY}`
   )

  const row = new ActionRowBuilder().addComponents(

   new ButtonBuilder()
    .setCustomId("gift_confirm")
    .setLabel("Confirmer le don")
    .setEmoji("🎁")
    .setStyle(ButtonStyle.Success),

   new ButtonBuilder()
    .setCustomId("gift_cancel")
    .setLabel("Annuler")
    .setStyle(ButtonStyle.Danger)
  )

  await interaction.editReply({
   embeds: [confirmEmbed],
   components: [row]
  })

  const msg = await interaction.fetchReply()

  const collector = msg.createMessageComponentCollector({ time: 30000 })

  collector.on("collect", async i => {

   if(i.user.id !== interaction.user.id)
    return i.reply({ content:"Ce n'est pas ton don.", flags:64 })

   if(i.customId === "gift_cancel"){

    const cancelEmbed = new EmbedBuilder()
     .setTitle("❌ Don annulé")
     .setColor("#e74c3c")

    return i.update({ embeds:[cancelEmbed], components:[] })
   }

   if(i.customId === "gift_confirm"){

    /* Re-vérifier que le joueur possède toujours la carte */
    const freshUser = getUser(interaction.user.id)

    if(!freshUser.cards?.[cardId] || freshUser.cards[cardId] < 1){
     return i.update({
      embeds:[new EmbedBuilder().setTitle("❌ Tu ne possèdes plus cette carte.").setColor("#e74c3c")],
      components:[]
     })
    }

    /* ---- Effectuer le don ---- */

    freshUser.cards[cardId]--
    if(freshUser.cards[cardId] <= 0) delete freshUser.cards[cardId]

    if(!receiver.cards) receiver.cards = {}
    receiver.cards[cardId] = (receiver.cards[cardId] || 0) + 1

    /* ---- Stats donneur ---- */

    freshUser.giftHistory.count++
    freshUser.stats.giftsGiven = (freshUser.stats.giftsGiven || 0) + 1

    if(!freshUser.stats.giftRecipients) freshUser.stats.giftRecipients = {}
    freshUser.stats.giftRecipients[target.id] = (freshUser.stats.giftRecipients[target.id] || 0) + 1

    /* Tracking rareté donnée */
    if(card.rarity === "SSR")
     freshUser.stats.giftsSSRGiven = (freshUser.stats.giftsSSRGiven || 0) + 1
    if(card.rarity === "UR")
     freshUser.stats.giftsURGiven = (freshUser.stats.giftsURGiven || 0) + 1

    /* Shiny ? */
    if(freshUser.shinyCards?.[cardId] && freshUser.shinyCards[cardId] > 0){
     freshUser.stats.giftsShinyGiven = (freshUser.stats.giftsShinyGiven || 0) + 1
     /* Note: on ne transfère PAS le shiny, c'est un don de la carte normale */
    }

    /* Streak de dons */
    if(!freshUser.stats.giftLastDay) freshUser.stats.giftLastDay = ""
    const yesterday = new Date(Date.now() - 86400000).toLocaleDateString("fr-FR", { timeZone:"Europe/Paris" })
    if(freshUser.stats.giftLastDay === yesterday){
     freshUser.stats.giftStreak = (freshUser.stats.giftStreak || 1) + 1
    } else if(freshUser.stats.giftLastDay !== today){
     freshUser.stats.giftStreak = 1
    }
    freshUser.stats.giftLastDay = today

    /* Both ways (donner et recevoir le même jour) */
    if(freshUser.stats.giftReceivedToday === today)
     freshUser.stats.giftBothWays = (freshUser.stats.giftBothWays || 0) + 1

    freshUser.stats.giftGivenToday = today

    /* ---- Stats receveur ---- */

    if(!receiver.stats) receiver.stats = {}
    receiver.stats.giftsReceived = (receiver.stats.giftsReceived || 0) + 1

    if(receiver.stats.giftGivenToday === today)
     receiver.stats.giftBothWays = (receiver.stats.giftBothWays || 0) + 1

    receiver.stats.giftReceivedToday = today

    /* ---- Stat guilde ---- */

    const senderGuild = getUserGuild(interaction.user.id)
    const receiverGuild = getUserGuild(target.id)

    if(senderGuild && receiverGuild && senderGuild.id === receiverGuild.id){
     freshUser.stats.guildGifts = (freshUser.stats.guildGifts || 0) + 1
    }

    /* ---- Save ---- */

    save(interaction.user.id)
    save(target.id)

    /* ---- Achievements ---- */

    const unlockedSender = achievementCheck(freshUser, "gift")
    const unlockedReceiver = achievementCheck(receiver, "gift")

    if(unlockedReceiver.length) save(target.id)

    /* ---- Résultat ---- */

    const resultEmbed = new EmbedBuilder()
     .setTitle("🎁 Don effectué !")
     .setColor("#2ecc71")
     .setDescription(
`**${interaction.user.username}** a donné ${emoji} **${card.name}** (#${card.id}) à **${target.username}** !`
     )
     .setFooter({ text:`Dons restants aujourd'hui : ${MAX_GIFTS_PER_DAY - freshUser.giftHistory.count}/${MAX_GIFTS_PER_DAY}` })

    await i.update({ embeds:[resultEmbed], components:[] })

    if(unlockedSender.length)
     await notifyAchievements(interaction, unlockedSender)
   }

  })

  collector.on("end", (collected, reason) => {
   if(reason === "time" && collected.size === 0){
    interaction.editReply({
     embeds:[new EmbedBuilder().setTitle("⏰ Don expiré").setColor("#95a5a6")],
     components:[]
    }).catch(() => {})
   }
  })

 }

}