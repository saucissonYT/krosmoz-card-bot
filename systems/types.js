/* ═══════════════════════════════════════════════════════════════
   TYPES & JSDOC — systems/types.js

   Fichier de documentation JSDoc pour tous les systèmes.
   Ce fichier ne contient PAS de logique — uniquement des typedefs
   qui servent à l'autocomplétion et à la documentation.

   Usage dans n'importe quel fichier :
     /** @typedef {import("./types").Card} Card */
     /** @typedef {import("./types").User} User */
═══════════════════════════════════════════════════════════════ */

/* ═══ CARTES ═══ */

/**
 * @typedef {Object} Card
 * @property {number}  id       - ID unique de la carte
 * @property {string}  name     - Nom affiché
 * @property {string}  set      - ID du set (incarnam, astrub, etc.)
 * @property {string}  rarity   - Rareté (C, U, R, SR, HR, UR, S, SSR)
 * @property {boolean} [shiny]  - Carte shiny (SSR uniquement)
 * @property {string}  [image]  - Chemin vers l'image
 */

/**
 * @typedef {"C"|"U"|"R"|"SR"|"HR"|"UR"|"S"|"SSR"} Rarity
 */

/* ═══ UTILISATEUR ═══ */

/**
 * @typedef {Object} User
 * @property {Object<number, number>} cards         - Inventaire {cardId: quantité}
 * @property {Object<number, number>} shinyCards     - Cartes shiny
 * @property {number}                 kamas          - Monnaie
 * @property {number}                 level          - Niveau joueur
 * @property {number}                 xp             - XP courante
 * @property {Object}                 pity           - Compteurs pity par set
 * @property {Object}                 stats          - Statistiques globales
 * @property {string[]}              achievements   - IDs des achievements débloqués
 * @property {string[]}              titles         - Titres obtenus
 * @property {string[]}              badges         - Badges obtenus
 * @property {string}                [title]        - Titre actif
 * @property {string}                [guildId]      - ID de la guilde
 * @property {number}                [lastPack]     - Timestamp dernier pack
 * @property {number}                [packs]        - Packs stockés
 * @property {Object}                [progression]  - {level, xp, totalXp}
 * @property {Array}                 [fragments]    - Fragments possédés
 * @property {Object}                [cooldowns]    - Cooldowns actifs
 * @property {boolean}               [_dirty]       - Marqueur dirty save
 */

/* ═══ PITY ═══ */

/**
 * @typedef {Object} PityCounters
 * @property {number} SSR - Compteur SSR (hard pity à 50)
 * @property {number} S   - Compteur S (hard pity à 30)
 * @property {number} UR  - Compteur UR (hard pity à 10)
 */

/* ═══ PACK ═══ */

/**
 * @typedef {Object} PackResult
 * @property {Card[]}   pack       - Cartes obtenues (5-6)
 * @property {boolean}  luckyPack  - Pack chanceux (6e carte)
 */

/**
 * @typedef {Object} OpenPackResult
 * @property {Card[]}      pack        - Cartes obtenues
 * @property {Object|null} fragment    - Fragment obtenu (ou null)
 * @property {boolean}     luckyPack   - Pack chanceux
 * @property {Card[]}      discovered  - Nouvelles cartes découvertes
 * @property {number}      kamasGain   - Kamas gagnés
 * @property {number}      xpGain      - XP gagnée
 * @property {Card|null}   best        - Meilleure carte du pack
 * @property {boolean}     dailyBonus  - Bonus XP premier pack du jour
 */

/* ═══ GUILDE ═══ */

/**
 * @typedef {Object} Guild
 * @property {string}   id        - ID unique
 * @property {string}   name      - Nom de la guilde
 * @property {string}   emoji     - Emoji de la guilde
 * @property {string}   leaderId  - ID du meneur
 * @property {string[]} officers  - IDs des officiers
 * @property {string[]} members   - IDs de tous les membres
 * @property {number}   level     - Niveau (1-100)
 * @property {number}   xp        - XP courante
 * @property {Object}   stats     - Stats collectives
 * @property {Array}    quests    - Quêtes hebdo actives
 */

/* ═══ ACHIEVEMENT ═══ */

