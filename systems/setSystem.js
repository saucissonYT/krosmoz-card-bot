const { data } = require("./dataManager")
const { addXP } = require("./progressionSystem")

const sets = data.sets || []
const cardsData = data.cards || []

const cards = Array.isArray(cardsData) ? cardsData : cardsData.cards || []

function getSetCards(setId){

 return cards.filter(c => c.set === setId)

}

function playerSetProgress(user,setId){

 const setCards = getSetCards(setId)

 let owned = 0

 if(!user.cards)
  return {
   owned:0,
   total:setCards.length
  }

 for(const card of setCards){

  if(user.cards[card.id])
   owned++

 }

 return {
  owned,
  total:setCards.length
 }

}

function checkSetCompletion(user,setId){

 const progress = playerSetProgress(user,setId)

 if(progress.total === 0)
  return false

 const percent = progress.owned/progress.total

 if(!user.setMilestones)
  user.setMilestones={}

 if(!user.setMilestones[setId])
  user.setMilestones[setId]={}

 if(percent>=0.25 && !user.setMilestones[setId]["25"]){

  user.setMilestones[setId]["25"]=true
  addXP(user,50)

 }

 if(percent>=0.50 && !user.setMilestones[setId]["50"]){

  user.setMilestones[setId]["50"]=true
  user.kamas+=200

 }

 if(percent>=0.75 && !user.setMilestones[setId]["75"]){

  user.setMilestones[setId]["75"]=true
  user.packs=(user.packs||0)+1

 }

 if(progress.owned === progress.total){

  if(!user.completedSets)
   user.completedSets = []

  if(!user.completedSets.includes(setId)){

   user.completedSets.push(setId)

   addXP(user,200)

   return true

  }

 }

 return false

}

module.exports={
 getSetCards,
 playerSetProgress,
 checkSetCompletion
}