async function routeButtonInteraction(interaction, client) {
 const id = interaction.customId

 if (id.startsWith("market_")) {
  const command = client.commands.get("market")
  if (command?.button) return command.button(interaction)
 }

 if (id === "title_prev" || id === "title_next") {
  const command = client.commands.get("titre")
  if (command?.button) return command.button(interaction)
 }

 if (id.startsWith("trade_accept_") || id.startsWith("trade_refuse_") || id.startsWith("trade_cancel_")) {
  const command = client.commands.get("trade")
  if (command?.button) return command.button(interaction)
 }

 if (id.startsWith("help_")) {
  const command = client.commands.get("krosmohelp")
  if (command?.button) return command.button(interaction)
 }

 if (id.startsWith("devhelp_")) {
  const command = client.commands.get("devhelp")
  if (command?.button) return command.button(interaction)
 }

 if (id.startsWith("ach_")) {
  const command = client.commands.get("achievements")
  if (command?.button) return command.button(interaction)
 }

 if (id.startsWith("bp_")) {
  const command = client.commands.get("battlepass")
  if (command?.button) return command.button(interaction)
 }

 console.warn(`[buttonRoutes] Unhandled button customId: ${id}`)
 return false
}

module.exports = {
 routeButtonInteraction
}
