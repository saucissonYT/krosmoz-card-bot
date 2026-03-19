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

 async execute(interaction){

  console.log("=== EVENTPACK START ===")

  try {

   const event = getEvent()
   console.log("EVENT:", event)

   if(!isEventActive()){
    console.log("NO EVENT")
    return interaction.reply({ content:"❌ Aucun event actif.", flags:64 })
   }

   const user = getUser(interaction.user.id)
   console.log("USER:", user?.id)

   initUserEvent(user)
   console.log("USER EVENT:", user.event)

   const check = canUseEventPack(user)
   console.log("CHECK:", check)

   if(!check.ok){
    return interaction.reply({ content:`❌ ${check.error}`, flags:64 })
   }

   user.event.used++

   await interaction.deferReply()
   await interaction.editReply("🎴 Ouverture du pack d'event...")

   console.log("STEP: message initial envoyé")

   const channel = interaction.channel

   const message = await channel.send({
    embeds:[
     new EmbedBuilder()
      .setTitle("📦 Pack en cours...")
      .setDescription("✨ Une énergie étrange se forme...")
   ]
   })

   console.log("STEP: embed envoyé")

   /* ================= PACK ================= */

   let pack=[], flags=[], meta={}

   try {

    console.log("STEP: generateEventPack CALL")

    const result = generateEventPack(user,event)

    console.log("RESULT:", result)

    pack = result?.pack || []
    flags = result?.flags || []
    meta = result?.meta || {}

    console.log("PACK:", pack)

   } catch(e){
    console.error("❌ PACK ERROR:", e)
    return interaction.editReply("❌ Erreur génération pack.")
   }

   if(!Array.isArray(pack)){
    console.error("PACK NOT ARRAY")
    return interaction.editReply("❌ Pack invalide.")
   }

   if(pack.length === 0){
    console.error("PACK EMPTY")
    return interaction.editReply("❌ Pack vide.")
   }

   console.log("STEP: pack OK")

   /* ================= REWARD ================= */

   let kamas=0, xp=0, jackpotMessage=null

   try {
    console.log("STEP: reward start")

    const r = applyEventRewards(user, pack, event, meta)

    kamas=r?.kamas||0
    xp=r?.xp||0
    jackpotMessage=r?.jackpotMessage

    console.log("REWARD:", {kamas,xp})

   } catch(e){
    console.error("❌ REWARD ERROR:", e)
   }

   if(jackpotMessage){
    channel.send(jackpotMessage)
   }

   registerEventPack(pack)

   console.log("STEP: reveal start")

   /* ================= REVEAL ================= */

   let revealed=[]

   for(const card of pack){

    console.log("CARD:", card)

    if(!card){
     console.log("SKIP NULL CARD")
     continue
    }

    user.cards[card.id]=(user.cards[card.id]||0)+1

    const line = `${rarityEmoji[card.rarity]||"❓"} ${card.name||"???"}`
    revealed.push(line)

    try {
     await message.edit({
      embeds:[
       new EmbedBuilder()
        .setTitle(`🎴 Ouverture (${pack.length})`)
        .setDescription(revealed.join("\n") || "...")
     ]
     })
    } catch(e){
     console.error("❌ EDIT ERROR:", e)
    }

    await sleep(300)
   }

   console.log("STEP: reveal done")

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
    ]
   })

   console.log("=== EVENTPACK END ===")

   save()

  } catch(e){
   console.error("❌ GLOBAL ERROR:", e)
  }

 }
}