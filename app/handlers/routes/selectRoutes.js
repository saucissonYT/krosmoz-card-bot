async function routeSelectInteraction(interaction, client) {
 const id = interaction.customId

 if (id === "krosmoshop_buy") {
  const command = client.commands.get("krosmoshop")
  if (command?.select) return command.select(interaction)
 }

 if (id === "choose_title") {
  const command = client.commands.get("titre")
  if (command?.select) return command.select(interaction)
 }

 if (id.startsWith("trade_menu_")) {
  const command = client.commands.get("trade")
  if (command?.menu) return command.menu(interaction)
 }

 if (id.startsWith("hardpityset:") || id.startsWith("hardpity:")) {
  const command = client.commands.get("hardpity")
  if (command?.select) return command.select(interaction)
 }

 if (id === "ach_category") {
  const command = client.commands.get("achievements")
  if (command?.select) return command.select(interaction)
 }

 /*
  * NE PAS router fusion_set ni fusion_rarity ici — retour silencieux.
  *
  * Ces selects sont gérés par le collector interne dans fusion.js.
  * La route générique ci-dessous tente client.commands.get("fusion")?.select
  * qui est undefined (fusion n'exporte pas de handler select) → warn parasite.
  * On les intercepte explicitement et on retourne false sans loguer.
  *
  * Si le collector est expiré (timeout ou redémarrage), Discord affiche
  * "Interaction Failed" — c'est acceptable et préférable à un double
  * acknowledge qui crasherait les sessions actives.
  */
 if (id === "fusion_set" || id === "fusion_rarity") {
  return false
 }

 const commandName = id.split("_")[0]
 const command = client.commands.get(commandName)

 if (command?.select && id.startsWith(`${commandName}_`)) return command.select(interaction)

 console.warn(`[selectRoutes] Unhandled select customId: ${id}`)
 return false
}

module.exports = {
 routeSelectInteraction
}