const { SlashCommandBuilder } = require("discord.js")

const { getCard } = require("../../systems/cardRegistry")
const { getUser, save } = require("../../systems/userSystem")
const {
 addFragmentToInventory,
 buildCraftableIndex,
 getFragmentDisplayName,
 getFragmentInventoryRows,
 isCraftableSSRCard,
 rollFragmentForEvent,
 rollFragmentForSet
} = require("../../systems/fragmentService")

module.exports = {
 data: new SlashCommandBuilder()
  .setName("fragments")
  .setDescription("Outils de developpement pour les fragments")
  .addSubcommand((sub) =>
   sub
    .setName("give")
    .setDescription("Donner un fragment a un joueur")
    .addUserOption((option) => option.setName("joueur").setDescription("Joueur cible").setRequired(true))
    .addStringOption((option) => option.setName("carte").setDescription("ID de la carte").setRequired(true))
    .addIntegerOption((option) => option.setName("numero").setDescription("Numero du fragment (1-5)").setRequired(true).setMinValue(1).setMaxValue(5))
  )
  .addSubcommand((sub) =>
   sub
    .setName("give-all")
    .setDescription("Donner les 5 fragments d'une carte")
    .addUserOption((option) => option.setName("joueur").setDescription("Joueur cible").setRequired(true))
    .addStringOption((option) => option.setName("carte").setDescription("ID de la carte").setRequired(true))
  )
  .addSubcommand((sub) =>
   sub
    .setName("clear")
    .setDescription("Vider les fragments d'un joueur")
    .addUserOption((option) => option.setName("joueur").setDescription("Joueur cible").setRequired(true))
  )
  .addSubcommand((sub) =>
   sub
    .setName("list")
    .setDescription("Lister les fragments d'un joueur")
    .addUserOption((option) => option.setName("joueur").setDescription("Joueur cible").setRequired(true))
  )
  .addSubcommand((sub) =>
   sub
    .setName("rebuild-index")
    .setDescription("Reconstruire l'index des SSR craftables")
  )
  .addSubcommand((sub) =>
   sub
    .setName("simulate-drop")
    .setDescription("Simuler un drop de fragment")
    .addStringOption((option) => option.setName("set").setDescription("ID du set").setRequired(false))
    .addBooleanOption((option) => option.setName("event").setDescription("Simuler un event pack").setRequired(false))
  ),

 async execute(interaction) {
  await interaction.deferReply({ flags: 64 })

  const sub = interaction.options.getSubcommand()

  if (sub === "rebuild-index") {
   const index = buildCraftableIndex()
   return interaction.editReply(`✅ Index reconstruit: ${index.craftableSsrs.length} SSR craftables.`)
  }

  if (sub === "simulate-drop") {
   const isEvent = interaction.options.getBoolean("event") || false
   const setId = interaction.options.getString("set")
   const fragment = isEvent ? rollFragmentForEvent(1) : rollFragmentForSet(setId, 1)
   if (!fragment) {
    return interaction.editReply("ℹ️ Aucun fragment possible avec ces parametres.")
   }
   return interaction.editReply(`🎲 ${getFragmentDisplayName(fragment.cardId, fragment.fragmentNumber)}`)
  }

  const target = interaction.options.getUser("joueur")
  const user = getUser(target.id)

  if (sub === "clear") {
   user.fragments = []
   save(target.id)
   return interaction.editReply(`🧹 Fragments de ${target.username} supprimes.`)
  }

  if (sub === "list") {
   const rows = getFragmentInventoryRows(user).filter((row) => row.ownedCount > 0)
   if (rows.length === 0) return interaction.editReply("ℹ️ Aucun fragment.")
   const lines = rows.slice(0, 20).map((row) => `• ${row.card?.name || row.cardId}: ${row.numbers.join(", ")}`)
   return interaction.editReply(lines.join("\n"))
  }

  const cardId = interaction.options.getString("carte")
  const card = getCard(cardId)
  if (!card) return interaction.editReply("❌ Carte introuvable.")
  if (!isCraftableSSRCard(card)) return interaction.editReply("❌ Cette carte n'est pas craftable.")

  if (sub === "give") {
   const number = interaction.options.getInteger("numero")
   addFragmentToInventory(target.id, { cardId: card.id, fragmentNumber: number, source: "dev" })
   return interaction.editReply(`✅ ${getFragmentDisplayName(card.id, number)} donne a ${target.username}.`)
  }

  if (sub === "give-all") {
   for (const number of [1, 2, 3, 4, 5]) {
    addFragmentToInventory(target.id, { cardId: card.id, fragmentNumber: number, source: "dev" })
   }
   return interaction.editReply(`✅ 5 fragments de ${card.name} donnes a ${target.username}.`)
  }
 }
}
