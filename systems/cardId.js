const { data } = require("./dataManager")

/* Les IDs >= SECRET_ID_THRESHOLD sont réservés aux cartes secrètes */
const SECRET_ID_THRESHOLD = 900000

function getNextCardId(){

 const cardsData = data.cards || []

 const cards = Array.isArray(cardsData)
  ? cardsData
  : cardsData.cards || []

 let maxId = 0

 for(const card of cards){

  const id = Number(card.id)

  if(Number.isFinite(id) && id > maxId && id < SECRET_ID_THRESHOLD)
   maxId = id

 }

 return maxId + 1

}

module.exports = {
 getNextCardId,
 SECRET_ID_THRESHOLD
}