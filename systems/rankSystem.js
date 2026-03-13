const ranks = [

 {name:"Nouveau",min:0,emoji:"🟢"},
 {name:"Bronze",min:3,emoji:"🥉"},
 {name:"Argent",min:6,emoji:"🥈"},
 {name:"Or",min:10,emoji:"🥇"},
 {name:"Platine",min:15,emoji:"💠"},
 {name:"Diamant",min:20,emoji:"💎"},
 {name:"Mythique",min:30,emoji:"🌟"},
 {name:"Légende",min:50,emoji:"👑"}

]

function getRank(user){

 const count=user.achievements?.length||0

 let rank=ranks[0]

 for(const r of ranks){

  if(count>=r.min)
   rank=r

 }

 return rank

}

module.exports={
 ranks,
 getRank
}