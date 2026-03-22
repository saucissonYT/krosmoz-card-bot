const { SlashCommandBuilder } = require("discord.js")

const { isDev } = require("../../systems/devSystem")
const {
 addBattlePassXP,
 checkSeasonTransitions,
 devClaimAllForUser,
 devForceSeason,
 devGivePremium,
 devNextSeason,
 devResetProgress,
 devRestartSeason,
 devSetLevel,
 devSetXP,
 devStatus,
 devStopSeasonNow,
 runSeasonReset
} = require("../../systems/battlePassService")

module.exports = {
 data: new SlashCommandBuilder()
  .setName("devbp")
  .setDescription("Outils dev battle pass")
  .addStringOption((option) =>
   option.setName("action")
    .setDescription("Action dev")
    .setRequired(true)
    .addChoices(
     { name: "status", value: "status" },
     { name: "force", value: "force" },
     { name: "set-level", value: "set-level" },
     { name: "set-xp", value: "set-xp" },
     { name: "give-premium", value: "give-premium" },
     { name: "add-xp", value: "add-xp" },
     { name: "check-season", value: "check-season" },
     { name: "stop", value: "stop" },
     { name: "next", value: "next" },
     { name: "restart-keep", value: "restart-keep" },
     { name: "restart-reset", value: "restart-reset" },
     { name: "reset-progress", value: "reset-progress" },
     { name: "claim-all", value: "claim-all" },
     { name: "dry-run-end", value: "dry-run-end" }
    )
  )
  .addUserOption((option) =>
   option.setName("joueur")
    .setDescription("Joueur cible")
    .setRequired(false)
  )
  .addIntegerOption((option) =>
   option.setName("valeur")
    .setDescription("Valeur numerique")
    .setRequired(false)
  )
  .addStringOption((option) =>
   option.setName("saison")
    .setDescription("Saison cible")
    .setRequired(false)
    .addChoices(
     { name: "emeraude", value: "emeraude" },
     { name: "pourpre", value: "pourpre" },
     { name: "turquoise", value: "turquoise" },
     { name: "ocre", value: "ocre" },
     { name: "ivoire", value: "ivoire" },
     { name: "ebene", value: "ebene" }
    )
  ),

 async execute(interaction) {
  if (!isDev(interaction.user.id)) {
   return interaction.reply({ content: "Commande dev.", flags: 64 })
  }

  const action = interaction.options.getString("action")
  const target = interaction.options.getUser("joueur") || interaction.user
  const value = interaction.options.getInteger("valeur") || 0
  const season = interaction.options.getString("saison")

  if (action === "status") {
   const status = devStatus()
   return interaction.reply({
    content:
     `Saison: ${status.current.activeSeason} (${status.current.startDate} -> ${status.current.endDate})\n` +
     `Cycle index: ${status.current.cycleIndex}\n` +
     `forcedByDev: ${status.current.forcedByDev}\n` +
     `Joueurs: ${status.playersWithProgress}`,
    flags: 64
   })
  }

  if (action === "force") {
   if (!season) return interaction.reply({ content: "Saison requise.", flags: 64 })
   const result = devForceSeason(season)
   if (!result.ok) return interaction.reply({ content: `❌ ${result.error}`, flags: 64 })
   return interaction.reply({ content: `✅ Saison forcee: ${season}`, flags: 64 })
  }

  if (action === "set-level") {
   const level = value || 1
   const result = devSetLevel(target.id, level)
   if (!result.ok) return interaction.reply({ content: `❌ ${result.error}`, flags: 64 })
   return interaction.reply({ content: `✅ Niveau BP ${level} pour <@${target.id}>`, flags: 64 })
  }

  if (action === "set-xp") {
   const result = devSetXP(target.id, value)
   if (!result.ok) return interaction.reply({ content: `❌ ${result.error}`, flags: 64 })
   return interaction.reply({ content: `✅ XP BP ${value} pour <@${target.id}>`, flags: 64 })
  }

  if (action === "give-premium") {
   const result = devGivePremium(target.id)
   if (!result.ok) return interaction.reply({ content: `❌ ${result.error}`, flags: 64 })
   if (result.already) {
    return interaction.reply({ content: `✅ <@${target.id}> a deja le premium.`, flags: 64 })
   }
   return interaction.reply({ content: `✅ Premium dev donne a <@${target.id}> (+${result.retroCount} retro).`, flags: 64 })
  }

  if (action === "add-xp") {
   const amount = value || 0
   const result = await addBattlePassXP(target.id, amount, "manual")
   return interaction.reply({
    content: `✅ +${result.addedXP} XP BP pour <@${target.id}> (niv ${result.oldLevel} -> ${result.newLevel})`,
    flags: 64
   })
  }

  if (action === "check-season") {
   const result = checkSeasonTransitions()
   return interaction.reply({ content: `✅ checkSeasonTransitions: ${JSON.stringify(result)}`, flags: 64 })
  }

  if (action === "stop") {
   const result = devStopSeasonNow()
   return interaction.reply({ content: `✅ Saison stoppee puis transition: ${JSON.stringify(result.result)}`, flags: 64 })
  }

  if (action === "next") {
   const result = devNextSeason()
   if (!result.ok) return interaction.reply({ content: `❌ ${result.error}`, flags: 64 })
   return interaction.reply({ content: `✅ Saison suivante forcee: ${result.state.activeSeason}`, flags: 64 })
  }

  if (action === "restart-keep") {
   const result = devRestartSeason({ keepProgress: true })
   return interaction.reply({ content: `✅ Saison redemarree (progression conservee). Fin: ${result.state.endDate}`, flags: 64 })
  }

  if (action === "restart-reset") {
   const result = devRestartSeason({ keepProgress: false })
   return interaction.reply({ content: `✅ Saison redemarree (progression reset). Fin: ${result.state.endDate}`, flags: 64 })
  }

  if (action === "reset-progress") {
   const result = devResetProgress(target.id)
   if (!result.ok) return interaction.reply({ content: `❌ ${result.error}`, flags: 64 })
   return interaction.reply({ content: `✅ Progression BP reset pour <@${target.id}>`, flags: 64 })
  }

  if (action === "claim-all") {
   const result = await devClaimAllForUser(target.id)
   if (!result.ok) return interaction.reply({ content: `❌ ${result.error}`, flags: 64 })
   return interaction.reply({ content: `✅ Claim force pour <@${target.id}>: ${result.total} rewards`, flags: 64 })
  }

  if (action === "dry-run-end") {
   const result = runSeasonReset({ dryRun: true })
   return interaction.reply({
    content:
     `✅ Dry-run reset\n` +
     `Saison: ${result.currentSeason} -> ${result.nextSeason}\n` +
     `Users: ${result.users}\n` +
     `Rewards a auto-distribuer: ${result.rewardsToDistribute}`,
    flags: 64
   })
  }

  return interaction.reply({ content: "Action inconnue.", flags: 64 })
 }
}
