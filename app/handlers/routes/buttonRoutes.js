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

 /*
  * FIX: guild_accept / guild_decline sont gérés par le collector interne
  * dans guildmanage.js. Si on arrive ici, c'est que le collector a expiré
  * (bot redémarré, invitation trop vieille). On répond proprement.
  */
 if (id === "guild_accept" || id === "guild_decline"){
  return interaction.reply({
   content:"⏰ Cette invitation a expiré.",
   flags:64
  })
 }

 /*
  * NE PAS router fusion_* ici.
  *
  * Les boutons fusion_ (fusion_confirm, fusion_back_sets, fusion_back_rarity)
  * sont gérés par le collector interne dans fusion.js.
  * Si on les routait ici, le handler global acknowledgerait l'interaction
  * AVANT le collector → double acknowledge → crash + message "expiré"
  * affiché immédiatement même pendant la fenêtre active.
  *
  * Le collector retire les composants à l'expiration (msg.edit({ components: [] }))
  * donc il n'y a plus de boutons cliquables après timeout — pas besoin de fallback.
  *
  * NE PAS router profil_* ni mystats_* ici pour la même raison.
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