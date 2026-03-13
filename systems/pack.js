const cardsData = require("../cards/cards.json")

const cards = Array.isArray(cardsData) ? cardsData : cardsData.cards

const { giveAchievement } = require("./achievementSystem")

const cardsBySet = {}

for(const card of cards){

 if(!cardsBySet[card.set])
  cardsBySet[card.set] = []

 cardsBySet[card.set].push(card)

}

const BASE_RATES = {
 C:0.50,
 U:0.25,
 R:0.13,
 SR:0.06,
 HR:0.03,
 UR:0.008,
 S:0.004,
 SSR:0.004
}

function rollRarity(rates){

 const roll = Math.random()

 let cumulative = 0

 for(const rarity of Object.keys(rates)){

  cumulative += rates[rarity]

  if(roll <= cumulative)
   return rarity

 }

 return "C"

}

function getRandomCard(setId,rarity){

 const setCards = cardsBySet[setId] || []

 const pool = setCards.filter(c => c.rarity === rarity)

 if(!pool.length){

  if(setCards.length === 0) return null

  return setCards[Math.floor(Math.random()*setCards.length)]

 }

 return pool[Math.floor(Math.random()*pool.length)]

}

function applySoftPity(rates,pity){

 const modified={...rates}

 if(pity.SSR >= 30)
  modified.SSR += 0.01

 if(pity.SSR >= 40)
  modified.SSR += 0.02

 if(pity.UR >= 7)
  modified.UR += 0.01

 if(pity.UR >= 9)
  modified.UR += 0.03

 return modified

}

function generatePack(user,setId,size=5){

 const pack=[]

 let luckyPack=false

 if(Math.random() < 0.02){

  size++
  luckyPack=true

 }

 if(!user.pity) user.pity={}
 if(!user.pity[setId]) user.pity[setId]={SSR:0,UR:0}

 const pity=user.pity[setId]

 let ssrCount = 0

 for(let i=0;i<size;i++){

  let rarity

  if(i === size-1){

   if(pity.SSR >= 49){

    rarity="SSR"
    pity.SSR = 0

   }

   else if(pity.UR >= 9){

    rarity="UR"
    pity.UR = 0

   }

   else{

    const rates = applySoftPity(BASE_RATES,pity)

    rarity = rollRarity(rates)

    if(rarity === "SSR") pity.SSR = 0
    else pity.SSR++

    if(rarity === "UR") pity.UR = 0
    else pity.UR++

   }

  }

  else{

   rarity = rollRarity(BASE_RATES)

  }

  const card = getRandomCard(setId,rarity)

  if(card){

   pack.push(card)

   if(card.rarity === "SSR"){
    ssrCount++
    user.stats.ssrPulled = (user.stats.ssrPulled || 0) + 1
   }

  }

 }

 if(ssrCount >= 2){
  giveAchievement(user,"doubleSSR")
 }

 return {
  pack,
  luckyPack
 }

}

module.exports={
 generatePack
}