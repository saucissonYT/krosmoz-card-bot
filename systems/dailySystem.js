const cardsData = require("../cards/cards.json")
const cards = cardsData.cards

const { save } = require("./userSystem")
const { giveAchievement, notifyAchievement } = require("./achievementSystem")

const DAY = 86400000
const TOLERANCE = 86400000

function getRandom(arr){
 return arr[Math.floor(Math.random()*arr.length)]
}

/* -------- GIVE SSR -------- */

function giveSSR(user){

 if(!user || !user.cards) return null

 const ssrCards = cards.filter(c => c.rarity === "SSR")

 if(!ssrCards.length) return null

 const card = getRandom(ssrCards)

 user.cards[card.id] = (user.cards[card.id] || 0) + 1

 return card
}

/* -------- STREAK BAR -------- */

function getStreakBar(streak){

 const total = 7
 let bar=""

 for(let i=1;i<=total;i++){
  bar += i<=streak ? "🟩" : "⬜"
 }

 return bar
}

/* -------- CHECK DAILY ACHIEVEMENTS -------- */

async function checkDailyAchievements(interaction,user){

 if(!user.stats.dailyClaims)
  user.stats.dailyClaims=0

 const count=user.stats.dailyClaims

 const checks=[

  ["daily30",count>=30],
  ["daily60",count>=60],
  ["daily120",count>=120],
  ["daily200",count>=200],
  ["daily300",count>=300],
  ["daily365",count>=365],
  ["daily500",count>=500]

 ]

 for(const [id,condition] of checks){

  if(condition){

   const gained=giveAchievement(user,id)

   if(gained)
    await notifyAchievement(interaction,id)

  }

 }

}

/* -------- CLAIM DAILY -------- */

async function claimDaily(interaction,user){

 const now=Date.now()

 if(!user.daily){
  user.daily={streak:0,lastDaily:0}
 }

 let reset=false

 if(user.daily.lastDaily){

  const diff=now-user.daily.lastDaily

  if(diff>DAY+TOLERANCE){
   user.daily.streak=0
   reset=true
  }

 }

 user.daily.lastDaily=now
 user.daily.streak++

 if(!user.stats.dailyClaims)
  user.stats.dailyClaims=0

 user.stats.dailyClaims++

 let reward={type:null,value:null}

 let doubleReward=false

 if(Math.random()<0.05)
  doubleReward=true

 /* -------- REWARDS -------- */

 if(user.daily.streak===1){
  user.packs++
  reward={type:"pack",value:1}
 }

 else if(user.daily.streak===2){
  user.kamas+=500
  reward={type:"kamas",value:500}
 }

 else if(user.daily.streak===3){
  user.packs++
  reward={type:"pack",value:1}
 }

 else if(user.daily.streak===4){
  user.kamas+=1000
  reward={type:"kamas",value:1000}
 }

 else if(user.daily.streak===5){
  user.packs+=2
  reward={type:"pack",value:2}
 }

 else if(user.daily.streak===6){
  user.kamas+=2000
  reward={type:"kamas",value:2000}
 }

 else if(user.daily.streak>=7){

  const card=giveSSR(user)

  reward={type:"ssr",value:card}

  const gained=giveAchievement(user,"assidu")

  if(gained)
   await notifyAchievement(interaction,"assidu")

  user.daily.streak=0

 }

 /* -------- DOUBLE DAILY -------- */

 if(doubleReward){

  if(reward.type==="pack"){
   user.packs+=reward.value
   reward.value*=2
  }

  if(reward.type==="kamas"){
   user.kamas+=reward.value
   reward.value*=2
  }

 }

 await checkDailyAchievements(interaction,user)

 save()

 const realStreak=user.daily.streak

 return{
  streak:realStreak,
  reward,
  reset,
  doubleReward,
  streakBar:getStreakBar(realStreak)
 }

}

/* -------- CAN CLAIM -------- */

function canClaim(user){

 if(!user.daily) return true

 const now=Date.now()

 if(!user.daily.lastDaily) return true

 return now-user.daily.lastDaily>=DAY

}

module.exports={
 claimDaily,
 canClaim,
 getStreakBar
}