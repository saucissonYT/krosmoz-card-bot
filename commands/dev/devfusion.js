const { SlashCommandBuilder, EmbedBuilder } = require("discord.js")

const { RARITY_ORDER, RARITY_EMOJI, FUSION_COST } = require("../../systems/constants")
const { getCards } = require("../../systems/cardRegistry")
const { sortSetsByDisplayOrder } = require("../../systems/setOrder")

const setsData = require("../../cards/sets.json")
const sets = sortSetsByDisplayOrder(Array.isArray(setsData) ? setsData : setsData.sets)

function random(arr){
 return arr[Math.floor(Math.random()*arr.length)]
}

module.exports={

data:new SlashCommandBuilder()
.setName("devfusion")
.setDescription("Tester les résultats de fusion")

.addStringOption(o=>
 o.setName("set")
 .setDescription("Set")
 .setRequired(true)
 .addChoices(
  ...sets.map(s=>({
   name:s.name,
   value:s.id
  }))
 )
)

.addStringOption(o=>
 o.setName("rarete")
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
)

.addStringOption(o=>
 o.setName("type")
 .setDescription("Type de fusion")
 .setRequired(true)
 .addChoices(
  {name:"normal",value:"normal"},
  {name:"critique",value:"crit"},
  {name:"double",value:"double"},
  {name:"triple",value:"triple"}
 )
),

async execute(interaction){

const cards = getCards()

const setName = interaction.options.getString("set")
const rarity = interaction.options.getString("rarete")
const type = interaction.options.getString("type")

const index = RARITY_ORDER.indexOf(rarity)

if(index === -1)
return interaction.reply({content:"Rareté invalide.",flags:64})

const cost = FUSION_COST[rarity]

let rarityGain = 1
let quantity = 1
let message = ""

if(type==="crit"){

 rarityGain=2
 message="🔥 Fusion critique !"

}

if(type==="double"){

 quantity=2
 message="✨ Fusion double !"

}

if(type==="triple"){

 rarityGain=3
 message="🌈 TRIPLE FUSION !!!"

}

let targetIndex=index+rarityGain

const maxIndex=RARITY_ORDER.indexOf("SSR")

if(targetIndex>maxIndex)
 targetIndex=maxIndex

const targetRarity=RARITY_ORDER[targetIndex]

const rewardPool = cards.filter(c =>
c.set===setName &&
c.rarity===targetRarity
)

if(rewardPool.length===0)
 return interaction.reply({
  content:"Pool vide pour cette fusion.",
  flags:64
 })

const rewards=[]

for(let i=0;i<quantity;i++){

 const card=random(rewardPool)

 rewards.push(card)

}

const rewardLines=rewards.map(c=>
`${RARITY_EMOJI[c.rarity]} ${c.name}`
)

const embed=new EmbedBuilder()

.setTitle("🧪 DEV FUSION")

.setDescription(`
Type : **${type}**

Fusion simulée :

${cost} ${RARITY_EMOJI[rarity]}
⬇
${RARITY_EMOJI[targetRarity]}

${message}

**Résultat**

${rewardLines.join("\n")}
`)

.setColor("#9b59b6")

await interaction.reply({embeds:[embed]})

}

}
