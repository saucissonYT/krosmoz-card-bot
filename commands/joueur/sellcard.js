const {
 ActionRowBuilder,
 StringSelectMenuBuilder
} = require("discord.js")

const { RARITY_EMOJI, SELL_PRICE } = require("../../systems/constants")
const { getCardsById } = require("../../systems/cardRegistry")
const { getUser, save } = require("../../systems/userSystem")
const { achievementCheck } = require("../../systems/achievementCheck")
const { notifyAchievements } = require("../../systems/achievementNotifier")

module.exports={

 name:"sellcard",
 description:"Vendre une carte",

 async execute(interaction){

  const cardsById = getCardsById()
  const user = getUser(interaction.user.id)

  if(!user.cards || Object.keys(user.cards).length===0)
   return interaction.reply({ content:"❌ Tu n'as aucune carte.", flags:64 })

  const options=[]

  for(const id in user.cards){

   const card = cardsById[id]
   if(!card) continue

   const price = SELL_PRICE[card.rarity] || 1
   const owned = user.cards[id]

   options.push({
    label:`${RARITY_EMOJI[card.rarity]} ${card.name}`,
    value:id,
    description:`Possédé: x${owned} • Vente: ${price} • Total: ${owned*price}`
   })
  }

  if(options.length===0)
   return interaction.reply({ content:"❌ Aucune carte vendable.", flags:64 })

  const menu = new StringSelectMenuBuilder()
   .setCustomId("sellcard_select")
   .setPlaceholder("💰 Choisir une carte à vendre")
   .addOptions(options.slice(0,25))

  const row = new ActionRowBuilder().addComponents(menu)

  await interaction.reply({
   content:"💰 **Sélectionne une carte à vendre**",
   components:[row],
   flags:64
  })

 },

 async select(interaction){

  if(interaction.customId!=="sellcard_select") return

  const cardsById = getCardsById()
  const user = getUser(interaction.user.id)
  const id = interaction.values[0]
  const card = cardsById[id]

  if(!card)
   return interaction.update({ content:"❌ Carte introuvable.", components:[] })

  if(!user.cards || !user.cards[id])
   return interaction.update({ content:"❌ Tu ne possèdes plus cette carte.", components:[] })

  const price = SELL_PRICE[card.rarity] || 1

  user.cards[id]--
  if(user.cards[id]<=0) delete user.cards[id]

  user.kamas = (user.kamas || 0) + price

  if(!user.stats) user.stats = {}
  user.stats.cardsSold = (user.stats.cardsSold || 0) + 1

  /* ---- ACHIEVEMENT SELL FAST ---- */
  // Vendre une carte dans les 10 secondes après avoir ouvert un pack
  if(user.lastPack && (Date.now() - user.lastPack) <= 10000){
   user.stats.sellFast = (user.stats.sellFast || 0) + 1
  }

  save()

  const unlocked = [
   ...achievementCheck(user,"economy"),
   ...achievementCheck(user,"pack")
  ]

  await interaction.update({
   content:`💰 **Carte vendue**\n\n${RARITY_EMOJI[card.rarity]} **${card.name}**\n+${price} kamas\n\n💰 Solde : **${user.kamas} kamas**`,
   components:[]
  })

  if(unlocked.length)
   await notifyAchievements(interaction, unlocked)

 }

}