const { generatePack: coreGeneratePack } = require("./pack")
const { getCards } = require("./cardRegistry")
const { rewardKamas } = require("./economy")
const { addXP } = require("./progressionSystem")
const achievements = require("./achievementRegistry")

const rarityOrder=["C","U","R","SR","HR","UR","S","SSR"]

const rarityXP={
 C:0,U:2,R:5,SR:8,HR:12,UR:20,S:25,SSR:30
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
  console.error("âŒ NO SET ID FOR USER", user.id)
  return []
 }

 const result = coreGeneratePack(user,setId)

 if(!result || !Array.isArray(result.pack)){
  console.error("âŒ INVALID PACK RESULT", result)
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
  console.error("âŒ EMPTY CUSTOM POOL")
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
 /* Capture pity AVANT le pack pour dÃ©tecter le hard pity */
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

   if(isSimpleCommandOpen && user.stats.ssrStreak>=2)
    giveAchievement(user,"ssrStreak")

   user.stats.lastSSR=true
   user.stats.dryStreak=0
  } else {
   user.stats.ssrStreak=0
  }

  /* Shiny check with bonus */
  if(card.rarity==="SSR" && (card.shiny || Math.random() < shinyRate)){
   user.shinyCards[card.id] = (user.shinyCards[card.id] || 0) + 1
   user.stats.shinySSR++
   giveAchievement(user,"shinySSR")
   card.shiny = true
  }
 }

 /* ---- Kamas bonus (guilde + joueur) ---- */
 if(bonuses.kamasBonus > 0){
  const bonusKamas = Math.floor(kamasGain * bonuses.kamasBonus / 100)
  user.kamas = (user.kamas || 0) + bonusKamas
  kamasGain += bonusKamas
 }

 /* ---- ACHIEVEMENTS PACK ---- */

 const hrCount=pack.filter(c=>c?.rarity==="HR").length
 if(isSimpleCommandOpen && hrCount>=3) giveAchievement(user,"threeStars")

 const rarities=pack.map(c=>c?.rarity).filter(Boolean)
 if(isSimpleCommandOpen && rarities.includes("SSR") && rarities.includes("UR"))
  giveAchievement(user,"packDivin")

 const ids=pack.map(c=>c?.id).filter(Boolean)
 const seen=new Set()
 let duplicates=0
 for(const id of ids){
  if(seen.has(id)) duplicates++
  seen.add(id)
 }
 if(isSimpleCommandOpen && duplicates>=2) giveAchievement(user,"pileOuFace")

 if(isSimpleCommandOpen && luckyPack && ssrCount>=3) giveAchievement(user,"impossible")
 if(isSimpleCommandOpen && user.stats.packsOpened<=1 && ssrCount>0) giveAchievement(user,"luckyStart")
 if(isSimpleCommandOpen && ssrCount>=3) giveAchievement(user,"hotHand")

 if(isSimpleCommandOpen && pitySSRBefore>=48 && ssrCount>0)
  giveAchievement(user,"pityBreaker")

 const hour=new Date().getHours()

 if(hour>=2 && hour<5) giveAchievement(user,"nightPlayer")

 /* ---- DETECTION ALL C / ALL U ---- */
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

 if(hour===0)
  user.stats.packAtMidnight = (user.stats.packAtMidnight||0)+1

 const day = new Date().getDay()
 if(day===1 && ssrCount>0)
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

 /* XP bonus applied in addXP via progressionSystem */
 addXP(user,xpGain)

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

/* ================= EXPORT ================= */

module.exports={
 openPack,
 generatePack,
 generateGlobalPack,
 generateCustomPack
}

