const setsData = require("../cards/sets.json")

const rawSets = Array.isArray(setsData) ? setsData : (setsData.sets || [])

const SET_DISPLAY_ORDER = rawSets
 .slice()
 .sort((a, b) => {
  const aLevel = Number(a?.levelMin || 9999)
  const bLevel = Number(b?.levelMin || 9999)
  if (aLevel !== bLevel) return aLevel - bLevel
  return String(a?.name || a?.id || "").localeCompare(String(b?.name || b?.id || ""), "fr")
 })
 .map(set => set.id)

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
