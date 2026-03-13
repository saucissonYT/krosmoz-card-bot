const fs = require("fs")
const path = require("path")

const cardsPath = path.join(__dirname, "../cards/cards.json")
const setsPath = path.join(__dirname, "../cards/sets.json")
const usersPath = path.join(__dirname, "../database/users.json")
const imagesDir = path.join(__dirname, "../cards/images")

function progressBar(percent) {

 const total = 20
 const filled = Math.round((percent/100) * total)

 const bar =
  "🟩".repeat(filled) +
  "⬛".repeat(total-filled)

 return `${bar} ${percent}%`
}

/* ---------------- SCAN IMAGES RECURSIF ---------------- */

function scanImages(dir){

 const results = []

 const items = fs.readdirSync(dir)

 for(const item of items){

  const full = path.join(dir,item)

  const stat = fs.statSync(full)

  if(stat.isDirectory()){

   results.push(...scanImages(full))

  }else{

   results.push({
    name:item,
    path:full
   })

  }

 }

 return results

}

async function runFullAudit(client, updateProgress) {

 const result = {
  commands: [],
  cards: [],
  sets: [],
  images: [],
  users: []
 }

 let step = 0
 const steps = 5

 function progress() {
  step++
  const percent = Math.round((step/steps)*100)
  if (updateProgress) updateProgress(percent)
 }

 // COMMANDES
 for (const command of client.commands.values()) {

  const name = command?.data?.name || "unknown"

  if (!command.execute) {

   result.commands.push(`❌ ${name} execute() manquant`)
   continue

  }

  if (!command.data) {

   result.commands.push(`❌ ${name} data manquant`)
   continue

  }

  result.commands.push(`✅ ${name}`)

 }

 progress()

 // CARDS
 try {

  const raw = JSON.parse(fs.readFileSync(cardsPath))
  const cards = raw.cards || raw

  const ids = new Set()

  for (const c of cards) {

   if (ids.has(c.id))
    result.cards.push(`❌ ID doublon ${c.id}`)

   ids.add(c.id)

   if (!c.name)
    result.cards.push(`❌ carte ${c.id} sans nom`)

   if (!c.rarity)
    result.cards.push(`❌ carte ${c.id} sans rareté`)

   if (!c.set)
    result.cards.push(`❌ carte ${c.id} sans set`)

  }

  if (result.cards.length === 0)
   result.cards.push("✅ cartes valides")

 } catch {

  result.cards.push("❌ erreur lecture cards.json")

 }

 progress()

 // SETS
 try {

  const sets = JSON.parse(fs.readFileSync(setsPath))
  const cards = JSON.parse(fs.readFileSync(cardsPath)).cards

  const setNames = sets.map(s => s.id || s.name)

  for (const card of cards) {

   if (!setNames.includes(card.set)) {

    result.sets.push(`❌ carte ${card.id} set invalide`)

   }

  }

  if (result.sets.length === 0)
   result.sets.push("✅ sets valides")

 } catch {

  result.sets.push("❌ erreur lecture sets.json")

 }

 progress()

 // IMAGES (AMÉLIORÉ)

 try {

  const cards = JSON.parse(fs.readFileSync(cardsPath)).cards

  const allImages = scanImages(imagesDir)

  const imageNames = new Set(allImages.map(i => i.name))

  let missing = []
  let wrongFolder = []

  for (const card of cards) {

   const img = card.image

   if(!imageNames.has(img)){

    missing.push(img)
    continue

   }

   // vérifier dossier du set
   const found = allImages.find(i => i.name === img)

   if(found){

    const folder = path.basename(path.dirname(found.path))

    if(card.set && folder !== card.set){

     wrongFolder.push(`${img} dans ${folder} mais set ${card.set}`)

    }

   }

  }

  if(missing.length === 0 && wrongFolder.length === 0){

   result.images.push("✅ images OK")

  }else{

   if(missing.length > 0){

    result.images.push(`❌ ${missing.length} images manquantes`)

    for(const m of missing.slice(0,10)){
     result.images.push(`- ${m}`)
    }

    if(missing.length > 10)
     result.images.push(`...`)
  }

   if(wrongFolder.length > 0){

    result.images.push(`❌ ${wrongFolder.length} images mauvais dossier`)

    for(const w of wrongFolder.slice(0,10)){
     result.images.push(`- ${w}`)
    }

    if(wrongFolder.length > 10)
     result.images.push(`...`)
   }

  }

 } catch {

  result.images.push("❌ erreur images")

 }

 progress()

 // USERS
 try {

  const users = JSON.parse(fs.readFileSync(usersPath))

  let problems = 0

  for (const id in users) {

   const u = users[id]

   if (!u.cards) problems++
   if (u.kamas === undefined) problems++
   if (!u.pity) problems++

  }

  if (problems === 0)
   result.users.push("✅ users.json valide")
  else
   result.users.push(`❌ ${problems} problèmes users`)

 } catch {

  result.users.push("❌ erreur users.json")

 }

 progress()

 return result
}

function buildReport(data) {

 let txt = "📊 **Krosmoz Audit**\n\n"

 txt += "**COMMANDES**\n"
 txt += data.commands.join("\n")

 txt += "\n\n**CARDS**\n"
 txt += data.cards.join("\n")

 txt += "\n\n**SETS**\n"
 txt += data.sets.join("\n")

 txt += "\n\n**IMAGES**\n"
 txt += data.images.join("\n")

 txt += "\n\n**DATABASE**\n"
 txt += data.users.join("\n")

 return txt
}

module.exports = {
 runFullAudit,
 buildReport,
 progressBar
}
