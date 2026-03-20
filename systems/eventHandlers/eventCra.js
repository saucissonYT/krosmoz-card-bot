const { getCards } = require("../cardRegistry")

const cards = getCards()

module.exports = {

 key:"cra",

 generate(user, basePack, event){

  let pack = [...basePack]

  // Fix : guard sur event.data + comparaison robuste avec Number()
  if(event.data?.targetId){

   const targetId = Number(event.data.targetId)

   let count = 0

   for(let i=0;i<pack.length;i++){

    if(Math.random() < 0.2 && count < 2){

     const target = cards.find(c => Number(c.id) === targetId)

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