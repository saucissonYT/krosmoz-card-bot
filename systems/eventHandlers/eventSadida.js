module.exports = {
 key: "sadida",

 generate(user, basePack){

  let pack = [...basePack]
  let duplicates = []
  let count = 0

  for(const c of [...basePack]){

   if(Math.random() < 0.35 && count < 2){

    const clone = { ...c }

    pack.push(clone)

    duplicates.push({
     original: c.name,
     copy: clone.name
    })

    count++
   }
  }

  return {
   pack,
   meta: {
    duplicates,
    ux: ["🌿 Croissance", "🌱 Nature"]
   }
  }
 }
}