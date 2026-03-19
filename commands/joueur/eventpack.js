const {
 EmbedBuilder
} = require("discord.js")

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
    flags:64
   })
  }

  const user = getUser(interaction.user.id)

  initUserEvent(user)

  if(!user.event){
   return interaction.reply({
    content:"❌ Erreur event user.",
    flags:64
   })
  }

  const check = canUseEventPack(user)

  if(!check.ok){
   return interaction.reply({
    content:`❌ ${check.error}`,
    flags:64
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

  /* ---------- PACK ---------- */

  let pack=[]
  let flags=[]
  let meta={}

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

  /* ---------- REWARDS ---------- */

  let kamas=0
  let xp=0
  let jackpotMessage=null

  try {
   const result = applyEventRewards(user, pack, event, meta)

   kamas = result?.kamas || 0
   xp = result?.xp || 0
   jackpotMessage = result?.jackpotMessage

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

    const embed = new EmbedBuilder()
     .setTitle("🕶️ Pack mystérieux")
     .setDescription(revealed.join("\n") || "❓ ???")
     .setColor("#2c3e50")

    await message.edit({embeds:[embed]})
    await sleep(400)
   }

   const remaining = user.event.tickets - user.event.used

   const finalEmbed = new EmbedBuilder()
    .setTitle(`🕶️ ${event.name}`)
    .setDescription("❓ Les cartes restent inconnues...")
    .addFields(
     {name:"💰 Kamas",value:`+${kamas}`,inline:true},
     {name:"⭐ XP",value:`+${xp}`,inline:true},
     {name:"🎟️ Tickets",value:`${remaining}/${user.event.tickets}`,inline:true}
    )
    .setColor("#2c3e50")

   await message.edit({embeds:[finalEmbed]})
   save()
   return
  }

  /* ---------- REVEAL ---------- */

  let revealed=[]

  for(const card of pack){

   if(!card || !card.id) continue

   user.cards[card.id]=(user.cards[card.id]||0)+1

   const line = `${rarityEmoji[card.rarity] || "❓"} **${card.name || "???"}** \`${card.rarity || "?"}\``

   revealed.push(line)

   const embed = new EmbedBuilder()
    .setTitle(`🎴 Ouverture (${pack.length} cartes)`)
    .setDescription(revealed.join("\n") || "❌ Erreur affichage")
    .setColor(rarityColor[card.rarity] || "#9b59b6")

   await message.edit({embeds:[embed]})
   await sleep(500)
  }

  /* ---------- META ---------- */

  let extra=""

  if(meta.mutations?.length){
   extra += "\n💀 Mutations :\n" + meta.mutations.join("\n")
  }

  if(meta.upgrades?.length){
   extra += "\n🎭 Upgrades :\n" + meta.upgrades.join("\n")
  }

  if(meta.duplicates?.length){
   extra += "\n🍺 Doublons :\n" + meta.duplicates.join("\n")
  }

  if(meta.added?.length){
   extra += "\n✨ Cartes ajoutées :\n" + meta.added.join("\n")
  }

  if(meta.chaos?.length){
   extra += `\n⚙️ Chaos : ${meta.chaos.join(", ")}`
  }

  if(meta.removed?.length){
   extra += `\n⏳ Supprimées : ${meta.removed.join(", ")}`
  }

  if(flags.length){
   extra += "\n\n" + flags.join("\n")
  }

  const remaining = user.event.tickets - user.event.used

  const description = (revealed.join("\n") + extra).trim()

  const finalEmbed = new EmbedBuilder()
   .setTitle(`🎁 ${event.name}`)
   .setDescription(description || "❌ Aucune carte générée.")
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