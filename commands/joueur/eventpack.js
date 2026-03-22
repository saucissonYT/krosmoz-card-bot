const { EmbedBuilder } = require("discord.js")

/*
 * FIX: rarityColor et rarityEmoji étaient hardcodés localement.
 * Remplacés par RARITY_EMOJI et RARITY_COLOR depuis constants.js
 * pour garantir la cohérence avec le reste du projet.
 */
const { RARITY_EMOJI, RARITY_COLOR } = require("../../systems/constants")

const {
 getEvent,
 isEventActive,
 initUserEvent,
 canUseEventPack,
 registerEventPack,
 claimFirstPack
} = require("../../systems/eventSystem")

const { generateEventPack } = require("../../systems/eventPackEngine")
const { getUser, save } = require("../../systems/userSystem")
const { addBattlePassXP } = require("../../systems/battlePassService")
const { applyEventRewards } = require("../../systems/rewardSystem")
const { achievementCheck } = require("../../systems/achievementCheck")
const { notifyAchievements } = require("../../systems/achievementNotifier")

function sleep(ms){
 return new Promise(r=>setTimeout(r,ms))
}

module.exports = {

 name:"eventpack",

 async execute(interaction){

  try {

   const event = getEvent()

   /* ================= ACHIEVEMENT SECRET : TROP IMPATIENT ================= */

   if(!isEventActive()){

    try {
     const user = getUser(interaction.user.id)
     if(!user.stats) user.stats = {}
     user.stats.eventpackNoEvent = true
     const unlocked = achievementCheck(user, "secret")
     save(interaction.user.id)
     if(unlocked.length) await notifyAchievements(interaction, unlocked)
    } catch(e){}

    return interaction.reply({ content:"❌ Aucun event actif.", flags:64 })
   }

   const user = getUser(interaction.user.id)

   initUserEvent(user)

   const check = canUseEventPack(user)

   if(!check.ok){
    return interaction.reply({ content:`❌ ${check.error}`, flags:64 })
   }

   /* ================= PREMIER PACK DE L'EVENT ================= */

   const isFirstPack = claimFirstPack()

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

   let pack=[], meta={}

   try {
    const result = generateEventPack(user, event)

    pack = result?.pack || []
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

   await addBattlePassXP(interaction.user.id, "event_pack")

   if(jackpotMessage){
    channel.send(jackpotMessage)
   }

   registerEventPack(pack)

   /* ================= USER STATS ================= */

   if(!user.stats) user.stats = {}

   // EventPacks globaux
   user.stats.eventPacksOpened = (user.stats.eventPacksOpened || 0) + 1

   // Packs par classe
   if(!user.stats.eventPacksByClass) user.stats.eventPacksByClass = {}
   user.stats.eventPacksByClass[event.key] = (user.stats.eventPacksByClass[event.key] || 0) + 1

   // Events distincts participés
   if(!user.stats.eventsParticipated) user.stats.eventsParticipated = []
   if(!user.stats.eventsParticipated.includes(event.key)){
    user.stats.eventsParticipated.push(event.key)
   }

   // Premier pack de l'event
   if(isFirstPack){
    user.stats.firstEventPacks = (user.stats.firstEventPacks || 0) + 1
   }

   // SSR obtenues en event — on compte sur le pack FINAL (après limitSSR)
   const ssrInPack = pack.filter(c => c?.rarity === "SSR").length
   if(ssrInPack > 0){
    user.stats.ssrPulled    = (user.stats.ssrPulled    || 0) + ssrInPack
    user.stats.ssrFromEvent = (user.stats.ssrFromEvent || 0) + ssrInPack

    if(!user.stats.ssrByClass) user.stats.ssrByClass = {}
    user.stats.ssrByClass[event.key] = (user.stats.ssrByClass[event.key] || 0) + ssrInPack
   }

   // Tickets entièrement utilisés
   if(user.event.used >= user.event.tickets){
    user.stats.ticketsFullyUsed = (user.stats.ticketsFullyUsed || 0) + 1

    // Achievement speed tickets : tous les tickets en < 2 minutes
    const elapsed = Date.now() - (user.event.startTime || Date.now())
    if(elapsed <= 120000){
     user.stats.speedTickets = true
    }
   }

   // Jackpot Enutrof — meta.jackpot est set par le handler Enutrof
   if(event.key === "enutrof" && meta.jackpot){
    user.stats.jackpotEnutrof = (user.stats.jackpotEnutrof || 0) + 1
   }

   // FIX : Jackpot Feca — généré dans rewardSystem via jackpotMessage, pas meta.jackpot
   if(event.key === "feca" && jackpotMessage){
    user.stats.jackpotFeca = (user.stats.jackpotFeca || 0) + 1
   }

   /* ================= INIT CARDS ================= */

   if(!user.cards) user.cards = {}

   /* ================= DISCOVERED TRACKING ================= */

   const discovered = []

   /* ================= SRAM ================= */

   if(event.key === "sram"){

    for(const card of pack){
     if(!card?.id) continue

     /* CHECK NEW avant d'ajouter */
     if(!user.cards[card.id] || user.cards[card.id] === 0){
      discovered.push(card)
     }

     user.cards[card.id] = (user.cards[card.id] || 0) + 1
    }

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

    const unlocked = achievementCheck(user, "event")
    save(interaction.user.id)

    /* NOTIFICATION NOUVELLES CARTES (même pour Sram) */
    if(discovered.length){
     const lines = discovered.map(c => `🔎 **${c.name}**`)
     await interaction.followUp({
      content:`Nouvelle découverte !\n${lines.join("\n")}`,
      flags:64
     })
    }

    if(unlocked.length)
     await notifyAchievements(interaction, unlocked)

    return
   }

   /* ================= REVEAL ================= */

   let revealed=[]

   for(const card of pack){

    if(!card || !card.id) continue

    /* CHECK NEW avant d'ajouter */
    if(!user.cards[card.id] || user.cards[card.id] === 0){
     discovered.push(card)
    }

    user.cards[card.id]=(user.cards[card.id]||0)+1

    let line = `${RARITY_EMOJI[card.rarity]||"❓"} **${card.name}** \`${card.rarity}\``

    if(event.key === "pandawa" && meta.duplicates){
     const isCopy = meta.duplicates.some(d => d.copy === card.name)
     if(isCopy) line += " 🍺"
    }

    if(event.key === "sadida" && meta.duplicates){
     const isCopy = meta.duplicates.some(d => d.copy === card.name)
     if(isCopy) line += " 🌿"
    }

    if(meta.mutations?.some(m=>m.includes(card.name))){
     line += " 💀"
    }

    if(meta.upgrades?.some(u=>u.includes(card.name))){
     line += " 🎭"
    }

    if(event.key === "xelor" && meta.added){
     const isAdded = meta.added.some(a => a.name === card.name)
     if(isAdded) line += " ⏳"
    }

    if(meta.downgrades?.some(d=>d.includes(card.name))){
     line += " 🐺"
    }

    revealed.push(line)

    await message.edit({
     embeds:[
      new EmbedBuilder()
       .setTitle(`🎴 Ouverture (${pack.length})`)
       .setDescription(
        "✨ Une énergie étrange se forme...\n\n" +
        revealed.join("\n")
       )
       .setColor(RARITY_COLOR[card.rarity] || "#9b59b6")
     ]
    })

    await sleep(420)
   }

   /* ================= RP ================= */

   let rp = ""

   if(meta.removed?.length){
    rp += `\n⏳ ${meta.removed.length} carte(s) ont disparu...`
   }

   if(meta.added?.length){
    rp += `\n⏳ ${meta.added.length} carte(s) sont apparues...`
   }

   if(meta.mutations?.length){
    rp += `\n💀 Mutations :\n` + meta.mutations.join("\n")
   }

   if(meta.upgrades?.length){
    rp += `\n🎭 Améliorations :\n` + meta.upgrades.join("\n")
   }

   if(meta.duplicates?.length){
    rp += `\n🔁 ${meta.duplicates.length} duplication(s)`
   }

   if(meta.chaos?.length){
    rp += `\n⚙️ Chaos : ${meta.chaos.join(", ")}`
   }

   if(meta.downgrades?.length){
    rp += `\n🐺 Dégradations :\n` + meta.downgrades.join("\n")
   }

   if(meta.jackpot){
    rp += `\n💰 JACKPOT !`
   }

   /* ===== UX EVENT ===== */

   if(meta.ux?.length){
    rp += "\n\n✨ Effet de l'événement :\n" + meta.ux.join("\n")
   }

   /* ================= FINAL ================= */

   const description = (
    "✨ Une énergie étrange se dissipe...\n\n" +
    revealed.join("\n") +
    (rp || "")
   ).trim() || "❌ Aucune carte"

   await message.edit({
    embeds:[
     new EmbedBuilder()
      .setTitle(`🎁 ${event.name}${meta.ux?.[0] ? " • " + meta.ux[0] : ""}`)
      .setDescription(description)
      .addFields(
       {name:"💰 Kamas",value:`+${kamas}`,inline:true},
       {name:"⭐ XP",value:`+${xp}`,inline:true},
       {name:"🎟️ Tickets",value:`${user.event.tickets-user.event.used}/${user.event.tickets}`,inline:true}
      )
      .setColor("#f1c40f")
    ]
   })

   /* ================= VOICE LINE — DIVIN ================= */

   const hasSSR = pack.some(c => c.rarity === "SSR")
   const hasS   = pack.some(c => c.rarity === "S")

   let rarity = null

   if(hasSSR) rarity = "SSR"
   else if(hasS) rarity = "S"

   if(rarity){

    const voicePool = event.voiceLines?.[rarity]

    if(Array.isArray(voicePool) && voicePool.length){

     const line = voicePool[Math.floor(Math.random() * voicePool.length)]

     // RP DIVIN : header Discord (##) + italique gras + majuscules
     await channel.send(
      `## ${event.name}\n> ***${line.trim().toUpperCase()}***`
     )
    }
   }

   /* ================= NOUVELLES DÉCOUVERTES ================= */

   if(discovered.length){
    const lines = discovered.map(c => `🔎 **${c.name}**`)
    await interaction.followUp({
     content:`Nouvelle découverte !\n${lines.join("\n")}`,
     flags:64
    })
   }

   /* ================= ACHIEVEMENTS ================= */

   const unlocked = achievementCheck(user, "event")

   save(interaction.user.id)

   if(unlocked.length)
    await notifyAchievements(interaction, unlocked)

  } catch(e){
   console.error("GLOBAL ERROR:", e)
  }

 }
}
