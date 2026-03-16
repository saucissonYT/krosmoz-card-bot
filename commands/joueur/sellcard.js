const {
 ActionRowBuilder,
 StringSelectMenuBuilder
} = require("discord.js")

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

const rarityPrice={
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

 name:"sellcard",
 description:"Vendre une carte",

 async execute(interaction){

  const user=getUser(interaction.user.id)

  if(!user.cards || Object.keys(user.cards).length===0)
   return interaction.reply({
    content:"❌ Tu n'as aucune carte.",
    ephemeral:true
   })

  const options=[]

  for(const id in user.cards){

   const card=cardsById[id]
   if(!card) continue

   const price = rarityPrice[card.rarity] || 1
   const owned = user.cards[id]

   options.push({
    label:`${rarityEmoji[card.rarity]} ${card.name}`,
    value:id,
    description:`Possédé: x${owned} • Vente: ${price} • Total: ${owned*price}`
   })

  }

  if(options.length===0)
   return interaction.reply({
    content:"❌ Aucune carte vendable.",
    ephemeral:true
   })

  const menu=new StringSelectMenuBuilder()
   .setCustomId("sellcard_select")
   .setPlaceholder("💰 Choisir une carte à vendre")
   .addOptions(options.slice(0,25))

  const row=new ActionRowBuilder().addComponents(menu)

  await interaction.reply({
   content:"💰 **Sélectionne une carte à vendre**",
   components:[row],
   ephemeral:true
  })

 },

 async select(interaction){

  if(interaction.customId!=="sellcard_select") return

  const user=getUser(interaction.user.id)

  const id=interaction.values[0]

  const card=cardsById[id]

  if(!card)
   return interaction.update({
    content:"❌ Carte introuvable.",
    components:[]
   })

  if(!user.cards || !user.cards[id])
   return interaction.update({
    content:"❌ Tu ne possèdes plus cette carte.",
    components:[]
   })

  const price=rarityPrice[card.rarity]||1

  user.cards[id]--

  if(user.cards[id]<=0)
   delete user.cards[id]

  user.kamas=(user.kamas||0)+price

  if(!user.stats) user.stats={}
  user.stats.cardsSold=(user.stats.cardsSold||0)+1

  save()

  await interaction.update({
   content:`💰 **Carte vendue**

${rarityEmoji[card.rarity]} **${card.name}**
+${price} kamas

💰 Solde : **${user.kamas} kamas**`,
   components:[]
  })

  await achievementCheck(interaction,user)

 }

}