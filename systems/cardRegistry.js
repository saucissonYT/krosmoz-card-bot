const { data } = require("./dataManager")

let registry = null

/* ---------------- BUILD REGISTRY ---------------- */

function buildRegistry(){

 const cards = data.cards || []

 const cardsById = Object.fromEntries(
  cards.map(c => [String(c.id), c])
 )

 const cardsBySet = {}

 for(const card of cards){

  if(!cardsBySet[card.set])
   cardsBySet[card.set] = []

  cardsBySet[card.set].push(card)

 }

 registry = {
  cards,
  cardsById,
  cardsBySet
 }

}

/* ---------------- GET REGISTRY ---------------- */

function getRegistry(){

 if(!registry) buildRegistry()

 return registry

}

/* ---------------- RESET ---------------- */

function resetRegistry(){

 registry = null

}

/* ---------------- GETTERS ---------------- */

function getCard(id){

 const { cardsById } = getRegistry()
 return cardsById[String(id)]

}

function getCards(){

 const { cards } = getRegistry()
 return cards

}

function getCardsBySet(setId){

 const { cardsBySet } = getRegistry()
 return cardsBySet[setId] || []

}

function getCardsById(){

 const { cardsById } = getRegistry()
 return cardsById

}

/* ---------------- EXPORT ---------------- */

module.exports = {
 getCard,
 getCards,
 getCardsBySet,
 getCardsById,
 resetRegistry
}