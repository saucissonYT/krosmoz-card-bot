const achievements = require("./achievementRegistry")
const { data } = require("./dataManager")
const { getAchievementReward } = require("./achievementRewards")

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
/*
 * MODIFIÉ : applique désormais les récompenses (kamas, XP, packs)
 * au moment du déblocage d'un achievement.
 *
 * L'XP est ajoutée via addXP() pour déclencher les level-ups.
 * Les kamas et packs sont ajoutés directement sur le user.
 *
 * Retourne toujours un tableau d'IDs débloqués (rétro-compatible).
 * Les récompenses sont trackées dans user.stats.achievementRewards
 * pour audit et affichage dans le notifier.
 */

function checkAchievements(user,trigger){

 const unlocked = []

 if(!user.achievements)
  user.achievements=[]

 if(!user.stats)
  user.stats={}

 if(!user.titles)
  user.titles=[]

 /* Initialiser le tracking des récompenses si absent */
 if(!user.stats.achievementKamasEarned)
  user.stats.achievementKamasEarned = 0

 if(!user.stats.achievementXpEarned)
  user.stats.achievementXpEarned = 0

 if(!user.stats.achievementPacksEarned)
  user.stats.achievementPacksEarned = 0

 /* Stocker les récompenses de cette vague pour le notifier */
 if(!user._lastAchievementRewards)
  user._lastAchievementRewards = {}

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

     /* ============ RÉCOMPENSES ============ */

     const reward = getAchievementReward(id, achievement)

     /* Kamas */
     if(reward.kamas > 0){
      if(!user.kamas) user.kamas = 0
      user.kamas += reward.kamas
      user.stats.achievementKamasEarned += reward.kamas
     }

     /* XP — on utilise addXP si disponible pour les level-ups */
     if(reward.xp > 0){
      user.stats.achievementXpEarned += reward.xp

      try{
       const { addXP } = require("./progressionSystem")
       addXP(user, reward.xp)
      }catch(e){
       /* Fallback si progressionSystem n'est pas dispo */
       if(user.progression){
        user.progression.xp = (user.progression.xp || 0) + reward.xp
        user.progression.totalXp = (user.progression.totalXp || 0) + reward.xp
       }
      }
     }

     /* Packs */
     if(reward.packs > 0){
      if(!user.packs) user.packs = 0
      user.packs += reward.packs
      user.stats.achievementPacksEarned += reward.packs
     }

     /* Stocker la reward pour le notifier */
     user._lastAchievementRewards[id] = reward

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