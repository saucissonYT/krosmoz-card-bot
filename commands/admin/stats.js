const { getUsers } = require("../../systems/userSystem")
const { data } = require("../../systems/dataManager")
const { isDev } = require("../../systems/devSystem")
const { getMarket } = require("../../systems/market")

module.exports = {

 name:"stats",

 async execute(interaction){

  if(!isDev(interaction.user.id))
   return interaction.reply({
    content:"Commande dev.",
    ephemeral:true
   })

  const users = getUsers()
  const cards = data.cards || []
  const market = getMarket()

  const totalUsers = Object.keys(users).length

  let totalCards = 0
  let totalKamas = 0
  let totalPacks = 0
  let totalFusions = 0
  let totalSSR = 0

  for(const userId in users){

   const user = users[userId]

   /* CARTES */

   if(user.cards){

    for(const cardId in user.cards){

     const qty = user.cards[cardId]

     totalCards += qty

     const card = cards.find(c=>c.id==cardId)

     if(card?.rarity==="SSR")
      totalSSR += qty

    }

   }

   /* KAMAS */

   totalKamas += user.kamas || 0

   /* STATS */

   totalPacks += user.stats?.packsOpened || 0
   totalFusions += user.stats?.fusions || 0

  }

  const stats =
`📊 **Statistiques du bot**

👥 Joueurs : ${totalUsers}

🎴 Cartes possédées : ${totalCards}
🃏 Cartes existantes : ${cards.length}
🌈 Cartes SSR : ${totalSSR}

💰 Kamas totaux : ${totalKamas}

📦 Packs ouverts : ${totalPacks}
⚗️ Fusions : ${totalFusions}

🛒 Listings marché : ${market?.length || 0}
`

  interaction.reply(stats)

 }

}