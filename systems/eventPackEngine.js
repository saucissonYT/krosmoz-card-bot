const { getCards } = require("./cardRegistry")

const cards = getCards()

const rarityOrder=["C","U","R","SR","HR","UR","S","SSR"]

function randomCard(pool){
 return pool[Math.floor(Math.random()*pool.length)]
}

function randomInt(min,max){
 return Math.floor(Math.random()*(max-min+1))+min
}

function generateBasePack(size=5){
 const pack=[]
 for(let i=0;i<size;i++){
  pack.push(randomCard(cards))
 }
 return pack
}

/* ---------- ENIRIPSA ---------- */
function eniripsaPack(){
 return cards
  .filter(c=>!["C","U","R"].includes(c.rarity))
  .sort(()=>Math.random()-0.5)
  .slice(0,5)
}

/* ---------- SADIDA ---------- */
function sadidaPack(){
 const pack=generateBasePack(5)

 let dupCount=0

 for(let i=0;i<pack.length;i++){
  if(Math.random()<0.35 && dupCount<2){
   pack.push({...pack[i]})
   dupCount++
  }
 }

 return pack
}

/* ---------- MAIN ---------- */

function generateEventPack(user,event){

 let pack = generateBasePack(5)

 switch(event.id){

  /* ---------- ENIRIPSA ---------- */
  case "ENIRIPSA":
   pack = eniripsaPack()
   pack.push(randomCard(cards.filter(c=>!["C","U","R"].includes(c.rarity))))
   break

  /* ---------- SADIDA ---------- */
  case "SADIDA":
   pack = sadidaPack()
   break

  /* ---------- CRA ---------- */
  case "CRA":
   pack = generateBasePack(5)

   if(event.data?.targetId){

    let count=0

    for(let i=0;i<pack.length;i++){

     if(Math.random()<0.20 && count<2){
      const target = cards.find(c=>c.id===event.data.targetId)
      if(target){
       pack[i]=target
       count++
      }
     }

    }

   }
   break

  /* ---------- XELOR ---------- */
  case "XELOR":

   pack = generateBasePack(5)

   const extra = randomInt(1,3)
   const remove = randomInt(1,2)

   pack.sort((a,b)=>rarityOrder.indexOf(a.rarity)-rarityOrder.indexOf(b.rarity))

   pack.splice(0,remove)

   for(let i=0;i<extra;i++){
    pack.push(randomCard(cards))
   }

   break

  /* ---------- IOP ---------- */
  case "IOP":

   pack = generateBasePack(5)

   const hrPool = cards.filter(c=>c.rarity==="HR")
   const urPool = cards.filter(c=>c.rarity==="UR")

   if(hrPool.length) pack.push(randomCard(hrPool))
   if(urPool.length) pack.push(randomCard(urPool))

   break

  /* ---------- SRAM ---------- */
  case "SRAM":

   pack = generateBasePack(5)
   pack.push(randomCard(cards))

   break

  /* ---------- SACRIEUR ---------- */
  case "SACRIEUR":

   pack = generateBasePack(5)

   pack = pack.map(c=>{

    if(["S","SSR"].includes(c.rarity)) return c

    if(Math.random()<0.5){
     return randomCard(cards.filter(x=>!["SSR"].includes(x.rarity)))
    }

    return c

   })

   break

  /* ---------- ZOBAL ---------- */
  case "ZOBAL":

   pack = generateBasePack(5)

   const boostCount = randomInt(1,2)

   for(let i=0;i<boostCount;i++){

    const index = Math.floor(Math.random()*pack.length)
    const c = pack[index]

    if(!c || c.rarity==="SSR") continue

    const next = rarityOrder[rarityOrder.indexOf(c.rarity)+1]

    const pool = cards.filter(x=>x.rarity===next)

    if(pool.length) pack[index] = randomCard(pool)

   }

   pack.push(randomCard(cards))

   break

  /* ---------- HUPPERMAGE ---------- */
  case "HUPPERMAGE":

   pack = generateBasePack(5)

   const bonus = randomInt(1,3)

   for(let i=0;i<bonus;i++){
    pack.push(randomCard(cards))
   }

   break

  /* ---------- PANDAWA ---------- */
  case "PANDAWA":

   pack = generateBasePack(5)

   for(let i=0;i<pack.length;i++){

    const r = pack[i].rarity

    let chance = 0.1

    if(r==="U") chance=0.3
    if(r==="R") chance=0.2
    if(r==="SR") chance=0.15

    if(Math.random()<chance){
     pack.push({...pack[i]})
    }

   }

   break

  /* ---------- OSAMODAS ---------- */
  case "OSAMODAS":

   const basePool = cards.filter(c=>["R","SR","HR","UR"].includes(c.rarity))
   const base = randomCard(basePool)

   const size = randomInt(7,10)

   pack = []

   for(let i=0;i<size;i++){
    pack.push({...base})
   }

   break

  /* ---------- ECAFLIP ---------- */
  case "ECAFLIP":

   pack = cards
    .filter(c=>["SR","HR","UR","S","SSR"].includes(c.rarity))
    .sort(()=>Math.random()-0.5)
    .slice(0,5)

   break

  /* ---------- OUGINAK ---------- */
  case "OUGINAK":

   pack = cards
    .filter(c=>["C","U","R"].includes(c.rarity))
    .sort(()=>Math.random()-0.5)
    .slice(0,5)

   pack.push(randomCard(cards))
   pack.push(randomCard(cards))

   break

  /* ---------- FECA ---------- */
  case "FECA":

   pack = cards
    .filter(c=>!["C","U"].includes(c.rarity))
    .sort(()=>Math.random()-0.5)
    .slice(0,5)

   break

  /* ---------- ENUTROF ---------- */
  case "ENUTROF":

   pack = generateBasePack(5)

   break

  /* ---------- ROUBLARD ---------- */
  case "ROUBLARD":

   pack = generateBasePack(8)

   break

  /* ---------- STEAMER ---------- */
  case "STEAMER":

   pack = []

   for(let i=0;i<5;i++){

    const randomRarity = rarityOrder[Math.floor(Math.random()*rarityOrder.length)]

    const pool = cards.filter(c=>c.rarity===randomRarity)

    if(pool.length){
     pack.push(randomCard(pool))
    }else{
     pack.push(randomCard(cards))
    }

   }

   break

  /* ---------- ELIOTROPE ---------- */
  case "ELIOTROPE":

   const hr = randomCard(cards.filter(c=>c.rarity==="HR"))
   const ur = randomCard(cards.filter(c=>c.rarity==="UR"))
   const s = randomCard(cards.filter(c=>c.rarity==="S"))

   pack = [hr,ur,s].filter(Boolean)

   break

  /* ---------- FORGELANCE ---------- */
  case "FORGELANCE":

   pack = generateBasePack(5)

   pack = pack.map(c=>{

    if(c.rarity==="SSR") return c

    const next = rarityOrder[rarityOrder.indexOf(c.rarity)+1]

    const pool = cards.filter(x=>x.rarity===next)

    if(pool.length) return randomCard(pool)

    return c

   })

   break

 }

 return pack
}

module.exports = {
 generateEventPack
}