const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js")

const { data } = require("../../systems/dataManager")
const cards = data.cards || []

const { getUser, save } = require("../../systems/userSystem")
const { achievementCheck } = require("../../systems/achievementCheck")

const cardsById={}
for(const c of cards){
 cardsById[c.id]=c
}

const rarityEmoji={
 C:"⚪",U:"🟢",R:"🔵",SR:"🟣",
 HR:"🔴",UR:"🟡",S:"✨",SSR:"🌈"
}

/* 50% valeur economy */

const sellValues={
 C:2,
 U:5,
 R:10,
 SR:20,
 HR:40,
 UR:75,
 S:150,
 SSR:500
}

module.exports={

 name:"sellduplicates",

 async execute(interaction){

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
   const price = sellValues[card.rarity] || 10

   totalCards += duplicates
   totalKamas += duplicates * price

   toSell.push({
    id,
    duplicates,
    price
   })

   previewLines.push(
`${rarityEmoji[card.rarity]} **${card.name}** ×${duplicates} → ${duplicates*price} kamas`
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

  const collector=msg.createMessageComponentCollector({
   time:30000,
   max:1
  })

  collector.on("collect",async i=>{

   if(i.user.id!==interaction.user.id)
    return i.reply({content:"Pas ta vente.",ephemeral:true})

   if(i.customId==="cancel_sell_dup")
    return i.update({
     content:"❌ Vente annulée.",
     embeds:[],
     components:[]
    })

   const soldLines=[]

   for(const item of toSell){

    const card=cardsById[item.id]

    user.cards[item.id]-=item.duplicates

    if(user.cards[item.id]<=0)
     delete user.cards[item.id]

    user.kamas+=item.duplicates*item.price

    user.stats.cardsSold=(user.stats.cardsSold||0)+item.duplicates

    soldLines.push(
`${rarityEmoji[card.rarity]} **${card.name}** ×${item.duplicates}`
    )

   }

   await achievementCheck(i,user)

   save()

   const resultEmbed=new EmbedBuilder()
    .setTitle("💰 Doublons vendus")
    .setDescription(
`${soldLines.slice(0,20).join("\n")}

Cartes vendues : **${totalCards}**
Gain total : **${totalKamas} kamas**`
    )

   i.update({
    embeds:[resultEmbed],
    components:[]
   })

  })

 }

}