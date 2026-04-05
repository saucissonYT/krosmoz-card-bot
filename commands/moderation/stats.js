/* ═══════════════════════════════════════════════════════════════
   /stats — Statistiques globales du bot (commande dev)

   MODIFICATIONS :
   - Supprimé `const cards = data.cards || []` au top-level (snapshot)
     → utilise `getCards()` dynamique depuis cardRegistry
   - Supprimé l'import direct de `data` depuis dataManager pour les cartes
   - Utilise `getMarket()` au lieu de `getMarket()` (déjà en place)
   - Ajout de JSDoc
   - Ajout du compteur de guildes et du nombre de sets
═══════════════════════════════════════════════════════════════ */

const { getUsers }   = require("../../systems/userSystem")
const { getCards }    = require("../../systems/cardRegistry")
const { isDev }       = require("../../systems/devSystem")
const { getMarket }   = require("../../systems/market")

module.exports = {

 name: "stats",

 /**
  * Affiche les statistiques globales du bot :
  * nombre de joueurs, cartes possédées, kamas, packs, fusions, etc.
  *
  * @param {import("discord.js").ChatInputCommandInteraction} interaction
  */
 async execute(interaction) {

  if (!isDev(interaction.user.id))
   return interaction.reply({
    content: "⛔ Commande dev.",
    ephemeral: true
   })

  /* Lecture dynamique des cartes (pas de snapshot statique) */
  const cards  = getCards()
  const users  = getUsers()
  const market = getMarket()

  const totalUsers = Object.keys(users).length

  let totalCards   = 0
  let totalKamas   = 0
  let totalPacks   = 0
  let totalFusions = 0
  let totalSSR     = 0
  let totalShiny   = 0

  for (const userId in users) {

   const user = users[userId]

   /* CARTES */
   if (user.cards) {
    for (const cardId in user.cards) {

     const qty = user.cards[cardId]
     totalCards += qty

     const card = cards.find(c => c.id == cardId)
     if (card?.rarity === "SSR") totalSSR += qty
    }
   }

   /* SHINY */
   if (user.shinyCards) {
    for (const cardId in user.shinyCards) {
     totalShiny += user.shinyCards[cardId]
    }
   }

   /* KAMAS */
   totalKamas += user.kamas || 0

   /* STATS */
   totalPacks   += user.stats?.packsOpened || 0
   totalFusions += user.stats?.fusions || 0
  }

  /* Nombre de sets distincts */
  const sets = [...new Set(cards.map(c => c.set))]

  const stats =
`📊 **Statistiques du bot**

👥 Joueurs : ${totalUsers.toLocaleString("fr-FR")}

🎴 Cartes possédées : ${totalCards.toLocaleString("fr-FR")}
🃏 Cartes existantes : ${cards.length.toLocaleString("fr-FR")}
📚 Sets : ${sets.length}
🌈 Cartes SSR : ${totalSSR.toLocaleString("fr-FR")}
✨ Cartes Shiny : ${totalShiny.toLocaleString("fr-FR")}

💰 Kamas totaux : ${totalKamas.toLocaleString("fr-FR")}

📦 Packs ouverts : ${totalPacks.toLocaleString("fr-FR")}
⚗️ Fusions : ${totalFusions.toLocaleString("fr-FR")}

🛒 Listings marché : ${market?.length || 0}`

  interaction.reply(stats)
 }
}