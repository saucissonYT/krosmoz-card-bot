const { 
 ActionRowBuilder,
 ButtonBuilder,
 ButtonStyle,
 EmbedBuilder
} = require("discord.js")

const { isDev } = require("../../systems/devSystem")
const { loadSets } = require("../../systems/setSystemFile")
const { data } = require("../../systems/dataManager")

const rarities = ["C","U","R","SR","HR","UR","S","SSR"]

module.exports = {

 name:"setlist",
 description:"Lister les sets avec statistiques",

 async execute(interaction){

  if(!isDev(interaction.user.id))
   return interaction.reply({
    content:"Commande dev.",
    ephemeral:true
   })

  const rawSets = loadSets()
  const sets = Array.isArray(rawSets) ? rawSets : rawSets?.sets || []

  if(sets.length === 0)
   return interaction.reply({
    content:"Aucun set trouvé.",
    ephemeral:true
   })

  const cards = data.cards || []

  if(cards.length === 0)
   return interaction.reply({
    content:"Aucune carte chargée.",
    ephemeral:true
   })

  const pages = []

  for(const set of sets){

   const setCards = cards.filter(c => c.set === set.id)
   const total = setCards.length

   if(total === 0){

    pages.push({
     title:set.name,
     description:"Aucune carte dans ce set."
    })

    continue
   }

   const rarityStats = {}

   for(const r of rarities)
    rarityStats[r] = 0

   for(const card of setCards){

    if(rarityStats[card.rarity] !== undefined)
     rarityStats[card.rarity]++

   }

   const rarityLines = rarities
    .filter(r => rarityStats[r] > 0)
    .map(r => {

     const count = rarityStats[r]
     const percent = ((count / total) * 100).toFixed(1)

     return `**${r}** : ${count} (${percent}%)`

    })
    .join("\n")

   pages.push({
    title:set.name,
    description:`Total cartes : **${total}**\n\n${rarityLines}`
   })

  }

  let page = 0

  const embed = new EmbedBuilder()
   .setTitle(`📦 Set : ${pages[page].title}`)
   .setDescription(pages[page].description)
   .setFooter({ text:`Page ${page+1}/${pages.length}` })

  const row = new ActionRowBuilder().addComponents(

   new ButtonBuilder()
    .setCustomId("prev")
    .setLabel("◀")
    .setStyle(ButtonStyle.Secondary),

   new ButtonBuilder()
    .setCustomId("next")
    .setLabel("▶")
    .setStyle(ButtonStyle.Secondary)

  )

  const msg = await interaction.reply({
   embeds:[embed],
   components:[row],
   fetchReply:true
  })

  const collector = msg.createMessageComponentCollector({
   time:120000
  })

  collector.on("collect", async i => {

   if(i.user.id !== interaction.user.id)
    return i.reply({
     content:"Pas pour toi.",
     ephemeral:true
    })

   if(i.customId === "prev")
    page = page === 0 ? pages.length - 1 : page - 1

   if(i.customId === "next")
    page = page === pages.length - 1 ? 0 : page + 1

   embed
    .setTitle(`📦 Set : ${pages[page].title}`)
    .setDescription(pages[page].description)
    .setFooter({ text:`Page ${page+1}/${pages.length}` })

   await i.update({
    embeds:[embed]
   })

  })

 }

}