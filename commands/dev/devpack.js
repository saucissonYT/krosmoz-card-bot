const {
 EmbedBuilder,
 ActionRowBuilder,
 ButtonBuilder,
 ButtonStyle
} = require("discord.js")

const { generatePack } = require("../../systems/pack")
const { rewardKamas } = require("../../systems/economy")

const { getCards } = require("../../systems/cardRegistry")
const cards = getCards()

const { getUser, save } = require("../../systems/userSystem")

const setsData = require("../../cards/sets.json")
const sets = Array.isArray(setsData) ? setsData : setsData.sets

const OWNER_ID="231419667179241472"

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

function giveCard(user,card){

 if(!user.cards) user.cards={}

 user.cards[card.id]=(user.cards[card.id]||0)+1

}

function packText(pack){

 return pack
  .map((c,i)=>`${i+1}. ${rarityEmoji[c.rarity]} ${c.name}`)
  .join("\n")

}

module.exports={

 name:"devpack",

 options:[

  {
   name:"set",
   description:"Set à tester",
   type:3,
   required:false,
   choices:sets.map(s=>({
    name:s.name,
    value:s.id
   }))
  },

  {
   name:"amount",
   description:"Nombre de packs à générer",
   type:4,
   required:false
  }

 ],

 async execute(interaction){

  if(interaction.user.id !== OWNER_ID)
   return interaction.reply({
    content:"Commande dev.",
    flags:64
   })

  const user=getUser(interaction.user.id)

  const setId=
   interaction.options.getString("set") ||
   sets[0].id

  const amount=
   interaction.options.getInteger("amount") || 1

  /* MULTI PACK DEBUG */

  if(amount > 1){

   let pulls=[]

   for(let i=0;i<amount;i++){

    const result=generatePack(user,setId)

    pulls.push(...result.pack)

   }

   const rarityCount={}

   pulls.forEach(card=>{
    rarityCount[card.rarity]=(rarityCount[card.rarity]||0)+1
   })

   const lines=Object.entries(rarityCount)
    .map(([r,q])=>`${rarityEmoji[r]} ${r} : ${q}`)

   const embed=new EmbedBuilder()

    .setTitle(`🎴 DEV PACK x${amount}`)
    .setDescription(`
Set : **${setId}**

Cartes tirées : **${pulls.length}**

${lines.join("\n")}
`)

   return interaction.reply({embeds:[embed]})

  }

  /* PACK NORMAL */

  const result=generatePack(user,setId)
  const pack=result.pack

  const embed=new EmbedBuilder()
   .setTitle(`🎴 DEV PACK (${setId})`)
   .setDescription(packText(pack))

  const row=new ActionRowBuilder()

  pack.slice(0,5).forEach((card,index)=>{

   row.addComponents(
    new ButtonBuilder()
     .setCustomId(`pick_${index}`)
     .setLabel(`${index+1}`)
     .setStyle(ButtonStyle.Primary)
   )

  })

  const msg=await interaction.reply({
   embeds:[embed],
   components:[row],
   fetchReply:true
  })

  const collector=msg.createMessageComponentCollector({
   time:60000
  })

  collector.on("collect",async i=>{

   if(i.user.id !== interaction.user.id)
    return i.reply({
     content:"Pas ton pack.",
     flags:64
    })

   const index=parseInt(i.customId.split("_")[1])
   const card=pack[index]

   giveCard(user,card)

   const gain=rewardKamas(user,card.rarity)

   save()

   const imagePath=`./cards/images/${card.set}/${card.image}`

   const resultEmbed=new EmbedBuilder()
    .setTitle("Carte récupérée (DEV)")
    .setDescription(
`${rarityEmoji[card.rarity]} ${card.name}
💰 +${gain} kamas`
    )
    .setImage(`attachment://${card.image}`)

   await i.update({
    embeds:[resultEmbed],
    components:[],
    files:[imagePath]
   })

   collector.stop()

  })

 }

}