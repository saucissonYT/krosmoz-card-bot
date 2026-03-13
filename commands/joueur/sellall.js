const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require("discord.js")

const cardsData=require("../../cards/cards.json")
const cards=Array.isArray(cardsData)?cardsData:cardsData.cards

const { getUser, save } = require("../../systems/usersystem")
const { achievementCheck } = require("../../systems/achievementCheck")

const cardsById={}
for(const c of cards){
 cardsById[c.id]=c
}

const rarityEmoji={
 C:"⚪",U:"🟢",R:"🔵",SR:"🟣",
 HR:"🔴",UR:"🟡",S:"✨",SSR:"🌈"
}

const sellValues={
 C:5,U:10,R:25,SR:60,HR:120,
 UR:300,S:600,SSR:1500
}

module.exports={

 name:"sellall",

 options:[
  {name:"rarete",type:3,required:true,
   choices:[
    {name:"Commune",value:"C"},
    {name:"Peu Commune",value:"U"},
    {name:"Rare",value:"R"},
    {name:"Super Rare",value:"SR"},
    {name:"Hyper Rare",value:"HR"}
   ]
  }
 ],

 async execute(interaction){

  const user=getUser(interaction.user.id)

  const rarity=interaction.options.getString("rarete")

  if(!user.cards || Object.keys(user.cards).length===0)
   return interaction.reply("Inventaire vide.")

  let totalCards=0
  let totalKamas=0

  const toSell=[]

  for(const id in user.cards){

   const card=cardsById[id]
   if(!card) continue

   if(card.rarity!==rarity) continue

   const count=user.cards[id]

   const price=sellValues[rarity]||10

   totalCards+=count
   totalKamas+=price*count

   toSell.push({id,count,price})

  }

  if(totalCards===0)
   return interaction.reply("❌ Aucune carte à vendre.")

  const embed=new EmbedBuilder()
   .setTitle("⚠️ Confirmation vente")
   .setDescription(
`${rarityEmoji[rarity]} ${rarity}

Cartes vendues : **${totalCards}**

Gain : **${totalKamas} kamas**`
   )

  const row=new ActionRowBuilder().addComponents(

   new ButtonBuilder()
    .setCustomId("confirm_sellall")
    .setLabel("Confirmer")
    .setStyle(ButtonStyle.Success),

   new ButtonBuilder()
    .setCustomId("cancel_sellall")
    .setLabel("Annuler")
    .setStyle(ButtonStyle.Danger)

  )

  const msg=await interaction.reply({
   embeds:[embed],
   components:[row],
   fetchReply:true
  })

  const collector=msg.createMessageComponentCollector({
   time:30000,
   max:1
  })

  collector.on("collect",async i=>{

   if(i.user.id!==interaction.user.id)
    return i.reply({content:"Pas ta vente.",ephemeral:true})

   if(i.customId==="cancel_sellall")
    return i.update({content:"❌ Vente annulée.",embeds:[],components:[]})

   for(const item of toSell){

    user.kamas+=item.count*item.price

    user.stats.cardsSold=(user.stats.cardsSold||0)+item.count

    delete user.cards[item.id]

   }

   await achievementCheck(interaction,user)

   save()

   i.update({
    content:`💰 Vente réussie !

Cartes vendues : ${totalCards}

Gain : **${totalKamas} kamas**

Solde : ${user.kamas} kamas`,
    embeds:[],
    components:[]
   })

  })

 }

}