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
- Débloquer 367 succès et des titres exclusifs
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

```txt
krosmoz-card
|
|-- commands/
|   |-- joueur/              # commandes joueur (krosmoz, fusion, market, battlepass...)
|   |-- admin/               # commandes admin
|   `-- dev/                 # commandes dev (devbp, devguild, simpack...)
|
|-- systems/
|   |-- achievements/        # modules de succès
|   |-- eventHandlers/       # handlers d'events (1 par Dieu)
|   |-- battlePassService.js # logique Battle Pass (XP, paliers, claims)
|   |-- seasonService.js     # saisons (rotation, templates, rewards)
|   |-- guildSystem.js       # guildes (CRUD, XP, niveaux)
|   |-- guildQuestSystem.js  # quêtes hebdo de guilde (scaling)
|   `-- ...                  # pack, market, user, progression, etc.
|
|-- config/
|   `-- battlepassXP.json    # sources d'XP Battle Pass
|
|-- cron/
|   `-- seasonReset.js       # reset automatique des saisons
|
|-- cards/
|   |-- images/
|   |-- import/
|   `-- sets.json
|
|-- data/
|   |-- users/
|   |-- battlepass/          # current_season, seasons, progress, archive
|   |-- guilds.json
|   |-- market.json
|   |-- krosmoshop.json
|   `-- cards.json
|
|-- index.js
|-- CHANGELOG.md
`-- README.md
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
| eventPackEngine | Packs d'events avec taux boostés (SSR 2%, S 5%), zero pity, handlers modulaires |
| eventSystem | Gestion du cycle de vie des events |
| eventRegistry | Définition des 19 events |
| eventHandlers/ | Logique RNG spécifique par Dieu |
| fusion | Fusion de doublons (critique, double, triple) + bonus |
| questSystem | Quêtes journalières et hebdomadaires |

### 🏰 Guildes

| Système | Rôle |
|---------|------|
| guildSystem | CRUD guildes, XP, niveaux 1→100, hiérarchie (meneur/officier/membre), max 10 membres |
| guildBonuses | Calcul des 9 bonus progressifs par niveau de guilde |
| guildQuestSystem | 3 quêtes hebdo de guilde, scaling dynamique par nombre de membres, pool de 25 quêtes |

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
| achievementRegistry | Agrégateur des 11 modules de succès actifs |
| achievementEngine | Détection avec lecture dynamique des cartes |
| achievementCheck | Pipeline de vérification |
| achievementNotifier | Affichage Discord des succes debloques |
| battlePassService | Progression Battle Pass (XP, niveaux, claim, premium) |
| seasonService | Templates de saisons, rotation, rewards et persistance |

## 🏆 Achievements

367 succès automatiques répartis en 11 catégories actives :

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

Les succès débloquent des **badges**, des **titres** et des **récompenses** (kamas, XP, packs).

Les succès secrets apparaissent comme **🔒 ???** jusqu'à leur découverte et donnent **+50% de kamas** bonus.

### 🎁 Récompenses par tier

Chaque achievement est assigné à un tier de difficulté (1-8) qui détermine ses récompenses automatiques :

| Tier | Difficulté | Kamas | XP | Packs |
|------|-----------|-------|-----|-------|
| 1 | Facile | 100 | 15 | 0 |
| 2 | Basique | 200 | 30 | 0 |
| 3 | Moyen | 400 | 60 | 0 |
| 4 | Difficile | 750 | 120 | 0 |
| 5 | Très dur | 1 500 | 250 | 1 |
| 6 | Extrême | 3 000 | 500 | 2 |
| 7 | Légendaire | 5 000 | 1 000 | 3 |
| 8 | Mythique | 10 000 | 2 000 | 5 |

Le tier est **auto-détecté** par le nombre dans l'ID de l'achievement (ex: `pack100` → tier 4), avec des **overrides manuels** (~100) pour les cas spéciaux (RNG, secrets, comportementaux).

L'XP des succès passe par `addXP()` et peut donc déclencher des **level-ups** en chaîne.

### Architecture rewards

