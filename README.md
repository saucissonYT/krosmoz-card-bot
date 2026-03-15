# 🎴 Krosmoz Card Bot

**Krosmoz Card Bot** est un bot Discord implémentant un **jeu de collection de cartes (TCG)** inspiré de l'univers **Krosmoz (Wakfu / Dofus)**.

Les joueurs peuvent :

* ouvrir des **packs**
* collectionner des **cartes**
* gagner des **kamas**
* compléter des **sets**
* faire des **échanges**
* vendre des cartes sur un **marché**
* débloquer des **succès**
* progresser en **niveau et rang**

Le bot est conçu avec une **architecture modulaire Node.js** afin de faciliter les ajouts de contenu et de fonctionnalités.

---

# ⚙️ Technologies utilisées

* **Node.js**
* **discord.js v14**
* **JSON Database**
* **Canvas** (images inventaire)
* Architecture modulaire (`systems/`)

---

# 📂 Structure du projet

```
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
```
---

# 🧠 Architecture

Le bot est construit avec une architecture modulaire basée sur des systèmes indépendants situés dans le dossier :

systems/

Chaque système gère une mécanique spécifique du jeu, ce qui permet de maintenir un code propre et facilement extensible.

⚙️ Systèmes principaux
système	rôle
dataManager	gestion des données persistantes (/data)
userSystem	gestion des utilisateurs
cardRegistry	indexation et accès rapide aux cartes
cardId	gestion des identifiants de cartes

🎮 Gameplay
système	rôle
pack	ouverture de packs
packEngine	génération des cartes dans les packs
setSystem	gestion des sets et collections
setSystemFile	gestion des fichiers de sets
fusion (dans commandes)	fusion des cartes

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
achievementSystem	gestion des succès
achievementCheck	vérification automatique des succès

🎁 Activités
système	rôle
dailySystem	récompenses quotidiennes
eventSystem	gestion des événements

🛠 Outils internes
système	rôle
inventoryImage	génération d'image d'inventaire
auditSystem	logs développeur
antiAbuse	protection contre le farm abusif
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

---

📦 Stockage des données

Le bot utilise un système de stockage basé sur des fichiers JSON.

Structure :

/data
   users/
      123456789.json
      987654321.json
   market.json
   marketHistory.json
   devs.json
   cards.json

### users.json

Stocke :

* inventaire cartes
* kamas
* achievements
* niveau
* xp
* statistiques

### market.json

Stocke :

* annonces du marché
* vendeur
* prix
* carte

---

# 🎴 Cartes

Les cartes sont définies dans :

```
cards/cards.json
```

Structure :

```json
{
 "id": 1,
 "name": "Cra",
 "rarity": "C",
 "set": "incarnam",
 "image": "1_cra_incarnam_c.jpg"
}
```

---

# ⭐ Raretés

| Rarete | Emoji |
| ------ | ----- |
| C      | ⚪     |
| U      | 🟢    |
| R      | 🔵    |
| SR     | 🟣    |
| HR     | 🔴    |
| UR     | 🟡    |
| S      | ✨     |
| SSR    | 🌈    |

---

## 📦 Sets de cartes

Le jeu contient actuellement **3 sets principaux** totalisant **499 cartes**.

### ☁️ Incarnam — Set de départ

Premier set du jeu.
Les joueurs commencent leur collection avec les cartes d’**Incarnam**.

* **120 cartes**
* Majorité de **C / U**
* Quelques cartes **SR / HR / UR**
* Quelques **SSR** très rares


---

### 🌾 Astrub — Set principal

Deuxième set du jeu avec beaucoup plus de contenu et d’équipements.

* **246 cartes**
* Beaucoup d’objets, ressources et panoplies
* Plusieurs cartes **rares et spéciales**

---

### 🌽 Amakna — Première extension

Troisième set du jeu avec encore plus de contenu, basé sur amakna de Wakfu MMO.

* **253 cartes**
* Beaucoup d’objets, ressources et panoplies
* Plusieurs cartes **rares et spéciales**
* Le légendaire khan karkass



---

### 📊 Total du jeu

499 cartes

# 🎮 Commandes Joueur

## Packs

```
/krosmoz
/buypack
/pity
```

## Inventaire

```
/inventaire
/carte
/listcards
```

## Économie

```
/balance
/sellcard
/sellduplicate
```

## Marché

```
/market
```

Fonctionnalités :

* achat
* vente
* tri
* filtres
* pagination

---

## Collection

```
/listcards
```

---

## Progression

```
/profil
/leaderboard
/titre
```

---

## Gameplay

```
/daily
/fusion
/trade
```

---

## Succès

```
/achievement
```

---

## Aide

```
/kroshelp
```

---

# 🛠 Commandes Admin

```
/event
/stats
```

---

# ⚙️ Commandes Développeur

```
/devhelp
/addcard
/editcard
/removecard
/importcards
/devpack
/devgive
/devachievement
/devdaily
/cooldown
/resetcooldown
/resetpity
/hardpity
/simpack
/previewcard
/krosmodev
/krosmoreload
```

Gestion des sets :

```
/setcreate
/setedit
/setdelete
/setreward
/setstats
/setlist
```

---

# 🪙 Économie

Monnaie utilisée :

**Kamas**

Sources :

* packs
* daily
* ventes
* événements
* récompenses

---

# 📈 Progression

Les joueurs gagnent :

* **XP**
* **niveaux**
* **rangs**
* **badges**

Affichés dans :

```
/profil
```

---

# 🏆 Achievements

Le bot possède un système de **succès automatiques** :

Exemples :

* ouvrir X packs
* obtenir SSR
* compléter un set
* utiliser le marché

---

# 🧩 Fonctionnalités principales

✔ système de **packs gacha**
✔ **inventaire paginé**
✔ **marché entre joueurs**
✔ **échanges sécurisés**
✔ **système de sets**
✔ **fusion de cartes**
✔ **succès automatiques**
✔ **progression et rangs**
✔ **economy avec kamas**
✔ **interface Discord interactive**

---

# 🛣 Roadmap

Fonctionnalités prévues :

* 🔥 nouveaux sets
* 🏹 events temporaires
* 📊 statistiques avancées

---

## 📰 Changelog

Historique des mises à jour :

[Voir le changelog](CHANGELOG.md)

---

# 👨‍💻 Auteur

Projet créé par :

 sauci 

---

## 📸 Screenshots

### 🎴 Ouverture de pack
![Pack](screenshots/pack.PNG)

### 👤 Profil joueur
![Profil](screenshots/profil.PNG)

### 🎴 Carte
![Carte](screenshots/carte.PNG)

### 🎁 Daily reward
![Daily](screenshots/daily.PNG)

### 🏆 Succès
![Succès](screenshots/succès.PNG)

---

bot hébergé pour l'instant sur railway

---

# 📜 Licence

Rédaction
📜 Licence

Ce projet est distribué comme projet open-source non commercial.

Krosmoz Card Bot est un projet fan non officiel inspiré de l’univers Krosmoz (Dofus / Wakfu).

Tous les droits relatifs à l’univers, aux personnages, aux noms et aux visuels appartiennent à Ankama.

Ce projet :

n’est pas affilié à Ankama

n’est pas approuvé par Ankama

est développé uniquement à des fins communautaires.

Le bot est entièrement gratuit et ne génère aucun revenu.

Si Ankama demande la modification ou la suppression de certains contenus, ils seront retirés du projet (et il sera adapté à un autre univers).

---
