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

 const commandName = id.split("_")[0]
 const command = client.commands.get(commandName)

 if (command?.select && id.startsWith(`${commandName}_`)) return command.select(interaction)

 console.warn(`[selectRoutes] Unhandled select customId: ${id}`)
 return false
}

module.exports = {
 routeSelectInteraction
}
