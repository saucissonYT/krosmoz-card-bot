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

 return gain
}

module.exports = {
 rewardKamas
}