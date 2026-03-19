const { EmbedBuilder } = require("discord.js")

const {
 getEvent,
 isEventActive,
 initUserEvent,
 canUseEventPack,
 registerEventPack
} = require("../../systems/eventSystem")

const { generateEventPack } = require("../../systems/eventPackEngine")
const { getUser, save } = require("../../systems/userSystem")
const { applyEventRewards } = require("../../systems/rewardSystem")

function sleep(ms){
 return new Promise(r=>setTimeout(r,ms))
}

const rarityColor={
 C:"#95a5a6",U:"#2ecc71",R:"#3498db",SR:"#9b59b6",
 HR:"#e74c3c",UR:"#f1c40f",S:"#ecf0f1",SSR:"#ffcc00"
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
   return interaction.reply({ content:"❌ Aucun event actif.", flags:64 })
  }

  const user = getUser(interaction.user.id)

  initUserEvent(user)

  const check = canUseEventPack(user)

  if(!check.ok){
   return interaction.reply({ content:`❌ ${check.error}`, flags:64 })
  }

  user.event.used++

  await interaction.deferReply()
  await interaction.editReply("🎴 Ouverture du pack d'event...")

  const channel = interaction.channel

  const message = await channel.send({
   embeds:[
    new EmbedBuilder()
     .setTitle("📦 Pack en cours...")
     .setDescription("✨ Une énergie étrange se forme...")
     .setColor("#9b59b6")
   ]
  })

  /* ---------- PACK ---------- */

  let pack=[], flags=[], meta={}

  try {
   const result = generateEventPack(user,event)

   console.log("EVENT:", event.key)
   console.log("RESULT:", result)

   pack = result?.pack || []
   flags = result?.flags || []
   meta = result?.meta || {}

  } catch(e){
   console.error("PACK ERROR:", e)
   return interaction.editReply("❌ Erreur génération pack.")
  }

  if(!Array.isArray(pack) || pack.length === 0){
   return interaction.editReply("❌ Pack invalide.")
  }

  /* ---------- REWARDS ---------- */

  let kamas=0, xp=0, jackpotMessage=null

  try {
   const r = applyEventRewards(user, pack, event, meta)
   kamas=r.kamas||0
   xp=r.xp||0
   jackpotMessage=r.jackpotMessage
  } catch(e){
   console.error("REWARD ERROR:", e)
  }

  if(jackpotMessage) channel.send(jackpotMessage)

  registerEventPack(pack)

  /* ---------- REVEAL ---------- */

  let revealed=[]

  for(const card of pack){

   if(!card || !card.id) continue

   user.cards[card.id]=(user.cards[card.id]||0)+1

   const line = `${rarityEmoji[card.rarity]||"❓"} **${card.name||"???"}**`

   revealed.push(line)

   await message.edit({
    embeds:[
     new EmbedBuilder()
      .setTitle(`🎴 Ouverture (${pack.length})`)
      .setDescription(revealed.join("\n") || "...")
      .setColor(rarityColor[card.rarity]||"#9b59b6")
    ]
   })

   await sleep(300)
  }

  const description = revealed.join("\n").trim()

  await message.edit({
   embeds:[
    new EmbedBuilder()
     .setTitle(`🎁 ${event.name}`)
     .setDescription(description || "❌ Aucune carte")
     .addFields(
      {name:"💰 Kamas",value:`+${kamas}`,inline:true},
      {name:"⭐ XP",value:`+${xp}`,inline:true},
      {name:"🎟️ Tickets",value:`${user.event.tickets-user.event.used}/${user.event.tickets}`,inline:true}
     )
     .setColor("#f1c40f")
   ]
  })

  save()

 }
}