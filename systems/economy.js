const { RARITY_PRICE } = require("./constants")

function rewardKamas(user, rarity){

 const gain = RARITY_PRICE[rarity] || 0

 user.kamas = (user.kamas || 0) + gain

 if(!user.stats) user.stats={}

 user.stats.kamasEarned = (user.stats.kamasEarned || 0) + gain
 user.stats.totalKamasEarned = (user.stats.totalKamasEarned || 0) + gain

 return gain
}

module.exports = {
 rewardKamas
}