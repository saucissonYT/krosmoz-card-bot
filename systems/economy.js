const { giveAchievement } = require("./achievementSystem")

const rewards = {
 C:5,
 U:10,
 R:20,
 SR:40,
 HR:80,
 UR:150,
 S:300,
 SSR:1000
}

function rewardKamas(user, rarity){

 const gain = rewards[rarity] || 0

 user.kamas += gain

 if(user.kamas>=1000) giveAchievement(user,"kamas1000")
 if(user.kamas>=5000) giveAchievement(user,"kamas5000")
 if(user.kamas>=20000) giveAchievement(user,"kamas20000")
 if(user.kamas>=100000) giveAchievement(user,"kamas100000")     
 if(user.kamas>=1000000) giveAchievement(user,"kamas1000000")

 return gain
}

module.exports = {
 rewardKamas
}