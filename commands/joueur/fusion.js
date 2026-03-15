const { SlashCommandBuilder, EmbedBuilder } = require("discord.js")

const { getCards } = require("../../systems/cardRegistry")
const { getUser, save } = require("../../systems/userSystem")
const { giveAchievement } = require("../../systems/achievementSystem")
const { achievementCheck } = require("../../systems/achievementCheck")
const { addXP } = require("../../systems/progressionSystem")

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
return interaction.reply({content:"Rareté invalide.",ephemeral:true})

if(rarity === "SSR")
return interaction.reply({content:"Impossible de fusionner des SSR.",ephemeral:true})

const cost = fusionCost[rarity]

const pool = cards.filter(c =>
c.set === setName &&
c.rarity === rarity
)

if(pool.length === 0)
return interaction.reply({content:"Aucune carte trouvée.",ephemeral:true})

let available = 0

for(const card of pool){

const count = user.cards?.[card.id] || 0

if(count > 1)
available += (count - 1)

}

if(available < cost)
return interaction.reply({
content:`❌ Il faut **${cost} doublons ${rarityEmoji[rarity]}**.`,
ephemeral:true
})

let remaining = cost

for(const card of pool){

const count = user.cards?.[card.id] || 0

const usable = Math.max(0,count-1)

if(usable <= 0) continue

const take = Math.min(usable,remaining)

user.cards[card.id] -= take
remaining -= take

if(user.cards[card.id] <= 0)
delete user.cards[card.id]

if(remaining <= 0) break

}

user.stats.fusions++

const now = Date.now()

if(now - user.stats.lastTripleReset > 86400000){

user.stats.tripleFusionToday = 0
user.stats.lastTripleReset = now

}

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

/* ACHIEVEMENT */
giveAchievement(user,"fusionTriple")

}

else if(roll < 0.10){

rarityGain = 2
message = "🔥 Fusion critique !"
xpGain = 25

user.stats.fusionCrit++

if(user.stats.fusionCrit === 1) giveAchievement(user,"fusionCrit")
if(user.stats.fusionCrit === 10) giveAchievement(user,"fusionCrit10")
if(user.stats.fusionCrit === 100) giveAchievement(user,"fusionCrit100")

}

else if(roll < 0.20 && ["C","U","R","SR"].includes(rarity)){

quantity = 2
message = "✨ Fusion double !"
xpGain = 25

user.stats.fusionDouble++

if(user.stats.fusionDouble === 1) giveAchievement(user,"fusionDouble")
if(user.stats.fusionDouble === 10) giveAchievement(user,"fusionDouble10")
if(user.stats.fusionDouble === 100) giveAchievement(user,"fusionDouble100")

}

let targetIndex = index + rarityGain

const maxIndex = rarityOrder.indexOf("SSR")

if(targetIndex > maxIndex)
targetIndex = maxIndex

const targetRarity = rarityOrder[targetIndex]

/* ACHIEVEMENTS RARE FUSION */

if(targetRarity === "UR")
giveAchievement(user,"fusionUR")

if(targetRarity === "SSR")
giveAchievement(user,"fusionSSR")

const rewardPool = cards.filter(c =>
c.set === setName &&
c.rarity === targetRarity
)

if(rewardPool.length === 0)
return interaction.reply({content:"Erreur de pool.",ephemeral:true})

const embed = new EmbedBuilder()
.setTitle("⚗️ Fusion en cours...")
.setDescription(`${cost} ${rarityEmoji[rarity]} utilisées`)

const msg = await interaction.reply({embeds:[embed],fetchReply:true})

await sleep(800)

embed.setDescription(`
${cost} ${rarityEmoji[rarity]}
⬇
${rarityEmoji[targetRarity]}
`)

await msg.edit({embeds:[embed]})

await sleep(800)

const rewards = []

for(let i=0;i<quantity;i++){

const card = rewardPool[Math.floor(Math.random()*rewardPool.length)]

rewards.push(card)

user.cards[card.id] =
(user.cards[card.id] || 0) + 1

}

addXP(user,xpGain)

await achievementCheck(interaction,user)

save()

const lines = rewards.map(c =>
`${rarityEmoji[c.rarity]} ${c.name}`
)

const resultEmbed = new EmbedBuilder()
.setTitle("⚗️ Fusion terminée")
.setDescription(`
${message}

${cost} ${rarityEmoji[rarity]} → ${rarityEmoji[targetRarity]}

⭐ XP gagnée : **${xpGain}**

${lines.join("\n")}
`)

msg.edit({embeds:[resultEmbed]})

}

}