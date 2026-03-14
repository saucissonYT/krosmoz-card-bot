const { data } = require("../../systems/dataManager")
const cards = data.cards || []

const { getUser, save } = require("../../systems/userSystem")

module.exports={

 name:"sellall",

 async execute(interaction){

  const user=getUser(interaction.user.id)

  if(!user.cards)
   return interaction.reply("Inventaire vide.")

  let total=0

  for(const id in user.cards){

   const count=user.cards[id]

   total+=count*10

   delete user.cards[id]

  }

  user.kamas+=total

  save()

  interaction.reply(`💰 Vente totale : ${total} kamas`)

 }

}