const {
 SlashCommandBuilder,
 EmbedBuilder,
 ActionRowBuilder,
 ButtonBuilder,
 ButtonStyle
} = require("discord.js")

const { getUser } = require("../../systems/userSystem")
const achievements = require("../../systems/achievementRegistry")
const { getRank } = require("../../systems/rankSystem")
const { getProgression } = require("../../systems/progressionSystem")
const { achievementCheck } = require("../../systems/achievementCheck")
const { notifyAchievements } = require("../../systems/achievementNotifier")

/*
 * FIX: Référence statique aux cartes supprimée.
 * On utilise getCards() depuis cardRegistry à chaque appel.
 */
const { getCards } = require("../../systems/cardRegistry")

function rand(min,max){
 return Math.floor(Math.random()*(max-min+1))+min
}

/*
 * FIX v0.29: buildXPBar et buildCollectionBar crashaient avec
 * RangeError: Invalid count value: -45
 *
 * Cause : quand max=0 (level 100, required=0) → percent=Infinity
 *         ou quand xp > required (ancienne courbe) → filled > size → empty négatif
 *
 * Fix : clamp percent entre 0 et 1, et gérer max=0 (niveau max)
 */

function buildXPBar(current,max){

 const size = 12

 if(max <= 0) return "🟩".repeat(size) + " MAX"

 const percent = Math.min(1, Math.max(0, current / max))

 const filled = Math.round(size * percent)
 const empty = size - filled

 const bar =
  "🟩".repeat(filled) +
  "⬜".repeat(empty)

 const percentText = Math.floor(percent * 100)

 return `${bar} ${percentText}%`
}

function buildCollectionBar(current,max){

 const size = 10

 if(max <= 0) return "🟩".repeat(size) + " 100%"

 const percent = Math.min(1, Math.max(0, current / max))

 const filled = Math.round(size * percent)
 const empty = size - filled

 const bar =
  "🟩".repeat(filled) +
  "⬜".repeat(empty)

 const percentText = Math.floor(percent * 100)

 return `${bar} ${percentText}%`
}

function fakeOptions(){
 return {
  getString: () => null,
  getInteger: () => null,
  getBoolean: () => null,
  getUser: () => null
 }
}

