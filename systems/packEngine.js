const { generatePack: coreGeneratePack } = require("./pack")
const { getCards, getCardsBySet } = require("./cardRegistry")
const { rewardKamas } = require("./economy")
const { addXP } = require("./progressionSystem")
const { recordAction } = require("./achievementProgressTracker")

const rarityOrder=["C","U","R","SR","HR","UR","S","SSR"]

const rarityXP={
 C:0,U:2,R:5,SR:8,HR:12,UR:20,S:25,SSR:30
}

/* XP de guilde gagnée par carte selon sa rareté (très réduit) */
const GUILD_XP_PER_RARITY={
 C:1, U:1, R:3, SR:3, HR:4, UR:6, S:7, SSR:8
}

function getParisTimeParts(date = new Date()){
 const parts = new Intl.DateTimeFormat("fr-FR", {
  timeZone: "Europe/Paris",
  hour: "2-digit",
  minute: "2-digit",
  weekday: "short",
  hourCycle: "h23"
 }).formatToParts(date)

 const map = Object.fromEntries(parts.map((part) => [part.type, part.value]))
 return {
  hour: Number(map.hour || 0),
  minute: Number(map.minute || 0),
  weekday: String(map.weekday || "").toLowerCase()
 }
}

/* ================= BONUS HELPERS ================= */

function getBonuses(userId, user){
 let guildBonus = { kamasBonus:0, luckyPackBonus:0, xpBonus:0 }
 let playerBonus = { kamasBonus:0, luckyPackBonus:0, xpBonus:0, shinyBonus:0 }

 try{
  const { getUserGuildBonuses } = require("./guildBonuses")
  guildBonus = getUserGuildBonuses(userId)
 }catch(e){}

 try{
  const { getPlayerBonuses } = require("./playerbonuses")
  playerBonus = getPlayerBonuses(user.progression?.level || 1)
 }catch(e){}

 return {
  kamasBonus: (guildBonus.kamasBonus || 0) + (playerBonus.kamasBonus || 0),
  luckyPackBonus: (guildBonus.luckyPackBonus || 0) + (playerBonus.luckyPackBonus || 0),
  xpBonus: (guildBonus.xpBonus || 0) + (playerBonus.xpBonus || 0),
  shinyBonus: playerBonus.shinyBonus || 0
 }
}

/* ================= CORE WRAPPER ================= */

function generatePack(user){

 let setId = user.lastSet

 if(!setId && user.pity){
  const keys = Object.keys(user.pity)
  if(keys.length) setId = keys[0]
 }

 if(!setId){
  console.error("? NO SET ID FOR USER", user.id)
  return []
 }

 const result = coreGeneratePack(user,setId)

 if(!result || !Array.isArray(result.pack)){
  console.error("? INVALID PACK RESULT", result)
  return []
 }

 return result.pack
}

/* ================= GLOBAL / CUSTOM ================= */

function generateGlobalPack(size=5){
 const cards = getCards()
 if(!cards.length) return []
 return Array.from({length:size},()=>cards[Math.floor(Math.random()*cards.length)])
}

function generateCustomPack(pool,size=5){
 if(!pool || !pool.length){
  console.error("? EMPTY CUSTOM POOL")
  return []
 }
 return Array.from({length:size},()=>pool[Math.floor(Math.random()*pool.length)])
}

/* ================= PALINDROME ================= */

/*
 * FIX : les chiffres à 1 digit (1–9) sont mathématiquement des palindromes
 * ("5" retourné = "5"), ce qui déclenchait le succès dès les premières cartes.
 * On exige au moins 2 digits — premier palindrome atteignable : 11 cartes.
 * Cohérent avec levelPalindrome dans achievementLevel.js.
 */
function isPalindrome(n){
 const s = String(n)
 return s.length >= 2 && s === s.split("").reverse().join("")
}

/* ================= NOLUCK HELPER ================= */

/**
 * Remplace toutes les cartes du pack par des cartes C (blanches).
 * Appelé si le joueur est sous malchance.
 * On garde la même taille de pack et le même set.
 */
function applyNoLuck(pack, setId){
 try{
  const setCards = getCardsBySet(setId)
  const cPool = setCards.filter(c => c.rarity === "C")
  const pool  = cPool.length > 0 ? cPool : setCards

  return pack.map(() => {
   const card = pool[Math.floor(Math.random() * pool.length)]
   return card ? { ...card } : pack[0]
  })
 }catch(err){
  console.error("[NO_LUCK] Erreur applyNoLuck :", err)
  return pack
 }
}

