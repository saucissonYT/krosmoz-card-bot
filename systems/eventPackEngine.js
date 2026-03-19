const { generatePack } = require("./packEngine")
const handlers = require("./eventHandlerRegistry")

function limitSSR(pack){
 let found=false
 return pack.map(c=>{
  if(c.rarity==="SSR"){
   if(found){
    return c // ou downgrade
   }
   found=true
  }
  return c
 })
}

function generateEventPack(user,event){

 const basePack = generatePack(user)

 const handler = handlers[event.key]

 if(!handler){
  return { pack: basePack, meta:{} }
 }

 const result = handler.generate(user, basePack, event)

 let pack = result.pack || basePack
 let meta = result.meta || {}

 if(!event.allowMultiSSR){
  pack = limitSSR(pack)
 }

 return { pack, meta }
}

module.exports = {
 generateEventPack
}