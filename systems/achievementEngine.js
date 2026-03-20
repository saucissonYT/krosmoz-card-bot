const achievements = require("./achievementRegistry")
const { data } = require("./dataManager")

/*
 * FIX: Les cartes étaient mises en cache au require() :
 *   const cards = Object.values(data.cards || {})
 *
 * Problème : si des cartes sont ajoutées via /addcard ou /importcards,
 * l'engine d'achievements utilisait toujours l'ancien snapshot.
 * Les achievements de complétion de set ne se déclenchaient pas
 * pour les nouvelles cartes.
 *
 * APRÈS : on lit data.cards dynamiquement à chaque appel.
 */

/* ---------------- SET COMPLETION ---------------- */

function checkSetCompletion(user,setId,percent){

 /* Lecture dynamique des cartes depuis le dataManager */
 const cards = data.cards || []

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