const achievements = require("./achievementRegistry")

async function notifyAchievements(interaction,list){

 for(const id of list){

  const a = achievements[id]

  if(!a) continue

  await interaction.followUp({
   content:`🏆 **Succès débloqué !**

${a.badge} **${a.name}**
🎖️ Titre obtenu : **${a.title}**`,
   ephemeral:true
  })

 }

}

module.exports = {
 notifyAchievements
}