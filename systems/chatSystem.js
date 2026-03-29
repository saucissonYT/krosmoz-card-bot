const { getUser, save } = require("./userSystem")
const { achievementCheck } = require("./achievementCheck")
const { notifyAchievementsMessage } = require("./achievementNotifier")

/* ---------------- COOLDOWN ANTI SPAM ---------------- */

const cooldown = new Map()
const COOLDOWN_TIME = 3000 // 3 secondes

/* ---------------- ASTUCES BOT ---------------- */

const tips = [
 "Utilise **/krosmoz** pour ouvrir un pack.",
 "Utilise **/inventaire tri:rarete** pour voir tes meilleures cartes.",
 "Utilise **/carte id:XXX** pour afficher une carte.",
 "Complete des sets pour devenir un **maitre du Krosmoz**.",
 "Les cartes **SSR** sont extremement rares.",
 "Les **SSR shiny** sont presque mythiques.",
 "Utilise le **market** pour vendre tes doublons.",
 "Certaines cartes peuvent etre obtenues uniquement via **fusion**.",
 "Plus tu ouvres de packs sans SSR, plus ton **pity SSR** augmente.",
 "Le **/daily** peut parfois donner une **SSR gratuite**.",
 "Tu peux vendre rapidement tes doublons avec **/sellduplicate**.",
 "Certaines **fusions critiques** donnent des cartes bonus.",
 "Les **UR** sont encore plus rares que les HR.",
 "Completer un set peut debloquer des **succes caches**.",
 "Plus tu joues, plus tu gagnes **d'XP et de titres**.",
 "Utilise **/profil** pour voir ta progression.",
 "Les **packs Lucky** donnent une carte bonus.",
 "Certaines mecaniques secretes declenchent des **succes secrets**.",
 "Le **market** peut t'aider a completer des sets.",
 "Certaines commandes cachent des **interactions secretes**."
]

/* ---------------- TRIGGERS TEXTE ---------------- */

const triggers = {
 pity: "Le **pity SSR** augmente a chaque pack sans SSR.",
 fusion: "Tu peux utiliser **/fusion** pour ameliorer tes doublons.",
 ssr: "Les **SSR** sont les cartes les plus rares.",
 market: "Le **market** permet d'acheter et vendre des cartes.",
 daily: "N'oublie pas ton **/daily** chaque jour !",
 trade: "Utilise **/trade** pour echanger des cartes avec un autre joueur.",
 pack: "Les packs contiennent **5 cartes minimum**.",
 ur: "Les **UR** sont extremement rares.",
 title: "Les succes debloquent des **titres**.",
 xp: "Les actions te donnent de l'**XP**.",
 inventaire: "Ton inventaire montre toutes tes cartes.",
 krosmoz: "La commande principale est **/krosmoz**.",
 fusioncrit: "Une **fusion critique** donne plus de cartes.",
 shiny: "Les **SSR shiny** sont incroyablement rares."
}

/* ---------------- BOT CHAT HANDLER ---------------- */

async function handleMessage(message, client) {
 if (message.author.bot) return
 if (!message.mentions.has(client.user)) return

 const now = Date.now()
 const last = cooldown.get(message.author.id)
 if (last && now - last < COOLDOWN_TIME) return
 cooldown.set(message.author.id, now)

 const user = getUser(message.author.id)
 if (!user.stats) user.stats = {}
 if (user.stats.botMentions === undefined) user.stats.botMentions = 0
 user.stats.botMentions++

 const content = message.content.toLowerCase()
 let replyText = null

 for (const word in triggers) {
  if (content.includes(word)) {
   replyText = triggers[word]
   break
  }
 }

 if (!replyText) {
  replyText = tips[Math.floor(Math.random() * tips.length)]
 }

 await message.reply(`💡 **Astuce**\n\n${replyText}`)

 const mentionsInMessage = (message.content.match(/<@/g) || []).length
 if (mentionsInMessage >= 3) user.stats.mentionSpam = true

 const hour = new Date().getHours()
 if (hour >= 2 && hour <= 5) user.stats.nightPing = true

 const totalCards = Object.values(user.cards || {}).reduce((a, b) => a + b, 0)
 if (totalCards === 666) user.stats.devilPing = true

 if (user.stats.lastSSR) {
  user.stats.auraFarm = true
  user.stats.lastSSR = false
 }

 const unlocked = achievementCheck(user, "social")

 save(message.author.id)

 if (unlocked.length) {
  await notifyAchievementsMessage(message, unlocked, user)
  save(message.author.id)
 }
}

module.exports = {
 handleMessage
}
