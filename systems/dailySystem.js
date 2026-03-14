const { data } = require("./dataManager")
const cards = data.cards || []

const { save } = require("./userSystem")

function getRandom(arr){
 return arr[Math.floor(Math.random()*arr.length)]
}

function giveSSR(user){

 const ssrCards = cards.filter(c => c.rarity === "SSR")

 if(!ssrCards.length) return null

 const card = getRandom(ssrCards)

 user.cards[card.id] = (user.cards[card.id] || 0) + 1

 return card
}

module.exports={ giveSSR }