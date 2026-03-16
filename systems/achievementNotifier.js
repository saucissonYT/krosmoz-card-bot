const achievements = require("./achievementRegistry")

async function notifyAchievements(interaction,list){

 for(const id of list){

  const a = achievements[id]

  if(!a) continue

  let message = `🏆 **Succès débloqué !**

${a.badge} **${a.name}**`

  if(a.description){
   message += `
📝 ${a.description}`
  }

  if(a.title){
   message += `
🎖️ Titre obtenu : **${a.title}**`
  }

  await interaction.followUp({
   content:message,
   flags:64
  })

 }

}

module.exports = {
 notifyAchievements
}