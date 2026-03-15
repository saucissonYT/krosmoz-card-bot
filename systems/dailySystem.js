const generatePack = require("./pack")
const { rewardKamas } = require("./rewards")
const { addXP } = require("./progressionSystem")
const { giveAchievement } = require("./achievementSystem")

const rarityOrder=["C","U","R","SR","HR","UR","S","SSR"]

const rarityXP={
 C:0,U:2,R:5,SR:8,HR:12,UR:20,S:25,SSR:30
}

function openPack(user,setId){

 const result = generatePack(user,setId)

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

 if(!user.stats)
  user.stats={}

 if(user.stats.ssrPulled===undefined)
  user.stats.ssrPulled=0

 if(!user.cards)
  user.cards={}

 /* ---------------- AJOUT CARTES ---------------- */

 for(const card of pack){

  if(!card) continue

  if(!user.cards[card.id])
   discovered.push(card)

  user.cards[card.id]=(user.cards[card.id]||0)+1

  kamasGain+=rewardKamas(user,card.rarity)

  if(card.rarity==="SSR")
   user.stats.ssrPulled++

  /* SHINY SSR ACHIEVEMENT */

  if(card.rarity==="SSR" && card.shiny)
   giveAchievement(user,"shinySSR")

 }

 /* ---------------- ACHIEVEMENTS PACK ---------------- */

 const rarities=pack.map(c=>c.rarity)

 /* PACK DIVIN : UR + SSR */

 if(rarities.includes("SSR") && rarities.includes("UR"))
  giveAchievement(user,"packDivin")

 /* PILE OU FACE : doublons dans le pack */

 const ids=pack.map(c=>c.id)

 const duplicates=ids.filter((v,i,a)=>a.indexOf(v)!==i)

 if(duplicates.length>=2)
  giveAchievement(user,"pileOuFace")

 /* IMPOSSIBLE : lucky pack + 3 SSR */

 const ssrCount=pack.filter(c=>c.rarity==="SSR").length

 if(luckyPack && ssrCount>=3)
  giveAchievement(user,"impossible")

 /* TIME ACHIEVEMENTS */

 const hour=new Date().getHours()

 if(hour>=3 && hour<4)
  giveAchievement(user,"insomniaque")

 if(hour<7)
  giveAchievement(user,"matinal")

 /* ---------------- BEST CARD ---------------- */

 let best = pack.find(c=>c) || null

 if(best){

  for(const card of pack){

   if(!card) continue

   if(rarityOrder.indexOf(card.rarity)>
      rarityOrder.indexOf(best.rarity))
    best=card

  }

 }

 /* ---------------- XP ---------------- */

 let xpGain=20

 const today=new Date().toDateString()
 let dailyBonus=false

 if(user.dailyXP!==today){
  xpGain*=2
  user.dailyXP=today
  dailyBonus=true
 }

 if(best)
  xpGain+=rarityXP[best.rarity] || 0

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

module.exports={
 openPack
}