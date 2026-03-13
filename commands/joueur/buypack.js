const {
 ActionRowBuilder,
 ButtonBuilder,
 ButtonStyle,
 EmbedBuilder
} = require("discord.js")

const { getUser, save } = require("../../systems/userSystem")
const { giveAchievement } = require("../../systems/achievementSystem")
const { achievementCheck } = require("../../systems/achievementCheck")

module.exports = {

 name:"buypack",
 description:"Acheter un pack",

 async execute(interaction){

  const user = getUser(interaction.user.id)

  const price = 1250

  if(user.kamas < price)
   return interaction.reply({
    content:"❌ Pas assez de kamas.",
    ephemeral:true
   })

  const embed = new EmbedBuilder()
   .setTitle("🎴 Acheter un pack")
   .setDescription(
`Prix : **${price} kamas**

💰 Solde : **${user.kamas}**
📦 Packs : **${user.packs || 0}**

Confirmer l'achat ?`
   )
   .setColor("#f1c40f")

  const row = new ActionRowBuilder().addComponents(

   new ButtonBuilder()
    .setCustomId("buy_pack_confirm")
    .setLabel("Acheter")
    .setStyle(ButtonStyle.Success),

   new ButtonBuilder()
    .setCustomId("buy_pack_cancel")
    .setLabel("Annuler")
    .setStyle(ButtonStyle.Secondary)

  )

  const msg = await interaction.reply({
   embeds:[embed],
   components:[row],
   fetchReply:true
  })

  const collector = msg.createMessageComponentCollector({ time:30000 })

  collector.on("collect",async i=>{

   if(i.user.id !== interaction.user.id)
    return i.reply({
     content:"Pas ton achat.",
     ephemeral:true
    })

   if(i.customId === "buy_pack_cancel")
    return i.update({
     content:"❌ Achat annulé.",
     embeds:[],
     components:[]
    })

   if(i.customId === "buy_pack_confirm"){

    if(user.kamas < price)
     return i.update({
      content:"❌ Plus assez de kamas.",
      embeds:[],
      components:[]
     })

    user.kamas -= price
    user.packs = (user.packs || 0) + 1

    if(!user.stats) user.stats={}
    user.stats.packsBought=(user.stats.packsBought||0)+1

    const bought=user.stats.packsBought

    if(bought===1) giveAchievement(user,"buy1")
    if(bought===10) giveAchievement(user,"buy10")
    if(bought===50) giveAchievement(user,"buy50")
    if(bought===200) giveAchievement(user,"buy200")

    await achievementCheck(interaction,user)

    save()

    return i.update({
     content:
`🎴 **Pack acheté !**

📦 Packs disponibles : **${user.packs}**
💰 Solde : **${user.kamas} kamas**

Utilise **/krosmoz** pour l'ouvrir.`,
     embeds:[],
     components:[]
    })

   }

  })

 }

}