| Fichier | Rôle |
|---------|------|
| achievementRewards | Tiers, auto-détection, overrides, formatage |
| achievementEngine | Applique kamas + XP + packs au déblocage |
| achievementNotifier | Affiche les récompenses en embed Discord |
| achievementCheck | Pipeline de vérification (inchangé) |

### Stats trackées

- `user.stats.achievementKamasEarned` — total kamas gagnés via succès
- `user.stats.achievementXpEarned` — total XP gagnée via succès
- `user.stats.achievementPacksEarned` — total packs gagnés via succès

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

### ☁️ Distribution Incarnam

| Rareté | Cartes | Taux |
|--------|--------|------|
| C | 40 | 33.33% |
| U | 32 | 26.67% |
| R | 22 | 18.33% |
| SR | 11 | 9.17% |
| HR | 7 | 5.83% |
| UR | 4 | 3.33% |
| S | 2 | 1.67% |
| SSR | 2 | 1.67% |

### 🌾 Distribution Astrub

| Rareté | Cartes | Taux |
|--------|--------|------|
| C | 85 | 32.95% |
| U | 69 | 26.74% |
| R | 49 | 18.99% |
| SR | 23 | 8.91% |
| HR | 15 | 5.81% |
| UR | 8 | 3.10% |
| S | 5 | 1.94% |
| SSR | 4 | 1.55% |

### 🌽 Distribution Amakna

| Rareté | Cartes | Taux |
|--------|--------|------|
| C | 98 | 32.89% |
| U | 79 | 26.51% |
| R | 56 | 18.79% |
| SR | 27 | 9.06% |
| HR | 18 | 6.04% |
| UR | 10 | 3.36% |
| S | 5 | 1.68% |
| SSR | 5 | 1.68% |

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
- 👤 **Membres** (max 10 au total) — profitent des bonus

### Niveaux & XP
- La guilde monte du **niveau 1 au niveau 100**
- XP requis par niveau : `100 + niveau × 50` (progressif mais pas trop long)
- L'XP est gagnée via les **quêtes de guilde**

| Niveau | XP requis | XP total cumulé |
|--------|-----------|-----------------|
| 5 | 350 | ~1 250 |
| 10 | 600 | ~3 750 |
| 25 | 1 350 | ~18 750 |
| 50 | 2 600 | ~68 750 |
| 75 | 3 850 | ~150 000 |
| 100 | 5 100 | ~262 500 |

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
- **3 quêtes par semaine**, tirées d'un pool de **25 quêtes** possibles
- Mêmes quêtes pour toutes les guildes (sélection déterministe par semaine)
- Progrès calculé par **diff de stats combinées** de tous les membres
- Récompenses : **350 à 2000 XP de guilde** selon la difficulté
- **Bonus semaine parfaite** si 3/3 terminées : **+500 XP**
- Reset chaque **lundi à 1h** (heure française)

### Scaling dynamique des quêtes

Les objectifs des quêtes s'adaptent automatiquement au nombre de membres de la guilde :

| Membres | Effectif cible | Ratio |
|---------|---------------|-------|
| 1 | 1 | ×0.125 |
| 2 | 2 | ×0.25 |
| 3 | 2 | ×0.25 |
| 4 | 3 | ×0.375 |
| 5 | 4 | ×0.5 |
| 6 | 4 | ×0.5 |
| 7 | 5 | ×0.625 |
| 8 | 6 | ×0.75 |
| 9 | 7 | ×0.875 |
| 10 | 8 | ×1.0 (base) |

Les goals de base sont calibrés pour **8 joueurs actifs**. Une guilde de 10 fait donc facilement les quêtes (car calibrée sur 8). Un joueur seul a des objectifs réduits à 1/8e de la base.

**La récompense XP reste fixe** quel que soit le nombre de membres, pour ne pas pénaliser les petites guildes.

**Exemples de quêtes de guilde (goals pour 10 membres / 8 effectifs) :**

