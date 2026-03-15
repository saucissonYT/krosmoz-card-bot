const { checkAchievements } = require("./achievementSystem")

function calculateTotals(user){

 const cards=user.cards||{}

 let totalCards=0
 let totalUnique=0

 for(const id in cards){

  const count=cards[id]

  if(count>0){

   totalUnique++
   totalCards+=count

  }

 }

 const totalAll=totalCards

 return{
  totalCards,
  totalUnique,
  totalAll
 }

}

async function achievementCheck(interaction,user,context={}){

 let totalCards=context.totalCards
 let totalUnique=context.totalUnique
 let totalAll=context.totalAll

 /* -------- FIX : recalcul si absent -------- */

 if(
  totalCards===undefined ||
  totalUnique===undefined ||
  totalAll===undefined
 ){

  const totals=calculateTotals(user)

  if(totalCards===undefined) totalCards=totals.totalCards
  if(totalUnique===undefined) totalUnique=totals.totalUnique
  if(totalAll===undefined) totalAll=totals.totalAll

 }

 await checkAchievements(
  interaction,
  user,
  totalCards,
  totalUnique,
  totalAll
 )

}

module.exports={
 achievementCheck
}