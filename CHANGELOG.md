# Changelog

Toutes les modifications importantes de **Krosmoz Card Bot** sont documentées dans ce fichier.

- Added → nouvelles fonctionnalités
- Changed → modifications importantes
- Fixed → corrections de bugs
- Improved → améliorations internes

---

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
- Intégration complète du trigger **"krosmoshop"** dans le système d’achievements
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
- ajout d’un **tip utilisateur** :
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
- Meilleure scalabilité du système d’achievements
- Stabilisation des interactions (select menu, modals, boutons)
- Amélioration de la persistance des données (Railway safe)

### Fixed

- Correction du système **/market**
- bug empêchant la mise en vente via modal
- problème "Utilisateur introuvable"
- problème de state non persisté
- Correction des interactions Discord
- select menu non routé (krosmoshop)
- échec d’interaction après 3s
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
- Krosmo-bot peut **voler une carte lors d’un échange**
- **1% de chance** que Krosmo-bot rende une **SSR aléatoire**
- Nouveau **titre secret** : *Favori du Krosmoz*
- Nouveaux **achievements secrets liés à Krosmo-bot**
- Messages aléatoires lors de l’event Krosmo-bot
- Commande admin **/ecogive** `add` `remove` `set`
- Simulation RNG améliorée dans **/simpack**
- Simulation **multi-joueurs (50 profils)** pour un pity plus réaliste
- Calcul plus précis des statistiques de drops
- Calcul économique plus réaliste dans les simulations
- Affichage détaillé des statistiques dans **/stats**


### Changed

- Amélioration de la commande **/daily**
- affichage du **streak visuel**
- ajout d’**XP progressive**
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
- Sécurisation des **menus pour éviter l’utilisation par un autre joueur**
- Amélioration des outils **dev pour le debug RNG**
- Amélioration des outils **dev pour tester l’économie**
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
