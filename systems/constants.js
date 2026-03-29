/* ===============================================
   CONSTANTES CENTRALISÉES
   
   v0.30 — Rééquilibrage fusion + économie
   
   Principes :
   - Un pack (800k) doit "rembourser" ~25-35% en vente moyenne
   - L'écart entre raretés est exponentiel, pas linéaire
   - Le sell price = ~40% du market price (marge pour le market) (en vrai jsp c'est à équilibrer)
   - Le KrosmoShop est premium (2x-3x le market price)
   - Les fusions doivent être ACCESSIBLES pour que les joueurs
     les utilisent : coûts bas = recyclage attractif des doublons
=============================================== */

const RARITY_EMOJI = {
 C:"⚪", U:"🟢", R:"🔵", SR:"🟣",
 HR:"🔴", UR:"🟡", S:"✨", SSR:"🌈"
}

const RARITY_ORDER = ["C","U","R","SR","HR","UR","S","SSR"]

/* ---- Prix de base (market entre joueurs, min/max calculés dessus) ---- */
const RARITY_PRICE = {
 C:10,
 U:20,
 R:50,
 SR:100,
 HR:200,
 UR:700,
 S:1000,
 SSR:2500
}

/* ---- Prix de vente au bot (sellcard, sellduplicates) ~40% du market ---- */
const SELL_PRICE = {
 C:3,
 U:8,
 R:20,
 SR:50,
 HR:120,
 UR:320,
 S:800,
 SSR:2500
}

/* ---- Coût de fusion (en DOUBLONS nécessaires, PAS en kamas) ---- */
/* Principe : le joueur sacrifie X doublons d'une rareté pour obtenir
   1 carte de la rareté supérieure. Les coûts doivent rester bas
   pour que la fusion soit un vrai levier de progression.            */
const FUSION_COST = {
 C:3,    /* 3 doublons C  → 1 U   (avant: 10, original: 5) */
 U:3,    /* 3 doublons U  → 1 R   (avant: 20, original: 6) */
 R:4,    /* 4 doublons R  → 1 SR  (avant: 40, original: 8) */
 SR:5,   /* 5 doublons SR → 1 HR  (avant: 80, original: 10) */
 HR:6,   /* 6 doublons HR → 1 UR  (avant: 150, original: 12) */
 UR:8,   /* 8 doublons UR → 1 S   (avant: 300, original: 15) */
 S:10    /* 10 doublons S → 1 SSR (avant: 500, original: 20) */
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
const PACK_PRICE = 2500

/* ---- Niveau max joueur ---- */
const MAX_PLAYER_LEVEL = 200

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
