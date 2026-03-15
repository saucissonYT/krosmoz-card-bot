const { getUser, save } = require("./userSystem")
const { giveAchievement, notifyAchievement } = require("./achievementSystem")

/* ---------------- ASTUCES BOT ---------------- */

const tips=[

"Utilise **/krosmoz** pour ouvrir un pack.",
"Utilise **/inventaire tri:rareté** pour voir tes meilleures cartes.",
"Utilise **/carte id:XXX** pour afficher une carte.",
"Complète des sets pour devenir un **maître du Krosmoz**.",
"Les cartes **SSR 🌈** sont extrêmement rares.",
"Les **SSR shiny ✨** sont presque mythiques.",
"Utilise le **market** pour vendre tes doublons.",
"Certaines cartes peuvent être obtenues uniquement via **fusion**.",
"Plus tu ouvres de packs sans SSR, plus ton **pity SSR** augmente.",
"Le **/daily** peut parfois donner une **SSR gratuite**.",
"Tu peux vendre rapidement tes doublons avec **/sellduplicate**.",
"Certaines **fusions critiques 🔥** donnent des cartes bonus.",
"Les **UR 🟡** sont encore plus rares que les HR.",
"Compléter un set peut débloquer des **succès cachés**.",
"Plus tu joues, plus tu gagnes **d'XP et de titres**.",
"Utilise **/profil** pour voir ta progression.",
"Les **packs Lucky 🎁** donnent une carte bonus.",
"Certaines mécaniques secrètes déclenchent des **succès secrets**.",
"Le **market** peut t'aider à compléter des sets.",
"Certaines commandes cachent des **interactions secrètes**."

]

/* ---------------- TRIGGERS TEXTE ---------------- */

const triggers={

pity:"Le **pity SSR** augmente à chaque pack sans SSR.",
fusion:"Tu peux utiliser **/fusion** pour améliorer tes doublons.",
ssr:"Les **SSR 🌈** sont les cartes les plus rares.",
market:"Le **market** permet d'acheter et vendre des cartes.",
daily:"N'oublie pas ton **/daily** chaque jour !",
trade:"Utilise **/trade** pour échanger des cartes avec un autre joueur.",
pack:"Les packs contiennent **5 cartes minimum**.",
ur:"Les **UR 🟡** sont extrêmement rares.",
title:"Les succès débloquent des **titres**.",
xp:"Les actions te donnent de l'**XP**.",
inventaire:"Ton inventaire montre toutes tes cartes.",
krosmoz:"La commande principale est **/krosmoz**.",
fusioncrit:"Une **fusion critique 🔥** donne plus de cartes.",
shiny:"Les **SSR shiny ✨** sont incroyablement rares."

}

/* ---------------- BOT CHAT HANDLER ---------------- */

async function handleMessage(message,client){

 if(message.author.bot) return

 if(!message.mentions.has(client.user)) return

 const user=getUser(message.author.id)

 if(!user.stats) user.stats={}

 if(user.stats.botMentions===undefined)
  user.stats.botMentions=0

 user.stats.botMentions++

 const content=message.content.toLowerCase()

 let replyText=null

 /* ---------------- TRIGGERS ---------------- */

 for(const word in triggers){

  if(content.includes(word)){

   replyText=triggers[word]
   break

  }

 }

 /* ---------------- ASTUCE RANDOM ---------------- */

 if(!replyText)
  replyText=tips[Math.floor(Math.random()*tips.length)]

 await message.reply(`💡 **Astuce**

${replyText}`)

 /* ---------------- ACHIEVEMENT UTILITY ---------------- */

 async function giveAndNotify(id,reason){

  const gained=giveAchievement(user,id)

  if(!gained) return

  const text=`🏆 **Succès débloqué**

${reason}`

  await message.reply(text)

  await notifyAchievement(message,id)

 }

 /* ---------------- MENTIONS ---------------- */

 const mentions=user.stats.botMentions

 if(mentions===1)
  await giveAndNotify("mention1","Tu as mentionné **Krosmoz Card Bot** pour la première fois.")

 if(mentions===10)
  await giveAndNotify("mention10","Tu as mentionné **Krosmoz Card Bot 10 fois**.")

 if(mentions===100)
  await giveAndNotify("mention100","Tu as mentionné **Krosmoz Card Bot 100 fois**.")

 if(mentions===500)
  await giveAndNotify("mention500","Tu as mentionné **Krosmoz Card Bot 500 fois**.")

 if(mentions===1000)
  await giveAndNotify("mention1000","Tu as mentionné **Krosmoz Card Bot 1000 fois**.")

 /* ---------------- SPAM MENTION ---------------- */

 const mentionsInMessage=(message.content.match(/<@/g)||[]).length

 if(mentionsInMessage>=3)
  await giveAndNotify("mentionSpam","Tu as mentionné plusieurs fois le bot dans un seul message.")

 /* ---------------- NOCTAMBULE ---------------- */

 const hour=new Date().getHours()

 if(hour>=2 && hour<=5)
  await giveAndNotify("nightPing","Tu as parlé au bot **entre 2h et 5h du matin**.")

 /* ---------------- 666 CARTES ---------------- */

 const totalCards=Object.values(user.cards||{}).reduce((a,b)=>a+b,0)

 if(totalCards===666)
  await giveAndNotify("devilPing","Tu possèdes **666 cartes**.")

 /* ---------------- AURA FARM ---------------- */

 if(user.stats.lastSSR){

  await giveAndNotify("auraFarm","Tu viens d'obtenir une **SSR récemment**.")
  user.stats.lastSSR=false

 }

 save()

}

module.exports={
 handleMessage
}