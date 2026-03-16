const achievements = require("./achievementRegistry")

function checkAchievements(user,trigger){

 const unlocked=[]

 if(!user.achievements)
  user.achievements=[]

 if(!user.stats)
  user.stats={}

 for(const id in achievements){

  const achievement = achievements[id]

  if(trigger && achievement.trigger !== trigger)
   continue

  if(user.achievements.includes(id))
   continue

  try{

   if(typeof achievement.condition === "function"){

    if(achievement.condition(user)){

     user.achievements.push(id)
     unlocked.push(id)

    }

   }

  }catch(e){

   console.error("Achievement error:",id,e)

  }

 }

 return unlocked

}

module.exports = {
 checkAchievements
}