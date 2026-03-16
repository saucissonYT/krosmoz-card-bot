const { checkAchievements } = require("./achievementEngine")
const { notifyAchievements } = require("./achievementNotifier")

async function achievementCheck(interaction,user,trigger="pack"){

 const unlocked = checkAchievements(user,trigger)

 if(unlocked.length)
  await notifyAchievements(interaction,unlocked)

}

module.exports = {
 achievementCheck
}