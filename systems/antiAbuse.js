let globalCooldown = 0

function checkGlobalCooldown(){

 if(Date.now()-globalCooldown < 10000){

  return false

 }

 globalCooldown = Date.now()

 return true
}

module.exports={
 checkGlobalCooldown
}