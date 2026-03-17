const { SlashCommandBuilder, EmbedBuilder } = require("discord.js")

const { getCards } = require("../../systems/cardRegistry")
const { getUser, save } = require("../../systems/userSystem")
const { achievementCheck } = require("../../systems/achievementCheck")
const { notifyAchievements } = require("../../systems/achievementNotifier")
const { addXP } = require("../../systems/progressionSystem")

const setsData = require("../../cards/sets.json")
const sets = Array.isArray(setsData) ? setsData : setsData.sets

const cards = getCards()

const rarityOrder = [
"C","U","R","SR","HR","UR","S","SSR"
]

const rarityEmoji = {
C:"⚪",
U:"🟢",
R:"🔵",
SR:"🟣",
HR:"🔴",
UR:"🟡",
S:"✨",
SSR:"🌈"
}

const fusionCost = {
C:5,
U:6,
R:8,
SR:10,
HR:12,
UR:15,
S:20
}

function sleep(ms){
 return new Promise(r=>setTimeout(r,ms))
}

module.exports = {

data:new SlashCommandBuilder()
.setName("fusion")
.setDescription("Fusionner des doublons pour obtenir une rareté supérieure")

.addStringOption(option=>
 option.setName("set")
 .setDescription("Set des cartes")
 .setRequired(true)
 .addChoices(
  ...sets.map(s=>({
   name:s.name,
   value:s.id
  }))
 )
)

.addStringOption(option=>
 option.setName("rarete")
 .setDescription("Rareté à fusionner")
 .setRequired(true)
 .addChoices(
 {name:"C",value:"C"},
 {name:"U",value:"U"},
 {name:"R",value:"R"},
 {name:"SR",value:"SR"},
 {name:"HR",value:"HR"},
 {name:"UR",value:"UR"},
 {name:"S",value:"S"}
 )
),

async execute(interaction){

const user = getUser(interaction.user.id)

const setName = interaction.options.getString("set")
const rarity = interaction.options.getString("rarete")

const index = rarityOrder.indexOf(rarity)

if(index === -1)
return interaction.reply({content:"Rareté invalide.",flags:64})

if(rarity === "SSR")
return interaction.reply({content:"Impossible de fusionner des SSR.",flags:64})

const cost = fusionCost[rarity]

const pool = cards.filter(c =>
c.set === setName &&
c.rarity === rarity
)

if(pool.length === 0)
return interaction.reply({content:"Aucune carte trouvée.",flags:64})

let available = 0

for(const card of pool){

const count = user.cards?.[card.id] || 0

if(count > 1)
available += (count - 1)

}

if(available < cost)
return interaction.reply({
content:`❌ Il faut **${cost} doublons ${rarityEmoji[rarity]}**.`,
flags:64
})

/* CARTES UTILISÉES */

let remaining = cost
const usedCards = {}

for(const card of pool){

const count = user.cards?.[card.id] || 0
const usable = Math.max(0,count-1)

if(usable <= 0) continue

const take = Math.min(usable,remaining)

user.cards[card.id] -= take
remaining -= take

usedCards[card.id]=(usedCards[card.id]||0)+take

if(user.cards[card.id] <= 0)
delete user.cards[card.id]

if(remaining <= 0) break

}

/* STATS */

if(!user.stats) user.stats={}

user.stats.fusions=(user.stats.fusions||0)+1

const now = Date.now()

if(!user.stats.lastTripleReset || now - user.stats.lastTripleReset > 86400000){

user.stats.tripleFusionToday = 0
user.stats.lastTripleReset = now

}

/* RNG */

const roll = Math.random()

let rarityGain = 1
let quantity = 1
let message = ""
let xpGain = 15

if(roll < 0.005 && user.stats.tripleFusionToday < 1){

rarityGain = 3
message = "🌈 TRIPLE FUSION !!!"
xpGain = 50

user.stats.tripleFusionToday++
user.stats.tripleFusion=(user.stats.tripleFusion||0)+1

}

else if(roll < 0.10){

rarityGain = 2
message = "🔥 Fusion critique !"
xpGain = 25

user.stats.fusionCrit=(user.stats.fusionCrit||0)+1

}

else if(roll < 0.20 && ["C","U","R","SR"].includes(rarity)){

quantity = 2
message = "✨ Fusion double !"
xpGain = 25

user.stats.fusionDouble=(user.stats.fusionDouble||0)+1

}

/* TYPE FUSION */

if(rarity==="C") user.stats.fusionCU=true
if(rarity==="U") user.stats.fusionUR=true
if(rarity==="R") user.stats.fusionRSR=true
if(rarity==="SR") user.stats.fusionSRHR=true
if(rarity==="HR") user.stats.fusionHRUR=true
if(rarity==="UR") user.stats.fusionURS=true

let targetIndex = index + rarityGain

const maxIndex = rarityOrder.indexOf("SSR")

if(targetIndex > maxIndex)
targetIndex = maxIndex

const targetRarity = rarityOrder[targetIndex]

const rewardPool = cards.filter(c =>
c.set === setName &&
c.rarity === targetRarity
)

if(rewardPool.length === 0)
return interaction.reply({content:"Erreur de pool.",flags:64})

/* EMBED START */

const embed = new EmbedBuilder()
.setTitle("⚗️ Fusion en cours...")
.setDescription(`Fusion de **${cost} doublons ${rarityEmoji[rarity]}**`)

await interaction.reply({embeds:[embed]})
const msg = await interaction.fetchReply()

await sleep(900)

embed.setDescription(`
${cost} ${rarityEmoji[rarity]}
⬇
${rarityEmoji[targetRarity]}
`)

await msg.edit({embeds:[embed]})

await sleep(900)

/* REWARDS */

const rewards=[]

for(let i=0;i<quantity;i++){

const card = rewardPool[Math.floor(Math.random()*rewardPool.length)]

rewards.push(card)

user.cards[card.id]=(user.cards[card.id]||0)+1

}

addXP(user,xpGain)
save()

let unlocked=[]

unlocked.push(...achievementCheck(user,"fusion"))
unlocked.push(...achievementCheck(user,"collection"))

/* DISPLAY USED */

const usedLines = Object.entries(usedCards).map(([id,q])=>{

const card = cards.find(c=>c.id==id)

return `${rarityEmoji[card.rarity]} ${card.name} ×${q}`

})

/* DISPLAY REWARD */

const rewardLines = rewards.map(c =>
`${rarityEmoji[c.rarity]} ${c.name}`
)

/* FUSION STATS */

const fusionStats = `
📊 **Stats fusion**

Fusions : **${user.stats.fusions||0}**
🔥 Critiques : **${user.stats.fusionCrit||0}**
✨ Doubles : **${user.stats.fusionDouble||0}**
🌈 Triples : **${user.stats.tripleFusion||0}**
`

/* RESULT */

const resultEmbed = new EmbedBuilder()
.setTitle("⚗️ Fusion terminée")
.setDescription(`
${message}

**Cartes utilisées**

${usedLines.join("\n")}

${cost} ${rarityEmoji[rarity]} → ${rarityEmoji[targetRarity]}

⭐ XP gagnée : **${xpGain}**

**Résultat**

${rewardLines.join("\n")}

📊 **Chances**

🔥 Critique : **10%**
🌈 Triple : **0.5%**
✨ Double : **10%**

${fusionStats}
`)

await msg.edit({embeds:[resultEmbed]})

if(unlocked.length)
 await notifyAchievements(interaction,unlocked)

}

}