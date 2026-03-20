const { generatePack: coreGeneratePack } = require("./pack")
const { getCards } = require("./cardRegistry")
const { rewardKamas } = require("./economy")
const { addXP } = require("./progressionSystem")
const achievements = require("./achievementRegistry")

const rarityOrder=["C","U","R","SR","HR","UR","S","SSR"]

const rarityXP={
 C:0,U:2,R:5,SR:8,HR:12,UR:20,S:25,SSR:30
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

/* ================= OPEN PACK ================= */

function openPack(user,setId){

 const result = coreGeneratePack(user,setId)

 const pack = result?.pack || []
 const luckyPack = result?.luckyPack || false

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

 let discovered=[]
 let kamasGain=0

 if(!user.stats) user.stats={}
 if(!user.cards) user.cards={}

 if(user.stats.ssrPulled===undefined) user.stats.ssrPulled=0
 if(user.stats.packsOpened===undefined) user.stats.packsOpened=0
 if(user.stats.shinySSR===undefined) user.stats.shinySSR=0
 if(user.stats.lastSSR===undefined) user.stats.lastSSR=false
 if(user.stats.ssrStreak===undefined) user.stats.ssrStreak=0

 for(const card of pack){

  if(!card || card.id===undefined) continue

  if(!user.cards[card.id]) discovered.push(card)

  user.cards[card.id]=(user.cards[card.id]||0)+1

  kamasGain+=rewardKamas(user,card.rarity)

  if(card.rarity==="SSR"){
   user.stats.ssrPulled++
   user.stats.ssrStreak++

   if(user.stats.ssrStreak>=2)
    giveAchievement(user,"ssrStreak")

   user.stats.lastSSR=true

   /* FIX: reset dry streak quand on obtient une SSR */
   user.stats.dryStreak=0

  } else {
   user.stats.ssrStreak=0
  }

  if(card.rarity==="SSR" && card.shiny){
   user.stats.shinySSR++
   giveAchievement(user,"shinySSR")
  }
 }

 /* ---- ACHIEVEMENTS PACK ---- */

 const hrCount=pack.filter(c=>c?.rarity==="HR").length
 if(hrCount>=3) giveAchievement(user,"threeStars")

 const rarities=pack.map(c=>c?.rarity).filter(Boolean)
 if(rarities.includes("SSR") && rarities.includes("UR"))
  giveAchievement(user,"packDivin")

 const ids=pack.map(c=>c?.id).filter(Boolean)

 const seen=new Set()
 let duplicates=0

 for(const id of ids){
  if(seen.has(id)) duplicates++
  seen.add(id)
 }

 if(duplicates>=2) giveAchievement(user,"pileOuFace")

 const ssrCount=pack.filter(c=>c?.rarity==="SSR").length

 if(luckyPack && ssrCount>=3) giveAchievement(user,"impossible")

 /*
  * FIX: luckyStart — packsOpened est incrémenté AVANT openPack()
  * dans krosmoz.js, donc au moment de ce check il vaut déjà 1.
  * On check <= 1 au lieu de === 0.
  */
 if(user.stats.packsOpened<=1 && ssrCount>0) giveAchievement(user,"luckyStart")

 if(ssrCount>=3) giveAchievement(user,"hotHand")

 if(user.pity?.[setId]?.SSR>=49 && ssrCount>0)
  giveAchievement(user,"pityBreaker")

 const hour=new Date().getHours()
 if(hour>=3 && hour<5) giveAchievement(user,"nightPlayer")

 /* ---- DETECTION ALL C / ALL U ---- */

 const allC = pack.every(c=>c?.rarity==="C")
 const allU = pack.every(c=>c?.rarity==="U")

 if(allC) user.stats.allCPack = (user.stats.allCPack||0)+1
 if(allU) user.stats.allUPack = (user.stats.allUPack||0)+1

 /* ---- DRY STREAK (packs sans S ni SSR) ---- */

 const hasSOrSSR = rarities.includes("S") || rarities.includes("SSR")

 if(!hasSOrSSR){
  user.stats.dryStreak = (user.stats.dryStreak||0)+1
  if(user.stats.dryStreak > (user.stats.dryStreakMax||0))
   user.stats.dryStreakMax = user.stats.dryStreak
 } else {
  user.stats.dryStreak = 0
 }

 /* ---- PACK A MINUIT ---- */

 const minutes = new Date().getMinutes()
 if(hour===0 && minutes===0)
  user.stats.packAtMidnight = (user.stats.packAtMidnight||0)+1

 /* ---- SSR LUNDI ---- */

 const day = new Date().getDay()
 if(day===1 && ssrCount>0)
  user.stats.ssrOnMonday = (user.stats.ssrOnMonday||0)+1

 /* ---- BEST CARD ---- */

 let best=null

 for(const card of pack){
  if(!card) continue
  if(!best || rarityOrder.indexOf(card.rarity)>rarityOrder.indexOf(best.rarity))
   best=card
 }

 /* ---- XP ---- */

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