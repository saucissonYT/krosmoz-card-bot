const {
 EmbedBuilder,
 ActionRowBuilder,
 ButtonBuilder,
 ButtonStyle
} = require("discord.js")

const { getUser } = require("../../systems/userSystem")
const { getLeaderboard } = require("../../systems/leaderboardCache")
const { achievementCheck } = require("../../systems/achievementCheck")
const { notifyAchievements } = require("../../systems/achievementNotifier")

const medals = ["🥇","🥈","🥉","🏅","🏅","🏅","🏅","🏅","🏅","🏅"]

const MODES = {
 collection:  { label:"📚 Collection",  key:"collection"  },
 wealth:      { label:"💰 Richesse",     key:"wealth"      },
 ssr:         { label:"🌈 SSR",          key:"ssr"         },
 packs:       { label:"📦 Packs",        key:"packs"       },
 achievements:{ label:"🏆 Succès",       key:"achievements"},
 level:       { label:"⭐ Niveau",        key:"level"       },
 guilds:      { label:"🏰 Guildes",      key:"guilds"      }
}

function bar(value, max){

 const size = 10
 const percent = max > 0 ? value / max : 0

 const filled = Math.round(size * percent)
 const empty  = size - filled

 return "█".repeat(filled) + "░".repeat(empty)
}

module.exports = {

 name:"leaderboard",
 description:"Voir les classements",

 async execute(interaction){

  await interaction.deferReply()

  const self = getUser(interaction.user.id)

  if(!self.stats) self.stats = {}
  self.stats.leaderboardViews = (self.stats.leaderboardViews || 0) + 1

  const unlocked = achievementCheck(self, "social")

  const rankings = getLeaderboard()

  let mode = "collection"
  let page = 1
  const perPage = 10

  function build(){

   const data = rankings[mode] || []

   const maxPage = Math.max(1, Math.ceil(data.length / perPage))

   page = Math.max(1, Math.min(page, maxPage))

   const start = (page - 1) * perPage
   const slice = data.slice(start, start + perPage)

   const maxValue = data[0]?.value || 1

   /* ---- Mode guildes : affichage spécial ---- */

   let lines
   let playerLine = "Non classé"

   if(mode === "guilds"){

    lines = slice.map((r, i) => {

     const rank  = start + i + 1
     const medal = medals[i] || `#${rank}`

     return `${medal} ${r.emoji} **${r.name}** — Niv. **${r.value}** (${r.members} mbr)`
    })

    /* Position de la guilde du joueur */
    const userGuildId = self.guildId
    if(userGuildId){
     const guildIndex = data.findIndex(r => r.id === userGuildId)
     if(guildIndex !== -1){
      const g = data[guildIndex]
      playerLine = `#${guildIndex + 1} • ${g.emoji} **${g.name}** — Niv. **${g.value}**`
     } else {
      playerLine = "Ta guilde n'est pas classée"
     }
    } else {
     playerLine = "Pas de guilde"
    }

   } else {

    /* ---- Mode joueurs classique ---- */

    lines = slice.map((r, i) => {

     const rank  = start + i + 1
     const medal = medals[i] || `#${rank}`

     return `${medal} <@${r.id}> — **${r.value}** ${bar(r.value, maxValue)}`
    })

    const playerIndex = data.findIndex(r => String(r.id) === interaction.user.id)

    if(playerIndex !== -1){
     const rank  = playerIndex + 1
     const value = data[playerIndex].value
     playerLine  = `#${rank} • **${value}**`
    }
   }

   const embed = new EmbedBuilder()
    .setTitle(`🏆 Leaderboard — ${MODES[mode].label}`)
    .setDescription(lines.join("\n") || "Aucune donnée")
    .addFields({ name: mode === "guilds" ? "Ta guilde" : "Ta position", value:playerLine })
    .setFooter({ text:`Page ${page}/${maxPage}` })
    .setColor("#f1c40f")

   /* ---- Rangée 1 : collection, wealth, ssr, packs ---- */
   const modeRow1 = new ActionRowBuilder().addComponents(
    ["collection","wealth","ssr","packs"].map(key =>
     new ButtonBuilder()
      .setCustomId(`lb_mode_${key}`)
      .setLabel(MODES[key].label)
      .setStyle(mode === key ? ButtonStyle.Success : ButtonStyle.Secondary)
    )
   )

   /* ---- Rangée 2 : achievements, level, guilds ---- */
   const modeRow2 = new ActionRowBuilder().addComponents(
    ["achievements","level","guilds"].map(key =>
     new ButtonBuilder()
      .setCustomId(`lb_mode_${key}`)
      .setLabel(MODES[key].label)
      .setStyle(mode === key ? ButtonStyle.Success : ButtonStyle.Secondary)
    )
   )

   /* ---- Rangée 3 : navigation page ---- */
   const navRow = new ActionRowBuilder().addComponents(

    new ButtonBuilder()
     .setCustomId("lb_prev")
     .setLabel("⬅️")
     .setStyle(ButtonStyle.Primary)
     .setDisabled(page === 1),

    new ButtonBuilder()
     .setCustomId("lb_next")
     .setLabel("➡️")
     .setStyle(ButtonStyle.Primary)
     .setDisabled(page === maxPage)

   )

   return { embed, components:[modeRow1, modeRow2, navRow] }
  }

  const built = build()

  await interaction.editReply({
   embeds:[built.embed],
   components:built.components
  })

  const msg = await interaction.fetchReply()

  if(unlocked.length)
   await notifyAchievements(interaction, unlocked)

  const collector = msg.createMessageComponentCollector({ time:180000 })

  collector.on("collect", async i => {

   if(i.user.id !== interaction.user.id)
    return i.reply({ content:"Pas ton menu.", flags:64 })

   if(i.customId === "lb_next") page++
   if(i.customId === "lb_prev") page--

   if(i.customId.startsWith("lb_mode_")){
    mode = i.customId.replace("lb_mode_","")
    page = 1
   }

   const built = build()

   await i.update({
    embeds:[built.embed],
    components:built.components
   })

  })

 }

}