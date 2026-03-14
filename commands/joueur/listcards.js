const {
 ActionRowBuilder,
 StringSelectMenuBuilder,
 ButtonBuilder,
 ButtonStyle,
 EmbedBuilder
} = require("discord.js")

const cardsData = require("../../cards/cards.json")
const cards = Array.isArray(cardsData) ? cardsData : cardsData.cards

const setsData = require("../../cards/sets.json")
const sets = Array.isArray(setsData) ? setsData : setsData.sets

const { isDev } = require("../../systems/devSystem")

const rarityOrder = {
 SSR:8,
 S:7,
 UR:6,
 HR:5,
 SR:4,
 R:3,
 U:2,
 C:1
}

module.exports = {

 name:"listcards",
 description:"Lister les cartes d'un set",

 async execute(interaction){

  if(!isDev(interaction.user.id))
   return interaction.reply({
    content:"Commande dev.",
    ephemeral:true
   })

  const menu = new StringSelectMenuBuilder()
   .setCustomId("listcards_set")
   .setPlaceholder("Choisir un set")
   .addOptions(
    sets.map(s=>({
     label:s.name,
     value:s.id
    }))
   )

  const row = new ActionRowBuilder().addComponents(menu)

  interaction.reply({
   content:"📦 Choisis un set",
   components:[row],
   ephemeral:true
  })

 },

 async menu(interaction){

  if(interaction.customId !== "listcards_set") return

  const setId = interaction.values[0]

  const setData = sets.find(s=>s.id===setId)

  if(!setData)
   return interaction.update({content:"Set introuvable.",components:[]})

  const setCards = cards.filter(c=>c.set===setId)

  if(setCards.length === 0)
   return interaction.update({content:"Aucune carte.",components:[]})

  setCards.sort((a,b)=>{

   const ra = rarityOrder[a.rarity] || 0
   const rb = rarityOrder[b.rarity] || 0

   if(rb !== ra)
    return rb - ra

   return a.id - b.id

  })

  const perPage = 50
  let page = 1
  const totalPages = Math.ceil(setCards.length/perPage)

  function build(page){

   const start = (page-1)*perPage
   const data = setCards.slice(start,start+perPage)

   const lines = data.map(c=>
    `ID:${c.id} | ${c.name} | ${c.rarity}`
   )

   const embed = new EmbedBuilder()
    .setTitle(`📦 ${setData.name}`)
    .setDescription(lines.join("\n"))
    .setFooter({
     text:`Page ${page}/${totalPages} • ${setCards.length} cartes`
    })

   const row = new ActionRowBuilder().addComponents(

    new ButtonBuilder()
     .setCustomId("listcards_prev")
     .setLabel("⬅️")
     .setStyle(ButtonStyle.Secondary)
     .setDisabled(page===1),

    new ButtonBuilder()
     .setCustomId("listcards_next")
     .setLabel("➡️")
     .setStyle(ButtonStyle.Secondary)
     .setDisabled(page===totalPages),

    new ButtonBuilder()
     .setCustomId("listcards_back")
     .setLabel("↩ Retour sets")
     .setStyle(ButtonStyle.Danger)

   )

   return {embed,row}

  }

  const {embed,row} = build(page)

  const msg = await interaction.update({
   embeds:[embed],
   components:[row]
  })

  const collector = msg.createMessageComponentCollector({
   time:120000
  })

  collector.on("collect", async i=>{

   if(i.user.id !== interaction.user.id)
    return i.reply({content:"Pas ton menu.",ephemeral:true})

   if(i.customId === "listcards_next") page++
   if(i.customId === "listcards_prev") page--

   if(i.customId === "listcards_back"){

    const menu = new StringSelectMenuBuilder()
     .setCustomId("listcards_set")
     .setPlaceholder("Choisir un set")
     .addOptions(
      sets.map(s=>({
       label:s.name,
       value:s.id
      }))
     )

    const row = new ActionRowBuilder().addComponents(menu)

    return i.update({
     content:"📦 Choisis un set",
     embeds:[],
     components:[row]
    })

   }

   page=Math.max(1,Math.min(page,totalPages))

   const {embed,row} = build(page)

   await i.update({
    embeds:[embed],
    components:[row]
   })

  })

 }

}