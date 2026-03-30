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

/* ─── Résolution complète réaction + message ─────────────────── */

async function resolveReaction(reaction) {
  if (reaction.partial) {
    try { await reaction.fetch() } catch { return null }
  }
  if (reaction.message.partial) {
    try { await reaction.message.fetch() } catch { return null }
  }
  return reaction
}

/* ─── Recherche du message du bot dans l'historique du canal ──── */

async function findBotMessageInChannel(channel, botId) {
  try {
    // Récupère les 50 derniers messages du canal
    const messages = await channel.messages.fetch({ limit: 50 })
    const botMsg = messages.find(m => m.author.id === botId)
    if (botMsg) {
      console.log(`[reactionRoles] Message du bot trouvé dans l'historique (id: ${botMsg.id})`)
      return botMsg
    }
  } catch (err) {
    console.warn("[reactionRoles] Impossible de scanner l'historique :", err.message)
  }
  return null
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

    /* 1) Si un message ID est déjà stocké → on tente de le récupérer */
    if (data.welcomeMessageId) {
      try {
        const existing = await channel.messages.fetch(data.welcomeMessageId)

        /* Message trouvé → on s'assure juste que la réaction est là */
        if (!existing.reactions.cache.get(EMOJI)) {
          await existing.react(EMOJI)
        }

        console.log("[reactionRoles] Message de bienvenue déjà présent (via ID stocké), aucun envoi.")
        return data.welcomeMessageId

      } catch (err) {
        /*
         * Code 10008 = Unknown Message (message supprimé) → on cherche dans l'historique.
         * Toute autre erreur (réseau, permissions...) → on ne touche à rien.
         */
        if (err.code !== 10008) {
          console.warn("[reactionRoles] Impossible de vérifier le message existant, on ne renvoie pas :", err.message)
          return null
        }

        console.warn("[reactionRoles] ID stocké invalide (message supprimé ?), scan de l'historique...")
      }
    }

    /* 2) Pas d'ID stocké (ou ID invalide) → on scanne l'historique du canal */
    const found = await findBotMessageInChannel(channel, client.user.id)

    if (found) {
      /* Message du bot trouvé dans le canal → on le réutilise */
      if (!found.reactions.cache.get(EMOJI)) {
        await found.react(EMOJI)
      }

      data.welcomeMessageId = found.id
      saveData(data)

      console.log(`[reactionRoles] Message existant récupéré et ID sauvegardé (id: ${found.id})`)
      return found.id
    }

    /* 3) Aucun message trouvé nulle part → on en envoie un nouveau */
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

      reaction = await resolveReaction(reaction)
      if (!reaction) return

      const data = loadData()
      if (reaction.message.id !== data.welcomeMessageId) return
      if (reaction.emoji.name !== EMOJI) return

      const guild = reaction.message.guild
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

      reaction = await resolveReaction(reaction)
      if (!reaction) return

      const data = loadData()
      if (reaction.message.id !== data.welcomeMessageId) return
      if (reaction.emoji.name !== EMOJI) return

      const guild = reaction.message.guild
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