const { getCardsById } = require("../cardRegistry")

function n(user, key) {
 return Number(user?.stats?.[key] || 0)
}

function mapCount(value) {
 if (!value || typeof value !== "object") return 0
 return Object.keys(value).length
}

function arrCount(value) {
 return Array.isArray(value) ? value.length : 0
}

function hasShopRarities(user, expected) {
 const owned = user?.stats?.shopBoughtRarities || {}
 return expected.every((rarity) => Boolean(owned?.[rarity]))
}

function countNormalShinyPairs(user) {
 const normal = user?.cards || {}
 const shiny = user?.shinyCards || {}
 let count = 0
 for (const id of Object.keys(shiny)) {
  if (Number(shiny[id] || 0) > 0 && Number(normal[id] || 0) > 0) count++
 }
 return count
}

function longestConsecutiveOwnedIds(user) {
 const ids = Object.keys(user?.cards || {})
  .map((id) => Number(id))
  .filter((id) => Number.isFinite(id) && Number(user?.cards?.[id] || 0) > 0)
  .sort((a, b) => a - b)
 if (ids.length <= 0) return 0
 let best = 1
 let current = 1
 for (let i = 1; i < ids.length; i++) {
  if (ids[i] === ids[i - 1] + 1) current++
  else if (ids[i] !== ids[i - 1]) current = 1
  if (current > best) best = current
 }
 return best
}

function hasRainbowSet(user) {
 const byId = getCardsById()
 const wanted = ["C", "U", "R", "SR", "HR", "UR", "S", "SSR"]
 const sets = {}
 for (const cardId of Object.keys(user?.cards || {})) {
  if (Number(user?.cards?.[cardId] || 0) <= 0) continue
  const card = byId[String(cardId)]
  if (!card?.set || !card?.rarity) continue
  if (!sets[card.set]) sets[card.set] = new Set()
  sets[card.set].add(String(card.rarity).toUpperCase())
 }
 return Object.values(sets).some((rarities) => wanted.every((r) => rarities.has(r)))
}

function countSecretUnlocked(user) {
 const unlocked = new Set((user?.achievements || []).map((id) => String(id)))
 if (unlocked.size <= 0) return 0
 try {
  const registry = require("../achievementRegistry")
  let total = 0
  for (const id of unlocked) {
   if (registry?.[id]?.secret) total++
  }
  return total
 } catch (_) {
  return 0
 }
}

function guildDaysFromJoinDate(user) {
 const joinedAt = Number(user?.stats?.guildJoinedAt || 0)
 if (joinedAt <= 0) return 0
 return Math.floor((Date.now() - joinedAt) / 86400000)
}

