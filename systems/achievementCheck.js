const { checkAchievements } = require("./achievementEngine")

/*
 * achievementCheck - wrapper centralise.
 *
 * Verif systematique:
 * - on verifie tous les succes a chaque appel (trigger null),
 * - puis on ajoute une passe "progression" pour les cas de level/xp.
 *
 * But:
 * eviter les succes bloques par un trigger trop specifique
 * (ex: paliers "X succes" ou actions faites depuis le web).
 */

function achievementCheck(user, trigger = "pack") {
 const unlocked = checkAchievements(user, null)
 const progressionUnlocked = checkAchievements(user, "progression")
 unlocked.push(...progressionUnlocked)
 return [...new Set(unlocked)]

}

module.exports = {
 achievementCheck
}
