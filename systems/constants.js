const RARITY_EMOJI = {
  C:"⚪", U:"🟢", R:"🔵", SR:"🟣",
  HR:"🔴", UR:"🟡", S:"✨", SSR:"🌈"
}

const RARITY_ORDER = ["C","U","R","SR","HR","UR","S","SSR"]

const RARITY_PRICE = {
  C:5, U:10, R:20, SR:40,
  HR:80, UR:150, S:300, SSR:1000
}

const SELL_PRICE = {
  C:2, U:5, R:10, SR:20,
  HR:40, UR:75, S:150, SSR:500
}

const FUSION_COST = {
  C:5, U:6, R:8, SR:10, HR:12, UR:15, S:20
}

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

module.exports = {
  RARITY_EMOJI,
  RARITY_ORDER,
  RARITY_PRICE,
  SELL_PRICE,
  FUSION_COST,
  RARITY_COLOR
}