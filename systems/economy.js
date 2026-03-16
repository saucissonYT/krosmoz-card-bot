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

 user.kamas = (user.kamas || 0) + gain

 /* stats economy */

 if(!user.stats) user.stats={}

 user.stats.kamasEarned = (user.stats.kamasEarned || 0) + gain

 return gain
}

module.exports = {
 rewardKamas
}