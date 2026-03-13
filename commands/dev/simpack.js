const {
 ActionRowBuilder,
 ButtonBuilder,
 ButtonStyle
} = require("discord.js")

const { generatePack } = require("../../systems/pack")
const sets = require("../../cards/sets.json")
const { rewardKamas } = require("../../systems/rewards")

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

  const pity =
   interaction.options.getBoolean("pity") ?? true

  const rarityCount = {
   C: 0,
   U: 0,
   R: 0,
   SR: 0,
   HR: 0,
   UR: 0,
   S: 0,
   SSR: 0
  }

  let totalKamas = 0

  const fakeUser = { pity:{} }

  for (let i = 0; i < packs; i++) {

   const user = pity ? fakeUser : { pity:{} }

   const pack = generatePack(user, setId)

   for (const card of pack) {

    rarityCount[card.rarity]++

    totalKamas += rewardKamas(
     { kamas:0 },
     card.rarity
    )

   }

  }

  const totalCards = packs * 5
  const avgCard = totalKamas / totalCards
  const avgPack = avgCard * 5
  const avg10 = avgPack * 10

  let dropResult =
`🎴 Simulation ${packs} packs
Set : ${setId}
Pity : ${pity ? "ON" : "OFF"}

`

  for (const rarity in rarityCount) {

   const count = rarityCount[rarity]
   const percent = ((count / totalCards) * 100).toFixed(4)

   dropResult += `${rarity} : ${count} (${percent}%)\n`

  }

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