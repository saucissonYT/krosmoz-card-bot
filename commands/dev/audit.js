const { SlashCommandBuilder } = require("discord.js")

const {
 runFullAudit,
 buildReport,
 progressBar
} = require("../../systems/auditSystem")

module.exports = {

 data: new SlashCommandBuilder()
  .setName("audit")
  .setDescription("Audit complet du bot"),

 async execute(interaction) {

  await interaction.deferReply()

  let percent = 0

  await interaction.editReply(
   `🔍 Audit en cours...\n${progressBar(percent)}`
  )

  const result = await runFullAudit(
   interaction.client,
   async p => {

    percent = p

    await interaction.editReply(
     `🔍 Audit en cours...\n${progressBar(percent)}`
    )

   }
  )

  const report = buildReport(result)

  await interaction.editReply(report)

 }

}
