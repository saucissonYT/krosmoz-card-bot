const { getCards } = require("../cardRegistry")

/*
 * OUGINAK — La Chasse du Prédateur
 * ──────────────────────────────────
 * Avant : 70% downgrade systématique → S/SSR quasi impossibles
 * Après : mécanique risque/récompense avec chasse
 *
 * Mécanique — Chaque carte subit la "chasse" :
 * - 30% → Proie faible (downgrade -1 rang)
 * - 25% → Esquive (carte inchangée)
 * - 25% → Chasse réussie (upgrade +1 rang)
 * - 15% → Festin (upgrade +2 rangs, peut atteindre S)
 * - 5%  → Proie Légendaire (upgrade +3 rangs, peut atteindre SSR)
 *
 * Les cartes déjà SSR ne sont pas touchées.
 * Les downgrades ne descendent pas en-dessous de C.
 *
 * RP : Ouginak est un prédateur. La plupart des proies sont
 *      médiocres, mais parfois il attrape une proie légendaire.
 *      C'est du haut risque / haute récompense.
 */

const order = ["C","U","R","SR","HR","UR","S","SSR"]

function random(pool){
 return pool[Math.floor(Math.random() * pool.length)]
}

function getCardAtRarity(cards, targetRarity){
 const pool = cards.filter(c => c.rarity === targetRarity)
 if(pool.length) return random(pool)
 return null
}

module.exports = {
 key: "ouginak",

 generate(user, basePack){

  const cards = getCards()

  const huntLog = []
  const downgrades = []

  let pack = basePack.map(c => {

   /* SSR : le prédateur respecte les légendes */
   if(c.rarity === "SSR") return c

   const i = order.indexOf(c.rarity)
   if(i === -1) return c

   const roll = Math.random()

   /* 30% — Proie faible (downgrade -1) */
   if(roll < 0.30){

    const target = Math.max(0, i - 1)
    const targetRarity = order[target]
    const downgraded = getCardAtRarity(cards, targetRarity)

    if(downgraded){
     downgrades.push(`🐺 ${c.name} → ${downgraded.name}`)
     return downgraded
    }
    return c
   }

   /* 25% — Esquive (inchangé) */
   if(roll < 0.55){
    return c
   }

   /* 25% — Chasse réussie (upgrade +1) */
   if(roll < 0.80){

    const target = Math.min(order.length - 1, i + 1)
    const targetRarity = order[target]
    const upgraded = getCardAtRarity(cards, targetRarity)

    if(upgraded){
     huntLog.push(`🦴 ${c.name} → **${upgraded.name}**`)
     return upgraded
    }
    return c
   }

   /* 15% — Festin (upgrade +2) */
   if(roll < 0.95){

    const target = Math.min(order.length - 1, i + 2)
    const targetRarity = order[target]
    const upgraded = getCardAtRarity(cards, targetRarity)

    if(upgraded){
     if(targetRarity === "S" || targetRarity === "SSR"){
      huntLog.push(`🐺 ${c.name} → **${upgraded.name}** (FESTIN !)`)
     } else {
      huntLog.push(`🍖 ${c.name} → **${upgraded.name}** (Festin)`)
     }
     return upgraded
    }
    return c
   }

   /* 5% — Proie Légendaire (upgrade +3) */
   {
    const target = Math.min(order.length - 1, i + 3)
    const targetRarity = order[target]
    const upgraded = getCardAtRarity(cards, targetRarity)

    if(upgraded){
     huntLog.push(`🐺 ${c.name} → **${upgraded.name}** (PROIE LÉGENDAIRE !)`)
     return upgraded
    }
    return c
   }
  })

  return {
   pack,
   meta: {
    downgrades,
    upgrades: huntLog,
    ux: huntLog.some(l => l.includes("LÉGENDAIRE") || l.includes("FESTIN"))
     ? ["🐺 La chasse est bonne !", "🍖 Festin du prédateur"]
     : downgrades.length > huntLog.length
      ? ["🐺 La meute grogne...", "⚔️ Survie difficile"]
      : ["🐺 Instinct de chasse", "🦴 Le prédateur rôde"]
   }
  }
 }

}