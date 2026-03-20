# 🎴 Krosmoz Card Bot

Krosmoz Card Bot est un bot Discord implémentant un jeu de collection de cartes (TCG) inspiré de l'univers Krosmoz (Wakfu / Dofus).

Les joueurs peuvent :

- Ouvrir des packs et collectionner 674 cartes
- Compléter 3 sets (Incarnam, Astrub, Amakna)
- Fusionner des doublons pour monter en rareté
- Vendre et acheter sur le marché entre joueurs
- Participer aux événements des 19 Dieux du Krosmoz
- Acheter des cartes au KrosmoShop quotidien
- Débloquer 306 succès et des titres exclusifs
- Progresser en niveau et en rang
- Interagir avec le bot via mentions

---

## ⚙️ Technologies

- Node.js
- discord.js v14
- JSON Database (fichiers individuels par joueur)
- Canvas (images inventaire)
- Sharp (traitement d'images cartes)
- Architecture modulaire (systems/)

---

## 📂 Structure du projet

```
krosmoz-card-bot
│
├── commands/
│   ├── joueur/         # commandes joueur (krosmoz, inventaire, market...)
│   ├── admin/          # commandes admin (krosmoevent, stats)
│   └── dev/            # commandes dev (addcard, simpack, hardpity...)
│
├── systems/
│   ├── achievements/   # 9 fichiers d'achievements modulaires
│   ├── eventHandlers/  # 19 handlers d'events (1 par Dieu)
│   └── ...             # systèmes principaux
│
├── cards/
│   ├── images/         # images des cartes (par set)
│   ├── import/         # dossier d'import batch
│   └── sets.json       # définition des sets
│
├── data/               # données persistantes
│   ├── users/          # fichiers joueurs individuels
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
| constants | Constantes centralisées (raretés, prix, couleurs) |

### 🎮 Gameplay

| Système | Rôle |
|---------|------|
| pack | Génération RNG des cartes avec soft/hard pity |
| packEngine | Wrapper avec achievements, XP, stats |
| eventPackEngine | Packs d'events avec handlers modulaires |
| eventSystem | Gestion du cycle de vie des events |
| eventRegistry | Définition des 19 events |
| eventHandlers/ | Logique RNG spécifique par Dieu |
| fusion | Fusion de doublons (critique, double, triple) |

### 🪙 Économie

| Système | Rôle |
|---------|------|
| economy | Gestion des kamas |
| market | Marché entre joueurs (anti-manipulation) |
| krosmoshop | Shop quotidien (15 cartes, reset minuit) |
| rewardSystem | Récompenses events (multiplicateurs, jackpots) |

### 📈 Progression

| Système | Rôle |
|---------|------|
| progressionSystem | XP et level-up |
| rankSystem | Rangs basés sur les achievements |
| achievementRegistry | Agrégateur des 9 modules d'achievements |
| achievementEngine | Détection avec lecture dynamique des cartes |
| achievementCheck | Pipeline de vérification |
| achievementNotifier | Affichage Discord des succès débloqués |

### 🏆 306 Achievements (9 modules)

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

---

## 🎴 Cartes

674 cartes réparties en 3 sets :

| Set | Cartes |
|-----|--------|
| ☁️ Incarnam | 120 |
| 🌾 Astrub | 258 |
| 🌽 Amakna | 296 |

### ⭐ Raretés

| Rareté | Emoji | Prix vente | Prix market |
|--------|-------|-----------|-------------|
| C | ⚪ | 2 | 5 |
| U | 🟢 | 5 | 10 |
| R | 🔵 | 10 | 20 |
| SR | 🟣 | 20 | 40 |
| HR | 🔴 | 40 | 80 |
| UR | 🟡 | 75 | 150 |
| S | ✨ | 150 | 300 |
| SSR | 🌈 | 500 | 1000 |

### ✨ SSR Shiny

Les SSR ont 0.5% de chance d'être **Shiny** — variante cosmétique rare avec un affichage doré et un tracking persistant dans l'inventaire.

---

## 🎲 Système de Pity

Chaque set possède son propre compteur de pity indépendant.

### Hard Pity (garanti)

| Rareté | Garantie |
|--------|----------|
| UR | 10 packs |
| S | 30 packs |
| SSR | 50 packs |

### Soft Pity SSR (progressive)

| Packs sans SSR | Chance SSR |
|----------------|-----------|
| < 20 | 0.05% |
| < 30 | 0.10% |
| < 35 | 0.30% |
| < 40 | 0.50% |
| < 43 | 1.00% |
| < 46 | 2.00% |
| < 49 | 5.00% |
| 50 | garanti |

### Soft Pity S

| Packs sans S | Chance S |
|-------------|---------|
| < 15 | 0.15% |
| < 20 | 0.30% |
| < 25 | 0.60% |
| < 28 | 1.20% |
| < 29 | 3.00% |
| 30 | garanti |

### 🎁 Lucky Pack

10% de chance → +1 carte bonus dans le pack.

---

## 🎪 Système d'Events

19 événements basés sur les Dieux du Krosmoz. Chaque event dure ~15 minutes et modifie le RNG des packs.

| Dieu | Type | Effet |
|------|------|-------|
| 🔥 Iop | Boost | HR & UR dominants |
| 🎯 Cra | Ciblé | Carte S spécifique (20%) |
| ⏳ Xelor | Manipulation | Cartes retirées/ajoutées |
| 🕶️ Sram | Caché | Pack totalement invisible |
| 💀 Sacrieur | Mutation | Upgrade 60% (ignore S/SSR) |
| 🎭 Zobal | Upgrade | Upgrade garanti +1 rang |
| 🧠 Huppermage | Volume | 1-3 cartes bonus (S/UR boost) |
| 🍺 Pandawa | Duplication | Cartes dupliquées |
| 🐉 Osamodas | Structure | Pack homogène (1 rareté) |
| 🎲 Ecaflip | RNG | Jackpot ou amélioration massive |
| 🐺 Ouginak | Négatif | Dégradation + cartes faibles |
| 🛡️ Feca | Filtre | Suppression C/U + XP ×5 |
| 💰 Enutrof | Reward | Kamas ×5 + jackpot caché |
| 💣 Roublard | Volume | +3 cartes |
| ⚙️ Steamer | Chaos | RNG totalement aléatoire |
| 🌀 Eliotrope | Spécial | Pack fixe HR/UR/S |
| ✨ Eniripsa | Filtre | Suppression C/U/R |
| 🌿 Sadida | Duplication | Duplication progressive |
| ⚔️ Forgelance | Upgrade | Upgrade global +1 rang |

Chaque Dieu possède des **voice lines** RP lors de l'obtention d'une S ou SSR, et un système de tickets (2-3 par joueur par event).

---

## 🎮 Commandes Joueur

### Packs
| Commande | Description |
|----------|-------------|
| /krosmoz | Ouvrir un pack (1 gratuit/heure) |
| /buypack | Acheter un pack (1250 kamas) |
| /eventpack | Ouvrir un pack d'event |
| /pity | Voir ta pity par set |

### Collection
| Commande | Description |
|----------|-------------|
| /inventaire | Voir ton inventaire (tri, filtres, shiny) |
| /carte | Afficher une carte par nom ou ID |
| /listcards | Explorer les cartes par set |

### Économie
| Commande | Description |
|----------|-------------|
| /balance | Voir ton solde |
| /sellcard | Vendre une carte |
| /sellduplicates | Vendre tous les doublons |
| /market | Marché entre joueurs |
| /krosmoshop | Boutique quotidienne |

### Gameplay
| Commande | Description |
|----------|-------------|
| /daily | Récompense quotidienne (streak 7 = SSR) |
| /fusion | Fusionner des doublons |
| /trade | Échanger avec un joueur |

### Progression
| Commande | Description |
|----------|-------------|
| /profil | Profil complet |
| /leaderboard | Classements (6 catégories) |
| /titre | Choisir ton titre |
| /achievements | Voir les 306 succès |
| /krosmohelp | Aide du bot |

---

## 🏆 Achievements

306 succès automatiques répartis en 9 catégories :

- **Packs** — ouvertures, achats, RNG spéciaux
- **Raretés** — SSR, Shiny, KrosmoShop
- **Fusion** — critique, double, triple
- **Collection** — cartes totales, uniques, sets, hoarder
- **Économie** — kamas, daily, balance, inventaire, titres
- **Social** — profil, leaderboard, mentions du bot
- **Secrets** — Krosmo-bot, achievements cachés
- **Events** — 148 achievements (participation, SSR par classe, jackpots)
- **Spéciaux** — comportementaux (palindrome, minuit, all C, prestige...)

Les succès débloquent des **badges** et des **titres**.

Les succès secrets apparaissent comme **🔒 ???** jusqu'à leur découverte.

---

## 🔁 Gameplay Loop

1. Ouvrir des packs (/krosmoz, /eventpack)
2. Collectionner des cartes
3. Vendre les doublons (/sellduplicates, /market)
4. Fusionner pour monter en rareté (/fusion)
5. Compléter les sets
6. Acheter au KrosmoShop quotidien
7. Participer aux events des Dieux
8. Débloquer des achievements et des titres
9. Monter en niveau et en rang

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
                       │
                       ▼
                  dataManager
                       │
                       ▼
                     /data
```

---

## 📦 Stockage des données

Fichiers JSON individuels par joueur (dirty save system).

```
/data
   users/
      123456789.json
      987654321.json
   market.json
   marketHistory.json
   krosmoshop.json
   devs.json
   cards.json
```

Chaque joueur stocke : inventaire, shiny cards, kamas, pity, achievements, titres, progression, stats, krosmoshop.

Autosave toutes les 30 secondes pour les users modifiés + sauvegarde ciblée par userId.

---

## 📷 Screenshots

<p align="center">
  <img src="screenshots/pack.PNG" width="30%"/>
  <img src="screenshots/profil.PNG" width="30%"/>
  <img src="screenshots/succès.PNG" width="30%"/>
  <img src="screenshots/carte.PNG" width="30%"/>
  <img src="screenshots/daily.PNG" width="30%"/>
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