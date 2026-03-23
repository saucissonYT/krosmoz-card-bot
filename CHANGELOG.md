# Changelog

Toutes les modifications importantes de **Krosmoz Card Bot** sont documentées dans ce fichier.

- Added → nouvelles fonctionnalités
- Changed → modifications importantes
- Fixed → corrections de bugs
- Improved → améliorations internes

## [0.33.0] - 2026-03-23

### Added

- **Nouveau set 🌲 Kelba** — 456 cartes, le plus grand set du jeu
  - Distribution : 174 C, 132 U, 57 R, 38 SR, 24 HR, 16 UR, 10 S, 5 SSR
  - Pyramide de raretés C > U > R > SR > HR > UR > S > SSR respectée
  - Images importées et validées via le script d'import
  - Set ajouté dans `cards/sets.json`
  - Pity indépendant pour Kelba (comme les autres sets)

- **4 nouvelles cartes Sufokia** — 2 C, 1 R, 1 UR ajoutées au set existant (349 → 353 cartes)

- **Tri par catégorie dans `/achievements`** (`commands/joueur/achievement.js`)
  - `StringSelectMenu` avec 15 catégories : Tous / Packs / RNG / Collection / Économie / Fusion / Daily / Social / Inventaire / KrosmoShop / Events / Guildes / Dons / Secrets / **Battle Pass**
  - Chaque option affiche le compteur débloqué/total `(ex: Packs 12/45)`
  - Bouton "Tout afficher" pour reset le filtre
  - Pagination conservée et fonctionnelle par catégorie
  - Couleur de l'embed change selon la catégorie
  - Les succès secrets non débloqués restent masqués
  - Footer : `X/Y débloqués ici • X/Y au total • Page X/Y`

- **Achievements Battle Pass visibles dans `/achievements`** (catégorie 🎖️ Battle Pass)
  - Descriptions générées automatiquement depuis `type` + `target` (ex: *Ouvrir 50 packs via /krosmoz*)
  - Récompenses BP affichées (`+XP BP`, `+kamas`)
  - Badge 🌸 pour les succès saisonniers, 🎖️ pour les globaux
  - `getBattlePassAchievements()` mis à jour pour exposer `type`, `target`, `reward`, `seasonal`

- **5 nouveaux succès "packs en stock"** (`systems/achievements/achievementPacks.js`)
  - `packStock25` — Avoir 25 packs en stock → titre *Préparateur*
  - `packStock50` — Avoir 50 packs en stock → titre *Stockeur*
  - `packStock100` — Avoir 100 packs en stock → titre *Entrepôt du Krosmoz*
  - `packStock200` — Avoir 200 packs en stock → titre *Baron des Packs*
  - `packStock500` — Avoir 500 packs en stock → titre *Trésorier du Krosmoz*
  - Overrides tiers ajoutés dans `achievementRewards.js` (tier 3 → 7)

- **XP de guilde via ouverture de pack** (`systems/packEngine.js`)
  - Chaque carte obtenue rapporte de l'XP à la guilde du joueur
  - Taux très réduit : C/U = 1 XP, R/SR = 3 XP, HR = 4 XP, UR = 6 XP, S = 7 XP, SSR = 8 XP
  - Trackée dans `user.stats.guildXpContributed`
  - Sans impact sur les achievements ni les performances (try/catch si pas de guilde)

- **Quêtes de guilde journalières** (`systems/guildQuestSystem.js`)
  - 5 quêtes journalières en plus des 5 hebdomadaires (anciennement 3)
  - Pool journalier : 13 quêtes légères (packs, fusions, daily, ventes, shop, dons, eventpacks)
  - Pool hebdomadaire : 22 quêtes (anciennement 17), sans achat au market
  - Sélection déterministe par jour (`gqd-YYYY-MM-DD`) et par semaine (`gq-YYYY-Www`)
  - Snapshot journalier indépendant (`questsDay`, `questDaySnapshot`, `questsDayClaimed`)
  - Bonus parfait : +200 XP pour les journalières, +500 XP pour les hebdomadaires
  - `claimGuildQuests(guildId, claimerId, type)` — paramètre `type: "daily" | "weekly"`

- **Onglets journalier/hebdomadaire dans `/guild`** (`commands/joueur/guild.js`)
  - Deux boutons **☀️ Journalières** / **📅 Hebdomadaires** dans la vue Quêtes
  - Bouton actif mis en vert (ButtonStyle.Success)
  - Timer de reset adapté selon l'onglet actif

- **ID de la guilde affiché dans `/guild`**
  - Champ `🆔 ID : \`<id>\`` visible dans le menu principal de la guilde

### Changed

- **Total de cartes** : 1025 → **1485 cartes** (+460)
- **Nombre de sets** : 4 → **5 sets** (Incarnam, Astrub, Amakna, Sufokia, Kelba)
- **`/mystats` — onglet Général** : achievements comptés avec Battle Pass séparément
  - Affiche `├ Jeu principal : X/Y` et `└ Battle Pass : X/Y`
  - Barre de progression sur le total combiné
  - Packs en stock affichés dans le résumé
- **`/mystats` — onglet Packs & RNG** : eventpacks intégrés
  - Total global = packs normaux + eventpacks
  - Sous-détail `├ Via /krosmoz` et `└ Via /eventpack`
