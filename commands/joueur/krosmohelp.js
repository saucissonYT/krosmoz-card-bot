const {
 EmbedBuilder,
 ActionRowBuilder,
 ButtonBuilder,
 ButtonStyle
} = require("discord.js")

const { getUser } = require("../../systems/userSystem")
const { achievementCheck } = require("../../systems/achievementCheck")
const { notifyAchievements } = require("../../systems/achievementNotifier")

function mainMenu(){

 const embed = new EmbedBuilder()
  .setTitle("📖 Aide Krosmoz")
  .setDescription(
`Bienvenue dans **Krosmoz Card Bot** !

🎴 Ouvre des packs et collectionne des cartes
📚 Complète des sets (Incarnam, Astrub, Amakna)
💰 Gagne des kamas et fais du commerce
⚗️ Fusionne tes doublons pour monter en rareté
🎪 Participe aux events des Dieux du Krosmoz
⭐ Progresse, débloque des succès et des titres

Choisis une catégorie ci-dessous.`
  )
  .setColor(0xF1C40F)

 const row1 = new ActionRowBuilder().addComponents(

  new ButtonBuilder()
   .setCustomId("help_packs")
   .setLabel("Packs")
   .setEmoji("🎴")
   .setStyle(ButtonStyle.Primary),

  new ButtonBuilder()
   .setCustomId("help_collection")
   .setLabel("Collection")
   .setEmoji("📚")
   .setStyle(ButtonStyle.Primary),

  new ButtonBuilder()
   .setCustomId("help_economy")
   .setLabel("Économie")
   .setEmoji("💰")
   .setStyle(ButtonStyle.Success),

  new ButtonBuilder()
   .setCustomId("help_gameplay")
   .setLabel("Gameplay")
   .setEmoji("⚔️")
   .setStyle(ButtonStyle.Secondary)

 )

 const row2 = new ActionRowBuilder().addComponents(

  new ButtonBuilder()
   .setCustomId("help_progress")
   .setLabel("Progression")
   .setEmoji("⭐")
   .setStyle(ButtonStyle.Danger),

  new ButtonBuilder()
   .setCustomId("help_events")
   .setLabel("Events")
   .setEmoji("🎪")
   .setStyle(ButtonStyle.Primary),

  new ButtonBuilder()
   .setCustomId("help_rng")
   .setLabel("RNG & Pity")
   .setEmoji("🎲")
   .setStyle(ButtonStyle.Secondary)

 )

 return { embed, components:[row1, row2] }

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

 name:"krosmohelp",
 description:"Afficher l'aide du bot",

 async execute(interaction){

  const user = getUser(interaction.user.id)

  if(!user.stats) user.stats={}
  user.stats.helpOpen=(user.stats.helpOpen||0)+1

  const menu = mainMenu()

  const unlocked = achievementCheck(user,"social")

  await interaction.reply({
   embeds:[menu.embed],
   components:menu.components
  })

  if(unlocked.length)
   await notifyAchievements(interaction,unlocked)

 },

 async button(interaction){

  let embed
  let row

  if(interaction.customId==="help_back"){

   const menu=mainMenu()

   return interaction.update({
    embeds:[menu.embed],
    components:menu.components
   })

  }

  /* -------- PACKS -------- */

  if(interaction.customId==="help_packs"){

   embed=new EmbedBuilder()
    .setTitle("🎴 Packs")
    .setDescription(
`**/krosmoz** → Ouvrir un pack (1 gratuit/heure)
Choisis un set, puis regarde les cartes apparaître !

**/buypack** → Acheter un pack (1250 kamas)
Stock illimité, utilisable avec /krosmoz.

**/eventpack** → Ouvrir un pack d'event
Disponible uniquement pendant un event actif.
Chaque event donne 2-3 tickets à utiliser.

**/pity** → Voir ta pity par set
Affiche tes compteurs UR/S/SSR et les taux actuels.`
    )
    .setColor(0x3498DB)

   row=backButton()

  }

  /* -------- COLLECTION -------- */

  if(interaction.customId==="help_collection"){

   embed=new EmbedBuilder()
    .setTitle("📚 Collection")
    .setDescription(
`**/inventaire** → Voir tes cartes
Tri par nom, rareté, quantité. Filtre par rareté.
Les cartes ✨ shiny sont indiquées.

**/carte** id:<id> ou nom:<nom> → Détail d'une carte
Affiche la rareté, le set, l'image et les options de vente.

**/listcards** → Explorer toutes les cartes par set
Vérifie ta progression ✅/❌ pour chaque carte.

**Raretés :** ⚪C → 🟢U → 🔵R → 🟣SR → 🔴HR → 🟡UR → ✨S → 🌈SSR
**SSR Shiny :** 0.5% de chance sur une SSR — cosmétique rare.`
    )
    .setColor(0x9B59B6)

   row=backButton()

  }

  /* -------- ÉCONOMIE -------- */

  if(interaction.customId==="help_economy"){

   embed=new EmbedBuilder()
    .setTitle("💰 Économie")
    .setDescription(
`**/balance** → Voir ton solde de kamas

**/sellcard** → Vendre une carte au bot
Prix fixe selon la rareté (C: 2 → SSR: 500).

**/sellduplicates** → Vendre tous tes doublons d'un coup
Garde 1 exemplaire de chaque, vend le reste.
Les UR et SSR sont protégées.

**/market** → Marché entre joueurs
Achète, vends et retire tes annonces.
Protection anti-manipulation (prix min/max).

**/krosmoshop** → Boutique quotidienne
15 cartes fixes par jour (1 SSR, 2 S, 3 UR...).
1 achat max par carte par jour. Reset à minuit.

**/buypack** → Acheter un pack (1250 kamas)`
    )
    .setColor(0x2ECC71)

   row=backButton()

  }

  /* -------- GAMEPLAY -------- */

  if(interaction.customId==="help_gameplay"){

   embed=new EmbedBuilder()
    .setTitle("⚔️ Gameplay")
    .setDescription(
`**/daily** → Récompense quotidienne
Kamas ou packs. Streak 7 jours = SSR garantie !
10% de chance de double daily.

**/fusion** → Fusionner des doublons
Combine des doublons pour monter en rareté.
10% critique (saut +2), 10% double, 0.5% triple !

**/trade** → Échanger avec un joueur
Propose une carte, demande une carte en retour.
Attention : Krosmo-bot peut voler ta carte... (1% SSR !)

**/achievements** → Voir tes 306 succès
Progression, économie, RNG, secrets, events...
Les succès débloquent des badges et des titres.`
    )
    .setColor(0xE67E22)

   row=backButton()

  }

  /* -------- PROGRESSION -------- */

  if(interaction.customId==="help_progress"){

   embed=new EmbedBuilder()
    .setTitle("⭐ Progression")
    .setDescription(
`**/profil** → Voir ton profil complet
Rang, titre, niveau, XP, collection, badges, stats.

**/leaderboard** → Classements
6 catégories : collection, richesse, SSR, packs, succès, niveau.

**/titre** → Choisir ton titre affiché
Les titres se débloquent via les achievements.

**Rangs :** 🟢 Nouveau → 🥉 Bronze → 🥈 Argent → 🥇 Or → 💠 Platine → 💎 Diamant → 🌟 Mythique → 👑 Légende
Basés sur le nombre de succès débloqués.

**XP :** Gagnée en ouvrant des packs, fusionnant, faisant des daily.
Bonus quotidien ×2 sur le premier pack du jour.`
    )
    .setColor(0xE74C3C)

   row=backButton()

  }

  /* -------- EVENTS -------- */

  if(interaction.customId==="help_events"){

   embed=new EmbedBuilder()
    .setTitle("🎪 Events des Dieux")
    .setDescription(
`Les events sont des périodes spéciales (~15 min) où un Dieu du Krosmoz modifie les packs.

**/eventpack** → Ouvrir un pack d'event (tickets limités)

**19 Dieux disponibles :**
🔥 Iop (boost HR/UR) • 🎯 Cra (carte S ciblée)
⏳ Xelor (altération) • 🕶️ Sram (cartes cachées)
💀 Sacrieur (mutations) • 🎭 Zobal (upgrades)
🧠 Huppermage (cartes bonus) • 🍺 Pandawa (duplications)
🐉 Osamodas (homogénéité) • 🎲 Ecaflip (RNG extrême)
🐺 Ouginak (dégradations) • 🛡️ Feca (filtre + XP ×5)
💰 Enutrof (kamas ×5) • 💣 Roublard (volume +3)
⚙️ Steamer (chaos total) • 🌀 Eliotrope (pack spécial)
✨ Eniripsa (purification) • 🌿 Sadida (duplication)
⚔️ Forgelance (upgrade global)

Chaque Dieu a ses **voice lines** quand tu obtiens une S ou SSR !`
    )
    .setColor(0x8E44AD)

   row=backButton()

  }

  /* -------- RNG & PITY -------- */

  if(interaction.customId==="help_rng"){

   embed=new EmbedBuilder()
    .setTitle("🎲 RNG & Système de Pity")
    .setDescription(
`**Hard Pity (garanti) :**
🟡 UR → 10 packs sans UR
✨ S → 30 packs sans S
🌈 SSR → 50 packs sans SSR

**Soft Pity SSR (taux progressif) :**
< 20 packs → 0.05%
< 30 packs → 0.10%
< 35 packs → 0.30%
< 40 packs → 0.50%
< 43 packs → 1.00%
< 46 packs → 2.00%
< 49 packs → 5.00%
50 packs → **garanti**

**Lucky Pack :** 10% de chance → +1 carte bonus
**SSR Shiny :** 0.5% de chance sur une SSR

La pity est **par set** — chaque set a son propre compteur.
Voir **/pity** pour tes compteurs actuels.`
    )
    .setColor(0xF39C12)

   row=backButton()

  }

  await interaction.update({
   embeds:[embed],
   components:[row]
  })

 }

}