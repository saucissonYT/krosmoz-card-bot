const { EmbedBuilder } = require("discord.js")
const setsData = require("../../cards/sets.json")
const { getUser, save } = require("../../systems/userSystem")

const sets = Array.isArray(setsData) ? setsData : setsData.sets

function progressBar(value,max){
 const safe = value ?? 0
 const filled=Math.floor((safe/max)*10)
 const empty=10-filled
 return "🟩".repeat(filled)+"⬛".repeat(empty)
}

/* ---------- SSR RATE ---------- */
/*
 * FIX v0.24: les taux affichés étaient FAUX.
 *
 * AVANT (pity.js) :
 *   < 20 → 0.05%
 *   < 30 → 0.10%
 *   < 40 → 0.30%
 *   < 49 → 1.00%
 *
 * APRÈS (aligné sur pack.js) :
 *   < 20 → 0.05%
 *   < 30 → 0.10%
 *   < 35 → 0.30%
 *   < 40 → 0.50%   ← NOUVEAU
 *   < 43 → 1.00%
 *   < 46 → 2.00%   ← NOUVEAU
 *   < 49 → 5.00%   ← NOUVEAU
 *
 * Les joueurs voyaient des taux sous-estimés dans /pity,
 * ce qui ne reflétait pas la vraie soft pity progressive.
 */
function getSSRRate(pity){
 if(pity < 20) return 0.0005
 if(pity < 30) return 0.001
 if(pity < 35) return 0.003
 if(pity < 40) return 0.005
 if(pity < 43) return 0.01
 if(pity < 46) return 0.02
 if(pity < 49) return 0.05
 return 0.05
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

  let patched = false

  const lines=[]

  for(const set of sets){

   if(!user.pity[set.id]){
    user.pity[set.id]={UR:0,S:0,SSR:0}
    patched = true
   }

   const pity = user.pity[set.id]

   /* 🔥 PATCH DES ANCIENS USERS */
   if(pity.UR === undefined){ pity.UR = 0; patched = true }
   if(pity.S === undefined){ pity.S = 0; patched = true }
   if(pity.SSR === undefined){ pity.SSR = 0; patched = true }

   const ur = pity.UR
   const s = pity.S
   const ssr = pity.SSR

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

  /* 🔥 SAVE SI PATCH */
  if(patched)
   save()

  const embed=new EmbedBuilder()
   .setTitle(`🎴 Pity de ${interaction.user.username}`)
   .setDescription(lines.join("\n\n"))
   .setColor("#f1c40f")

  await interaction.reply({
   embeds:[embed]
  })

 }

}