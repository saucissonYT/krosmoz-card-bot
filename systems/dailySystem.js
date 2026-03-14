const { data } = require("./dataManager")
const cards = data.cards || []

const { save } = require("./userSystem")

function getRandom(arr){
 return arr[Math.floor(Math.random()*arr.length)]
}

/* ---------------- GIVE SSR ---------------- */

function giveSSR(user){

 const ssrCards = cards.filter(c => c.rarity === "SSR")

 if(!ssrCards.length) return null

 const card = getRandom(ssrCards)

 user.cards[card.id] = (user.cards[card.id] || 0) + 1

 return card
}

/* ---------------- GIVE UR ---------------- */

function giveUR(user){

 const urCards = cards.filter(c => c.rarity === "UR")

 if(!urCards.length) return null

 const card = getRandom(urCards)

 user.cards[card.id] = (user.cards[card.id] || 0) + 1

 return card
}

/* ---------------- CAN CLAIM ---------------- */

function canClaim(user){

 const now = Date.now()

 if(!user.daily)
  user.daily = { streak:0, lastDaily:0 }

 return now - user.daily.lastDaily >= 86400000

}

/* ---------------- CLAIM DAILY ---------------- */

async function claimDaily(interaction,user){

 const now = Date.now()

 if(!user.daily)
  user.daily = { streak:0, lastDaily:0 }

 /* reset streak si >48h */

 if(now - user.daily.lastDaily > 172800000)
  user.daily.streak = 0

 user.daily.lastDaily = now
 user.daily.streak++

 let reward=null
 let doubleReward=false

 const today=new Date().getDay()

 const weekend = (today===0 || today===6)

 /* ---------- DOUBLE REWARD ---------- */

 if(Math.random()<0.10)
  doubleReward=true

 /* ---------- STREAK REWARDS ---------- */

 if(user.daily.streak === 30){

  const card = giveSSR(user)

  reward={
   type:"ssr",
   value:card
  }

  user.daily.streak = 0

 }else if(user.daily.streak === 7){

  const card = giveUR(user)

  reward={
   type:"ur",
   value:card
  }

 }else{

  /* ---------- NORMAL REWARD ---------- */

  if(Math.random()<0.5){

   let packs = weekend ? 2 : 1

   if(doubleReward)
    packs*=2

   user.packs = (user.packs || 0) + packs

   reward={
    type:"pack",
    value:packs
   }

  }else{

   let kamas = weekend ? 400 : 200

   if(doubleReward)
    kamas*=2

   user.kamas = (user.kamas || 0) + kamas

   reward={
    type:"kamas",
    value:kamas
   }

  }

 }

 /* ---------- STREAK BAR ---------- */

 const max=30

 const filled="🟩".repeat(user.daily.streak)
 const empty="⬛".repeat(max-user.daily.streak)

 const streakBar=`${filled}${empty}`

 save()

 return{
  reward,
  streak:user.daily.streak,
  streakBar,
  doubleReward
 }

}

module.exports={
 canClaim,
 claimDaily,
 giveSSR,
 giveUR
}
