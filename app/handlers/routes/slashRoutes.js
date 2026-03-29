const { PermissionFlagsBits } = require("discord.js")

function parseRoleIds(raw) {
 return String(raw || "")
  .split(",")
  .map((id) => id.trim())
  .filter((id) => /^\d{16,22}$/.test(id))
}

function getAllowedRoleIds(folder) {
 const adminRoles = parseRoleIds(
  process.env.ADMIN_COMMAND_ROLE_IDS || process.env.ADMIN_ROLE_IDS
 )
 const devRoles = parseRoleIds(
  process.env.DEV_COMMAND_ROLE_IDS ||
  process.env.ADMIN_COMMAND_ROLE_IDS ||
  process.env.ADMIN_ROLE_IDS
 )

 if (folder === "admin") return adminRoles
 if (folder === "dev") return devRoles
 return []
}

function hasAuthorizedRole(interaction, allowedRoleIds) {
 if (!allowedRoleIds.length) return false
 const memberRoles = interaction.member?.roles?.cache
 if (!memberRoles) return false
 return memberRoles.some((role) => allowedRoleIds.includes(role.id))
}

async function routeSlashInteraction(interaction, client) {
 const command = client.commands.get(interaction.commandName)
 if (!command) return

 const folder = command._folder
 if (folder === "admin" || folder === "dev") {
  const allowedRoleIds = getAllowedRoleIds(folder)
  const isGuild = Boolean(interaction.guildId)
  const isGuildAdmin = interaction.memberPermissions?.has(PermissionFlagsBits.Administrator) === true
  const isRoleAllowed = hasAuthorizedRole(interaction, allowedRoleIds)

  if (!isGuild || (!isGuildAdmin && !isRoleAllowed)) {
   if (interaction.replied || interaction.deferred) {
    await interaction.followUp({
     content: "Commande reservee au staff.",
     ephemeral: true
    })
   } else {
    await interaction.reply({
     content: "Commande reservee au staff.",
     ephemeral: true
    })
   }
   return
  }
 }

 await command.execute(interaction)
}

module.exports = {
 routeSlashInteraction
}
