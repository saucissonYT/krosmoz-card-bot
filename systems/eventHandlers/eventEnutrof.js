module.exports = {
 key: "enutrof",

 generate(user, basePack){

  return {
   pack: basePack,
   meta: {
    ux: ["💰 Richesse", "💰 Multiplicateur"],
    jackpot: Math.random() < 0.01
   }
  }
 }

}