async function routeModalInteraction(interaction, client) {
 const id = interaction.customId

 /* ── MARKET ── */
 if (
  id === "marketBuyModal"      ||
  id === "marketSellModal"     ||
  id === "marketRemoveModal"   ||
  id === "marketSellFragmentModal"   /* FIX : fragment modal manquant */
 ) {
  const command = client.commands.get("market")
  if (command?.modal) return command.modal(interaction)
 }

 /* ── CARTE ── */
 if (id.startsWith("marketmodal_")) {
  const command = client.commands.get("carte")
  if (command?.modal) return command.modal(interaction)
 }

 /* ── FALLBACK ── */
 console.warn(`[modalRoutes] Unhandled modal customId: ${id}`)
}

module.exports = {
 routeModalInteraction
}