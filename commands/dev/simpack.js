const {
 ActionRowBuilder,
 ButtonBuilder,
 ButtonStyle
} = require("discord.js")

const { generatePack } = require("../../systems/pack")

const setsData = require("../../cards/sets.json")
const sets = Array.isArray(setsData) ? setsData : setsData.sets

const { rewardKamas } = require("../../systems/economy")

module.exports = {

 name: "simpack",
 description: "Simulation des drops",

 options: [
  {
   name: "packs",
   description: "Nombre de packs à simuler",
   type: 4,
   required: true
  },
  {
   name: "set",
   description: "Set",
   type: 3,
   required: false,
   choices: sets.map(s => ({
    name: s.name,
    value: s.id
   }))
  },
  {
   name: "pity",
   description: "Activer le pity",
   type: 5,
   required: false
  }
 ],

 async execute(interaction) {

  const packs = interaction.options.getInteger("packs")

  const setId =
   interaction.options.getString("set") ||
   sets[0].id

  const pityEnabled =
   interaction.options.getBoolean("pity") ?? true

  /* MULTI JOUEURS FAKE */

  const fakeUsers=[]

  for(let i=0;i<50;i++){
   fakeUsers.push({
    pity:{
     [setId]:{UR:0,S:0,SSR:0}
    }
   })
  }

  const rarityCount={
   C:0,
   U:0,
   R:0,
   SR:0,
   HR:0,
   UR:0,
   S:0,
   SSR:0
  }

  let totalKamas=0
  let totalCards=0

  for(let i=0;i<packs;i++){

   const user = pityEnabled
    ? fakeUsers[Math.floor(Math.random()*fakeUsers.length)]
    : {pity:{[setId]:{UR:0,S:0,SSR:0}}}

   const result = generatePack(user,setId)
   const pack = result.pack

   totalCards += pack.length

   for(const card of pack){

    if(rarityCount[card.rarity] !== undefined)
     rarityCount[card.rarity]++

    // Fix : rewardKamas attend (user, rarity)
    // on passe un faux user sans kamas pour ne pas polluer les stats
    totalKamas += rewardKamas(
     {kamas:0, stats:{}},
     card.rarity
    )

   }

  }

  const avgCard = totalKamas / totalCards
  const avgPack = avgCard * 5
  const avg10 = avgPack * 10

  /* RESULTATS DROPS */

  let dropResult =
`🎴 Simulation ${packs} packs
Set : ${setId}
Pity : ${pityEnabled ? "ON" : "OFF"}

Cartes générées : ${totalCards}

`

  for(const rarity in rarityCount){

   const count = rarityCount[rarity]
   const percent = ((count / totalCards) * 100).toFixed(4)

   dropResult += `${rarity} : ${count} (${percent}%)\n`

  }

  /* RESULTATS ECONOMIE */

  const ecoResult =
`💰 Économie

Total kamas générés : ${Math.floor(totalKamas)}

Gain moyen / carte : ${avgCard.toFixed(2)}
Gain moyen / pack : ${avgPack.toFixed(2)}

Gain moyen / 10 packs : ${avg10.toFixed(2)}

Prix pack conseillé : ${Math.ceil(avg10)}
`

  const row = new ActionRowBuilder().addComponents(

   new ButtonBuilder()
    .setCustomId("simpack_drops")
    .setLabel("📊 Drops")
    .setStyle(ButtonStyle.Primary),

   new ButtonBuilder()
    .setCustomId("simpack_economy")
    .setLabel("💰 Économie")
    .setStyle(ButtonStyle.Success)

  )

  await interaction.reply({
   content:`\`\`\`\n${dropResult}\n\`\`\``,
   components:[row]
  })

  const filter = i => i.user.id === interaction.user.id

  const collector = interaction.channel.createMessageComponentCollector({
   filter,
   time:60000
  })

  collector.on("collect", async i => {

   if(i.customId === "simpack_drops"){

    await i.update({
     content:`\`\`\`\n${dropResult}\n\`\`\``,
     components:[row]
    })

   }

   if(i.customId === "simpack_economy"){

    await i.update({
     content:`\`\`\`\n${ecoResult}\n\`\`\``,
     components:[row]
    })

   }

  })

 }

}