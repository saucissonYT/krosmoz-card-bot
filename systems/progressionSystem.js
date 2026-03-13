function getXPRequired(level){
 return Math.floor(120 * Math.pow(level,1.35))
}

/* -------- LEVEL REWARDS -------- */

function getLevelReward(level){

 const reward={
  kamas:200 + (level * 40),
  packs:0,
  milestone:false
 }

 if(level % 5 === 0){
  reward.packs = 1
 }

 if(level % 10 === 0){
  reward.packs = 2
 }

 if(level === 20 || level === 30 || level === 40 || level === 50){
  reward.milestone=true
 }

 return reward
}

/* -------- XP SYSTEM -------- */

function addXP(user,amount){

 if(!user.progression){
  user.progression={
   level:1,
   xp:0,
   totalXp:0
  }
 }

 user.progression.xp += amount
 user.progression.totalXp += amount

 const levelUps=[]

 while(user.progression.xp >= getXPRequired(user.progression.level)){

  user.progression.xp -= getXPRequired(user.progression.level)
  user.progression.level++

  const lvl=user.progression.level

  const reward=getLevelReward(lvl)

  if(!user.kamas) user.kamas=0
  if(!user.packs) user.packs=0

  user.kamas += reward.kamas
  user.packs += reward.packs

  levelUps.push({
   level:lvl,
   kamas:reward.kamas,
   packs:reward.packs,
   milestone:reward.milestone
  })

 }

 return levelUps
}

/* -------- PROGRESSION INFO -------- */

function getProgression(user){

 if(!user.progression){
  user.progression={
   level:1,
   xp:0,
   totalXp:0
  }
 }

 const level=user.progression.level
 const xp=user.progression.xp
 const required=getXPRequired(level)

 return {level,xp,required}
}

module.exports={
 addXP,
 getXPRequired,
 getProgression
}