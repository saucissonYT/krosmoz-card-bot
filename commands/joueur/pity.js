const { EmbedBuilder } = require("discord.js")
const setsData = require("../../cards/sets.json")
const { getUser } = require("../../systems/userSystem")

const sets = Array.isArray(setsData) ? setsData : setsData.sets

/* ---------- PROGRESS BAR ---------- */

function progressBar(value,max){

 const safe = value ?? 0

 const filled=Math.floor((safe/max)*10)
 const empty=10-filled

 return "🟩".repeat(filled)+"⬛".repeat(empty)
}

/* ---------- SSR RATE ---------- */

function getSSRRate(pity){

 if(pity < 20) return 0.0005
 if(pity < 30) return 0.001
 if(pity < 40) return 0.003
 if(pity < 49) return 0.01

 return 0.01
}

/* ---------- S RATE ---------- */

function getSRate(pity){

 if(pity < 15) return 0.0015
 if(pity < 20) return 0.003
 if(pity < 25) return 0.006
 if(pity < 28) return 0.012
 if(pity < 29) return 0.03

 return 0.03
}

/* ---------- FORMAT % ---------- */

function formatPercent(rate){
 return (rate * 100).toFixed(rate < 0.01 ? 2 : 1) + "%"
}

module.exports = {

 name:"pity",
 description:"Voir tes pity par set",

 async execute(interaction){

  const user = getUser(interaction.user.id)

  if(!user.pity)
   user.pity = {}

  const lines=[]

  for(const set of sets){

   if(!user.pity[set.id])
    user.pity[set.id]={UR:0,S:0,SSR:0}

   const pity = user.pity[set.id]

   const ur = pity.UR ?? 0
   const s = pity.S ?? 0
   const ssr = pity.SSR ?? 0

   const urBar = progressBar(ur,10)
   const sBar = progressBar(s,30)
   const ssrBar = progressBar(ssr,50)

   const sRate = formatPercent(getSRate(s))
   const ssrRate = formatPercent(getSSRRate(ssr))

   lines.push(
`**${set.name}**

🟡 UR : ${ur}/10
${urBar}

✨ S : ${s}/30 (**${sRate}**)
${sBar}

🌈 SSR : ${ssr}/50 (**${ssrRate}**)
${ssrBar}`
   )

  }

  const embed=new EmbedBuilder()
   .setTitle(`🎴 Pity de ${interaction.user.username}`)
   .setDescription(lines.join("\n\n"))
   .setColor("#f1c40f")

  await interaction.reply({
   embeds:[embed]
  })

 }

}