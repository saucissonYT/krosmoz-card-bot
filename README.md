# 🎴 Krosmoz Card Bot

Krosmoz Card Bot est un bot Discord implémentant un jeu de collection de cartes (TCG) inspiré de l'univers Krosmoz (Wakfu / Dofus).

Les joueurs peuvent :

- Ouvrir des packs et collectionner 1025 cartes
- Compléter 4 sets (Incarnam, Astrub, Amakna, Sufokia)
- Fusionner des doublons pour monter en rareté
- Vendre et acheter sur le marché entre joueurs
- Participer aux événements des 19 Dieux du Krosmoz
- Acheter des cartes au KrosmoShop quotidien
- Compléter des quêtes journalières et hebdomadaires
- Créer ou rejoindre une guilde et profiter de bonus collectifs
- Donner des cartes à d'autres joueurs
- Progresser jusqu'au niveau 100 et débloquer des bonus permanents
- Débloquer ~370 succès et des titres exclusifs
- Interagir avec le bot via mentions

---

## ⚙️ Technologies

- Node.js
- discord.js v14
- JSON Database (fichiers individuels par joueur + guilds.json)
- Canvas (images inventaire)
- Sharp (traitement d'images cartes)
- Architecture modulaire (systems/)

---

## 📂 Structure du projet

```
krosmoz-card-bot
│
├── commands/
│   ├── joueur/         # commandes joueur (krosmoz, inventaire, market, guild, gift...)
│   ├── admin/          # commandes admin (krosmoevent, stats)
│   └── dev/            # commandes dev (addcard, simpack, devguild...)
│
├── systems/
│   ├── achievements/   # 12 fichiers d'achievements modulaires
│   ├── eventHandlers/  # 19 handlers d'events (1 par Dieu)
│   ├── guildSystem.js  # CRUD guildes, XP, niveaux
│   ├── guildBonuses.js # Calcul des 9 bonus par niveau de guilde
│   ├── guildQuestSystem.js # Quêtes hebdo de guilde
│   ├── playerBonuses.js # Calcul des 9 bonus par niveau du joueur
│   └── ...             # systèmes principaux
│
├── cards/
│   ├── images/         # images des cartes (par set)
│   ├── import/         # dossier d'import batch
│   └── sets.json       # définition des sets
│
├── data/               # données persistantes
│   ├── users/          # fichiers joueurs individuels
│   ├── guilds.json     # données des guildes
│   ├── market.json
│   ├── marketHistory.json
│   ├── devs.json
│   ├── cards.json
│   └── krosmoshop.json
│
├── index.js
├── CHANGELOG.md
└── README.md
```

---

## 🧠 Architecture

Le bot utilise une architecture modulaire basée sur des systèmes indépendants.

### ⚙️ Systèmes principaux

| Système | Rôle |
|---------|------|
| dataManager | Données persistantes, autosave 30s, dirty save |
| userSystem | Gestion des utilisateurs (fichiers individuels) |
| cardRegistry | Indexation dynamique des cartes |
| constants | Constantes centralisées (raretés, prix, couleurs, PACK_PRICE, MAX_PLAYER_LEVEL) |

### 🎮 Gameplay

| Système | Rôle |
|---------|------|
| pack | Génération RNG des cartes avec soft/hard pity |
| packEngine | Wrapper avec achievements, XP, stats, bonus guilde/joueur |
| eventPackEngine | Packs d'events avec handlers modulaires |
| eventSystem | Gestion du cycle de vie des events |
| eventRegistry | Définition des 19 events |
| eventHandlers/ | Logique RNG spécifique par Dieu |
| fusion | Fusion de doublons (critique, double, triple) + bonus |
| questSystem | Quêtes journalières et hebdomadaires |

### 🏰 Guildes

| Système | Rôle |
|---------|------|
| guildSystem | CRUD guildes, XP, niveaux 1→100, hiérarchie (meneur/officier/membre) |
| guildBonuses | Calcul des 9 bonus progressifs par niveau de guilde |
| guildQuestSystem | 3 quêtes hebdo de guilde, progression par stats combinées des membres |

### 🪙 Économie

| Système | Rôle |
|---------|------|
| economy | Gestion des kamas (reward par rareté) |
| market | Marché entre joueurs (anti-manipulation) |
| krosmoshop | Shop quotidien (15 cartes, reset minuit, réductions guilde/joueur) |
| rewardSystem | Récompenses events (multiplicateurs, jackpots) |

### 📈 Progression

| Système | Rôle |
|---------|------|
| progressionSystem | XP et level-up (cap 100), milestones, bonus XP intégré |
| playerBonuses | 9 bonus progressifs par niveau du joueur |
| rankSystem | Rangs basés sur les achievements |
| achievementRegistry | Agrégateur des 12 modules d'achievements |
| achievementEngine | Détection avec lecture dynamique des cartes |
| achievementCheck | Pipeline de vérification |
| achievementNotifier | Affichage Discord des succès débloqués |

### 🏆 ~370 Achievements (12 modules)

| Module | Contenu |
|--------|---------|
| achievementPacks | Packs ouverts, RNG spéciaux |
| achievementRarity | SSR, Shiny, KrosmoShop |
| achievementFusion | Fusions (critique, double, triple) |
| achievementCollection | Cartes totales, uniques, sets |
| achievementEconomy | Kamas, daily, balance, inventaire, help, titres |
| achievementSocial | Profil, leaderboard, mentions |
| achievementSecrets | Secrets (Krosmo-bot, etc.) |
| achievementEvents | 148 achievements events (classes, jackpots) |
| achievementSpecial | 39 achievements comportementaux |
| achievementGift | 15 achievements de dons (donnés, reçus, spéciaux) |
| achievementGuild | 29 achievements de guilde (niveaux, quêtes, social, secrets) |
| achievementLevel | 20 achievements de progression (niveaux, XP total, secrets) |

---

## 🎴 Cartes

1025 cartes réparties en 4 sets :

| Set | Cartes |
|-----|--------|
| ☁️ Incarnam | 120 |
| 🌾 Astrub | 258 |
| 🌽 Amakna | 298 |
| 🌊 Sufokia | 349 |

### ⭐ Raretés & Économie

| Rareté | Emoji | Prix vente (bot) | Prix market | Prix KrosmoShop |
|--------|-------|-----------------|-------------|-----------------|
| C | ⚪ | 3 | 8 | — |
| U | 🟢 | 8 | 20 | — |
| R | 🔵 | 20 | 50 | — |
| SR | 🟣 | 50 | 120 | 300 |
| HR | 🔴 | 120 | 300 | 750 |
| UR | 🟡 | 320 | 800 | 2 000 |
| S | ✨ | 800 | 2 000 | 5 000 |
| SSR | 🌈 | 2 000 | 5 000 | 12 000 |

**Prix d'un pack : 800 kamas** (1 gratuit/heure, cooldown réduit par niveau)

### Coûts de fusion

| Rareté fusionnée | Doublons requis |
|-----------------|-----------------|
| C → U | 10 doublons |
| U → R | 20 doublons |
| R → SR | 40 doublons |
| SR → HR | 80 doublons |
| HR → UR | 150 doublons |
| UR → S | 300 doublons |
| S → SSR | 500 doublons |

### 🌊 Distribution Sufokia

| Rareté | Cartes | Taux |
|--------|--------|------|
| C | 115 | 32.95% |
| U | 94 | 26.93% |
| R | 66 | 18.91% |
| SR | 31 | 8.88% |
| HR | 21 | 6.02% |
| UR | 11 | 3.15% |
| S | 6 | 1.72% |
| SSR | 5 | 1.43% |

### ✨ SSR Shiny

Les SSR ont 0.5% de chance d'être **Shiny** (+ bonus de niveau joueur) — variante cosmétique rare avec un affichage doré et un tracking persistant dans l'inventaire.

---

## 🎲 Système de Pity

Chaque set possède son propre compteur de pity indépendant.

| Rareté | Pity | Mécanisme |
|--------|------|-----------|
| UR | 10 packs | Garantie à 10 packs sans UR |
| S | 30 packs | Soft pity progressive dès 20 packs |
| SSR | 50 packs | Soft pity progressive dès 30 packs |

---

## ⭐ Système de Niveaux

### Progression joueur

- **Niveau max : 100**
- Formule XP : `80 + niveau × 30` par niveau (progressive, jamais brutale)
- XP total pour atteindre le niveau 100 : ~160 000

| Niveau | XP requis | XP total cumulé |
|--------|-----------|-----------------|
| 10 | 380 | ~2 300 |
| 25 | 830 | ~11 500 |
| 50 | 1 580 | ~42 000 |
| 75 | 2 330 | ~92 000 |
| 100 | 3 080 | ~160 000 |

### Milestones

| Niveau | Bonus kamas | Bonus packs |
|--------|-------------|-------------|
| 10 | +500 | — |
| 25 | +1 500 | +2 |
| 50 | +5 000 | +5 |
| 75 | +10 000 | +5 |
| 100 | +25 000 | +10 |

### 9 Bonus par niveau du joueur

Les bonus se **cumulent** avec les bonus de guilde.

| Bonus | Progression | Max (niv.100) |
|-------|------------|---------------|
| 💰 Kamas bonus | +1% / 4 niv. | +25% |
| 🔥 Fusion critique | +0.5% / 8 niv. | +6% |
| 🍀 Lucky pack | +1% / 10 niv. | +10% |
| ⭐ XP bonus | +5% / 20 niv. | +25% |
| 🏪 Réduction KrosmoShop | +1% / 15 niv. | +6% |
| 🎁 Kamas daily bonus | +50 / 10 niv. | +500 |
| 🎲 Double daily | +2% / 25 niv. | +8% |
| ✨ Chance shiny | +1% / 50 niv. | +2% |
| ⏱️ Réduction cooldown pack | -5 min / 20 niv. | -25 min (35 min min.) |

---

## 🏰 Système de Guildes

### Création
- Coûte **5000 kamas**
- Nom choisi par le joueur (3-24 caractères, unique)
- Emoji aléatoire attribué automatiquement parmi 50 emojis thématiques
- Le créateur devient **Meneur** (👑)

### Hiérarchie
- 👑 **Meneur** (1) — tous les droits
- ⚔️ **Officiers** (max 3) — invite, kick membres, claim quêtes
- 👤 **Membres** (max 20 au total) — profitent des bonus

### Niveaux & XP
- La guilde monte du **niveau 1 au niveau 100**
- XP requis par niveau : `100 + niveau × 50` (progressif mais pas trop long)
- L'XP est gagnée via les **quêtes de guilde**

### 9 Bonus progressifs de guilde

| Bonus | Progression | Max (niv.100) |
|-------|------------|---------------|
| 💰 Kamas bonus sur les packs | +1% / 5 niv. | +20% |
| 🔥 Chance de fusion critique | +0.5% / 10 niv. | +5% |
| ✨ Chance de fusion double | +0.5% / 15 niv. | +3% |
| 🌈 Chance de fusion triple | +0.25% / 25 niv. | +1% |
| 🍀 Chance de lucky pack | +1% / 10 niv. | +10% |
| ⭐ XP bonus | +5% / 20 niv. | +25% |
| 🏪 Réduction KrosmoShop | +2% / 25 niv. | +8% |
| 📦 Packs daily bonus | +1 / 50 niv. | +2 |
| 🎁 Chance de double daily | +1% / 20 niv. | +5% |

### Quêtes de guilde
- **3 quêtes par semaine**, tirées d'un pool de 17 quêtes possibles
- Mêmes quêtes pour toutes les guildes (sélection déterministe par semaine)
- Progrès calculé par **diff de stats combinées** de tous les membres
- Récompenses : **400 à 2000 XP de guilde** selon la difficulté
- **Bonus semaine parfaite** si 3/3 terminées : **+500 XP**
- Reset chaque **lundi à 1h** (heure française)

**Exemples de quêtes de guilde :**

| Quête | Objectif | Récompense |
|-------|----------|------------|
| 📦 Ouverture massive | Ouvrir 50 packs | ⭐ 500 XP |
| 📦 Pluie de cartes | Ouvrir 200 packs | ⭐ 2000 XP |
| 🌈 Chasseurs de SSR | Obtenir 5 SSR | ⭐ 800 XP |
| ⚗️ Alchimie de groupe | Faire 20 fusions | ⭐ 600 XP |
| 🎁 Généreux ensemble | Faire 10 dons | ⭐ 500 XP |
| 💰 Grand déstockage | Vendre 100 cartes | ⭐ 1000 XP |
| 🎁 Fidélité collective | Réclamer 20 daily | ⭐ 400 XP |

### Interface /guild

La commande **/guild** affiche une interface interactive avec :
- Vue principale : emoji, nom, niveau, XP, barre de progression, membres, rôle
- Onglet **Membres** : liste avec icônes de rôle
- Onglet **Quêtes** : 3 quêtes hebdo avec barres de progression et timer
- Onglet **Bonus** : bonus actifs + prochains déblocages
- Bouton **Quitter**
- Création via **modal** si le joueur n'est pas dans une guilde

### Interface /guildmanage

La commande **/guildmanage** permet au meneur/officier de :
- **Inviter** un joueur (Accept/Decline interactif)
- **Exclure** un membre
- **Promouvoir** / **Rétrograder** un officier
- **Transférer** le leadership
- **Renommer** la guilde (2000 kamas, nouvel emoji)
- **Dissoudre** la guilde (confirmation requise)

---

## 🎁 Système de Dons

- Commande **/gift** pour donner une carte à un joueur
- Limite : **3 dons par jour** (reset quotidien, heure FR)
- Confirmation par bouton avant le don
- Re-vérification de possession au moment du confirm
- Tracking complet : dons donnés, reçus, par rareté, par destinataire
- Dons intra-guilde trackés séparément (stat `guildGifts`)
- **15 achievements dédiés** avec 8 titres exclusifs

---

## 🎪 Événements des 19 Dieux

Chaque Dieu du Krosmoz a un événement unique avec son propre mécanisme RNG :

| Dieu | Effet |
|------|-------|
| ⚔️ Iop | Cartes bonus |
| 🏹 Cra | Pack précis |
| 🌪️ Xelor | Mutation temporelle |
| 💰 Enutrof | Kamas ×5 + jackpot |
| ✨ Eniripsa | Filtrage purificateur |
| 🌿 Sadida | Duplication |
| 🐉 Osamodas | Pack bestial |
| 🔥 Sacrieur | Mutation sacrificielle |
| 🛡️ Feca | XP ×5 + jackpot |
| 🕶️ Sram | Pack invisible |
| 🎭 Zobal | Upgrade masqué |
| ⚔️ Forgelance | Upgrade global |
| 🌀 Eliotrope | Pack dimensionnel |
| 🎲 Ecaflip | Full RNG |
| 🌊 Pandawa | Duplication éthylique |
| 🐺 Ouginak | Pack prédateur |
| 🔫 Roublard | Pack piégé |
| ⚙️ Steamer | Chaos mécanique |
| ✨ Huppermage | Pack élémentaire |

---

## 📅 Quêtes

### ☀️ Quêtes Journalières

- **3 quêtes par jour**, tirées depuis un pool de 18 quêtes possibles
- Mêmes quêtes pour tous les joueurs (sélection déterministe par date)
- Reset chaque jour à **1h** (heure française)
- **Bonus journalier** si 3/3 terminées : **+500 kamas**, **+100 XP**

### 📅 Quêtes Hebdomadaires

- **5 quêtes par semaine**, tirées depuis un pool de 23 quêtes possibles
- Reset chaque **lundi à 1h** (heure française)
- **Bonus hebdomadaire** si 5/5 terminées : **+5000 kamas**, **+500 XP**, **+3 packs**

### Interface /quests

La commande **/quests** affiche une interface interactive avec :
- Deux onglets : ☀️ Journalières et 📅 Hebdomadaires
- Barres de progression pour chaque quête
- Bouton **"Récupérer tout"** pour claim en un clic
- Timer de reset affiché en temps réel
- Embed doré quand toutes les quêtes sont récupérées

---

## 🎮 Commandes Joueur

### Packs
| Commande | Description |
|----------|-------------|
| /krosmoz | Ouvrir un pack (1 gratuit/heure, cooldown réduit par niveau) |
| /buypack | Acheter un pack (800 kamas) |
| /eventpack | Ouvrir un pack d'event |
| /pity | Voir ta pity par set |

### Collection
| Commande | Description |
|----------|-------------|
| /inventaire | Voir ton inventaire (tri par nom, rareté, quantité, set + filtres) |
| /carte | Afficher une carte par nom ou ID |
| /listcards | Explorer les cartes par set |

### Économie
| Commande | Description |
|----------|-------------|
| /balance | Voir ton solde |
| /sellcard | Vendre une carte |
| /sellduplicates | Vendre tous les doublons |
| /market | Marché entre joueurs |
| /krosmoshop | Boutique quotidienne (réductions par niveau/guilde) |

### Gameplay
| Commande | Description |
|----------|-------------|
| /daily | Récompense quotidienne (streak 7 = SSR, bonus par niveau) |
| /fusion | Fusionner des doublons (bonus crit par niveau/guilde) |
| /trade | Échanger avec un joueur |
| /gift | Donner une carte à un joueur (3/jour) |
| /quests | Quêtes journalières et hebdomadaires |

### Guildes
| Commande | Description |
|----------|-------------|
| /guild | Voir ta guilde, créer, quêtes, bonus, membres |
| /guildmanage | Gérer ta guilde (invite, kick, promote, rename, disband...) |

### Progression
| Commande | Description |
|----------|-------------|
| /profil | Profil complet (niveau, guilde, badges, stats) |
| /mystats | Statistiques détaillées (6 pages) |
| /leaderboard | Classements (7 catégories dont guildes) |
| /titre | Choisir ton titre |
| /achievements | Voir les ~370 succès |
| /krosmohelp | Aide du bot |

---

## 🏆 Achievements

~370 succès automatiques répartis en 12 catégories :

- **Packs** — ouvertures, achats, RNG spéciaux
- **Raretés** — SSR, Shiny, KrosmoShop
- **Fusion** — critique, double, triple
- **Collection** — cartes totales, uniques, sets, hoarder
- **Économie** — kamas, daily, balance, inventaire, titres
- **Social** — profil, leaderboard, mentions du bot
- **Secrets** — Krosmo-bot, achievements cachés
- **Events** — 148 achievements (participation, SSR par classe, jackpots)
- **Spéciaux** — comportementaux (palindrome, minuit, all C, prestige...)
- **Dons** — 15 achievements (donnés, reçus, SSR, shiny, streak, mutuels)
- **Guildes** — 29 achievements (niveaux, quêtes, vétéran, contributeur, secrets)
- **Niveaux** — 20 achievements (niveaux 5→100, XP total, secrets)

Les succès débloquent des **badges** et des **titres**.

Les succès secrets apparaissent comme **🔒 ???** jusqu'à leur découverte.

---

## 🔁 Gameplay Loop

1. Ouvrir des packs (/krosmoz, /eventpack)
2. Collectionner des cartes
3. Compléter les quêtes journalières et hebdomadaires (/quests)
4. Vendre les doublons (/sellduplicates, /market)
5. Fusionner pour monter en rareté (/fusion)
6. Compléter les sets
7. Acheter au KrosmoShop quotidien
8. Participer aux events des Dieux
9. Donner des cartes à ses amis (/gift)
10. Créer ou rejoindre une guilde (/guild)
11. Compléter les quêtes de guilde pour faire monter la guilde en niveau
12. Profiter des bonus de guilde + bonus de niveau (kamas, fusion, lucky pack, XP, shiny, cooldown...)
13. Débloquer des achievements et des titres
14. Monter en niveau jusqu'au cap 100 et maximiser ses bonus

---

## 🔗 Schéma simplifié

```
                Discord Commands
                       │
                       ▼
                Command Handlers
                       │
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
    packEngine   eventPackEngine    market
        │              │              │
        └──────► userSystem ◄────────┘
                    │     │
         ┌──────────┘     └──────────┐
         ▼                           ▼
    guildSystem              playerBonuses
         │                           │
         ▼                           ▼
    guildBonuses            progressionSystem
         │                           │
         └───────────┬───────────────┘
                     ▼
                dataManager
                     │
                ┌────┴────┐
                ▼         ▼
            /data     guilds.json
```

---

## 🎮 Commandes Dev

### Admin
| Commande | Description |
|----------|-------------|
| /krosmodev | Donner/retirer le rang développeur |
| /removedev | Ajouter ou retirer un dev |
| /krosmoreload | Reload systèmes et commandes |
| /stats | Statistiques du bot |
| /event | Lancer un événement |

### Cartes
| Commande | Description |
|----------|-------------|
| /addcard | Ajouter une carte |
| /editcard | Modifier une carte |
| /removecard | Supprimer des cartes |
| /previewcard | Prévisualiser une carte |
| /importcards | Import batch depuis cards/import |

### Packs & Sets
| Commande | Description |
|----------|-------------|
| /simpack | Simulation d'ouverture |
| /hardpity | Forcer une hard pity |
| /setcreate | Créer un set |
| /setdelete | Supprimer un set |
| /setedit | Distribution des raretés |
| /setlist | Lister les sets |
| /setreward | Modifier la récompense |
| /setstats | Stats d'un set |

### Systèmes
| Commande | Description |
|----------|-------------|
| /devgive | Donner une carte à un joueur |
| /devdaily | Simuler un daily |
| /devachievement | Ajouter/supprimer un achievement |
| /checkachievement | Audit complet des achievements |
| /devfusion | Tester les fusions |
| /cooldown | Activer/désactiver le cooldown |
| /resetcooldown | Reset les cooldowns |
| /resetpity | Reset la pity |
| /collection | Voir la collection d'un joueur |
| /devguild | Gérer les guildes (list, info, setlevel, addxp, forcejoin, disband, create, bonuses) |

---

## 📦 Stockage des données

Fichiers JSON individuels par joueur (dirty save system).

```
/data
   users/
      123456789.json
      987654321.json
   guilds.json
   market.json
   marketHistory.json
   krosmoshop.json
   devs.json
   cards.json
```

Chaque joueur stocke : inventaire, shiny cards, kamas, pity, achievements, titres, progression, stats, krosmoshop, quêtes, guildId.

Chaque guilde stocke : nom, emoji, meneur, officiers, membres, niveau, XP, quêtes hebdo, stats.

Autosave toutes les 30 secondes pour les users modifiés + sauvegarde ciblée par userId.


---

## 📷 Screenshots

<p align="center">
  <img src="screenshots/pack.PNG" width="30%"/>
  <img src="screenshots/profil.PNG" width="30%"/>
  <img src="screenshots/succès.PNG" width="30%"/>
  <img src="screenshots/carte.PNG" width="30%"/>
  <img src="screenshots/daily.PNG" width="30%"/>
  <img src="screenshots/event1.PNG" width="30%"/>
  <img src="screenshots/event2.PNG" width="30%"/>
</p>

---

## 📰 Changelog

[Voir le changelog complet](CHANGELOG.md)

---

## 👨‍💻 Auteur

Projet créé par **sauci**

---

## 📜 Licence

Projet fan non officiel inspiré de l'univers Krosmoz (Dofus / Wakfu).

- N'est pas affilié à Ankama
- N'est pas approuvé par Ankama
- Développé uniquement à des fins communautaires

Le bot est entièrement gratuit et ne génère aucun revenu.

Si Ankama demande la modification ou la suppression de certains contenus, ils seront retirés du projet.