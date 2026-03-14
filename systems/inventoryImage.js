const { createCanvas, loadImage } = require("canvas")
const { data } = require("../systems/dataManager")
const cards = data.cards || []
const fs = require("fs")

async function generateInventory(cardsOwned){

 const cardSize = 200
 const cols = 5
 const rows = Math.ceil(cardsOwned.length / cols)

 const canvas = createCanvas(cols * cardSize, rows * cardSize)
 const ctx = canvas.getContext("2d")

 for(let i=0;i<cardsOwned.length;i++){

  const cardId = cardsOwned[i]

  const card = cards.find(c=>c.id === cardId)

  if(!card) continue

  const path = `./cards/images/${card.set}/${card.image}`

  if(!fs.existsSync(path))
   continue

  const img = await loadImage(path)

  const x = (i % cols) * cardSize
  const y = Math.floor(i / cols) * cardSize

  ctx.drawImage(img,x,y,cardSize,cardSize)

 }

 return canvas.toBuffer()

}

module.exports = { generateInventory }