module.exports = {
 key: "pandawa",

 generate(user, basePack){

  const pack = []
  const duplicates = []

  for(const c of basePack){

   pack.push(c)

   let chance = 0.3
   if(c.rarity === "UR") chance = 0.2
   if(c.rarity === "S") chance = 0.1
   if(c.rarity === "SSR") chance = 0.05

   if(Math.random() < chance){

    const clone = { ...c }

    pack.push(clone)

    duplicates.push({
     original: c.name,
     copy: clone.name
    })
   }
  }

  return {
   pack,
   meta: {
    duplicates,
    ux: ["🍺 Duplication", "🍻 Fête"]
   }
  }
 }
}