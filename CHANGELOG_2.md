# Changelog

Toutes les modifications importantes de **Krosmoz Card Bot** sont documentées dans ce fichier.

- Added → nouvelles fonctionnalités
- Changed → modifications importantes
- Fixed → corrections de bugs
- Improved → améliorations internes

## [0.38.0] - 2026-04-05

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

- **Suite de tests unitaires** (`tests/`)
  - `pack.test.js` — 12 tests couvrant la structure du pack, le pity SSR/S/UR, le hard pity, la distribution statistique et les edge cases
  - `economy.test.js` — 12 tests couvrant rewardKamas, cohérence des constantes (RARITY_PRICE croissant, SELL_PRICE ≤ RARITY_PRICE, FUSION_COST croissant)
  - `achievement.test.js` — 9 tests couvrant le déblocage, l'anti-doublon, les titres, les achievements secrets
  - `run.js` — runner centralisé qui exécute toutes les suites de tests
  - Script npm `npm test` ajouté dans `package.json`

- **Résolveur centralisé de bonus** (`systems/bonusResolver.js`)
  - `resolveAllBonuses(userId, user)` — point unique pour calculer tous les bonus (guilde + niveau joueur)
  - Élimine les `require()` dynamiques circulaires entre packEngine, guildBonuses et playerBonuses
  - Retourne 12 bonus agrégés : kamasBonus, luckyPackBonus, xpBonus, shinyBonus, critBonus, doubleBonus, tripleBonus, cooldownReduction, dailyBonusPacks, doubleDailyBonus, shopDiscount, bpXpBonus

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
  - `loadUser()` et `listUserFiles()` utilisent SQLite
  - `computeGlobalStats()` utilise `dbListUserIds()` + `loadUser()` SQLite
  - `computeActivityFeed()` lit l'historique depuis SQLite
  - `computeMarket()` lit le market depuis SQLite
  - `/health` utilise `dbCountUsers()` au lieu de `fs.readdirSync`
  - Rate limiting + cache + pity profil (inchangé par rapport au commit précédent)

- **`index.js`** — fermeture SQLite au shutdown
  - `closeDb()` appelé dans le graceful shutdown (SIGINT/SIGTERM) et dans le handler uncaughtException

- **`systems/devSystem.js`** — migration vers les nouveaux utilitaires
  - Utilise `paths.js`, `logger.js`, `writeAtomic`, `readJsonSafe`

- **`systems/guildSystem.js`** — migration vers les nouveaux utilitaires
  - Utilise `paths.js`, `logger.js`, `writeAtomic`
  - Toutes les fonctions originales conservées à l'identique
  - Toutes les constantes exportées conservées (MAX_MEMBERS, CREATE_COST, RENAME_COST, MAX_OFFICERS)

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

### Improved

- **Performance leaderboard** — requête SQL indexée au lieu de lire et parser tous les fichiers JSON users/ (de O(n) fichiers à O(1) query)
- **Performance API web** — leaderboard SQL + cache 60s, profils cachés 30s
- **Sécurité API** — rate limiting 100 req/min par IP avec réponse 429 + Retry-After
- **Stabilité déploiement** — graceful shutdown sauvegarde toutes les données + ferme SQLite proprement avant redémarrage Railway
- **Intégrité des données** — transactions SQLite atomiques, WAL mode pour les écritures concurrentes
- **Qualité du code** — 33 tests unitaires, ESLint + Prettier configurés, JSDoc sur tous les systèmes
- **Maintenabilité** — 10 nouveaux utilitaires partagés réduisent la duplication de code
- **Robustesse des sauvegardes** — `writeAtomic` pour les JSON restants, SQLite WAL pour les users/market
- **Diagnostic en production** — chaque erreur inclut le contexte complet (commande, userId, guildId)

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