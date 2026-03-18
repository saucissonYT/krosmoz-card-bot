const {
 EmbedBuilder
} = require("discord.js")

const {
 getEvent,
 isEventActive,
 initUserEvent,
 canUseEventPack
} = require("../../systems/eventSystem")

const { generateEventPack } = require("../../systems/eventPackEngine")
const { getUser, save } = require("../../systems/userSystem")
const { rewardKamas } = require("../../systems/economy")
const { addXP } = require("../../systems/progressionSystem")

function sleep(ms){
 return new Promise(r=>setTimeout(r,ms))
}

const rarityColor={
 C:"#95a5a6",
 U:"#2ecc71",
 R:"#3498db",
 SR:"#9b59b6",
 HR:"#e74c3c",
 UR:"#f1c40f",
 S:"#ecf0f1",
 SSR:"#ffcc00"
}

const rarityEmoji={
 C:"⚪",U:"🟢",R:"🔵",SR:"🟣",
 HR:"🔴",UR:"🟡",S:"✨",SSR:"🌈"
}

module.exports = {

 name:"eventpack",
 description:"Ouvrir un pack d'event",

 async execute(interaction){

  const event = getEvent()

  if(!isEventActive()){
   return interaction.reply({
    content:"❌ Aucun event actif.",
    ephemeral:true
   })
  }

  const user = getUser(interaction.user.id)

  initUserEvent(user)

  const check = canUseEventPack(user)

  if(!check.ok){
   return interaction.reply({
    content:`❌ ${check.error}`,
    ephemeral:true
   })
  }

  user.event.used++

  await interaction.deferReply()

  await interaction.editReply("🎴 Ouverture du pack d'event...")

  await sleep(800)

  const channel = interaction.channel

  if(!channel){
   return interaction.editReply("❌ Impossible d'accéder au channel.")
  }

  const message = await channel.send({
   embeds:[
    new EmbedBuilder()
     .setTitle("📦 Pack en cours...")
     .setDescription("✨ Une énergie étrange se forme...")
     .setColor("#9b59b6")
   ]
  })

  await sleep(1000)

  const result = generateEventPack(user,event)
  const pack = result.pack || result
  const flags = result.flags || []

  let kamas = 0
  let xp = 20

  for(const card of pack){
   user.cards[card.id]=(user.cards[card.id]||0)+1
   kamas += rewardKamas(user,card.rarity)

   if(event.stats && card.rarity==="SSR"){
    event.stats.ssr = (event.stats.ssr||0)+1
   }
  }

  xp += pack.length * 2

  if(event.key === "enutrof") kamas *= 5
  if(event.key === "feca") xp *= 5

  addXP(user,xp)

  if(event.stats){
   event.stats.packs = (event.stats.packs||0)+1
  }

  if(event.key === "sram"){

   const hidden = pack.map(()=> "❓ ???")

   let tmp=[]

   for(const h of hidden){
    tmp.push(h)

    await message.edit({
     embeds:[
      new EmbedBuilder()
       .setTitle("🕶️ Pack mystérieux")
       .setDescription(tmp.join("\n"))
       .setColor("#2c3e50")
     ]
    })

    await sleep(400)
   }

   await sleep(800)

   const reveal = pack.map(c=>
    `${rarityEmoji[c.rarity]} **${c.name}** \`${c.rarity}\``
   )

   await message.edit({
    embeds:[
     new EmbedBuilder()
      .setTitle("🎴 Révélation")
      .setDescription(reveal.join("\n"))
      .setColor(rarityColor[pack[0]?.rarity] || "#9b59b6")
    ]
   })

  }else{

   let revealed=[]

   for(const card of pack){

    const line = `${rarityEmoji[card.rarity]} **${card.name}** \`${card.rarity}\``

    revealed.push(line)

    const embed = new EmbedBuilder()
     .setTitle("🎴 Ouverture du pack")
     .setDescription(revealed.join("\n"))
     .setColor(rarityColor[card.rarity] || "#9b59b6")

    await message.edit({embeds:[embed]})

    await sleep(500)
   }
  }

  const remaining = user.event.tickets - user.event.used

  const finalEmbed = new EmbedBuilder()
   .setTitle(`🎁 ${event.name}`)
   .setDescription(
    pack.map(c=>`${rarityEmoji[c.rarity]} **${c.name}**`).join("\n")
    + (flags.length ? "\n\n" + flags.join("\n") : "")
   )
   .addFields(
    {name:"💰 Kamas",value:`+${kamas}`,inline:true},
    {name:"⭐ XP",value:`+${xp}`,inline:true},
    {name:"🎟️ Tickets",value:`${remaining}/${user.event.tickets}`,inline:true}
   )
   .setColor("#f1c40f")

  await message.edit({embeds:[finalEmbed]})

  save()

 }

}