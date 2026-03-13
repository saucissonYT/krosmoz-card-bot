const {
 EmbedBuilder,
 ActionRowBuilder,
 ButtonBuilder,
 ButtonStyle
} = require("discord.js")

function mainMenu(){

 const embed = new EmbedBuilder()
  .setTitle("📖 Aide Krosmoz")
  .setDescription(
`Bienvenue dans **Krosmoz Card Bot**

🎴 Ouvre des packs
📚 Collectionne des cartes
💰 Gagne des kamas
⭐ Progresse et débloque des succès

Choisis une catégorie ci-dessous.`
  )
  .setColor(0xF1C40F)

 const row = new ActionRowBuilder()
  .addComponents(

   new ButtonBuilder()
    .setCustomId("help_cards")
    .setLabel("Cartes")
    .setEmoji("🎴")
    .setStyle(ButtonStyle.Primary),

   new ButtonBuilder()
    .setCustomId("help_economy")
    .setLabel("Économie")
    .setEmoji("💰")
    .setStyle(ButtonStyle.Success),

   new ButtonBuilder()
    .setCustomId("help_collection")
    .setLabel("Collection")
    .setEmoji("📚")
    .setStyle(ButtonStyle.Secondary),

   new ButtonBuilder()
    .setCustomId("help_progress")
    .setLabel("Progression")
    .setEmoji("⭐")
    .setStyle(ButtonStyle.Danger)

  )

 return {embed,row}

}

function backButton(){

 return new ActionRowBuilder()
  .addComponents(
   new ButtonBuilder()
    .setCustomId("help_back")
    .setLabel("Retour")
    .setEmoji("⬅")
    .setStyle(ButtonStyle.Secondary)
  )

}

module.exports = {

 name:"kroshelp",
 description:"Afficher l'aide du bot",

 async execute(interaction){

  const menu = mainMenu()

  await interaction.reply({
   embeds:[menu.embed],
   components:[menu.row],
   ephemeral:true
  })

 },

 async button(interaction){

  let embed
  let row

  /* RETOUR */

  if(interaction.customId === "help_back"){

   const menu = mainMenu()

   return interaction.update({
    embeds:[menu.embed],
    components:[menu.row]
   })

  }

  /* CARTES */

  if(interaction.customId === "help_cards"){

   embed = new EmbedBuilder()
    .setTitle("🎴 Commandes Cartes")
    .setDescription(
`/krosmoz → Ouvrir un pack
/krosmoz set:<nom> → Ouvrir un pack d'un set

/inventaire → Voir ton inventaire
/carte numero:<n> → Voir une carte

/listcards → Voir toutes les cartes

/fusion → Fusionner 5 cartes pour obtenir une carte plus rare

/trade → Échanger une carte avec un joueur`
    )
    .setColor(0x3498DB)

   row = backButton()

  }

  /* ECONOMIE */

  if(interaction.customId === "help_economy"){

   embed = new EmbedBuilder()
    .setTitle("💰 Économie")
    .setDescription(
`/balance → Voir tes kamas

/buypack → Acheter un pack

/sellcard → Vendre une carte
/sellall → Vendre tout
/sellduplicates → Vendre les doublons

/market → Voir le marché`
    )
    .setColor(0x2ECC71)

   row = backButton()

  }

  /* COLLECTION */

  if(interaction.customId === "help_collection"){

   embed = new EmbedBuilder()
    .setTitle("📚 Collection")
    .setDescription(
`/sets → Voir tous les sets

/set nom:<set> → Voir les cartes d'un set

/pity → Voir ta progression pity

/achievements → Voir tes succès`
    )
    .setColor(0x9B59B6)

   row = backButton()

  }

  /* PROGRESSION */

  if(interaction.customId === "help_progress"){

   embed = new EmbedBuilder()
    .setTitle("⭐ Progression")
    .setDescription(
`/profil → Voir ton profil

/leaderboard → Classement des joueurs

/daily → Récompense quotidienne

/titre → Choisir ton titre

/kroshelp → Afficher l'aide`
    )
    .setColor(0xE74C3C)

   row = backButton()

  }

  await interaction.update({
   embeds:[embed],
   components:[row]
  })

 }

}