module.exports = {
 /* 1-10 */
 siteAubeDouze: { name: "Aube des Douze", badge: "🌅", description: "Claim /daily avant 08h 7 fois.", title: "Matinal des Douze", trigger: "daily", condition: (u) => n(u, "dailyMorningClaims") >= 7 },
 siteMinuitChasse: { name: "Minuit de Chasse", badge: "🌙", description: "Claim /daily entre 00h et 01h 7 fois.", title: "Veilleur de Minuit", trigger: "daily", condition: (u) => n(u, "dailyMidnightClaims") >= 7 },
 siteQuinzaineParfaite: { name: "Quinzaine Parfaite", badge: "📆", description: "Atteindre 14 jours de streak daily.", title: "Ritualiste", trigger: "daily", condition: (u) => Math.max(n(u, "maxDailyStreak"), Number(u?.daily?.streak || 0)) >= 14 },
 siteMoisFer: { name: "Mois de Fer", badge: "🛡️", description: "Réaliser 30 daily claims.", title: "Discipliné", trigger: "daily", condition: (u) => n(u, "dailyClaims") >= 30 },
 siteBoucleExpress: { name: "Boucle Express", badge: "⚙️", description: "Daily + pack + vente le même jour, 20 fois.", title: "Cycliste du Krosmoz", trigger: "economy", condition: (u) => n(u, "dailyCycleCount") >= 20 },
 siteRoutineAcier: { name: "Routine d'Acier", badge: "🔩", description: "Faire 5 actions différentes en une journée, 10 fois.", title: "Cadence de Fer", trigger: "social", condition: (u) => n(u, "actionVarietyDays") >= 10 },
 siteConnexionMeteor: { name: "Connexion Meteor", badge: "☄️", description: "Login puis claim /daily en moins de 2 min, 15 fois.", title: "Claim Éclair", trigger: "daily", condition: (u) => n(u, "fastLoginDailyClaims") >= 15 },
 sitePortailFidele: { name: "Portail Fidele", badge: "🌀", description: "Se connecter 100 fois sur le site.", title: "Habitué du Portail", trigger: "social", condition: (u) => n(u, "siteLogins") >= 100 },
 siteRetourHeros: { name: "Retour du Heros", badge: "🧭", description: "Revenir après une longue absence puis claim.", title: "Revenant", trigger: "daily", condition: (u) => n(u, "comebackDailyClaims") >= 1 },
 siteCalendrierVerrouille: { name: "Calendrier Verrouille", badge: "🗓️", description: "Réaliser 60 daily claims.", title: "Calendrier Scellé", trigger: "daily", condition: (u) => n(u, "dailyClaims") >= 60 },

 /* 11-20 (13 exclu) */
 marketComptoirMobile: { name: "Comptoir Mobile", badge: "🧾", description: "Publier 25 annonces sur 10 cartes distinctes.", title: "Annonceur Actif", trigger: "economy", condition: (u) => n(u, "marketListingsCreated") >= 25 && mapCount(u?.stats?.marketListedCardIds) >= 10 },
 marketVenteEclair: { name: "Vente Eclair", badge: "⚡", description: "Réaliser 10 ventes en moins d'une minute.", title: "Scalper", trigger: "economy", condition: (u) => n(u, "marketQuickSales") >= 10 },
 marketReprisePropre: { name: "Reprise Propre", badge: "♻️", description: "Retirer 50 annonces.", title: "Gestionnaire de Vitrine", trigger: "economy", condition: (u) => n(u, "marketListingsRemoved") >= 50 },
 marketTresorier: { name: "Tresorier du Marche", badge: "🏦", description: "Gagner 1 000 000 kamas via le marché.", title: "Comptable du Krosmoz", trigger: "economy", condition: (u) => n(u, "marketKamasEarned") >= 1_000_000 },
 marketBraderie: { name: "Journee de Braderie", badge: "📣", description: "Vendre 20 cartes en une journée.", title: "Crieur Public", trigger: "economy", condition: (u) => n(u, "maxMarketSalesInDay") >= 20 },
 marketDestockeurRoyal: { name: "Destockeur Royal", badge: "📦", description: "Vendre 300 doublons.", title: "Vide-Stock", trigger: "economy", condition: (u) => n(u, "cardsSold") >= 300 },
 marketAcheteurTactique: { name: "Acheteur Tactique", badge: "🛒", description: "Acheter 100 cartes au marché.", title: "Négociateur", trigger: "economy", condition: (u) => n(u, "marketBought") >= 100 },
 marketMainInvisible2: { name: "Main Invisible II", badge: "🕶️", description: "Réaliser 200 transactions (achat + vente).", title: "Courtier Fantôme", trigger: "economy", condition: (u) => (n(u, "cardsSold") + n(u, "marketBought")) >= 200 },
 marketCentTransactions: { name: "Cent Transactions", badge: "💼", description: "Réaliser 100 ventes confirmées.", title: "Professionnel du Trade", trigger: "economy", condition: (u) => n(u, "cardsSold") >= 100 },

 /* 21-30 (25 exclu) */
 shopClientReset: { name: "Client du Reset", badge: "⏱️", description: "Acheter dans les 10 min du reset, 10 fois.", title: "Lève-Tôt du Shop", trigger: "krosmoshop", condition: (u) => n(u, "shopResetSnipes") >= 10 },
 shopPanierIntegral: { name: "Panier Integral", badge: "🧺", description: "Vider un shop journalier complet.", title: "Panier Plein", trigger: "krosmoshop", condition: (u) => n(u, "shopFullClears") >= 1 },
 shopChasseurRemises: { name: "Chasseur de Remises", badge: "🏷️", description: "Acheter 75 cartes avec réduction.", title: "Coupon Master", trigger: "krosmoshop", condition: (u) => n(u, "shopDiscountBuys") >= 75 },
 shopAbonneBoutique: { name: "Abonne Boutique", badge: "🛍️", description: "Acheter au moins 1 fois sur 20 jours distincts.", title: "Abonné Shop", trigger: "krosmoshop", condition: (u) => Number(u?.krosmoshopStats?.daysVisited || 0) >= 20 },
 shopDernierTicket: { name: "Dernier Ticket", badge: "🎫", description: "Terminer le shop du jour 15 fois.", title: "Nettoyeur de Rayon", trigger: "krosmoshop", condition: (u) => n(u, "shopLastTicketBuys") >= 15 },
 shopSpecialisteSSR: { name: "Specialiste Shop SSR", badge: "🌈", description: "Acheter 20 SSR au KrosmoShop.", title: "VIP du Shop", trigger: "krosmoshop", condition: (u) => Number(u?.krosmoshopStats?.ssrBought || 0) >= 20 },
 shopFenetreBoutique: { name: "Fenetre Boutique", badge: "🪟", description: "Ouvrir la boutique 100 fois.", title: "Vitrine Vivante", trigger: "krosmoshop", condition: (u) => n(u, "shopPageViews") >= 100 },
 shopAchatReflexe: { name: "Achat Reflexe", badge: "🏃", description: "Acheter en moins de 5 secondes après ouverture, 15 fois.", title: "Reflexe d'Or", trigger: "krosmoshop", condition: (u) => n(u, "shopFastBuys") >= 15 },
 shopCollectionTotale: { name: "Collection Shop Totale", badge: "🧬", description: "Acheter toutes les raretés du shop.", title: "Collectionneur Boutique", trigger: "krosmoshop", condition: (u) => hasShopRarities(u, ["SR", "HR", "UR", "S", "SSR"]) },

 /* 31-40 */
 guildSerment: { name: "Serment de Guilde", badge: "🤝", description: "Rester en guilde 30 jours.", title: "Compagnon Loyal", trigger: "guild", condition: (u) => Math.max(n(u, "guildDays"), guildDaysFromJoinDate(u)) >= 30 },
 guildPilierXp: { name: "Pilier d'Exp", badge: "🧱", description: "Contribuer 100 000 XP guilde.", title: "Pilier de Compagnie", trigger: "guild", condition: (u) => n(u, "guildXpContributed") >= 100000 },
 guildStrateg: { name: "Stratege de Guilde", badge: "🧠", description: "Valider 50 quêtes de guilde.", title: "Tacticien de Bannière", trigger: "guild", condition: (u) => n(u, "guildQuestsClaimed") >= 50 },
 guildRecruteurActif: { name: "Recruteur Actif", badge: "📨", description: "Faire rejoindre 10 joueurs.", title: "Recruteur Officiel", trigger: "guild", condition: (u) => n(u, "guildInvitesAccepted") >= 10 },
 guildOfficierVigilant: { name: "Officier Vigilant", badge: "👁️", description: "Traiter 20 candidatures.", title: "Gardien des Portes", trigger: "guild", condition: (u) => n(u, "guildApplicationsHandled") >= 20 },
 guildAncreCompagnie: { name: "Ancre de Compagnie", badge: "⚓", description: "Faire progresser une guilde d'au moins 3 niveaux.", title: "Ancre de Guilde", trigger: "guild", condition: (u) => n(u, "guildMaxLevel") >= 4 },
 guildPromotionOfficielle: { name: "Promotion Officielle", badge: "📜", description: "Promouvoir 5 officiers.", title: "Chef d'État-Major", trigger: "guild", condition: (u) => n(u, "guildPromoted") >= 5 },
 guildGestionDifficile: { name: "Gestion Difficile", badge: "🧹", description: "Exclure 3 membres.", title: "Main Ferme", trigger: "guild", condition: (u) => n(u, "guildKicks") >= 3 },
 guildPassation: { name: "Passation Solennelle", badge: "👑", description: "Transférer le lead une fois.", title: "Transmission Sacrée", trigger: "guild", condition: (u) => n(u, "guildTransferred") >= 1 },
 guildNomGrave: { name: "Nom Grave", badge: "✍️", description: "Renommer la guilde 3 fois.", title: "Chroniqueur de Bannière", trigger: "guild", condition: (u) => n(u, "guildRenamed") >= 3 },

 /* 41-50 */
 bpSprintSaison: { name: "Sprint de Saison", badge: "🏁", description: "Gagner 10 niveaux de battle pass.", title: "Sprinteur BP", trigger: "progression", condition: (u) => n(u, "bpLevelsGained") >= 10 },
 bpRatisseur: { name: "Ratisseur de Paliers", badge: "🎚️", description: "Réclamer 100 récompenses BP.", title: "Collecteur de Paliers", trigger: "progression", condition: (u) => n(u, "bpRewardsClaimed") >= 100 },
 bpSansOubli: { name: "Sans Oubli BP", badge: "🧷", description: "Utiliser 'Tout récupérer' 40 fois.", title: "Ramasseur Methodique", trigger: "progression", condition: (u) => n(u, "bpClaimAllUsed") >= 40 },
 bpRecolteGlobale: { name: "Recolte Globale", badge: "🧺", description: "Utiliser 'Tout récupérer' 25 fois.", title: "Moissonneur BP", trigger: "progression", condition: (u) => n(u, "bpClaimAllUsed") >= 25 },
 bpCapstone: { name: "Capstone BP", badge: "🧱", description: "Atteindre le dernier palier d'une saison.", title: "Capstoneur", trigger: "progression", condition: (u) => n(u, "bpHighestLevel") >= 40 },
 bpDoubleBond: { name: "Double Bond", badge: "🔗", description: "Prendre au moins 2 niveaux BP en une action.", title: "Lien Double", trigger: "progression", condition: (u) => n(u, "bpDoubleLevelUps") >= 1 },
 bpHistorien: { name: "Historien de Saison", badge: "📚", description: "Terminer 3 saisons de battle pass.", title: "Archiviste des Saisons", trigger: "progression", condition: (u) => n(u, "bpSeasonsCompleted") >= 3 },
 bpFinaleHeroique: { name: "Finale Heroique", badge: "🗡️", description: "Clore les 5 derniers niveaux d'une saison.", title: "Finisseur Épique", trigger: "progression", condition: (u) => n(u, "bpLastLevelsClosed") >= 5 },
 bpDerniereMarche: { name: "Derniere Marche", badge: "🌇", description: "Claim un reward BP le dernier jour, 5 fois.", title: "Dernière Ligne", trigger: "progression", condition: (u) => n(u, "bpLastDayClaims") >= 5 },
 bpPresencePremium: { name: "Presence Premium", badge: "💎", description: "Claim des récompenses BP sur 30 jours.", title: "Présence Premium", trigger: "progression", condition: (u) => n(u, "bpClaimDayCount") >= 30 },

 /* 51-60 */
 questQueteurEndurant: { name: "Queteur Endurant", badge: "📜", description: "Compléter 300 quêtes.", title: "Routier des Quêtes", trigger: "event", condition: (u) => n(u, "questClaims") >= 300 },
 questCarnetQuotidien: { name: "Carnet Quotidien", badge: "☀️", description: "Terminer les quotidiennes 20 jours.", title: "Journalier Exemplaire", trigger: "event", condition: (u) => n(u, "dailyQuestPerfectDays") >= 20 },
 eventRouletteMarathon: { name: "Roulette Marathon", badge: "??", description: "Jouer 250 fois à la roulette.", title: "Marathonien d'Écaflip", trigger: "roulette", condition: (u) => n(u, "rouletteSpins") >= 250 },
 eventRebondEcaflip: { name: "Rebond d Ecaflip", badge: "😺", description: "Accumuler roulette + jackpot.", title: "Rebond du Destin", trigger: "roulette", condition: (u) => n(u, "rouletteSpins") >= 50 && n(u, "rouletteJackpot") >= 1 },
 eventChasseurPinatas: { name: "Chasseur de Pinatas", badge: "🎉", description: "Participer à 150 piñatas.", title: "Casseur de Fiesta", trigger: "event", condition: (u) => n(u, "pinataParticipations") >= 150 },
 eventGlobeTrotter: { name: "Globe Trotter Event", badge: "🧭", description: "Participer à 40 events.", title: "Voyageur des Dieux", trigger: "event", condition: (u) => n(u, "eventPacksOpened") >= 40 },
 eventVeilleur: { name: "Veilleur d Event", badge: "🕯️", description: "Ouvrir 50 event packs.", title: "Veilleur de Portail", trigger: "event", condition: (u) => n(u, "eventPacksOpened") >= 50 },
 eventTicketSansReste: { name: "Ticket Sans Reste", badge: "🎟️", description: "Épuiser les tickets 50 fois.", title: "Gestionnaire de Tickets", trigger: "event", condition: (u) => n(u, "ticketsFullyUsed") >= 50 },
 eventQuetePropre: { name: "Quete Propre", badge: "🧼", description: "Valider 25 quêtes sans reroll.", title: "Quêteur Propre", trigger: "event", condition: (u) => n(u, "dailyQuestClaims") >= 25 },
 eventRush: { name: "Rush Evenementiel", badge: "🚀", description: "Faire 15 actions event en une journée.", title: "Rush Master", trigger: "event", condition: (u) => n(u, "eventPacksOpened") >= 15 },

 /* 61-70 */
 fusionAlchimisteDoublons: { name: "Alchimiste des Doublons", badge: "⚗️", description: "Réaliser 400 fusions.", title: "Alchimiste Industriel", trigger: "fusion", condition: (u) => n(u, "fusions") >= 400 },
 fusionSansFaille: { name: "Fusion Sans Faille", badge: "🧪", description: "Atteindre 75 fusions de qualité (crit/double/triple).", title: "Précision Arcane", trigger: "fusion", condition: (u) => (n(u, "fusionCrit") + n(u, "fusionDouble") + n(u, "tripleFusion")) >= 75 },
 fusionSerie: { name: "Serie de Fusions", badge: "📈", description: "Atteindre une longue série de fusions.", title: "Cadence Alchimique", trigger: "fusion", condition: (u) => n(u, "fusions") >= 120 },
 fragmentologueSupreme: { name: "Fragmentologue Supreme", badge: "🧩", description: "Collecter 1500 fragments.", title: "Seigneur des Tessons", trigger: "fragment", condition: (u) => Math.max(n(u, "fragmentsCollected"), n(u, "fragmentsFound")) >= 1500 },
 puzzleurDouze: { name: "Puzzleur des Douze", badge: "🧠", description: "Assembler 150 cartes via fragments.", title: "Puzzleur Impérial", trigger: "fragment", condition: (u) => arrCount(u?.stats?.fragmentsCraftedCards) >= 150 },
 reliquaireSSR: { name: "Reliquaire SSR", badge: "💠", description: "Crafter 30 SSR via fragments.", title: "Gardien du Reliquaire", trigger: "fragment", condition: (u) => n(u, "ssrFromFragments") >= 30 },
 atelierCombine: { name: "Atelier Combine", badge: "🛠️", description: "Fusion + craft + vente en volume.", title: "Maître Atelier", trigger: "fusion", condition: (u) => n(u, "fusions") >= 100 && n(u, "fragmentsCrafted") >= 10 && n(u, "cardsSold") >= 100 },
 forgeronPrecis: { name: "Forgeron Precis", badge: "🔨", description: "Réaliser 50 crafts SSR.", title: "Main Précise", trigger: "fragment", condition: (u) => n(u, "fragmentsCrafted") >= 50 },
 laboratoirePermanent: { name: "Laboratoire Permanent", badge: "🧫", description: "Cumuler 700 opérations fusion/craft.", title: "Laborantin en Chef", trigger: "fusion", condition: (u) => (n(u, "fusions") + n(u, "fragmentsCrafted")) >= 700 },
 recyclageIntegral: { name: "Recyclage Integral", badge: "♻️", description: "Recycler/vendre 1500 doublons.", title: "Recycleur Absolu", trigger: "economy", condition: (u) => n(u, "cardsSold") >= 1500 },

 /* 74-75, 79-80 */
 collectionArcRaretes: { name: "Set Arc-en-Raretes", badge: "🌈", description: "Posséder toutes les raretés dans un même set.", title: "Arc Prismatique", trigger: "collection", condition: (u) => hasRainbowSet(u) },
 collectionPoly: { name: "Polycollection", badge: "🗂️", description: "Atteindre 800 cartes uniques.", title: "Polycollectionneur", trigger: "collection", condition: (u) => Object.keys(u?.cards || {}).length >= 800 },
 collectionDuoShiny: { name: "Duo Normal Shiny", badge: "✨", description: "Avoir normal + shiny sur 40 cartes.", title: "Biface Chromatique", trigger: "collection", condition: (u) => countNormalShinyPairs(u) >= 40 },
 collectionLigneContinue: { name: "Ligne Continue", badge: "📏", description: "Posséder 100 IDs de cartes consécutifs.", title: "Géomètre des IDs", trigger: "collection", condition: (u) => longestConsecutiveOwnedIds(u) >= 100 },

 /* 81-90 */
 socialCommerceGuilde: { name: "Commerce de Guilde", badge: "🏰", description: "Faire 50 transactions avec ta guilde.", title: "Intendant de Guilde", trigger: "social", condition: (u) => n(u, "guildMemberTrades") >= 50 },
 socialEchangeEquitable: { name: "Echange Equitable", badge: "⚖️", description: "Valider 50 trades.", title: "Marchand Équitable", trigger: "social", condition: (u) => n(u, "tradeSuccessCount") >= 50 },
 socialCadeauxCascade: { name: "Cadeaux en Cascade", badge: "🎁", description: "Offrir 50 cadeaux à 20 joueurs.", title: "Pluie de Cadeaux", trigger: "gift", condition: (u) => n(u, "giftsGiven") >= 50 && mapCount(u?.stats?.giftRecipients) >= 20 },
 socialRetourCadeaux: { name: "Retour de Cadeaux", badge: "📬", description: "Recevoir 50 cadeaux de 20 joueurs.", title: "Boîte Pleine", trigger: "gift", condition: (u) => n(u, "giftsReceived") >= 50 && mapCount(u?.stats?.giftSenders) >= 20 },
 socialPartenaireSur: { name: "Partenaire Sur", badge: "🤝", description: "Atteindre 200 interactions sociales.", title: "Partenaire Sûr", trigger: "social", condition: (u) => n(u, "socialInteractions") >= 200 },
 socialTitrageIntensif: { name: "Titrage Intensif", badge: "🎖️", description: "Changer de titre 30 fois.", title: "Caméléon de Titre", trigger: "social", condition: (u) => Math.max(n(u, "titleChanges"), n(u, "titleOpen")) >= 30 },
 socialMurBadges: { name: "Mur de Badges", badge: "🧱", description: "Débloquer 25 succès et 10 badges BP.", title: "Mur des Héros", trigger: "social", condition: (u) => arrCount(u?.achievements) >= 25 && arrCount(u?.badges) >= 10 },
 socialIdentiteEvolutive: { name: "Identite Evolutive", badge: "🪞", description: "Changer de titre 50 fois.", title: "Identité Fluide", trigger: "social", condition: (u) => n(u, "titleChanges") >= 50 },
 socialGuideHall: { name: "Guide du Hall", badge: "📘", description: "Consulter l'aide/tutoriel 25 fois.", title: "Guide de Hall", trigger: "social", condition: (u) => n(u, "helpOpen") >= 25 },
 socialProfilVivant: { name: "Profil Vivant", badge: "👤", description: "Consulter 200 profils.", title: "Observateur des Profils", trigger: "social", condition: (u) => n(u, "profileViews") >= 200 },

 /* 91-100 */
 secretMurmure: { name: "Murmure Secret", badge: "🕯️", description: "Débloquer 3 succès secrets.", title: "Murmureur", trigger: "secret", secret: true, condition: (u) => countSecretUnlocked(u) >= 3 },
 secretNuit: { name: "Nuit des Secrets", badge: "🌌", description: "Débloquer une série nocturne secrète.", title: "Nocturne Secret", trigger: "secret", secret: true, condition: (u) => n(u, "dailyMidnightClaims") >= 10 },
 secretClefInterdite: { name: "Clef Interdite", badge: "🗝️", description: "Consulter les succès secrets.", title: "Porteur de Clef", trigger: "secret", secret: true, condition: (u) => Boolean(u?.stats?.viewedSecretAchievements) },
 secretTimingDivin: { name: "Timing Divin", badge: "⏰", description: "Claim le /daily proche du reset 7 fois.", title: "Horloger Divin", trigger: "daily", secret: true, condition: (u) => n(u, "dailyNearResetClaims") >= 7 },
 secretTripleAlignement: { name: "Triple Alignement", badge: "🔺", description: "Daily + roulette + piñata en 2 minutes.", title: "Alignement Total", trigger: "event", secret: true, condition: (u) => n(u, "tripleAlignment") >= 1 },
 secretOmbreComptoir: { name: "Ombre du Comptoir", badge: "🕴️", description: "Réaliser 30 flips marché.", title: "Flipper de l'Ombre", trigger: "economy", secret: true, condition: (u) => n(u, "marketFlips") >= 30 },
 secretDernierJour: { name: "Dernier Jour", badge: "📅", description: "Claim en fin de saison 10 fois.", title: "Dernière Minute", trigger: "progression", secret: true, condition: (u) => n(u, "bpLastDayClaims") >= 10 },
 secretCartelEclair: { name: "Cartel Eclair", badge: "💹", description: "Atteindre un rythme intense de trade.", title: "Cartel Éclair", trigger: "economy", secret: true, condition: (u) => n(u, "marketBought") >= 10 && n(u, "maxMarketSalesInDay") >= 10 },
 secretHerautCache: { name: "Heraut Cache", badge: "🎭", description: "Rester sans titre malgré de nombreux succès.", title: "Héraut Caché", trigger: "secret", secret: true, condition: (u) => arrCount(u?.achievements) >= 120 && String(u?.title || "Nouveau") === "Nouveau" },
 secretEnigmeDouze: { name: "Enigme des Douze", badge: "🧩", description: "Débloquer 12 succès secrets.", title: "Enigme des Douze", trigger: "secret", secret: true, condition: (u) => countSecretUnlocked(u) >= 12 }
}

