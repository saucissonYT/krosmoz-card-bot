const {
 SlashCommandBuilder,
 EmbedBuilder,
 ActionRowBuilder,
 ButtonBuilder,
 ButtonStyle
} = require("discord.js")

const { getUser, save } = require("../../systems/userSystem")
const {
 getUserGuild,
 getGuild,
 getGuildRank,
 kickMember,
 promoteOfficer,
 demoteOfficer,
 transferLeader,
 renameGuild,
 disbandGuild,
 joinGuild,
 MAX_MEMBERS,
 RENAME_COST
} = require("../../systems/guildSystem")
const { achievementCheck } = require("../../systems/achievementCheck")
const { notifyAchievements } = require("../../systems/achievementNotifier")

module.exports = {

 data: new SlashCommandBuilder()
  .setName("guildmanage")
  .setDescription("Gérer ta guilde (meneur/officier)")
  .addStringOption(o =>
   o.setName("action")
    .setDescription("Action à effectuer")
    .setRequired(true)
    .addChoices(
     { name:"Inviter un joueur",    value:"invite" },
     { name:"Exclure un membre",    value:"kick" },
     { name:"Promouvoir officier",  value:"promote" },
     { name:"Rétrograder officier", value:"demote" },
     { name:"Transférer leadership",value:"transfer" },
     { name:"Renommer la guilde",   value:"rename" },
     { name:"Dissoudre la guilde",  value:"disband" }
    )
  )
  .addUserOption(o =>
   o.setName("joueur")
    .setDescription("Joueur cible (pour invite/kick/promote/demote/transfer)")
    .setRequired(false)
  )
  .addStringOption(o =>
   o.setName("nom")
    .setDescription("Nouveau nom (pour rename)")
    .setRequired(false)
  ),

 async execute(interaction){

  const action = interaction.options.getString("action")
  const targetUser = interaction.options.getUser("joueur")
  const newName = interaction.options.getString("nom")

  const guild = getUserGuild(interaction.user.id)

  if(!guild)
   return interaction.reply({ content:"❌ Tu n'es dans aucune guilde.", flags:64 })

  const rank = getGuildRank(guild.id, interaction.user.id)
  const isLeader = rank === "meneur"
  const isOfficer = rank === "officier"

  /* ================= INVITE ================= */

  if(action === "invite"){

   if(!isLeader && !isOfficer)
    return interaction.reply({ content:"❌ Seuls le meneur et les officiers peuvent inviter.", flags:64 })

   if(!targetUser)
    return interaction.reply({ content:"❌ Précise un joueur avec l'option `joueur`.", flags:64 })

   if(targetUser.bot)
    return interaction.reply({ content:"❌ Tu ne peux pas inviter un bot.", flags:64 })

   const targetData = getUser(targetUser.id)

   if(targetData.guildId)
    return interaction.reply({ content:"❌ Ce joueur est déjà dans une guilde.", flags:64 })

   if(guild.memberIds.length >= MAX_MEMBERS)
    return interaction.reply({ content:`❌ La guilde est pleine (${MAX_MEMBERS}/${MAX_MEMBERS}).`, flags:64 })

   /* Envoyer l'invitation */

   const inviteEmbed = new EmbedBuilder()
    .setTitle("📨 Invitation de guilde")
    .setColor("#3498db")
    .setDescription(
`**${interaction.user.username}** t'invite à rejoindre :

${guild.emoji} **${guild.name}**
Niveau **${guild.level}** • ${guild.memberIds.length}/${MAX_MEMBERS} membres`
    )

   const row = new ActionRowBuilder().addComponents(

    new ButtonBuilder()
     .setCustomId("guild_accept")
     .setLabel("Accepter")
     .setEmoji("✅")
     .setStyle(ButtonStyle.Success),

    new ButtonBuilder()
     .setCustomId("guild_decline")
     .setLabel("Refuser")
     .setStyle(ButtonStyle.Danger)
   )

   const msg = await interaction.reply({
    content:`<@${targetUser.id}>`,
    embeds:[inviteEmbed],
    components:[row],
    fetchReply:true
   })

   const collector = msg.createMessageComponentCollector({ time:120000 })

   collector.on("collect", async i => {

    /* Seul le joueur invité peut répondre */
    if(i.user.id !== targetUser.id)
     return i.reply({ content:"Cette invitation ne t'est pas destinée.", flags:64 })

    if(i.customId === "guild_decline"){
     return i.update({
      embeds:[new EmbedBuilder().setTitle("❌ Invitation refusée").setColor("#e74c3c")],
      components:[]
     })
    }

    if(i.customId === "guild_accept"){

     const result = joinGuild(targetUser.id, guild.id)

     if(result.error)
      return i.reply({ content:`❌ ${result.error}`, flags:64 })

     /* Achievement */
     const freshTarget = getUser(targetUser.id)
     const unlocked = achievementCheck(freshTarget, "guild")

     /* Check guilde pleine */
     const g = getGuild(guild.id)
     if(g && g.memberIds.length >= MAX_MEMBERS){
      for(const mId of g.memberIds){
       const m = getUser(mId)
       m.stats = m.stats || {}
       m.stats.guildWasFull = 1
       save(mId)
      }
     }

     const successEmbed = new EmbedBuilder()
      .setTitle("✅ Bienvenue dans la guilde !")
      .setColor("#2ecc71")
      .setDescription(`**${targetUser.username}** a rejoint ${guild.emoji} **${guild.name}** !`)

     await i.update({ embeds:[successEmbed], components:[] })

     if(unlocked.length)
      await notifyAchievements(interaction, unlocked)
    }

   })

   collector.on("end", (c, reason) => {
    if(reason === "time" && c.size === 0){
     interaction.editReply({
      embeds:[new EmbedBuilder().setTitle("⏰ Invitation expirée").setColor("#95a5a6")],
      components:[]
     }).catch(() => {})
    }
   })

   return
  }

  /* ================= KICK ================= */

  if(action === "kick"){

   if(!targetUser)
    return interaction.reply({ content:"❌ Précise un joueur.", flags:64 })

   const result = kickMember(guild.id, interaction.user.id, targetUser.id)

   if(result.error)
    return interaction.reply({ content:`❌ ${result.error}`, flags:64 })

   return interaction.reply({
    embeds:[new EmbedBuilder()
     .setTitle("🔨 Membre exclu")
     .setColor("#e74c3c")
     .setDescription(`**${targetUser.username}** a été exclu de ${guild.emoji} **${guild.name}**.`)
    ]
   })
  }

  /* ================= PROMOTE ================= */

  if(action === "promote"){

   if(!isLeader)
    return interaction.reply({ content:"❌ Seul le meneur peut promouvoir.", flags:64 })

   if(!targetUser)
    return interaction.reply({ content:"❌ Précise un joueur.", flags:64 })

   const result = promoteOfficer(guild.id, interaction.user.id, targetUser.id)

   if(result.error)
    return interaction.reply({ content:`❌ ${result.error}`, flags:64 })

   /* Track pour achievement */
   const targetData = getUser(targetUser.id)
   targetData.stats = targetData.stats || {}
   targetData.stats.guildPromoted = (targetData.stats.guildPromoted || 0) + 1
   save(targetUser.id)

   const unlocked = achievementCheck(targetData, "guild")

   const embed = new EmbedBuilder()
    .setTitle("⚔️ Nouveau officier !")
    .setColor("#f1c40f")
    .setDescription(`**${targetUser.username}** est maintenant **Officier** de ${guild.emoji} **${guild.name}** !`)

   await interaction.reply({ embeds:[embed] })

   if(unlocked.length)
    await notifyAchievements(interaction, unlocked)

   return
  }

  /* ================= DEMOTE ================= */

  if(action === "demote"){

   if(!isLeader)
    return interaction.reply({ content:"❌ Seul le meneur peut rétrograder.", flags:64 })

   if(!targetUser)
    return interaction.reply({ content:"❌ Précise un joueur.", flags:64 })

   const result = demoteOfficer(guild.id, interaction.user.id, targetUser.id)

   if(result.error)
    return interaction.reply({ content:`❌ ${result.error}`, flags:64 })

   return interaction.reply({
    embeds:[new EmbedBuilder()
     .setTitle("📉 Rétrogradation")
     .setColor("#e67e22")
     .setDescription(`**${targetUser.username}** n'est plus officier.`)
    ]
   })
  }

  /* ================= TRANSFER ================= */

  if(action === "transfer"){

   if(!isLeader)
    return interaction.reply({ content:"❌ Seul le meneur peut transférer.", flags:64 })

   if(!targetUser)
    return interaction.reply({ content:"❌ Précise un joueur.", flags:64 })

   /* Confirmation */
   const confirmEmbed = new EmbedBuilder()
    .setTitle("⚠️ Transférer le leadership ?")
    .setColor("#e74c3c")
    .setDescription(
`Tu vas transférer le rôle de **meneur** à **${targetUser.username}**.
Tu deviendras officier.

**Cette action est irréversible.**`
    )

   const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
     .setCustomId("guild_transfer_confirm")
     .setLabel("Confirmer")
     .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
     .setCustomId("guild_transfer_cancel")
     .setLabel("Annuler")
     .setStyle(ButtonStyle.Secondary)
   )

   const msg = await interaction.reply({
    embeds:[confirmEmbed],
    components:[row],
    fetchReply:true
   })

   const collector = msg.createMessageComponentCollector({ time:30000 })

   collector.on("collect", async i => {

    if(i.user.id !== interaction.user.id)
     return i.reply({ content:"Pas ton menu.", flags:64 })

    if(i.customId === "guild_transfer_cancel")
     return i.update({ embeds:[new EmbedBuilder().setTitle("❌ Annulé").setColor("#95a5a6")], components:[] })

    const result = transferLeader(guild.id, interaction.user.id, targetUser.id)

    if(result.error)
     return i.reply({ content:`❌ ${result.error}`, flags:64 })

    /* Track stat */
    const userData = getUser(interaction.user.id)
    userData.stats = userData.stats || {}
    userData.stats.guildTransferred = (userData.stats.guildTransferred || 0) + 1
    save(interaction.user.id)

    await i.update({
     embeds:[new EmbedBuilder()
      .setTitle("👑 Leadership transféré")
      .setColor("#f1c40f")
      .setDescription(`**${targetUser.username}** est le nouveau meneur de ${guild.emoji} **${guild.name}** !`)
     ],
     components:[]
    })
   })

   return
  }

  /* ================= RENAME ================= */

  if(action === "rename"){

   if(!isLeader)
    return interaction.reply({ content:"❌ Seul le meneur peut renommer.", flags:64 })

   if(!newName)
    return interaction.reply({ content:"❌ Précise un nom avec l'option `nom`.", flags:64 })

   const result = renameGuild(guild.id, interaction.user.id, newName)

   if(result.error)
    return interaction.reply({ content:`❌ ${result.error}`, flags:64 })

   /* Track stat */
   const userData = getUser(interaction.user.id)
   userData.stats = userData.stats || {}
   userData.stats.guildRenamed = (userData.stats.guildRenamed || 0) + 1
   save(interaction.user.id)

   return interaction.reply({
    embeds:[new EmbedBuilder()
     .setTitle("✏️ Guilde renommée")
     .setColor("#2ecc71")
     .setDescription(`La guilde s'appelle maintenant ${result.guild.emoji} **${result.guild.name}** !\nCoût : **${RENAME_COST} kamas**`)
    ]
   })
  }

  /* ================= DISBAND ================= */

  if(action === "disband"){

   if(!isLeader)
    return interaction.reply({ content:"❌ Seul le meneur peut dissoudre.", flags:64 })

   const confirmEmbed = new EmbedBuilder()
    .setTitle("⚠️ Dissoudre la guilde ?")
    .setColor("#e74c3c")
    .setDescription(
`Tu vas dissoudre ${guild.emoji} **${guild.name}**.
Tous les membres seront retirés. Le niveau et les quêtes seront perdus.

**Cette action est irréversible et ne sera pas remboursée.**`
    )

   const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
     .setCustomId("guild_disband_confirm")
     .setLabel("Dissoudre")
     .setStyle(ButtonStyle.Danger),
    new ButtonBuilder()
     .setCustomId("guild_disband_cancel")
     .setLabel("Annuler")
     .setStyle(ButtonStyle.Secondary)
   )

   const msg = await interaction.reply({
    embeds:[confirmEmbed],
    components:[row],
    fetchReply:true
   })

   const collector = msg.createMessageComponentCollector({ time:30000 })

   collector.on("collect", async i => {

    if(i.user.id !== interaction.user.id)
     return i.reply({ content:"Pas ton menu.", flags:64 })

    if(i.customId === "guild_disband_cancel")
     return i.update({ embeds:[new EmbedBuilder().setTitle("❌ Annulé").setColor("#95a5a6")], components:[] })

    const result = disbandGuild(guild.id, interaction.user.id)

    if(result.error)
     return i.reply({ content:`❌ ${result.error}`, flags:64 })

    await i.update({
     embeds:[new EmbedBuilder()
      .setTitle("💥 Guilde dissoute")
      .setColor("#e74c3c")
      .setDescription(`La guilde **${result.name}** a été dissoute.`)
     ],
     components:[]
    })
   })

   return
  }

 }

}