/**
 * @typedef {Object} AchievementDef
 * @property {string}   name        - Nom affiché
 * @property {string}   badge       - Emoji badge
 * @property {string}   description - Description
 * @property {string}   [title]     - Titre débloqué
 * @property {string}   trigger     - Trigger (pack, economy, fusion, etc.)
 * @property {boolean}  [secret]    - Achievement caché
 * @property {Function} condition   - (user, checkSetCompletion) => boolean
 */

/* ═══ MARKET ═══ */

/**
 * @typedef {Object} MarketListing
 * @property {number} id        - ID du listing
 * @property {string} seller    - ID Discord du vendeur
 * @property {number} card      - ID de la carte
 * @property {number} price     - Prix en kamas
 * @property {number} timestamp - Timestamp de mise en vente
 * @property {string} [type]    - "card" ou "fragment"
 * @property {number} [fragmentNumber] - Numéro du fragment (1-5)
 */

/* ═══ BONUS ═══ */

/**
 * @typedef {Object} PlayerBonuses
 * @property {number} kamasBonus        - Bonus kamas (%)
 * @property {number} luckyPackBonus    - Chance lucky pack (%)
 * @property {number} xpBonus           - Bonus XP (%)
 * @property {number} shinyBonus        - Bonus shiny (%)
 * @property {number} critBonus         - Bonus fusion crit (%)
 * @property {number} doubleBonus       - Bonus fusion double (%)
 * @property {number} tripleBonus       - Bonus fusion triple (%)
 * @property {number} cooldownReduction - Réduction cooldown (%)
 * @property {number} dailyBonusPacks   - Packs bonus daily
 * @property {number} doubleDailyBonus  - Bonus double daily (%)
 * @property {number} shopDiscount      - Réduction shop (%)
 * @property {number} bpXpBonus         - Bonus XP battle pass (%)
 */

/* ═══ BATTLE PASS ═══ */

/**
 * @typedef {Object} BattlePassProgress
 * @property {string} season        - ID de la saison
 * @property {number} totalXP       - XP totale accumulée
 * @property {number} currentLevel  - Niveau actuel
 * @property {number[]} claimedFree    - Paliers free réclamés
 * @property {number[]} claimedPremium - Paliers premium réclamés
 * @property {string[]} achievementsUnlocked - Achievements BP débloqués
 */

/* ═══ API (exports de chaque module) ═══ */

/*
 * cardRegistry.js :
 *   getCard(id: number) → Card|undefined
 *   getCards() → Card[]
 *   getCardsBySet(setId: string) → Card[]
 *   getCardsById() → Object<string, Card>
 *   resetRegistry() → void
 *
 * userSystem.js :
 *   getUser(id: string) → User
 *   save(id?: string) → void
 *
 * pack.js :
 *   generatePack(user: User, setId: string, options?: Object) → PackResult
 *
 * packEngine.js :
 *   openPack(user: User, setId: string, userId: string, options?: Object) → OpenPackResult
 *   generatePack(user: User) → Card[]
 *   generateGlobalPack(user: User) → Card[]
 *   generateCustomPack(user: User, options: Object) → Card[]
 *
 * economy.js :
 *   rewardKamas(user: User, rarity: Rarity) → number
 *
 * achievementEngine.js :
 *   checkAchievements(user: User, trigger: string|null) → string[]
 *
 * achievementCheck.js :
 *   achievementCheck(user: User, trigger?: string) → string[]
 *
 * bonusResolver.js :
 *   resolveAllBonuses(userId: string, user: User) → PlayerBonuses
 *
 * inputValidator.js :
 *   validateUserId(id: any) → {valid, error?, value?}
 *   validateCardId(id: any) → {valid, error?, value?}
 *   validateAmount(amount: any, options?) → {valid, error?, value?}
 *   validateGuildName(name: any) → {valid, error?, value?}
 *   validateSetId(setId: any, validSets?) → {valid, error?, value?}
 *   validateRarity(rarity: any) → {valid, error?, value?}
 *
 * apiCache.js :
 *   apiCache.getOrCompute(key, computeFn, ttlMs?) → any
 *   apiCache.getOrComputeAsync(key, computeFn, ttlMs?) → Promise<any>
 *   apiCache.invalidate(key) → void
 *   apiCache.invalidatePrefix(prefix) → void
 *   apiCache.clear() → void
 *   apiCache.size() → number
 *
 * rateLimiter.js :
 *   createRateLimiter(options?) → ExpressMiddleware
 *
 * collectorHelper.js :
 *   createSafeCollector(msg, options) → InteractionCollector
 */

module.exports = {}