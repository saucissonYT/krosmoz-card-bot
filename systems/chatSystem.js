const { getUser, save } = require("./userSystem")
const { giveAchievement } = require("./achievementSystem")

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
"Plus tu ouvres de packs, plus ton **pity SSR** augmente.",
"Le **daily** peut parfois donner une **SSR gratuite**."

]

/* ---------------- TRIGGERS TEXTE ---------------- */

const triggers={

pity:"Le **pity SSR** augmente à chaque pack sans SSR.",
fusion:"Tu peux utiliser **/fusion** pour améliorer tes doublons.",
ssr:"Les **SSR 🌈** sont les cartes les plus rares.",
market:"Le **market** permet d'acheter et vendre des cartes.",
daily:"N'oublie pas ton **/daily** chaque jour !"

}

/* ---------------- BOT CHAT HANDLER ---------------- */

async function handleMessage(message,client){

 if(message.author.bot) return

 /* fonctionne UNIQUEMENT si le bot est mentionné */

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

 /* ---------------- ASTUCE RANDOM SI PAS TRIGGER ---------------- */

 if(!replyText)
  replyText=tips[Math.floor(Math.random()*tips.length)]

 await message.reply(`💡 **Astuce**

${replyText}`)

 /* ---------------- ACHIEVEMENTS MENTIONS ---------------- */

 const mentions=user.stats.botMentions

 if(mentions>=1) giveAchievement(user,"mention1")
 if(mentions>=10) giveAchievement(user,"mention10")
 if(mentions>=100) giveAchievement(user,"mention100")
 if(mentions>=500) giveAchievement(user,"mention500")
 if(mentions>=1000) giveAchievement(user,"mention1000")

 /* ---------------- SPAM MENTION ---------------- */

 const mentionsInMessage=(message.content.match(/<@/g)||[]).length

 if(mentionsInMessage>=3)
  giveAchievement(user,"mentionSpam")

 /* ---------------- NOCTAMBULE ---------------- */

 const hour=new Date().getHours()

 if(hour>=2 && hour<=5)
  giveAchievement(user,"nightPing")

 /* ---------------- 666 CARTES ---------------- */

 const totalCards=Object.values(user.cards||{}).reduce((a,b)=>a+b,0)

 if(totalCards===666)
  giveAchievement(user,"devilPing")

 /* ---------------- AURA FARM ---------------- */

 if(user.stats.lastSSR){

  giveAchievement(user,"auraFarm")
  user.stats.lastSSR=false

 }

 save()

}

module.exports={
 handleMessage
}