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

function rollRarity(){

 const r=Math.random()

 let cumulative=0

 for(const rarity of rarityOrder){

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

 const pack=[]

 for(let i=0;i<5;i++){

  const rarity=rollRarity()

  let pool=setCards.filter(c=>c.rarity===rarity)

  /* si aucune carte de cette rareté */

  if(pool.length===0)
   pool=setCards

  const card=randomCard(pool)

  if(card)
   pack.push(card)

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

module.exports=generatePack