module.exports = {

 data:new SlashCommandBuilder()
  .setName("profil")
  .setDescription("Voir un profil joueur")
  .addUserOption(option =>
   option
    .setName("joueur")
    .setDescription("Voir le profil d'un joueur")
    .setRequired(false)
  ),

 async execute(interaction){

  /* Lecture dynamique des cartes */
  const cards = getCards()

  const target = interaction.options?.getUser("joueur") || interaction.user
  const isSelf = target.id === interaction.user.id
  const isBotProfile = target.id === interaction.client.user.id

  /* ---------------- PROFIL BOT RNG ---------------- */

  if(isBotProfile){

   const totalCards = cards.length

   const fakeAchievements = Object.keys(achievements)
   const badgeCount = rand(10,40)

   const randomBadges=[]

   for(let i=0;i<badgeCount;i++){

    const id=fakeAchievements[rand(0,fakeAchievements.length-1)]

    if(achievements[id]?.badge)
     randomBadges.push(achievements[id].badge)

   }

   const ownedCards = rand(Math.floor(totalCards*0.5),totalCards)

   const progression={
    level:rand(50,100),
    xp:rand(100,900),
    required:1000
   }

   const xpBar = buildXPBar(progression.xp,progression.required)
   const collectionBar = buildCollectionBar(ownedCards,totalCards)

   const embed = new EmbedBuilder()

    .setTitle(`👤 ${target.username}`)
    .setThumbnail(target.displayAvatarURL({size:256}))

    .addFields(

     {name:"🏅 Rang",value:"🌌 Entité Cosmique",inline:true},
     {name:"👑 Titre",value:["Architecte RNG","Dieu du Krosmoz","Gardien des Sets"][rand(0,2)],inline:true},
     {name:"🏆 Succès",value:String(rand(200,999)),inline:true},

     {name:"⭐ Niveau",value:String(progression.level),inline:true},
     {name:"📈 XP",value:`${progression.xp} / ${progression.required}`,inline:true},

     {name:"📊 Progression XP",value:xpBar},

     {name:"💰 Kamas",value:String(rand(100000,99999999)),inline:true},
     {name:"📦 Cartes",value:`${ownedCards}/${totalCards}`,inline:true},

     {name:"📊 Collection",value:collectionBar},

     {
      name:"📊 Statistiques",
      value:
`📦 Packs ouverts : ${rand(1000,50000)}
📦 eventPack ouverts : ${rand(10,500)}
🌈 SSR obtenues : ${rand(100,5000)}
🔧 Fusions : ${rand(200,10000)}
📅 Daily claims : ${rand(200,5000)}`
     },

     {name:"🎖 Badges",value:randomBadges.join(" ") || "Aucun"}

    )

    .setColor("#8e44ad")

   return interaction.reply({embeds:[embed]})
  }

  /* ---------------- PROFIL NORMAL ---------------- */

  const user = getUser(target.id)

  let unlocked=[]

  if(isSelf){
   if(!user.stats) user.stats={}
   user.stats.profileViews=(user.stats.profileViews||0)+1
   unlocked = achievementCheck(user,"social")
  }

  const totalCards = cards.length

  let ownedCards = 0

  for(const id in user.cards)
   if(user.cards[id] > 0)
    ownedCards++

  const maxBadges = 40

  let badges = "Aucun"

  if(user.achievements?.length){

   const reversed = [...user.achievements].reverse()
   const visible = reversed.slice(0,maxBadges)

   badges = visible
    .map(a => achievements[a]?.badge || "")
    .join(" ")

   if(user.achievements.length > maxBadges){
    const extra = user.achievements.length - maxBadges
    badges += ` +${extra}`
   }

  }

  const rank = getRank(user)
  const progression = getProgression(user)

  const xpText = progression.isMaxLevel
   ? `MAX`
   : `${progression.xp} / ${progression.required}`

  const xpBar = progression.isMaxLevel
   ? buildXPBar(1, 1)
   : buildXPBar(progression.xp, progression.required)

  const collectionBar = buildCollectionBar(ownedCards, totalCards)

  const stats = user.stats || {}

  /* ---- Guilde ---- */
  let guildLine = "Aucune"
  try{
   const { getUserGuild } = require("../../systems/guildSystem")
   const guild = getUserGuild(target.id)
   if(guild) guildLine = `${guild.emoji} ${guild.name} (Niv. ${guild.level})`
  }catch(e){}

  const embed = new EmbedBuilder()

   .setTitle(`👤 ${target.username}`)
   .setThumbnail(target.displayAvatarURL({size:256}))

   .addFields(

    {name:"🏅 Rang",value:`${rank.emoji} ${rank.name}`,inline:true},
    {name:"👑 Titre",value:user.title || "Nouveau",inline:true},
    {name:"🏆 Succès",value:String(user.achievements?.length || 0),inline:true},

    {name:"⭐ Niveau",value:`${progression.level}`,inline:true},
    {name:"📈 XP",value:xpText,inline:true},
    {name:"🏰 Guilde",value:guildLine,inline:true},

    {name:"📊 Progression XP",value:xpBar},

    {name:"💰 Kamas",value:String(user.kamas || 0),inline:true},
    {name:"📦 Cartes",value:`${ownedCards}/${totalCards}`,inline:true},

    {name:"📊 Collection",value:collectionBar},

    {
     name:"📊 Statistiques",
     value:
`📦 Packs ouverts : ${stats.packsOpened || 0}
📦 eventPack ouverts : ${stats.eventPacksOpened || 0}
🌈 SSR obtenues : ${stats.ssrPulled || 0}
🔧 Fusions : ${stats.fusions || 0}
📅 Daily claims : ${stats.dailyClaims || 0}`
    },

    {name:"🎖 Badges",value:badges}

   )

   .setColor("#8e44ad")

  if(!isSelf)
   return interaction.reply({embeds:[embed]})

  const row = new ActionRowBuilder().addComponents(

   new ButtonBuilder()
    .setCustomId("profil_inventory")
    .setLabel("Inventaire")
    .setEmoji("🎴")
    .setStyle(ButtonStyle.Primary),

   new ButtonBuilder()
    .setCustomId("profil_sets")
    .setLabel("Sets")
    .setEmoji("📚")
    .setStyle(ButtonStyle.Secondary),

   new ButtonBuilder()
    .setCustomId("profil_achievements")
    .setLabel("Succès")
    .setEmoji("🏆")
    .setStyle(ButtonStyle.Success)

  )

  const msg = await interaction.reply({
   embeds:[embed],
   components:[row],
   fetchReply:true
  })

  if(unlocked.length)
   await notifyAchievements(interaction,unlocked)

  const collector = msg.createMessageComponentCollector({time:120000})

  collector.on("collect", async i => {

   if(i.user.id !== interaction.user.id)
    return i.reply({content:"Ce n'est pas ton profil.",flags:64})

   /*
    * FIX: Les boutons appelaient command.execute(i) directement.
    * Problème : la commande cible (inventaire, listcards, achievements)
    * appelle deferReply() en interne. Mais si on ne defer pas le bouton
    * d'abord, ou si on le defer 2 fois, Discord crash avec
    * "Unknown interaction (10062)" ou "Interaction already acknowledged".
    *
    * Solution :
    * 1. On deferReply() le bouton ici (crée une nouvelle réponse)
    * 2. On patch i.deferReply en no-op pour que la commande cible
    *    ne re-defer pas (sinon = double defer = crash)
    * 3. La commande cible peut ensuite faire editReply() normalement
    *    car l'interaction est déjà deferred
    */

   try{

    await i.deferReply()

    /* Patch : empêcher le double deferReply dans la commande cible */
    i.deferReply = async () => {}

    /* Patch : fakeOptions pour que getString/getInteger ne crash pas */
    i.options = fakeOptions()

    if(i.customId === "profil_inventory"){
     const command = interaction.client.commands.get("inventaire")
     if(command) return await command.execute(i)
    }

    if(i.customId === "profil_sets"){
     const command = interaction.client.commands.get("listcards")
     if(command) return await command.execute(i)
    }

    if(i.customId === "profil_achievements"){
     const command = interaction.client.commands.get("achievements")
     if(command) return await command.execute(i)
    }

   }catch(err){

    console.error("Erreur bouton profil :", err)

    try{
     if(!i.replied && !i.deferred)
      await i.reply({content:"❌ Une erreur est survenue.",flags:64})
     else
      await i.followUp({content:"❌ Une erreur est survenue.",flags:64})
    }catch(e){
     /* interaction expirée, rien à faire */
    }

   }

  })

 }

}