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

 /* FIX : boutons profil — après expiration collector (120s) ou restart bot */
 if (id.startsWith("profil_")) {
  const command = client.commands.get("profil")
  if (command?.button) return command.button(interaction)
  return interaction.reply({
   content: "⏳ Ce profil a expiré. Utilise `/profil` pour en ouvrir un nouveau.",
   flags: 64
  })
 }

 /* FIX : boutons mystats — après expiration collector (180s) ou restart bot */
 if (id.startsWith("mystats_")) {
  const command = client.commands.get("mystats")
  if (command?.button) return command.button(interaction)
  return interaction.reply({
   content: "⏳ Cette page a expiré. Utilise `/mystats` pour en ouvrir une nouvelle.",
   flags: 64
  })
 }

 console.warn(`[buttonRoutes] Unhandled button customId: ${id}`)
 return false
}

module.exports = {
 routeButtonInteraction
}