const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js")

const { RARITY_EMOJI, SELL_PRICE } = require("../../systems/constants")

const { getCardsById } = require("../../systems/cardRegistry")
const { getUser, save, updateActivityStreak } = require("../../systems/userSystem")
const { achievementCheck } = require("../../systems/achievementCheck")
const { notifyAchievements } = require("../../systems/achievementNotifier")

module.exports={

 name:"sellduplicates",

 async execute(interaction){

  const cardsById = getCardsById()

  const user = getUser(interaction.user.id)

  if(!user.cards || Object.keys(user.cards).length===0)
   return interaction.reply("Inventaire vide.")

  if(!user.stats) user.stats={}

  let totalCards=0
  let totalKamas=0

  const toSell=[]
  const previewLines=[]

  for(const id in user.cards){

   const card = cardsById[id]
   if(!card) continue

   if(card.rarity==="UR" || card.rarity==="SSR")
    continue

   const count=user.cards[id]

   if(count<=1) continue

   const duplicates=count-1
   const price = SELL_PRICE[card.rarity] || 10

   totalCards += duplicates
   totalKamas += duplicates * price

   toSell.push({
    id,
    duplicates,
    price
   })

   previewLines.push(
`${RARITY_EMOJI[card.rarity]} **${card.name}** ×${duplicates} → ${duplicates*price} kamas`
   )

  }

  if(totalCards===0)
   return interaction.reply("Aucun doublon à vendre.")

  const embed=new EmbedBuilder()
   .setTitle("⚠️ Vente des doublons")
   .setDescription(
`${totalCards} cartes seront vendues

${previewLines.slice(0,15).join("\n")}
${previewLines.length > 15 ? `\n... et ${previewLines.length - 15} autres` : ""}

💰 Gain total : **${totalKamas} kamas**`
   )

  const row=new ActionRowBuilder()
   .addComponents(

    new ButtonBuilder()
     .setCustomId("confirm_sell_dup")
     .setLabel("Confirmer")
     .setStyle(ButtonStyle.Success),

    new ButtonBuilder()
     .setCustomId("cancel_sell_dup")
     .setLabel("Annuler")
     .setStyle(ButtonStyle.Danger)

   )

  const msg=await interaction.reply({
   embeds:[embed],
   components:[row],
   fetchReply:true
  })

  const filter=i=>i.user.id===interaction.user.id

  const collector=msg.createMessageComponentCollector({
   filter,
   time:30000,
   max:1
  })

  collector.on("collect",async i=>{

   await i.deferUpdate()

   if(i.customId==="cancel_sell_dup"){
    return interaction.editReply({
     content:"❌ Vente annulée.",
     embeds:[],
     components:[]
    })
   }

   /* ======== CONFIRMATION : VENDRE ======== */

   const cardsByIdFresh = getCardsById()

   const soldLines=[]

   for(const item of toSell){

    const card=cardsByIdFresh[item.id]
    if(!card) continue

    /* Retirer les cartes */
    user.cards[item.id]-=item.duplicates

    if(user.cards[item.id]<=0)
     delete user.cards[item.id]

    /* Ajouter les kamas */
    user.kamas = (user.kamas || 0) + (item.duplicates * item.price)

    /* Stats */
    user.stats.cardsSold=(user.stats.cardsSold||0)+item.duplicates

    soldLines.push(
`${RARITY_EMOJI[card.rarity]} **${card.name}** ×${item.duplicates}`
    )

   }

   /* FIX CRITIQUE : save avec userId ciblé pour garantir la persistance */
   save(interaction.user.id)

   const unlocked = achievementCheck(user,"economy")

   const resultEmbed=new EmbedBuilder()
    .setTitle("💰 Doublons vendus")
    .setDescription(
`${soldLines.slice(0,20).join("\n")}
${soldLines.length > 20 ? `\n... et ${soldLines.length - 20} autres` : ""}

Cartes vendues : **${totalCards}**
Gain total : **${totalKamas} kamas**
💰 Nouveau solde : **${user.kamas} kamas**`
    )

   await interaction.editReply({
    embeds:[resultEmbed],
    components:[]
   })

   if(unlocked.length)
    await notifyAchievements(interaction,unlocked)

  })

 }

}