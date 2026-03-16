const achievements = require("./achievementRegistry")
const { data } = require("./dataManager")

const cards = Object.values(data.cards || {})

/* ---------------- SET COMPLETION ---------------- */

function checkSetCompletion(user,setId,percent){

 let total = 0
 let owned = 0

 for(const card of cards){

  if(card.set !== setId) continue

  total++

  if(user.cards?.[card.id])
   owned++

 }

 if(total === 0) return false

 const completion = owned / total

 return completion >= percent

}

/* ---------------- ACHIEVEMENT CHECK ---------------- */

function checkAchievements(user,trigger){

 const unlocked = []

 if(!user.achievements)
  user.achievements=[]

 if(!user.stats)
  user.stats={}

 if(!user.titles)
  user.titles=[]

 for(const id in achievements){

  const achievement = achievements[id]

  /* FILTER TRIGGER */

  if(trigger && achievement.trigger !== trigger)
   continue

  /* ALREADY UNLOCKED */

  if(user.achievements.includes(id))
   continue

  try{

   if(typeof achievement.condition === "function"){

    const result = achievement.condition(user,checkSetCompletion)

    if(result){

     user.achievements.push(id)
     unlocked.push(id)

     if(achievement.title){

      if(!user.titles.includes(achievement.title))
       user.titles.push(achievement.title)

     }

    }

   }

  }catch(e){

   console.error("Achievement error:",id,e)

  }

 }

 return unlocked

}

module.exports = {
 checkAchievements,
 checkSetCompletion
}