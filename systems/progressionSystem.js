/* ===============================================
   PROGRESSION SYSTEM — XP & Level
   
   v0.29 — Refonte complète
   
   - Level cap : 200
   - Formule XP : 100 + level × 35 (un peu plus longue, reste fluide)
   - XP total pour level 100 : ~183 000
   - XP total pour level 200 : ~716 000
   - Récompenses par level améliorées avec milestones
   - Bonus de niveau appliqués via playerBonuses.js
=============================================== */

const { MAX_PLAYER_LEVEL } = require("./constants")

/* ================= XP REQUIRED ================= */

function getXPRequired(level){

 if(level >= MAX_PLAYER_LEVEL) return Infinity

 return 100 + level * 35
}

/* ================= LEVEL REWARDS ================= */

function getLevelReward(level){

 const reward = {
  kamas: 150 + (level * 25),
  packs: 0,
  milestone: false,
  milestoneText: null
 }

 /* Pack tous les 5 niveaux */
 if(level % 5 === 0)
  reward.packs = 1

 /* 2 packs tous les 10 niveaux */
 if(level % 10 === 0)
  reward.packs = 2

 /* 3 packs tous les 25 niveaux */
 if(level % 25 === 0)
  reward.packs = 3

 /* Milestones spéciaux */
 if(level === 10){
  reward.milestone = true
  reward.kamas += 500
  reward.milestoneText = "🎉 Niveau 10 ! +500 kamas bonus"
 }

 if(level === 25){
  reward.milestone = true
  reward.kamas += 1500
  reward.packs += 2
  reward.milestoneText = "🎉 Niveau 25 ! +1500 kamas +2 packs"
 }

 if(level === 50){
  reward.milestone = true
  reward.kamas += 5000
  reward.packs += 5
  reward.milestoneText = "🏆 Niveau 50 ! +5000 kamas +5 packs"
 }

 if(level === 75){
  reward.milestone = true
  reward.kamas += 10000
  reward.packs += 5
  reward.milestoneText = "🔥 Niveau 75 ! +10000 kamas +5 packs"
 }

 if(level === 100){
  reward.milestone = true
  reward.kamas += 25000
  reward.packs += 10
  reward.milestoneText = "👑 NIVEAU 100 ! +25000 kamas +10 packs !"
 }

 if(level === 125){
  reward.milestone = true
  reward.kamas += 15000
  reward.packs += 6
  reward.milestoneText = "🏛️ Niveau 125 ! +15000 kamas +6 packs"
 }

 if(level === 150){
  reward.milestone = true
  reward.kamas += 25000
  reward.packs += 8
  reward.milestoneText = "⚡ Niveau 150 ! +25000 kamas +8 packs"
 }

 if(level === 175){
  reward.milestone = true
  reward.kamas += 40000
  reward.packs += 10
  reward.milestoneText = "🌠 Niveau 175 ! +40000 kamas +10 packs"
 }

 if(level === 200){
  reward.milestone = true
  reward.kamas += 60000
  reward.packs += 15
  reward.milestoneText = "🪽 NIVEAU 200 ! +60000 kamas +15 packs !"
 }

 return reward
}

/* ================= ADD XP ================= */

function addXP(user, amount){

 if(!user.progression){
  user.progression = {
   level: 1,
   xp: 0,
   totalXp: 0
  }
 }

 /* Déjà au max : on ne fait rien */
 if(user.progression.level >= MAX_PLAYER_LEVEL){
  user.progression.level = MAX_PLAYER_LEVEL
  user.progression.xp = 0
  return []
 }

 /* Bonus XP de guilde */
 let bonusPercent = 0

 try{
  const { getUserGuildBonuses } = require("./guildBonuses")
  const gBonuses = getUserGuildBonuses(user.odemonId || "")
  /* Note: on ne peut pas facilement avoir le userId ici,
     donc le bonus guilde est appliqué en amont dans packEngine */
 }catch(e){}

 /* Bonus XP de niveau joueur */
 try{
  const { getPlayerBonuses } = require("./playerBonuses")
  const pBonuses = getPlayerBonuses(user.progression.level)
  bonusPercent += pBonuses.xpBonus || 0
 }catch(e){}

 const finalAmount = Math.floor(amount * (1 + bonusPercent / 100))

 user.progression.xp += finalAmount
 user.progression.totalXp = (user.progression.totalXp || 0) + finalAmount

 const levelUps = []

 while(
  user.progression.level < MAX_PLAYER_LEVEL &&
  user.progression.xp >= getXPRequired(user.progression.level)
 ){

  user.progression.xp -= getXPRequired(user.progression.level)
  user.progression.level++

  const lvl = user.progression.level

  const reward = getLevelReward(lvl)

  if(!user.kamas) user.kamas = 0
  if(!user.packs) user.packs = 0

  user.kamas += reward.kamas
  user.packs += reward.packs

  levelUps.push({
   level: lvl,
   kamas: reward.kamas,
   packs: reward.packs,
   milestone: reward.milestone,
   milestoneText: reward.milestoneText
  })
 }

 /* Si on atteint le cap, on fixe l'XP à 0 */
 if(user.progression.level >= MAX_PLAYER_LEVEL){
  user.progression.level = MAX_PLAYER_LEVEL
  user.progression.xp = 0
 }

 return levelUps
}

/* ================= PROGRESSION INFO ================= */

function getProgression(user){

 if(!user.progression){
  user.progression = {
   level: 1,
   xp: 0,
   totalXp: 0
  }
 }

 const level = user.progression.level
 const xp = user.progression.xp

 const required = level >= MAX_PLAYER_LEVEL
  ? 0
  : getXPRequired(level)

 const isMaxLevel = level >= MAX_PLAYER_LEVEL

 return { level, xp, required, isMaxLevel }
}

/* ================= TOTAL XP FOR LEVEL ================= */

function getTotalXPForLevel(targetLevel){

 let total = 0

 for(let i = 1; i < targetLevel; i++){
  total += getXPRequired(i)
 }

 return total
}

/* ================= EXPORT ================= */

module.exports = {
 addXP,
 getXPRequired,
 getProgression,
 getLevelReward,
 getTotalXPForLevel
}
