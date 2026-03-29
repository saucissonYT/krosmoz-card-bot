/* ===============================================
   SET SYSTEM — Milestones de complétion

   Milestones XP :
   - 25% → 100 XP
   - 50% → 300 XP + 500 kamas
   - 70% → 600 XP + 1 pack   (ancien 75%)
   - 90% → 1 000 XP
   - 100% → 500 XP + kamas récompense du set
=============================================== */

const { data }           = require("./dataManager")
const { addXP }          = require("./progressionSystem")
const { addBattlePassXP }= require("./battlePassService")
const { loadSets }       = require("./setSystemFile")

const cardsData = data.cards || []
const cards     = Array.isArray(cardsData) ? cardsData : cardsData.cards || []

const DEFAULT_SET_REWARD = 20000

/* ─── Récompense kamas du set ────────────────────────────────────────────── */

function getSetReward(setId){
 const sets = loadSets()
 const set  = (Array.isArray(sets) ? sets : sets?.sets || []).find(e => e.id === setId)
 return Number(set?.reward) > 0 ? Number(set.reward) : DEFAULT_SET_REWARD
}

/* ─── Cartes d'un set ────────────────────────────────────────────────────── */

function getSetCards(setId){
 return cards.filter(c => c.set === setId)
}

/* ─── Progression du joueur sur un set ──────────────────────────────────── */

function playerSetProgress(user, setId){

 const setCards = getSetCards(setId)

 let owned = 0

 if(!user.cards)
  return { owned: 0, total: setCards.length }

 for(const card of setCards){
  if(user.cards[card.id]) owned++
 }

 return { owned, total: setCards.length }
}

/* ─── Vérification des milestones ────────────────────────────────────────── */
/*
 * Retourne true si le set vient d'être complété à 100% pour la première fois.
 * Les milestones XP s'accumulent et ne se déclenchent qu'une fois chacun.
 *
 * Milestones :
 *   25% → +100 XP
 *   50% → +300 XP + 500 kamas
 *   70% → +600 XP + 1 pack
 *   90% → +1 000 XP
 *  100% → +500 XP + récompense kamas du set + XP Battle Pass
 */

function checkSetCompletion(user, setId){

 const progress = playerSetProgress(user, setId)

 if(progress.total === 0) return false

 const percent = progress.owned / progress.total

 if(!user.setMilestones)           user.setMilestones = {}
 if(!user.setMilestones[setId])    user.setMilestones[setId] = {}

 const m = user.setMilestones[setId]

 /* ── 25% ── */
 if(percent >= 0.25 && !m["25"]){
  m["25"] = true
  addXP(user, 100)
 }

 /* ── 50% ── */
 if(percent >= 0.50 && !m["50"]){
  m["50"] = true
  addXP(user, 300)
  user.kamas = (user.kamas || 0) + 500
 }

 /* ── 70% ── */
 if(percent >= 0.70 && !m["70"]){
  m["70"] = true
  addXP(user, 600)
  user.packs = (user.packs || 0) + 1
 }

 /* ── 90% ── */
 if(percent >= 0.90 && !m["90"]){
  m["90"] = true
  addXP(user, 1000)
 }

 /* ── 100% ── */
 if(progress.owned === progress.total){

  if(!user.completedSets) user.completedSets = []

  if(!user.completedSets.includes(setId)){

   user.completedSets.push(setId)

   addXP(user, 500)
   user.kamas = (user.kamas || 0) + getSetReward(setId)

   if(user.id || user.userId){
    const uid = user.id || user.userId
    addBattlePassXP(uid, 480, "set_complete").catch(() => {})
   }

   return true
  }
 }

 return false
}

/* ─── Exports ────────────────────────────────────────────────────────────── */

module.exports = {
 getSetCards,
 playerSetProgress,
 checkSetCompletion,
}