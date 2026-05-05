const { createCanvas, loadImage } = require("canvas")
const fs = require("fs")
const path = require("path")

/*
 * FIX: const cards = data.cards || [] au top-level créait un snapshot statique.
 * Remplacé par getCards() depuis cardRegistry, appelé dynamiquement dans generateInventory().
 */
const { getCards } = require("./cardRegistry")
const { CARDS_IMAGES_DIR } = require("./dataManager")

async function generateInventory(cardsOwned){

 /* Lecture dynamique */
 const cards = getCards()

 const cardSize = 200
 const cols = 5
 const rows = Math.ceil(cardsOwned.length / cols)

 const canvas = createCanvas(cols * cardSize, rows * cardSize)
 const ctx = canvas.getContext("2d")

 for(let i=0;i<cardsOwned.length;i++){

  const cardId = cardsOwned[i]

  const card = cards.find(c=>c.id === cardId)

  if(!card) continue

  const imagePath = path.join(CARDS_IMAGES_DIR, card.set, card.image)

  if(!fs.existsSync(imagePath))
   continue

  const img = await loadImage(imagePath)

  const x = (i % cols) * cardSize
  const y = Math.floor(i / cols) * cardSize

  ctx.drawImage(img,x,y,cardSize,cardSize)

 }

 return canvas.toBuffer()

}

module.exports = { generateInventory }
