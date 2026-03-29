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

 /* Fallback fusion — collector expiré */
 if (id.startsWith("fusion_")) {
  return interaction.reply({
   content: "⏳ Ce menu de fusion a expiré. Utilise `/fusion` pour en ouvrir un nouveau.",
   flags: 64
  })
 }

 /*
  * NE PAS router profil_* ni mystats_* ici.
  *
  * Ces boutons sont gérés par des collectors internes dans profil.js
  * et mystats.js. Si on les routait vers command.button() ici, le
  * global interactionCreate répondrait "expiré" AVANT que le collector
  * puisse traiter l'interaction → double acknowledge → crash, et le
  * message "expiré" s'affiche même pendant la fenêtre active.
  *
  * Quand le collector expire, il retire les composants du message
  * (msg.edit({ components: [] })) donc il n'y a plus de boutons
  * cliquables — pas besoin de fallback ici.
  */

 console.warn(`[buttonRoutes] Unhandled button customId: ${id}`)
 return false
}

module.exports = {
 routeButtonInteraction
}