- **`/achievements`** — `StringSelectMenu` remplace les boutons de navigation par catégorie
- **`guildQuestSystem.js`** — quêtes market retirées du pool (la stat `marketBought` n'est plus utilisée comme objectif de guilde)
- **`achievementPacks.js`** — section `PACKS EN STOCK` ajoutée en fin de fichier

### Fixed

- **`guildQuestSystem.js`** — les quêtes journalières ont maintenant leur propre snapshot indépendant du weekly, évitant les conflits de progression
- **`getBattlePassAchievements()`** — exposait uniquement `id` et `name`, privant l'affichage de toute description ; maintenant expose `type`, `target`, `reward`, `seasonal`

### Improved

- **`achievementRewards.js`** — overrides `packStock25/50/100/200/500` ajoutés
- **`systems/packEngine.js`** — XP guilde calculée par boucle sur les cartes du pack (pas d'appel réseau, try/catch complet)
- **`systems/guildQuestSystem.js`** — export `getWeeklyQuests` conservé pour rétrocompatibilité avec les éventuels appels externes

---

## [0.32.0] - 2026-03-22

### Added

- **Système Battle Pass saisonnier complet** (`systems/battlePassService.js`, `systems/seasonService.js`, `commands/joueur/battlepass.js`, `commands/dev/devbp.js`, `cron/seasonReset.js`)
  - Cycle de saisons (Emeraude -> Pourpre -> Turquoise -> Ocre -> Ivoire -> Ebene)
  - Durée de saison configurée à **21 jours**
  - Progression Battle Pass persistante par joueur (niveau, XP, premium, récompenses claim)
  - Auto-récompenses, reset de fin de saison et archivage des saisons précédentes
  - Fichier de configuration XP dédié : `config/battlepassXP.json`
  - Outils dev `/devbp` (status, add-xp, force saison, reset progress, dry-run, etc.)

- **Nouveau flux d'achat Premium sécurisé**
  - Ajout d'une étape de **confirmation** avant achat Premium
  - Boutons de confirmation/annulation dédiés
  - Affichage explicite du prix Premium dans l'UX Battle Pass

- **Affichage des récompenses enrichi**
  - Pagination des récompenses
  - Affichage des récompenses **free + premium** dans la vue récompenses
  - Résumé détaillé après claim (récompenses récupérées + totaux)

### Changed

- **Équilibrage des récompenses Battle Pass** (`systems/seasonService.js`)
  - Augmentation globale des récompenses (kamas, XP, packs)
  - Ajout de récompenses Premium à **chaque palier**
  - Versioning des récompenses (`rewardsVersion`) pour migrer proprement les saisons existantes

- **UX de `fusion` améliorée** (`commands/joueur/fusion.js`)
  - Affichage du nombre de doublons par rareté directement dans l'interface
  - Visibilité immédiate des ressources disponibles par set

- **UX de `krosmoz` améliorée** (`commands/joueur/krosmoz.js`)
  - Les sets sans cartes jouables ne sont plus proposés dans le menu
  - Affichage du nombre de cartes par set dans la description des options

- **UX de `krosmoshop` améliorée** (`commands/joueur/krosmoshop.js`)
  - Indicateur de possession sur chaque carte (`:white_check_mark: xN` / `:x: x0`)
  - Statut de possession visible dans la liste et dans le menu d'achat

### Fixed

- **Fix critique `fusion`** : correction d'un bloc de message corrompu pouvant provoquer des erreurs d'exécution
- **Fix `krosmoz`** : protection contre la sélection de sets vides (sets sans cartes chargées)
- **Fix UX `battlepass`** : suppression de l'achat Premium instantané sans validation utilisateur
- **Fix feedback claim** : retour utilisateur explicite après récupération des récompenses

### Improved

- Meilleure lisibilité générale des commandes Battle Pass, Fusion, Krosmoz et KrosmoShop
- Expérience utilisateur plus sûre (confirmation avant dépense) et plus transparente (états de possession, suivi des récompenses)
- Base technique prête pour les prochaines saisons sans migration manuelle

---

## [0.31.0] - 2026-03-21

### Added

- **Event Pack Engine v2** (`systems/eventPackEngine.js`)
  - Nouveau `generateEventBasePack()` avec taux boostés spécifiques aux events
  - Taux event : SSR 2%, S 5%, UR 10%, HR 18%, SR 25%, R 22%, U 13%, C 5%
  - **ZERO pity** — les event packs n'utilisent plus le système de pity (pas de compteur, pas de hard pity)
  - Les event packs ne touchent plus les compteurs de pity des packs normaux
  - Shiny SSR toujours possible (0.5%) dans les event packs
  - Nouveau `rollEventRarity()` indépendant du `rollRarity()` des packs normaux
  - Export de `EVENT_RATES` pour référence et debug
  - **Système de récompenses pour les achievements** (`systems/achievementRewards.js`)
  - 8 tiers de difficulté avec récompenses progressives (kamas, XP, packs)
  - Tier 1 (Facile) : 100 kamas, 15 XP → Tier 8 (Mythique) : 10 000 kamas, 2 000 XP, 5 packs
  - Auto-détection du tier par pattern numérique dans l'ID de l'achievement
  - ~100 overrides manuels pour les achievements spéciaux (RNG, secrets, comportementaux, events)
  - Bonus +50% kamas pour les achievements secrets
  - Fonctions `formatReward()` et `formatRewardCompact()` pour l'affichage

- **Nouvelles stats user** trackées :
  - `achievementKamasEarned` — total kamas gagnés via succès
  - `achievementXpEarned` — total XP gagnée via succès
  - `achievementPacksEarned` — total packs gagnés via succès

### Changed

- **Refonte complète de 6 event handlers** — tous les events peuvent désormais produire des S et SSR

- **eventIop.js** — Rework "La Rage"
  - Avant : pool HR/UR/S uniquement → SSR **impossible**
  - Après : basePack boosté conservé + rage critique sur chaque carte
  - 5% → Rage Totale (SSR), 15% → Colère (S), 25% → Fureur (UR/HR)
  - Les cartes déjà S/SSR résistent à la rage (cohérence RP : la rage ne touche pas les forts)
  - Logs de rage détaillés dans les métadonnées (Rage Totale / Colère / Fureur)

- **eventSacrieur.js** — Rework "Le Sacrifice de Sang"
  - Avant : order de mutation s'arrêtait à UR → S/SSR **impossibles**
  - Après : order étendu C → U → R → SR → HR → UR → S → SSR
  - Chance de mutation décroissante par rareté : C/U/R 70%, SR/HR 50%, UR 30%, S→SSR 10%
  - RP cohérent : plus la carte est faible, plus le sacrifice est efficace
  - Messages contextuels : "Sacrifice Ultime" (→SSR), "Sang Versé" (→S)

- **eventEliotrope.js** — Rework "Le Portail Dimensionnel"
  - Avant : pack fixe de 3 cartes (HR+UR+S) → SSR **impossible**
  - Après : pack de 5 cartes avec brèche dimensionnelle par carte
  - 8% → SSR (brèche légendaire), 25% → S (distorsion), 35% → UR, 32% → HR
  - Logs de brèches dimensionnelles trackés

- **eventFeca.js** — Rework "Le Bouclier Divin"
  - Avant : filtre C/U, remplit avec R → S/SSR quasi **impossibles**
  - Après : filtre C/U, remplissage avec taux protégés spécifiques
  - 3% → SSR (Bouclier Divin), 8% → S (Protection Majeure), 25% → UR, 35% → HR, 29% → SR
  - Logs de protection pour les S/SSR obtenues

- **eventEniripsa.js** — Rework "Le Miracle de Guérison"
  - Avant : filtre C/U/R, remplit avec SR → S/SSR quasi **impossibles**
  - Après : purification C/U/R + guérison qui upgrade chaque carte survivante
  - SR→HR 40%, HR→UR 30%, UR→S 15%, S→SSR 5% (Miracle)
  - +1 carte bonus "mot de guérison" (SR/HR/UR)
  - Messages contextuels : "Miracle !" (→SSR), "Guérison Majeure" (→S)

- **eventOuginak.js** — Rework "La Chasse du Prédateur"
  - Avant : 70% downgrade systématique → S/SSR quasi **impossibles**
  - Après : mécanique risque/récompense équilibrée
  - 30% → Proie faible (downgrade -1), 25% → Esquive (neutre)
  - 25% → Chasse réussie (+1), 15% → Festin (+2, peut atteindre S)
  - 5% → Proie Légendaire (+3, peut atteindre SSR)
  - RP cohérent : le prédateur rate souvent mais peut attraper une proie légendaire

- **eventPackEngine.js** — ne fait plus appel à `generatePack()` de `pack.js`
  - Suppression de la dépendance à `generatePack()` pour les event packs
  - Les compteurs de pity ne sont plus affectés par les event packs
  - `limitSSR()` toujours appliqué (1 SSR max, 2 S max) sauf si `allowMultiSSR`

  - **`systems/achievementEngine.js`** — applique désormais les récompenses (kamas, XP, packs) automatiquement au déblocage d'un achievement
  - L'XP passe par `addXP()` pour déclencher les level-ups en chaîne
  - Les kamas et packs sont ajoutés directement sur le user
  - Stocke les rewards dans `user._lastAchievementRewards` pour le notifier (nettoyé après affichage)
  - Rétro-compatible : retourne toujours un tableau d'IDs débloqués

- **`systems/achievementNotifier.js`** — refonte de l'affichage
  - Utilise des **embeds** au lieu de messages texte bruts
  - Affiche les récompenses obtenues (kamas, XP, packs) dans chaque notification
  - Affiche un footer "Succès secret !" pour les achievements secrets
  - Paramètre `user` optionnel ajouté (rétro-compatible avec les anciens appels)

- **`commands/joueur/achievement.js`** — affichage enrichi de la commande `/achievements`
  - Affiche les récompenses à côté de chaque succès (format compact : `💰400 ⭐60`)
  - Succès débloqués marqués ✅, non débloqués montrent les récompenses à obtenir
  - Nouveau champ "🎁 Récompenses restantes" avec le total de kamas, XP et packs à débloquer
  - Footer avec le total de kamas déjà gagnés via succès

### Fixed

- **Bug critique** : les event packs incrémentaient les compteurs de pity des packs normaux, faussant le système de pity pour les joueurs participant aux events
- **Bug** : 6 events sur 19 ne pouvaient mécaniquement pas produire de S ou SSR malgré des voicelines et achievements dédiés
- **Bug** : eventIop construisait un pack custom sans SSR dans le pool mais avait `allowMultiSSR: true` et des voicelines SSR
- **Bug** : eventSacrieur limitait les mutations à UR maximum, rendant les achievements "SSR bénie du Sacrieur" impossibles
- **Bug** : eventEliotrope générait seulement 3 cartes au lieu de 5, avec un pack fixe sans chance de SSR
- **Bug** : eventFeca et eventEniripsa remplissaient les slots vides avec des cartes R ou SR uniquement
- **Bug** : eventOuginak downgrade 70% systématique rendait les voicelines S/SSR inaccessibles

### Improved

- Tous les 19 events peuvent désormais déclencher les voicelines S et SSR
- Tous les 148 achievements d'events sont désormais atteignables (SSR par classe, jackpots, etc.)
- Cohérence RP renforcée : chaque handler a une mécanique fidèle à la personnalité du Dieu
- Meilleur équilibrage global : les events sont plus généreux que les packs normaux (taux boostés) mais sans filet de sécurité (zero pity)

---

## [0.30.0] - 2026-03-21

### Added

- **Scaling dynamique des quêtes de guilde** (`systems/guildQuestSystem.js`)
  - Les objectifs des quêtes s'adaptent automatiquement au nombre de membres
  - Goals de base calibrés pour **8 joueurs actifs** (constante `BASE_CALIBRATION`)
  - Formule d'effectif cible : `min(8, max(1, floor(membres × 0.8)))` pour >2 membres, sinon = membres
  - Une guilde de 10 est calibrée sur 8 (quêtes confortables)
  - Une guilde de 5 est calibrée sur 4 (quêtes équilibrées)
  - Un joueur seul a des objectifs réduits à 1/8e de la base
  - La récompense XP reste fixe quel que soit le nombre de membres
  - Nouvelles fonctions exportées : `getEffectiveMembers()`, `getScaledGoal()`

- **8 nouvelles quêtes de guilde** — pool élargi de 17 → **25 quêtes**
  - 📦 Chasseurs de packs (30 packs, 400 XP)
  - ⚗️ Premiers essais (8 fusions, 400 XP)
  - 🌈 Éclat arc-en-ciel (3 SSR, 600 XP)
  - 🎁 Habitude matinale (8 daily, 350 XP)
  - 💰 Soldes totales (100 ventes, 1300 XP)
  - 🏪 Premiers achats (4 market, 500 XP)
  - 🎪 Aventuriers divins (4 eventpacks, 500 XP)
  - 🎁 Partage amical (4 dons, 400 XP)

- **Distributions des raretés par set dans le README**
  - Ajout de la distribution ☁️ Incarnam (120 cartes : 40 C, 32 U, 22 R, 11 SR, 7 HR, 4 UR, 2 S, 2 SSR)
  - Ajout de la distribution 🌾 Astrub (258 cartes : 85 C, 69 U, 49 R, 23 SR, 15 HR, 8 UR, 5 S, 4 SSR)
  - Ajout de la distribution 🌽 Amakna (298 cartes : 98 C, 79 U, 56 R, 27 SR, 18 HR, 10 UR, 5 S, 5 SSR)

- **Table de leveling guilde dans le README** — XP requis et XP total cumulé pour les niveaux 5, 10, 25, 50, 75, 100

### Changed

- **Limite de membres par guilde** : 20 → **10 membres** (`systems/guildSystem.js`)
  - `MAX_MEMBERS` passe de 20 à 10
  - Guildes plus petites et plus compétitives
  - Officiers toujours limités à 3

- **Rééquilibrage des quêtes de guilde** (`systems/guildQuestSystem.js`)
  - Les goals utilisent désormais `baseGoal` (calibré pour 8) au lieu de `goal` fixe
  - Les descriptions utilisent `{goal}` comme placeholder, remplacé dynamiquement par le goal scalé
  - Quêtes existantes rééquilibrées :
    - `gq_packs50` (50 packs) → `gq_packs60` (60 packs base, scalé)
    - `gq_packs100` (100 packs) → `gq_packs120` (120 packs base, scalé)
    - `gq_ssr5` (5 SSR) → `gq_ssr6` (6 SSR base, scalé)
    - `gq_ssr10` (10 SSR) → `gq_ssr12` (12 SSR base, scalé)
    - `gq_daily50` (50 daily) → `gq_daily40` (40 daily base, scalé)
    - `gq_sell30` (30 ventes) → `gq_sell16` (16 ventes base, scalé)
    - `gq_sell100` (100 ventes) → `gq_sell50` (50 ventes base, scalé)
    - `gq_market10` (10 market) → `gq_market4` / `gq_market10` (4 et 10 base, scalé)
    - `gq_gift10` (10 dons) → `gq_gift12` (12 dons base, scalé)
    - `gq_kamas50k` (50k kamas) → `gq_kamas25k` / `gq_kamas80k` (25k et 80k base, scalé)
    - `gq_shop5` (5 shop) → `gq_shop4` (4 shop base, scalé)
  - `getCombinedStats()` enrichi : ajout du tracking `shopBought` depuis `krosmoshopStats`

- **Achievement "Guilde Complète"** : description mise à jour de 20/20 → **10/10 membres** (`systems/achievements/achievementGuild.js`)

- **README.md** mis à jour :
  - Section Guildes : 10 membres max au lieu de 20
  - Nouvelle section "Scaling dynamique des quêtes" avec tableau effectif/ratio
  - Pool de quêtes passé de 17 à 25
  - Table de leveling guilde (niveaux 5→100 avec XP requis/cumulé)
  - Ajout des 3 distributions manquantes (Incarnam, Astrub, Amakna)
  - Exemples de quêtes mis à jour avec les nouveaux noms et objectifs

### Improved

- **Équilibrage global des quêtes de guilde** — les petites guildes (1-3 joueurs) peuvent désormais compléter les quêtes avec des objectifs proportionnels, tandis que les guildes complètes (10 joueurs) les font confortablement car calibrées sur 8

---

## [0.29.0] - 2026-03-21

### Added

- **Système de bonus par niveau joueur** (`systems/playerBonuses.js`)
  - 9 bonus progressifs débloqués au fur et à mesure que le joueur monte en niveau (cap 100)
  - 💰 Kamas bonus (+1% / 4 niv. → +25% max)
  - 🔥 Fusion critique (+0.5% / 8 niv. → +6% max)
  - 🍀 Lucky pack (+1% / 10 niv. → +10% max)
  - ⭐ XP bonus (+5% / 20 niv. → +25% max)
  - 🏪 Réduction KrosmoShop (+1% / 15 niv. → +6% max)
  - 🎁 Kamas daily bonus (+50 / 10 niv. → +500 max)
  - 🎲 Double daily (+2% / 25 niv. → +8% max)
  - ✨ Chance shiny (+1% / 50 niv. → +2% max)
  - ⏱️ Réduction cooldown pack (-5 min / 20 niv. → -25 min max, plancher 35 min)
  - Les bonus joueur se **cumulent** avec les bonus de guilde

- **20 achievements de niveaux** (`systems/achievements/achievementLevel.js`)
  - 15 paliers de niveau : 5, 10, 15, 20, 25, 30, 40, 50, 60, 70, 75, 80, 90, 95, 100
  - 4 paliers XP total : 10k, 50k, 100k, 200k
  - 1 secret : niveau palindrome (11, 22, 33...)
  - 12 titres associés : Débutant → Divinité du Krosmoz
  - **Total achievements : ~370** (350 + 20)

### Changed

- **Rééquilibrage économie complète** (`systems/constants.js`)
  - **Prix de vente au bot (SELL_PRICE)** : C:2→3, U:5→8, R:10→20, SR:20→50, HR:40→120, UR:75→320, S:150→800, SSR:500→2000
  - **Prix market (RARITY_PRICE)** : C:5→8, U:10→20, R:20→50, SR:40→120, HR:80→300, UR:150→800, S:300→2000, SSR:1000→5000
  - **Coûts de fusion (FUSION_COST)** : C:5→10, U:6→20, R:8→40, SR:10→80, HR:12→150, UR:15→300, S:20→500
  - **Prix d'un pack** : 1250 → **800 kamas** (centralisé dans `PACK_PRICE`)
  - **Nouveau** : constante `MAX_PLAYER_LEVEL = 100` exportée
  - Principe : courbe exponentielle cohérente, sell = ~40% market, shop = ~2.5x market

- **Prix KrosmoShop rééquilibrés** (`systems/krosmoshop.js`)
  - SR:200→300, HR:450→750, UR:900→2000, S:1800→5000, SSR:3000→**12000**
  - Le KrosmoShop applique maintenant les **réductions de guilde ET de niveau joueur** au checkout
  - Track `shopBought` dans `user.stats` pour les quêtes de guilde

- **Refonte du système de niveaux** (`systems/progressionSystem.js`)
  - **Level cap : 100** (avant : pas de cap)
  - Nouvelle formule XP : `80 + level × 30` (avant : `120 × level^1.35` — montait trop vite)
  - XP total pour level 100 : ~160 000
  - Milestones enrichis : niv. 10 (+500k), niv. 25 (+1500k +2 packs), niv. 50 (+5000k +5 packs), niv. 75 (+10000k +5 packs), niv. 100 (+25000k +10 packs)
  - `getProgression()` retourne maintenant `isMaxLevel: true` quand le joueur est au cap
  - Bonus XP de `playerBonuses` appliqué dans `addXP()`

- **Intégration des bonus guilde + joueur dans `packEngine.js`**
  - 💰 Kamas bonus (guilde + joueur) appliqué après le calcul du pack
  - 🍀 Lucky pack bonus : chance supplémentaire de lucky pack en plus du 10% de base
  - ✨ Shiny bonus : s'ajoute au 0.5% de base (joueur uniquement)
  - `openPack()` accepte maintenant un 3ème paramètre `userId` pour charger les bonus

- **Intégration des bonus dans `fusion.js`**
  - 🔥 Fusion critique : bonus guilde + joueur ajouté au 10% de base
  - ✨ Fusion double : bonus guilde ajouté au 10% de base
  - 🌈 Fusion triple : bonus guilde ajouté au 0.5% de base
  - L'embed final affiche les **chances réelles avec bonus** au lieu des pourcentages fixes
  - `loadSets()` dynamique + `getCards()` dans execute() + `save(userId)` ciblé

- **Intégration des bonus dans `dailySystem.js`**
  - 🎁 Kamas daily bonus (joueur) ajouté aux 200 kamas de base
  - 🎲 Double daily bonus (guilde + joueur) ajouté au 10% de base
  - 📦 Packs daily bonus (guilde) : packs gratuits ajoutés à chaque claim
  - `claimDaily()` accepte maintenant un 3ème paramètre `userId`
  - Le retour inclut `doubleDailyChance`, `bonusPacksGiven`, `bonusKamas`

- **Intégration du cooldown réduit dans `krosmoz.js`**
  - ⏱️ Cooldown de base 60 min réduit par le bonus joueur (minimum 35 min au niv. 100)
  - `getCooldownMs(user)` calcule le cooldown dynamique
  - `getCooldownText()` affiche le cooldown réel du joueur
  - `loadSets()` dynamique au lieu de `require()` statique
  - `openPack(user, setId, userId)` passe le userId pour les bonus

- **`commands/joueur/buypack.js`** — utilise `PACK_PRICE` depuis constants + `save(userId)` ciblé

- **`systems/economy.js`** — track `totalKamasEarned` en plus de `kamasEarned`

- **`systems/achievementRegistry.js`** — ajout du module `achievementLevel` (12 modules au total)

### Fixed

- **Bug critique `profil.js`** — `RangeError: Invalid count value: -45` dans `buildXPBar()` : quand `required = 0` (niveau max) ou quand `xp > required` (ancienne courbe XP → nouvelle), `percent` devenait `Infinity` ou `> 1`, `filled > size`, `empty` négatif → crash `String.repeat(-45)`
  - Fix : `Math.min(1, Math.max(0, current / max))` clamp le pourcentage + `if(max <= 0) return barre pleine + "MAX"`
  - Même fix appliqué à `buildCollectionBar()`
- **`profil.js`** — affichage XP : "MAX" au lieu de "0 / 0" quand le joueur est au niveau 100
- **`profil.js`** — ajout du champ **🏰 Guilde** dans l'embed profil (emoji + nom + niveau ou "Aucune")
---



## [0.28.0] - 2026-03-21

### Added

- **Système de Guildes complet** (`systems/guildSystem.js`, `systems/guildBonuses.js`, `systems/guildQuestSystem.js`)
  - Création de guilde (5000 kamas), emoji aléatoire assigné automatiquement parmi 50 emojis
  - Nom choisi par le joueur (3-24 caractères, unique)
  - Hiérarchie : Meneur (👑), Officiers (⚔️, max 3), Membres (👤)
  - Maximum 20 membres par guilde
  - Système de niveau 1 → 100 avec XP progressif (`100 + level × 50` XP par niveau)
  - **9 bonus de guilde** débloqués progressivement par niveau :
    - 💰 Kamas bonus (+1% / 5 niv. → +20% max)
    - 🔥 Fusion critique (+0.5% / 10 niv. → +5% max)
    - ✨ Fusion double (+0.5% / 15 niv. → +3% max)
    - 🌈 Fusion triple (+0.25% / 25 niv. → +1% max)
    - 🍀 Lucky pack (+1% / 10 niv. → +10% max)
    - ⭐ XP bonus (+5% / 20 niv. → +25% max)
    - 🏪 Réduction KrosmoShop (+2% / 25 niv. → +8% max)
    - 📦 Packs daily bonus (+1 / 50 niv. → +2 max)
    - 🎁 Double daily (+1% / 20 niv. → +5% max)
  - Stockage persistant dans `data/guilds.json`

- **Quêtes de guilde hebdomadaires** (`systems/guildQuestSystem.js`)
  - 3 quêtes par semaine tirées d'un pool de 17 quêtes (sélection déterministe)
  - Progrès calculé par diff de stats combinées de tous les membres
  - Récompenses en XP de guilde (400 → 2000 XP selon difficulté)
  - Bonus +500 XP pour semaine parfaite (3/3 quêtes)
  - Claim réservé au meneur et aux officiers
  - Reset chaque lundi à 1h (heure française)
  - Types de quêtes : packs ouverts, fusions, SSR obtenues, daily claims, ventes, achats market, dons, KrosmoShop, events

- **Commande `/guild`** — interface principale de guilde avec navigation par boutons
  - Vue principale : niveau, XP, barre de progression, membres, rôle, bonus actifs
  - Onglet Membres : liste avec icônes de rôle (👑 ⚔️)
  - Onglet Quêtes : 3 quêtes hebdo avec barres de progression, timer reset, bouton claim
  - Onglet Bonus : bonus actifs + prochains déblocages
  - Bouton Quitter
  - Création via modal si pas de guilde (nom libre)
  - Affichage des top 10 guildes si pas de guilde

- **Commande `/guildmanage`** — gestion complète pour meneur/officier
  - 7 actions : invite, kick, promote, demote, transfer, rename, disband
  - Système d'invitation avec Accept/Decline (le joueur invité clique)
  - Confirmation pour les actions irréversibles (transfer, disband)
  - Renommage : 2000 kamas, nouvel emoji aléatoire
  - Transfert de leadership avec rétrogradation automatique de l'ancien meneur en officier
  - Dissolution avec retrait automatique du guildId de tous les membres

- **Commande `/devguild`** — outils dev pour les guildes
  - 8 actions : list, info, setlevel, addxp, forcejoin, disband, create, bonuses
  - Override du coût en kamas pour la création
  - Mise à jour automatique des stats guildMaxLevel pour tous les membres

- **Système de dons `/gift`** (`commands/joueur/gift.js`)
  - Don de carte à un autre joueur avec confirmation par bouton
  - Limite : 3 dons par jour (reset quotidien, heure FR)
  - Tracking complet : dons donnés, reçus, par rareté (SSR, UR, Shiny), par destinataire
  - Streak de dons (jours consécutifs)
  - Détection du "both ways" (donner et recevoir le même jour)
  - Dons intra-guilde trackés séparément (stat `guildGifts`)
  - Re-vérification de possession de la carte au moment du confirm (anti-exploit)

- **15 achievements de dons** (`systems/achievements/achievementGift.js`)
  - Dons donnés : 1, 5, 10, 25, 50, 100 cartes
  - Dons spéciaux : SSR donnée, Shiny donnée (secret), UR donnée
  - Dons reçus : 1, 10, 50
  - Secrets : Donnant-Donnant (both ways même jour), 7 jours de suite, 10 destinataires différents
  - 8 titres associés : Donateur, Bienfaiteur, Cœur d'Or, Philanthrope, Mécène, Saint du Krosmoz, Généreux Absolu, Porteur d'Étoile

- **29 achievements de guilde** (`systems/achievements/achievementGuild.js`)
  - Adhésion : rejoindre, créer, devenir officier
  - Niveaux de guilde : 5, 10, 25, 50, 75, 100
  - Quêtes de guilde : 1, 10, 25, 50, 100 quêtes + semaines parfaites (1, 10)
  - Social guilde : guilde complète 20/20, vétéran 30/90/180 jours, donateur guilde 25/100
  - XP contribuée : 1k, 10k, 50k
  - Secrets : première pierre, tous les bonus (niv 100), renommer, transférer leadership
  - 18 titres associés

- **Total d'achievements : ~350** (306 + 15 gift + 29 guild)

### Changed

- **`systems/achievementRegistry.js`** — ajout des modules `achievementGift` et `achievementGuild` à l'agrégateur
- **`systems/leaderboardCache.js`** — nouveau board `guilds` chargé dynamiquement via `guildSystem.getAllGuilds()`, trié par niveau décroissant
- **`commands/joueur/leaderboard.js`** — 7ème mode **🏰 Guildes** ajouté
  - Affichage spécial : emoji + nom + niveau + nombre de membres
  - Champ "Ta guilde" au lieu de "Ta position" en mode guildes
  - Boutons réorganisés : row 1 (collection, wealth, ssr, packs), row 2 (achievements, level, guildes)
- **`index.js`** — chargement de `loadGuilds()` au démarrage du bot après `dataManager.loadAll()`
  - Commentaires de routing pour les boutons/modals de guilde (gérés par collectors internes)
- **`/inventaire`** — tri par SET ajouté (bouton "Set" dans la rangée de tri)
  - Filtre par SET (rangée de boutons dynamique avec les 4 sets)
  - Toggle Doublons (n'affiche que les cartes x2+)
  - Indicateurs visuels (boutons actifs en vert)
  - Set affiché dans chaque ligne : `[Amakna]`
  - Toggle rareté (re-cliquer désactive)
  - Footer enrichi : résultats + page + uniques/total + shiny + doublons
  - Compteur de page central

### Improved

- **Architecture modulaire renforcée** — 3 nouveaux systèmes indépendants (guildSystem, guildBonuses, guildQuestSystem) suivant le même pattern que les systèmes existants
- **Nouveau trigger d'achievement `gift`** et `guild` — ajout de 2 nouveaux triggers dans le pipeline achievementCheck
- **Nouvelles stats user trackées** : giftsGiven, giftsReceived, giftsSSRGiven, giftsURGiven, giftsShinyGiven, giftRecipients, giftStreak, giftBothWays, guildCreated, guildPromoted, guildMaxLevel, guildQuestsClaimed, guildPerfectWeeks, guildXpContributed, guildGifts, guildFirstClaim, guildDays, guildWasFull, guildRenamed, guildTransferred
- **Stockage données** — nouveau fichier `data/guilds.json` pour la persistance des guildes

---

## [0.27.0] - 2026-03-21

### Fixed

- **Bug critique : 14 commandes dev/joueur sans options Discord** — le loader `index.js` créait un `SlashCommandBuilder` vide pour les commandes utilisant le pattern `name`/`options` au lieu de `data: SlashCommandBuilder`. Toutes les options (joueur, set, rareté, IDs, mode...) étaient ignorées → crash systématique à l'utilisation. Commandes corrigées :
  - `addcard`, `editcard`, `previewcard`
  - `removecard`, `cooldown`, `resetcooldown`, `resetpity`
  - `simpack`, `setreward`, `setstats`
  - `setcreate`, `setdelete`
  - `devgive`, `inventaire`
- **`devachievement`** — vérification `isDev()` manquante : n'importe quel joueur pouvait ajouter/supprimer des achievements
- **`devachievement`** — `save()` sans userId : les modifications n'étaient pas persistées par le dirty save system
- **`devgive`** — `data.cards` snapshot statique remplacé par `getCards()` dynamique + `save(target.id)` ciblé
- **`resetcooldown` / `resetpity`** — `getUsers()` remplacé par `getUser()` + `save(target.id)` ciblé
- **`editcard`** — `resetRegistry()` manquant après modification d'une carte
- **`eventHandlers/eventRoublard.js`** — `getCards()` appelé au top-level (snapshot statique) : les cartes Sufokia n'apparaissaient jamais dans les packs Roublard

### Changed

- **Refonte de `/pity`** — pagination par boutons (3 sets par page au lieu de tout afficher d'un coup)
  - Boutons ◀ / ▶ pour naviguer entre les pages
  - Indicateur de page central
  - Footer avec le nombre total de sets
  - Barres de progression et taux soft pity conservés

- **Refonte de `/simpack`** — résultats en embeds au lieu de blocs de code bruts
  - Emojis de rareté dans les résultats
  - `deferReply()` pour les grosses simulations
  - `loadSets()` dynamique au lieu de `require()` statique
  - Limite 100 000 packs

- **Mise à jour de `/devhelp`** — contenu synchronisé avec les commandes actuelles
  - Suppression de `/devpack`, `/setbalance`, `/krosmodev` (commandes supprimées)
  - Ajout de `/devdaily`, `/devachievement`, `/checkachievement`, `/krosmoreload`, `/removedev`

- **`devachievement`** — gestion complète des titres lors de l'ajout/suppression d'achievements (ajout automatique du titre associé, retrait si plus aucun achievement ne le donne)

- **`removecard`** — résultat affiché en embed avec détail des cartes supprimées/introuvables
- **`setcreate` / `setdelete` / `setreward` / `setstats`** — résultats en embeds
- **`previewcard`** — choices de rareté ajoutées (au lieu de texte libre)

### Improved

- **Migration complète vers `SlashCommandBuilder`** — plus aucune commande n'utilise le pattern legacy `name`/`options`. Le loader `index.js` n'a plus besoin d'inférer les options
- **Toutes les commandes dev utilisant des sets** (`addcard`, `editcard`, `devgive`, `setdelete`, `setstats`, `setreward`, `simpack`) chargent désormais les choices de set dynamiquement via `loadSets()` au lieu de `require("../../cards/sets.json")` statique
- **`save()` ciblé par userId** dans `devgive`, `devachievement`, `resetcooldown`, `resetpity` pour le dirty save system

---
[0.27.0] - 2026-03-21

### Fixed

- **Bug critique : 14 commandes dev/joueur sans options Discord** — le loader `index.js` créait un `SlashCommandBuilder` vide pour les commandes utilisant le pattern `name`/`options` au lieu de `data: SlashCommandBuilder`. Toutes les options (joueur, set, rareté, IDs, mode...) étaient ignorées → crash systématique à l'utilisation. Commandes corrigées :
  - `addcard`, `editcard`, `previewcard`
  - `removecard`, `cooldown`, `resetcooldown`, `resetpity`
  - `simpack`, `setreward`, `setstats`
  - `setcreate`, `setdelete`
  - `devgive`, `inventaire`
- **`devachievement`** — vérification `isDev()` manquante : n'importe quel joueur pouvait ajouter/supprimer des achievements
- **`devachievement`** — `save()` sans userId : les modifications n'étaient pas persistées par le dirty save system
- **`devgive`** — `data.cards` snapshot statique remplacé par `getCards()` dynamique + `save(target.id)` ciblé
- **`resetcooldown` / `resetpity`** — `getUsers()` remplacé par `getUser()` + `save(target.id)` ciblé
- **`editcard`** — `resetRegistry()` manquant après modification d'une carte
- **`eventHandlers/eventRoublard.js`** — `getCards()` appelé au top-level (snapshot statique) : les cartes Sufokia n'apparaissaient jamais dans les packs Roublard

### Changed

- **Refonte de `/pity`** — pagination par boutons (3 sets par page au lieu de tout afficher d'un coup)
  - Boutons ◀ / ▶ pour naviguer entre les pages
  - Indicateur de page central
  - Footer avec le nombre total de sets
  - Barres de progression et taux soft pity conservés

- **Refonte de `/simpack`** — résultats en embeds au lieu de blocs de code bruts
  - Emojis de rareté dans les résultats
  - `deferReply()` pour les grosses simulations
  - `loadSets()` dynamique au lieu de `require()` statique
  - Limite 100 000 packs

- **Mise à jour de `/devhelp`** — contenu synchronisé avec les commandes actuelles
  - Suppression de `/devpack`, `/setbalance`, `/krosmodev` (commandes supprimées)
  - Ajout de `/devdaily`, `/devachievement`, `/checkachievement`, `/krosmoreload`, `/removedev`

- **`devachievement`** — gestion complète des titres lors de l'ajout/suppression d'achievements (ajout automatique du titre associé, retrait si plus aucun achievement ne le donne)

- **`removecard`** — résultat affiché en embed avec détail des cartes supprimées/introuvables
- **`setcreate` / `setdelete` / `setreward` / `setstats`** — résultats en embeds
- **`previewcard`** — choices de rareté ajoutées (au lieu de texte libre)

### Improved

- **Migration complète vers `SlashCommandBuilder`** — plus aucune commande n'utilise le pattern legacy `name`/`options`. Le loader `index.js` n'a plus besoin d'inférer les options
- **Toutes les commandes dev utilisant des sets** (`addcard`, `editcard`, `devgive`, `setdelete`, `setstats`, `setreward`, `simpack`) chargent désormais les choices de set dynamiquement via `loadSets()` au lieu de `require("../../cards/sets.json")` statique
- **`save()` ciblé par userId** dans `devgive`, `devachievement`, `resetcooldown`, `resetpity` pour le dirty save system

---
[0.26.0] - 2026-03-21

### Added

- **Nouveau set 🌊 Sufokia** — 349 cartes, le plus gros set du jeu
  - Distribution : 115 C, 94 U, 66 R, 31 SR, 21 HR, 11 UR, 6 S, 5 SSR
  - Pyramide de raretés C > U > R > SR > HR > UR > S > SSR respectée
  - Images importées et validées via le script d'import
  - Set ajouté dans `cards/sets.json`
  - Pity indépendant pour Sufokia (comme les autres sets)

- **2 nouvelles cartes Amakna** — 1 UR + 1 SSR ajoutées au set existant (296 → 298 cartes)

### Changed

- **Total de cartes** : 674 → **1025 cartes** (+351)
- **Nombre de sets** : 3 → **4 sets** (Incarnam, Astrub, Amakna, Sufokia)
- **README.md** mis à jour :
  - Introduction : 1025 cartes, 4 sets
  - Tableau des sets : ajout de 🌊 Sufokia (349), Amakna mis à jour (298)
  - Nouvelle section "Distribution Sufokia" avec breakdown par rareté et taux

### Fixed

- **Snapshot statique `getCards()` dans 20 fichiers** — `const cards = getCards()` appelé au top-level (chargement du module) créait un snapshot figé au démarrage du bot. Les cartes ajoutées via `/importcards` ou `/addcard` (dont Sufokia) n'étaient jamais visibles dans ces fichiers sans restart.
  - 16 event handlers : eventCra, eventEcaflip, eventEliotrope, eventEniripsa, eventFeca, eventForgelance, eventHuppermage, eventIop, eventOsamodas, eventOuginak, eventRoublard, eventSacrieur, eventSram, eventSteamer, eventXelor, eventZobal → `getCards()` déplacé dans `generate()`
  - `systems/krosmoshop.js` → `getCardsById()` déplacé dans `buyFromShop()` et `getCardsByRarity()`
  - `commands/joueur/fusion.js` → `getCards()` déplacé dans `execute()`
  - `commands/joueur/krosmoz.js` → `getCards()` + `setCache` statique remplacés par `getSetCache()` dynamique
  - `commands/dev/devfusion.js` → `getCards()` déplacé dans `execute()`
  
---
[0.25.0] - 2026-03-20

### Added

- Nouvelle commande **/mystats** — statistiques détaillées du joueur avec 6 pages navigables :
  - 📊 Général (niveau, kamas, cartes, achievements, activité)
  - 📚 Collection (breakdown par rareté et par set, shiny, plus gros stock)
  - 🎲 Packs & RNG (packs ouverts, taux SSR réel, dry streak, records)
  - 💰 Économie (kamas, ventes, daily, krosmoshop, fusions)
  - 🎪 Events (eventpacks, classes participées, SSR par classe, jackpots)
  - 💬 Social (profil views, mentions, trades, titres)

- Nouveau système de **quêtes journalières et hebdomadaires** (`systems/questSystem.js`)
  - **3 quêtes journalières** tirées depuis un pool de 18, reset chaque jour à 1h (heure FR)
  - **5 quêtes hebdomadaires** tirées depuis un pool de 23, reset chaque lundi à 1h (heure FR)
  - Mêmes quêtes pour tous les joueurs (sélection déterministe par date)
  - Progrès calculé par diff de stats — aucune modification nécessaire dans les commandes existantes
  - Récompenses : kamas, XP, packs
  - **Bonus journalier** si 3/3 terminées : +500 kamas +100 XP
  - **Bonus hebdomadaire** si 5/5 terminées : +5000 kamas +500 XP +3 packs

- Nouvelle commande **/quests** — interface quêtes avec :
  - 2 onglets (☀️ Journalières / 📅 Hebdomadaires)
  - Barres de progression par quête
  - Bouton "Récupérer tout" pour claim en un clic
  - Timer de reset affiché
  - Embed doré quand toutes les quêtes sont récupérées

- Renommage de **/kroshelp** → **/krosmohelp** avec refonte complète :
  - 7 catégories au lieu de 4 (ajout Events, Gameplay, RNG & Pity)
  - Contenu mis à jour avec toutes les features actuelles
  - 2 rangées de boutons pour la navigation

### Fixed

- **Bug critique `systems/market.js`** : le fichier système avait été écrasé par le contenu de la commande (`commands/joueur/market.js`) — toutes les fonctions market (`getMarket`, `buyCard`, `addListing`, `removeListing`, `getUserListings`, `getAveragePrices`) étaient absentes, causant un crash de toute opération market
- **Bug `sellduplicate.js`** (collector) : `rarityEmoji[card.rarity]` utilisé dans la section confirmation alors que la variable locale n'existait plus après centralisation → crash au moment de confirmer la vente des doublons. Remplacé par `RARITY_EMOJI[card.rarity]`
- **Bug `pity.js`** : les taux SSR affichés ne correspondaient pas aux taux réels de `pack.js` — les paliers `< 40 → 0.5%`, `< 46 → 2%`, `< 49 → 5%` manquaient. Les joueurs voyaient des taux sous-estimés dans `/pity`
- **Bug `inventaire.js`** : `withResponse:true` sur `editReply()` retournait un objet incompatible avec `createMessageComponentCollector()`, cassant la navigation par boutons

### Changed

- **`commands/joueur/market.js`** → `rarityEmoji` hardcodé remplacé par `RARITY_EMOJI` depuis `constants.js` + `getCards()` appelé dynamiquement dans chaque fonction au lieu d'un snapshot statique au top-level
- **`commands/joueur/krosmoshop.js`** → `rarityEmoji` hardcodé remplacé par `RARITY_EMOJI` depuis `constants.js` + `getCards()` appelé dynamiquement dans `execute()` au lieu du top-level
- **`commands/joueur/inventaire.js`** → `rarityEmoji` + `rarityOrder` remplacés par `RARITY_EMOJI` + `RARITY_ORDER` depuis `constants.js`, affichage shiny ✨ ajouté, footer avec compteur shiny
- **`commands/joueur/pity.js`** → `getSSRRate()` aligné sur les taux de `pack.js` (soft pity progressive complète)

### Improved

- **README.md** — refonte complète : 306 achievements, section events (19 Dieux), KrosmoShop, SSR Shiny, soft pity progressive, architecture modulaire achievements/events, commandes à jour, gameplay loop enrichi
- **`/krosmohelp`** — aide complète et à jour couvrant tous les systèmes du bot

---

[0.24.0] - 2026-03-20

### Fixed

- **Bug critique `pityBreaker`** : l'achievement ne se déclenchait **jamais** — le code vérifiait `user.pity[setId].SSR >= 49` après que `coreGeneratePack()` ait déjà reset le pity à 0. Corrigé avec `pitySSRBefore >= 48` capturé avant l'ouverture du pack
- **Bug `achievementEngine.js`** : les cartes étaient mises en cache au `require()` via `Object.values(data.cards)` — snapshot statique jamais mis à jour. Les achievements de complétion de set ne se déclenchaient pas pour les cartes ajoutées après le démarrage du bot
- **Bug `balance.js`** : `user.stats.balanceCheck` modifié sans `save()` — la stat pouvait être perdue si le bot crash avant l'autosave 30s

### Changed

- **`systems/packEngine.js`** → `pityBreaker` utilise désormais `pitySSRBefore` (capturé avant le pack) au lieu du pity déjà reset
- **`systems/achievementEngine.js`** → `checkSetCompletion()` lit `data.cards` dynamiquement à chaque appel au lieu d'un snapshot statique
- **`commands/joueur/balance.js`** → ajout de `save(interaction.user.id)` ciblé après modification de stats

### Improved

- **Centralisation complète des constantes** — suppression de toutes les constantes hardcodées restantes :
  - `commands/joueur/inventaire.js` → `rarityEmoji` + `rarityOrder` remplacés par `RARITY_EMOJI` + `RARITY_ORDER` depuis `constants.js`
  - `commands/joueur/market.js` → `rarityEmoji` remplacé par `RARITY_EMOJI` depuis `constants.js`
  - `commands/joueur/sellcard.js` → `rarityEmoji` + `rarityPrice` remplacés par `RARITY_EMOJI` + `SELL_PRICE` depuis `constants.js`
  - `commands/joueur/sellduplicate.js` → `rarityEmoji` + `sellValues` remplacés par `RARITY_EMOJI` + `SELL_PRICE` depuis `constants.js`
  - `commands/joueur/eventpack.js` → `rarityColor` + `rarityEmoji` remplacés par `RARITY_COLOR` + `RARITY_EMOJI` depuis `constants.js`

- **Élimination de tous les snapshots statiques `data.cards`** — les fichiers suivants lisaient `data.cards || []` au top-level, créant un snapshot figé au démarrage. Remplacé par `getCards()` depuis `cardRegistry` appelé dynamiquement :
  - `commands/joueur/profil.js` → `getCards()` dans `execute()`
  - `commands/joueur/trade.js` → `getCards()` dans `execute()`, `menu()`, `button()`
  - `commands/joueur/market.js` → `getCards()` dans `renderMarket()` et `button()`
  - `systems/dailySystem.js` → `getCards()` dans `giveSSR()`
  - `systems/inventoryImage.js` → `getCards()` dans `generateInventory()`
  - `commands/dev/setstats.js` → `getCards()` + `loadSets()` dans `execute()`

- **`save()` ciblé par userId** — plusieurs commandes appelaient `save()` sans argument (sauvegarde de tous les users en mémoire). Remplacé par `save(interaction.user.id)` dans : `sellcard.js`, `sellduplicate.js`, `eventpack.js`

---

[0.23.0] - 2026-03-20

### Added

- **Système d'achievements modulaire** : refonte complète de `achievementRegistry.js` en aggregateur pur
  - `achievements/achievementPacks.js` → packs normaux + RNG
  - `achievements/achievementRarity.js` → SSR, Shiny, KrosmoShop
  - `achievements/achievementFusion.js` → fusions
  - `achievements/achievementCollection.js` → cartes totales, uniques
  - `achievements/achievementEconomy.js` → kamas, daily, balance, inventaire, help, titres
  - `achievements/achievementSocial.js` → profil, leaderboard, mentions
  - `achievements/achievementSecrets.js` → secrets
  - `achievements/achievementEvents.js` → 148 achievements liés aux events (NOUVEAU)
  - `achievements/achievementSpecial.js` → 39 achievements comportementaux (NOUVEAU)

- **306 achievements au total** (contre ~100 avant)

- `achievementEvents.js` — achievements events complets :
  - 6 paliers eventPacks globaux (1→1000)
  - 6 paliers de participation à des events distincts
  - 6 paliers tickets entièrement utilisés
  - 5 paliers SSR obtenues en event
  - 19 achievements SSR par classe (une SSR pendant l'event Iop, Cra, etc.)
  - 5 paliers packs par classe × 19 classes = 95 achievements de classe
  - 3 achievements croisés SSR (5, 10, 19 classes différentes)
  - 4 paliers jackpot Enutrof + 4 paliers jackpot Feca

- `achievementSpecial.js` — achievements spéciaux :
  - Pack à minuit (`packMinuit`)
  - Vendre une carte dans les 10 secondes (`sellFast`, secret)
  - Avoir 0 kamas (`broke`)
  - Avoir vendu ET acheté au market (`marketBothWays`)
  - Débloquer un achievement dans chaque catégorie (`allTriggers`, secret)
  - Atteindre le hard pity SSR (`hardPitySSR`)
  - 100 packs sans S ni SSR (`droughtSSR`)
  - 5 trades avec le même joueur (`tradePartner5`)
  - Envoyer et recevoir un trade le même jour (`tradeBothWays`)
  - Posséder 1 carte de chaque rareté (`allRarities`)
  - 10 / 25 / 50 / 100 exemplaires d'une même carte (`hoarder10–100`)
  - Inscrit depuis 30 jours (`veteran30`)
  - 7 jours d'activité consécutifs (`active7days`)
  - Premier pack d'un event (`firstEventPack`)
  - `/krosmoz` 42, 111, 222, 333, 444, 555, 666 (secret), 777 fois
  - Nombre de cartes palindrome (`palindrome`, secret)
  - Pack avec que des C (`allC`, secret) ou que des U (`allU`, secret)
  - SSR obtenue un lundi (`ssrLundi`)
  - Mettre une SSR sur le market (`marketSSR`)
  - Vider tous ses tickets event en < 2 minutes (`speedTickets`)
  - Obtenir une SSR comme résultat de fusion (`fusionSSR`)
  - Utiliser `/eventpack` sans event actif (`eventpackNoEvent`, secret)
  - Prestige : 10 / 25 / 50 / 100 / 200 achievements débloqués
  - `achieveAll` : débloquer tous les achievements (`Krosmoz Absolu`, s'auto-ajuste)

- **Nouvelles stats user** trackées dans `userSystem.js` :
  - `eventPacksOpened`, `ssrFromEvent`, `ticketsFullyUsed`
  - `jackpotEnutrof`, `jackpotFeca`, `firstEventPacks`
  - `eventsParticipated[]`, `ssrByClass{}`, `eventPacksByClass{}`
  - `krosmozOpened`, `packAtMidnight`, `ssrOnMonday`
  - `allCPack`, `allUPack`, `palindromeReached`
  - `dryStreak`, `dryStreakMax`, `hardPityReached`
  - `sellFast`, `marketBought`, `marketSSRListed`
  - `fusionSSRResult`, `speedTickets`
  - `tradePartners{}`, `tradeBothWaysToday`
  - `activityStreak`, `lastActivityDay`, `createdAt`

- **`eventSystem.js`** — ajout de `firstPackTaken` sur l'event courant + `claimFirstPack()` exporté + `user.event.startTime` pour tracking vitesse tickets

- **`profil.js`** — ajout de la stat `📦 eventPack ouverts` dans les statistiques

### Fixed

- **Anti-double SSR event** : `eventPackEngine.js` — double vérification `limitSSR` après le handler, filtre des cartes `null`, `try/catch` sur l'appel handler, sécurité finale si >1 SSR après `limitSSR`
- **Jackpot Feca** : tracking `jackpotFeca` corrigé — on check `jackpotMessage` (généré dans `rewardSystem`) au lieu de `meta.jackpot` qui n'était jamais set pour Feca
- **SSR event non comptées dans le profil** : `user.stats.ssrPulled` et `user.stats.ssrFromEvent` désormais incrémentés dans `eventpack.js` après `registerEventPack`
- Correction critique de userSystem.js : les données utilisateurs (kamas, cartes, stats, pity) n'étaient jamais persistées sur disque après modification — save() ne sauvegardait que market/cards/devs, pas les fichiers users individuels
- Correction de devSystem.js : le fallback path pointait vers ./database/devs.json au lieu de ./data/devs.json, créant deux sources de vérité pour les développeurs
- Correction de packEngine.js : l'achievement luckyStart était impossible à déclencher car packsOpened était incrémenté avant l'appel à openPack()
- Correction de leaderboardCache.js : le leaderboard ne listait que les users chargés en RAM (lazy loading), les joueurs inactifs depuis le dernier restart étaient invisibles
- Correction de setSystemFile.js : data.sets n'était jamais initialisé dans dataManager.loadAll(), causant des sets vides dans certaines commandes
- Correction de market.js : cardsSold était incrémenté au listing (mise en vente) au lieu de l'achat réel — un joueur pouvait avoir des ventes comptées sans que personne n'achète
- Correction de achievementSpecial.js : 3 require() avec le mauvais chemin relatif (./ au lieu de ../) causant des dépendances circulaires et des conditions d'achievements toujours false
- Correction de inventaire.js : withResponse:true sur editReply() retournait un objet incompatible avec createMessageComponentCollector(), cassant toute la navigation par boutons
- Correction de profil.js : les boutons Inventaire/Sets/Succès crashaient en appelant command.execute() avec une ButtonInteraction au lieu d'une CommandInteraction, causant des double-defer et des erreurs Unknown interaction (10062)

### Changed

- **Voice lines events** : affichage désormais en `## NomDuDieu` + `> ***TEXTE EN MAJUSCULES***` pour l'effet "dieu qui parle"
- **Messages start/mid/end events** : formatage enrichi avec headers Discord (`#`, `##`), séparateurs `━━━` et valeurs importantes en gras
- **`eventpack.js`** : achievement secret `eventpackNoEvent` déclenché si `/eventpack` utilisé sans event actif
- **`krosmoz.js`** : ajout des trackings post-pack (minuit, lundi, allC/U, palindrome, dryStreak, hardPity, activityStreak, krosmozOpened)
- **`sellcard.js`** : tracking `sellFast` via `user.lastPack`
- **`sellduplicate.js`** : tracking `sellFast` + `updateActivityStreak` + achievementCheck `collection` et `pack` ajoutés
- **`fusion.js`** : tracking `fusionSSRResult` quand `targetRarity === "SSR"`
- **`trade.js`** : tracking `tradePartners`, `tradeSentToday`, `tradeReceivedToday`, `tradeBothWaysToday`
- **`systems/market.js`** : tracking `marketBought` dans `buyCard` + `marketSSRListed` dans `addListing` via registre cartes
- **`commands/joueur/market.js`** : `achievementCheck` déclenché après achat ET vente
- **`daily.js`** : `updateActivityStreak` au claim + affichage `📅 Présence X jours consécutifs` dans l'embed + achievementCheck `pack` ajouté

### Improved

- `userSystem.js` : export de `updateActivityStreak()` et `checkPalindrome()` / `isPalindrome()`
- `achievementRegistry.js` : réduit à 9 lignes (aggregateur pur), maintenabilité maximale
- Architecture achievements totalement scalable : ajouter une catégorie = créer un fichier + 1 ligne dans le registry
- Ajout de markDirty(id) exporté dans userSystem.js pour un marquage explicite des users modifiés
- Ajout du tracking cardsListed dans market.js pour distinguer les mises en vente des ventes réelles
- Ajout d'exports manquants dans market.js : getMarket, getUserListings, removeListing
- Amélioration du leaderboard : scan complet de tous les fichiers users sur disque au lieu du cache mémoire partiel
- Amélioration de setSystemFile.js : support des deux formats de sets.json (tableau direct ou { sets: [...] }) avec cache automatique
- Amélioration de packEngine.js : tracking automatique de dry streak, pack minuit, SSR lundi, all C/all U packs, reset du dry streak à l'obtention d'une SSR
- Amélioration de profil.js : gestion d'erreur robuste sur les boutons avec try/catch et fallback followUp
- Amélioration de giveAchievement() dans packEngine.js : ajout automatique du titre dans user.titles lors du déblocage d'un achievement


---

[0.22.0] - 2026-03-20

### Fixed

- Correction du crash critique à l'ouverture de pack (`TypeError: Cannot read properties of undefined (reading 'C')`) — `RARITY_COLOR` importé dans `krosmoz.js` mais absent de `constants.js`

### Improved

- `systems/constants.js` → ajout de `RARITY_COLOR` et export
- `systems/market.js` → suppression du `rarityOrder` local inutilisé
- `commands/joueur/sellduplicate.js` → `rarityEmoji` + `sellValues` hardcodés remplacés par `RARITY_EMOJI` + `SELL_PRICE` depuis `constants.js`
- `commands/joueur/inventaire.js` → `rarityEmoji` + `rarityOrder` hardcodés remplacés par `RARITY_EMOJI` + `RARITY_ORDER` depuis `constants.js`
- `commands/joueur/market.js` → `rarityEmoji` hardcodé remplacé par `RARITY_EMOJI` depuis `constants.js`
- Centralisation des constantes de rareté terminée sur l'ensemble du projet

---

[0.21.0] - 2026-03-20

### Added

- Implémentation complète du système **double daily** (10% de chance)
- Le double daily multiplie par 2 les kamas ou les packs obtenus
- Le double daily ne s'applique pas au streak SSR (streak 7)
- Si streak 6/7 avec double → SSR donnée normalement puis retour à 0/7

### Changed

- `krosmoz.js` → assignation de `user.lastSet` au moment du choix du set
- `eventPackEngine.js` → récupération du setId depuis `user.lastSet` ou `user.pity` en fallback
- `addcard.js` → ajout de l'option `set`, image sauvegardée dans le bon dossier par set, champ `set` ajouté à la carte
- `auditSystem.js` → lecture des cartes depuis `dataManager`, users depuis fichiers individuels dans `USERS_DIR`
- `rewards.js` → transformé en re-export de `economy.js` (source unique pour `rewardKamas`)

### Improved

- `userSystem.js` → suppression du `_dirty: true` systématique à chaque `getUser()`, autosave uniquement si modification réelle
- `leaderboardCache.js` → classement SSR désormais calculé via le registre de cartes au lieu d'une comparaison d'ID toujours fausse
- `chatSystem.js` → notifications achievements via `message.reply()` au lieu de `interaction.followUp()` incompatible
- `sellcard.js` / `sellduplicate.js` → `getCardsById()` appelé à l'exécution et non au chargement du module
- `packEngine.js` / `simpack.js` → import `rewardKamas` depuis `economy.js` directement
- `devgive.js` → logique `giveCard` inlinée directement, suppression de l'import inexistant
- `removecard.js` → chemin image corrigé + feedback sur les IDs introuvables + `resetRegistry()` après suppression
- `addcard.js` → `resetRegistry()` appelé après ajout pour mise à jour immédiate du registre

### Fixed

- Correction du classement SSR dans `/leaderboard` qui retournait 0 pour tous les joueurs
- Correction des achievements sociaux jamais déclenchés dans `chatSystem.js` (mauvaise signature `achievementCheck`)
- Correction de `/krosmodev` qui crashait au démarrage (option `joueur` non déclarée)
- Correction de `/removecard` qui crashait au démarrage (option `ids` non déclarée)
- Correction de `eventZobal.js` qui avait `key: "sacrieur"` au lieu de `"zobal"`
- Correction de `eventZobal` et `eventSacrieur` qui avaient la même logique (Zobal = upgrade garanti tous rangs, Sacrieur = 60% mutation ignore S/SSR)
- Correction de `eventPackEngine.js` qui appelait `generatePack(user)` sans `setId` → packs event toujours vides
- Correction de `auditSystem.js` qui lisait `cards/cards.json` (toujours vide) au lieu de `data/cards.json`
- Correction de `auditSystem.js` qui lisait `users.json` inexistant au lieu des fichiers individuels
- Correction de `inventoryImage.js` path require incorrect (`../systems/dataManager` → `./dataManager`)
- Correction de `devgive.js` qui appelait `giveCard()` non exportée depuis `pack.js` → crash immédiat
- Correction de `eventCra.js` comparaison d'ID non robuste → cartes ciblées jamais substituées
- Correction du double daily annoncé depuis la 0.17.0 mais hardcodé à `false`

---

[0.20.0] - 2026-03-19

### added

- Nouveau système eventHandlers modulaires (1 fichier par event)
- Séparation complète des logiques d'events (Iop, Cra, Xelor, etc.)
- Ajout de 19 handlers d'events indépendants
- Ajout du champ meta.ux pour enrichir le rendu visuel des packs
- Ajout des voiceLines dynamiques par event (S / SSR)
- Affichage des voiceLines directement en channel après ouverture
- Ajout d'un système UX unifié pour tous les events
- Ajout de titres dynamiques d'embed selon l'event
- Ajout d'un système de fallback sécurisé si handler absent
- Ajout de logs de debug pour les erreurs d'event handlers

### Changed

- Refonte complète de eventPackEngine → désormais basé sur des handlers
- Suppression du système monolithique switch/case des events
- Simplification du pipeline RNG pour les events
- Amélioration du découplage entre :
logique gameplay
affichage UX
données d'event
- Amélioration du système de détection des raretés (S / SSR)
- Refonte du système de voiceLines (plus robuste + priorisation SSR)
- Mise à jour de eventpack.js avec support UX avancé

### Improved

- Amélioration majeure de la scalabilité des events
- Amélioration de la lisibilité du code
- Amélioration de la maintenabilité du système d'events
- Amélioration de la robustesse du RNG event
- Amélioration de l'immersion utilisateur (RP + feedback visuel)
- Amélioration du système de reveal des packs
- Amélioration du système de gestion des erreurs (try/catch handlers)
- Amélioration globale de l'architecture orientée modularité

### Fixed

- Correction du non-déclenchement des voiceLines S / SSR
- Correction de la détection de rareté dans les packs event
- Correction d'un problème où voiceLines pouvait être undefined
- Correction du downgrade SSR incohérent (remplacé par vraie carte S)
- Correction de packs invalides retournés par certains handlers
- Correction de crash potentiel si handler absent
- Correction de bugs liés à la mutation des packs (Xelor, Sacrieur)
- Correction de plusieurs incohérences UX dans les events

---
[0.19.0] - 2026-03-19

### Added

- Nouveau système KrosmoEvent (/krosmoevent, /eventpack, /forceevent)
- Implémentation de 19 événements basés sur les classes Krosmoz
- Système de tickets d'event (2 à 3 par joueur) : non stockables, reset à chaque event
- Nouvea moteur eventPackEngine : génération dynamique de packs selon l'event actif, support complet des overrides RNG
- Ajout d'un système meta event pour UX : mutations (Sacrieur), upgrades (Zobal, Forgelance), duplications (Pandawa, Sadida), cartes ajoutées / supprimées (Xelor, Huppermage)
chaos RNG (Steamer)
- Ajout des messages RP dynamiques : message de début d'event, message en cours, message de fin
- Ajout d'un système de statistiques d'event : nombre de packs ouverts, nombre de SSR obtenues, nombre de cartes obtenues 
- Ajout de multiplicateurs spéciaux : Enutrof → kamas x5 + jackpot caché, Feca → XP x5 + jackpot caché
- Ajout du système SSR cap (1 max par pack) hors cas spéciaux
- Ajout de l'animation Sram complète : pack totalement invisible (???), aucune révélation finale
- Ajout d'un système de logs RP dans les packs : affichage des mutations / upgrades / duplications
- Ajout du système Steamer RNG dynamique affiché
- Ajout du système Cra ciblé : carte S spécifique avec affichage RP

- Ajout du système de voice lines par event (S / SSR) avec déclenchement post-pack
- Ajout de 3 phrases RP par rareté et par classe (immersion renforcée)
- Ajout du système de sélection automatique de la meilleure rareté (SSR > S)
- Ajout d'un système d'affichage visuel contextuel par event (emoji dynamiques sur cartes)
- Ajout du support des métadonnées enrichies (duplicates structurés, added objects, downgrades)
- Ajout du support generateCustomPack et generateGlobalPack pour events spéciaux (Steamer, Ouginak, Ecaflip)

---

### Changed

- Refonte complète du système eventSystem
- Passage d'un event SSR simple → système modulaire multi-events
- Refonte de la commande /krosmoevent : gestion start / stop / force / status, sécurisation dev uniquement
- Amélioration de la commande /eventpack : affichage des tickets restants, fusion du résultat + rewards dans un seul embed
- Amélioration globale de l'UX des packs event : animations spécifiques par event, affichage du nombre de cartes réel
- Amélioration du système Osamodas : limitation du nombre de duplications selon rareté
- Amélioration du système Steamer : RNG chaos limité (évite abus SSR)
- Amélioration du système Xelor : affichage des cartes retirées / ajoutées
- Ajustement des probabilités globales pour éviter excès de SSR

- Refonte complète du système d'affichage des cartes (emoji + nom + rareté texte)
- Amélioration des animations de reveal avec timing optimisé (perf + lisibilité)
- Amélioration du système Pandawa : duplication stable avec tracking original/copie
- Amélioration du système Xelor : structure meta ajoutée pour UX (cartes ajoutées identifiables)
- Amélioration du système Ouginak : downgrade visible et traçable
- Amélioration du système Ecaflip : séparation jackpot / luck avec meta dédiée
- Amélioration du système Roublard : sécurisation du nombre total de cartes (fix 5+3)
- Amélioration du système Huppermage : équilibrage des pools (boost S/UR)
- Uniformisation des structures meta entre tous les events (cohérence engine)

---

### Improved

- Système d'event désormais scalable et extensible
- Meilleure lisibilité des effets d'event côté joueur
- UX enrichie avec feedback direct sur chaque modification de pack
- Meilleure cohérence entre RNG, UX et narration RP
- Meilleure stabilité globale des interactions Discord (events inclus)
- Architecture des events désormais découplée du packEngine principal

- Immersion fortement améliorée via voice lines dynamiques contextuelles
- Lisibilité renforcée grâce aux indicateurs visuels (🍺 💀 🎭 ⏳ 🌿 🐺)
- Feedback joueur amélioré avec distinction claire des modifications (ajout, suppression, mutation)
- Meilleure compréhension des effets RNG complexes (Xelor, Steamer, Ecaflip)
- Fluidité des animations optimisée pour éviter surcharge serveur (multi users)
- Système eventPackEngine rendu totalement extensible (ajout d'events sans refactor)

---

### Fixed

- Correction de /eventpack : interaction failed : affichage des rewards séparé
- Correction du système Sram : suppression de la révélation finale
- Correction du système Roublard : nombre de cartes incorrect
- Correction du système Eniripsa : suppression des C/U/R non appliquée
- Correction du système Enutrof : multiplicateur kamas non appliqué
- Correction du système Feca : multiplicateur XP non appliqué
- Correction du système Huppermage : cartes bonus non générées
- Correction du système Pandawa : duplication non fonctionnelle
- Correction du système Cra : taux incorrect + absence de cible affichée
- Correction du système Iop: absence de HR/UR garantis
- Correction du système Steamer : RNG non réellement dynamique
- Correction du système Xelor : pack non modifié correctement
- Correction du système Sadida : duplication non appliquée
- Correction du système Forgelance : upgrade rareté non appliqué
- Correction de /forceevent : select menu non fonctionnel, problème d'ownership interaction
- Correction de /krosmoevent : interaction failed, mauvais routing select menu
- Correction globale des events : incohérences RNG, absence de feedback UX, effets non appliqués

- Correction du bug critique eventRegistry tronqué (seulement 8 events chargés)
- Correction des imports eventRegistry (mauvais fichier chargé / duplication)
- Correction du bug Pandawa : duplication incohérente et non déterministe
- Correction du bug Xelor : meta.added non exploitable côté UX
- Correction du bug Ouginak : downgrade non affiché
- Correction du bug UX Huppermage : mauvais emoji (⏳ → 🧠)
- Correction du bug reveal : perte d'informations visuelles (rarity texte manquante)
- Correction du bug tickets event non reset correctement entre events
- Correction du bug eventpack bloqué (pack vide / generatePack non exporté)

---

### Removed

- Suppression complète de l'ancien eventSystem SSR
- Suppression de la commande /event legacy
- Suppression des anciennes logiques d'event non modulaires


---

[0.18.0] - 2026-03-18

### Added

- Nouveau système **KrosmoShop** (`/krosmoshop`)
- Shop quotidien avec **15 cartes fixes**
- Distribution :
  - 1 SSR
  - 2 S
  - 3 UR
  - 4 HR
  - 5 SR
- Prix fixes par rareté (SSR → SR)
- Reset automatique **à minuit (heure FR)**
- Génération aléatoire avec **mélange de tous les sets**
- Système **anti-abus** :
  - 1 achat max par carte par jour
  - shop partagé global (pas de stock limité)
- Auto-création du fichier **krosmoshop.json**
- Ajout de statistiques joueur :
  - `krosmoshopStats.cardsBought`
  - `krosmoshopStats.ssrBought`
- Ajout de nouveaux **achievements KrosmoShop** :
  - Acheter 1 / 10 / 100 / 1000 cartes
  - Acheter une SSR
- Intégration complète du trigger **"krosmoshop"** dans le système d'achievements
- Ajout de la **pity S (30 pulls)** dans le système de packs
- Support complet de la pity S dans :
  - `/krosmoz`
  - `/pity`
  - `/hardpity`
- Ajout du **Hard Pity S** pour les outils dev
- Amélioration de la commande **/simpack**
- Simulation désormais **100% fidèle au système réel**
- Intégration de la pity S dans les simulations
- Meilleure cohérence entre RNG réel et simulation

### Changed

- Refonte complète de la commande **/market**
- retour à un système simple :
  - vente via ID
  - UX clarifiée
- ajout d'un **tip utilisateur** :
  - ID visible dans `/inventaire`
- amélioration de la navigation du marché
- stabilisation des boutons et modals
- correction de la gestion des états (`marketState`)
- Amélioration du système de pity :
- nouvelle hiérarchie :
  - UR → 10
  - S → 30
  - SSR → 50
- meilleure progression entre raretés
- Amélioration de **/krosmoz**
- affichage de la pity S dans le menu des sets
- affichage dans le résultat de pack
- Amélioration de **/pity**
- ajout de la barre de progression S
- meilleure lisibilité globale

### Improved

- Cohérence globale du système RNG
- Simulation désormais fiable pour équilibrage économique
- Meilleure intégration entre : market, shop, packs
- Amélioration de la logique de progression joueur
- Meilleure scalabilité du système d'achievements
- Stabilisation des interactions (select menu, modals, boutons)
- Amélioration de la persistance des données (Railway safe)

### Fixed

- Correction du système **/market**
- bug empêchant la mise en vente via modal
- problème "Utilisateur introuvable"
- problème de state non persisté
- Correction des interactions Discord
- select menu non routé (krosmoshop)
- échec d'interaction après 3s
- Correction du **KrosmoShop**
- erreur `ENOENT` (fichier inexistant)
- duplication des options dans le select menu
- reset incorrect du shop à chaque restart
- Correction du système de pity
- ajout de la clé `S` dans toutes les structures
- fix des resets incorrects
- Correction de **/simpack**
- incohérence entre simulation et RNG réel
- absence de la pity S
- Correction de plusieurs erreurs liées aux modals et interactions Discord

### Removed

- Suppression des anciennes tentatives UX complexes du market
- Suppression des systèmes instables de sélection de cartes à vendre

---

---

[0.17.0] - 2026-03-17

### Added

- Event spécial **Krosmo-bot** dans `/trade`
- Krosmo-bot peut **voler une carte lors d'un échange**
- **1% de chance** que Krosmo-bot rende une **SSR aléatoire**
- Nouveau **titre secret** : *Favori du Krosmoz*
- Nouveaux **achievements secrets liés à Krosmo-bot**
- Messages aléatoires lors de l'event Krosmo-bot
- Commande admin **/ecogive** `add` `remove` `set`
- Simulation RNG améliorée dans **/simpack**
- Simulation **multi-joueurs (50 profils)** pour un pity plus réaliste
- Calcul plus précis des statistiques de drops
- Calcul économique plus réaliste dans les simulations
- Affichage détaillé des statistiques dans **/stats**


### Changed

- Amélioration de la commande **/daily**
- affichage du **streak visuel**
- ajout d'**XP progressive**
- affichage du **record de streak**
- messages aléatoires
- visibilité publique de la récompense
- correction du calcul du cooldown
- Amélioration UX du système **/fusion**
- affichage des **chances de fusion dans le résultat**
- affichage des **cartes réellement utilisées**
- affichage du **nombre de cartes disponibles**
- ajout de **compteurs statistiques de fusion**
- meilleure gestion des pools de cartes
- Amélioration de la commande **/titre**
- affichage du **titre actuel**
- sélection plus claire via menu
- pagination automatique des titres
- Amélioration de la commande **/market**
- navigation améliorée
- bouton retour après affichage des ventes
- filtres par **rareté**
- pagination du marché
- Amélioration du système **/leaderboard**
- affichage graphique avec **barres de progression**
- pagination stable
- meilleure performance via **leaderboard cache**
- Amélioration de **/inventaire**
- pagination optimisée
- filtre par **rareté**

### Improved

- Stabilisation globale des **interactions Discord**
- Sécurisation des **menus pour éviter l'utilisation par un autre joueur**
- Amélioration des outils **dev pour le debug RNG**
- Amélioration des outils **dev pour tester l'économie**
- Optimisation du **système de pack opening**

### Fixed

- Correction de la commande **/titre**
- erreur Discord liée à la limite de **25 options**
- Correction du système **/daily**
- bug affichant des temps absurdes (ex : `492685h`)
- Correction du système **/leaderboard**
- erreur de chargement du module `leaderboardCache`
- Correction du système **/event**
- Correction de la commande **/simpack**
- calcul incorrect du nombre total de cartes
- gestion incorrecte des lucky packs
- Correction du **système de pack**
- gestion du pity SSR
- sécurité du pool de cartes
- stabilité du tirage
- Correction de plusieurs incohérences dans les systèmes de **simulation RNG**

### Removed

- Suppression de **/krosmodev**
- Suppression de **/devpack**
- Suppression de **/setbalance**

---


[0.16.0] - 2026-03-16

### Added

- Nouveau achievementRegistry centralisé
- Ajout de plus de 100 achievements couvrant :
Packs  
Raretés  
Fusion  
Collection  
Market  
Social  
RNG  
Secrets  

- Ajout de titres débloqués via achievements

- Achievements liés à la complétion de sets :
Incarnam  
Astrub  
Amakna  

- Achievements de progression de collection globale (25% / 50% / 75% / 100%)
- Achievements liés aux SSR Shiny
- Achievements liés aux packs chanceux et RNG extrême
- Achievements liés aux conditions temporelles (nuit, heure spécifique)
- Achievements liés aux interactions sociales (mentions, trades)

- Achievements liés à l'utilisation excessive de commandes :
/profil  
/leaderboard  
/kroshelp  
/titre  
/balance  
/inventaire  

- Achievements liés à l'économie :
achat de packs  
vente de cartes  
vente de doublons  
consultation du solde  

- Achievements liés à la progression quotidienne :
daily claims  
daily streak  

- Achievements liés à la consultation des classements
- Achievements liés à l'utilisation du système de titres

- Nouveau système de notification des achievements via achievementNotifier
- Affichage automatique des succès débloqués après les actions du joueur
- Ajout d'une description détaillée pour chaque achievement

- Commande dev /auditachievements permettant d'auditer l'ensemble du système d'achievements
- Debug détaillé des conditions d'achievements dans la console

- Nouveau système de cache pour le leaderboard (leaderboardCache)
- Calcul du leaderboard optimisé avec reconstruction périodique (30s)
- Leaderboard désormais scalable pour plusieurs milliers de joueurs

- Amélioration visuelle du leaderboard :
rangs globaux (#1 #2 #3)  
médailles pour le top 3  
barres de progression visuelles pour les scores  

- Ajout d'un profil spécial RNG pour le bot Krosmoz Card
- La commande `/profil krosmoz-card` génère désormais un profil entièrement aléatoire
(niveau, XP, statistiques, badges, succès, kamas, collection)

### Changed

- Refonte complète du moteur d'achievements
- Les conditions d'achievements sont désormais centralisées dans achievementRegistry
- Simplification de la logique d'achievements dans les commandes
- Nouveau pipeline achievementCheck → notifyAchievements
- Les achievements peuvent maintenant attribuer automatiquement un titre
- Amélioration de la gestion des achievements secrets
- Nettoyage des anciens triggers d'achievements dispersés dans le code

- Migration de l'ensemble des commandes vers le nouveau système d'achievements
- Standardisation des triggers d'achievements (pack, economy, collection, fusion, social, daily)

- Migration de plusieurs commandes vers un modèle d'interaction plus robuste utilisant deferReply / editReply
- Harmonisation de la gestion des interactions Discord (buttons, modals, select menus)

- Refactorisation de la commande `/leaderboard` pour utiliser le système de cache
- Suppression des recalculs lourds à chaque interaction
- Amélioration des performances et de la stabilité du classement

### Improved

- Amélioration de la robustesse du système d'achievements
- Meilleure détection des conditions d'achievements
- Meilleure compatibilité avec les futurs systèmes sociaux du bot
- Debug console amélioré pour faciliter le développement
- Structure du code plus modulaire et maintenable
- Ajout de nouveaux triggers statistiques utilisateur pour faciliter l'ajout futur d'achievements

- Amélioration de la cohérence des statistiques utilisateur utilisées par les achievements
- Meilleure intégration du système d'achievements avec :
packEngine  
dailySystem  
fusionSystem  
market  
trade  
profil  

- Optimisation des interactions Discord avec les collectors (pagination menus, boutons)
- Optimisation de la commande /krosmoz avec un système de cache interne pour les sets
- Réduction des calculs redondants lors de l'ouverture de packs
- Amélioration des performances lors de la révélation des cartes

- Amélioration des performances du leaderboard
- Réduction drastique de la charge CPU lors de la consultation des classements
- Meilleure lisibilité du classement avec affichage des barres de progression

### Fixed

- Correction de plusieurs achievements qui ne se déclenchaient pas correctement
- Correction de conditions d'achievements dépendant de stats inexistantes
- Correction de cas où certains achievements pouvaient être déclenchés plusieurs fois
- Correction d'incohérences entre les stats utilisateur et les triggers d'achievements

- Correction de la propagation des achievements dans plusieurs commandes
- Correction des notifications d'achievements non affichées dans certains contextes d'interaction
- Correction de l'intégration achievements / interactions Discord (buttons, modals, selects)

- Correction de plusieurs erreurs liées aux collectors Discord (createMessageComponentCollector)
- Correction d'erreurs `Unknown interaction (10062)` causées par des réponses tardives aux interactions
- Correction de l'utilisation incorrecte de `withResponse:true` dans certaines commandes
- Correction de problèmes d'édition de message (`msg.edit is not a function`) dans certaines animations

- Correction d'un bug dans la commande dev `/hardpity` empêchant certains utilisateurs d'être détectés
- Correction d'un problème d'identifiant utilisateur lors de la sélection des sets

- Stabilisation globale du système d'achievements
- Stabilisation globale du système d'interactions Discord du bot
- Stabilisation du système de leaderboard

---

## [0.15.0] - 2026-03-15

### Added

- Affichage du pity directement dans la commande `/krosmoz`
- Commande `/pity` rendue visible publiquement
- Explication automatique du déclenchement des achievements
- Amélioration des triggers du chatSystem
- Nouvelles astuces du bot lorsqu'il est mentionné
- Prévisualisation détaillée des cartes vendues avec `/sellduplicates`
- Résumé des ventes après utilisation de `/sellduplicates`
- Menu interactif du `/market` (Acheter / Mes ventes)
- Possibilité de retirer ses ventes depuis `/market`

### Changed

- Mise à jour complète de `/kroshelp`
- Réorganisation et clarification de l'aide du bot
- Amélioration de l'affichage de la pity
- Amélioration de l'expérience utilisateur lors des ventes de cartes
- Amélioration des réponses du bot lors des mentions
- Refonte de l'interface du marché `/market`

### Improved

- Amélioration de la robustesse du `packEngine`
- Amélioration du `dailySystem`
- Amélioration du `market system`
- Amélioration de la gestion des ventes de cartes
- Amélioration du système d'échanges entre joueurs
- Stabilisation de plusieurs systèmes internes
- Amélioration de la gestion des interactions (buttons / modals / select menus)

### Fixed

- Correction du bouton **Mettre au market** dans `/carte`
- Correction du modal de mise en vente sur le market
- Correction de `/sellcard`
- Correction de `/sellduplicates`
- Correction du prix de vente des cartes (50% valeur economy)
- Correction de la gestion des modals dans `interactionCreate`
- Correction de l'achat de cartes dans le market
- Correction de la récupération des ventes personnelles dans le market
- Correction du `market system`
- Correction du `daily system`
- Correction du `devdaily`
- Correction d'un exploit dans `/trade` permettant de valider son propre échange
- Correction de plusieurs incohérences dans la gestion des cartes

---
## [0.14.0] - 2026-03-15

### Added

- Nouveau système complet d'achievements
- Achievements liés aux mentions du bot
- Achievements liés aux kamas possédés
- Achievements liés aux packs spéciaux
- Achievements secrets
- Affichage des achievements secrets masqués (🔒 ???)
- Limite de badges affichés dans /profil
- Priorité aux derniers badges obtenus
- Nouveau chatSystem permettant au bot de répondre lorsqu'il est mentionné
- Système d'astuces du bot
- Triggers de mots-clés lorsque le bot est mentionné
- Achievements liés au chat avec le bot
- Achievement Aura Farming
- Achievement 666 cartes
- Achievement Spam de mention
- Achievement Noctambule
- Achievement Matinal
- Achievement Pack Divin
- Achievement Pile ou Face
- Achievement Impossible
- Achievement SSR Shiny

### Changed

- Réorganisation du système des achievements
- Ajout du support des achievements secrets
- Amélioration de la gestion des badges dans le profil
- Centralisation de la logique sociale dans chatSystem

### Improved

- Meilleure détection des packs spéciaux
- Meilleure détection des doublons dans les packs
- Meilleure robustesse du système d'achievements
- Amélioration de la compatibilité avec les futures fonctionnalités sociales du bot

### Fixed

- Correction d'un bug empêchant certains achievements de collection de se déclencher
- Correction d'un bug de détection des doublons dans un pack
- Correction de cas où user.cards pouvait être undefined
- Correction de plusieurs problèmes mineurs dans la gestion des achievements

---

## [0.13.0] - 2026-03-15

### Added
- Affichage du **pity par set dans /profil**
- Affichage du **dernier daily** dans le profil
- Affichage du **streak daily** dans le profil
- Barre de progression **XP améliorée**

### Changed
- Implémentation d'une **soft pity progressive pour les SSR**
- Ajustement du système RNG des packs

### Fixed
- correction du compteur **dailyClaims** qui restait bloqué à 0
- correction de la mise à jour du **pity SSR/UR**
- correction du hard pity SSR appliqué au mauvais moment dans l'ouverture de pack
---

## [0.12.0] - 2026-03-15

### Added
- Triple fusion extrêmement rare dans le système de fusion
- Animation de fusion dans Discord
- Historique des ventes du marché
- Calcul automatique du prix moyen des cartes
- Protection anti manipulation du marché
- Migration automatique `users.json → users/<id>.json`

### Changed
- Refonte complète du système de données
- Les utilisateurs sont maintenant stockés individuellement dans `/data/users/`
- Ajout d'un **dirty save system** (sauvegarde uniquement des utilisateurs modifiés)

### Improved
- Meilleure compatibilité avec **Railway**
- Réduction massive des écritures disque
- Amélioration des performances pour les serveurs avec beaucoup de joueurs

### Fixed
- corrections de bugs inventaire
- correction d'erreurs dans le système de fusion
- correction de crashs liés au marché


---

## [0.11.0] - 2026-03-14

### Added
- Rework complet du système de fusion
- Fusion basée uniquement sur les doublons
- Coût de fusion progressif selon la rareté
- Fusion critique
- Fusion double

### Improved
- équilibrage du système de progression
- meilleure gestion des inventaires


---
