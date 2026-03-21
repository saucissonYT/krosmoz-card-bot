const { SlashCommandBuilder, EmbedBuilder } = require("discord.js")

const { isDev } = require("../../systems/devSystem")
const { getCards } = require("../../systems/cardRegistry")
const { getUser, save } = require("../../systems/userSystem")
const { RARITY_EMOJI } = require("../../systems/constants")
const { loadSets } = require("../../systems/setSystemFile")

module.exports = {

 data: (() => {

  const rawSets = loadSets()
  const sets = Array.isArray(rawSets) ? rawSets : rawSets?.sets || []

  const builder = new SlashCommandBuilder()
   .setName("devgive")
   .setDescription("Donner une carte à un joueur")
   .addUserOption(option =>
    option
     .setName("joueur")
     .setDescription("Joueur cible")
     .setRequired(true)
   )
   .addStringOption(option =>
    option
     .setName("rarete")
     .setDescription("Rareté")
     .setRequired(true)
     .addChoices(
      { name:"C", value:"C" },
      { name:"U", value:"U" },
      { name:"R", value:"R" },
      { name:"SR", value:"SR" },
      { name:"HR", value:"HR" },
      { name:"UR", value:"UR" },
      { name:"S", value:"S" },
      { name:"SSR", value:"SSR" }
     )
   )

  builder.addStringOption(option => {

   option
    .setName("set")
    .setDescription("Set")
    .setRequired(true)

   if(sets.length > 0){
    option.addChoices(
     ...sets.slice(0, 25).map(s => ({
      name:s.name,
      value:s.id
     }))
    )
   }

   return option

  })

  return builder

 })(),

 async execute(interaction){

  if(!isDev(interaction.user.id))
   return interaction.reply({
    content:"⛔ Commande dev.",
    ephemeral:true
   })

  /* Lecture dynamique des cartes */
  const cards = getCards()

  const target = interaction.options.getUser("joueur")
  const setId = interaction.options.getString("set")
  const rarity = interaction.options.getString("rarete")

  const user = getUser(target.id)

  const pool = cards.filter(c =>
   c.set === setId &&
   c.rarity === rarity
  )

  if(pool.length === 0)
   return interaction.reply({
    content:`❌ Aucune carte **${rarity}** trouvée dans le set **${setId}**.`,
    ephemeral:true
   })

  const card = pool[Math.floor(Math.random() * pool.length)]

  if(!user.cards) user.cards = {}
  user.cards[card.id] = (user.cards[card.id] || 0) + 1

  /* Fix : save avec userId pour le dirty save system */
  save(target.id)

  const embed = new EmbedBuilder()
   .setTitle("🎴 Carte donnée")
   .setColor("#2ecc71")
   .addFields(
    { name:"Joueur", value:`**${target.username}**`, inline:true },
    { name:"Carte", value:`**${card.name}** (#${card.id})`, inline:true },
    { name:"Rareté", value:`${RARITY_EMOJI[rarity]} ${rarity}`, inline:true },
    { name:"Set", value:setId, inline:true }
   )

  interaction.reply({ embeds:[embed], ephemeral:true })

 }

}