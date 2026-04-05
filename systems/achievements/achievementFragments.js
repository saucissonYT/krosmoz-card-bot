/* ═══════════════════════════════════════════════════════════════
   ACHIEVEMENTS — FRAGMENTS
   systems/achievements/achievementFragments.js

   Achievements liés aux fragments SSR : obtention, collection
   de fragments distincts, crafting de SSR, vente de fragments.

   Trigger utilisé : "fragment"

   Catégories :
   - Obtention    (fragFirst, frag10, fragDouble)
   - Crafting     (fragComplete1 → fragComplete5)
   - Vente        (fragSell1, fragSell10)

   @module achievementFragments
   @see fragmentService.js — logique fragments
   @see achievementRegistry.js — agrégateur
═══════════════════════════════════════════════════════════════ */

module.exports = {

fragFirst: {
 name: "Premiere Brisure",
 badge: "🧩",
 description: "Obtenir ton premier fragment.",
 title: "Briseur",
 trigger: "fragment",
 condition: (u) => (u.fragments || []).length >= 1
},

frag10: {
 name: "Collectionneur de Tessons",
 badge: "🧩",
 description: "Posseder 10 fragments distincts.",
 title: "Collectionneur de Tessons",
 trigger: "fragment",
 condition: (u) => {
  const keys = new Set((u.fragments || []).map((f) => `${f.cardId}:${f.fragmentNumber}`))
  return keys.size >= 10
 }
},

fragDouble: {
 name: "Stock de Reserve",
 badge: "📦",
 description: "Posseder 3 fois le meme fragment.",
 title: "Reserviste",
 trigger: "fragment",
 condition: (u) => {
  const counts = {}
  for (const fragment of (u.fragments || [])) {
   const key = `${fragment.cardId}:${fragment.fragmentNumber}`
   counts[key] = (counts[key] || 0) + 1
   if (counts[key] >= 3) return true
  }
  return false
 }
},

fragComplete1: {
 name: "Premier Assemblage",
 badge: "✨",
 description: "Crafter 1 SSR via fragments.",
 title: "Artisan",
 trigger: "fragment",
 condition: (u) => (u.stats?.fragmentsCrafted || 0) >= 1
},

fragComplete3: {
 name: "Forge Active",
 badge: "⚒️",
 description: "Crafter 3 SSR via fragments.",
 title: "Forgeron",
 trigger: "fragment",
 condition: (u) => (u.stats?.fragmentsCrafted || 0) >= 3
},

fragComplete5: {
 name: "Maitre Forgeron",
 badge: "🏆",
 description: "Crafter 5 SSR via fragments.",
 title: "Maitre Forgeron",
 trigger: "fragment",
 condition: (u) => (u.stats?.fragmentsCrafted || 0) >= 5
},

fragSell1: {
 name: "Marchand de Tessons",
 badge: "💰",
 description: "Vendre 1 fragment.",
 title: "Marchand de Tessons",
 trigger: "fragment",
 condition: (u) => (u.stats?.fragmentsSold || 0) >= 1
},

fragSell10: {
 name: "Broker de l'Ombre",
 badge: "🕶️",
 description: "Vendre 10 fragments.",
 title: "Broker de l'Ombre",
 trigger: "fragment",
 condition: (u) => (u.stats?.fragmentsSold || 0) >= 10
}

}