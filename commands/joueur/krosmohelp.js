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
📚 Complète des sets et assemble des SSR via fragments
💰 Gagne des kamas et fais du commerce
⚗️ Fusionne tes doublons pour monter en rareté
🎡 Tente ta chance à la Roulette d'Ecaflip
🏰 Rejoins une guilde et progresse collectivement
🎪 Participe aux events des Dieux du Krosmoz
⭐ Battle Pass, quêtes, succès et titres

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
   .setStyle(ButtonStyle.Secondary),

  new ButtonBuilder()
   .setCustomId("help_events")
   .setLabel("Events")
   .setEmoji("🎪")
   .setStyle(ButtonStyle.Primary)

 )

 const row2 = new ActionRowBuilder().addComponents(

  new ButtonBuilder()
   .setCustomId("help_progress")
   .setLabel("Progression")
   .setEmoji("⭐")
   .setStyle(ButtonStyle.Danger),

  new ButtonBuilder()
   .setCustomId("help_guilds")
   .setLabel("Guildes")
   .setEmoji("🏰")
   .setStyle(ButtonStyle.Secondary),

  new ButtonBuilder()
   .setCustomId("help_battlepass")
   .setLabel("Battle Pass")
   .setEmoji("🎖️")
   .setStyle(ButtonStyle.Primary),

  new ButtonBuilder()
   .setCustomId("help_quests")
   .setLabel("Quêtes")
   .setEmoji("📋")
   .setStyle(ButtonStyle.Success),

  new ButtonBuilder()
   .setCustomId("help_roulette")
   .setLabel("Roulette")
   .setEmoji("🎡")
   .setStyle(ButtonStyle.Secondary)

 )

 const row3 = new ActionRowBuilder().addComponents(

  new ButtonBuilder()
   .setCustomId("help_rng")
   .setLabel("RNG & Pity")
   .setEmoji("🎲")
   .setStyle(ButtonStyle.Secondary)

 )

 return { embed, components:[row1, row2, row3] }

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
Choisis un set parmi les 6 disponibles.
Ouvre jusqu'à **25 packs d'un coup** ou en mode **🎲 random** !

**/buypack** → Acheter un pack (1250 kamas)
Stock illimité, utilisable avec /krosmoz.

**/eventpack** → Ouvrir un pack d'event
Disponible uniquement pendant un event actif.
Chaque event donne 2-3 tickets à utiliser.

**/pity** → Voir ta pity par set
Affiche tes compteurs UR/S/SSR et les taux actuels.

**Sets disponibles :** Incarnam · Astrub · Amakna · Sufokia · Kelba · Katrepat`
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
Mode **🧩 Fragments** pour voir ta progression par SSR.
Les cartes ✨ shiny sont indiquées.

**/carte** id:<id> ou nom:<nom> → Détail d'une carte
Affiche la rareté, le set, l'image et les options de vente.

**/listcards** → Explorer toutes les cartes par set
Vérifie ta progression ✅/❌ pour chaque carte.

**/craft** → Assembler une SSR depuis ses 5 fragments
Autocomplétion triée : cartes craftables en premier.
Chaque craft débloque un titre et donne +500 XP Battle Pass.

**Raretés :** ⚪C → 🟢U → 🔵R → 🟣SR → 🔴HR → 🟡UR → ✨S → 🌈SSR
**SSR Shiny :** 0.5% de chance sur une SSR — cosmétique rare.
**Fragments :** tombent dans les packs, 5/5 = SSR garantie via /craft`
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
Vente de **fragments** supportée.
Protection anti-manipulation (prix min/max).

**/krosmoshop** → Boutique quotidienne
15 cartes fixes par jour (1 SSR, 2 S, 3 UR...).
1 achat max par carte par jour. Reset à minuit.

**/buypack** → Acheter un pack (1250 kamas)

**/gift** → Donner une carte à un joueur
3 dons maximum par jour. La carte est transférée directement.`
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

**/gift** → Donner une carte à un ami (3/jour)

**/roulette** → Roulette d'Ecaflip (1 fois/heure)
31 lots pondérés : kamas, packs, cartes, fragments.
Jackpot secret ultra-rare : SSR Shiny + 10 000 kamas + 5 packs !

**/achievements** → Voir tes **665 succès**
Progression, économie, RNG, secrets, events, Battle Pass...
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

**/mystats** → Statistiques détaillées (6 pages)
Général · Collection · Packs & RNG · Économie · Events · Social

**/leaderboard** → Classements (7 catégories)
Collection, richesse, SSR, packs, succès, niveau, **guildes**.

**/titre** → Choisir ton titre affiché
Les titres se débloquent via les achievements et les crafts.

**/achievements** → Voir tes 665 succès
579 classiques + 86 Battle Pass.

**Rangs :** 🟢 Nouveau → 🥉 Bronze → 🥈 Argent → 🥇 Or → 💠 Platine → 💎 Diamant → 🌟 Mythique → 👑 Légende
Basés sur le nombre de succès débloqués.

**XP joueur :** Gagnée en ouvrant des packs, fusionnant, daily...
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

  /* -------- GUILDES -------- */

  if(interaction.customId==="help_guilds"){

   embed=new EmbedBuilder()
    .setTitle("🏰 Guildes")
    .setDescription(
`**/guild** → Voir ta guilde, créer ou rejoindre
Affiche le niveau, les membres, les quêtes et les bonus actifs.
Création : **5 000 kamas**. Maximum **10 membres**.

