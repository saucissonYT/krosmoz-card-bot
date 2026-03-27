const { generatePack: coreGeneratePack } = require("./pack")
const { getCards } = require("./cardRegistry")
const { rewardKamas } = require("./economy")
const { addXP } = require("./progressionSystem")
const achievements = require("./achievementRegistry")

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
  const { getPlayerBonuses } = require("./playerBonuses")
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
  console.error("❌ NO SET ID FOR USER", user.id)
  return []
 }

 const result = coreGeneratePack(user,setId)

 if(!result || !Array.isArray(result.pack)){
  console.error("❌ INVALID PACK RESULT", result)
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
  console.error("❌ EMPTY CUSTOM POOL")
  return []
 }
 return Array.from({length:size},()=>pool[Math.floor(Math.random()*pool.length)])
}

/* ================= ACHIEVEMENTS ================= */

function giveAchievement(user,id){

 if(!achievements[id]) return false
 if(!user.achievements) user.achievements=[]
 if(user.achievements.includes(id)) return false

 user.achievements.push(id)

 if(achievements[id].title){
  if(!user.titles) user.titles=["Nouveau"]
  if(!user.titles.includes(achievements[id].title))
   user.titles.push(achievements[id].title)
 }

 return true
}

/* ================= PALINDROME ================= */

function isPalindrome(n){
 const s = String(n)
 return s === s.split("").reverse().join("")
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

 const pack = result?.pack || []
 let luckyPack = result?.luckyPack || false

 if(!Array.isArray(pack) || pack.length === 0){
  console.error("Pack vide ou invalide :", setId)
  return {
   pack:[],
   luckyPack:false,
   discovered:[],
   kamasGain:0,
   xpGain:0,
   best:null,
   dailyBonus:false
  }
 }

 /* ---- Lucky pack bonus (guilde + joueur) ---- */
 if(!luckyPack && bonuses.luckyPackBonus > 0){
  const extraChance = bonuses.luckyPackBonus / 100
  if(Math.random() < extraChance){
   luckyPack = true
   const { getCardsBySet } = require("./cardRegistry")
   const setCards = getCardsBySet(setId)
   if(setCards.length > 0){
    pack.push(setCards[Math.floor(Math.random() * setCards.length)])
   }
  }
 }

 let discovered=[]
 let kamasGain=0

 if(!user.stats) user.stats={}
 if(!user.cards) user.cards={}

 if(user.stats.ssrPulled===undefined) user.stats.ssrPulled=0
 if(user.stats.packsOpened===undefined) user.stats.packsOpened=0
 if(user.stats.shinySSR===undefined) user.stats.shinySSR=0
 if(user.stats.lastSSR===undefined) user.stats.lastSSR=false
 if(user.stats.ssrStreak===undefined) user.stats.ssrStreak=0

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

  } else {
   user.stats.ssrStreak=0
  }

 }

 /* ---- Stats pack ---- */
 user.stats.packsOpened++

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

 /* ---- BEST CARD ---- */
 let best=null
 for(const card of pack){
  if(!card) continue
  if(!best || rarityOrder.indexOf(card.rarity)>rarityOrder.indexOf(best.rarity))
   best=card
 }

 /* ---- XP (with bonus) ---- */
 let xpGain=20

 const today=new Date().toDateString()
 let dailyBonus=false

 if(user.dailyXP !== today){
  xpGain*=2
  user.dailyXP=today
  dailyBonus=true
 }

 if(best) xpGain+=rarityXP[best.rarity] || 0

 addXP(user,xpGain)

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
