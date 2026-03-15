const { data } = require("../../systems/dataManager")
const cards = data.cards || []

const { getUser, save } = require("../../systems/userSystem")
const { achievementCheck } = require("../../systems/achievementCheck")

const rarityEmoji={
 C:"⚪",U:"🟢",R:"🔵",SR:"🟣",
 HR:"🔴",UR:"🟡",S:"✨",SSR:"🌈"
}

const rarityPrice={
 C:5,
 U:10,
 R:20,
 SR:40,
 HR:80,
 UR:150,
 S:250,
 SSR:500
}

module.exports={

 name:"sellcard",

 options:[
  {name:"id",type:4,required:true}
 ],

 async execute(interaction){

  const user=getUser(interaction.user.id)

  if(!user.stats) user.stats={}

  const id=interaction.options.getInteger("id")

  const card=cards.find(c=>c.id===id)

  if(!card)
   return interaction.reply({
    content:"❌ Carte introuvable.",
    ephemeral:true
   })

  if(!user.cards || !user.cards[id])
   return interaction.reply({
    content:"❌ Tu ne possèdes pas cette carte.",
    ephemeral:true
   })

  const price=rarityPrice[card.rarity] || 10

  /* retirer carte */

  user.cards[id]--

  if(user.cards[id]<=0)
   delete user.cards[id]

  /* donner kamas */

  user.kamas=(user.kamas||0)+price

  /* stats */

  user.stats.cardsSold=(user.stats.cardsSold||0)+1

  /* achievements */

  await achievementCheck(interaction,user)

  save()

  interaction.reply({
   content:`💰 Carte vendue

${rarityEmoji[card.rarity]} **${card.name}**
Gain : **${price} kamas**`,
   ephemeral:true
  })

 }

}