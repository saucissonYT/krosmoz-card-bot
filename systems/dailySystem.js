const { data } = require("./dataManager")
const cards = data.cards || []

const { save } = require("./userSystem")

function getRandom(arr){
 return arr[Math.floor(Math.random()*arr.length)]
}

/* ---------------- GIVE SSR ---------------- */

function giveSSR(user){

 if(!user.cards) user.cards={}

 const ssrCards = cards.filter(c => c.rarity === "SSR")

 if(!ssrCards.length) return null

 const card = getRandom(ssrCards)

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

 /* sécurité structures */

 if(!user.cards) user.cards={}

 if(!user.daily)
  user.daily = { streak:0, lastDaily:0 }

 if(!user.stats)
  user.stats={}

 if(user.stats.dailyClaims === undefined)
  user.stats.dailyClaims = 0

 /* reset streak si >48h */

 if(now - user.daily.lastDaily > 172800000)
  user.daily.streak = 0

 user.daily.lastDaily = now
 user.daily.streak++

 user.stats.dailyClaims++

 let reward=null

 /* ---------------- SSR STREAK ---------------- */

 if(user.daily.streak >= 7){

  const card = giveSSR(user)

  reward={
   type:"ssr",
   value:card
  }

  user.daily.streak = 0

 }

 /* ---------------- RANDOM REWARD ---------------- */

 else{

  if(Math.random() < 0.5){

   const packs = 1

   user.packs = (user.packs || 0) + packs

   reward={
    type:"pack",
    value:packs
   }

  }

  else{

   const kamas = 200

   user.kamas = (user.kamas || 0) + kamas

   reward={
    type:"kamas",
    value:kamas
   }

  }

 }

 /* ---------------- STREAK BAR ---------------- */

 const streak = Math.max(0,Math.min(user.daily.streak,7))

 const filled = "🟩".repeat(streak)
 const empty = "⬛".repeat(7-streak)

 const streakBar = `${filled}${empty}`

 save()

 return{
  reward,
  streak:user.daily.streak,
  streakBar,
  doubleReward:false
 }

}

module.exports={
 canClaim,
 claimDaily,
 giveSSR
}