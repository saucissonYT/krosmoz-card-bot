const {
 EmbedBuilder,
 ActionRowBuilder,
 ButtonBuilder,
 ButtonStyle
} = require("discord.js")

const setsData = require("../../cards/sets.json")
const { getUser, save } = require("../../systems/userSystem")
const { sortSetsByDisplayOrder } = require("../../systems/setOrder")

const sets = sortSetsByDisplayOrder(Array.isArray(setsData) ? setsData : setsData.sets)

const PER_PAGE = 3

function progressBar(value, max){
 const safe = value ?? 0
 const filled = Math.floor((safe / max) * 10)
 const empty = 10 - filled
 return "🟩".repeat(filled) + "⬛".repeat(empty)
}

/* ---------- SSR RATE ---------- */

function getSSRRate(pity){
 if(pity < 20) return 0.0005
 if(pity < 30) return 0.001
 if(pity < 35) return 0.003
 if(pity < 40) return 0.005
 if(pity < 43) return 0.01
 if(pity < 46) return 0.02
 if(pity < 49) return 0.05
 return 0.05
}

/* ---------- S RATE ---------- */

function getSRate(pity){
 if(pity < 15) return 0.0015
 if(pity < 20) return 0.003
 if(pity < 25) return 0.006
 if(pity < 28) return 0.012
 if(pity < 29) return 0.03
 return 0.03
}

function formatPercent(rate){
 return (rate * 100).toFixed(rate < 0.01 ? 2 : 1) + "%"
}

/* ---------- BUILD PAGE ---------- */

function buildPage(user, page){

 const totalPages = Math.max(1, Math.ceil(sets.length / PER_PAGE))
 page = Math.max(1, Math.min(page, totalPages))

 const start = (page - 1) * PER_PAGE
 const slice = sets.slice(start, start + PER_PAGE)

 const lines = []

 for(const set of slice){

  if(!user.pity[set.id])
   user.pity[set.id] = { UR:0, S:0, SSR:0 }

  const pity = user.pity[set.id]

  if(pity.UR === undefined) pity.UR = 0
  if(pity.S === undefined) pity.S = 0
  if(pity.SSR === undefined) pity.SSR = 0

  const ur = pity.UR
  const s = pity.S
  const ssr = pity.SSR

  const sRate = formatPercent(getSRate(s))
  const ssrRate = formatPercent(getSSRRate(ssr))

  lines.push(
`**${set.name}**

🟡 UR : ${ur}/10
${progressBar(ur, 10)}

✨ S : ${s}/30 (**${sRate}**)
${progressBar(s, 30)}

🌈 SSR : ${ssr}/50 (**${ssrRate}**)
${progressBar(ssr, 50)}`
  )

 }

 const embed = new EmbedBuilder()
  .setTitle("🎴 Pity")
  .setDescription(lines.join("\n\n"))
  .setFooter({ text:`Page ${page}/${totalPages} • ${sets.length} sets` })
  .setColor("#f1c40f")

 const row = new ActionRowBuilder().addComponents(

  new ButtonBuilder()
   .setCustomId("pity_prev")
   .setLabel("◀")
   .setStyle(ButtonStyle.Secondary)
   .setDisabled(page <= 1),

  new ButtonBuilder()
   .setCustomId("pity_page")
   .setLabel(`${page}/${totalPages}`)
   .setStyle(ButtonStyle.Primary)
   .setDisabled(true),

  new ButtonBuilder()
   .setCustomId("pity_next")
   .setLabel("▶")
   .setStyle(ButtonStyle.Secondary)
   .setDisabled(page >= totalPages)

 )

 return { embed, row, totalPages }

}

/* ---------- COMMAND ---------- */

module.exports = {

 name:"pity",
 description:"Voir tes pity par set",

 async execute(interaction){

  const user = getUser(interaction.user.id)

  if(!user.pity)
   user.pity = {}

  let page = 1

  const { embed, row } = buildPage(user, page)

  save()

  const msg = await interaction.reply({
   embeds:[embed],
   components:[row],
   fetchReply:true
  })

  const collector = msg.createMessageComponentCollector({
   time:120000
  })

  collector.on("collect", async i => {

   if(i.user.id !== interaction.user.id)
    return i.reply({ content:"Pas ta pity.", flags:64 })

   if(i.customId === "pity_next") page++
   if(i.customId === "pity_prev") page--

   const { embed, row } = buildPage(user, page)

   await i.update({
    embeds:[embed],
    components:[row]
   })

  })

 }

}
