const { getCards } = require("../cardRegistry")

/*
 * FECA — Le Bouclier Divin
 * ─────────────────────────
 * Avant : filtre C/U, remplit avec R → S/SSR quasi impossibles
 * Après : filtre C/U, remplit avec SR/HR/UR + chance de S/SSR
 *
 * Mécanique :
 * - Les cartes C et U sont filtrées (le bouclier les rejette)
 * - Chaque slot libre est rempli avec un tirage "protégé" :
 *   • 3% → SSR (Bouclier Divin absolu)
 *   • 8% → S (Protection Majeure)
 *   • 25% → UR (Glyphe renforcé)
 *   • 35% → HR (Armure solide)
 *   • 29% → SR (Défense de base)
 * - Les cartes R+ du basePack sont conservées intactes
 * - Jackpot Feca : 1% chance
 *
 * RP : Feca protège le pack en filtrant les impuretés.
 *      Son bouclier le plus puissant peut invoquer
 *      des cartes légendaires.
 */

function random(pool){
 return pool[Math.floor(Math.random() * pool.length)]
}

function rollProtectedRarity(){
 const r = Math.random()
 if(r < 0.03) return "SSR"
 if(r < 0.11) return "S"
 if(r < 0.36) return "UR"
 if(r < 0.71) return "HR"
 return "SR"
}

module.exports = {
 key: "feca",

 generate(user, basePack){

  const cards = getCards()

  /* Conserver les cartes R+ du basePack */
  const pack = basePack.filter(c =>
   c.rarity !== "C" && c.rarity !== "U"
  )

  const shielded = []

  /* Remplir les slots manquants avec des cartes protégées */
  while(pack.length < basePack.length){

   const rarity = rollProtectedRarity()
   const pool = cards.filter(c => c.rarity === rarity)

   if(pool.length){
    const card = random(pool)
    pack.push(card)

    if(rarity === "SSR"){
     shielded.push(`🛡️ Bouclier Divin → **${card.name}** (SSR)`)
    } else if(rarity === "S"){
     shielded.push(`✨ Protection Majeure → **${card.name}** (S)`)
    }
   } else {
    /* Fallback SR */
    const sr = cards.filter(c => c.rarity === "SR")
    if(sr.length) pack.push(random(sr))
   }
  }

  return {
   pack,
   meta: {
    upgrades: shielded,
    ux: shielded.length
     ? ["🛡️ Le bouclier brille !", "✨ Protection activée"]
     : ["🛡️ Protection stable", "✨ Filtrage actif"],
    jackpot: Math.random() < 0.01
   }
  }
 }

}