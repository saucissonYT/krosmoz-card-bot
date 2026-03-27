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

const { RARITY_EMOJI, RARITY_PRICE } = require("../../systems/constants")
const { CARDS_IMAGES_DIR } = require("../../systems/dataManager")
const { getCardsById } = require("../../systems/cardRegistry")
const { addListing } = require("../../systems/market")
const { getUser, save } = require("../../systems/userSystem")

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
    flags:64
   })

  if(!card)
   return interaction.reply("❌ Carte introuvable.")

  const count=user.cards?.[card.id]||0

  /*
   * FIX SHINY: Affichage de l'info shiny dans le détail de la carte.
   * Si le joueur possède une version shiny de cette carte,
   * on change l'embed (couleur dorée, icône ✨) et on affiche le nombre.
   */
  const shinyCount = user.shinyCards?.[card.id] || 0
  const isShiny = shinyCount > 0

  const titleEmoji = isShiny ? "✨" : RARITY_EMOJI[card.rarity]
  const titleSuffix = isShiny ? " ✨ SHINY" : ""

  let description =
`🆔 ID : ${card.id}
⭐ Rareté : ${card.rarity}
📚 Set : ${card.set}
📦 Possédé : x${count}`

  if(isShiny){
   description += `\n\n✨ **Version Shiny** : x${shinyCount}`
  }

  const embed=new EmbedBuilder()
   .setTitle(`${titleEmoji} ${card.name}${titleSuffix}`)
   .setDescription(description)

  /* Couleur spéciale pour les shiny */
  if(isShiny){
   embed.setColor("#FFD700")
  }

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
    return i.reply({content:"Pas ta carte.",flags:64})

   /* ---------------- SELL ---------------- */

   if(i.customId.startsWith("sell_")){

    const cid=i.customId.split("_")[1]

    if(!user.cards[cid])
     return i.reply({content:"❌ Tu ne possèdes plus cette carte.",flags:64})

    const card=cardsById[cid]
    const price=RARITY_PRICE[card.rarity]||10

    user.cards[cid]--

    if(user.cards[cid]===0)
     delete user.cards[cid]

    user.kamas+=price

    if(!user.stats) user.stats={}
    user.stats.cardsSold=(user.stats.cardsSold||0)+1

    /* FIX : save ciblé par userId au lieu de save() global */
    save(interaction.user.id)

    return i.reply(`💰 Carte vendue : **${card.name}**\nGain : **${price} kamas**`)
   }

   /* ---------------- MARKET BUTTON ---------------- */

   if(i.customId.startsWith("market_")){

    const cid=i.customId.split("_")[1]

    if(!user.cards[cid])
     return i.reply({content:"❌ Tu ne possèdes plus cette carte.",flags:64})

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

  collector.on("end", () => {
   msg.edit({ components: [] }).catch(() => {})
  })

 },

 /* ---------------- MODAL HANDLER ---------------- */

 async modal(interaction){

  if(!interaction.customId.startsWith("marketmodal_")) return

  const cid=interaction.customId.split("_")[1]

  const price=parseInt(interaction.fields.getTextInputValue("price"))

  if(isNaN(price) || price<=0)
   return interaction.reply({
    content:"❌ Prix invalide.",
    flags:64
   })

  const user=getUser(interaction.user.id)

  if(!user.cards[cid])
   return interaction.reply({
    content:"❌ Tu ne possèdes plus cette carte.",
    flags:64
   })

  const result = addListing(
   interaction.user.id,
   parseInt(cid),
   price
  )

  if(result?.error)
   return interaction.reply({
    content:`❌ ${result.error}`,
    flags:64
   })

  /* FIX : save ciblé par userId au lieu de save() global */
  save(interaction.user.id)

  return interaction.reply({
   content:`🛒 Carte mise en vente pour **${price} kamas**.`,
   flags:64
  })

 }

}