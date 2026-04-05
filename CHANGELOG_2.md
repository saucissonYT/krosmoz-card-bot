# Changelog

Toutes les modifications importantes de **Krosmoz Card Bot** sont documentées dans ce fichier.

- Added → nouvelles fonctionnalités
- Changed → modifications importantes
- Fixed → corrections de bugs
- Improved → améliorations internes

## [0.38.0] - 2026-04-04

### Added

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
  - `validateCardId(id, cardsById)` — vérifie type, positivité et existence
  - `validatePositiveInteger(value, name)` — entier > 0
  - `validatePrice(price, min, max)` — prix dans une fourchette
  - `validateOwnership(user, cardId)` — vérifie que le joueur possède la carte
  - `validateDiscordId(id)` — format snowflake Discord

- **Handlers globaux d'erreurs non gérées** (`index.js`)
  - `process.on("unhandledRejection")` — capture les promesses rejetées sans catch (channel.send échoué, interaction expirée) avec contexte complet
  - `process.on("uncaughtException")` — log fatal + exit propre pour redémarrage Railway

### Changed

- **`systems/dataManager.js`** — migration vers les nouveaux utilitaires
  - Utilise `paths.js` au lieu du pattern basePath dupliqué
  - Utilise `logger.js` au lieu de `console.log`/`console.error`
  - Utilise `writeAtomic` pour toutes les sauvegardes (users, market, cards, devs)
  - Utilise `ensureUserStructure` au chargement de chaque user dans `loadUser()`
  - Utilise `readJsonSafe` dans `loadFile()` pour plus de robustesse

- **`systems/devSystem.js`** — migration vers les nouveaux utilitaires
  - Utilise `paths.js`, `logger.js`, `writeAtomic`, `readJsonSafe`
  - Supprimé le bloc basePath dupliqué (10 lignes → 1 ligne)

- **`systems/guildSystem.js`** — migration vers les nouveaux utilitaires
  - Utilise `paths.js`, `logger.js`, `writeAtomic`
  - Toutes les fonctions originales conservées à l'identique (createGuild, joinGuild, leaveGuild, kickMember, promoteOfficer, demoteOfficer, transferLeader, renameGuild, getAllGuilds, getGuildRank, devSetLevel, devAddXP, devForceJoin, validateUserGuild)
  - Toutes les constantes exportées conservées (MAX_MEMBERS, CREATE_COST, RENAME_COST, MAX_OFFICERS)

- **`app/handlers/interactionCreate.js`** — logging contextuel des erreurs
  - Utilise `logger.js` avec contexte complet sur chaque erreur : type d'interaction, commande, userId, guildId, channelId
  - Filtre le code 10062 (interaction expirée) dans le catch final pour éviter le bruit
  - Interactions loguées en `debug` au lieu de `info` pour réduire le volume en prod

- **`app/bootstrap.js`** — migration vers le logger
  - Utilise `logger.js` + `createTimer` pour mesurer la durée d'initialisation des systèmes
  - Tous les `console.log`/`console.error`/`console.warn` remplacés

- **`index.js`** — logger + handlers d'erreurs globaux
  - Utilise `logger.js` au lieu de `console.error`
  - Ajout des handlers `unhandledRejection` et `uncaughtException`

- **`commands/joueur/carte.js`** — nettoyage des constantes dupliquées
  - Supprimé les constantes locales `rarityEmoji` et `rarityPrice` → utilise `RARITY_EMOJI` et `SELL_PRICE` depuis `systems/constants.js`
  - `save()` → `save(interaction.user.id)` dans le handler sell et le modal market (dirty save ciblé)
  - Ajout de `collector.on("end")` pour désactiver les boutons après 60s
  - Support shiny conservé (couleur dorée, icône ✨, compteur)

### Improved

- **Maintenabilité** — 6 nouveaux utilitaires partagés réduisent la duplication de code dans l'ensemble du projet
- **Robustesse des sauvegardes** — `writeAtomic` (écriture .tmp + rename) protège contre la corruption de fichiers JSON en cas de crash ou kill du process
- **Diagnostic en production** — chaque erreur inclut désormais le contexte complet (commande, userId, guildId) au lieu d'un simple `console.error("ERREUR:", e)`
- **Performance monitoring** — `createTimer` permet de mesurer les opérations lentes (bootstrap mesuré automatiquement au démarrage)
- **Réduction du bruit de logs** — les interactions sont loguées en `debug`, les erreurs d'interaction expirée (10062) sont filtrées

### Fixed

- **`commands/joueur/carte.js`** — `save()` appelé sans userId dans le handler sell et le modal market → surcharge disque inutile. Fix : `save(interaction.user.id)`
- **`commands/joueur/carte.js`** — prix de vente utilisait `rarityPrice` (prix market) au lieu de `SELL_PRICE` (prix vente au bot) → joueurs payés trop cher à la vente directe
- **`commands/joueur/carte.js`** — boutons restaient visuellement actifs après expiration du collector (60s) → ajout de `collector.on("end")`

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