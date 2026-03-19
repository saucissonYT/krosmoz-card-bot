const { getCards } = require("../cardRegistry")

const cards = getCards()

module.exports = {

 key:"cra",

 generate(user, basePack, event){

  let pack = [...basePack]

  if(event.data?.targetId){

   let count = 0

   for(let i=0;i<pack.length;i++){
    if(Math.random()<0.2 && count<2){

     const target = cards.find(c=>c.id===event.data.targetId)

     if(target){
      pack[i] = target
      count++
     }
    }
   }
  }

  return {
   pack,
   meta:{
    ux:["🎯 Tir ciblé","🏹 Précision parfaite"]
   }
  }
 }

}