const achievements = require("./achievementRegistry")

function safeStat(user,path,defaultValue=0){

 const parts = path.split(".")
 let value = user

 for(const p of parts){

  if(value[p]===undefined)
   return defaultValue

  value = value[p]

 }

 return value

}

function checkAchievements(user){

 const unlocked=[]

 if(!user.achievements)
  user.achievements=[]

 if(!user.stats)
  user.stats={}

 for(const id in achievements){

  if(user.achievements.includes(id))
   continue

  const achievement = achievements[id]

  try{

   /* ---------------- CONDITION ---------------- */

   if(typeof achievement.condition === "function"){

    if(achievement.condition(user,safeStat)){

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