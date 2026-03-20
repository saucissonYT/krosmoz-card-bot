const {
 SlashCommandBuilder,
 ActionRowBuilder,
 StringSelectMenuBuilder,
 EmbedBuilder
} = require("discord.js")

const { RARITY_EMOJI, RARITY_COLOR } = require("../../systems/constants")

const setsData = require("../../cards/sets.json")
const sets = Array.isArray(setsData) ? setsData : setsData.sets

const { getCards } = require("../../systems/cardRegistry")
const { openPack } = require("../../systems/packEngine")
const { getUser, save, updateActivityStreak, checkPalindrome } = require("../../systems/userSystem")
const { achievementCheck } = require("../../systems/achievementCheck")
const { notifyAchievements } = require("../../systems/achievementNotifier")
const cooldownDev = require("../dev/cooldown")

const cards = getCards()

/* ---------- CACHE SETS ---------- */

const setCache = {}
for(const card of cards){
 if(!setCache[card.set]) setCache[card.set] = []
 setCache[card.set].push(card)
}

function sleep(ms){
 return new Promise(r=>setTimeout(r,ms))
}

/* ---------- PALINDROME ---------- */

function isPalindrome(n){
 const s = String(n)
 return s === s.split("").reverse().join("")
}

/* ---------- COOLDOWN ---------- */

function getCooldownText(user){
 const now = Date.now()
 if(!user.lastPack) return "🎁 Pack gratuit : **disponible**"
 const remain = 3600000 - (now - user.lastPack)
 if(remain <= 0) return "🎁 Pack gratuit : **disponible**"
 const minutes = Math.ceil(remain / 60000)
 return `⏳ Pack gratuit : **${minutes} min**`
}

/* ---------- SET COMPLETION ---------- */

function getSetCompletion(user, setId){
 const setCards = setCache[setId] || []
 let owned = 0
 for(const card of setCards)
  if(user.cards?.[card.id]) owned++
 return { owned, total: setCards.length }
}

