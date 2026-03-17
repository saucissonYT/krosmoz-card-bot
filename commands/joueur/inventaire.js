const {
 EmbedBuilder,
 ActionRowBuilder,
 ButtonBuilder,
 ButtonStyle
} = require("discord.js")

const { getCardsById } = require("../../systems/cardRegistry")
const { getUser, save } = require("../../systems/userSystem")
const { achievementCheck } = require("../../systems/achievementCheck")
const { notifyAchievements } = require("../../systems/achievementNotifier")

const rarityEmoji={
 C:"⚪",U:"🟢",R:"🔵",SR:"🟣",
 HR:"🔴",UR:"🟡",S:"✨",SSR:"🌈"
}

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

  const perPage=20
  let page=1
  const totalPages=Math.max(1,Math.ceil(inventory.length/perPage))

  function build(page){

   const start=(page-1)*perPage
   const data=inventory.slice(start,start+perPage)

   const lines=data.map(e=>{

    const emoji=rarityEmoji[e.card.rarity]||""

    return `#${e.card.id} • ${emoji} ${e.card.name} - x${e.count}`

   })

   const embed=new EmbedBuilder()
    .setTitle(`🎴 Inventaire de ${interaction.user.username}`)
    .setDescription(lines.join("\n") || "Aucune carte.")
    .setFooter({
     text:`${inventory.length} cartes • Page ${page}/${totalPages}`
    })

   const row=new ActionRowBuilder().addComponents(

    new ButtonBuilder()
     .setCustomId("prev")
     .setLabel("⬅️")
     .setStyle(ButtonStyle.Secondary)
     .setDisabled(page===1),

    new ButtonBuilder()
     .setCustomId("next")
     .setLabel("➡️")
     .setStyle(ButtonStyle.Secondary)
     .setDisabled(page===totalPages)

   )

   return {embed,row}

  }

  const {embed,row}=build(page)

  const msg=await interaction.editReply({
   embeds:[embed],
   components:[row],
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

   page=Math.max(1,Math.min(page,totalPages))

   const {embed,row}=build(page)

   await i.update({
    embeds:[embed],
    components:[row]
   })

  })

 }

}