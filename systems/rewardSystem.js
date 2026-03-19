const { rewardKamas } = require("./economy")
const { addXP } = require("./progressionSystem")

function applyEventRewards(user, pack, event, meta){

 let kamas = 0
 let xp = 20
 let jackpotMessage = null

 /* ---------- BASE ---------- */

 for(const card of pack){
  kamas += rewardKamas(user, card.rarity)
 }

 xp += pack.length * 2

 /* ---------- ENUTROF ---------- */

 if(event.key === "enutrof"){
  kamas *= 5

  if(meta.jackpot){
   kamas *= 3
   jackpotMessage = "💰 **JACKPOT ÉNUTROF !!!**"
  }
 }

 /* ---------- FECA ---------- */

 if(event.key === "feca"){
  xp *= 5

  if(Math.random() < 0.01){
   xp *= 3 // => x15 total
   jackpotMessage = "🛡️ **JACKPOT FECA !!!** XP surboostée !"
  }
 }

 /* ---------- APPLY XP ---------- */

 addXP(user, xp)

 return {
  kamas,
  xp,
  jackpotMessage
 }
}

module.exports = {
 applyEventRewards
}