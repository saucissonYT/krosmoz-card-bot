const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js")

const cardsData = require("../../cards/cards.json")
const cards = Array.isArray(cardsData) ? cardsData : cardsData.cards

const { getUser, save } = require("../../systems/userSystem")
const { achievementCheck } = require("../../systems/achievementCheck")

const cardsById={}
for(const c of cards){
 cardsById[c.id]=c
}

const sellValues={
 C:5,
 U:10,
 R:25,
 SR:60,
 HR:120,
 UR:300,
 S:600,
 SSR:1500
}

module.exports={

 name:"sellduplicates",

 async execute(interaction){

  const user = getUser(interaction.user.id)

  if(!user.cards || Object.keys(user.cards).length===0)
   return interaction.reply("Inventaire vide.")

  let totalCards=0
  let totalKamas=0

  const toSell=[]

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

  }

  if(totalCards===0)
   return interaction.reply("Aucun doublon à vendre.")

  const embed=new EmbedBuilder()
   .setTitle("⚠️ Vente des doublons")
   .setDescription(
`${totalCards} cartes seront vendues

Gain : **${totalKamas} kamas**`
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

   for(const item of toSell){

    user.cards[item.id]-=item.duplicates

    if(user.cards[item.id]<=0)
     delete user.cards[item.id]

    user.kamas+=item.duplicates*item.price

    user.stats.cardsSold=(user.stats.cardsSold||0)+item.duplicates

   }

   await achievementCheck(interaction,user)

   save()

   i.update({
    content:`💰 Doublons vendus !

Cartes vendues : ${totalCards}
Gain : **${totalKamas} kamas**

Solde : ${user.kamas} kamas`,
    embeds:[],
    components:[]
   })

  })

 }

}