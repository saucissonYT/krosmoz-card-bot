const fs   = require("fs")
const path = require("path")

const { SlashCommandBuilder } = require("discord.js")
const { isDev }               = require("../../systems/devSystem")
const { getBattlePassPaths }  = require("../../systems/seasonService")

const CYCLE = ["emeraude", "pourpre", "turquoise", "ocre", "ivoire", "ebene"]
const NEW_PRICE = 18000

module.exports = {

 data: new SlashCommandBuilder()
  .setName("patchprice")
  .setDescription("Dev — corrige premiumPrice a 18000 dans tous les JSON de saison"),

 async execute(interaction) {

  if (!isDev(interaction.user.id))
   return interaction.reply({ content: "Commande dev.", flags: 64 })

  await interaction.deferReply({ flags: 64 })

  const paths   = getBattlePassPaths()
  const results = []

  for (const id of CYCLE) {

   const file = path.join(paths.seasons, `${id}.json`)

   if (!fs.existsSync(file)) {
    results.push(`⚠️ ${id}.json introuvable`)
    continue
   }

   try {
    const data = JSON.parse(fs.readFileSync(file, "utf8"))
    const old  = data.premiumPrice ?? "absent"

    data.premiumPrice = NEW_PRICE

    fs.writeFileSync(file, JSON.stringify(data, null, 2))

    results.push(`✅ ${id}.json : ${old} → ${NEW_PRICE}`)

   } catch (err) {
    results.push(`❌ ${id}.json : ${err.message}`)
   }

  }

  return interaction.editReply({
   content: `**Patch premiumPrice**\n\n${results.join("\n")}`
  })

 }

}