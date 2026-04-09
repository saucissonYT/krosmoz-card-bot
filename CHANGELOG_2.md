# Changelog

Toutes les modifications importantes de **Krosmoz Card Bot** sont documentées dans ce fichier.

- Added → nouvelles fonctionnalités
- Changed → modifications importantes
- Fixed → corrections de bugs
- Improved → améliorations internes

## [0.38.0] - 2026-04-06

### Updates (2026-04-08 -> 2026-04-09)

### Added

- **Page Quêtes web complète** (`web/public/Play.html`, `web/public/Play.css`, `web/Server.js`)
  - Ajout de l'onglet **Quêtes** dans la navigation Play (entre Craft et Events)
  - Support quêtes perso quotidiennes/hebdomadaires + quêtes de guilde quotidiennes/hebdomadaires
  - Etats d'action harmonisés : **Récupérable**, **Récupérée**, **Complétée**
  - Affichage de date/heure de récupération et labels FR corrigés (accents)

- **Popups globaux de progression de quêtes** (`web/public/js/web-auth.js`, `web/public/Style.css`)
  - Toasts bas-droite sur progression en temps réel et sur complétion
  - Animation de jauge dans le popup
  - Affichage des récompenses gagnées dans le popup
  - Bouton CTA **Récupérer la récompense** vers `/play/quests`

- **Page Events web** (`web/public/Events.html`, `web/Server.js`)
  - Ajout du hub Events (Piñata, Roulette, Event packs) côté web
  - Pop-up live d'activités et ajustements UX (tickets, timers, lisibilité)

- **Page Battlepass web étendue** (`web/public/Battlepass.html`, `web/public/Battlepass.css`, `web/Server.js`)
  - Frise 40 paliers, parcours zig-zag, pipeline visuel de progression
  - Bouton "aller à mon palier actuel"
  - Etats de claim lisibles (récupérable/récupéré) et CTA de récupération

### Changed

- **Refonte visuelle Play** (inventaire, packs, fusion, craft, quêtes, marché, achievements)
  - Fonds dédiés par mode
  - Fusion/craft retravaillés (forge enclume/orbes/orbit, lisibilité, responsive)
  - Ajustements de layout pour éviter les sur-cadres et zones transparentes inutiles

