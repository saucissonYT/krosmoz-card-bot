const { getCards } = require("./cardRegistry")

const cards = getCards()

const rarityOrder=["C","U","R","SR","HR","UR","S","SSR"]

function randomCard(pool){
 return pool[Math.floor(Math.random()*pool.length)]
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
  .filter(c=>!["C","U"].includes(c.rarity))
  .sort(()=>Math.random()-0.5)
  .slice(0,5)
}

/* ---------- SADIDA ---------- */
function sadidaPack(){
 const pack=generateBasePack(5)
 for(let i=0;i<2;i++){
  if(Math.random()<0.30){
   const c=pack[Math.floor(Math.random()*pack.length)]
   if(c) pack.push({...c})
  }
 }
 return pack
}

/* ---------- MAIN ---------- */

function generateEventPack(user,event){

 let pack = generateBasePack(5)

 switch(event.id){

  case "ENIRIPSA":
   pack = eniripsaPack()
   break

  case "SADIDA":
   pack = sadidaPack()
   break

  case "CRA":
   if(event.data?.targetId){
    pack = generateBasePack(5)
    for(let i=0;i<pack.length;i++){
     if(Math.random()<0.20){
      const target = cards.find(c=>c.id===event.data.targetId)
      if(target) pack[i]=target
     }
    }
   }
   break

  case "XELOR":
   pack = generateBasePack(5)
   if(Math.random()<0.33){
    pack = generateBasePack(5)
   }
   break

  case "IOP":
   pack = generateBasePack(5)
   if(Math.random()<0.5){
    pack.push(randomCard(cards.filter(c=>["UR","S"].includes(c.rarity))))
   }
   break

  case "SRAM":
   pack = generateBasePack(5)
   pack.push(randomCard(cards))
   break

  case "SACRIEUR":
   pack = generateBasePack(5)
   pack = pack.map(c=>{
    if(Math.random()<0.25){
     return randomCard(cards)
    }
    return c
   })
   break

  case "ZOBAL":
   pack = generateBasePack(5)
   const c = pack[0]
   if(c && c.rarity !== "SSR"){
    const i = rarityOrder.indexOf(c.rarity)+1
    const next = rarityOrder[i]
    const pool = cards.filter(x=>x.rarity===next)
    if(pool.length) pack[0] = randomCard(pool)
   }
   break

  case "HUPPERMAGE":
   pack = generateBasePack(5)
   if(Math.random()<0.5){
    pack.push(randomCard(cards))
   }
   break

  case "PANDAWA":
   pack = generateBasePack(5)
   if(Math.random()<0.4){
    pack.push({...pack[0]})
   }
   break

  case "OSAMODAS":
   pack = generateBasePack(1)
   const base = pack[0]
   for(let i=0;i<6;i++){
    pack.push({...base})
   }
   break

  case "ECAFLIP":
   if(Math.random()<0.5){
    pack = generateBasePack(5)
   }else{
    pack = cards
     .filter(c=>["UR","S","SSR"].includes(c.rarity))
     .sort(()=>Math.random()-0.5)
     .slice(0,5)
   }
   break

  case "FECA":
   pack = cards
    .filter(c=>!["C","U"].includes(c.rarity))
    .sort(()=>Math.random()-0.5)
    .slice(0,5)
   break

  case "ROUBLARD":
   pack = generateBasePack(7)
   break

  case "STEAMER":
   pack = cards
    .sort(()=>Math.random()-0.5)
    .slice(0,5)
   break

  case "ELIOTROPE":
   const p1 = generateBasePack(5)
   const p2 = generateBasePack(5)
   pack = Math.random()<0.5 ? p1 : p2
   break

  case "ENUTROF":
   pack = generateBasePack(5)
   break

  case "OUGINAK":
   pack = cards
    .filter(c=>["C","U","R"].includes(c.rarity))
    .sort(()=>Math.random()-0.5)
    .slice(0,5)
   break

  case "FORGELANCE":
   pack = generateBasePack(5)
   pack = pack.map(c=>{
    if(Math.random()<0.30){
     const i=rarityOrder.indexOf(c.rarity)+1
     const next=rarityOrder[i]
     const pool=cards.filter(x=>x.rarity===next)
     if(pool.length) return randomCard(pool)
    }
    return c
   })
   break

 }

 return pack
}

module.exports = {
 generateEventPack
}