const {
 ActionRowBuilder,
 StringSelectMenuBuilder,
 ButtonBuilder,
 ButtonStyle,
 SlashCommandBuilder,
 EmbedBuilder
} = require("discord.js")

const { data } = require("../../systems/dataManager")
const setsData = require("../../cards/sets.json")
const sets = Array.isArray(setsData) ? setsData : setsData.sets

const { isDev } = require("../../systems/devSystem")

const rarityOrder={
 SSR:8,S:7,UR:6,HR:5,SR:4,R:3,U:2,C:1
}

const PAGE_SIZE=15

module.exports={

 data:new SlashCommandBuilder()
  .setName("listcards")
  .setDescription("Lister les cartes par set"),

 async execute(interaction){

  if(!isDev(interaction.user.id))
   return interaction.reply({
    content:"Commande dev.",
    ephemeral:true
   })

  const cards=data.cards||[]

  const availableSets=sets.filter(set=>
   cards.some(card=>card.set===set.id)
  )

  if(availableSets.length===0)
   return interaction.reply({
    content:"❌ Aucun set contenant des cartes.",
    ephemeral:true
   })

  const menu=new StringSelectMenuBuilder()
   .setCustomId("listcards_select")
   .setPlaceholder("Choisir un set")
   .addOptions(
    availableSets.map(s=>({
     label:s.name,
     value:s.id
    }))
   )

  const menuRow=new ActionRowBuilder().addComponents(menu)

  const setsEmbed=new EmbedBuilder()
   .setTitle("📦 Liste des sets")
   .setDescription(
    availableSets.map(s=>`• ${s.name}`).join("\n")
   )

  await interaction.reply({
   embeds:[setsEmbed],
   components:[menuRow],
   ephemeral:true
  })

  const msg=await interaction.fetchReply()

  const collector=msg.createMessageComponentCollector({
   time:120000
  })

  let page=0
  let selectedSet=null
  let setCards=[]

  collector.on("collect",async i=>{

   if(i.user.id!==interaction.user.id)
    return i.reply({
     content:"Pas pour toi.",
     ephemeral:true
    })

   if(i.customId==="listcards_select"){

    selectedSet=i.values[0]

    setCards=cards
     .filter(c=>c.set===selectedSet)
     .sort((a,b)=>{

      const ra=rarityOrder[a.rarity]||0
      const rb=rarityOrder[b.rarity]||0

      if(rb!==ra) return rb-ra

      return a.id-b.id

     })

    page=0

   }

   if(i.customId==="list_next") page++
   if(i.customId==="list_prev") page--

   if(i.customId==="list_back"){
    selectedSet=null
    page=0
   }

   if(!selectedSet){

    return i.update({
     embeds:[setsEmbed],
     components:[menuRow]
    })

   }

   const start=page*PAGE_SIZE
   const slice=setCards.slice(start,start+PAGE_SIZE)

   const lines=slice.map(c=>
    `#${c.id} • ${c.name} • ${c.rarity}`
   )

   const setData=sets.find(s=>s.id===selectedSet)

   const cardsEmbed=new EmbedBuilder()
    .setTitle(`📦 ${setData.name}`)
    .setDescription(lines.join("\n")||"Aucune carte.")
    .setFooter({
     text:`Page ${page+1}/${Math.ceil(setCards.length/PAGE_SIZE)}`
    })

   const buttons=new ActionRowBuilder().addComponents(

    new ButtonBuilder()
     .setCustomId("list_prev")
     .setLabel("⬅")
     .setStyle(ButtonStyle.Secondary)
     .setDisabled(page===0),

    new ButtonBuilder()
     .setCustomId("list_next")
     .setLabel("➡")
     .setStyle(ButtonStyle.Secondary)
     .setDisabled(start+PAGE_SIZE>=setCards.length),

    new ButtonBuilder()
     .setCustomId("list_back")
     .setLabel("Retour aux sets")
     .setStyle(ButtonStyle.Danger)

   )

   await i.update({
    embeds:[cardsEmbed],
    components:[buttons]
   })

  })

 }

}