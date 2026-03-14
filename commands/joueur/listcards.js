const {
 ActionRowBuilder,
 StringSelectMenuBuilder,
 ButtonBuilder,
 ButtonStyle,
 SlashCommandBuilder,
 EmbedBuilder
} = require("discord.js")

const { getCards } = require("../../systems/cardRegistry")

const rarityOrder={
 SSR:8,S:7,UR:6,HR:5,SR:4,R:3,U:2,C:1
}

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

const PAGE_SIZE=15

module.exports={

 data:new SlashCommandBuilder()
  .setName("listcards")
  .setDescription("Voir les cartes par set"),

 async execute(interaction){

  const cards=getCards()

  if(cards.length===0)
   return interaction.reply({
    content:"❌ Aucune carte disponible.",
    ephemeral:true
   })

  /* ---------- sets ---------- */

  const sets=[...new Set(cards.map(c=>c.set))]

  const menu=new StringSelectMenuBuilder()
   .setCustomId("listcards_select")
   .setPlaceholder("Choisir un set")
   .addOptions(
    sets.map(set=>({
     label:set,
     value:set
    }))
   )

  const menuRow=new ActionRowBuilder().addComponents(menu)

  const setsEmbed=new EmbedBuilder()
   .setTitle("📦 Sets disponibles")
   .setDescription(
    sets.map(s=>{
     const count=cards.filter(c=>c.set===s).length
     return `• **${s}** (${count} cartes)`
    }).join("\n")
   )
   .setColor(0xF1C40F)

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

   const totalPages=Math.max(1,Math.ceil(setCards.length/PAGE_SIZE))

   page=Math.max(0,Math.min(page,totalPages-1))

   const start=page*PAGE_SIZE
   const slice=setCards.slice(start,start+PAGE_SIZE)

   const lines=slice.map(c=>{

    const emoji=rarityEmoji[c.rarity]||""

    return `#${c.id} • ${emoji} **${c.name}**`

   })

   const cardsEmbed=new EmbedBuilder()
    .setTitle(`📦 Set : ${selectedSet}`)
    .setDescription(lines.join("\n")||"Aucune carte.")
    .setFooter({
     text:`${setCards.length} cartes • Page ${page+1}/${totalPages}`
    })
    .setColor(0x3498DB)

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
     .setDisabled(page===totalPages-1),

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
