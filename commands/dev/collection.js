const {
 EmbedBuilder,
 ActionRowBuilder,
 ButtonBuilder,
 ButtonStyle
} = require("discord.js")

const { cardsById } = require("../../systems/cardRegistry")

const { getUser, save } = require("../../systems/userSystem")

const rarityEmoji={
 C:"⚪",U:"🟢",R:"🔵",SR:"🟣",
 HR:"🔴",UR:"🟡",S:"✨",SSR:"🌈"
}

const rarityNames={
 C:"Commune",
 U:"Peu commune",
 R:"Rare",
 SR:"Super Rare",
 HR:"Hyper Rare",
 UR:"Ultra Rare",
 S:"Chromatique",
 SSR:"Super Chromatique"
}

const rarityOrder={
 C:1,U:2,R:3,SR:4,HR:5,UR:6,S:7,SSR:8
}

module.exports={

 name:"inventaire",

 description:"Voir ton inventaire",

 options:[
  {name:"rarete",type:3,required:false,
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
  },
  {name:"nom",type:3,required:false},
  {name:"tri",type:3,required:false,
   choices:[
    {name:"nom",value:"nom"},
    {name:"rareté",value:"rarete"}
   ]
  }
 ],

 async execute(interaction){

  const user=getUser(interaction.user.id)

  if(!user.cards || Object.keys(user.cards).length===0)
   return interaction.reply("📦 Inventaire vide.")

  const rarityFilter=interaction.options.getString("rarete")
  const nameSearch=interaction.options.getString("nom")
  const sortType=interaction.options.getString("tri")||"nom"

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

  if(nameSearch){

   const search=nameSearch.toLowerCase()

   inventory=inventory.filter(e=>
    e.card.name.toLowerCase().includes(search)
   )

  }

  if(inventory.length===0)
   return interaction.reply("❌ Aucune carte trouvée.")

  if(sortType==="nom")
   inventory.sort((a,b)=>a.card.name.localeCompare(b.card.name))

  if(sortType==="rarete"){
   inventory.sort((a,b)=>{

    const r=rarityOrder[b.card.rarity]-rarityOrder[a.card.rarity]
    if(r!==0) return r

    return a.card.name.localeCompare(b.card.name)

   })
  }

  const perPage=20
  let page=1
  const totalPages=Math.ceil(inventory.length/perPage)

  function build(page){

   const start=(page-1)*perPage
   const data=inventory.slice(start,start+perPage)

   const lines=data.map(e=>{

    const emoji=rarityEmoji[e.card.rarity]||""
    const rarity=rarityNames[e.card.rarity]||""

    return `#${e.card.id} • ${emoji} **${rarity}** • ${e.card.name} (x${e.count})`

   })

   const embed=new EmbedBuilder()
    .setTitle(`🎴 Inventaire de ${interaction.user.username}`)
    .setDescription(lines.join("\n"))
    .setFooter({text:`${inventory.length} cartes • Page ${page}/${totalPages}`})

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

  const msg=await interaction.reply({
   embeds:[embed],
   components:[row],
   fetchReply:true
  })

  const collector=msg.createMessageComponentCollector({time:120000})

  collector.on("collect",async i=>{

   if(i.user.id!==interaction.user.id)
    return i.reply({content:"Pas ton inventaire.",ephemeral:true})

   if(i.customId==="next") page++
   if(i.customId==="prev") page--

   page=Math.max(1,Math.min(page,totalPages))

   const {embed,row}=build(page)

   await i.update({embeds:[embed],components:[row]})

  })

 }

}