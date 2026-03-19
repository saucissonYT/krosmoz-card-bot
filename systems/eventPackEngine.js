const { getCards } = require("./cardRegistry")
const { generatePack, generateGlobalPack, generateCustomPack } = require("./packEngine")

const cards = getCards()

const rarityOrder=["C","U","R","SR","HR","UR","S","SSR"]

/* ================= PRECOMPUTE ================= */

const cardsByRarity = {}
for(const r of rarityOrder){
 cardsByRarity[r] = cards.filter(c=>c.rarity===r)
}

function randomCard(pool){
 return pool[Math.floor(Math.random()*pool.length)]
}

function upgradeRarity(card){
 const i = rarityOrder.indexOf(card.rarity)
 const next = rarityOrder[i+1]
 if(!next) return card
 return randomCard(cardsByRarity[next]) || card
}

function upgradeSoftUR(card){
 const i = rarityOrder.indexOf(card.rarity)
 const target = Math.min(i+2, rarityOrder.indexOf("UR"))
 return randomCard(cardsByRarity[rarityOrder[target]]) || card
}

function downgradeRarity(card){
 const i = rarityOrder.indexOf(card.rarity)
 const prev = rarityOrder[i-1]
 if(!prev) return card
 return randomCard(cardsByRarity[prev]) || card
}

function limitSSR(pack){
 let found=false
 return pack.map(c=>{
  if(c.rarity==="SSR"){
   if(found){
    return randomCard(cardsByRarity["S"])
   }
   found=true
  }
  return c
 })
}

/* ================= ENGINE ================= */

