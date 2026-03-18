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

/* ---------- SSR SOFT PITY ---------- */

function getSSRRate(pity){

 if(pity < 20) return 0.0005
 if(pity < 30) return 0.001
 if(pity < 40) return 0.003
 if(pity < 49) return 0.01

 return 0.01
}

/* ---------- S SOFT PITY (NEW) ---------- */

function getSRate(pity){

 if(pity < 15) return 0.0015
 if(pity < 20) return 0.003
 if(pity < 25) return 0.006
 if(pity < 28) return 0.012
 if(pity < 29) return 0.03

 return 0.03
}

/* ---------- ROLL ---------- */

function rollRarity(pitySSR,pityS){

 /* PRIORITÉ : SSR */

 const ssrRate = getSSRRate(pitySSR)

 if(Math.random() < ssrRate)
  return "SSR"

 /* PUIS S */

 const sRate = getSRate(pityS)

 if(Math.random() < sRate)
  return "S"

 /* POOL NORMAL (S retiré) */

 const r=Math.random()

 let cumulative=0

 for(const rarity of rarityOrder){

  if(rarity==="SSR" || rarity==="S") continue

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

 if(!user.pity) user.pity={}

 if(!user.pity[setId]){
  user.pity[setId]={UR:0,S:0,SSR:0}
 }

 const pity=user.pity[setId]

 if(pity.UR === undefined) pity.UR = 0
 if(pity.S === undefined) pity.S = 0
 if(pity.SSR === undefined) pity.SSR = 0

 const pack=[]

 let forced=null

 /* -------- HARD PITY -------- */

 if(pity.SSR>=49)
  forced="SSR"
 else if(pity.S>=29)
  forced="S"
 else if(pity.UR>=9)
  forced="UR"

 for(let i=0;i<5;i++){

  let rarity

  if(i===4 && forced){
   rarity=forced
  }else{
   rarity=rollRarity(pity.SSR,pity.S)
  }

  let pool=setCards.filter(c=>c.rarity===rarity)

  if(pool.length===0)
   pool=setCards

  const card=randomCard(pool)

  if(!card) continue

  if(card.rarity==="SSR" && Math.random()<0.005){

   pack.push({
    ...card,
    shiny:true
   })

  }else{

   pack.push(card)

  }

 }

 if(pack.length===0)
  return {pack:[],luckyPack:false}

 const best=pack.reduce((a,b)=>
  rarityOrder.indexOf(b.rarity)>
  rarityOrder.indexOf(a.rarity)?b:a
 )

 /* -------- RESET PITY -------- */

 if(best.rarity==="SSR"){

  pity.SSR=0
  pity.S=0
  pity.UR=0

 }else if(best.rarity==="UR"){

  pity.UR=0
  pity.S++
  pity.SSR++

 }else if(best.rarity==="S"){

  pity.S=0
  pity.UR++
  pity.SSR++

 }else{

  pity.UR++
  pity.S++
  pity.SSR++

 }

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

module.exports={
 generatePack
}