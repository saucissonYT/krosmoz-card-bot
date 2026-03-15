const {
 SlashCommandBuilder,
 ActionRowBuilder,
 StringSelectMenuBuilder,
 EmbedBuilder,
 ButtonBuilder,
 ButtonStyle
} = require("discord.js")

const { data } = require("../../systems/dataManager")
const cards = data.cards || []

const { getUser, save } = require("../../systems/userSystem")

const trades = {}
const activeUsers = new Set()
const tradeCooldown = new Map()

function createTrade(id,data){
 trades[id] = data
}

function getTrade(id){
 return trades[id]
}

function deleteTrade(id){
 delete trades[id]
}

const rarityEmoji={
 C:"⚪",U:"🟢",R:"🔵",SR:"🟣",
 HR:"🔴",UR:"🟡",S:"✨",SSR:"🌈"
}

const cardValues={
 C:5,U:10,R:20,SR:40,HR:80,UR:150,S:300,SSR:1000
}

const TRADE_COOLDOWN = 30000

module.exports={

data:new SlashCommandBuilder()
 .setName("trade")
 .setDescription("Proposer un échange")
 .addUserOption(o=>
  o.setName("joueur")
   .setDescription("Joueur cible")
   .setRequired(true)
 ),

async execute(interaction){

 const now = Date.now()
 const userId = interaction.user.id

 if(tradeCooldown.has(userId)){

  const diff = now - tradeCooldown.get(userId)

  if(diff < TRADE_COOLDOWN){

   const remain = Math.ceil((TRADE_COOLDOWN-diff)/1000)

   return interaction.reply({
    content:`⏳ Attends **${remain}s** avant de refaire un trade.`,
    flags:64
   })

  }

 }

 tradeCooldown.set(userId,now)

 const target = interaction.options.getUser("joueur")

 if(target.id === userId){
  return interaction.reply({
   content:"❌ Impossible d'échanger avec toi-même.",
   flags:64
  })
 }

 if(activeUsers.has(userId)){
  return interaction.reply({
   content:"❌ Tu as déjà un échange en cours.",
   flags:64
  })
 }

 if(activeUsers.has(target.id)){
  return interaction.reply({
   content:"❌ Ce joueur est déjà dans un échange.",
   flags:64
  })
 }

 const user = getUser(userId)

 const tradeId = `${userId}_${Date.now()}`

 createTrade(tradeId,{
  from:userId,
  to:target.id
 })

 activeUsers.add(userId)
 activeUsers.add(target.id)

 const options=[]

 for(const id in user.cards){

  const qty=user.cards[id]

  if(qty>0){

   const card = cards.find(c=>c.id==id)
   if(!card) continue

   options.push({
    label:`${card.name} • ${card.rarity} ${rarityEmoji[card.rarity]} • x${qty}`,
    value:String(card.id)
   })

  }

 }

 if(options.length===0){
  return interaction.reply({
   content:"❌ Tu n'as aucune carte échangeable.",
   flags:64
  })
 }

 const menu = new StringSelectMenuBuilder()

  .setCustomId(`trade_menu_give_${tradeId}`)
  .setPlaceholder("Carte à donner")
  .addOptions(options.slice(0,25))

 const row = new ActionRowBuilder().addComponents(menu)

 await interaction.reply({
  content:`🔄 ${target}, **${interaction.user.username}** te propose un échange.`,
  components:[row]
 })

},

async menu(interaction){

 const parts = interaction.customId.split("_")

 const type = parts[2]
 const tradeId = parts.slice(3).join("_")

 const trade = getTrade(tradeId)

 if(!trade){
  return interaction.reply({
   content:"❌ Trade expiré.",
   flags:64
  })
 }

 if(interaction.user.id !== trade.from){
  return interaction.reply({
   content:"❌ Seul le créateur choisit les cartes.",
   flags:64
  })
 }

 const user = getUser(trade.from)
 const target = getUser(trade.to)

 if(type==="give"){

  trade.giveCard = interaction.values[0]

  const options=[]

  for(const id in target.cards){

   const qty = target.cards[id]

   if(qty>0){

    const card = cards.find(c=>c.id==id)
    if(!card) continue

    options.push({
     label:`${card.name} • ${card.rarity} ${rarityEmoji[card.rarity]} • x${qty}`,
     value:String(card.id)
    })

   }

  }

  const menu = new StringSelectMenuBuilder()

   .setCustomId(`trade_menu_want_${tradeId}`)
   .setPlaceholder("Carte demandée")
   .addOptions(options.slice(0,25))

  const row = new ActionRowBuilder().addComponents(menu)

  return interaction.update({
   content:"Carte demandée",
   components:[row]
  })

 }

 if(type==="want"){

  trade.wantCard = interaction.values[0]

  const giveCard = cards.find(c=>c.id==trade.giveCard)
  const wantCard = cards.find(c=>c.id==trade.wantCard)

  const embed=new EmbedBuilder()

  .setTitle("🔄 Proposition d'échange")

  .addFields(
   {
    name:"Tu donnes",
    value:`${rarityEmoji[giveCard.rarity]} **${giveCard.name}**
Rareté : ${giveCard.rarity}
Valeur : ${cardValues[giveCard.rarity]}`,
    inline:true
   },
   {
    name:"Tu reçois",
    value:`${rarityEmoji[wantCard.rarity]} **${wantCard.name}**
Rareté : ${wantCard.rarity}
Valeur : ${cardValues[wantCard.rarity]}`,
    inline:true
   }
  )

  const row=new ActionRowBuilder().addComponents(

   new ButtonBuilder()
    .setCustomId(`trade_accept_${tradeId}`)
    .setLabel("Accepter")
    .setStyle(ButtonStyle.Success),

   new ButtonBuilder()
    .setCustomId(`trade_refuse_${tradeId}`)
    .setLabel("Refuser")
    .setStyle(ButtonStyle.Danger),

   new ButtonBuilder()
    .setCustomId(`trade_cancel_${tradeId}`)
    .setLabel("Annuler")
    .setStyle(ButtonStyle.Secondary)

  )

  return interaction.update({
   embeds:[embed],
   components:[row]
  })

 }

},

async button(interaction){

 const parts = interaction.customId.split("_")

 const action = parts[1]
 const tradeId = parts.slice(2).join("_")

 const trade = getTrade(tradeId)

 if(!trade)
  return interaction.reply({content:"❌ Trade inexistant.",flags:64})

 const from = getUser(trade.from)
 const to = getUser(trade.to)

 /* empêche initiateur d'accepter */

 if(action==="accept" && interaction.user.id !== trade.to){
  return interaction.reply({
   content:"❌ Seul le joueur ciblé peut accepter l'échange.",
   flags:64
  })
 }

 if(action==="accept"){

  if(!from.cards[trade.giveCard] || !to.cards[trade.wantCard]){
   deleteTrade(tradeId)
   activeUsers.delete(trade.from)
   activeUsers.delete(trade.to)

   return interaction.update({
    content:"❌ L'une des cartes n'est plus disponible.",
    embeds:[],
    components:[]
   })
  }

  from.cards[trade.giveCard]--
  to.cards[trade.wantCard]--

  if(from.cards[trade.giveCard]<=0) delete from.cards[trade.giveCard]
  if(to.cards[trade.wantCard]<=0) delete to.cards[trade.wantCard]

  from.cards[trade.wantCard]=(from.cards[trade.wantCard]||0)+1
  to.cards[trade.giveCard]=(to.cards[trade.giveCard]||0)+1

  save()

  activeUsers.delete(trade.from)
  activeUsers.delete(trade.to)
  deleteTrade(tradeId)

  return interaction.update({
   content:"🔁 Échange validé !",
   embeds:[],
   components:[]
  })

 }

 if(action==="refuse" || action==="cancel"){

  activeUsers.delete(trade.from)
  activeUsers.delete(trade.to)
  deleteTrade(tradeId)

  return interaction.update({
   content:"❌ Échange annulé.",
   embeds:[],
   components:[]
  })

 }

}

}