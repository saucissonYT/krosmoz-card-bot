/* ================================================================
   DAILY SYSTEM
   Reset à minuit Paris (00:00 Europe/Paris), pas 24h glissantes.
================================================================ */

const { getUser, save } = require("./userSystem")
const { getCards } = require("./cardRegistry")

/* ---- Bonus helpers ---- */
function getDailyBonuses(userId, user){
 let bonusPacks = 0
 let bonusKamas = 0
 let doubleDailyBonus = 0

 try{
  const { getUserGuildBonuses } = require("./guildBonuses")
  const gb = getUserGuildBonuses(userId)
  bonusPacks        += gb.dailyBonusPacks  || 0
  doubleDailyBonus  += gb.doubleDailyBonus || 0
 }catch(e){}

 try{
  const { getPlayerBonuses } = require("./playerBonuses")
  const pb = getPlayerBonuses(user.progression?.level || 1)
  bonusKamas        += pb.kamasBonus       || 0
  doubleDailyBonus  += pb.doubleDailyBonus || 0
 }catch(e){}

 return { bonusPacks, bonusKamas, doubleDailyBonus }
}

/* ---- Paris timezone helpers ---- */
function getParisDay(ts){
 return new Intl.DateTimeFormat("fr-FR", {
  timeZone:"Europe/Paris",
  year:"numeric", month:"2-digit", day:"2-digit"
 }).format(new Date(ts))
}

function getNextMidnightParisMs(){
 const now   = new Date()
 const paris = new Intl.DateTimeFormat("fr-FR", {
  timeZone:"Europe/Paris",
  year:"numeric", month:"2-digit", day:"2-digit",
  hour:"2-digit", minute:"2-digit", second:"2-digit",
  hourCycle:"h23"
 }).formatToParts(now)

 const p = Object.fromEntries(paris.map(x => [x.type, x.value]))
 const nextMidnight = new Date(
  `${p.year}-${p.month}-${p.day}T00:00:00`
 )
 nextMidnight.setDate(nextMidnight.getDate() + 1)

 const offset = now.getTime() - new Date(now.toLocaleString("en-US", { timeZone:"Europe/Paris" })).getTime()
 return nextMidnight.getTime() + offset
}

/* ---- Give SSR ---- */
function giveSSR(user){
 const cards = getCards().filter(c => c.rarity === "SSR")
 if(!cards.length) return null
 const card = cards[Math.floor(Math.random() * cards.length)]
 if(!user.cards) user.cards = {}
 user.cards[card.id] = (user.cards[card.id] || 0) + 1
 if(!user.stats) user.stats = {}
 user.stats.ssrPulled = (user.stats.ssrPulled || 0) + 1
 return card
}

/* ---- Can claim ? ---- */
/*
 * Reset à minuit Paris (00:00 Europe/Paris), pas 24h glissantes.
 */
function canClaim(user){

 if(!user.daily)
  user.daily = { streak:0, lastDaily:0 }

 if(!user.daily.lastDaily) return true

 const todayParis = getParisDay(Date.now())
 const lastParis  = getParisDay(user.daily.lastDaily)

 return todayParis !== lastParis
}

/* ---- Claim daily ---- */

async function claimDaily(interaction, user, userId){

 const now = Date.now()

 if(!user.cards) user.cards={}

 if(!user.daily)
  user.daily = { streak:0, lastDaily:0 }

 if(!user.stats)
  user.stats={}

 if(user.stats.dailyClaims === undefined)
  user.stats.dailyClaims = 0

 /* ---- Reset streak si le joueur a sauté au moins un jour (calendaire Paris) ---- */

 if(user.daily.lastDaily > 0){
  const lastParis      = getParisDay(user.daily.lastDaily)
  const yesterdayParis = getParisDay(now - 86400000)
  if(lastParis !== yesterdayParis){
   user.daily.streak = 0
  }
 }

 user.daily.lastDaily = now
 user.daily.streak++

 user.stats.dailyClaims++

 /* ---- BONUS DE GUILDE + JOUEUR ---- */

 const bonuses = getDailyBonuses(userId || interaction?.user?.id || "", user)

 /* ---- DOUBLE DAILY (base 10% + bonus) ---- */

 const isStreakSSR = user.daily.streak >= 7
 const doubleDailyChance = 0.10 + (bonuses.doubleDailyBonus / 100)
 const doubleReward = !isStreakSSR && Math.random() < doubleDailyChance

 let reward = null
 let bonusPacksGiven = 0

 /* ---- SSR STREAK ---- */

 if(isStreakSSR){

  const card = giveSSR(user)

  reward={
   type:"ssr",
   value:card
  }

  user.daily.streak = 0

 }

 /* ---- RANDOM REWARD ---- */

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

   let kamas = 200 + bonuses.bonusKamas

   if(doubleReward) kamas *= 2

   user.kamas = (user.kamas || 0) + kamas

   /*
    FIX : tracker les kamas gagnés dans user.stats.totalKamasEarned.
    Ce compteur cumulatif est utilisé par les quêtes de guilde "Gagner X kamas".
    Sans cette ligne, les kamas du daily n'étaient pas comptés pour la quête.
   */
   user.stats.totalKamasEarned = (user.stats.totalKamasEarned || 0) + kamas

   reward={
    type:"kamas",
    value:kamas
   }

  }

 }

 /* ---- Bonus packs de guilde (indépendant du reward) ---- */

 if(bonuses.bonusPacks > 0){
  user.packs = (user.packs || 0) + bonuses.bonusPacks
  bonusPacksGiven = bonuses.bonusPacks
 }

 /* ---- STREAK BAR ---- */

 const streak = Math.max(0, Math.min(user.daily.streak, 7))

 const filled = "🟩".repeat(streak)
 const empty = "⬛".repeat(7-streak)

 const streakBar = `${filled}${empty}`

 save(userId || interaction?.user?.id)

 return{
  reward,
  streak: user.daily.streak,
  streakBar,
  doubleReward,
  doubleDailyChance,
  bonusPacksGiven,
  bonusKamas: bonuses.bonusKamas
 }

}

module.exports={
 canClaim,
 claimDaily,
 giveSSR,
 getParisDay,
 getNextMidnightParisMs
}