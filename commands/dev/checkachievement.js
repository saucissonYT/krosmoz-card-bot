const { SlashCommandBuilder } = require("discord.js")

const achievements = require("../../systems/achievementRegistry")
const { getUser } = require("../../systems/userSystem")

/* ── Mapping trigger → label lisible ── */
const TRIGGER_LABELS = {
 pack:        "📦 Packs",
 rng:         "🎲 RNG",
 economy:     "💰 Économie",
 collection:  "📚 Collection",
 fusion:      "⚗️ Fusion",
 social:      "💬 Social",
 inventory:   "🎒 Inventaire",
 daily:       "🎁 Daily",
 krosmoshop:  "🛒 KrosmoShop",
 event:       "🎪 Events",
 fragment:    "🧩 Fragments",
 roulette:    "🎡 Roulette",
 progression: "⭐ Progression",
 secret:      "🔒 Secrets",
 none:        "❓ Sans trigger",
}

module.exports = {

 data: new SlashCommandBuilder()
  .setName("checkachievement")
  .setDescription("DEV : audit complet des achievements avec breakdown par catégorie"),

 async execute(interaction) {

  const user = getUser(interaction.user.id)

  const all     = Object.entries(achievements)
  const total   = all.length

  /* ── Compteurs globaux ── */
  let available = 0
  let owned     = 0
  let locked    = 0
  let errors    = 0

  /* ── Breakdown par trigger ── */
  const byTrigger = {}

  /* ── Secrets ── */
  let secretTotal     = 0
  let secretAvailable = 0
  let secretOwned     = 0

  console.log("===================================")
  console.log("ACHIEVEMENT SYSTEM AUDIT")
  console.log(`User : ${interaction.user.username}`)
  console.log(`Total achievements chargés : ${total}`)
  console.log("===================================\n")

  for (const [id, data] of all) {

   const trigger = data.trigger || "none"
   const isSecret = Boolean(data.secret)

   if (!byTrigger[trigger]) {
    byTrigger[trigger] = { total: 0, available: 0, owned: 0, locked: 0, errors: 0, secrets: 0 }
   }

   byTrigger[trigger].total++
   if (isSecret) {
    byTrigger[trigger].secrets++
    secretTotal++
   }

   const already = user.achievements?.includes(id)

   try {
    if (typeof data.condition !== "function") {
     byTrigger[trigger].errors++
     errors++
     continue
    }

    const result = data.condition(user)

    if (result && !already) {
     byTrigger[trigger].available++
     available++
     if (isSecret) secretAvailable++
    } else if (result && already) {
     byTrigger[trigger].owned++
     owned++
     if (isSecret) secretOwned++
    } else {
     byTrigger[trigger].locked++
     locked++
    }

   } catch (err) {
    console.error(`💥 ERREUR sur [${id}] :`, err.message)
    byTrigger[trigger].errors++
    errors++
   }

  }

  /* ── Affichage par catégorie ── */
  console.log("===== BREAKDOWN PAR CATÉGORIE =====\n")

  const sortedTriggers = Object.entries(byTrigger)
   .sort((a, b) => b[1].total - a[1].total)

  for (const [trigger, stats] of sortedTriggers) {
   const label  = TRIGGER_LABELS[trigger] || `🔷 ${trigger}`
   const secretNote = stats.secrets > 0 ? ` (dont ${stats.secrets} secrets)` : ""

   console.log(`${label}`)
   console.log(`  Total      : ${stats.total}${secretNote}`)
   console.log(`  🔵 Obtenus : ${stats.owned}`)
   console.log(`  🟢 Dispo   : ${stats.available}`)
   console.log(`  🔴 Bloqués : ${stats.locked}`)
   if (stats.errors > 0)
    console.log(`  💥 Erreurs : ${stats.errors}`)
   console.log("")
  }

  /* ── Récap global ── */
  console.log("===== RÉCAP GLOBAL =====")
  console.log(`Total achievements : ${total}`)
  console.log(`  🔵 Déjà obtenus  : ${owned}`)
  console.log(`  🟢 Disponibles   : ${available}`)
  console.log(`  🔴 Bloqués       : ${locked}`)
  console.log(`  💥 Erreurs       : ${errors}`)
  console.log("")
  console.log(`🔒 Secrets         : ${secretTotal} total (${secretOwned} obtenus, ${secretAvailable} disponibles)`)
  console.log("========================\n")

  /* ── Tableau récap trié (plus lisible) ── */
  console.log("===== TABLEAU RÉSUMÉ =====")
  console.log("Catégorie".padEnd(22) + "Total".padStart(6) + "Obtenu".padStart(8) + "Dispo".padStart(7) + "Bloqué".padStart(8))
  console.log("-".repeat(51))
  for (const [trigger, stats] of sortedTriggers) {
   const label = (TRIGGER_LABELS[trigger] || trigger).replace(/^\S+\s/, "").slice(0, 20)
   console.log(
    label.padEnd(22) +
    String(stats.total).padStart(6) +
    String(stats.owned).padStart(8) +
    String(stats.available).padStart(7) +
    String(stats.locked).padStart(8)
   )
  }
  console.log("-".repeat(51))
  console.log(
   "TOTAL".padEnd(22) +
   String(total).padStart(6) +
   String(owned).padStart(8) +
   String(available).padStart(7) +
   String(locked).padStart(8)
  )
  console.log("==========================")

  await interaction.reply({
   content: `✅ Audit terminé — **${total} achievements** au total.\nRésultats complets dans la console.`,
   ephemeral: true
  })

 }

}