const { checkAchievements } = require("./achievementSystem")

async function achievementCheck(interaction,user,context={}){

 const totalCards=context.totalCards||0
 const totalUnique=context.totalUnique||0
 const totalAll=context.totalAll||0

 await checkAchievements(
  interaction,
  user,
  totalCards,
  totalUnique,
  totalAll
 )

}

module.exports={achievementCheck}