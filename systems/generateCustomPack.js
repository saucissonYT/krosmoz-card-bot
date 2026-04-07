function randomCard(pool){
 return pool[Math.floor(Math.random()*pool.length)]
}

function generateCustomPack(pool,size=5){

 if(!pool || pool.length === 0){
  console.error("❌ EMPTY POOL")
  return []
 }

 const pack=[]

 for(let i=0;i<size;i++){
  pack.push(randomCard(pool))
 }

 return pack
}

module.exports = {
 generateCustomPack
}
