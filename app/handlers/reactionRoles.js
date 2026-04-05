/* ═══════════════════════════════════════════════════════════════
   REACTION ROLES — app/handlers/reactionRoles.js

   Gère l'attribution automatique d'un rôle Discord via réaction
   emoji sur un message de bienvenue dans un salon dédié.

   MODIFICATIONS :
   - Supprimé les `console.log/warn/error` bruts (× 10)
     → utilise `createLogger("REACTION_ROLES")` depuis logger.js
   - Supprimé `fs.readFileSync/writeFileSync` manuels
     → utilise `readJsonSafe` / `writeAtomic` depuis fileUtils.js
   - Ajout de JSDoc sur toutes les fonctions
   - Logique et UX 100% inchangées
═══════════════════════════════════════════════════════════════ */

const path = require("path")

const { createLogger }              = require("../../systems/logger")
const { readJsonSafe, writeAtomic } = require("../../systems/fileUtils")

const log = createLogger("REACTION_ROLES")

/* ─── Config ─────────────────────────────────────────────────── */

const WELCOME_CHANNEL_ID = "1487547030271164528"
const ROLE_ID            = "1487095661806620912"
const EMOJI              = "✅"

const DATA_PATH = path.join(__dirname, "../../data/reactionRoles.json")

/* ─── Persistance ────────────────────────────────────────────── */

/**
 * Charge les données de reaction roles (welcomeMessageId, etc.).
 * @returns {Object} Données parsées ou objet vide
 */
function loadData() {
 return readJsonSafe(DATA_PATH, {})
}

/**
 * Sauvegarde les données de reaction roles.
 * @param {Object} data - Données à sauvegarder
 */
function saveData(data) {
 try {
  writeAtomic(DATA_PATH, data)
 } catch (err) {
  log.error("Erreur écriture data", { err })
 }
}

/* ─── Résolution complète réaction + message ─────────────────── */

/**
 * Résout les partials d'une réaction et de son message.
 * @param {import("discord.js").MessageReaction} reaction
 * @returns {Promise<import("discord.js").MessageReaction|null>}
 */
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

/**
 * Scanne les 50 derniers messages d'un canal pour trouver un message du bot.
 * @param {import("discord.js").TextChannel} channel
 * @param {string} botId - ID du bot
 * @returns {Promise<import("discord.js").Message|null>}
 */
async function findBotMessageInChannel(channel, botId) {
 try {
  const messages = await channel.messages.fetch({ limit: 50 })
  const botMsg   = messages.find(m => m.author.id === botId)

  if (botMsg) {
   log.info("Message du bot trouvé dans l'historique", { id: botMsg.id })
   return botMsg
  }
 } catch (err) {
  log.warn("Impossible de scanner l'historique", { err })
 }
 return null
}

/* ─── Envoi / récupération du message de bienvenue ───────────── */

/**
 * S'assure qu'un message de bienvenue existe dans le salon configuré.
 * Logique :
 *   1. Si un ID est stocké → on tente de le récupérer
 *   2. Sinon, on scanne l'historique du canal
 *   3. En dernier recours, on envoie un nouveau message
 *
 * @param {import("discord.js").Client} client
 * @returns {Promise<string|null>} L'ID du message de bienvenue
 */
async function ensureWelcomeMessage(client) {

 const data = loadData()

 try {
  const channel = await client.channels.fetch(WELCOME_CHANNEL_ID)

  if (!channel || !channel.isTextBased()) {
   log.warn("Salon introuvable ou non textuel")
   return null
  }

  /* 1) Si un message ID est déjà stocké → on tente de le récupérer */
  if (data.welcomeMessageId) {
   try {
    const existing = await channel.messages.fetch(data.welcomeMessageId)

    if (!existing.reactions.cache.get(EMOJI)) {
     await existing.react(EMOJI)
    }

    log.info("Message de bienvenue déjà présent (via ID stocké)")
    return data.welcomeMessageId

   } catch (err) {
    /*
     * Code 10008 = Unknown Message (message supprimé) → on cherche dans l'historique.
     * Toute autre erreur (réseau, permissions...) → on ne touche à rien.
     */
    if (err.code !== 10008) {
     log.warn("Impossible de vérifier le message existant", { err })
     return null
    }

    log.warn("ID stocké invalide (message supprimé ?), scan de l'historique...")
   }
  }

  /* 2) Pas d'ID stocké (ou ID invalide) → on scanne l'historique du canal */
  const found = await findBotMessageInChannel(channel, client.user.id)

  if (found) {
   if (!found.reactions.cache.get(EMOJI)) {
    await found.react(EMOJI)
   }

   data.welcomeMessageId = found.id
   saveData(data)

   log.info("Message existant récupéré et ID sauvegardé", { id: found.id })
   return found.id
  }

  /* 3) Aucun message trouvé nulle part → on en envoie un nouveau */
  const msg = await channel.send(
   "Bienvenue, une fois que tu as lu le règlement, tu peux prendre ton rôle en ajoutant une réaction ✅ et commencer ton aventure !"
  )

  await msg.react(EMOJI)

  data.welcomeMessageId = msg.id
  saveData(data)

  log.info("Message de bienvenue envoyé", { id: msg.id })
  return msg.id

 } catch (err) {
  log.error("Erreur ensureWelcomeMessage", { err })
  return null
 }
}

/* ─── Enregistrement des handlers ────────────────────────────── */

/**
 * Enregistre les handlers de réaction sur le client Discord.
 * - `clientReady` → s'assure que le message de bienvenue existe
 * - `messageReactionAdd` → donne le rôle
 * - `messageReactionRemove` → retire le rôle
 *
 * @param {import("discord.js").Client} client
 */
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
   log.info("Rôle donné", { user: user.tag })

  } catch (err) {
   log.error("Erreur messageReactionAdd", { err })
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
   log.info("Rôle retiré", { user: user.tag })

  } catch (err) {
   log.error("Erreur messageReactionRemove", { err })
  }
 })
}

module.exports = {
 registerReactionRolesHandler
}