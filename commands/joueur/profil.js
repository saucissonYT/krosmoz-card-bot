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

 const size = 10
 const percent = current / max

 const filled = Math.round(size * percent)
 const empty = size - filled

 const bar = "🟩".repeat(filled) + "⬜".repeat(empty)

 const percentText = Math.floor(percent * 100)

 return `${bar} ${percentText}%`
}

module.exports = {

 data:new SlashCommandBuilder()
  .setName("profil")
  .setDescription("Voir un profil joueur"),

 async execute(interaction){

  const user = getUser(interaction.user.id)

  const totalCards = cards.length

  let ownedCards = 0

  for(const id in user.cards)
   if(user.cards[id] > 0)
    ownedCards++

  const progression = getProgression(user)

  const xpBar = buildXPBar(progression.xp,progression.required)

  const embed = new EmbedBuilder()

   .setTitle(`👤 ${interaction.user.username}`)

   .addFields(

    {name:"⭐ Niveau",value:`${progression.level}`,inline:true},
    {name:"📈 XP",value:`${progression.xp}/${progression.required}`,inline:true},

    {name:"📊 XP",value:xpBar},

    {name:"📦 Cartes",value:`${ownedCards}/${totalCards}`,inline:true},
    {name:"💰 Kamas",value:String(user.kamas || 0),inline:true}

   )

   .setColor("#3498db")

  interaction.reply({
   embeds:[embed]
  })

 }

}