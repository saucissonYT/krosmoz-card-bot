const { checkAchievements } = require("./achievementEngine")

/*
 * achievementCheck — wrapper centralisé autour de checkAchievements.
 *
 * FIX v0.31 : le trigger "progression" est désormais toujours vérifié
 * automatiquement en plus du trigger demandé.
 *
 * Pourquoi : les succès de niveau, XP, fidélité et grind (trigger:"progression")
 * doivent être détectés dès qu'une action donne de l'XP et peut déclencher
 * un level-up. Plutôt que d'ajouter un appel dans chaque commande
 * (krosmoz, fusion, daily, roulette, eventpack...), on le centralise ici.
 *
 * Exceptions :
 * - Si le trigger demandé est déjà "progression", on n'appelle pas deux fois.
 * - On combine les deux tableaux pour que notifyAchievements reçoive tout.
 */

function achievementCheck(user, trigger = "pack") {

 const unlocked = checkAchievements(user, trigger)

 /* Toujours vérifier "progression" en plus, sauf si c'est déjà le trigger */
 if(trigger !== "progression"){
  const progressionUnlocked = checkAchievements(user, "progression")
  unlocked.push(...progressionUnlocked)
 }

 return unlocked

}

module.exports = {
 achievementCheck
}