const {
 EmbedBuilder,
 ActionRowBuilder,
 ButtonBuilder,
 ButtonStyle
} = require("discord.js")

const {generatePack,packText,rarityEmoji,giveCard} = require("../../systems/pack")
const {rewardKamas} = require("../../systems/economy")

const sets = require("../../cards/sets.json")

const OWNER_ID="231419667179241472"

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
  }
 ],

 async execute(interaction,user,save){

  if(interaction.user.id !== OWNER_ID)
   return interaction.reply({
    content:"Commande dev.",
    ephemeral:true
   })

  const setId =
   interaction.options.getString("set") ||
   sets[0].id

  const pack = generatePack(user,setId)

  const embed = new EmbedBuilder()
   .setTitle(`🎴 DEV PACK (${setId})`)
   .setDescription(packText(pack))

  const row = new ActionRowBuilder()

  pack.forEach((card,index)=>{

   row.addComponents(
    new ButtonBuilder()
     .setCustomId(`pick_${index}`)
     .setLabel(`${index+1}`)
     .setStyle(ButtonStyle.Primary)
   )

  })

  const msg = await interaction.reply({
   embeds:[embed],
   components:[row],
   fetchReply:true
  })

  const collector = msg.createMessageComponentCollector({
   time:60000
  })

  collector.on("collect",async i=>{

   if(i.user.id !== interaction.user.id)
    return i.reply({
     content:"Pas ton pack.",
     ephemeral:true
    })

   const index=parseInt(i.customId.split("_")[1])
   const card=pack[index]

   giveCard(user,card)

   const gain=rewardKamas(user,card.rarity)

   save()

   const imagePath=`./cards/images/${card.set}/${card.image}`

   const result=new EmbedBuilder()
    .setTitle("Carte récupérée (DEV)")
    .setDescription(
`${rarityEmoji[card.rarity]} ${card.name}
💰 +${gain} kamas`
    )
    .setImage(`attachment://${card.image}`)

   await i.update({
    embeds:[result],
    components:[],
    files:[imagePath]
   })

   collector.stop()

  })

 }
}