function generateEventPack(user,event){

 let pack = generatePack(user)

 let flags=[]
 let meta={
  mutations:[],
  upgrades:[],
  duplicates:[],
  added:[],
  removed:[],
  chaos:[],
  downgrades:[],
  jackpot:false,
  luck:false
 }

 switch(event.key){

  /* ===== IOP ===== */
  case "iop":{
   const newPack=[]
   newPack.push(randomCard(cardsByRarity["HR"]))
   newPack.push(randomCard(cardsByRarity["UR"]))

   while(newPack.length<pack.length){
    newPack.push(randomCard(
     [...cardsByRarity["HR"], ...cardsByRarity["UR"], ...cardsByRarity["S"]]
    ))
   }

   pack = newPack
   break
  }

  /* ===== CRA ===== */
  case "cra":{
   if(event.data?.targetId){
    let count=0
    for(let i=0;i<pack.length;i++){
     if(Math.random()<0.2 && count<2){
      const target = cards.find(c=>c.id===event.data.targetId)
      if(target){
       pack[i]=target
       count++
      }
     }
    }
   }
   break
  }

  /* ===== XELOR (FIX UX READY) ===== */
  case "xelor":{
   pack.sort((a,b)=>rarityOrder.indexOf(a.rarity)-rarityOrder.indexOf(b.rarity))

   const removed = pack.splice(0,Math.floor(Math.random()*2)+1)
   meta.removed = removed.map(c=>c.name)

   const addCount=Math.floor(Math.random()*3)+1

   for(let i=0;i<addCount;i++){
    const c=randomCard(cards)
    pack.push(c)

    meta.added.push({
     name:c.name
    })
   }

   break
  }

  /* ===== SRAM ===== */
  case "sram":{
   pack.push(randomCard(cards))
   break
  }

  /* ===== SACRIEUR ===== */
  case "sacrieur":{
   pack = pack.map(c=>{
    if(Math.random()<0.5 && !["S","SSR"].includes(c.rarity)){
     const newCard = upgradeSoftUR(c)
     meta.mutations.push(`${c.name} → ${newCard.name}`)
     return newCard
    }
    return c
   })
   break
  }

  /* ===== ZOBAL ===== */
  case "zobal":{
   const upgrades=Math.floor(Math.random()*2)+1

   for(let i=0;i<upgrades;i++){
    const idx=Math.floor(Math.random()*pack.length)
    if(pack[idx].rarity !== "SSR"){
     const before=pack[idx]
     const after=upgradeRarity(before)
     pack[idx]=after
     meta.upgrades.push(`${before.name} → ${after.name}`)
    }
   }

   pack.push(randomCard(cards))
   break
  }

  /* ===== HUPPERMAGE ===== */
  case "huppermage":{
   const bonus=Math.floor(Math.random()*3)+1

   for(let i=0;i<bonus;i++){
    const pool = Math.random()<0.5
     ? [...cardsByRarity["S"], ...cardsByRarity["UR"]]
     : cards

    const c=randomCard(pool)
    pack.push(c)
    meta.added.push(c.name)
   }
   break
  }

  /* ===== PANDAWA (FIX CRITIQUE) ===== */
  case "pandawa":{
   const newPack=[]

   for(const c of pack){

    newPack.push(c)

    let chance=0.3
    if(c.rarity==="UR") chance=0.2
    if(c.rarity==="S") chance=0.1
    if(c.rarity==="SSR") chance=0.05

    if(Math.random()<chance){

     const clone = {...c}
     newPack.push(clone)

     meta.duplicates.push({
      original:c.name,
      copy:clone.name
     })
    }
   }

   pack=newPack
   break
  }

  /* ===== OSAMODAS ===== */
  case "osamodas":{
   const pool = [...cardsByRarity["SR"], ...cardsByRarity["HR"], ...cardsByRarity["UR"], ...cardsByRarity["S"]]
   const base=randomCard(pool)

   pack=[]
   for(let i=0;i<5;i++){
    if(Math.random()<0.25){
     pack.push(randomCard(pool))
    } else {
     pack.push(base)
    }
   }

   break
  }

  /* ===== ECAFLIP ===== */
  case "ecaflip":{
   const roll = Math.random()

   if(roll < 0.6){
    meta.jackpot = true
    pack = generateCustomPack(
     [...cardsByRarity["HR"], ...cardsByRarity["UR"], ...cardsByRarity["S"], ...cardsByRarity["SSR"]],
     5
    )
   } else {
    meta.luck = true
    pack = pack.map(c=>{
     if(Math.random()<0.7){
      return upgradeRarity(upgradeRarity(c))
     }
     return upgradeRarity(c)
    })
   }

   break
  }

  /* ===== OUGINAK ===== */
  case "ouginak":{
   pack = generateCustomPack(
    [...cardsByRarity["C"], ...cardsByRarity["U"], ...cardsByRarity["R"]],
    7
   )

   pack = pack.map(c=>{
    if(Math.random()<0.6){
     const downgraded = downgradeRarity(c)
     meta.downgrades.push(`${c.name} → ${downgraded.name}`)
     return downgraded
    }
    return c
   })

   break
  }

  /* ===== FECA ===== */
  case "feca":{
   pack = pack.filter(c=>!["C","U"].includes(c.rarity))

   while(pack.length<5){
    pack.push(randomCard(cardsByRarity["R"]))
   }

   if(Math.random()<0.01){
    meta.jackpot=true
   }

   break
  }

  /* ===== ENUTROF ===== */
  case "enutrof":{
   if(Math.random()<0.01){
    meta.jackpot=true
   }
   break
  }

  /* ===== ROUBLARD ===== */
  case "roublard":{
   pack = pack.slice(0,5)
   pack.push(...Array(3).fill(0).map(()=>randomCard(cards)))
   break
  }

  /* ===== STEAMER ===== */
  case "steamer":{
   pack = generateGlobalPack(5)
   meta.chaos = pack.map(c=>c.rarity)
   break
  }

  /* ===== ELIOTROPE ===== */
  case "eliotrope":{
   pack=[
    randomCard(cardsByRarity["HR"]),
    randomCard(cardsByRarity["UR"]),
    randomCard(cardsByRarity["S"])
   ]
   break
  }

  /* ===== ENIRIPSA ===== */
  case "eniripsa":{
   pack = pack.filter(c=>!["C","U","R"].includes(c.rarity))

   while(pack.length<6){
    pack.push(randomCard(cardsByRarity["SR"]))
   }

   break
  }

  /* ===== SADIDA ===== */
  case "sadida":{
   let dup=0

   for(const c of [...pack]){
    if(Math.random()<0.35 && dup<2){
     pack.push({...c})
     meta.duplicates.push({
      original:c.name,
      copy:c.name
     })
     dup++
    }
   }
   break
  }

  /* ===== FORGELANCE ===== */
  case "forgelance":{
   pack = pack.map(c=>upgradeRarity(c))
   break
  }

 }

 if(!event.allowMultiSSR){
  pack = limitSSR(pack)
 }

 return {pack,flags,meta}
}

module.exports = {
 generateEventPack
}