const users = require("../../database/users.json")
const cards = require("../../cards/cards.json")
const {isDev} = require("../../systems/devSystem")

module.exports = {

 name:"stats",

 async execute(interaction){

  if(!isDev(interaction.user.id))
   return interaction.reply({
    content:"Commande dev.",
    ephemeral:true
   })

  const totalUsers = Object.keys(users).length

  let totalCards = 0

  for(const userId in users){

   const user = users[userId]

   if(!user.cards) continue

   for(const cardId in user.cards){

    totalCards += user.cards[cardId]

   }

  }

  const stats =
`👥 Joueurs : ${totalUsers}
🎴 Cartes possédées : ${totalCards}
🃏 Cartes existantes : ${cards.cards.length}`

  interaction.reply(stats)

 }

}