const {
 EmbedBuilder,
 ActionRowBuilder,
 ButtonBuilder,
 ButtonStyle
} = require("discord.js")

const { isDev } = require("../../systems/devSystem")

/* ---------------- MENU PRINCIPAL ---------------- */

function mainMenu(){

 const embed = new EmbedBuilder()
  .setTitle("🛠 Aide Développeur")
  .setDescription(
`Commandes réservées aux développeurs.

Choisis une catégorie :`
  )
  .setColor(0xE67E22)

 const row = new ActionRowBuilder().addComponents(

  new ButtonBuilder()
   .setCustomId("devhelp_admin")
   .setLabel("Admin")
   .setEmoji("👑")
   .setStyle(ButtonStyle.Danger),

  new ButtonBuilder()
   .setCustomId("devhelp_cards")
   .setLabel("Cartes")
   .setEmoji("🃏")
   .setStyle(ButtonStyle.Primary),

  new ButtonBuilder()
   .setCustomId("devhelp_packs")
   .setLabel("Packs")
   .setEmoji("📦")
   .setStyle(ButtonStyle.Primary),

  new ButtonBuilder()
   .setCustomId("devhelp_sets")
   .setLabel("Sets")
   .setEmoji("📚")
   .setStyle(ButtonStyle.Secondary),

  new ButtonBuilder()
   .setCustomId("devhelp_system")
   .setLabel("Systèmes")
   .setEmoji("⚙️")
   .setStyle(ButtonStyle.Success)

 )

 return {embed,row}

}

function backButton(){

 return new ActionRowBuilder().addComponents(

  new ButtonBuilder()
   .setCustomId("devhelp_back")
   .setLabel("Retour")
   .setEmoji("⬅")
   .setStyle(ButtonStyle.Secondary)

 )

}

/* ---------------- MODULE ---------------- */

module.exports = {

 name:"devhelp",
 description:"Afficher les commandes développeur",

 async execute(interaction){

  if(!isDev(interaction.user.id))
   return interaction.reply({
    content:"Commande développeur.",
    ephemeral:true
   })

  const menu = mainMenu()

  interaction.reply({
   embeds:[menu.embed],
   components:[menu.row],
   ephemeral:true
  })

 },

 async button(interaction){

  let embed
  let row

  /* -------- RETOUR -------- */

  if(interaction.customId === "devhelp_back"){

   const menu = mainMenu()

   return interaction.update({
    embeds:[menu.embed],
    components:[menu.row]
   })

  }

  /* -------- ADMIN -------- */

  if(interaction.customId === "devhelp_admin"){

   embed = new EmbedBuilder()
    .setTitle("👑 Commandes Admin")
    .setDescription(
`/event → Lancer un événement
/stats → Statistiques du bot`
    )
    .setColor(0xE74C3C)

   row = backButton()

  }

  /* -------- CARTES -------- */

  if(interaction.customId === "devhelp_cards"){

   embed = new EmbedBuilder()
    .setTitle("🃏 Commandes Cartes")
    .setDescription(
`/addcard → Ajouter une carte
/editcard → Modifier une carte
/removecard → Supprimer une carte
/previewcard → Prévisualiser une carte
/importcards → Importer plusieurs cartes`
    )
    .setColor(0x3498DB)

   row = backButton()

  }

  /* -------- PACKS -------- */

  if(interaction.customId === "devhelp_packs"){

   embed = new EmbedBuilder()
    .setTitle("📦 Commandes Packs")
    .setDescription(
`/devpack → Générer un pack test
/simpack → Simulation d'ouverture
/hardpity → Forcer une pity SSR`
    )
    .setColor(0x9B59B6)

   row = backButton()

  }

  /* -------- SETS -------- */

  if(interaction.customId === "devhelp_sets"){

   embed = new EmbedBuilder()
    .setTitle("📚 Commandes Sets")
    .setDescription(
`/setcreate → Créer un set
/setdelete → Supprimer un set
/setedit → Modifier un set
/setlist → Voir les sets
/setbalance → Balance d'un set
/setreward → Modifier récompenses
/setstats → Stats du set`
    )
    .setColor(0x1ABC9C)

   row = backButton()

  }

  /* -------- SYSTEMES -------- */

  if(interaction.customId === "devhelp_system"){

   embed = new EmbedBuilder()
    .setTitle("⚙️ Commandes Systèmes")
    .setDescription(
`/collection → Voir la collection d'un joueur
/devgive → Donner une carte
/removedev → Retirer un développeur

/cooldown → Voir cooldowns
/resetcooldown → Reset cooldowns

/resetpity → Reset pity joueur

/krosmodev → Mode développeur
/krosmoreload → Reload systèmes et commandes`
    )
    .setColor(0x2ECC71)

   row = backButton()

  }

  await interaction.update({
   embeds:[embed],
   components:[row]
  })

 }

}