const { data } = require("./dataManager")

function getNextCardId(){

 const cardsData = data.cards || []

 const cards = Array.isArray(cardsData)
  ? cardsData
  : cardsData.cards || []

 let maxId = 0

 for(const card of cards){

  const id = Number(card.id)

  if(Number.isFinite(id) && id > maxId)
   maxId = id

 }

 return maxId + 1

}

module.exports = {
 getNextCardId
}