- **UX Quêtes**
  - Priorisation des quêtes non terminées en haut (ordre d'apparition conservé)
  - Cartes de quêtes et blocs de stats nettoyés pour une lecture plus claire
  - Boutons **Récupérer / Récupérée** agrandis

### Fixed

- **Battlepass web claim**: correction des POST pour toujours envoyer `Content-Type: application/json` (`web/public/Battlepass.html`)
- **Railway startup**: stabilisation démarrage via `railway.toml` (`startCommand`, `healthcheckPath`) + bypass redirect HTTPS sur `/health` (`web/Server.js`)
- **Quêtes de guilde**: le bouton **Récupérer** sur une ligne ne claim plus tout le groupe; respect de `questId` côté API (`systems/guildQuestSystem.js`, `web/Server.js`)
- **Commande dev `/resetjoueur`**: suppression réelle du profil en SQLite (pas seulement cache/disque legacy) (`commands/dev/resetjoueur.js`)
- **Quêtes visuelles**: suppression de transparence excessive sur quêtes non récupérées et ajustements de contraste

### Added

- **Migration SQLite** (`systems/database.js` + `systems/migrate.js`)
  - Remplacement du stockage JSON (fichiers individuels par joueur) par une base SQLite via `better-sqlite3`
  - Schema : table `users` (JSON blob + colonnes indexées pour leaderboard), table `market`, table `market_history`, table `meta`
  - WAL mode + 8 MB cache + busy timeout 5s pour la performance
  - Colonnes indexées sur users : kamas, level, total_cards, unique_cards, achievements, packs_opened, ssr_count — leaderboard en 1 requête SQL
  - Prepared statements cachés pour éviter les recompilations
  - `dbLeaderboard(category, limit)` — requête SQL directe, remplace la lecture de tous les fichiers users/
  - Migration automatique au premier boot : lit tous les JSON, insère en SQLite dans une transaction atomique, renomme les JSON en `.migrated` (backup conservé, jamais supprimé)
  - Table `meta` pour tracker l'état de la migration

- **Migration SQLite complète — guildes + battlepass** (`systems/database.js` + `systems/migrate.js`)
  - Table `guilds` : JSON blob + colonnes indexées (name, leader_id, level, xp, member_count, created_at)
  - Table `battlepass_progress` : clé composite (user_id, season_id) + colonnes indexées (current_level, total_xp, has_premium)
  - 14 nouvelles fonctions CRUD : `dbLoadAllGuilds`, `dbSaveGuild`, `dbDeleteGuild`, `dbCountGuilds`, `dbGuildLeaderboard`, `dbFindGuildByName`, `dbLoadBattlePassProgress`, `dbSaveBattlePassProgress`, `dbDeleteBattlePassProgress`, `dbListBattlePassUserIds`, `dbCountBattlePassUsers`, `dbBattlePassLeaderboard`, `dbDeleteAllBattlePassProgress`
  - `dbGlobalStats()` — agrégation SQL (SUM sur colonnes indexées + `json_extract` pour fusions) pour `/api/stats`, remplace la boucle JS sur tous les users
  - Migration guildes : lit `guilds.json` → insère dans SQLite (transaction atomique) → backup en `.migrated`
  - Migration battlepass : lit `battlepass/progress/*.json` → insère dans SQLite → backup dossier en `progress.migrated/`
  - Les deux migrations s'exécutent automatiquement au premier boot, une seule fois (flag `meta`)
  - Résultat : **zéro fichier JSON en lecture/écriture fréquente** — seuls les fichiers de config statiques restent en JSON (cards.json, devs.json, season templates)

- **Nouveau système de logging structuré** (`systems/logger.js`)
  - 5 niveaux de gravité : `debug`, `info`, `warn`, `error`, `fatal`
  - Préfixe système automatique par fichier : `[GUILD]`, `[DATA]`, `[BOOT]`, `[DEV]`, `[INTERACTION]`, etc.
  - Timestamps ISO automatiques sur chaque ligne de log
  - Sérialisation correcte des objets `Error` (message + stack + code)
  - Filtrage par niveau via variable d'environnement `LOG_LEVEL` (défaut: `info`)
  - Écriture fichier optionnelle dans `logs/YYYY-MM-DD.log` via `LOG_TO_FILE=true`
  - `createTimer(label)` pour mesurer la durée des opérations (bootstrap, sauvegarde)

- **Résolution centralisée du basePath** (`systems/paths.js`)
  - Remplace le pattern `/data` vs `./data` dupliqué dans 5+ fichiers
  - Helpers : `getBasePath()`, `getUsersDir()`, `getCardsDir()`, `getCardsImagesDir()`, `getBattlePassDir()`, `getFragmentsDir()`
  - Résolution unique avec cache interne (un seul appel `fs.existsSync`)

- **Écriture atomique et lecture JSON sécurisée** (`systems/fileUtils.js`)
  - `writeAtomic(filePath, data)` — écrit dans `.tmp` puis `rename`, retry ×3, évite la corruption en cas de crash
  - `readJsonSafe(filePath, fallback)` — lecture avec fallback propre si fichier absent, vide ou JSON invalide

- **Wrapper sécurisé pour les collectors Discord** (`systems/collectorHelper.js`)
  - `createSafeCollector(msg, interaction, options)` — encapsule la vérification utilisateur, le try/catch sur le callback, et le nettoyage automatique des composants en fin de collector
  - Logging automatique des erreurs avec contexte (commande, user, customId)

- **Initialisation centralisée de la structure user** (`systems/userDefaults.js`)
  - `ensureUserStructure(user)` — garantit la présence de `cards`, `shinyCards`, `fragments`, `stats`, `pity`, `titles`, `achievements`, `badges`, `cooldowns`, `event`, `kamas`, `level`, `xp` et toutes les sous-stats
  - Appelé une seule fois dans `loadUser()` du `dataManager` au lieu de checks éparpillés dans chaque commande

- **Fonctions de validation d'entrée réutilisables** (`systems/inputValidator.js`)
  - `validateUserId(id)` — ID Discord 16-22 chiffres
  - `validateCardId(id)` — entier positif
  - `validateAmount(amount, options)` — montant avec min/max
  - `validateGuildName(name)` — longueur 2-32, caractères interdits
  - `validateSetId(setId, validSets)` — existence dans la liste
  - `validateRarity(rarity)` — rareté valide C→SSR

- **Handlers globaux d'erreurs non gérées** (`index.js`)
  - `process.on("unhandledRejection")` — capture les promesses rejetées sans catch avec contexte complet
  - `process.on("uncaughtException")` — log fatal + sauvegarde d'urgence + exit propre pour redémarrage Railway

- **Suite de tests unitaires + intégration — 198 tests** (`tests/`)
  - `pack.test.js` — 12 tests : structure du pack, pity SSR/S/UR, hard pity, distribution statistique, edge cases
  - `economy.test.js` — 10 tests : rewardKamas, cohérence des constantes (RARITY_PRICE croissant, SELL_PRICE ≤ RARITY_PRICE, FUSION_COST croissant)
  - `achievement.test.js` — 8 tests : déblocage, anti-doublon, titres, achievements secrets
  - `market.test.js` — 15 tests : addListing, buyCard, removeListing, fragments, prix, getUserListings, getListingType
  - `fragment.test.js` — 12 tests : addFragment, removeFragment, hasAllFragments, getMissing, getDistinct, stats
  - `guild.test.js` — 15 tests : xpRequired, createGuild, joinGuild, leaveGuild, disbandGuild, ranks, addGuildXP, cleanup automatique
  - `inputValidator.test.js` — 17 tests : validateUserId, validateCardId, validateAmount, validateGuildName, validateSetId, validateRarity
  - `userDefaults.test.js` — 10 tests : ensureUserStructure, préservation des données existantes, valeurs par défaut
  - `cardRegistry.test.js` — 10 tests : getCards, getCard, getCardsBySet, getCardsById, resetRegistry
  - `progression.test.js` — 10 tests : addXP, level up, cap 200, cumul, progression.xp non-négatif
  - `battlepass.test.js` — 12 tests : computeLevel, XP curve, endless rewards, monotonie, maxLevel
  - `integration.test.js` — 18 tests E2E : parcours joueur complet (création → pack → market → fragments → guilde → achievements → progression → cohérence finale)
  - `run.js` — runner centralisé qui exécute toutes les suites de tests
  - Script npm `npm test` ajouté dans `package.json`

- **CI/CD GitHub Actions** (`.github/workflows/test.yml`)
  - Workflow automatique à chaque push sur main/master
  - Tests sur Node 18 et Node 20 en parallèle
  - Création automatique du dossier `data/` de test avec JSON minimaux
  - Bloque le déploiement Railway si les tests échouent (via check suites)

- **Résolveur centralisé de bonus** (`systems/bonusResolver.js`)
  - `resolveAllBonuses(userId, user)` — point unique pour calculer tous les bonus (guilde + niveau joueur)
  - Élimine les `require()` dynamiques circulaires entre packEngine, guildBonuses et playerBonuses
  - Retourne 12 bonus agrégés : kamasBonus, luckyPackBonus, xpBonus, shinyBonus, critBonus, doubleBonus, tripleBonus, cooldownReduction, dailyBonusPacks, doubleDailyBonus, shopDiscount, bpXpBonus

- **Piñata du Dieu Ecaflip** (`systems/pinataEvent.js`)
  - Event communautaire automatique : le dieu Ecaflip envoie une piñata dans le salon configuré
  - Les joueurs réagissent avec des emojis pendant **60 secondes** — quantité + variété d'emojis = meilleur palier
  - Score individuel = nombre de réactions + (emojis uniques × 2)
  - 5 paliers de récompenses : 🥉 Bronze → 🥈 Argent → 🥇 Or → 💎 Diamant → 🌈 Krosmique
  - Multiplicateur global ×1 à ×2 selon le nombre de participants (scaling communautaire)
  - Récompenses possibles : kamas, XP joueur, XP guilde, XP battle pass, cartes (C→UR), fragments aléatoires, SSR (2% chance au palier Krosmique uniquement)
  - Scheduler automatique : intervalle aléatoire entre 2h et 6h, première piñata 5-30 min après le boot
  - Canal configurable via `PINATA_CHANNEL_ID` dans `.env` (fallback sur le canal RP)
  - 4 stats trackées : `pinataParticipations`, `pinataReactionsTotal`, `pinataKamasWon`, `pinataSSRWon`
  - **17 achievements dédiés** (`systems/achievements/achievementPinata.js`) — trigger `"pinata"`
    - Participations : 1 / 3 / 10 / 25 / 50
    - SSR gagnées à la piñata : 1 / 3 / 5 / 10 (10 = secret)
    - Réactions cumulées : 1 / 50 / 100 / 500 / 1000 (1000 = secret)
    - Kamas gagnés via piñata : 10k / 50k / 200k (200k = secret)
  - Overrides de récompenses ajoutés dans `achievementRewards.js` (17 entrées)
  - `achievementRegistry.js` mis à jour avec le module `achievementPinata`
  - `userSystem.js` : 4 nouvelles stats dans `STAT_DEFAULTS`
  - `bootstrap.js` : lancement du scheduler dans `clientReady`

- **Rate limiting API** (`systems/rateLimiter.js`)
  - Middleware Express en mémoire, zéro dépendance npm
  - 100 requêtes/min par IP sur toutes les routes `/api/`
  - Headers `X-RateLimit-Limit`, `X-RateLimit-Remaining`, `X-RateLimit-Reset` et `Retry-After`
  - Cleanup automatique toutes les 5 minutes

- **Cache mémoire API avec invalidation** (`systems/apiCache.js`)
  - `getOrCompute(key, computeFn, ttlMs)` — cache synchrone avec TTL
  - `getOrComputeAsync(key, computeFn, ttlMs)` — version async
  - `invalidate(key)` / `invalidatePrefix(prefix)` — invalidation ciblée ou par préfixe
  - Cleanup automatique des entrées expirées toutes les 10 minutes

- **Endpoint `/health`** (`web/Server.js`)
  - Retourne status, uptime, mémoire (RSS + heap), nombre d'utilisateurs, entrées cache, timestamp
  - Accessible sans authentification pour le monitoring Railway

- **Graceful shutdown** (`index.js`)
  - Sur SIGINT/SIGTERM : sauvegarde tous les dirty users + ferme SQLite proprement avant exit
  - Sur uncaughtException : sauvegarde d'urgence + fermeture SQLite avant crash
  - Empêche la perte de données lors des redéploiements Railway

- **Pity affichée sur le profil web** (`web/Server.js` + `web/public/Profile.html`)
  - `computeProfile()` retourne maintenant un tableau `pity[]` avec SSR/S/UR par set
  - Nouvelle section "🎴 Pity par set" sur le profil web avec barres de progression colorées par seuil
  - Grille responsive (auto-fit 280px minimum par set)

- **Bouton "Acheter toutes les non-possédées"** (`commands/joueur/krosmoshop.js`)
  - Nouveau bouton `🛍️ Acheter X non-possédée(s) (Y kamas)` dans le KrosmoShop
  - Achète d'un coup toutes les cartes du shop que le joueur ne possède pas
  - Bouton grisé si toutes les cartes sont possédées ou kamas insuffisants
  - Embed résumé avec liste des cartes achetées, total dépensé et nouveau solde

- **Boutons liens web cliquables** sur les commandes Discord
  - `/listcards` — bouton `🌐 Voir sur le site` (lien vers krosmozcard.fr/cards)
  - `/profil` — 4ème bouton `🌐 Profil web` (lien vers krosmozcard.fr/profile/{id})
  - `/pity` — bouton `🌐 Profil web` dans la navigation + footer mis à jour

- **ESLint + Prettier** (`.eslintrc.json` + `.prettierrc`)
  - ESLint configuré avec règles no-unused-vars, no-undef, eqeqeq, prefer-const
  - Prettier configuré (sans semicolons, tab width 1)
  - Scripts npm `npm run lint` et `npm run format` ajoutés

- **Documentation JSDoc** (`systems/types.js`)
  - Typedefs pour Card, User, Rarity, PityCounters, PackResult, OpenPackResult, Guild, AchievementDef, MarketListing, PlayerBonuses, BattlePassProgress
  - Documentation des exports de chaque module système

- **Utilitaire vente saisonnier partagé** (`systems/sellHelper.js`)
  - `getSeasonSellMultiplier()` — multiplicateur saisonnier avec cache 15s
  - `getSellBonusPercent(multiplier)` — pourcentage de bonus affiché au joueur
  - `computeSellPrice(basePrice, multiplier)` — prix final avec minimum 1
  - Extrait de `sellcard.js` et `sellduplicate.js` (code identique dupliqué dans les deux fichiers)

- **3 nouvelles suites de tests** (`tests/`)
  - `moderation.test.js` — 21 tests : sanctions (création, expiration auto, levée, permanent, cleanup batch), noluck (activation, expiration, retrait), IDs uniques par run
  - `trade.test.js` — 18 tests : échange de cartes (transfert, suppression qty 0), activeUsers (tracking, libération, double-trade), cooldowns (blocage, expiration), auto-trade protection, menu options (qty > 0, limite 25), bot easter egg, cleanup
  - `audit.test.js` — 10 tests : progressBar (0/50/75/100%), buildReport (complet, erreurs, vide), runFullAudit avec client mocké (sections, commandes valides/invalides, callback progression, validation cartes)
  - **Total : 198 tests** (149 précédents + 49 nouveaux)

- **Guide développeur** (`CONTRIBUTING.md`)
  - Structure du projet documentée
  - 8 conventions de code : constantes centralisées, getCards() dynamique, save() ciblé, writeAtomic, logger, paths.js, anti-duplication
  - Guide "Ajouter une stat user" (1 ligne dans STAT_DEFAULTS)
  - Guide "Ajouter un achievement"
  - Guide "Écrire un test"
  - Checklist avant commit

- **Script de headers JSDoc** (`add-achievement-headers.js`)
  - Script utilitaire pour ajouter les JSDoc headers aux modules d'achievements
  - Détection automatique des headers existants (skip si `@module` présent)
  - Remplacement de l'ancien commentaire simple par le header complet

### Changed

- **`systems/dataManager.js`** — réécrit avec backend SQLite
  - `loadUser()` charge depuis SQLite → cache mémoire (même pattern dirty save qu'avant)
  - `saveUser()` écrit du cache mémoire → SQLite avec colonnes indexées mises à jour
  - `loadAll()` initialise SQLite, lance la migration automatique, charge market depuis SQLite
  - `save()` synchronise market vers SQLite, cards et devs restent en JSON
  - Même API publique conservée : `data`, `loadAll`, `save`, `loadUser`, `saveUser`, `USERS_DIR`, `CARDS_IMAGES_DIR`
  - Autosave 30s pour les dirty users (inchangé)

- **`web/Server.js`** — requêtes SQLite pour le web
  - `computeLeaderboard()` remplacé par `dbLeaderboard()` — requête SQL directe au lieu de lire tous les fichiers users/
  - `loadUser()` utilise SQLite via `dbLoadUser()`
  - `computeGlobalStats()` réécrit avec `dbGlobalStats()` — 1 requête SQL au lieu de boucle JS sur tous les users
  - `computeActivityFeed()` lit l'historique depuis SQLite
  - `computeMarket()` lit le market depuis SQLite
  - `getGuildList()` utilise `getAllGuilds()` du cache mémoire guildSystem au lieu de lire `guilds.json`
  - `/health` utilise `dbCountUsers()` au lieu de `fs.readdirSync`
  - `/api/stats` wrappé dans `apiCache` (TTL 60s)
  - Cache mémoire pour `getCards()` / `getSets()` (TTL 60s)
  - Rate limiting + cache + pity profil (inchangé par rapport au commit précédent)

- **`index.js`** — fermeture SQLite au shutdown
  - `closeDb()` appelé dans le graceful shutdown (SIGINT/SIGTERM) et dans le handler uncaughtException

- **`systems/devSystem.js`** — migration vers les nouveaux utilitaires
  - Utilise `paths.js`, `logger.js`, `writeAtomic`, `readJsonSafe`

- **`systems/guildSystem.js`** — backend migré de `guilds.json` vers SQLite
  - `loadGuilds()` charge depuis SQLite via `dbLoadAllGuilds()` (fallback JSON en cas d'erreur)
  - `saveGuilds()` écrit chaque guilde en SQLite via `dbSaveGuild()`
  - `disbandGuild()` appelle `dbDeleteGuild()` pour cohérence SQLite
  - `cleanOrphanedGuildIds()` utilise `dbListUserIds()` au lieu de lire les fichiers JSON
  - Toutes les fonctions originales conservées à l'identique
  - Toutes les constantes exportées conservées (MAX_MEMBERS, CREATE_COST, RENAME_COST, MAX_OFFICERS)

- **`systems/battlePassService.js`** — progression battlepass migrée vers SQLite
  - `getUserProgress()` charge depuis SQLite via `dbLoadBattlePassProgress()` (fallback fichier JSON avec auto-migration)
  - `saveUserProgress()` écrit en SQLite via `dbSaveBattlePassProgress()` au lieu de `writeAtomic()`
  - `getAllProgressUserIds()` utilise `dbListBattlePassUserIds()` au lieu de `fs.readdirSync()`
  - `devStatus()` utilise `dbCountBattlePassUsers()` pour le comptage
  - Toute la logique métier (XP, rewards, achievements, seasons, endless) inchangée

- **`systems/migrate.js`** — migrations v0.38 guildes + battlepass ajoutées
  - `runGuildMigration()` : lit `guilds.json` → insère en SQLite → backup `.migrated`
  - `runBattlePassMigration()` : lit `battlepass/progress/*.json` → insère en SQLite → backup dossier
  - S'exécutent automatiquement au boot après la migration principale (users + market)

- **`app/handlers/interactionCreate.js`** — error boundary renforcé
  - Fonction `safeErrorReply()` isolée pour gérer tous les cas (replied, deferred, expired)
  - Filtrage spécifique des codes Discord 10062 (interaction expirée) et 40060 (déjà répondue)
  - Timer de performance sur chaque commande slash

- **`app/bootstrap.js`** — migration vers le logger
  - Utilise `logger.js` + `createTimer` pour mesurer la durée d'initialisation des systèmes

- **`commands/joueur/carte.js`** — nettoyage des constantes dupliquées
  - Supprimé les constantes locales `rarityEmoji` et `rarityPrice` → utilise `RARITY_EMOJI` et `SELL_PRICE` depuis `systems/constants.js`
  - `save()` → `save(interaction.user.id)` (dirty save ciblé)
  - Ajout de `collector.on("end")` pour désactiver les boutons après 60s

- **`app/handlers/routes/buttonRoutes.js`** — route `krosmoshop_buyall` ajoutée

- **`systems/achievementCheck.js`** — multi-pass jusqu'à stabilisation
  - Relance `checkAchievements()` tant que de nouveaux achievements se débloquent (max 5 passes)
  - Capture les récompenses en cascade (achievement → XP → level-up → nouvel achievement)

- **`package.json`** — ajout `better-sqlite3` en dépendance + scripts `test`, `lint`, `format` + devDependencies `eslint` et `prettier`

- **`systems/userSystem.js`** — refactorisation de `ensureStats()`
  - Le bloc de 60+ lignes `if(s.x === undefined) s.x = 0` est remplacé par un objet `STAT_DEFAULTS` + boucle `for...in` avec détection de type (number/null/array/object/NOW)
  - `ensureKrosmoShop()` refactorisé avec `SHOP_STAT_DEFAULTS` (même pattern)
  - Ajout de stats manquantes : `fragmentsFound`, `fragmentsSold`, `fragmentsCrafted`, `profileViews`, `balanceCheck`, `rouletteSpins`, `rouletteJackpot`, `rouletteKamas`
  - `console.log` dans `migrateAll()` → `log.info` via logger.js
  - JSDoc complet sur toutes les fonctions exportées
  - Pour ajouter une nouvelle stat : **une seule ligne** dans `STAT_DEFAULTS`

- **`systems/moderationSystem.js`** — migration vers les utilitaires centralisés
  - Supprimé le pattern `let BASE = "/data"` dupliqué → `getBasePath()` depuis `paths.js`
  - `loadJSON`/`saveJSON` manuels → `readJsonSafe`/`writeAtomic` depuis `fileUtils.js`
  - `console.error` → `createLogger("MODERATION")` depuis `logger.js`
  - Try/catch robuste sur chaque opération d'écriture
  - JSDoc avec `@typedef SanctionEntry` et `@typedef NoluckEntry`

- **`systems/auditSystem.js`** — lecture dynamique des cartes
  - `data.cards || []` (×3) → `getCards()` depuis `cardRegistry` (dynamique)
  - `console.error` (×4) → `log.error` via logger.js
  - Import de `data` depuis dataManager supprimé (plus nécessaire pour les cartes)
  - JSDoc avec `@typedef AuditResult`

- **`systems/economy.js`** — ajout JSDoc complet sur `rewardKamas()`

- **`commands/joueur/listcards.js`** — migration vers constantes centralisées
  - Supprimé `rarityEmoji` et `rarityOrder` locaux → `RARITY_EMOJI` et `RARITY_ORDER` depuis `constants.js`
  - Poids de tri construit dynamiquement depuis `RARITY_ORDER`
  - Ajout `collector.on("end")` pour désactiver les composants après timeout

- **`commands/joueur/market.js`** — nettoyage complet
  - Supprimé `const cards = getCards()` au top-level (snapshot statique) → `getCards()` dynamique dans chaque fonction
  - Supprimé `const rarityEmoji = {...}` local → `RARITY_EMOJI` depuis `constants.js`
  - JSDoc sur `execute`, `button`, `renderMarket`, `renderFragmentPicker`, `select`, `modal`

- **`commands/joueur/trade.js`** — save ciblé + robustesse
  - 3× `save()` global → `save(trade.from)` + `save(trade.to)` ciblé
  - Nouvelle fonction `cleanupTrade()` pour garantir la libération de `activeUsers` même en cas d'erreur
  - JSDoc complet avec `@typedef TradeData`

- **`commands/joueur/sellcard.js`** — extraction du code dupliqué
  - Supprimé la copie locale de `getSeasonSellMultiplier()` + cache (20 lignes) → `require("../../systems/sellHelper")`

- **`commands/joueur/sellduplicate.js`** — même extraction
  - Supprimé la copie locale identique → `require("../../systems/sellHelper")`

- **`commands/moderation/stats.js`** — lecture dynamique des cartes
  - `const cards = data.cards || []` au top-level → `getCards()` dynamique
  - Ajout compteur shiny et nombre de sets
  - Nombres formatés avec `toLocaleString("fr-FR")`

- **`app/handlers/reactionRoles.js`** — migration vers utilitaires centralisés
  - 10× `console.log/warn/error` → `log.info/warn/error` via `createLogger("REACTION_ROLES")`
  - `fs.readFileSync/writeFileSync` → `readJsonSafe/writeAtomic` depuis `fileUtils.js`
  - JSDoc sur toutes les fonctions

- **`systems/types.js`** — enrichi avec 25 typedefs
  - Ajout : `SellMultiplierCache`, `TradeData`, `AuditResult`, `ValidationResult`, `SeasonState`, `AchievementReward`, `Fragment`, `MarketHistoryEntry`, `NoluckEntry`, `SanctionEntry`
  - Signatures API documentées pour 18 modules (sellHelper, moderationSystem, fragmentService, etc.)

- **14 modules d'achievements** — JSDoc headers ajoutés
  - Chaque module a un header avec : chemin, description, triggers, catégories listées, `@module`, `@see`
  - Fichiers : achievementPacks, achievementRarity, achievementFusion, achievementCollection, achievementEconomy, achievementSocial, achievementSecrets, achievementEvents, achievementSpecial, achievementGift, achievementGuild, achievementFragments, achievementRoulette, achievementLevel

### Fixed

- **Doublons d'achievements** (`systems/userDefaults.js` + `systems/achievementEngine.js`)
  - `userDefaults.js` initialisait `achievements` en `{}` (objet) au lieu de `[]` (tableau) — `Array.includes()` échouait silencieusement → l'achievement se rajoutait à chaque vérification
  - Fix : `achievements` forcé en `[]` via `Array.isArray()` dans userDefaults ET dans achievementEngine
  - Dédoublonnage automatique des achievements existants au début de chaque `checkAchievements()`
  - Double vérification anti-doublon avant chaque `push()`

- **Achievements de progression non détectés immédiatement** (`systems/achievementCheck.js`)
  - Un achievement qui donne de l'XP en récompense pouvait déclencher un nouvel achievement de niveau, mais celui-ci n'était détecté qu'à la prochaine commande
  - Fix : multi-pass (max 5 itérations) pour capturer les cascades

- **`commands/joueur/carte.js`** — `save()` appelé sans userId dans le handler sell et le modal market → surcharge disque inutile. Fix : `save(interaction.user.id)`
- **`commands/joueur/carte.js`** — prix de vente utilisait `rarityPrice` (prix market) au lieu de `SELL_PRICE` (prix vente au bot) → joueurs payés trop cher
- **`commands/joueur/carte.js`** — boutons restaient visuellement actifs après expiration du collector (60s) → ajout de `collector.on("end")`

- **`commands/joueur/trade.js`** — `save()` appelé sans argument (sauvegarde globale de tous les users) à chaque échange → surcharge disque. Fix : `save(trade.from)` + `save(trade.to)` ciblé
- **`commands/joueur/trade.js`** — `activeUsers` non nettoyé en cas d'erreur pendant l'échange → joueurs bloqués. Fix : `cleanupTrade()` garantit la libération dans tous les cas

- **Guildes invisibles sur le site web** (`web/Server.js`)
  - `getGuildList()` lisait l'ancien `guilds.json` via `readJSON()` au lieu du cache mémoire SQLite — le fichier JSON étant vide/périmé après migration, le compteur guildes sur l'index affichait 0, la page `/guild` était vide, et les profils joueurs n'affichaient pas leur guilde
  - Fix : `getGuildList()` appelle `getAllGuilds()` depuis `guildSystem.js` — suppression de `GUILDS_PATH`

- **`member_count` toujours à 1 en base SQLite** (`systems/database.js`)
  - `dbSaveGuild()` utilisait `clone.members.length` mais la propriété s'appelle `memberIds` → `member_count` n'était jamais calculé correctement
  - Fix : `clone.members` → `clone.memberIds`

### Improved

- **Performance leaderboard** — requête SQL indexée au lieu de lire et parser tous les fichiers JSON users/ (de O(n) fichiers à O(1) query)
- **Performance API web** — leaderboard SQL + cache 60s, profils cachés 30s
- **Performance disque** — `save(userId)` ciblé dans trade.js, carte.js, sellcard.js, sellduplicate.js au lieu de `save()` global qui écrivait tous les users en mémoire
- **Sécurité API** — rate limiting 100 req/min par IP avec réponse 429 + Retry-After
- **Stabilité déploiement** — graceful shutdown sauvegarde toutes les données + ferme SQLite proprement avant redémarrage Railway
- **Intégrité des données** — transactions SQLite atomiques, WAL mode pour les écritures concurrentes, migrations avec backup systématique (`.migrated`)
- **Qualité du code** — 198 tests (15 suites dont 1 E2E), CI/CD GitHub Actions, ESLint + Prettier configurés, JSDoc sur tous les modules (14 achievements + systèmes + commandes)
- **Maintenabilité** — 11 utilitaires partagés (+ sellHelper.js), zéro duplication significative, `STAT_DEFAULTS` pour ajouter une stat en 1 ligne, `CONTRIBUTING.md` avec conventions et checklists
- **Cohérence des patterns** — 100% des fichiers utilisent `getCards()` dynamique, `RARITY_EMOJI` depuis constants.js, `save(userId)` ciblé, logger structuré au lieu de console.log
- **Base de données unifiée** — 100% des données fréquentes en SQLite (users, market, guildes, battlepass) — seuls les fichiers de config statiques restent en JSON
- **Robustesse des sauvegardes** — `writeAtomic` pour les JSON de config, SQLite WAL pour users/market/guildes/battlepass
- **Diagnostic en production** — chaque erreur inclut le contexte complet (commande, userId, guildId)
- **Documentation** — `types.js` avec 25 typedefs et 18 signatures d'API, `CONTRIBUTING.md` avec guide complet, JSDoc `@module` sur les 14 modules d'achievements
- **Performance `/api/stats`** — `computeGlobalStats()` réécrit avec `dbGlobalStats()` (une seule requête SQL `SUM` sur colonnes indexées + `json_extract` pour fusions) au lieu de boucler sur tous les users en JS — passe de O(n) à O(1)
- **Cache `/api/stats`** — wrappé dans `apiCache.getOrCompute()` avec TTL 60s
- **Cache `getCards()` / `getSets()`** — données statiques mises en cache mémoire avec TTL 60s, plus de lecture disque (`readJSON` + `fs.readFileSync`) à chaque requête API
- **Nettoyage code mort** — suppression de `USERS_DIR`, `MARKET_PATH`, `MARKET_HISTORY_PATH`, `listUserFiles()`, `dbListUserIds` import (plus utilisés depuis migration SQLite)
- **Sécurité : headers HTTP** — middleware qui pose `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY`, `X-XSS-Protection: 0`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`
- **Sécurité : CSRF** — vérification `Content-Type: application/json` obligatoire sur tous les POST `/api/` — bloque les form submissions cross-origin
- **Sécurité : cookie session `SameSite=Strict`** — plus aucun envoi cross-origin du cookie, même en GET (cookies OAuth restent Lax pour le flow Discord)
- **Sécurité : rate limiter marché** — 20 req/min sur `/api/market/buy`, `sell-card`, `sell-fragment`, `remove` en plus du 100 global
- **Sécurité : prix plafonné** — `MAX_PRICE = 10_000_000` kamas sur sell-card et sell-fragment
- **Sécurité : body limit** — `express.json({ limit: "50kb" })` au lieu de 1mb
- **Sécurité : sessions** — nettoyage périodique des sessions expirées (toutes les 10 min) + cap à 10k sessions max avec éviction des plus anciennes — plus de fuite mémoire
- **Sécurité : Discord API** — `encodeURIComponent(userId)` dans l'URL de `resolveDiscordUser()` pour éviter injection dans le path

---

## [0.37.0] - 2026-03-31

### Added

- **Nouveau set 🧊 Sberg** — 433 cartes
  - Distribution : 157 C, 109 U, 66 R, 37 SR, 28 HR, 18 UR, 11 S, 7 SSR
  - Pyramide de raretés C > U > R > SR > HR > UR > S > SSR respectée
  - Images importées et validées via le script d'import
  - Set ajouté dans `cards/sets.json`
  - Pity indépendant pour Sberg (comme les autres sets)
  - Fragments des 7 SSR Sberg disponibles automatiquement via `/fragments rebuild-index`

### Changed

- **`systems/setUnlockSystem.js`** — ajout de Sberg dans `SET_UNLOCK_CONFIG`
  - Débloqué au **niveau 96** ou à **70% de complétion de Katrepat**
  - Commentaire du fichier mis à jour avec la nouvelle règle
- **`README.md`** — mis à jour intégralement
  - Introduction : 2349 cartes, 7 sets (ajout de Sberg)
  - Tableau des sets : ligne `🧊 Sberg | 433` ajoutée
  - Section `### 🧊 Distribution Sberg` ajoutée après Katrepat
  - Tableau de déblocage : ligne `🧊 Sberg | 96 | Katrepat ≥ 70%` ajoutée
- **`systems/achievements/achievementCollection.js`** — `unique674` mis à jour
  - Description et condition corrigées : `1916` → `2349` cartes uniques (ajout de Sberg)

### Fixed

- **Double-comptage de `packsOpened`** (`systems/packEngine.js`)
  - `user.stats.packsOpened++` était appelé dans `openPack()` À CHAQUE pack individuel, alors que `krosmoz.js` incrémentait déjà `packsOpened += packCount` avant la boucle
  - Résultat : pour 5 packs ouverts, `packsOpened` était incrémenté de 10 au lieu de 5 — tous les achievements "Packs ouverts" (`pack50`, `pack100`…) se débloquaient deux fois trop tôt
  - Fix : suppression du `packsOpened++` dans `packEngine.js` — `krosmoz.js` reste la seule source de vérité pour ce compteur

- **Affichage incorrect du total "Packs ouverts"** (`commands/joueur/mystats.js`)
  - Le total global utilisait `s.packsOpened` (gonflé par le double-comptage) au lieu de `krosmozOpened + eventPacksOpened`
  - Exemple concret : 129 krosmoz + 16 event affichait **274** au lieu de **145**
  - Fix : `totalPacksOpened = krosmozOpened + eventOpened`, calculé une seule fois et réutilisé sur les pages Général, Packs & RNG et Events
  - Le taux SSR réel est également recalculé sur ce total corrigé

- **Succès palindrome déclenché dès la 1ère carte** (`systems/packEngine.js`)
  - `isPalindrome()` retournait `true` pour tout chiffre à 1 digit (1, 2, 3… 9 sont des palindromes), déclenchant le succès "Symétrie Parfaite" immédiatement pour chaque joueur
  - Fix : ajout de `s.length >= 2` dans `isPalindrome()` — premier palindrome atteignable : 11 cartes
  - Cohérent avec `levelPalindrome` dans `achievementLevel.js` qui appliquait déjà cette protection