/* ================= OPEN PACK ================= */

function openPack(user, setId, userId, options = {}){

 const isSimpleCommandOpen = options.isSimpleCommandOpen !== false
 const pityKey = options.pityKey || setId
 /* Capture pity AVANT le pack pour détecter le hard pity */
 const pitySSRBefore = user.pity?.[pityKey]?.SSR ?? 0

 /* ---- Charger les bonus ---- */
 const bonuses = getBonuses(userId || "", user)

 const result = coreGeneratePack(user, setId, { pityKey })

 let pack = result?.pack || []
 let luckyPack = result?.luckyPack || false
 let fragment = null

 if(!Array.isArray(pack) || pack.length === 0){
  console.error("Pack vide ou invalide :", setId)
  return {
   pack:[],
   fragment:null,
   luckyPack:false,
   discovered:[],
   kamasGain:0,
   xpGain:0,
   best:null,
   dailyBonus:false
  }
 }

 /* ---- MALCHANCE : remplace toutes les cartes par des C ---- */
 if(userId){
  try{
   const { hasNoLuck } = require("./moderationSystem")
   if(hasNoLuck(userId)){
    pack     = applyNoLuck(pack, setId)
    luckyPack = false
   }
  }catch(err){
   console.error("[NO_LUCK] Erreur vérification malchance :", err)
  }
 }

 /* ---- Lucky pack bonus (guilde + joueur) ---- */
 if(!luckyPack && bonuses.luckyPackBonus > 0){
  const extraChance = bonuses.luckyPackBonus / 100
  if(Math.random() < extraChance){
   luckyPack = true
   const setCards = getCardsBySet(setId)
   if(setCards.length > 0){
    pack.push(setCards[Math.floor(Math.random() * setCards.length)])
   }
  }
 }

 const discovered=[]
 let kamasGain=0

 if(!user.stats) user.stats={}
 if(!user.cards) user.cards={}

 if(user.stats.ssrPulled===undefined)   user.stats.ssrPulled=0
 /*
  * FIX : packsOpened n'est plus incrémenté ici.
  * Il est incrémenté par l'appelant (krosmoz.js, eventpack.js…)
  * avant la boucle d'ouverture, ce qui évitait un double-comptage :
  *   - krosmoz.js  : packsOpened += packCount  (avant la boucle)
  *   - packEngine  : packsOpened++              (× packCount dans la boucle)
  *   = 2 × packCount au lieu de packCount
  */
 if(user.stats.packsOpened===undefined)  user.stats.packsOpened=0
 if(user.stats.shinySSR===undefined)     user.stats.shinySSR=0
 if(user.stats.lastSSR===undefined)      user.stats.lastSSR=false
 if(user.stats.ssrStreak===undefined)    user.stats.ssrStreak=0

 if(!user.shinyCards) user.shinyCards={}

 let ssrCount=0
 /* ---- Shiny chance bonus ---- */
 const baseShinyRate = 0.005
 const shinyRate = baseShinyRate + (bonuses.shinyBonus / 100)

 for(const card of pack){

  if(!card || card.id===undefined) continue

  if(!user.cards[card.id]) discovered.push(card)

  user.cards[card.id]=(user.cards[card.id]||0)+1

  kamasGain+=rewardKamas(user,card.rarity)

  if(card.rarity==="SSR"){
   user.stats.ssrPulled++
   user.stats.ssrStreak++
   ssrCount++

   if(isShinySsr(card,shinyRate)){
    user.stats.shinySSR++
    if(!user.shinyCards[card.id]) user.shinyCards[card.id]=0
    user.shinyCards[card.id]++
    card.shiny=true
   }

  } else if(card.rarity==="S"){
   user.stats.ssrStreak=0
  } else {
   user.stats.ssrStreak=0
  }

 }

 /* ---- Stats pack ---- */
 /*
  * NE PAS incrémenter packsOpened ici — géré par l'appelant.
  * On conserve uniquement les stats propres à chaque pack individuel.
  */

 const parisNow = getParisTimeParts()
 const rarities = pack.map(c=>c?.rarity).filter(Boolean)

 const allC = pack.every(c=>c?.rarity==="C")
 const allU = pack.every(c=>c?.rarity==="U")
 if(isSimpleCommandOpen && pack.length===5 && allC) user.stats.allCPack = (user.stats.allCPack||0)+1
 if(isSimpleCommandOpen && pack.length===5 && allU) user.stats.allUPack = (user.stats.allUPack||0)+1

 /* ---- DRY STREAK ---- */
 const hasSOrSSR = rarities.includes("S") || rarities.includes("SSR")
 if(!hasSOrSSR){
  user.stats.dryStreak = (user.stats.dryStreak||0)+1
  if(user.stats.dryStreak > (user.stats.dryStreakMax||0))
   user.stats.dryStreakMax = user.stats.dryStreak
 } else {
  user.stats.dryStreak = 0
 }

 if(parisNow.hour === 0 && parisNow.minute === 0)
  user.stats.packAtMidnight = (user.stats.packAtMidnight||0)+1

 if(parisNow.weekday.startsWith("lun") && ssrCount>0)
  user.stats.ssrOnMonday = (user.stats.ssrOnMonday||0)+1

 if(ssrCount>0 && pitySSRBefore>=49)
  user.stats.hardPityReached = (user.stats.hardPityReached||0)+1

 const totalCards = Object.values(user.cards||{}).reduce((a,b)=>a+b,0)
 if(totalCards>0 && isPalindrome(totalCards))
  user.stats.palindromeReached = (user.stats.palindromeReached||0)+1

 if(userId){
  try{
   const { rollFragmentForSet, grantRolledFragment } = require("./fragmentService")
   const rolledFragment = rollFragmentForSet(setId, options.fragmentDropRate ?? 0.22)

   if(rolledFragment){
    grantRolledFragment(userId, rolledFragment, "pack")
    fragment = rolledFragment
   }
  }catch(error){
   console.error("Fragment roll error:", error)
  }
 }

 /* ---- BEST CARD ---- */
 let best=null
 for(const card of pack){
  if(!card) continue
  if(!best || rarityOrder.indexOf(card.rarity)>rarityOrder.indexOf(best.rarity))
   best=card
 }

 /* ---- XP (with bonus) ---- */
 let xpGain=20

 /* ---- ACTIVITY LOG : drops S et SSR ---- */
 if(userId){
  try{
   const { pushActivity } = require("../web/Server")
   for(const card of pack){
    if(!card) continue
    if(card.rarity === "SSR"){
     pushActivity({ kind: "drop_ssr", userId, cardName: card.name, shiny: !!card.shiny })
    } else if(card.rarity === "S"){
     pushActivity({ kind: "drop_s", userId, cardName: card.name })
    }
   }
  }catch(_){}
 }

 const today=new Date().toDateString()
 let dailyBonus=false

 if(user.dailyXP !== today){
  xpGain*=2
  user.dailyXP=today
  dailyBonus=true
 }

 if(best) xpGain+=rarityXP[best.rarity] || 0

 addXP(user,xpGain)
 recordAction(user, "pack", Date.now())

 /* ---- XP GUILDE via pack (très réduit : C=1, R=3, UR=6, SSR=8) ---- */
 if(userId){
  try{
   const { getUserGuild, addGuildXP, saveGuilds } = require("./guildSystem")
   const guild = getUserGuild(userId)
   if(guild){
    let guildXpGain = 0
    for(const card of pack){
     if(card && GUILD_XP_PER_RARITY[card.rarity])
      guildXpGain += GUILD_XP_PER_RARITY[card.rarity]
    }
    if(guildXpGain > 0){
     addGuildXP(guild.id, guildXpGain)
     saveGuilds()
     user.stats.guildXpContributed = (user.stats.guildXpContributed || 0) + guildXpGain
    }
   }
  }catch(e){ /* guild non dispo */ }
 }

 return{
  pack,
  fragment,
  luckyPack,
  discovered,
  kamasGain,
  xpGain,
  best,
  dailyBonus
 }
}

/* ---- Helper shiny SSR ---- */
function isShinySsr(card, rate){
 return card.rarity==="SSR" && Math.random() < rate
}

/* ================= EXPORT ================= */

module.exports={
 openPack,
 generatePack,
 generateGlobalPack,
 generateCustomPack
}
