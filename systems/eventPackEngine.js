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

function generateEventPack(user,event){

 let pack = generateBasePack(5)
 let flags = []

 switch(event.id){

  /* ================= IOP ================= */
  case "iop":
   pack = []

   const hrPool = cards.filter(c=>c.rarity==="HR")
   const urPool = cards.filter(c=>c.rarity==="UR")

   pack.push(randomCard(hrPool))
   pack.push(randomCard(urPool))

   const boostPool = cards.filter(c=>["HR","UR","S"].includes(c.rarity))

   while(pack.length < 5){
    pack.push(randomCard(boostPool))
   }

   flags.push("🔥 Minimum 1 HR + 1 UR garanti")
   break

  /* ================= CRA ================= */
  case "cra":
   pack = generateBasePack(5)

   if(event.data?.targetId){
    let count = 0

    for(let i=0;i<pack.length;i++){
     if(Math.random()<0.20 && count < 2){
      const target = cards.find(c=>c.id===event.data.targetId)
      if(target){
       pack[i]=target
       count++
      }
     }
    }

    flags.push(`🎯 Cible : ${event.data.targetName}`)
   }
   break

  /* ================= XELOR ================= */
  case "xelor":
   pack = generateBasePack(5)

   pack.sort((a,b)=>rarityOrder.indexOf(a.rarity)-rarityOrder.indexOf(b.rarity))

   const removedCount = Math.floor(Math.random()*2)+1
   const removed = pack.splice(0, removedCount)

   const addCount = Math.floor(Math.random()*3)+1

   for(let i=0;i<addCount;i++){
    pack.push(randomCard(cards))
   }

   flags.push(`⏳ ${removed.length} retirée(s), ${addCount} ajoutée(s)`)
   break

  /* ================= SRAM ================= */
  case "sram":
   pack = generateBasePack(5)
   pack.push(randomCard(cards))
   flags.push("🕶️ Invisible +1 carte")
   break

  /* ================= SACRIEUR ================= */
  case "sacrieur":
   pack = generateBasePack(5)

   pack = pack.map(c=>{
    if(Math.random()<0.5 && !["S","SSR"].includes(c.rarity)){
     const index = rarityOrder.indexOf(c.rarity)
     const maxIndex = Math.min(index + 2, rarityOrder.indexOf("UR"))

     const newRarity = rarityOrder[Math.floor(Math.random()*(maxIndex-index))+index+1]

     const pool = cards.filter(x=>x.rarity===newRarity)

     if(pool.length){
      const newCard = randomCard(pool)
      flags.push(`💀 ${c.name} → ${newCard.rarity}`)
      return newCard
     }
    }
    return c
   })
   break

  /* ================= ZOBAL ================= */
  case "zobal":
   pack = generateBasePack(5)

   const upgrades = Math.floor(Math.random()*2)+1

   for(let i=0;i<upgrades;i++){
    const idx = Math.floor(Math.random()*pack.length)
    pack[idx] = upgradeRarity(pack[idx])
   }

   pack.push(randomCard(cards))

   flags.push(`🎭 ${upgrades} upgrade +1 carte`)
   break

  /* ================= HUPPERMAGE ================= */
  case "huppermage":
   pack = generateBasePack(5)

   const bonus = Math.floor(Math.random()*3)+1

   const sBoostPool = cards.filter(c=>["S","SSR"].includes(c.rarity))

   for(let i=0;i<bonus;i++){
    pack.push(randomCard(Math.random()<0.5 ? sBoostPool : cards))
   }

   flags.push(`🧠 +${bonus} cartes (S boost)`)
   break

  /* ================= PANDAWA ================= */
  case "pandawa":
   pack = generateBasePack(5)

   const newPack=[]

   for(const c of pack){

    newPack.push(c)

    let chance = 0.3
    if(c.rarity==="UR") chance = 0.2
    if(c.rarity==="S") chance = 0.1
    if(c.rarity==="SSR") chance = 0.05

    if(Math.random()<chance){
     newPack.push({...c})
     flags.push(`🍺 Duplication ${c.name}`)
    }
   }

   pack = newPack
   break

  /* ================= OSAMODAS ================= */
  case "osamodas":
   const highPool = cards.filter(c=>["R","SR","HR","UR","S"].includes(c.rarity))
   const base = randomCard(highPool)

   const size = Math.floor(Math.random()*4)+7

   pack = []

   for(let i=0;i<size;i++){
    pack.push({...base})
   }

   flags.push(`🐉 Pack homogène (${size})`)
   break

  /* ================= ECAFLIP ================= */
  case "ecaflip":
   if(Math.random()<0.6){
    pack = cards.filter(c=>["UR","S","SSR"].includes(c.rarity))
     .sort(()=>Math.random()-0.5)
     .slice(0,5)
    flags.push("🎲 RNG très chanceuse")
   }else{
    pack = generateBasePack(5)
   }
   break

  /* ================= OUGINAK ================= */
  case "ouginak":
   pack = cards.filter(c=>["C","U","R"].includes(c.rarity))
    .sort(()=>Math.random()-0.5)
    .slice(0,7)

   flags.push("🐺 RNG très mauvaise +2 cartes")
   break

  /* ================= FECA ================= */
  case "feca":
   pack = cards.filter(c=>!["C","U"].includes(c.rarity))
    .sort(()=>Math.random()-0.5)
    .slice(0,5)

   flags.push("🛡️ No C/U + XP boost")
   break

  /* ================= ENUTROF ================= */
  case "enutrof":
   pack = generateBasePack(5)
   flags.push("💰 Kamas x5 + jackpot")
   break

  /* ================= ROUBLARD ================= */
  case "roublard":
   pack = generateBasePack(8)
   flags.push("💣 +3 cartes")
   break

  /* ================= STEAMER ================= */
  case "steamer":
   pack = []

   for(let i=0;i<5;i++){
    const randomIndex = Math.floor(Math.random()*rarityOrder.length)
    const rarity = rarityOrder[randomIndex]
    const pool = cards.filter(c=>c.rarity===rarity)

    if(pool.length){
     pack.push(randomCard(pool))
    }
   }

   flags.push("⚙️ RNG chaotique")
   break

  /* ================= ELIOTROPE ================= */
  case "eliotrope":
   pack = [
    randomCard(cards.filter(c=>c.rarity==="HR")),
    randomCard(cards.filter(c=>c.rarity==="UR")),
    randomCard(cards.filter(c=>c.rarity==="S"))
   ]

   flags.push("🌀 HR + UR + S")
   break

  /* ================= ENIRIPSA ================= */
  case "eniripsa":
   pack = cards.filter(c=>!["C","U","R"].includes(c.rarity))
    .sort(()=>Math.random()-0.5)
    .slice(0,6)

   flags.push("✨ Pas de faibles +1 carte")
   break

  /* ================= SADIDA ================= */
  case "sadida":
   pack = generateBasePack(5)

   let dupCount = 0

   for(const c of [...pack]){
    if(Math.random()<0.35 && dupCount < 2){
     pack.push({...c})
     dupCount++
     flags.push(`🌿 Duplication ${c.name}`)
    }
   }
   break

  /* ================= FORGELANCE ================= */
  case "forgelance":
   pack = generateBasePack(5)

   pack = pack.map(c=>{
    const upgraded = upgradeRarity(c)
    if(upgraded !== c){
     flags.push(`⚔️ ${c.name} → ${upgraded.rarity}`)
    }
    return upgraded
   })
   break

 }

 return {pack,flags}
}

module.exports = {
 generateEventPack
}