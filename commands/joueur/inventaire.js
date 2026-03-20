const {
 EmbedBuilder,
 ActionRowBuilder,
 ButtonBuilder,
 ButtonStyle
} = require("discord.js")

const { RARITY_EMOJI, RARITY_ORDER } = require("../../systems/constants")
const { getCardsById } = require("../../systems/cardRegistry")
const { getUser, save } = require("../../systems/userSystem")
const { achievementCheck } = require("../../systems/achievementCheck")
const { notifyAchievements } = require("../../systems/achievementNotifier")

const rarityOrder = Object.fromEntries(
 RARITY_ORDER.map((r,i) => [r, i+1])
)

module.exports={

 name:"inventaire",
 description:"Voir ton inventaire",

 options:[
  {
   name:"rarete",
   type:3,
   required:false,
   choices:[
    {name:"C",value:"C"},
    {name:"U",value:"U"},
    {name:"R",value:"R"},
    {name:"SR",value:"SR"},
    {name:"HR",value:"HR"},
    {name:"UR",value:"UR"},
    {name:"S",value:"S"},
    {name:"SSR",value:"SSR"}
   ]
  }
 ],

 async execute(interaction){

  await interaction.deferReply()

  const cardsById=getCardsById()
  const user=getUser(interaction.user.id)

  if(!user.cards) user.cards={}
  if(!user.stats) user.stats={}

  user.stats.inventoryOpen=(user.stats.inventoryOpen||0)+1

  const unlocked=achievementCheck(user,"inventory")

  if(Object.keys(user.cards).length===0){

   await interaction.editReply("📦 Inventaire vide.")

   if(unlocked.length)
    await notifyAchievements(interaction,unlocked)

   return
  }

  const rarityFilter=interaction.options.getString("rarete")

  let inventory=[]
  let cleaned=false

  for(const id in user.cards){

   const card=cardsById[String(id)]

   if(!card){
    delete user.cards[id]
    cleaned=true
    continue
   }

   inventory.push({
    card,
    count:user.cards[id]
   })

  }

  if(cleaned) save()

  if(rarityFilter)
   inventory=inventory.filter(e=>e.card.rarity===rarityFilter)

  if(inventory.length===0){

   await interaction.editReply("❌ Aucune carte trouvée.")

   if(unlocked.length)
    await notifyAchievements(interaction,unlocked)

   return
  }

  let filter=null
  let sort="id"

  const perPage=20
  let page=1

  function applyFilters(){

   let list=[...inventory]

   if(filter)
    list=list.filter(e=>e.card.rarity===filter)

   if(sort==="name")
    list.sort((a,b)=>a.card.name.localeCompare(b.card.name))

   if(sort==="rarity")
    list.sort((a,b)=>rarityOrder[b.card.rarity]-rarityOrder[a.card.rarity])

   if(sort==="count")
    list.sort((a,b)=>b.count-a.count)

   return list

  }

  function build(){

   const data=applyFilters()

   const totalPages=Math.max(1,Math.ceil(data.length/perPage))

   page=Math.max(1,Math.min(page,totalPages))

   const start=(page-1)*perPage

   const slice=data.slice(start,start+perPage)

   const lines=slice.map(e=>{

    const emoji=RARITY_EMOJI[e.card.rarity]||""

    return `#${e.card.id} • ${emoji} ${e.card.name} • x${e.count}`

   })

   const embed=new EmbedBuilder()
    .setTitle(`🎴 Inventaire de ${interaction.user.username}`)
    .setDescription(lines.join("\n") || "Aucune carte.")
    .setFooter({
     text:`${data.length} cartes • Page ${page}/${totalPages}`
    })

   const nav=new ActionRowBuilder().addComponents(

    new ButtonBuilder()
     .setCustomId("prev")
     .setEmoji("⬅")
     .setStyle(ButtonStyle.Secondary)
     .setDisabled(page===1),

    new ButtonBuilder()
     .setCustomId("next")
     .setEmoji("➡")
     .setStyle(ButtonStyle.Secondary)
     .setDisabled(page===totalPages)

   )

   const sortRow=new ActionRowBuilder().addComponents(

    new ButtonBuilder()
     .setCustomId("sort_name")
     .setLabel("Nom")
     .setStyle(ButtonStyle.Primary),

    new ButtonBuilder()
     .setCustomId("sort_rarity")
     .setLabel("Rareté")
     .setStyle(ButtonStyle.Primary),

    new ButtonBuilder()
     .setCustomId("sort_count")
     .setLabel("Quantité")
     .setStyle(ButtonStyle.Primary)

   )

   const rarityRow1=new ActionRowBuilder()

   ;["C","U","R","SR"].forEach(r=>{
    rarityRow1.addComponents(
     new ButtonBuilder()
      .setCustomId(`filter_${r}`)
      .setLabel(r)
      .setStyle(ButtonStyle.Secondary)
    )
   })

   const rarityRow2=new ActionRowBuilder()

   ;["HR","UR","S","SSR"].forEach(r=>{
    rarityRow2.addComponents(
     new ButtonBuilder()
      .setCustomId(`filter_${r}`)
      .setLabel(r)
      .setStyle(ButtonStyle.Secondary)
    )
   })

   const clearRow=new ActionRowBuilder().addComponents(

    new ButtonBuilder()
     .setCustomId("filter_clear")
     .setLabel("Reset")
     .setStyle(ButtonStyle.Danger)

   )

   return {
    embed,
    components:[nav,sortRow,rarityRow1,rarityRow2,clearRow]
   }

  }

  const built=build()

  const msg=await interaction.editReply({
   embeds:[built.embed],
   components:built.components,
   withResponse:true
  })

  if(unlocked.length)
   await notifyAchievements(interaction,unlocked)

  const collector=msg.createMessageComponentCollector({
   time:120000
  })

  collector.on("collect",async i=>{

   if(i.user.id!==interaction.user.id)
    return i.reply({
     content:"Pas ton inventaire.",
     flags:64
    })

   if(i.customId==="next") page++
   if(i.customId==="prev") page--

   if(i.customId==="sort_name") sort="name"
   if(i.customId==="sort_rarity") sort="rarity"
   if(i.customId==="sort_count") sort="count"

   if(i.customId.startsWith("filter_"))
    filter=i.customId.split("_")[1]

   if(i.customId==="filter_clear")
    filter=null

   const built=build()

   await i.update({
    embeds:[built.embed],
    components:built.components
   })

  })

 }

}