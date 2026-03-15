const { getCardsBySet } = require("./cardRegistry")

const rarityRates={
 C:0.55,
 U:0.25,
 R:0.12,
 SR:0.05,
 HR:0.02,
 UR:0.008,
 S:0.0015,
 SSR:0.0005
}

const rarityOrder=["C","U","R","SR","HR","UR","S","SSR"]

function getSSRRate(pity){

 if(pity < 20) return 0.0005
 if(pity < 30) return 0.001
 if(pity < 40) return 0.003
 if(pity < 49) return 0.01

 return 1
}

function rollRarity(pity){

 const ssrRate=getSSRRate(pity)

 if(Math.random() < ssrRate)
  return "SSR"

 const r=Math.random()

 let cumulative=0

 for(const rarity of rarityOrder){

  if(rarity==="SSR")
   continue

  cumulative+=rarityRates[rarity]

  if(r<=cumulative)
   return rarity

 }

 return "C"

}

function randomCard(pool){
 return pool[Math.floor(Math.random()*pool.length)]
}

function generatePack(user,setId){

 const setCards=getCardsBySet(setId)

 if(!setCards || setCards.length===0)
  return {pack:[],luckyPack:false}

 /* ---------- INIT PITY ---------- */

 if(!user.pity)
  user.pity={}

 if(!user.pity[setId])
  user.pity[setId]={UR:0,SSR:0}

 const pity=user.pity[setId]

 const pack=[]

 /* ---------- HARD PITY ---------- */

 let forced=null

 if(pity.SSR>=49)
  forced="SSR"
 else if(pity.UR>=9)
  forced="UR"

 for(let i=0;i<5;i++){

  let rarity

  if(i===4 && forced){
   rarity=forced
  }else{
   rarity=rollRarity(pity.SSR)
  }

  let pool=setCards.filter(c=>c.rarity===rarity)

  if(pool.length===0)
   pool=setCards

  const card=randomCard(pool)

  if(card)
   pack.push(card)

 }

 /* ---------- UPDATE PITY ---------- */

 const best=pack.reduce((a,b)=>
  rarityOrder.indexOf(b.rarity)>
  rarityOrder.indexOf(a.rarity)?b:a
 )

 if(best.rarity==="SSR"){

  pity.SSR=0
  pity.UR=0

 }else if(best.rarity==="UR"){

  pity.UR=0
  pity.SSR++

 }else{

  pity.UR++
  pity.SSR++

 }

 /* ---------- LUCKY PACK ---------- */

 let luckyPack=false

 if(Math.random()<0.10){

  luckyPack=true

  const bonus=randomCard(setCards)

  if(bonus)
   pack.push(bonus)

 }

 return{
  pack,
  luckyPack
 }

}

module.exports=generatePack