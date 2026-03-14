const { EmbedBuilder } = require("discord.js")

const { getCards } = require("../../systems/cardRegistry")

const { getUser, save } = require("../../systems/userSystem")
const { giveAchievement } = require("../../systems/achievementSystem")
const { achievementCheck } = require("../../systems/achievementCheck")
const { addXP } = require("../../systems/progressionSystem")

const cards = getCards()

const rarityOrder=[
 "C","U","R","SR","HR","UR","S","SSR"
]

const rarityEmoji={
 C:"⚪",
 U:"🟢",
 R:"🔵",
 SR:"🟣",
 HR:"🔴",
 UR:"🟡",
 S:"✨",
 SSR:"🌈"
}

module.exports={

 name:"fusion",
 description:"Fusionner 5 cartes pour obtenir une rareté supérieure",

 options:[
  {name:"set",type:3,required:true},
  {
   name:"rarete",
   type:3,
   required:true,
   choices:[
    {name:"C",value:"C"},
    {name:"U",value:"U"},
    {name:"R",value:"R"},
    {name:"SR",value:"SR"},
    {name:"HR",value:"HR"},
    {name:"UR",value:"UR"}
   ]
  }
 ],

 async execute(interaction){

  const user = getUser(interaction.user.id)

  const setName = interaction.options.getString("set")
  const rarity = interaction.options.getString("rarete")

  const index = rarityOrder.indexOf(rarity)

  if(index === -1)
   return interaction.reply("Rareté invalide.")

  if(rarity === "UR")
   return interaction.reply("❌ Impossible de fusionner des UR.")

  const pool = cards.filter(c =>
   c.set === setName &&
   c.rarity === rarity
  )

  if(pool.length === 0)
   return interaction.reply("Aucune carte trouvée.")

  let owned=[]

  for(const card of pool){

   const count = user.cards?.[card.id] || 0

   for(let i=0;i<count;i++)
    owned.push(card)

  }

  if(owned.length < 5)
   return interaction.reply("❌ Tu n'as pas assez de cartes.")

  for(let i=0;i<5;i++){

   const card = owned[i]

   user.cards[card.id]--

   if(user.cards[card.id] <= 0)
    delete user.cards[card.id]

  }

  user.stats.fusions++

  const roll = Math.random()

  let rarityGain = 1
  let quantity = 1
  let message=""
  let xpGain = 15

  if(roll < 0.10){

   rarityGain = 2
   message="🔥 Fusion critique !"
   xpGain = 25

   user.stats.fusionCrit = (user.stats.fusionCrit || 0) + 1

   if(user.stats.fusionCrit === 1) giveAchievement(user,"fusionCrit")
   if(user.stats.fusionCrit === 10) giveAchievement(user,"fusionCrit10")
   if(user.stats.fusionCrit === 100) giveAchievement(user,"fusionCrit100")

  }

  else if(roll < 0.20){

   quantity = 2
   message="✨ Fusion double !"
   xpGain = 25

   user.stats.fusionDouble = (user.stats.fusionDouble || 0) + 1

   if(user.stats.fusionDouble === 1) giveAchievement(user,"fusionDouble")
   if(user.stats.fusionDouble === 10) giveAchievement(user,"fusionDouble10")
   if(user.stats.fusionDouble === 100) giveAchievement(user,"fusionDouble100")

  }

  let targetIndex = index + rarityGain

  const maxIndex = rarityOrder.indexOf("S")

  if(targetIndex > maxIndex)
   targetIndex = maxIndex

  const targetRarity = rarityOrder[targetIndex]

  const rewardPool = cards.filter(c =>
   c.set === setName &&
   c.rarity === targetRarity
  )

  if(rewardPool.length === 0)
   return interaction.reply("Erreur de pool.")

  const rewards=[]

  for(let i=0;i<quantity;i++){

   const card = rewardPool[
    Math.floor(Math.random()*rewardPool.length)
   ]

   rewards.push(card)

   user.cards[card.id] =
    (user.cards[card.id]||0)+1

  }

  addXP(user,xpGain)

  await achievementCheck(interaction,user)

  save()

  const lines = rewards.map(c =>
   `${rarityEmoji[c.rarity]} ${c.name}`
  )

  const embed = new EmbedBuilder()
   .setTitle("⚗️ Fusion de cartes")
   .setDescription(
`${message}

5 ${rarityEmoji[rarity]} → ${rarityEmoji[targetRarity]}

⭐ XP gagnée : **${xpGain}**

${lines.join("\n")}`
   )

  interaction.reply({embeds:[embed]})

 }

}