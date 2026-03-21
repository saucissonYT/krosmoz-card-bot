const {
 SlashCommandBuilder,
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

 return { embed, row }

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

 data: new SlashCommandBuilder()
  .setName("devhelp")
  .setDescription("Afficher les commandes développeur"),

 async execute(interaction){

  if(!isDev(interaction.user.id))
   return interaction.reply({
    content:"⛔ Commande développeur.",
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
`/krosmodev → Donner/retirer le rang développeur
/removedev → Ajouter ou retirer un dev
/krosmoreload → Reload systèmes et commandes
/stats → Statistiques du bot
/event → Lancer un événement`
    )
    .setColor(0xE74C3C)

   row = backButton()

  }

  /* -------- CARTES -------- */

  if(interaction.customId === "devhelp_cards"){

   embed = new EmbedBuilder()
    .setTitle("🃏 Commandes Cartes")
    .setDescription(
`/addcard → Ajouter une carte (nom, rareté, set, image)
/editcard → Modifier une carte (nom, rareté, set)
/removecard → Supprimer une ou plusieurs cartes (IDs)
/previewcard → Prévisualiser une carte
/importcards → Importer des cartes depuis cards/import`
    )
    .setColor(0x3498DB)

   row = backButton()

  }

  /* -------- PACKS -------- */

  if(interaction.customId === "devhelp_packs"){

   embed = new EmbedBuilder()
    .setTitle("📦 Commandes Packs")
    .setDescription(
`/simpack → Simulation d'ouverture (drops + économie)
/hardpity → Forcer une hard pity UR/S/SSR`
    )
    .setColor(0x9B59B6)

   row = backButton()

  }

  /* -------- SETS -------- */

  if(interaction.customId === "devhelp_sets"){

   embed = new EmbedBuilder()
    .setTitle("📚 Commandes Sets")
    .setDescription(
`/setcreate → Créer un set (nom + reward)
/setdelete → Supprimer un set
/setedit → Distribution des raretés par set
/setlist → Voir tous les sets avec stats
/setreward → Modifier la récompense d'un set
/setstats → Stats détaillées d'un set`
    )
    .setColor(0x1ABC9C)

   row = backButton()

  }

  /* -------- SYSTEMES -------- */

  if(interaction.customId === "devhelp_system"){

   embed = new EmbedBuilder()
    .setTitle("⚙️ Commandes Systèmes")
    .setDescription(
`/devgive → Donner une carte à un joueur
/devdaily → Simuler un daily (normal, double, SSR, streak)
/devachievement → Ajouter/supprimer un achievement
/checkachievement → Audit complet des achievements (console)

/cooldown → Voir les cooldowns d'un joueur
/resetcooldown → Reset les cooldowns
/resetpity → Reset la pity d'un joueur

/collection → Voir la collection d'un joueur`
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