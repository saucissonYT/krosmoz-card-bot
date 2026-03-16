const generatePack = require("./pack")
const { rewardKamas } = require("./rewards")
const { addXP } = require("./progressionSystem")
const achievements = require("./achievementRegistry")

const rarityOrder=["C","U","R","SR","HR","UR","S","SSR"]

const rarityXP={
 C:0,U:2,R:5,SR:8,HR:12,UR:20,S:25,SSR:30
}

function giveAchievement(user,id){

 if(!achievements[id]) return false

 if(!user.achievements)
  user.achievements=[]

 if(user.achievements.includes(id))
  return false

 user.achievements.push(id)

 if(achievements[id].title)
  user.title = achievements[id].title

 return true
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

 if(!user.stats) user.stats={}
 if(!user.cards) user.cards={}

 if(user.stats.ssrPulled===undefined)
  user.stats.ssrPulled=0

 if(user.stats.packsOpened===undefined)
  user.stats.packsOpened=0

 if(user.stats.shinySSR===undefined)
  user.stats.shinySSR=0

 for(const card of pack){

  if(!card || card.id===undefined) continue

  if(!user.cards[card.id])
   discovered.push(card)

  user.cards[card.id]=(user.cards[card.id]||0)+1

  kamasGain+=rewardKamas(user,card.rarity)

  if(card.rarity==="SSR")
   user.stats.ssrPulled++

  if(card.rarity==="SSR" && card.shiny){
   user.stats.shinySSR++
   giveAchievement(user,"shinySSR")
  }

 }

 const rarities=pack.map(c=>c?.rarity).filter(Boolean)

 if(rarities.includes("SSR") && rarities.includes("UR"))
  giveAchievement(user,"packDivin")

 const ids=pack.map(c=>c?.id).filter(Boolean)

 const seen=new Set()
 let duplicates=0

 for(const id of ids){

  if(seen.has(id))
   duplicates++

  seen.add(id)

 }

 if(duplicates>=2)
  giveAchievement(user,"pileOuFace")

 const ssrCount=pack.filter(c=>c?.rarity==="SSR").length

 if(luckyPack && ssrCount>=3)
  giveAchievement(user,"impossible")

 const hour=new Date().getHours()

 if(hour>=3 && hour<5)
  giveAchievement(user,"nightPlayer")

 let best=null

 for(const card of pack){

  if(!card) continue

  if(!best)
   best=card

  else if(
   rarityOrder.indexOf(card.rarity)>
   rarityOrder.indexOf(best.rarity)
  )
   best=card

 }

 let xpGain=20

 const today=new Date().toDateString()
 let dailyBonus=false

 if(user.dailyXP !== today){

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