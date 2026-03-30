const fs   = require("fs")
const path = require("path")

/* ─── Config ─────────────────────────────────────────────────── */

const WELCOME_CHANNEL_ID = "1487547030271164528"
const ROLE_ID            = "1487095661806620912"
const EMOJI              = "✅"

const DATA_PATH = path.join(__dirname, "../../data/reactionRoles.json")

/* ─── Persistance de l'ID du message de bienvenue ────────────── */

function loadData() {
 try {
  if (fs.existsSync(DATA_PATH)) {
   return JSON.parse(fs.readFileSync(DATA_PATH, "utf8"))
  }
 } catch (err) {
  console.error("[reactionRoles] Erreur lecture data :", err.message)
 }
 return {}
}

function saveData(data) {
 try {
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), "utf8")
 } catch (err) {
  console.error("[reactionRoles] Erreur écriture data :", err.message)
 }
}

/* ─── Envoi / récupération du message de bienvenue ───────────── */

async function ensureWelcomeMessage(client) {
 const data = loadData()

 try {
  const channel = await client.channels.fetch(WELCOME_CHANNEL_ID)

  if (!channel || !channel.isTextBased()) {
   console.warn("[reactionRoles] Salon introuvable ou non textuel.")
   return null
  }

  /* Si un message ID est déjà stocké, on vérifie qu'il existe encore */
  if (data.welcomeMessageId) {
   try {
    const existing = await channel.messages.fetch(data.welcomeMessageId)
    if (existing) {
     console.log("[reactionRoles] Message de bienvenue déjà présent.")

     /* S'assurer que la réaction ✅ du bot est bien là */
     if (!existing.reactions.cache.get(EMOJI)) {
      await existing.react(EMOJI)
     }

     return data.welcomeMessageId
    }
   } catch {
    /* Message supprimé → on en envoie un nouveau */
   }
  }

  /* Envoi du message de bienvenue */
  const msg = await channel.send(
   "Bienvenue, une fois que tu as lu le règlement, tu peux prendre ton rôle en ajoutant une réaction ✅ et commencer ton aventure !"
  )

  await msg.react(EMOJI)

  data.welcomeMessageId = msg.id
  saveData(data)

  console.log(`[reactionRoles] Message de bienvenue envoyé (id: ${msg.id})`)
  return msg.id

 } catch (err) {
  console.error("[reactionRoles] Erreur ensureWelcomeMessage :", err.message)
  return null
 }
}

/* ─── Enregistrement des handlers ────────────────────────────── */

function registerReactionRolesHandler(client) {

 client.once("clientReady", async () => {
  await ensureWelcomeMessage(client)
 })

 /* ── Ajout de réaction → donne le rôle ── */
 client.on("messageReactionAdd", async (reaction, user) => {
  try {
   if (user.bot) return

   /* Résolution partielle si message non en cache */
   if (reaction.partial) {
    try { await reaction.fetch() } catch { return }
   }

   const data = loadData()
   if (reaction.message.id !== data.welcomeMessageId) return
   if (reaction.emoji.name !== EMOJI) return

   const guild  = reaction.message.guild
   if (!guild) return

   const member = await guild.members.fetch(user.id).catch(() => null)
   if (!member) return

   await member.roles.add(ROLE_ID)
   console.log(`[reactionRoles] Rôle donné à ${user.tag}`)

  } catch (err) {
   console.error("[reactionRoles] Erreur messageReactionAdd :", err.message)
  }
 })

 /* ── Retrait de réaction → retire le rôle ── */
 client.on("messageReactionRemove", async (reaction, user) => {
  try {
   if (user.bot) return

   if (reaction.partial) {
    try { await reaction.fetch() } catch { return }
   }

   const data = loadData()
   if (reaction.message.id !== data.welcomeMessageId) return
   if (reaction.emoji.name !== EMOJI) return

   const guild  = reaction.message.guild
   if (!guild) return

   const member = await guild.members.fetch(user.id).catch(() => null)
   if (!member) return

   await member.roles.remove(ROLE_ID)
   console.log(`[reactionRoles] Rôle retiré à ${user.tag}`)

  } catch (err) {
   console.error("[reactionRoles] Erreur messageReactionRemove :", err.message)
  }
 })

}

module.exports = {
 registerReactionRolesHandler
}