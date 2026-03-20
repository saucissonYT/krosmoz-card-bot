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

module.exports = {
  RARITY_EMOJI,
  RARITY_ORDER,
  RARITY_PRICE,
  SELL_PRICE,
  FUSION_COST
}