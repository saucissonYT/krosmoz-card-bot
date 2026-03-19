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

function upgradeRarity(card){
 const index = rarityOrder.indexOf(card.rarity)
 if(index === -1) return card

 const next = rarityOrder[index+1]
 if(!next) return card

 const pool = cards.filter(c=>c.rarity===next)
 return pool.length ? randomCard(pool) : card
}

function limitSSR(pack){
 let found=false

 return pack.map(c=>{
  if(c.rarity==="SSR"){
   if(found){
    const pool = cards.filter(x=>x.rarity==="S")
    return randomCard(pool)
   }
   found=true
  }
  return c
 })
}

function generateEventPack(user,event){

 let pack = generateBasePack(5)
 let flags = []
 let meta = {
  mutations:[],
  upgrades:[],
  duplicates:[],
  added:[]
 }

 switch(event.id){

  case "iop":{
   pack=[]
   const hr=cards.filter(c=>c.rarity==="HR")
   const ur=cards.filter(c=>c.rarity==="UR")
   const boost=cards.filter(c=>["HR","UR","S"].includes(c.rarity))

   pack.push(randomCard(hr))
   pack.push(randomCard(ur))

   while(pack.length<5){
    pack.push(randomCard(boost))
   }

   flags.push("🔥 Rage du Iop")
   break
  }

  case "cra":{
   pack=generateBasePack(5)

   if(event.data?.targetId){
    let count=0

    for(let i=0;i<pack.length;i++){
     if(Math.random()<0.20 && count<2){
      const target=cards.find(c=>c.id===event.data.targetId)
      if(target){
       pack[i]=target
       count++
      }
     }
    }

    flags.push(`🎯 ${event.data.targetName}`)
   }
   break
  }

  case "xelor":{
   pack=generateBasePack(5)

   pack.sort((a,b)=>rarityOrder.indexOf(a.rarity)-rarityOrder.indexOf(b.rarity))

   const removed=pack.splice(0,Math.floor(Math.random()*2)+1)

   const addCount=Math.floor(Math.random()*3)+1

   for(let i=0;i<addCount;i++){
    const c=randomCard(cards)
    pack.push(c)
    meta.added.push(c.name)
   }

   meta.removed = removed.map(c=>c.name)

   flags.push("⏳ Temps altéré")
   break
  }

  case "sram":{
   pack=generateBasePack(5)
   pack.push(randomCard(cards))
   break
  }

  case "sacrieur":{
   pack=generateBasePack(5)

   pack=pack.map(c=>{
    if(Math.random()<0.5 && !["S","SSR"].includes(c.rarity)){
     const newCard=upgradeRarity(upgradeRarity(c))
     meta.mutations.push(`${c.name} → ${newCard.name}`)
     return newCard
    }
    return c
   })
   break
  }

  case "zobal":{
   pack=generateBasePack(5)

   const upgrades=Math.floor(Math.random()*2)+1

   for(let i=0;i<upgrades;i++){
    const idx=Math.floor(Math.random()*pack.length)
    const before=pack[idx]
    const after=upgradeRarity(before)

    meta.upgrades.push(`${before.name} → ${after.name}`)

    pack[idx]=after
   }

   pack.push(randomCard(cards))
   break
  }

  case "huppermage":{
   pack=generateBasePack(5)

   const bonus=Math.floor(Math.random()*3)+1

   for(let i=0;i<bonus;i++){
    const c=randomCard(cards)
    pack.push(c)
    meta.added.push(c.name)
   }

   break
  }

  case "pandawa":{
   pack=generateBasePack(5)

   const newPack=[]

   for(const c of pack){
    newPack.push(c)

    let chance=0.3
    if(c.rarity==="UR") chance=0.2
    if(c.rarity==="S") chance=0.1

    if(Math.random()<chance){
     newPack.push({...c})
     meta.duplicates.push(c.name)
    }
   }

   pack=newPack
   break
  }

  case "osamodas":{
   const base=randomCard(cards.filter(c=>["R","SR","HR","UR","S"].includes(c.rarity)))

   const size = Math.min(10, Math.max(3,
    base.rarity==="SSR"?3:
    base.rarity==="S"?3:
    base.rarity==="UR"?4:
    base.rarity==="HR"?4:
    base.rarity==="SR"?5:
    base.rarity==="R"?6:7
   ))

   pack=[]
   for(let i=0;i<size;i++){
    pack.push({...base})
   }

   break
  }

  case "ecaflip":{
   if(Math.random()<0.6){
    pack=cards.filter(c=>["UR","S","SSR"].includes(c.rarity))
     .sort(()=>Math.random()-0.5)
     .slice(0,5)
   }
   break
  }

  case "ouginak":{
   pack=cards.filter(c=>["C","U","R"].includes(c.rarity))
    .sort(()=>Math.random()-0.5)
    .slice(0,7)
   break
  }

  case "feca":{
   pack=cards.filter(c=>!["C","U"].includes(c.rarity))
    .sort(()=>Math.random()-0.5)
    .slice(0,5)
   break
  }

  case "enutrof":{
   pack=generateBasePack(5)
   if(Math.random()<0.01){
    meta.jackpot=true
   }
   break
  }

  case "roublard":{
   pack=generateBasePack(8)
   break
  }

  case "steamer":{
   pack=[]
   const allowed = ["R","SR","HR","UR","S"] // nerf

   for(let i=0;i<5;i++){
    const rarity = allowed[Math.floor(Math.random()*allowed.length)]
    const pool = cards.filter(c=>c.rarity===rarity)

    if(pool.length){
     const c=randomCard(pool)
     pack.push(c)
    }
   }

   meta.chaos = pack.map(c=>c.rarity)
   break
  }

  case "eliotrope":{
   pack=[
    randomCard(cards.filter(c=>c.rarity==="HR")),
    randomCard(cards.filter(c=>c.rarity==="UR")),
    randomCard(cards.filter(c=>c.rarity==="S"))
   ]
   break
  }

  case "eniripsa":{
   pack=cards.filter(c=>!["C","U","R"].includes(c.rarity))
    .sort(()=>Math.random()-0.5)
    .slice(0,6)
   break
  }

  case "sadida":{
   pack=generateBasePack(5)

   let dup=0

   for(const c of [...pack]){
    if(Math.random()<0.35 && dup<2){
     pack.push({...c})
     meta.duplicates.push(c.name)
     dup++
    }
   }
   break
  }

  case "forgelance":{
   pack=generateBasePack(5)
   pack=pack.map(c=>upgradeRarity(c))
   break
  }

 }

 pack = limitSSR(pack)

 return {pack,flags,meta}
}

module.exports = {
 generateEventPack
}