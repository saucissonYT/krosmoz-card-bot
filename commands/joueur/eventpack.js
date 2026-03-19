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

  try {

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
   ]
   })

   /* ================= PACK ================= */

   let pack=[], flags=[], meta={}

   try {
    const result = generateEventPack(user,event)

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

   /* ================= REWARDS ================= */

   let kamas=0, xp=0, jackpotMessage=null

   try {
    const r = applyEventRewards(user, pack, event, meta)

    kamas=r?.kamas||0
    xp=r?.xp||0
    jackpotMessage=r?.jackpotMessage

   } catch(e){
    console.error("REWARD ERROR:", e)
   }

   if(jackpotMessage){
    channel.send(jackpotMessage)
   }

   registerEventPack(pack)

   /* ================= SRAM ================= */

   if(event.key === "sram"){

    let revealed=[]

    for(let i=0;i<pack.length;i++){

     revealed.push("❓ ???")

     await message.edit({
      embeds:[
       new EmbedBuilder()
        .setTitle("🕶️ Pack mystérieux")
        .setDescription(
         "✨ Une énergie étrange se forme...\n\n" +
         revealed.join("\n")
        )
      ]
     })

     await sleep(450)
    }

    await message.edit({
     embeds:[
      new EmbedBuilder()
       .setTitle(`🕶️ ${event.name}`)
       .setDescription("❓ Les cartes restent inconnues...")
    ]
    })

    save()
    return
   }

   /* ================= REVEAL ================= */

   let revealed=[]

   for(const card of pack){

    if(!card || !card.id) continue

    user.cards[card.id]=(user.cards[card.id]||0)+1

    const line = `${rarityEmoji[card.rarity]||"❓"} **${card.name}** \`${card.rarity}\``

    revealed.push(line)

    await message.edit({
     embeds:[
      new EmbedBuilder()
       .setTitle(`🎴 Ouverture (${pack.length})`)
       .setDescription(
        "✨ Une énergie étrange se forme...\n\n" +
        revealed.join("\n")
       )
       .setColor(rarityColor[card.rarity] || "#9b59b6")
     ]
    })

    await sleep(420) // ⚖️ équilibre perf / UX
   }

   /* ================= RP SYSTEM ================= */

   let rp = ""

   const rpData = event.rp || {}

   if(meta.removed?.length){
    rp += `\n${rpData.removed || "⏳ Des cartes ont disparu..."}`
   }

   if(meta.added?.length){
    rp += `\n${rpData.added || "✨ De nouvelles cartes apparaissent..."}`
   }

   if(meta.mutations?.length){
    rp += `\n${rpData.mutation || "💀 Mutations :"}\n` + meta.mutations.join("\n")
   }

   if(meta.upgrades?.length){
    rp += `\n${rpData.upgrade || "🎭 Améliorations :"}\n` + meta.upgrades.join("\n")
   }

   if(meta.duplicates?.length){
    rp += `\n${rpData.duplicate || "🍺 Doublons :"}\n` + meta.duplicates.join("\n")
   }

   if(meta.chaos?.length){
    rp += `\n${rpData.chaos || "⚙️ Chaos :"} ${meta.chaos.join(", ")}`
   }

   if(meta.jackpot){
    rp += `\n${rpData.jackpot || "💰 JACKPOT !"}`
   }

   if(flags.length){
    rp += "\n\n" + flags.join("\n")
   }

   const description = (
    "✨ Une énergie étrange se dissipe...\n\n" +
    revealed.join("\n") +
    (rp || "")
   ).trim() || "❌ Aucune carte"

   /* ================= FINAL ================= */

   await message.edit({
    embeds:[
     new EmbedBuilder()
      .setTitle(`🎁 ${event.name}`)
      .setDescription(description)
      .addFields(
       {name:"💰 Kamas",value:`+${kamas}`,inline:true},
       {name:"⭐ XP",value:`+${xp}`,inline:true},
       {name:"🎟️ Tickets",value:`${user.event.tickets-user.event.used}/${user.event.tickets}`,inline:true}
      )
      .setColor("#f1c40f")
    ]
   })

   save()

  } catch(e){
   console.error("GLOBAL ERROR:", e)
  }

 }
}