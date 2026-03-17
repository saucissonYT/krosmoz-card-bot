const {
 EmbedBuilder,
 ActionRowBuilder,
 ButtonBuilder,
 ButtonStyle
} = require("discord.js")

const { getShop, buyFromShop } = require("../../systems/krosmoshop")
const { getCardsById } = require("../../systems/cardRegistry")
const { getUser } = require("../../systems/userSystem")

const { achievementCheck } = require("../../systems/achievementCheck")
const { notifyAchievements } = require("../../systems/achievementNotifier")

const cardsById=getCardsById()

const rarityEmoji={
 C:"⚪",U:"🟢",R:"🔵",SR:"🟣",
 HR:"🔴",UR:"🟡",S:"✨",SSR:"🌈"
}

module.exports={

 name:"krosmoshop",

 async execute(interaction){

  const shop=getShop()

  const embed=new EmbedBuilder()
   .setTitle("🏪 KrosmoShop")
   .setDescription(`Boutique officielle du Krosmoz.

Chaque aventurier peut acheter **une copie de chaque carte par jour**.`)

  const rows=[]

  shop.cards.forEach(entry=>{

   const card=cardsById[entry.card]

   embed.addFields({
    name:`${rarityEmoji[card.rarity]} ${card.name}`,
    value:`${entry.price} kamas`,
    inline:false
   })

   rows.push(
    new ActionRowBuilder().addComponents(
     new ButtonBuilder()
      .setCustomId(`kshop_buy_${entry.card}`)
      .setLabel("Acheter")
      .setStyle(ButtonStyle.Success)
    )
   )

  })

  await interaction.reply({
   embeds:[embed],
   components:rows
  })

 },

 async button(interaction){

  if(!interaction.customId.startsWith("kshop_buy_")) return

  const userId=interaction.user.id
  const cardId=interaction.customId.split("_")[2]

  const result=buyFromShop(userId,cardId)

  if(result?.error)
   return interaction.reply({
    content:`❌ ${result.error}`,
    flags:64
   })

  const user=getUser(userId)

  const unlocked=achievementCheck(user,"krosmoshop")

  if(unlocked.length)
   await notifyAchievements(interaction,unlocked)

  return interaction.reply({
   content:"🛒 Achat effectué.",
   flags:64
  })

 }

}