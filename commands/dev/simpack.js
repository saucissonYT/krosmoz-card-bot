const {
 SlashCommandBuilder,
 EmbedBuilder,
 ActionRowBuilder,
 ButtonBuilder,
 ButtonStyle
} = require("discord.js")

const { generatePack } = require("../../systems/pack")
const { loadSets } = require("../../systems/setSystemFile")
const { rewardKamas } = require("../../systems/economy")
const { RARITY_EMOJI } = require("../../systems/constants")

module.exports = {

 data: (() => {

  const sets = loadSets()
  const safeSets = Array.isArray(sets) ? sets : sets?.sets || []

  const builder = new SlashCommandBuilder()
   .setName("simpack")
   .setDescription("Simulation des drops")
   .addIntegerOption(option =>
    option
     .setName("packs")
     .setDescription("Nombre de packs à simuler")
     .setRequired(true)
   )
   .addBooleanOption(option =>
    option
     .setName("pity")
     .setDescription("Activer le pity")
     .setRequired(false)
   )

  const setOption = builder.addStringOption(option => {

   option
    .setName("set")
    .setDescription("Set")
    .setRequired(false)

   if(safeSets.length > 0){
    option.addChoices(
     ...safeSets.slice(0, 25).map(s => ({
      name:s.name,
      value:s.id
     }))
    )
   }

   return option

  })

  return builder

 })(),

 async execute(interaction){

  await interaction.deferReply({ ephemeral:true })

  const sets = loadSets()
  const safeSets = Array.isArray(sets) ? sets : sets?.sets || []

  const packs = interaction.options.getInteger("packs")

  const setId =
   interaction.options.getString("set") ||
   (safeSets[0]?.id || "incarnam")

  const pityEnabled =
   interaction.options.getBoolean("pity") ?? true

  const setName = safeSets.find(s => s.id === setId)?.name || setId

  /* Limite raisonnable */
  if(packs > 100000){
   return interaction.editReply("❌ Maximum 100 000 packs.")
  }

  /* MULTI JOUEURS FAKE */

  const fakeUsers = []

  for(let i = 0; i < 50; i++){
   fakeUsers.push({
    pity:{
     [setId]:{ UR:0, S:0, SSR:0 }
    }
   })
  }

  const rarityCount = {
   C:0, U:0, R:0, SR:0, HR:0, UR:0, S:0, SSR:0
  }

  let totalKamas = 0
  let totalCards = 0

  for(let i = 0; i < packs; i++){

   const user = pityEnabled
    ? fakeUsers[Math.floor(Math.random() * fakeUsers.length)]
    : { pity:{ [setId]:{ UR:0, S:0, SSR:0 } } }

   const result = generatePack(user, setId)
   const pack = result.pack

   totalCards += pack.length

   for(const card of pack){

    if(rarityCount[card.rarity] !== undefined)
     rarityCount[card.rarity]++

    totalKamas += rewardKamas(
     { kamas:0, stats:{} },
     card.rarity
    )

   }

  }

  const avgCard = totalCards > 0 ? totalKamas / totalCards : 0
  const avgPack = avgCard * 5
  const avg10 = avgPack * 10

  /* RESULTATS DROPS */

  const dropLines = Object.entries(rarityCount)
   .filter(([, count]) => count > 0)
   .map(([rarity, count]) => {
    const percent = ((count / totalCards) * 100).toFixed(4)
    return `${RARITY_EMOJI[rarity]} **${rarity}** : ${count} (${percent}%)`
   })

  const dropEmbed = new EmbedBuilder()
   .setTitle("📊 Simulation — Drops")
   .setColor("#3498db")
   .setDescription(
`🎴 **${packs.toLocaleString()}** packs simulés
📦 Set : **${setName}**
🎰 Pity : **${pityEnabled ? "ON" : "OFF"}**
🃏 Cartes générées : **${totalCards.toLocaleString()}**

${dropLines.join("\n")}`
   )

  /* RESULTATS ECONOMIE */

  const ecoEmbed = new EmbedBuilder()
   .setTitle("💰 Simulation — Économie")
   .setColor("#2ecc71")
   .setDescription(
`🎴 **${packs.toLocaleString()}** packs simulés
📦 Set : **${setName}**

💰 Total kamas générés : **${Math.floor(totalKamas).toLocaleString()}**

📈 Gain moyen / carte : **${avgCard.toFixed(2)}**
📈 Gain moyen / pack : **${avgPack.toFixed(2)}**
📈 Gain moyen / 10 packs : **${avg10.toFixed(2)}**

🏷️ Prix pack conseillé : **${Math.ceil(avg10).toLocaleString()} kamas**`
   )

  /* BOUTONS */

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

  await interaction.editReply({
   embeds:[dropEmbed],
   components:[row]
  })

  const msg = await interaction.fetchReply()

  const collector = msg.createMessageComponentCollector({
   filter: i => i.user.id === interaction.user.id,
   time:120000
  })

  collector.on("collect", async i => {

   if(i.customId === "simpack_drops"){

    await i.update({
     embeds:[dropEmbed],
     components:[row]
    })

   }

   if(i.customId === "simpack_economy"){

    await i.update({
     embeds:[ecoEmbed],
     components:[row]
    })

   }

  })

 }

}