const { EmbedBuilder } = require("discord.js")

const users = require("../../database/users.json")
const cards = require("../../cards/cards.json")
const { isDev } = require("../../systems/devSystem")

module.exports = {

 name:"collection",
 description:"Statistiques globales des collections",

 async execute(interaction){

  if(!isDev(interaction.user.id))
   return interaction.reply({
    content:"Commande dev.",
    ephemeral:true
   })

  const totalUsers = Object.keys(users).length

  let totalOwnedCards = 0
  let uniqueCardsOwned = new Set()

  let topUser = null
  let topCount = 0

  for(const id in users){

   const user = users[id]

   if(!user.cards) continue

   let count = 0

   for(const cardId in user.cards){

    const qty = user.cards[cardId]

    totalOwnedCards += qty
    count += qty

    uniqueCardsOwned.add(cardId)

   }

   if(count > topCount){

    topCount = count
    topUser = id

   }

  }

  const totalCardsExisting = cards.cards.length
  const uniqueCollected = uniqueCardsOwned.size

  const completion = Math.floor((uniqueCollected / totalCardsExisting) * 100)

  const embed = new EmbedBuilder()
   .setTitle("📊 Statistiques des collections")
   .addFields(
    {
     name:"👥 Joueurs",
     value:`${totalUsers}`,
     inline:true
    },
    {
     name:"🎴 Cartes possédées",
     value:`${totalOwnedCards}`,
     inline:true
    },
    {
     name:"🃏 Cartes existantes",
     value:`${totalCardsExisting}`,
     inline:true
    },
    {
     name:"📚 Cartes uniques collectées",
     value:`${uniqueCollected} (${completion}%)`,
     inline:false
    },
    {
     name:"🏆 Plus grosse collection",
     value: topUser
      ? `<@${topUser}> — ${topCount} cartes`
      : "Aucun joueur",
     inline:false
    }
   )

  interaction.reply({ embeds:[embed] })

 }

}