const { checkAchievements } = require("./achievementEngine")

function achievementCheck(user, trigger = "pack") {

 const unlocked = checkAchievements(user, trigger)

 return unlocked

}

module.exports = {
 achievementCheck
}