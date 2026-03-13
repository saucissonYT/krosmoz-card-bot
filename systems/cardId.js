const cards = require("../cards/cards.json")

function getNextCardId(){

 let maxId = 0

 for(const card of cards.cards){

  const id = Number(card.id)

  if(Number.isFinite(id) && id > maxId){

   maxId = id

  }

 }

 return maxId + 1

}

module.exports = { getNextCardId }