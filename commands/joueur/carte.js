const fs = require("fs")

const {
 SlashCommandBuilder,
 EmbedBuilder,
 ActionRowBuilder,
 ButtonBuilder,
 ButtonStyle,
 ModalBuilder,
 TextInputBuilder,
 TextInputStyle
} = require("discord.js")

const { CARDS_IMAGES_DIR } = require("../../systems/dataManager")
const { getCardsById } = require("../../systems/cardRegistry")

const { addListing } = require("../../systems/market")
const { getUser, save } = require("../../systems/userSystem")

const rarityEmoji={
 C:"⚪",U:"🟢",R:"🔵",SR:"🟣",
 HR:"🔴",UR:"🟡",S:"✨",SSR:"🌈"
}

module.exports={

 data:new SlashCommandBuilder()
  .setName("carte")
  .setDescription("Afficher une carte")
  .addStringOption(option =>
   option.setName("nom").setDescription("Nom de la carte")
  )
  .addIntegerOption(option =>
   option.setName("id").setDescription("ID de la carte")
  ),

 async execute(interaction){

  const cardsById = getCardsById()
  const cards = Object.values(cardsById)

  const user=getUser(interaction.user.id)

  const name=interaction.options.getString("nom")
  const id=interaction.options.getInteger("id")

  let card

  if(id){
   card=cardsById[id]
  }

  else if(name){

   card=cards.find(c=>
    c.name.toLowerCase().includes(name.toLowerCase())
   )

  }

  else
   return interaction.reply({
    content:"❌ Tu dois préciser `nom` ou `id`.",
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

  const filePath=`${CARDS_IMAGES_DIR}/${card.set}/${card.image}`

  let files=[]

  if(fs.existsSync(filePath)){
   embed.setImage(`attachment://${card.image}`)
   files=[{attachment:filePath,name:card.image}]
  }else{
   embed.setFooter({text:"Image manquante"})
  }

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
   files:files,
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