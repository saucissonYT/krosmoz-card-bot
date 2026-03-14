const {
 EmbedBuilder,
 ActionRowBuilder,
 ButtonBuilder,
 ButtonStyle,
 ModalBuilder,
 TextInputBuilder,
 TextInputStyle
} = require("discord.js")

const { data } = require("../../systems/dataManager")
const cards = data.cards || []

const { addListing } = require("../../systems/market")
const { getUser, save } = require("../../systems/userSystem")

const cardsById={}
for(const c of cards){
 cardsById[c.id]=c
}

const rarityEmoji={
 C:"⚪",U:"🟢",R:"🔵",SR:"🟣",
 HR:"🔴",UR:"🟡",S:"✨",SSR:"🌈"
}

module.exports={

 name:"carte",

 options:[
  {name:"nom",type:3,required:false},
  {name:"id",type:4,required:false},
  {name:"numero",type:4,required:false}
 ],

 async execute(interaction){

  const user=getUser(interaction.user.id)

  const name=interaction.options.getString("nom")
  const id=interaction.options.getInteger("id")
  const numero=interaction.options.getInteger("numero")

  let card

  if(id)
   card=cardsById[id]

  else if(numero){

   const inv=Object.entries(user.cards||{})

   if(numero<1||numero>inv.length)
    return interaction.reply("❌ Numéro invalide.")

   const cardId=inv[numero-1][0]

   card=cardsById[cardId]

  }

  else if(name){

   card=cards.find(c=>
    c.name.toLowerCase().includes(name.toLowerCase())
   )

  }

  else
   return interaction.reply({
    content:"❌ Tu dois préciser `nom`, `id` ou `numero`.",
    ephemeral:true
   })

  if(!card)
   return interaction.reply("❌ Carte introuvable.")

  const count=user.cards?.[card.id]||0

  const embed=new EmbedBuilder()
   .setTitle(`${rarityEmoji[card.rarity]} ${card.name}`)
   .setDescription(
`🆔 ID : ${card.id}
⭐ Rareté : ${card.rarity}
📚 Set : ${card.set}
📦 Possédé : x${count}`
   )
   .setImage(`attachment://${card.image}`)

  const row=new ActionRowBuilder().addComponents(

   new ButtonBuilder()
    .setCustomId(`sell_${card.id}`)
    .setLabel("💰 Vendre")
    .setStyle(ButtonStyle.Danger),

   new ButtonBuilder()
    .setCustomId(`market_${card.id}`)
    .setLabel("🛒 Mettre au market")
    .setStyle(ButtonStyle.Primary)

  )

  const msg=await interaction.reply({
   embeds:[embed],
   components:[row],
   files:[`./cards/images/${card.set}/${card.image}`],
   fetchReply:true
  })

  const collector=msg.createMessageComponentCollector({time:60000})

  collector.on("collect",async i=>{

   if(i.user.id!==interaction.user.id)
    return i.reply({content:"Pas ta carte.",ephemeral:true})

   if(i.customId.startsWith("sell_")){

    const cid=i.customId.split("_")[1]

    if(!user.cards[cid])
     return i.reply({content:"❌ Tu ne possèdes plus cette carte.",ephemeral:true})

    user.cards[cid]--

    if(user.cards[cid]===0)
     delete user.cards[cid]

    user.kamas+=10

    save()

    return i.reply(`💰 Carte vendue pour **10 kamas**.`)

   }

   if(i.customId.startsWith("market_")){

    const cid=i.customId.split("_")[1]

    const modal=new ModalBuilder()
     .setCustomId(`marketmodal_${cid}`)
     .setTitle("Mettre en vente")

    const priceInput=new TextInputBuilder()
     .setCustomId("price")
     .setLabel("Prix de vente")
     .setStyle(TextInputStyle.Short)
     .setRequired(true)

    modal.addComponents(
     new ActionRowBuilder().addComponents(priceInput)
    )

    await i.showModal(modal)

   }

  })

 }

}