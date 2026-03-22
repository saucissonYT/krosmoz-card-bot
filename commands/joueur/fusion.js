const { SlashCommandBuilder, EmbedBuilder } = require("discord.js")

const { RARITY_ORDER, RARITY_EMOJI, FUSION_COST } = require("../../systems/constants")
const { getCards } = require("../../systems/cardRegistry")
const { getUser, save } = require("../../systems/userSystem")
const { achievementCheck } = require("../../systems/achievementCheck")
const { notifyAchievements } = require("../../systems/achievementNotifier")
const { addXP } = require("../../systems/progressionSystem")
const { addBattlePassXP } = require("../../systems/battlePassService")
const { loadSets } = require("../../systems/setSystemFile")

function sleep(ms){
 return new Promise(r=>setTimeout(r,ms))
}

/* ---- Bonus helpers ---- */

function getFusionBonuses(userId, user){
 let gCrit = 0, gDouble = 0, gTriple = 0
 let pCrit = 0

 try{
  const { getUserGuildBonuses } = require("../../systems/guildBonuses")
  const gb = getUserGuildBonuses(userId)
  gCrit = gb.fusionCritBonus || 0
  gDouble = gb.fusionDoubleBonus || 0
  gTriple = gb.fusionTripleBonus || 0
 }catch(e){}

 try{
  const { getPlayerBonuses } = require("../../systems/playerBonuses")
  const pb = getPlayerBonuses(user.progression?.level || 1)
  pCrit = pb.fusionCritBonus || 0
 }catch(e){}

 return {
  critBonus: gCrit + pCrit,
  doubleBonus: gDouble,
  tripleBonus: gTriple
 }
}

