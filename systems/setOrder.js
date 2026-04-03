const SET_DISPLAY_ORDER = [
 "incarnam",
 "astrub",
 "amakna",
 "sufokia",
 "kelba",
 "katrepat",
 "sberg"
]

const setOrderMap = new Map(SET_DISPLAY_ORDER.map((id, index) => [id, index]))

function getSetOrderIndex(setId) {
 const key = String(setId || "").toLowerCase()
 if (setOrderMap.has(key)) return setOrderMap.get(key)
 return Number.MAX_SAFE_INTEGER
}

function sortSetsByDisplayOrder(sets) {
 if (!Array.isArray(sets)) return []
 return [...sets].sort((a, b) => {
  const ai = getSetOrderIndex(a?.id)
  const bi = getSetOrderIndex(b?.id)
  if (ai !== bi) return ai - bi
  return String(a?.name || a?.id || "").localeCompare(String(b?.name || b?.id || ""), "fr")
 })
}

module.exports = {
 SET_DISPLAY_ORDER,
 getSetOrderIndex,
 sortSetsByDisplayOrder
}
