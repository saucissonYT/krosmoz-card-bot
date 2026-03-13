const { EmbedBuilder } = require("discord.js")

const cardsData = require("../../cards/cards.json")
const cards = Array.isArray(cardsData) ? cardsData : cardsData.cards

const { getUser, save } = require("../../systems/userSystem")
const { checkAchievements } = require("../../systems/achievementSystem")
const { achievementCheck } = require("../../systems/achievementCheck")

const cardsById={}
for(const card of cards){
 cardsById[card.id]=card
}

const rarityEmoji={
 C:"⚪",U:"🟢",R:"🔵",SR:"🟣",
 HR:"🔴",UR:"🟡",S:"✨",SSR:"🌈"
}

const rarityNames={
 C:"Commune",U:"Peu Commune",R:"Rare",SR:"Super Rare",
 HR:"Hyper Rare",UR:"Ultra Rare",S:"Chromatique",SSR:"Super Chromatique"
}

const rarityOrder={
 C:1,U:2,R:3,SR:4,HR:5,UR:6,S:7,SSR:8
}

module.exports={

 name:"sellcard",

 options:[
  {name:"id",description:"ID de la carte",type:4,required:false},
  {name:"quantite",description:"Quantité",type:4,required:false}
 ],

 async execute(interaction){

  const user = getUser(interaction.user.id)

  const id = interaction.options.getInteger("id")
  const quantity = Math.max(1,interaction.options.getInteger("quantite")||1)

  if(!user.cards) user.cards={}

  if(!id){

   const inventory=[]

   for(const cid in user.cards){

    const card=cardsById[cid]
    if(!card) continue

    inventory.push({
     card,
     count:user.cards[cid]
    })

   }

   inventory.sort((a,b)=>
    rarityOrder[a.card.rarity]-rarityOrder[b.card.rarity]
   )

   const lines=inventory.slice(0,30).map(entry=>{

    const c=entry.card
    const emoji=rarityEmoji[c.rarity]
    const rarityName=rarityNames[c.rarity]
    const countText=entry.count>1?` (x${entry.count})`:""

    return `ID:${c.id} ${emoji} ${c.name} — ${rarityName}${countText}`

   })

   if(lines.length===0)
    lines.push("Aucune carte.")

   const embed=new EmbedBuilder()
    .setTitle("💰 Vente de cartes")
    .setDescription(`${lines.join("\n")}

Commande :
/sellcard id:<ID> quantite:<nombre>`)
    .setFooter({
     text:`${inventory.length} cartes dans l'inventaire`
    })

   return interaction.reply({
    embeds:[embed],
    ephemeral:true
   })

  }

  const card=cardsById[id]

  if(!card)
   return interaction.reply("Carte introuvable.")

  const owned=user.cards[id]||0

  if(owned < quantity)
   return interaction.reply("Tu ne possèdes pas autant de cartes.")

  const baseValue=card.value||50
  const sellPrice=Math.floor(baseValue/2)
  const total=sellPrice*quantity

  user.cards[id]-=quantity

  if(user.cards[id]<=0)
   delete user.cards[id]

  user.kamas+=total

  user.stats.cardsSold += quantity

  await achievementCheck(interaction,user)

  save()

  interaction.reply(
`💰 Vente réussie !

${quantity} × ${card.name}

Gain : ${total} kamas

Solde : ${user.kamas} kamas`
  )

 }

}