| Quête | Objectif | Récompense |
|-------|----------|------------|
| 📦 Chasseurs de packs | Ouvrir 30 packs | ⭐ 400 XP |
| 📦 Pluie de cartes | Ouvrir 200 packs | ⭐ 2000 XP |
| 🌈 Éclat arc-en-ciel | Obtenir 3 SSR | ⭐ 600 XP |
| 🌈 Chasseurs de SSR | Obtenir 6 SSR | ⭐ 1000 XP |
| ⚗️ Premiers essais | Faire 8 fusions | ⭐ 400 XP |
| ⚗️ Laboratoire actif | Faire 50 fusions | ⭐ 1400 XP |
| 🎁 Partage amical | Faire 4 dons | ⭐ 400 XP |
| 🎁 Philanthropes | Faire 25 dons | ⭐ 1200 XP |
| 💰 Grand déstockage | Vendre 50 cartes | ⭐ 800 XP |
| 🎁 Fidélité collective | Réclamer 20 daily | ⭐ 600 XP |
| 💎 Trésor de guilde | Gagner 80 000 kamas | ⭐ 1200 XP |
| 🛒 Clients du KrosmoShop | Acheter 4 cartes au shop | ⭐ 400 XP |

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

Les events sont des périodes spéciales (~15 min) où un Dieu du Krosmoz modifie les packs.

Chaque joueur reçoit **2-3 tickets** par event pour ouvrir des packs spéciaux via `/eventpack`.

### Taux event (boostés)

Les event packs utilisent des taux **indépendants et boostés** par rapport aux packs normaux, avec **ZERO pity** :

| Rareté | Taux normal | Taux event |
|--------|------------|------------|
| SSR | 0.05% | **2%** (×40) |
| S | 0.15% | **5%** (×33) |
| UR | 0.8% | **10%** (×12) |
| HR | 2% | **18%** |
| SR | 5% | **25%** |
| R | 12% | **22%** |
| U | 25% | **13%** |
| C | 55% | **5%** |

Les event packs **n'affectent pas** les compteurs de pity des packs normaux.

### Les 19 Dieux

Chaque Dieu a son propre mécanisme RNG et ses **voice lines** quand tu obtiens une S ou SSR :

| Dieu | Effet | Mécanique |
|------|-------|-----------|
| 🔥 Iop | Rage critique | Chaque carte peut être upgradée par la rage (5% SSR, 15% S, 25% UR/HR) |
| 🏹 Cra | Tir ciblé | Une carte S spécifique peut apparaître (20% par slot) |
| ⏳ Xelor | Distorsion temporelle | Des cartes sont retirées et d'autres ajoutées aléatoirement |
| 🕶️ Sram | Pack invisible | Les cartes sont cachées puis révélées une par une + 1 carte bonus |
| 💀 Sacrieur | Sacrifice de sang | Mutation +1 rang (C/U/R 70%, SR/HR 50%, UR 30%, S→SSR 10%) |
| 🎭 Zobal | Masque d'évolution | Upgrade garanti de +1 rang sur toutes les cartes |
| 🧠 Huppermage | Énergie élémentaire | +1 à 3 cartes bonus (60% S/UR, 40% random) |
| 🍺 Pandawa | Duplication éthylique | Chaque carte a une chance d'être dupliquée (30% C→HR, 5% SSR) |
| 🐉 Osamodas | Invocation bestiale | Pack homogène d'une seule rareté (5% SSR, 7% S, 8% UR...) |
| 🎲 Ecaflip | RNG extrême | 60% jackpot (pack HR/UR/S/SSR) ou 40% double upgrade massif |
| 🐺 Ouginak | Chasse du prédateur | Risque/récompense : 30% downgrade, 25% +1, 15% +2, 5% +3 (SSR) |
| 🛡️ Feca | Bouclier divin | Filtre C/U + remplissage protégé (3% SSR, 8% S, 25% UR) |
| 💰 Enutrof | Richesse divine | Kamas ×5 + jackpot caché (1%) |
| 💣 Roublard | Explosion | +3 cartes bonus aléatoires |
| ⚙️ Steamer | Chaos mécanique | Pack totalement aléatoire (toutes raretés possibles) |
| 🌀 Eliotrope | Portail dimensionnel | Pack haute qualité (8% SSR, 25% S, 35% UR, 32% HR par carte) |
| ✨ Eniripsa | Miracle de guérison | Purification C/U/R + guérison (UR→S 15%, S→SSR 5%) + 1 carte bonus |
| 🌿 Sadida | Croissance naturelle | Duplication progressive (35% par carte, max 2 duplications) |
| ⚔️ Forgelance | Forge divine | Upgrade global de +1 rang sur toutes les cartes |

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

