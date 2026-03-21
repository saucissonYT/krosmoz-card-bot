const { SlashCommandBuilder, EmbedBuilder } = require("discord.js")

const { isDev } = require("../../systems/devSystem")
const {
 getAllGuilds,
 getGuild,
 getUserGuild,
 devSetLevel,
 devAddXP,
 devForceJoin,
 disbandGuild,
 createGuild,
 xpRequired
} = require("../../systems/guildSystem")
const { formatBonuses } = require("../../systems/guildBonuses")
const { getUser, save } = require("../../systems/userSystem")

module.exports = {

 data: new SlashCommandBuilder()
  .setName("devguild")
  .setDescription("Outils dev pour les guildes")
  .addStringOption(o =>
   o.setName("action")
    .setDescription("Action")
    .setRequired(true)
    .addChoices(
     { name:"list — Lister les guildes",         value:"list" },
     { name:"info — Détails d'une guilde",       value:"info" },
     { name:"setlevel — Modifier le niveau",     value:"setlevel" },
     { name:"addxp — Ajouter de l'XP",           value:"addxp" },
     { name:"forcejoin — Forcer un joueur",       value:"forcejoin" },
     { name:"disband — Dissoudre une guilde",     value:"disband" },
     { name:"create — Créer une guilde pour un joueur", value:"create" },
     { name:"bonuses — Voir les bonus d'un niveau", value:"bonuses" }
    )
  )
  .addUserOption(o =>
   o.setName("joueur")
    .setDescription("Joueur cible")
    .setRequired(false)
  )
  .addStringOption(o =>
   o.setName("guild_id")
    .setDescription("ID de la guilde")
    .setRequired(false)
  )
  .addIntegerOption(o =>
   o.setName("valeur")
    .setDescription("Valeur (niveau ou XP)")
    .setRequired(false)
  )
  .addStringOption(o =>
   o.setName("nom")
    .setDescription("Nom de la guilde (pour create)")
    .setRequired(false)
  ),

 async execute(interaction){

  if(!isDev(interaction.user.id))
   return interaction.reply({ content:"⛔ Commande dev.", ephemeral:true })

  const action = interaction.options.getString("action")
  const targetUser = interaction.options.getUser("joueur")
  const guildIdInput = interaction.options.getString("guild_id")
  const valeur = interaction.options.getInteger("valeur")
  const nom = interaction.options.getString("nom")

  /* ---- LIST ---- */

  if(action === "list"){

   const guilds = getAllGuilds()
    .sort((a, b) => b.level - a.level)

   if(guilds.length === 0)
    return interaction.reply({ content:"Aucune guilde.", ephemeral:true })

   const lines = guilds.map((g, i) =>
    `${i + 1}. ${g.emoji} **${g.name}** — Niv. ${g.level} (${g.memberIds.length} mbr) — \`${g.id}\``
   )

   const embed = new EmbedBuilder()
    .setTitle("🏰 Guildes")
    .setDescription(lines.join("\n"))
    .setColor("#3498db")
    .setFooter({ text:`${guilds.length} guildes` })

   return interaction.reply({ embeds:[embed], ephemeral:true })
  }

  /* ---- INFO ---- */

  if(action === "info"){

   let guild = null

   if(guildIdInput) guild = getGuild(guildIdInput)
   if(!guild && targetUser) guild = getUserGuild(targetUser.id)

   if(!guild)
    return interaction.reply({ content:"❌ Guilde introuvable.", ephemeral:true })

   const embed = new EmbedBuilder()
    .setTitle(`${guild.emoji} ${guild.name}`)
    .setColor("#9b59b6")
    .setDescription(
`**ID :** \`${guild.id}\`
**Niveau :** ${guild.level} (${guild.xp}/${xpRequired(guild.level)} XP)
**Meneur :** <@${guild.leaderId}>
**Officiers :** ${guild.officerIds.length > 0 ? guild.officerIds.map(id => `<@${id}>`).join(", ") : "Aucun"}
**Membres :** ${guild.memberIds.length} — ${guild.memberIds.map(id => `<@${id}>`).join(", ")}
**Créée le :** ${new Date(guild.createdAt).toLocaleDateString("fr-FR")}
**Quêtes complétées :** ${guild.stats.questsCompleted || 0}
**XP total gagné :** ${guild.stats.totalXpEarned || 0}`
    )

   return interaction.reply({ embeds:[embed], ephemeral:true })
  }

  /* ---- SETLEVEL ---- */

  if(action === "setlevel"){

   let guild = guildIdInput ? getGuild(guildIdInput) : null
   if(!guild && targetUser) guild = getUserGuild(targetUser.id)
   if(!guild) return interaction.reply({ content:"❌ Guilde introuvable.", ephemeral:true })

   if(!valeur) return interaction.reply({ content:"❌ Précise une valeur.", ephemeral:true })

   const result = devSetLevel(guild.id, valeur)

   if(result.error)
    return interaction.reply({ content:`❌ ${result.error}`, ephemeral:true })

   /* Update stats pour tous les membres */
   for(const mId of guild.memberIds){
    const m = getUser(mId)
    m.stats = m.stats || {}
    m.stats.guildMaxLevel = Math.max(m.stats.guildMaxLevel || 0, guild.level)
    save(mId)
   }

   return interaction.reply({
    content:`✅ ${guild.emoji} **${guild.name}** → Niveau **${guild.level}**`,
    ephemeral:true
   })
  }

  /* ---- ADDXP ---- */

  if(action === "addxp"){

   let guild = guildIdInput ? getGuild(guildIdInput) : null
   if(!guild && targetUser) guild = getUserGuild(targetUser.id)
   if(!guild) return interaction.reply({ content:"❌ Guilde introuvable.", ephemeral:true })

   if(!valeur) return interaction.reply({ content:"❌ Précise une valeur.", ephemeral:true })

   const result = devAddXP(guild.id, valeur)
   if(!result) return interaction.reply({ content:"❌ Erreur.", ephemeral:true })

   let text = `✅ +${valeur} XP → ${guild.emoji} **${guild.name}**`

   if(result.leveled)
    text += ` — **Level up ${result.oldLevel} → ${result.newLevel} !**`

   return interaction.reply({ content:text, ephemeral:true })
  }

  /* ---- FORCEJOIN ---- */

  if(action === "forcejoin"){

   if(!targetUser) return interaction.reply({ content:"❌ Précise un joueur.", ephemeral:true })

   let guild = guildIdInput ? getGuild(guildIdInput) : null
   if(!guild) return interaction.reply({ content:"❌ Précise un guild_id valide.", ephemeral:true })

   const result = devForceJoin(targetUser.id, guild.id)

   if(result.error)
    return interaction.reply({ content:`❌ ${result.error}`, ephemeral:true })

   return interaction.reply({
    content:`✅ **${targetUser.username}** ajouté à ${guild.emoji} **${guild.name}**`,
    ephemeral:true
   })
  }

  /* ---- DISBAND ---- */

  if(action === "disband"){

   let guild = guildIdInput ? getGuild(guildIdInput) : null
   if(!guild && targetUser) guild = getUserGuild(targetUser.id)
   if(!guild) return interaction.reply({ content:"❌ Guilde introuvable.", ephemeral:true })

   /* Dev bypass : on utilise le leaderId pour forcer */
   const result = disbandGuild(guild.id, guild.leaderId)

   if(result.error)
    return interaction.reply({ content:`❌ ${result.error}`, ephemeral:true })

   return interaction.reply({
    content:`✅ Guilde **${result.name}** dissoute.`,
    ephemeral:true
   })
  }

  /* ---- CREATE ---- */

  if(action === "create"){

   if(!targetUser) return interaction.reply({ content:"❌ Précise un joueur.", ephemeral:true })
   if(!nom) return interaction.reply({ content:"❌ Précise un nom.", ephemeral:true })

   /* Override le coût en kamas pour le dev */
   const user = getUser(targetUser.id)
   const hadKamas = user.kamas
   if(user.kamas < 5000) user.kamas = 5000

   const result = createGuild(targetUser.id, nom)

   if(result.error){
    user.kamas = hadKamas
    return interaction.reply({ content:`❌ ${result.error}`, ephemeral:true })
   }

   return interaction.reply({
    content:`✅ Guilde ${result.guild.emoji} **${result.guild.name}** créée pour **${targetUser.username}**`,
    ephemeral:true
   })
  }

  /* ---- BONUSES ---- */

  if(action === "bonuses"){

   const level = valeur || 100

   const embed = new EmbedBuilder()
    .setTitle(`🎯 Bonus de guilde — Niveau ${level}`)
    .setColor("#2ecc71")
    .setDescription(formatBonuses(level))

   return interaction.reply({ embeds:[embed], ephemeral:true })
  }

 }

}