module.exports={

 data: (() => {

  const rawSets = loadSets()
  const sets = Array.isArray(rawSets) ? rawSets : rawSets?.sets || []

  return new SlashCommandBuilder()
   .setName("fusion")
   .setDescription("Fusionner des doublons pour obtenir une rareté supérieure")
   .addStringOption(option=>{
    option.setName("set")
     .setDescription("Set des cartes")
     .setRequired(true)
    if(sets.length > 0)
     option.addChoices(...sets.slice(0,25).map(s=>({name:s.name,value:s.id})))
    return option
   })
   .addStringOption(option=>
    option.setName("rarete")
     .setDescription("Rareté à fusionner")
     .setRequired(true)
     .addChoices(
      {name:"C",value:"C"},{name:"U",value:"U"},
      {name:"R",value:"R"},{name:"SR",value:"SR"},
      {name:"HR",value:"HR"},{name:"UR",value:"UR"},
      {name:"S",value:"S"}
     )
   )
 })(),

 async execute(interaction){

  const cards = getCards()
  const user = getUser(interaction.user.id)
  const setName = interaction.options.getString("set")
  const rarity = interaction.options.getString("rarete")

  const index = RARITY_ORDER.indexOf(rarity)

  if(index===-1)
   return interaction.reply({content:"Rareté invalide.",flags:64})

  if(rarity==="SSR")
   return interaction.reply({content:"Impossible de fusionner des SSR.",flags:64})

  const cost = FUSION_COST[rarity]

  const pool = cards.filter(c=>c.set===setName && c.rarity===rarity)

  if(pool.length===0)
   return interaction.reply({content:"Aucune carte trouvée.",flags:64})

  let available=0

  for(const card of pool){
   const count = user.cards?.[card.id]||0
   if(count>1) available+=(count-1)
  }

  if(available<cost)
   return interaction.reply({
    content:`❌ Il faut **${cost} doublons ${RARITY_EMOJI[rarity]}**\n\nTu en as **${available}**.`,
    flags:64
   })

  /* CARTES UTILISÉES */

  let remaining=cost
  const usedCards={}

  for(const card of pool){
   const count = user.cards?.[card.id]||0
   const usable = Math.max(0,count-1)
   if(usable<=0) continue
   const take = Math.min(usable,remaining)
   user.cards[card.id]-=take
   remaining-=take
   usedCards[card.id]=(usedCards[card.id]||0)+take
   if(user.cards[card.id]<=0) delete user.cards[card.id]
   if(remaining<=0) break
  }

  /* STATS */

  if(!user.stats) user.stats={}

  user.stats.fusions=(user.stats.fusions||0)+1

  const now=Date.now()

  if(!user.stats.lastTripleReset || now-user.stats.lastTripleReset>86400000){
   user.stats.tripleFusionToday=0
   user.stats.lastTripleReset=now
  }

  /* ---- BONUS DE GUILDE + JOUEUR ---- */

  const fusionBonus = getFusionBonuses(interaction.user.id, user)

  /* RNG avec bonus appliqués */

  const baseCrit = 0.10
  const baseDouble = 0.10
  const baseTriple = 0.005

  const critChance = baseCrit + (fusionBonus.critBonus / 100)
  const doubleChance = baseDouble + (fusionBonus.doubleBonus / 100)
  const tripleChance = baseTriple + (fusionBonus.tripleBonus / 100)

  const roll=Math.random()

  let rarityGain=1
  let quantity=1
  let message=""
  let xpGain=15

  if(roll < tripleChance && user.stats.tripleFusionToday<1){
   rarityGain=3
   message="🌈 TRIPLE FUSION !!!"
   xpGain=50
   user.stats.tripleFusionToday++
   user.stats.tripleFusion=(user.stats.tripleFusion||0)+1
  }
  else if(roll < tripleChance + critChance){
   rarityGain=2
   message="🔥 Fusion critique !"
   xpGain=25
   user.stats.fusionCrit=(user.stats.fusionCrit||0)+1
  }
  else if(roll < tripleChance + critChance + doubleChance && ["C","U","R","SR"].includes(rarity)){
   quantity=2
   message="✨ Fusion double !"
   xpGain=25
   user.stats.fusionDouble=(user.stats.fusionDouble||0)+1
  }

  /* TYPE FUSION (pour achievements) */

  if(rarity==="C") user.stats.fusionCU=true
  if(rarity==="U") user.stats.fusionUR=true
  if(rarity==="R") user.stats.fusionRSR=true
  if(rarity==="SR") user.stats.fusionSRHR=true
  if(rarity==="HR") user.stats.fusionHRUR=true
  if(rarity==="UR") user.stats.fusionURS=true

  let targetIndex=index+rarityGain

  const maxIndex=RARITY_ORDER.indexOf("SSR")

  if(targetIndex>maxIndex)
   targetIndex=maxIndex

  const targetRarity=RARITY_ORDER[targetIndex]

  const rewardPool=cards.filter(c=>
   c.set===setName &&
   c.rarity===targetRarity
  )

  if(rewardPool.length===0)
   return interaction.reply({content:"Erreur de pool.",flags:64})

  /* EMBED START */

  const embed=new EmbedBuilder()
   .setTitle("⚗️ Fusion en cours...")
   .setDescription(`Fusion de **${cost} doublons ${RARITY_EMOJI[rarity]}**\n\nDoublons disponibles : **${available}**`)

  await interaction.reply({embeds:[embed]})
  const msg=await interaction.fetchReply()

  await sleep(900)

  embed.setDescription(`\n${cost} ${RARITY_EMOJI[rarity]}\n⬇\n${RARITY_EMOJI[targetRarity]}\n`)

  await msg.edit({embeds:[embed]})

  await sleep(900)

  /* REWARDS */

  const rewards=[]

  for(let i=0;i<quantity;i++){
   const card=rewardPool[Math.floor(Math.random()*rewardPool.length)]
   rewards.push(card)
   user.cards[card.id]=(user.cards[card.id]||0)+1
  }

  /* ACHIEVEMENT FUSION SSR */
  if(targetRarity === "SSR")
   user.stats.fusionSSRResult = (user.stats.fusionSSRResult || 0) + 1

  addXP(user,xpGain)
  await addBattlePassXP(interaction.user.id, "fusion")
  save(interaction.user.id)

  let unlocked=[]
  unlocked.push(...achievementCheck(user,"fusion"))
  unlocked.push(...achievementCheck(user,"collection"))
  unlocked.push(...achievementCheck(user,"pack"))

  /* DISPLAY */

  const usedLines=Object.entries(usedCards).map(([id,q])=>{
   const card=cards.find(c=>c.id==id)
   return `${RARITY_EMOJI[card.rarity]} ${card.name} ×${q}`
  })

  const rewardLines=rewards.map(c=>`${RARITY_EMOJI[c.rarity]} ${c.name}`)

  const fusionStats=`📊 **Stats fusion**\n\nFusions : **${user.stats.fusions||0}**\n🔥 Critiques : **${user.stats.fusionCrit||0}**\n✨ Doubles : **${user.stats.fusionDouble||0}**\n🌈 Triples : **${user.stats.tripleFusion||0}**`

  const remainingDup=available-cost

  /* Afficher les chances réelles avec bonus */
  const critPct = (critChance * 100).toFixed(1)
  const doublePct = (doubleChance * 100).toFixed(1)
  const triplePct = (tripleChance * 100).toFixed(2)

  const resultEmbed=new EmbedBuilder()
   .setTitle("⚗️ Fusion terminée")
   .setDescription(
`${message}

**Cartes utilisées**

${usedLines.join("\n")}

${cost} ${RARITY_EMOJI[rarity]} → ${RARITY_EMOJI[targetRarity]}

Doublons restants : **${remainingDup}**

⭐ XP gagnée : **${xpGain}**

**Résultat**

${rewardLines.join("\n")}

📊 **Chances (avec bonus)**

🔥 Critique : **${critPct}%**
🌈 Triple : **${triplePct}%**
✨ Double : **${doublePct}%**

${fusionStats}`
   )

  await msg.edit({embeds:[resultEmbed]})

  if(unlocked.length)
   await notifyAchievements(interaction,unlocked)

 }

}
