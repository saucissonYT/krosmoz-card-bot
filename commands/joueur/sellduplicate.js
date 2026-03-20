const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js")

/*
 * FIX: rarityEmoji et sellValues étaient hardcodés localement.
 * Remplacés par RARITY_EMOJI et SELL_PRICE depuis constants.js
 * pour garantir la cohérence avec le reste du projet.
 */
const { RARITY_EMOJI, SELL_PRICE } = require("../../systems/constants")

const { getCardsById } = require("../../systems/cardRegistry")
const { getUser, save, updateActivityStreak } = require("../../systems/userSystem")
const { achievementCheck } = require("../../systems/achievementCheck")
const { notifyAchievements } = require("../../systems/achievementNotifier")

module.exports={

 name:"sellduplicates",

 async execute(interaction){

  // Fix : appel au moment de l'exécution, pas au chargement du module
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

   if(i.customId==="cancel_sell_dup")
    return interaction.editReply({
     content:"❌ Vente annulée.",
     embeds:[],
     components:[]
    })

   /* VENTE */

   let soldCards=0
   let soldKamas=0

   for(const item of toSell){

    user.cards[item.id] -= item.duplicates

    if(user.cards[item.id]<=0)
     delete user.cards[item.id]

    const gain = item.duplicates * item.price

    user.kamas = (user.kamas||0) + gain

    soldCards += item.duplicates
    soldKamas += gain

   }

   user.stats.cardsSold = (user.stats.cardsSold||0) + soldCards

   /* FIX: sellFast tracking */
   if(user.lastPack && Date.now() - user.lastPack < 60000){
    user.stats.sellFast = (user.stats.sellFast||0) + 1
   }

   updateActivityStreak(user)

   save(interaction.user.id)

   const unlocked = [
    ...achievementCheck(user,"economy"),
    ...achievementCheck(user,"collection"),
    ...achievementCheck(user,"pack")
   ]

   await interaction.editReply({
    content:
`💰 **Doublons vendus !**

🎴 Cartes vendues : **${soldCards}**
💰 Kamas gagnés : **${soldKamas}**

💰 Solde : **${user.kamas} kamas**`,
    embeds:[],
    components:[]
   })

   if(unlocked.length)
    await notifyAchievements(interaction,unlocked)

  })

 }

}