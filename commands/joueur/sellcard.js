const { data } = require("../../systems/dataManager")
const cards = data.cards || []

const { getUser, save } = require("../../systems/userSystem")

module.exports={

 name:"sellcard",

 options:[
  {name:"id",type:4,required:true}
 ],

 async execute(interaction){

  const user=getUser(interaction.user.id)

  const id=interaction.options.getInteger("id")

  const card=cards.find(c=>c.id===id)

  if(!card)
   return interaction.reply("Carte introuvable.")

  if(!user.cards[id])
   return interaction.reply("Tu ne possèdes pas cette carte.")

  user.cards[id]--

  if(user.cards[id]<=0)
   delete user.cards[id]

  user.kamas+=10

  save()

  interaction.reply(`💰 Carte vendue : ${card.name}`)

 }

}