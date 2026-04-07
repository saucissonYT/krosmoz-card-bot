const { checkAchievements } = require("./achievementEngine")

/*
 * achievementCheck - wrapper centralisé.
 *
 * FIX v2 : Multi-pass jusqu'à stabilisation.
 *
 * Problème : un achievement donne de l'XP en récompense (via addXP),
 * ce qui peut déclencher un nouvel achievement de niveau/progression.
 * Mais comme on est déjà dans la boucle, il n'est pas détecté.
 * Le joueur ne le voit que quand il fait /balance ou une autre commande.
 *
 * Solution : on relance checkAchievements tant qu'il y a des nouveaux
 * achievements débloqués, avec un max de 5 passes pour éviter les boucles.
 *
 * Vérif systématique :
 * - on vérifie tous les succès à chaque appel (trigger null)
 * - puis on boucle jusqu'à ce que plus rien ne se débloque
 */

function achievementCheck(user, _trigger = "pack") {

 const allUnlocked = []
 const MAX_PASSES = 5

 for (let pass = 0; pass < MAX_PASSES; pass++) {

  /* Passe principale : tous les triggers */
  const unlocked = checkAchievements(user, null)

  /* Passe progression pour les cas level/xp */
  const progressionUnlocked = checkAchievements(user, "progression")
  unlocked.push(...progressionUnlocked)

  /* Dédoublonner cette passe */
  const newIds = [...new Set(unlocked)].filter(id => !allUnlocked.includes(id))

  if (newIds.length === 0) break

  allUnlocked.push(...newIds)
 }

 return [...new Set(allUnlocked)]
}

module.exports = {
 achievementCheck
}
