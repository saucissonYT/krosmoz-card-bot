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

function osamodasLimit(rarity){
 switch(rarity){
  case "SSR": return 3
  case "S": return 3
  case "UR": return 4
  case "HR": return 4
  case "SR": return 5
  case "R": return 6
  case "U": return 7
  case "C": return 7
  default: return 5
 }
}

function generateEventPack(user,event){

 let pack = generateBasePack(5)
 let flags = []
 let meta = {}

 switch(event.id){

  case "iop":{
   pack=[]
   const hr = cards.filter(c=>c.rarity==="HR")
   const ur = cards.filter(c=>c.rarity==="UR")
   const boost = cards.filter(c=>["HR","UR","S"].includes(c.rarity))

   pack.push(randomCard(hr))
   pack.push(randomCard(ur))

   while(pack.length<5){
    pack.push(randomCard(boost))
   }

   flags.push("🔥 Puissance du Iop")
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

    flags.push(`🎯 ${event.data.targetName} traqué`)
   }
   break
  }

  case "xelor":{
   pack=generateBasePack(5)

   pack.sort((a,b)=>rarityOrder.indexOf(a.rarity)-rarityOrder.indexOf(b.rarity))

   const removed=pack.splice(0,Math.floor(Math.random()*2)+1)

   const addedCount=Math.floor(Math.random()*3)+1
   const added=[]

   for(let i=0;i<addedCount;i++){
    const c=randomCard(cards)
    pack.push(c)
    added.push(c)
   }

   flags.push(`⏳ Xelor a altéré le temps`)
   meta.xelor={removed,added}
   break
  }

  case "sram":{
   pack=generateBasePack(5)
   pack.push(randomCard(cards))
   flags.push("🕶️ Invisible")
   break
  }

  case "sacrieur":{
   pack=generateBasePack(5)

   pack=pack.map(c=>{
    if(Math.random()<0.5 && !["S","SSR"].includes(c.rarity)){
     const upgraded=upgradeRarity(upgradeRarity(c))
     flags.push(`💀 ${c.name} mutée`)
     return upgraded
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
    pack[idx]=upgradeRarity(pack[idx])
   }

   pack.push(randomCard(cards))
   flags.push(`🎭 ${upgrades} cartes améliorées`)
   break
  }

  case "huppermage":{
   pack=generateBasePack(5)

   const bonus=Math.floor(Math.random()*3)+1
   const boost=cards.filter(c=>["S","SSR"].includes(c.rarity))

   for(let i=0;i<bonus;i++){
    pack.push(randomCard(Math.random()<0.5?boost:cards))
   }

   flags.push(`🧠 Énergie élémentaire`)
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
    if(c.rarity==="SSR") chance=0.05

    if(Math.random()<chance){
     newPack.push({...c})
     flags.push(`🍺 ${c.name} dupliquée`)
    }
   }

   pack=newPack
   break
  }

  case "osamodas":{
   const pool=cards.filter(c=>["R","SR","HR","UR","S"].includes(c.rarity))
   const base=randomCard(pool)

   const max=osamodasLimit(base.rarity)

   pack=[]
   for(let i=0;i<max;i++){
    pack.push({...base})
   }

   flags.push(`🐉 Troupeau (${max})`)
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
   const chaos=[]

   for(let i=0;i<5;i++){
    const rarity=rarityOrder[Math.floor(Math.random()*rarityOrder.length)]
    const pool=cards.filter(c=>c.rarity===rarity)

    if(pool.length){
     const c=randomCard(pool)
     pack.push(c)
     chaos.push(rarity)
    }
   }

   meta.chaos=chaos
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

 return {pack,flags,meta}
}

module.exports = {
 generateEventPack
}