**/guildmanage** → Gérer ta guilde (meneur/officier)
Inviter, exclure, promouvoir, rétrograder, renommer, dissoudre.

**Quêtes de guilde :**
☀️ **5 quêtes journalières** — reset chaque jour à 1h
📅 **5 quêtes hebdomadaires** — reset chaque lundi à 1h
Les quêtes rapportent de l'**XP de guilde** partagée.
Bonus si toutes terminées (+XP supplémentaire).

**Niveaux de guilde (1 → 100) :**
Chaque niveau débloque des bonus pour tous les membres :
📦 Packs bonus au daily · 💰 Kamas bonus · ⭐ XP bonus
🍀 Lucky pack · 🎁 Double daily · 🏪 Réduction shop

**Scaling :** les objectifs s'adaptent au nombre de membres actifs.`
    )
    .setColor(0x9B59B6)

   row=backButton()

  }

  /* -------- BATTLE PASS -------- */

  if(interaction.customId==="help_battlepass"){

   embed=new EmbedBuilder()
    .setTitle("🎖️ Battle Pass")
    .setDescription(
`**/battlepass** → Voir ta progression et réclamer tes récompenses
Onglets : Réclamer · Rewards · Premium · Succès · Saison · Quêtes du jour

**Saisons (21 jours) :**
🟢 Émeraude · 🔴 Pourpre · 🟡 Turquoise · 🟠 Ocre · ⚪ Ivoire · ⚫ Ébène
Chaque saison a un **bonus passif** actif pour tous les joueurs.

**40 paliers par saison** — 2 pistes de récompenses :
🆓 **Gratuit** : kamas, packs, XP, fragments...
💎 **Premium** : récompenses améliorées (achat en kamas)

**Gagner de l'XP Battle Pass :**
📦 Ouvrir un pack : +60 XP
🎁 Réclamer le daily : +40 XP
⚗️ Fusion : +120 XP
🎡 Roulette : +90 XP
🎪 Pack d'event : +240 XP
📋 Quête journalière : +80 XP/quête
📅 Quête hebdomadaire : +250 XP/quête
✅ Compléter un set : +480 XP

**86 succès Battle Pass** : globaux permanents + saisonniers exclusifs.`
    )
    .setColor(0x1B6B3A)

   row=backButton()

  }

  /* -------- QUÊTES -------- */

  if(interaction.customId==="help_quests"){

   embed=new EmbedBuilder()
    .setTitle("📋 Quêtes")
    .setDescription(
`**/quests** → Voir tes quêtes et réclamer tes récompenses

**Quêtes Journalières ☀️**
5 quêtes légères — reset chaque jour à 1h
Objectifs : ouvrir des packs, faire des fusions, réclamer le daily...
Récompenses : kamas, packs, XP joueur
**Bonus complétion totale** si toutes réclamées !

**Quêtes Hebdomadaires 📅**
5 quêtes plus costauds — reset chaque lundi à 1h
Objectifs plus ambitieux sur la semaine
Récompenses plus généreuses
**Bonus complétion totale** si toutes réclamées !

**XP Battle Pass au claim :**
☀️ +80 XP BP par quête journalière réclamée
📅 +250 XP BP par quête hebdomadaire réclamée
+ Bonus supplémentaire si toutes complétées

Les quêtes se mettent à jour en temps réel en fonction de tes actions.
Utilise le bouton **Rafraîchir** pour voir la progression actuelle.`
    )
    .setColor(0x3498DB)

   row=backButton()

  }

  /* -------- ROULETTE -------- */

  if(interaction.customId==="help_roulette"){

   embed=new EmbedBuilder()
    .setTitle("🎡 Roulette d'Ecaflip")
    .setDescription(
`**/roulette** → Tenter sa chance (1 fois par heure)
Disponible dans les salons dédiés uniquement.

**31 lots pondérés :**
⬜ **Commun** (lots 1–10) : 150 à 1 250 kamas, 1–2 packs, 100 XP
🟩 **Peu commun** (lots 11–20) : 1 500 à 2 500 kamas, 3–5 packs, fragments
🟦 **Rare** (lots 21–26) : 5 000–7 500 kamas, 8–10 packs, carte HR garantie
🟥 **Très rare** (lots 27–30) : 15 000 kamas, 15 packs, carte UR ou SSR garantie
🌟 **Secret** (lot 31) : **JACKPOT** — SSR Shiny + 10 000 kamas + 5 packs

Le jackpot (~1/2120) déclenche une **annonce publique** dans le salon.
Il n'apparaît jamais dans la liste des récompenses visibles.

**Succès dédiés :** 46 succès (tours, kamas, packs, jackpots, secrets...)
**Secrets :** jouer entre 2h–5h ou 13h–14h (heure France) 🔒

La roulette donne aussi de l'**XP Battle Pass** à chaque spin.`
    )
    .setColor(0xF39C12)

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
Voir **/pity** pour tes compteurs actuels.

**Fragments SSR :**
Tombent aléatoirement dans les packs.
5 fragments distincts (1→5) d'une même carte = **/craft** garanti.`
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
