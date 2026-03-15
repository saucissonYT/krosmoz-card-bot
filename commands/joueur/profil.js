const {
 SlashCommandBuilder,
 EmbedBuilder,
 ActionRowBuilder,
 ButtonBuilder,
 ButtonStyle
} = require("discord.js")

const { getUser } = require("../../systems/userSystem")
const { achievements } = require("../../systems/achievementSystem")
const { getRank } = require("../../systems/rankSystem")
const { getProgression } = require("../../systems/progressionSystem")

const { data } = require("../../systems/dataManager")
const cards = data.cards || []

function buildXPBar(current,max){

 const size = 12
 const percent = current / max

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
 const percent = current / max

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

  const target = interaction.options?.getUser("joueur") || interaction.user
  const isSelf = target.id === interaction.user.id

  const user = getUser(target.id)

  const totalCards = cards.length

  let ownedCards = 0

  for(const id in user.cards)
   if(user.cards[id] > 0)
    ownedCards++

  const percent = totalCards > 0
   ? Math.floor((ownedCards / totalCards) * 100)
   : 0

  const badges = user.achievements?.length
   ? user.achievements.map(a => achievements[a]?.badge).join(" ")
   : "Aucun"

  const rank = getRank(user)

  const progression = getProgression(user)

  const xpBar = buildXPBar(progression.xp,progression.required)

  const collectionBar = buildCollectionBar(ownedCards,totalCards)

  const stats = user.stats || {}

  const lastDaily = user.daily?.lastDaily
   ? `<t:${Math.floor(user.daily.lastDaily/1000)}:R>`
   : "Jamais"

  const embed = new EmbedBuilder()

   .setTitle(`👤 ${target.username}`)
   .setThumbnail(target.displayAvatarURL({size:256}))

   .addFields(

    {name:"🏅 Rang",value:`${rank.emoji} ${rank.name}`,inline:true},
    {name:"👑 Titre",value:user.title || "Nouveau",inline:true},
    {name:"🏆 Succès",value:String(user.achievements?.length || 0),inline:true},

    {name:"⭐ Niveau",value:`${progression.level}`,inline:true},
    {name:"📈 XP",value:`${progression.xp} / ${progression.required}`,inline:true},

    {name:"📊 Progression XP",value:xpBar},

    {name:"💰 Kamas",value:String(user.kamas || 0),inline:true},
    {name:"📦 Cartes",value:`${ownedCards}/${totalCards}`,inline:true},

    {name:"📊 Collection",value:collectionBar},

    {
     name:"📊 Statistiques",
     value:
`📦 Packs ouverts : ${stats.packsOpened || 0}
🌈 SSR obtenues : ${stats.ssrPulled || 0}
🔧 Fusions : ${stats.fusions || 0}
📅 Streak daily : ${user.daily?.streak || 0}
⏱ Dernier daily : ${lastDaily}`
    },

    {name:"🎖 Badges",value:badges}

   )

   .setColor("#8e44ad")

  if(!isSelf){
   return interaction.reply({embeds:[embed]})
  }

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

  const collector = msg.createMessageComponentCollector({
   time:120000
  })

  collector.on("collect", async i => {

   if(i.user.id !== interaction.user.id)
    return i.reply({content:"Ce n'est pas ton profil.",ephemeral:true})

   try{

    if(i.customId === "profil_inventory"){

     const command = interaction.client.commands.get("inventaire")

     i.options = fakeOptions()

     return command.execute(i)

    }

    if(i.customId === "profil_sets"){

     const command = interaction.client.commands.get("listcards")

     if(!command)
      return i.reply({
       content:"Commande listcards introuvable.",
       ephemeral:true
      })

     i.options = fakeOptions()

     return command.execute(i)

    }

    if(i.customId === "profil_achievements"){

     const command = interaction.client.commands.get("achievements")

     i.options = fakeOptions()

     return command.execute(i)

    }

   }catch(err){

    console.error("Erreur bouton profil :",err)

    return i.reply({
     content:"Erreur lors de l'ouverture.",
     ephemeral:true
    })

   }

  })

 }

}