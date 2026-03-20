/*
 * FIX: const cards = data.cards || [] au top-level créait un snapshot statique.
 * Remplacé par getCards() depuis cardRegistry, appelé dynamiquement dans giveSSR().
 */
const { getCards } = require("./cardRegistry")

const { save } = require("./userSystem")

function getRandom(arr){
 return arr[Math.floor(Math.random()*arr.length)]
}

/* ---------------- GIVE SSR ---------------- */

function giveSSR(user){

 if(!user.cards) user.cards={}

 /* Lecture dynamique */
 const cards = getCards()

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

async function claimDaily(interaction, user){

 const now = Date.now()

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

 /* ---------------- DOUBLE DAILY 10% ---------------- */

 // SSR streak non doublée — donner 2 SSR n'a pas de sens
 const isStreakSSR = user.daily.streak >= 7
 const doubleReward = !isStreakSSR && Math.random() < 0.10

 let reward = null

 /* ---------------- SSR STREAK ---------------- */

 if(isStreakSSR){

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

   let packs = 1

   if(doubleReward) packs *= 2

   user.packs = (user.packs || 0) + packs

   reward={
    type:"pack",
    value:packs
   }

  }else{

   let kamas = 200

   if(doubleReward) kamas *= 2

   user.kamas = (user.kamas || 0) + kamas

   reward={
    type:"kamas",
    value:kamas
   }

  }

 }

 /* ---------------- STREAK BAR ---------------- */

 const streak = Math.max(0, Math.min(user.daily.streak, 7))

 const filled = "🟩".repeat(streak)
 const empty = "⬛".repeat(7-streak)

 const streakBar = `${filled}${empty}`

 save()

 return{
  reward,
  streak: user.daily.streak,
  streakBar,
  doubleReward
 }

}

module.exports={
 canClaim,
 claimDaily,
 giveSSR
}