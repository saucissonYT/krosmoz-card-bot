const { checkAchievements } = require("./achievementEngine")
const { notifyAchievements } = require("./achievementNotifier")

async function achievementCheck(interaction,user){

 const unlocked = checkAchievements(user)

 if(unlocked.length)
  await notifyAchievements(interaction,unlocked)

}

module.exports = {
 achievementCheck
}