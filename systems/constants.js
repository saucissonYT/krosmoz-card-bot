/* ===============================================
   CONSTANTES CENTRALISÉES
   
   v0.29 — Rééquilibrage économie complète
   
   Principes :
   - Un pack (800k) doit "rembourser" ~25-35% en vente moyenne
   - L'écart entre raretés est exponentiel, pas linéaire
   - Le sell price = ~40% du market price (marge pour le market)
   - Le KrosmoShop est premium (2x-3x le market price)
   - Les fusions ont un coût croissant mais jamais ruineux
=============================================== */

const RARITY_EMOJI = {
 C:"⚪", U:"🟢", R:"🔵", SR:"🟣",
 HR:"🔴", UR:"🟡", S:"✨", SSR:"🌈"
}

const RARITY_ORDER = ["C","U","R","SR","HR","UR","S","SSR"]

/* ---- Prix de base (market entre joueurs, min/max calculés dessus) ---- */
const RARITY_PRICE = {
 C:8,     /* avant: 5 */
 U:20,    /* avant: 10 */
 R:50,    /* avant: 20 */
 SR:120,  /* avant: 40 */
 HR:300,  /* avant: 80 */
 UR:800,  /* avant: 150 */
 S:2000,  /* avant: 300 */
 SSR:5000 /* avant: 1000 */
}

/* ---- Prix de vente au bot (sellcard, sellduplicates) ~40% du market ---- */
const SELL_PRICE = {
 C:3,      /* avant: 2 */
 U:8,      /* avant: 5 */
 R:20,     /* avant: 10 */
 SR:50,    /* avant: 20 */
 HR:120,   /* avant: 40 */
 UR:320,   /* avant: 75 */
 S:800,    /* avant: 150 */
 SSR:2000  /* avant: 500 */
}

/* ---- Coût de fusion (en kamas) ---- */
const FUSION_COST = {
 C:10,   /* avant: 5 */
 U:20,   /* avant: 6 */
 R:40,   /* avant: 8 */
 SR:80,  /* avant: 10 */
 HR:150, /* avant: 12 */
 UR:300, /* avant: 15 */
 S:500   /* avant: 20 */
}

/* ---- Couleurs par rareté ---- */
const RARITY_COLOR = {
 C:"#95a5a6",
 U:"#2ecc71",
 R:"#3498db",
 SR:"#9b59b6",
 HR:"#e74c3c",
 UR:"#f1c40f",
 S:"#ecf0f1",
 SSR:"#ffcc00"
}

/* ---- Prix d'un pack ---- */
const PACK_PRICE = 800  /* avant: 1250 */

/* ---- Niveau max joueur ---- */
const MAX_PLAYER_LEVEL = 100

module.exports = {
 RARITY_EMOJI,
 RARITY_ORDER,
 RARITY_PRICE,
 SELL_PRICE,
 FUSION_COST,
 RARITY_COLOR,
 PACK_PRICE,
 MAX_PLAYER_LEVEL
}