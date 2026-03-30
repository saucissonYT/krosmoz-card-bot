const { PermissionFlagsBits } = require("discord.js")

/* ================================================================
   RÔLE MODÉRATEUR DISCORD
   ID du grade : 1487096162849788036
   Dossiers protégés par ce rôle :
     – moderation  (sanction, malchance...)
     – krosmoevent (event, krosmoevent...)
     – stats       (stats du bot)
   Note : le dossier "admin" a été supprimé — ses commandes ont été
   déplacées dans "moderation" ou "dev".
================================================================ */

const MODERATOR_ROLE_ID = "1487096162849788036"

function parseRoleIds(raw) {
  return String(raw || "")
    .split(",")
    .map((id) => id.trim())
    .filter((id) => /^\d{16,22}$/.test(id))
}

/**
 * Renvoie la liste des role IDs autorisés pour un dossier donné.
 *
 * Dossiers modérateurs : moderation, krosmoevent, stats
 *   → rôle modérateur + éventuels rôles env ADMIN_ROLE_IDS
 *
 * Dossier dev :
 *   → uniquement rôles env DEV_COMMAND_ROLE_IDS / ADMIN_COMMAND_ROLE_IDS
 *   → PAS le rôle modérateur (accès plus restreint)
 */
function getAllowedRoleIds(folder) {

  const adminRoles = parseRoleIds(
    process.env.ADMIN_COMMAND_ROLE_IDS || process.env.ADMIN_ROLE_IDS
  )
  const devRoles = parseRoleIds(
    process.env.DEV_COMMAND_ROLE_IDS ||
    process.env.ADMIN_COMMAND_ROLE_IDS ||
    process.env.ADMIN_ROLE_IDS
  )

  const modRoles = [...new Set([MODERATOR_ROLE_ID, ...adminRoles])]

  if (folder === "moderation")  return modRoles
  if (folder === "krosmoevent") return modRoles
  if (folder === "stats")       return modRoles
  if (folder === "dev")         return devRoles

  return []
}

function hasAuthorizedRole(interaction, allowedRoleIds) {
  if (!allowedRoleIds.length) return false
  const memberRoles = interaction.member?.roles?.cache
  if (!memberRoles) return false
  return memberRoles.some((role) => allowedRoleIds.includes(role.id))
}

/* ================================================================
   DOSSIERS PROTÉGÉS
   "admin" supprimé — ses fichiers doivent être déplacés dans
   "moderation" (commandes modération/event/stats) ou "dev".
================================================================ */

const PROTECTED_FOLDERS = ["dev", "moderation", "krosmoevent", "stats"]

/* ================================================================
   ROUTEUR PRINCIPAL
================================================================ */

async function routeSlashInteraction(interaction, client) {

  const command = client.commands.get(interaction.commandName)
  if (!command) return

  const folder = command._folder

  /* ── Vérification accès pour les dossiers protégés ── */
  if (PROTECTED_FOLDERS.includes(folder)) {

    const allowedRoleIds = getAllowedRoleIds(folder)
    const isGuild        = Boolean(interaction.guildId)
    const isGuildAdmin   = interaction.memberPermissions?.has(PermissionFlagsBits.Administrator) === true
    const isRoleAllowed  = hasAuthorizedRole(interaction, allowedRoleIds)

    if (!isGuild || (!isGuildAdmin && !isRoleAllowed)) {
      const msg = "⛔ Commande réservée au staff."
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp({ content: msg, ephemeral: true })
      } else {
        await interaction.reply({ content: msg, ephemeral: true })
      }
      return
    }
  }

  /* ── Vérification sanction (commandes joueur uniquement) ── */
  if (folder === "joueur") {
    try {
      /* FIX: chemin corrigé — slashRoutes est dans app/handlers/routes/
         donc ../../../ remonte jusqu'à la racine du projet               */
      const { isSanctioned } = require("../../../systems/moderationSystem")
      const sanction = isSanctioned(interaction.user.id)

      if (sanction) {
        const isPermanent = sanction.endsAt === null
        const endText = isPermanent
          ? "indéfiniment"
          : `jusqu'à <t:${Math.floor(sanction.endsAt / 1000)}:R>`

        const msg =
          `🔨 **Tu es sanctionné** et ne peux pas utiliser le bot ${endText}.\n` +
          `> Raison : *${sanction.reason}*`

        if (interaction.replied || interaction.deferred) {
          await interaction.followUp({ content: msg, ephemeral: true })
        } else {
          await interaction.reply({ content: msg, ephemeral: true })
        }
        return
      }
    } catch (err) {
      console.error("[MODERATION] Erreur vérification sanction :", err)
    }
  }

  await command.execute(interaction)
}

module.exports = {
  routeSlashInteraction
}