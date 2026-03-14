const { data } = require("./dataManager")

/* ---------------- BUILD REGISTRY ---------------- */

function buildRegistry(){

 const cardsData = data.cards || []

 const cards = Array.isArray(cardsData)
  ? cardsData
  : cardsData.cards || []

 const cardsById = Object.fromEntries(
  cards.map(c => [String(c.id), c])
 )

 const cardsBySet = {}

 for(const card of cards){

  if(!cardsBySet[card.set])
   cardsBySet[card.set] = []

  cardsBySet[card.set].push(card)

 }

 return {
  cards,
  cardsById,
  cardsBySet
 }

}

/* ---------------- GETTERS ---------------- */

function getCard(id){

 const { cardsById } = buildRegistry()
 return cardsById[String(id)]

}

function getCards(){

 const { cards } = buildRegistry()
 return cards

}

function getCardsBySet(setId){

 const { cardsBySet } = buildRegistry()
 return cardsBySet[setId] || []

}

function getCardsById(){

 const { cardsById } = buildRegistry()
 return cardsById

}

/* ---------------- EXPORT ---------------- */

module.exports = {
 getCard,
 getCards,
 getCardsBySet,
 getCardsById
}