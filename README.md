🎴 Krosmoz Card Bot

Krosmoz Card Bot est un bot Discord implémentant un jeu de collection de cartes (TCG) inspiré de l'univers Krosmoz (Wakfu / Dofus).

Les joueurs peuvent :

ouvrir des packs

collectionner des cartes

gagner des kamas

compléter des sets

faire des échanges

vendre des cartes sur un marché

débloquer des succès

progresser en niveau et rang

interagir avec le bot via mentions

Le bot est conçu avec une architecture modulaire Node.js afin de faciliter l'ajout de contenu et de nouvelles fonctionnalités.

⚙️ Technologies utilisées

Node.js

discord.js v14

JSON Database

Canvas (images inventaire)

architecture modulaire (systems/)

📂 Structure du projet
krosmoz-card-bot
│
├ commands
│ ├ joueur
│ ├ admin
│ └ dev
│
├ systems
│
├ cards
│ ├ images
│ ├ cards.json
│ └ sets.json
│
├ data                # données persistantes (Railway / local)
│ ├ users             # fichiers joueurs individuels
│ │ ├ 123456789.json
│ │ ├ 987654321.json
│ │ └ ...
│ │
│ ├ market.json
│ ├ marketHistory.json
│ ├ devs.json
│ └ cards.json
│
├ index.js
├ deployCommands.js
├ package.json
├ CHANGELOG.md
└ README.md
🧠 Architecture

Le bot utilise une architecture modulaire basée sur des systèmes indépendants situés dans :

systems/

Chaque système gère une mécanique spécifique du jeu.

⚙️ Systèmes principaux
système	rôle
dataManager	gestion des données persistantes
userSystem	gestion des utilisateurs
cardRegistry	indexation des cartes
cardId	gestion des identifiants de cartes
🎮 Gameplay
système	rôle
pack	ouverture de packs
packEngine	génération des cartes
setSystem	gestion des sets
fusion	fusion de cartes
🪙 Économie
système	rôle
economy	gestion des kamas
market	marché des cartes
tradeSystem	échanges entre joueurs
rewards	attribution des récompenses
📈 Progression
système	rôle
progressionSystem	gestion de l'XP
rankSystem	gestion des rangs
achievementRegistry	définition des succès
achievementEngine	moteur d'achievements
achievementCheck	déclenchement automatique

Les succès permettent de débloquer :

badges

titres

progression

🎁 Activités
système	rôle
dailySystem	récompenses quotidiennes
eventSystem	gestion des événements
🛠 Outils internes
système	rôle
inventoryImage	génération d'image inventaire
auditSystem	logs développeur
antiAbuse	protection anti-abus
devSystem	outils développeur
🔗 Schéma simplifié
                Discord Commands
                       │
                       ▼
                Command Handlers
                       │
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
    packEngine      market        tradeSystem
        │              │              │
        └──────► userSystem ◄────────┘
                       │
                       ▼
                  dataManager
                       │
                       ▼
                     /data
📦 Stockage des données

Le bot utilise un système de stockage basé sur des fichiers JSON.

/data
   users/
      123456789.json
      987654321.json
   market.json
   marketHistory.json
   devs.json
   cards.json
users.json

Stocke :

inventaire de cartes

kamas

achievements

progression

statistiques

titres

🎴 Cartes

Les cartes sont définies dans :

cards/cards.json

Structure :

{
 "id": 1,
 "name": "Cra",
 "rarity": "C",
 "set": "incarnam",
 "image": "1_cra_incarnam_c.jpg"
}
⭐ Raretés
Rareté	Emoji
C	⚪
U	🟢
R	🔵
SR	🟣
HR	🔴
UR	🟡
S	✨
SSR	🌈
✨ SSR Shiny

Les cartes SSR possèdent une variante extrêmement rare appelée SSR Shiny.

Caractéristiques :

⭐ 0.5% de chance lors d'une SSR

✨ icône spéciale

🌟 embed visuel unique

🏆 achievement spécial

Les SSR Shiny sont purement cosmétiques.

🎲 Système de Pity

Chaque set possède son compteur de pity indépendant.

Exemple :

Incarnam → pity SSR 12
Astrub → pity SSR 3
Amakna → pity SSR 0
Hard Pity
Rareté	Garantie
UR	10 packs
SSR	50 packs
Soft Pity
Packs sans SSR	Chance SSR
0-20	0.05%
20-30	0.1%
30-40	0.3%
40-49	1%
50	SSR garantie
🎁 Lucky Pack

Chaque pack possède 10% de chance d'être un Lucky Pack.

Un Lucky Pack donne :

5 cartes normales
+ 1 carte bonus

Certains achievements secrets sont liés à ces événements.

📦 Sets de cartes

Le jeu contient 3 sets principaux totalisant 674 cartes.

☁️ Incarnam

120 cartes

🌾 Astrub

258 cartes

🌽 Amakna

296 cartes

🎮 Commandes Joueur
Packs
/krosmoz
/buypack
/pity
Inventaire
/inventaire
/carte
/listcards
Économie
/balance
/sellcard
/sellduplicates
Marché
/market

Fonctionnalités :

achat

vente

tri

filtres

pagination

Progression
/profil
/leaderboard
/titre
Gameplay
/daily
/fusion
/trade
Succès
/achievements
Aide
/kroshelp
🏆 Achievements

Le bot possède 115 succès automatiques et secrets.

Types de succès :

progression (packs, niveau, collection)

économie (kamas, ventes, achats)

gameplay (fusion, SSR, packs spéciaux)

social (mentions, interactions)

RNG extrême

secrets

Certaines commandes possèdent des succès humoristiques liés à leur utilisation excessive :

/profil
/leaderboard
/kroshelp
/balance
/inventaire
/titre

Les succès débloquent :

badges

titres

progression

Les succès secrets apparaissent comme :

🔒 ???

jusqu'à leur découverte.

🧩 Fonctionnalités principales

✔ système de packs gacha
✔ inventaire paginé
✔ marché entre joueurs
✔ échanges sécurisés
✔ système de sets
✔ fusion avancée
✔ 115 achievements
✔ progression et rangs
✔ économie avec kamas
✔ interface Discord interactive
✔ réponses du bot lorsqu'il est mentionné
✔ astuces automatiques
✔ animation d'ouverture de pack
✔ révélation progressive des cartes
✔ pity visible dans /krosmoz et /pity
✔ daily rewards
✔ trade sécurisé

🔁 Gameplay Loop

1️⃣ ouvrir des packs
2️⃣ obtenir des cartes
3️⃣ vendre les doublons
4️⃣ fusionner les cartes
5️⃣ compléter les sets
6️⃣ débloquer des achievements
7️⃣ gagner de l'XP et monter de niveau

📰 Changelog

Historique des mises à jour :

CHANGELOG.md
👨‍💻 Auteur

Projet créé par :

sauci

📜 Licence

Projet fan non officiel inspiré de l'univers Krosmoz (Dofus / Wakfu).

Ce projet :

n’est pas affilié à Ankama

n’est pas approuvé par Ankama

est développé uniquement à des fins communautaires

Le bot est entièrement gratuit et ne génère aucun revenu.

Si Ankama demande la modification ou la suppression de certains contenus, ils seront retirés du projet.