## 🎟️ Battle Pass & Saisons

### Cycle des saisons

- Le Battle Pass fonctionne par saisons de **21 jours**
- Rotation des themes : `emeraude -> pourpre -> turquoise -> ocre -> ivoire -> ebene`
- Chaque saison a son template (couleur, bonus passif, recompenses, achievements saisonniers)
- En fin de saison : reset de progression saisonniere + archivage + passage automatique a la saison suivante

### Progression Battle Pass

- **40 niveaux** par saison
- XP Battle Pass gagnee via les activites (packs, fusion, daily, progression set, etc.)
- Courbe XP progressive (`xpCurve`) pour lisser la progression sur 21 jours
- Claim manuel des paliers debloques (free et premium)
- Option Premium avec achat confirme avant depense

### Rewards

- Deux pistes de recompenses :
  - **Free track** (accessible a tous)
  - **Premium track** (debloquee apres achat Premium)
- Recompenses possibles : kamas, XP joueur, packs, packs premium, cartes rares/SSR, titres, badges
- Les recompenses Premium sont presentes a chaque palier et les paliers cles ont des rewards renforces

### Succes Battle Pass

- Les succes Battle Pass sont geres **hors** `systems/achievementRegistry.js`
- Succes saisonniers (template de saison) : `systems/seasonService.js` via `buildSeasonAchievements()`
- Succes globaux Battle Pass : `data/battlepass/global_achievements.json` (genere/maintenu par `seasonService`)
- Progression et etat de claim par joueur : `data/battlepass/progress/<userId>.json`
- Les `367 succes` du README correspondent au registre principal; les succes Battle Pass sont un bloc separe

### Commandes liees

| Commande | Description |
|----------|-------------|
| /battlepass | Ouvrir l'interface Battle Pass (progression, rewards, claim, premium, succes) |
| /devbp | Outils dev Battle Pass (status, add-xp, force saison, reset, dry-run...) |

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

### 💰 Économie
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
| /quests | Quetes journalieres et hebdomadaires |
| /battlepass | Interface Battle Pass (progression, rewards, premium, claim) |

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
| /achievements | Voir les 367 succès |
| /krosmohelp | Aide du bot |

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
| /devguild | Gerer les guildes (list, info, setlevel, addxp, forcejoin, disband, create, bonuses) |
| /devbp | Outils dev Battle Pass (status, add-xp, force, reset, claim-all, dry-run) |

---

## 🏆 Achievements

367 succès automatiques répartis en 11 catégories actives :

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

## ?? Sch�ma simplifi�

```txt
Discord Commands
      |
      v
Command Handlers
      |
      +--> packEngine ------+
      |                     |
      +--> eventPackEngine  |
      |                     +--> userSystem <--> progressionSystem
      +--> fusion ----------+          |               |
      |                                |               +--> playerBonuses
      +--> market ---------------------+ 
      |
      +--> guildSystem --> guildBonuses
      |
      +--> battlePassService <--> seasonService
                                  |
                                  +--> cron/seasonReset

userSystem / battlePassService / guildSystem
      |
      v
dataManager
      |
      +--> /data/users/*.json
      +--> /data/battlepass/*
      +--> /data/guilds.json, market.json, krosmoshop.json...
```

---

## ?? Stockage des donn�es

Fichiers JSON individuels par joueur (dirty save system).

```txt
/data
  users/
    123456789.json
    987654321.json
  battlepass/
    current_season.json
    global_achievements.json
    seasons/
      emeraude.json
      pourpre.json
      ...
    progress/
      <userId>.json
    archive/
      season_*.json
  guilds.json
  market.json
  marketHistory.json
  krosmoshop.json
  devs.json
  cards.json
```

Chaque joueur stocke : inventaire, shiny cards, kamas, pity, achievements, titres, progression, stats, krosmoshop, qu�tes, guildId, progression Battle Pass.

Chaque guilde stocke : nom, emoji, meneur, officiers, membres, niveau, XP, qu�tes hebdo, stats.

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

