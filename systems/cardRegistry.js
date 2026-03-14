const cardsData = require("../cards/cards.json")

const cards = Array.isArray(cardsData) ? cardsData : cardsData.cards

const cardsById = Object.fromEntries(
 cards.map(c => [String(c.id), c])
)

const cardsBySet = {}

for(const card of cards){

 if(!cardsBySet[card.set])
  cardsBySet[card.set] = []

 cardsBySet[card.set].push(card)

}

function getCard(id){
 return cardsById[String(id)]
}

function getCards(){
 return cards
}

function getCardsBySet(setId){
 return cardsBySet[setId] || []
}

module.exports = {
 getCard,
 getCards,
 getCardsBySet,
 cardsById
}