const { createCanvas, loadImage } = require("canvas")
const cards = require("../cards/cards.json")
const fs = require("fs")

async function generateInventory(cardsOwned){

 const cardSize = 200
 const cols = 5
 const rows = Math.ceil(cardsOwned.length / cols)

 const canvas = createCanvas(cols * cardSize, rows * cardSize)
 const ctx = canvas.getContext("2d")

 for(let i=0;i<cardsOwned.length;i++){

  const cardId = cardsOwned[i]

  const card = cards.cards.find(c=>c.id === cardId)

  if(!card) continue

  const path = `./cards/images/${card.image}`

  if(!fs.existsSync(path)){
   console.log("Image manquante :",path)
   continue
  }

  try{

   const img = await loadImage(path)

   const x = (i % cols) * cardSize
   const y = Math.floor(i / cols) * cardSize

   ctx.drawImage(img,x,y,cardSize,cardSize)

  }catch(err){

   console.log("Image ignorée (format invalide) :",path)

  }

 }

 return canvas.toBuffer()

}

module.exports = { generateInventory }