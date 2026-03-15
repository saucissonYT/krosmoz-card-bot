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

 const row = new ActionRowBuilder().addComponents(

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

 return new ActionRowBuilder().addComponents(
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
   components:[menu.row]
  })

 },

 async button(interaction){

  let embed
  let row

  /* RETOUR */

  if(interaction.customId==="help_back"){

   const menu=mainMenu()

   return interaction.update({
    embeds:[menu.embed],
    components:[menu.row]
   })

  }

  /* CARTES */

  if(interaction.customId==="help_cards"){

   embed=new EmbedBuilder()
    .setTitle("🎴 Commandes Cartes")
    .setDescription(
`/krosmoz → Ouvrir un pack

/inventaire → Voir ton inventaire
/carte id:<id> → Voir une carte précise

/listcards → Explorer les cartes

/fusion → Fusionner des cartes
/trade → Échanger des cartes`
    )
    .setColor(0x3498DB)

   row=backButton()

  }

  /* ECONOMIE */

  if(interaction.customId==="help_economy"){

   embed=new EmbedBuilder()
    .setTitle("💰 Économie")
    .setDescription(
`/buypack → Acheter un pack

/sellcard → Vendre une carte
/sellduplicates → Vendre tes doublons

/market → Accéder au marché`
    )
    .setColor(0x2ECC71)

   row=backButton()

  }

  /* COLLECTION */

  if(interaction.customId==="help_collection"){

   embed=new EmbedBuilder()
    .setTitle("📚 Collection")
    .setDescription(
`/inventaire → Voir ta collection

/listcards → Explorer toutes les cartes

/carte id:<id> → Voir une carte précise

/pity → Voir ton pity par set

/achievements → Voir tes succès`
    )
    .setColor(0x9B59B6)

   row=backButton()

  }

  /* PROGRESSION */

  if(interaction.customId==="help_progress"){

   embed=new EmbedBuilder()
    .setTitle("⭐ Progression")
    .setDescription(
`/profil → Voir ton profil joueur

/daily → Récompense quotidienne

/kroshelp → Afficher cette aide`
    )
    .setColor(0xE74C3C)

   row=backButton()

  }

  await interaction.update({
   embeds:[embed],
   components:[row]
  })

 }

}