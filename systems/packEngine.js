const generatePack = require("./pack")
const { rewardKamas } = require("./rewards")
const { addXP } = require("./progressionSystem")

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

 for(const card of pack){

  if(!card) continue

  if(!user.cards[card.id])
   discovered.push(card)

  user.cards[card.id]=(user.cards[card.id]||0)+1

  kamasGain+=rewardKamas(user,card.rarity)

 }

 let best = pack.find(c=>c) || null

 if(best){

  for(const card of pack){

   if(!card) continue

   if(rarityOrder.indexOf(card.rarity)>
      rarityOrder.indexOf(best.rarity))
    best=card

  }

 }

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