module.exports = {

 name:"krosmoz",

 data: new SlashCommandBuilder()
  .setName("krosmoz")
  .setDescription("Ouvrir un pack Krosmoz"),

 async execute(interaction){

  const user = getUser(interaction.user.id)

  if(!sets || sets.length === 0)
   return interaction.reply({ content:"❌ Aucun set disponible.", flags:64 })

  if(!user.pity) user.pity = {}
  if(!user.stats) user.stats = {}

  const options = sets.slice(0,25).map(set=>{

   if(!user.pity[set.id])
    user.pity[set.id] = { SSR:0, S:0, UR:0 }

   const pity = user.pity[set.id]
   const ssr = pity.SSR ?? 0
   const s   = pity.S   ?? 0
   const ur  = pity.UR  ?? 0

   const completion = getSetCompletion(user, set.id)

   return {
    label: set.name,
    value: set.id,
    description: `SSR ${ssr}/50 • S ${s}/30 • UR ${ur}/10 • 📚 ${completion.owned}/${completion.total}`
   }
  })

  const menu = new StringSelectMenuBuilder()
   .setCustomId("krosmoz_set")
   .setPlaceholder("Choisis un set")
   .addOptions(options)

  const row = new ActionRowBuilder().addComponents(menu)

  await interaction.reply({
   content:
`🎴 **Choisis un set**

📦 Packs achetés : **${user.packs || 0}**
${getCooldownText(user)}`,
   components:[row],
   flags:64
  })

 },

 async select(interaction){

  await interaction.deferReply()

  const setId = interaction.values[0]
  const user  = getUser(interaction.user.id)

  if(!user.pity) user.pity = {}

  if(!user.pity[setId])
   user.pity[setId] = { SSR:0, S:0, UR:0 }

  const pity = user.pity[setId]

  if(pity.S   === undefined) pity.S   = 0
  if(pity.UR  === undefined) pity.UR  = 0
  if(pity.SSR === undefined) pity.SSR = 0

  if(!user.stats) user.stats = {}

  const now = Date.now()

  let freePack = false

  if(!cooldownDev.cooldownDisabled()){
   if(!user.lastPack || now - user.lastPack >= 3600000)
    freePack = true
  } else {
   freePack = true
  }

  if(!freePack && (!user.packs || user.packs <= 0)){
   const remain = Math.ceil((3600000 - (now - user.lastPack)) / 60000)
   return interaction.editReply(
`❌ Aucun pack disponible.
⏳ Prochain pack gratuit : **${remain} min**`
   )
  }

  /* ---- CAPTURE PITY AVANT LE PACK (pour hardPity) ---- */
  const pitySSRBefore = pity.SSR

  if(freePack) user.lastPack = now
  else user.packs--

  user.stats.packsOpened = (user.stats.packsOpened || 0) + 1
  user.stats.krosmozOpened = (user.stats.krosmozOpened || 0) + 1

  user.lastSet = setId

  /* ---- ACTIVITY STREAK ---- */
  updateActivityStreak(user)

  /* ---- PACK MINUIT ---- */
  const hour = new Date().getHours()
  if(hour === 0){
   user.stats.packAtMidnight = (user.stats.packAtMidnight || 0) + 1
  }

  const result = openPack(user, setId)

  const {
   pack,
   luckyPack,
   discovered,
   kamasGain,
   xpGain,
   best,
   dailyBonus
  } = result

  /* ---- TRACKINGS POST-PACK ---- */

  const ssrInPack  = pack.filter(c=>c?.rarity==="SSR").length
  const hasS       = pack.some(c=>c?.rarity==="S")
  const hasSSR     = ssrInPack > 0
  const allRarities = [...new Set(pack.map(c=>c?.rarity).filter(Boolean))]

  // Hard pity : SSR obtenue alors que pity était >= 49 avant le pack
  if(hasSSR && pitySSRBefore >= 49){
   user.stats.hardPityReached = (user.stats.hardPityReached || 0) + 1
  }

  // Dry streak : packs sans S ni SSR
  if(!hasS && !hasSSR){
   user.stats.dryStreak = (user.stats.dryStreak || 0) + 1
   user.stats.dryStreakMax = Math.max(user.stats.dryStreakMax || 0, user.stats.dryStreak)
  } else {
   user.stats.dryStreak = 0
  }

  // All C pack
  if(allRarities.length === 1 && allRarities[0] === "C"){
   user.stats.allCPack = (user.stats.allCPack || 0) + 1
  }

  // All U pack
  if(allRarities.length === 1 && allRarities[0] === "U"){
   user.stats.allUPack = (user.stats.allUPack || 0) + 1
  }

  // SSR un lundi
  if(hasSSR){
   const day = new Date().getDay() // 1 = lundi
   if(day === 1){
    user.stats.ssrOnMonday = (user.stats.ssrOnMonday || 0) + 1
   }
  }

  // Palindrome (total de toutes les cartes)
  const totalCards = Object.values(user.cards||{}).reduce((a,b)=>a+b,0)
  if(totalCards > 0 && isPalindrome(totalCards)){
   user.stats.palindromeReached = (user.stats.palindromeReached || 0) + 1
  }

  let revealed = []

  await interaction.editReply("🎴 **Ouverture du pack...**")

  const message = interaction.channel
   ? await interaction.channel.send({
      embeds:[
       new EmbedBuilder()
        .setTitle("📦 Ouverture du pack...")
        .setDescription("✨ Les cartes apparaissent...")
        .setColor("#f1c40f")
      ]
     })
   : null

  if(!message) return

  await sleep(1000)

  for(const card of pack){

   const line = `${RARITY_EMOJI[card.rarity]} **${card.name}${card.shiny ? " ✨" : ""}** \`${card.rarity}\``

   revealed.push(line)

   const revealEmbed = new EmbedBuilder()
    .setTitle("🎴 Ouverture du pack")
    .setDescription(revealed.join("\n"))
    .setColor(RARITY_COLOR[card.rarity])

   await message.edit({ embeds:[revealEmbed] })
   await sleep(800)
  }

  save()

  let unlocked = []

  unlocked.push(...achievementCheck(user, "pack"))
  unlocked.push(...achievementCheck(user, "collection"))
  unlocked.push(...achievementCheck(user, "economy"))
  unlocked.push(...achievementCheck(user, "rng"))

  const finalEmbed = new EmbedBuilder()
   .setTitle("🎴 Pack ouvert !")
   .setDescription(revealed.join("\n"))
   .addFields(
    { name:"💰 Kamas gagnés", value:`+${kamasGain}`, inline:true },
    { name:"⭐ XP gagnée",    value:`+${xpGain}`,    inline:true },
    { name:"🌈 SSR Pity",     value:`${pity.SSR}/50`, inline:true },
    { name:"✨ S Pity",       value:`${pity.S}/30`,   inline:true },
    { name:"🟡 UR Pity",      value:`${pity.UR}/10`,  inline:true }
   )
   .setColor(RARITY_COLOR[best.rarity])

  if(luckyPack){
   finalEmbed.addFields({ name:"🎁 Lucky Pack", value:"Une carte bonus apparaît !", inline:false })
  }

  if(dailyBonus){
   finalEmbed.addFields({ name:"✨ Bonus quotidien", value:"XP doublée sur ce pack", inline:false })
  }

  await message.edit({ embeds:[finalEmbed] })

  if(discovered.length){
   const lines = discovered.map(c=>`🔎 **${c.name}**`)
   await interaction.followUp({ content:`Nouvelle découverte !\n${lines.join("\n")}`, flags:64 })
  }

  if(unlocked.length)
   await notifyAchievements(interaction, unlocked)

 }

}