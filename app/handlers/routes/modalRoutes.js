async function routeModalInteraction(interaction, client) {
 const id = interaction.customId

 if (id === "marketBuyModal" || id === "marketSellModal" || id === "marketRemoveModal") {
  const command = client.commands.get("market")
  if (command?.modal) return command.modal(interaction)
 }

 if (id.startsWith("marketmodal_")) {
  const command = client.commands.get("carte")
  if (command?.modal) return command.modal(interaction)
 }
}

module.exports = {
 routeModalInteraction
}
