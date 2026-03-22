# ðŸŽ´ Krosmoz Card Bot

Krosmoz Card Bot est un bot Discord implÃ©mentant un jeu de collection de cartes (TCG) inspirÃ© de l'univers Krosmoz (Wakfu / Dofus).

Les joueurs peuvent :

- Ouvrir des packs et collectionner 1025 cartes
- ComplÃ©ter 4 sets (Incarnam, Astrub, Amakna, Sufokia)
- Fusionner des doublons pour monter en raretÃ©
- Vendre et acheter sur le marchÃ© entre joueurs
- Participer aux Ã©vÃ©nements des 19 Dieux du Krosmoz
- Acheter des cartes au KrosmoShop quotidien
- ComplÃ©ter des quÃªtes journaliÃ¨res et hebdomadaires
- CrÃ©er ou rejoindre une guilde et profiter de bonus collectifs
- Donner des cartes Ã  d'autres joueurs
- Progresser jusqu'au niveau 100 et dÃ©bloquer des bonus permanents
- DÃ©bloquer 367 succÃ¨s et des titres exclusifs
- Interagir avec le bot via mentions

---

## âš™ï¸ Technologies

- Node.js
- discord.js v14
- JSON Database (fichiers individuels par joueur + guilds.json)
- Canvas (images inventaire)
- Sharp (traitement d'images cartes)
- Architecture modulaire (systems/)

---

## ðŸ“‚ Structure du projet

```txt
krosmoz-card
|
|-- commands/
|   |-- joueur/              # commandes joueur (krosmoz, fusion, market, battlepass...)
|   |-- admin/               # commandes admin
|   `-- dev/                 # commandes dev (devbp, devguild, simpack...)
|
|-- systems/
|   |-- achievements/        # modules de succÃ¨s
|   |-- eventHandlers/       # handlers d'events (1 par Dieu)
|   |-- battlePassService.js # logique Battle Pass (XP, paliers, claims)
|   |-- seasonService.js     # saisons (rotation, templates, rewards)
|   |-- guildSystem.js       # guildes (CRUD, XP, niveaux)
|   |-- guildQuestSystem.js  # quÃªtes hebdo de guilde (scaling)
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

## ðŸ§  Architecture

Le bot utilise une architecture modulaire basÃ©e sur des systÃ¨mes indÃ©pendants.

### âš™ï¸ SystÃ¨mes principaux

| SystÃ¨me | RÃ´le |
|---------|------|
| dataManager | DonnÃ©es persistantes, autosave 30s, dirty save |
| userSystem | Gestion des utilisateurs (fichiers individuels) |
| cardRegistry | Indexation dynamique des cartes |
| constants | Constantes centralisÃ©es (raretÃ©s, prix, couleurs, PACK_PRICE, MAX_PLAYER_LEVEL) |

### ðŸŽ® Gameplay

| SystÃ¨me | RÃ´le |
|---------|------|
| pack | GÃ©nÃ©ration RNG des cartes avec soft/hard pity |
| packEngine | Wrapper avec achievements, XP, stats, bonus guilde/joueur |
| eventPackEngine | Packs d'events avec taux boostÃ©s (SSR 2%, S 5%), zero pity, handlers modulaires |
| eventSystem | Gestion du cycle de vie des events |
| eventRegistry | DÃ©finition des 19 events |
| eventHandlers/ | Logique RNG spÃ©cifique par Dieu |
| fusion | Fusion de doublons (critique, double, triple) + bonus |
| questSystem | QuÃªtes journaliÃ¨res et hebdomadaires |

### ðŸ° Guildes

| SystÃ¨me | RÃ´le |
|---------|------|
| guildSystem | CRUD guildes, XP, niveaux 1â†’100, hiÃ©rarchie (meneur/officier/membre), max 10 membres |
| guildBonuses | Calcul des 9 bonus progressifs par niveau de guilde |
| guildQuestSystem | 3 quÃªtes hebdo de guilde, scaling dynamique par nombre de membres, pool de 25 quÃªtes |

### ðŸª™ Ã‰conomie

| SystÃ¨me | RÃ´le |
|---------|------|
| economy | Gestion des kamas (reward par raretÃ©) |
| market | MarchÃ© entre joueurs (anti-manipulation) |
| krosmoshop | Shop quotidien (15 cartes, reset minuit, rÃ©ductions guilde/joueur) |
| rewardSystem | RÃ©compenses events (multiplicateurs, jackpots) |

### ðŸ“ˆ Progression

| SystÃ¨me | RÃ´le |
|---------|------|
| progressionSystem | XP et level-up (cap 100), milestones, bonus XP intÃ©grÃ© |
| playerBonuses | 9 bonus progressifs par niveau du joueur |
| rankSystem | Rangs basÃ©s sur les achievements |
| achievementRegistry | AgrÃ©gateur des 11 modules de succÃ¨s actifs |
| achievementEngine | DÃ©tection avec lecture dynamique des cartes |
| achievementCheck | Pipeline de vÃ©rification |
| achievementNotifier | Affichage Discord des succes debloques |
| battlePassService | Progression Battle Pass (XP, niveaux, claim, premium) |
| seasonService | Templates de saisons, rotation, rewards et persistance |

## ðŸ† Achievements

367 succÃ¨s automatiques rÃ©partis en 11 catÃ©gories actives :

- **Packs** â€” ouvertures, achats, RNG spÃ©ciaux
- **RaretÃ©s** â€” SSR, Shiny, KrosmoShop
- **Fusion** â€” critique, double, triple
- **Collection** â€” cartes totales, uniques, sets, hoarder
- **Ã‰conomie** â€” kamas, daily, balance, inventaire, titres
- **Social** â€” profil, leaderboard, mentions du bot
- **Secrets** â€” Krosmo-bot, achievements cachÃ©s
- **Events** â€” 148 achievements (participation, SSR par classe, jackpots)
- **SpÃ©ciaux** â€” comportementaux (palindrome, minuit, all C, prestige...)
- **Dons** â€” 15 achievements (donnÃ©s, reÃ§us, SSR, shiny, streak, mutuels)
- **Guildes** â€” 29 achievements (niveaux, quÃªtes, vÃ©tÃ©ran, contributeur, secrets)

Les succÃ¨s dÃ©bloquent des **badges**, des **titres** et des **rÃ©compenses** (kamas, XP, packs).

Les succÃ¨s secrets apparaissent comme **ðŸ”’ ???** jusqu'Ã  leur dÃ©couverte et donnent **+50% de kamas** bonus.

### ðŸŽ RÃ©compenses par tier

Chaque achievement est assignÃ© Ã  un tier de difficultÃ© (1-8) qui dÃ©termine ses rÃ©compenses automatiques :

| Tier | DifficultÃ© | Kamas | XP | Packs |
|------|-----------|-------|-----|-------|
| 1 | Facile | 100 | 15 | 0 |
| 2 | Basique | 200 | 30 | 0 |
| 3 | Moyen | 400 | 60 | 0 |
| 4 | Difficile | 750 | 120 | 0 |
| 5 | TrÃ¨s dur | 1 500 | 250 | 1 |
| 6 | ExtrÃªme | 3 000 | 500 | 2 |
| 7 | LÃ©gendaire | 5 000 | 1 000 | 3 |
| 8 | Mythique | 10 000 | 2 000 | 5 |

Le tier est **auto-dÃ©tectÃ©** par le nombre dans l'ID de l'achievement (ex: `pack100` â†’ tier 4), avec des **overrides manuels** (~100) pour les cas spÃ©ciaux (RNG, secrets, comportementaux).

L'XP des succÃ¨s passe par `addXP()` et peut donc dÃ©clencher des **level-ups** en chaÃ®ne.

### Architecture rewards

| Fichier | RÃ´le |
|---------|------|
| achievementRewards | Tiers, auto-dÃ©tection, overrides, formatage |
| achievementEngine | Applique kamas + XP + packs au dÃ©blocage |
| achievementNotifier | Affiche les rÃ©compenses en embed Discord |
| achievementCheck | Pipeline de vÃ©rification (inchangÃ©) |

### Stats trackÃ©es

- `user.stats.achievementKamasEarned` â€” total kamas gagnÃ©s via succÃ¨s
- `user.stats.achievementXpEarned` â€” total XP gagnÃ©e via succÃ¨s
- `user.stats.achievementPacksEarned` â€” total packs gagnÃ©s via succÃ¨s

---

## ðŸŽ´ Cartes

1025 cartes rÃ©parties en 4 sets :

| Set | Cartes |
|-----|--------|
| â˜ï¸ Incarnam | 120 |
| ðŸŒ¾ Astrub | 258 |
| ðŸŒ½ Amakna | 298 |
| ðŸŒŠ Sufokia | 349 |

### â­ RaretÃ©s & Ã‰conomie

| RaretÃ© | Emoji | Prix vente (bot) | Prix market | Prix KrosmoShop |
|--------|-------|-----------------|-------------|-----------------|
| C | âšª | 3 | 8 | â€” |
| U | ðŸŸ¢ | 8 | 20 | â€” |
| R | ðŸ”µ | 20 | 50 | â€” |
| SR | ðŸŸ£ | 50 | 120 | 300 |
| HR | ðŸ”´ | 120 | 300 | 750 |
| UR | ðŸŸ¡ | 320 | 800 | 2 000 |
| S | âœ¨ | 800 | 2 000 | 5 000 |
| SSR | ðŸŒˆ | 2 000 | 5 000 | 12 000 |

**Prix d'un pack : 800 kamas** (1 gratuit/heure, cooldown rÃ©duit par niveau)

### CoÃ»ts de fusion

| RaretÃ© fusionnÃ©e | Doublons requis |
|-----------------|-----------------|
| C â†’ U | 10 doublons |
| U â†’ R | 20 doublons |
| R â†’ SR | 40 doublons |
| SR â†’ HR | 80 doublons |
| HR â†’ UR | 150 doublons |
| UR â†’ S | 300 doublons |
| S â†’ SSR | 500 doublons |

### â˜ï¸ Distribution Incarnam

| RaretÃ© | Cartes | Taux |
|--------|--------|------|
| C | 40 | 33.33% |
| U | 32 | 26.67% |
| R | 22 | 18.33% |
| SR | 11 | 9.17% |
| HR | 7 | 5.83% |
| UR | 4 | 3.33% |
| S | 2 | 1.67% |
| SSR | 2 | 1.67% |

### ðŸŒ¾ Distribution Astrub

| RaretÃ© | Cartes | Taux |
|--------|--------|------|
| C | 85 | 32.95% |
| U | 69 | 26.74% |
| R | 49 | 18.99% |
| SR | 23 | 8.91% |
| HR | 15 | 5.81% |
| UR | 8 | 3.10% |
| S | 5 | 1.94% |
| SSR | 4 | 1.55% |

### ðŸŒ½ Distribution Amakna

| RaretÃ© | Cartes | Taux |
|--------|--------|------|
| C | 98 | 32.89% |
| U | 79 | 26.51% |
| R | 56 | 18.79% |
| SR | 27 | 9.06% |
| HR | 18 | 6.04% |
| UR | 10 | 3.36% |
| S | 5 | 1.68% |
| SSR | 5 | 1.68% |

### ðŸŒŠ Distribution Sufokia

| RaretÃ© | Cartes | Taux |
|--------|--------|------|
| C | 115 | 32.95% |
| U | 94 | 26.93% |
| R | 66 | 18.91% |
| SR | 31 | 8.88% |
| HR | 21 | 6.02% |
| UR | 11 | 3.15% |
| S | 6 | 1.72% |
| SSR | 5 | 1.43% |

### âœ¨ SSR Shiny

Les SSR ont 0.5% de chance d'Ãªtre **Shiny** (+ bonus de niveau joueur) â€” variante cosmÃ©tique rare avec un affichage dorÃ© et un tracking persistant dans l'inventaire.

---

## ðŸŽ² SystÃ¨me de Pity

Chaque set possÃ¨de son propre compteur de pity indÃ©pendant.

| RaretÃ© | Pity | MÃ©canisme |
|--------|------|-----------|
| UR | 10 packs | Garantie Ã  10 packs sans UR |
| S | 30 packs | Soft pity progressive dÃ¨s 20 packs |
| SSR | 50 packs | Soft pity progressive dÃ¨s 30 packs |

---

## â­ SystÃ¨me de Niveaux

### Progression joueur

- **Niveau max : 100**
- Formule XP : `80 + niveau Ã— 30` par niveau (progressive, jamais brutale)
- XP total pour atteindre le niveau 100 : ~160 000

| Niveau | XP requis | XP total cumulÃ© |
|--------|-----------|-----------------|
| 10 | 380 | ~2 300 |
| 25 | 830 | ~11 500 |
| 50 | 1 580 | ~42 000 |
| 75 | 2 330 | ~92 000 |
| 100 | 3 080 | ~160 000 |

### Milestones

| Niveau | Bonus kamas | Bonus packs |
|--------|-------------|-------------|
| 10 | +500 | â€” |
| 25 | +1 500 | +2 |
| 50 | +5 000 | +5 |
| 75 | +10 000 | +5 |
| 100 | +25 000 | +10 |

### 9 Bonus par niveau du joueur

Les bonus se **cumulent** avec les bonus de guilde.

| Bonus | Progression | Max (niv.100) |
|-------|------------|---------------|
| ðŸ’° Kamas bonus | +1% / 4 niv. | +25% |
| ðŸ”¥ Fusion critique | +0.5% / 8 niv. | +6% |
| ðŸ€ Lucky pack | +1% / 10 niv. | +10% |
| â­ XP bonus | +5% / 20 niv. | +25% |
| ðŸª RÃ©duction KrosmoShop | +1% / 15 niv. | +6% |
| ðŸŽ Kamas daily bonus | +50 / 10 niv. | +500 |
| ðŸŽ² Double daily | +2% / 25 niv. | +8% |
| âœ¨ Chance shiny | +1% / 50 niv. | +2% |
| â±ï¸ RÃ©duction cooldown pack | -5 min / 20 niv. | -25 min (35 min min.) |

---

## ðŸ° SystÃ¨me de Guildes

### CrÃ©ation
- CoÃ»te **5000 kamas**
- Nom choisi par le joueur (3-24 caractÃ¨res, unique)
- Emoji alÃ©atoire attribuÃ© automatiquement parmi 50 emojis thÃ©matiques
- Le crÃ©ateur devient **Meneur** (ðŸ‘‘)

### HiÃ©rarchie
- ðŸ‘‘ **Meneur** (1) â€” tous les droits
- âš”ï¸ **Officiers** (max 3) â€” invite, kick membres, claim quÃªtes
- ðŸ‘¤ **Membres** (max 10 au total) â€” profitent des bonus

### Niveaux & XP
- La guilde monte du **niveau 1 au niveau 100**
- XP requis par niveau : `100 + niveau Ã— 50` (progressif mais pas trop long)
- L'XP est gagnÃ©e via les **quÃªtes de guilde**

| Niveau | XP requis | XP total cumulÃ© |
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
| ðŸ’° Kamas bonus sur les packs | +1% / 5 niv. | +20% |
| ðŸ”¥ Chance de fusion critique | +0.5% / 10 niv. | +5% |
| âœ¨ Chance de fusion double | +0.5% / 15 niv. | +3% |
| ðŸŒˆ Chance de fusion triple | +0.25% / 25 niv. | +1% |
| ðŸ€ Chance de lucky pack | +1% / 10 niv. | +10% |
| â­ XP bonus | +5% / 20 niv. | +25% |
| ðŸª RÃ©duction KrosmoShop | +2% / 25 niv. | +8% |
| ðŸ“¦ Packs daily bonus | +1 / 50 niv. | +2 |
| ðŸŽ Chance de double daily | +1% / 20 niv. | +5% |

### QuÃªtes de guilde
- **3 quÃªtes par semaine**, tirÃ©es d'un pool de **25 quÃªtes** possibles
- MÃªmes quÃªtes pour toutes les guildes (sÃ©lection dÃ©terministe par semaine)
- ProgrÃ¨s calculÃ© par **diff de stats combinÃ©es** de tous les membres
- RÃ©compenses : **350 Ã  2000 XP de guilde** selon la difficultÃ©
- **Bonus semaine parfaite** si 3/3 terminÃ©es : **+500 XP**
- Reset chaque **lundi Ã  1h** (heure franÃ§aise)

### Scaling dynamique des quÃªtes

Les objectifs des quÃªtes s'adaptent automatiquement au nombre de membres de la guilde :

| Membres | Effectif cible | Ratio |
|---------|---------------|-------|
| 1 | 1 | Ã—0.125 |
| 2 | 2 | Ã—0.25 |
| 3 | 2 | Ã—0.25 |
| 4 | 3 | Ã—0.375 |
| 5 | 4 | Ã—0.5 |
| 6 | 4 | Ã—0.5 |
| 7 | 5 | Ã—0.625 |
| 8 | 6 | Ã—0.75 |
| 9 | 7 | Ã—0.875 |
| 10 | 8 | Ã—1.0 (base) |

Les goals de base sont calibrÃ©s pour **8 joueurs actifs**. Une guilde de 10 fait donc facilement les quÃªtes (car calibrÃ©e sur 8). Un joueur seul a des objectifs rÃ©duits Ã  1/8e de la base.

**La rÃ©compense XP reste fixe** quel que soit le nombre de membres, pour ne pas pÃ©naliser les petites guildes.

**Exemples de quÃªtes de guilde (goals pour 10 membres / 8 effectifs) :**

| QuÃªte | Objectif | RÃ©compense |
|-------|----------|------------|
| ðŸ“¦ Chasseurs de packs | Ouvrir 30 packs | â­ 400 XP |
| ðŸ“¦ Pluie de cartes | Ouvrir 200 packs | â­ 2000 XP |
| ðŸŒˆ Ã‰clat arc-en-ciel | Obtenir 3 SSR | â­ 600 XP |
| ðŸŒˆ Chasseurs de SSR | Obtenir 6 SSR | â­ 1000 XP |
| âš—ï¸ Premiers essais | Faire 8 fusions | â­ 400 XP |
| âš—ï¸ Laboratoire actif | Faire 50 fusions | â­ 1400 XP |
| ðŸŽ Partage amical | Faire 4 dons | â­ 400 XP |
| ðŸŽ Philanthropes | Faire 25 dons | â­ 1200 XP |
| ðŸ’° Grand dÃ©stockage | Vendre 50 cartes | â­ 800 XP |
| ðŸŽ FidÃ©litÃ© collective | RÃ©clamer 20 daily | â­ 600 XP |
| ðŸ’Ž TrÃ©sor de guilde | Gagner 80 000 kamas | â­ 1200 XP |
| ðŸ›’ Clients du KrosmoShop | Acheter 4 cartes au shop | â­ 400 XP |

### Interface /guild

La commande **/guild** affiche une interface interactive avec :
- Vue principale : emoji, nom, niveau, XP, barre de progression, membres, rÃ´le
- Onglet **Membres** : liste avec icÃ´nes de rÃ´le
- Onglet **QuÃªtes** : 3 quÃªtes hebdo avec barres de progression et timer
- Onglet **Bonus** : bonus actifs + prochains dÃ©blocages
- Bouton **Quitter**
- CrÃ©ation via **modal** si le joueur n'est pas dans une guilde

### Interface /guildmanage

La commande **/guildmanage** permet au meneur/officier de :
- **Inviter** un joueur (Accept/Decline interactif)
- **Exclure** un membre
- **Promouvoir** / **RÃ©trograder** un officier
- **TransfÃ©rer** le leadership
- **Renommer** la guilde (2000 kamas, nouvel emoji)
- **Dissoudre** la guilde (confirmation requise)

---

## ðŸŽ SystÃ¨me de Dons

- Commande **/gift** pour donner une carte Ã  un joueur
- Limite : **3 dons par jour** (reset quotidien, heure FR)
- Confirmation par bouton avant le don
- Re-vÃ©rification de possession au moment du confirm
- Tracking complet : dons donnÃ©s, reÃ§us, par raretÃ©, par destinataire
- Dons intra-guilde trackÃ©s sÃ©parÃ©ment (stat `guildGifts`)
- **15 achievements dÃ©diÃ©s** avec 8 titres exclusifs

---

## ðŸŽª Ã‰vÃ©nements des 19 Dieux

Les events sont des pÃ©riodes spÃ©ciales (~15 min) oÃ¹ un Dieu du Krosmoz modifie les packs.

Chaque joueur reÃ§oit **2-3 tickets** par event pour ouvrir des packs spÃ©ciaux via `/eventpack`.

### Taux event (boostÃ©s)

Les event packs utilisent des taux **indÃ©pendants et boostÃ©s** par rapport aux packs normaux, avec **ZERO pity** :

| RaretÃ© | Taux normal | Taux event |
|--------|------------|------------|
| SSR | 0.05% | **2%** (Ã—40) |
| S | 0.15% | **5%** (Ã—33) |
| UR | 0.8% | **10%** (Ã—12) |
| HR | 2% | **18%** |
| SR | 5% | **25%** |
| R | 12% | **22%** |
| U | 25% | **13%** |
| C | 55% | **5%** |

Les event packs **n'affectent pas** les compteurs de pity des packs normaux.

### Les 19 Dieux

Chaque Dieu a son propre mÃ©canisme RNG et ses **voice lines** quand tu obtiens une S ou SSR :

| Dieu | Effet | MÃ©canique |
|------|-------|-----------|
| ðŸ”¥ Iop | Rage critique | Chaque carte peut Ãªtre upgradÃ©e par la rage (5% SSR, 15% S, 25% UR/HR) |
| ðŸ¹ Cra | Tir ciblÃ© | Une carte S spÃ©cifique peut apparaÃ®tre (20% par slot) |
| â³ Xelor | Distorsion temporelle | Des cartes sont retirÃ©es et d'autres ajoutÃ©es alÃ©atoirement |
| ðŸ•¶ï¸ Sram | Pack invisible | Les cartes sont cachÃ©es puis rÃ©vÃ©lÃ©es une par une + 1 carte bonus |
| ðŸ’€ Sacrieur | Sacrifice de sang | Mutation +1 rang (C/U/R 70%, SR/HR 50%, UR 30%, Sâ†’SSR 10%) |
| ðŸŽ­ Zobal | Masque d'Ã©volution | Upgrade garanti de +1 rang sur toutes les cartes |
| ðŸ§  Huppermage | Ã‰nergie Ã©lÃ©mentaire | +1 Ã  3 cartes bonus (60% S/UR, 40% random) |
| ðŸº Pandawa | Duplication Ã©thylique | Chaque carte a une chance d'Ãªtre dupliquÃ©e (30% Câ†’HR, 5% SSR) |
| ðŸ‰ Osamodas | Invocation bestiale | Pack homogÃ¨ne d'une seule raretÃ© (5% SSR, 7% S, 8% UR...) |
| ðŸŽ² Ecaflip | RNG extrÃªme | 60% jackpot (pack HR/UR/S/SSR) ou 40% double upgrade massif |
| ðŸº Ouginak | Chasse du prÃ©dateur | Risque/rÃ©compense : 30% downgrade, 25% +1, 15% +2, 5% +3 (SSR) |
| ðŸ›¡ï¸ Feca | Bouclier divin | Filtre C/U + remplissage protÃ©gÃ© (3% SSR, 8% S, 25% UR) |
| ðŸ’° Enutrof | Richesse divine | Kamas Ã—5 + jackpot cachÃ© (1%) |
| ðŸ’£ Roublard | Explosion | +3 cartes bonus alÃ©atoires |
| âš™ï¸ Steamer | Chaos mÃ©canique | Pack totalement alÃ©atoire (toutes raretÃ©s possibles) |
| ðŸŒ€ Eliotrope | Portail dimensionnel | Pack haute qualitÃ© (8% SSR, 25% S, 35% UR, 32% HR par carte) |
| âœ¨ Eniripsa | Miracle de guÃ©rison | Purification C/U/R + guÃ©rison (URâ†’S 15%, Sâ†’SSR 5%) + 1 carte bonus |
| ðŸŒ¿ Sadida | Croissance naturelle | Duplication progressive (35% par carte, max 2 duplications) |
| âš”ï¸ Forgelance | Forge divine | Upgrade global de +1 rang sur toutes les cartes |

---

## ðŸ“… QuÃªtes

### â˜€ï¸ QuÃªtes JournaliÃ¨res

- **3 quÃªtes par jour**, tirÃ©es depuis un pool de 18 quÃªtes possibles
- MÃªmes quÃªtes pour tous les joueurs (sÃ©lection dÃ©terministe par date)
- Reset chaque jour Ã  **1h** (heure franÃ§aise)
- **Bonus journalier** si 3/3 terminÃ©es : **+500 kamas**, **+100 XP**

### ðŸ“… QuÃªtes Hebdomadaires

- **5 quÃªtes par semaine**, tirÃ©es depuis un pool de 23 quÃªtes possibles
- Reset chaque **lundi Ã  1h** (heure franÃ§aise)
- **Bonus hebdomadaire** si 5/5 terminÃ©es : **+5000 kamas**, **+500 XP**, **+3 packs**

### Interface /quests

La commande **/quests** affiche une interface interactive avec :
- Deux onglets : â˜€ï¸ JournaliÃ¨res et ðŸ“… Hebdomadaires
- Barres de progression pour chaque quÃªte
- Bouton **"RÃ©cupÃ©rer tout"** pour claim en un clic
- Timer de reset affichÃ© en temps rÃ©el
- Embed dorÃ© quand toutes les quÃªtes sont rÃ©cupÃ©rÃ©es

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

## ðŸŽ® Commandes Joueur

### Packs
| Commande | Description |
|----------|-------------|
| /krosmoz | Ouvrir un pack (1 gratuit/heure, cooldown rÃ©duit par niveau) |
| /buypack | Acheter un pack (800 kamas) |
| /eventpack | Ouvrir un pack d'event |
| /pity | Voir ta pity par set |

### Collection
| Commande | Description |
|----------|-------------|
| /inventaire | Voir ton inventaire (tri par nom, raretÃ©, quantitÃ©, set + filtres) |
| /carte | Afficher une carte par nom ou ID |
| /listcards | Explorer les cartes par set |

### ðŸ’° Ã‰conomie
| Commande | Description |
|----------|-------------|
| /balance | Voir ton solde |
| /sellcard | Vendre une carte |
| /sellduplicates | Vendre tous les doublons |
| /market | MarchÃ© entre joueurs |
| /krosmoshop | Boutique quotidienne (rÃ©ductions par niveau/guilde) |

### Gameplay
| Commande | Description |
|----------|-------------|
| /daily | RÃ©compense quotidienne (streak 7 = SSR, bonus par niveau) |
| /fusion | Fusionner des doublons (bonus crit par niveau/guilde) |
| /trade | Ã‰changer avec un joueur |
| /gift | Donner une carte Ã  un joueur (3/jour) |
| /quests | Quetes journalieres et hebdomadaires |
| /battlepass | Interface Battle Pass (progression, rewards, premium, claim) |

### Guildes
| Commande | Description |
|----------|-------------|
| /guild | Voir ta guilde, crÃ©er, quÃªtes, bonus, membres |
| /guildmanage | GÃ©rer ta guilde (invite, kick, promote, rename, disband...) |

### Progression
| Commande | Description |
|----------|-------------|
| /profil | Profil complet (niveau, guilde, badges, stats) |
| /mystats | Statistiques dÃ©taillÃ©es (6 pages) |
| /leaderboard | Classements (7 catÃ©gories dont guildes) |
| /titre | Choisir ton titre |
| /achievements | Voir les 367 succÃ¨s |
| /krosmohelp | Aide du bot |

---

## ðŸŽ® Commandes Dev

### Admin
| Commande | Description |
|----------|-------------|
| /krosmodev | Donner/retirer le rang dÃ©veloppeur |
| /removedev | Ajouter ou retirer un dev |
| /krosmoreload | Reload systÃ¨mes et commandes |
| /stats | Statistiques du bot |
| /event | Lancer un Ã©vÃ©nement |

### Cartes
| Commande | Description |
|----------|-------------|
| /addcard | Ajouter une carte |
| /editcard | Modifier une carte |
| /removecard | Supprimer des cartes |
| /previewcard | PrÃ©visualiser une carte |
| /importcards | Import batch depuis cards/import |

### Packs & Sets
| Commande | Description |
|----------|-------------|
| /simpack | Simulation d'ouverture |
| /hardpity | Forcer une hard pity |
| /setcreate | CrÃ©er un set |
| /setdelete | Supprimer un set |
| /setedit | Distribution des raretÃ©s |
| /setlist | Lister les sets |
| /setreward | Modifier la rÃ©compense |
| /setstats | Stats d'un set |

### SystÃ¨mes
| Commande | Description |
|----------|-------------|
| /devgive | Donner une carte Ã  un joueur |
| /devdaily | Simuler un daily |
| /devachievement | Ajouter/supprimer un achievement |
| /checkachievement | Audit complet des achievements |
| /devfusion | Tester les fusions |
| /cooldown | Activer/dÃ©sactiver le cooldown |
| /resetcooldown | Reset les cooldowns |
| /resetpity | Reset la pity |
| /collection | Voir la collection d'un joueur |
| /devguild | Gerer les guildes (list, info, setlevel, addxp, forcejoin, disband, create, bonuses) |
| /devbp | Outils dev Battle Pass (status, add-xp, force, reset, claim-all, dry-run) |

---

## ðŸ† Achievements

367 succÃ¨s automatiques rÃ©partis en 11 catÃ©gories actives :

- **Packs** â€” ouvertures, achats, RNG spÃ©ciaux
- **RaretÃ©s** â€” SSR, Shiny, KrosmoShop
- **Fusion** â€” critique, double, triple
- **Collection** â€” cartes totales, uniques, sets, hoarder
- **Ã‰conomie** â€” kamas, daily, balance, inventaire, titres
- **Social** â€” profil, leaderboard, mentions du bot
- **Secrets** â€” Krosmo-bot, achievements cachÃ©s
- **Events** â€” 148 achievements (participation, SSR par classe, jackpots)
- **SpÃ©ciaux** â€” comportementaux (palindrome, minuit, all C, prestige...)
- **Dons** â€” 15 achievements (donnÃ©s, reÃ§us, SSR, shiny, streak, mutuels)
- **Guildes** â€” 29 achievements (niveaux, quÃªtes, vÃ©tÃ©ran, contributeur, secrets)

Les succÃ¨s dÃ©bloquent des **badges** et des **titres**.

Les succÃ¨s secrets apparaissent comme **ðŸ”’ ???** jusqu'Ã  leur dÃ©couverte.

---

## ðŸ” Gameplay Loop

1. Ouvrir des packs (/krosmoz, /eventpack)
2. Collectionner des cartes
3. ComplÃ©ter les quÃªtes journaliÃ¨res et hebdomadaires (/quests)
4. Vendre les doublons (/sellduplicates, /market)
5. Fusionner pour monter en raretÃ© (/fusion)
6. ComplÃ©ter les sets
7. Acheter au KrosmoShop quotidien
8. Participer aux events des Dieux
9. Donner des cartes Ã  ses amis (/gift)
10. CrÃ©er ou rejoindre une guilde (/guild)
11. ComplÃ©ter les quÃªtes de guilde pour faire monter la guilde en niveau
12. Profiter des bonus de guilde + bonus de niveau (kamas, fusion, lucky pack, XP, shiny, cooldown...)
13. DÃ©bloquer des achievements et des titres
14. Monter en niveau jusqu'au cap 100 et maximiser ses bonus

---

## 🔁 Schéma simplifié

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

## 📦 Stockage des données

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

Chaque joueur stocke : inventaire, shiny cards, kamas, pity, achievements, titres, progression, stats, krosmoshop, quêtes, guildId, progression Battle Pass.

Chaque guilde stocke : nom, emoji, meneur, officiers, membres, niveau, XP, quêtes hebdo, stats.

Autosave toutes les 30 secondes pour les users modifiÃ©s + sauvegarde ciblÃ©e par userId.


---

## ðŸ“· Screenshots

<p align="center">
  <img src="screenshots/pack.PNG" width="30%"/>
  <img src="screenshots/profil.PNG" width="30%"/>
  <img src="screenshots/succÃ¨s.PNG" width="30%"/>
  <img src="screenshots/carte.PNG" width="30%"/>
  <img src="screenshots/daily.PNG" width="30%"/>
  <img src="screenshots/event1.PNG" width="30%"/>
  <img src="screenshots/event2.PNG" width="30%"/>
</p>

---

## ðŸ“° Changelog

[Voir le changelog complet](CHANGELOG.md)

---

## ðŸ‘¨â€ðŸ’» Auteur

Projet crÃ©Ã© par **sauci**

---

## ðŸ“œ Licence

Projet fan non officiel inspirÃ© de l'univers Krosmoz (Dofus / Wakfu).

- N'est pas affiliÃ© Ã  Ankama
- N'est pas approuvÃ© par Ankama
- DÃ©veloppÃ© uniquement Ã  des fins communautaires

Le bot est entiÃ¨rement gratuit et ne gÃ©nÃ¨re aucun revenu.

Si Ankama demande la modification ou la suppression de certains contenus, ils seront retirÃ©s du projet.

