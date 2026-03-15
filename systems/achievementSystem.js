const { EmbedBuilder } = require("discord.js")
const { addXP } = require("./progressionSystem")

const achievements={

/* COLLECTION */

cards10:{name:"Apprenti collectionneur",badge:"🃏",title:"Apprenti",reason:"Posséder 10 cartes"},
cards50:{name:"Collectionneur",badge:"🎴",title:"Collectionneur",reason:"Posséder 50 cartes"},
cards100:{name:"Grand collectionneur",badge:"📚",title:"Archiviste",reason:"Posséder 100 cartes"},
cards500:{name:"Bibliothèque vivante",badge:"🏛",title:"Archiviste Suprême",reason:"Posséder 500 cartes"},
cards1000:{name:"Maître du Krosmoz",badge:"👑",title:"Maître du Krosmoz",reason:"Posséder 1000 cartes"},

/* SET */

completeSet:{name:"Complétionniste",badge:"🏆",title:"Complétionniste",reason:"Compléter un set entier"},

/* LEVEL */

level5:{name:"Premiers pas",badge:"⭐",title:"Aventurier",reason:"Atteindre le niveau 5"},
level10:{name:"Aventurier",badge:"⭐",title:"Explorateur",reason:"Atteindre le niveau 10"},
level20:{name:"Vétéran",badge:"🌟",title:"Vétéran",reason:"Atteindre le niveau 20"},
level30:{name:"Champion",badge:"🏅",title:"Champion",reason:"Atteindre le niveau 30"},
level50:{name:"Maître du Krosmoz",badge:"👑",title:"Maître du Krosmoz",reason:"Atteindre le niveau 50"},

/* VENTES */

sell1:{name:"Premier commerce",badge:"💰",title:"Marchand",reason:"Vendre une carte"},
sell50:{name:"Petit marchand",badge:"🪙",title:"Marchand",reason:"Vendre 50 cartes"},
sell100:{name:"Grand marchand",badge:"💰",title:"Grand Marchand",reason:"Vendre 100 cartes"},
sell500:{name:"Tycoon",badge:"💎",title:"Tycoon",reason:"Vendre 500 cartes"},
sell1000:{name:"Empereur du commerce",badge:"🏦",title:"Empereur marchand",reason:"Vendre 1000 cartes"},

/* PACKS OUVERTS */

packs1:{name:"Premier pack ouvert",badge:"📦",title:"Curieux",reason:"Ouvrir 1 pack"},
packs10:{name:"10 packs ouverts",badge:"📦",title:"Explorateur",reason:"Ouvrir 10 packs"},
packs50:{name:"50 packs ouverts",badge:"📦",title:"Chasseur de cartes",reason:"Ouvrir 50 packs"},
packs200:{name:"200 packs ouverts",badge:"📦",title:"Collectionneur acharné",reason:"Ouvrir 200 packs"},
packs500:{name:"500 packs ouverts",badge:"📦",title:"Maître des packs",reason:"Ouvrir 500 packs"},
packs1000:{name:"1000 packs ouverts",badge:"📦",title:"Seigneur des packs",reason:"Ouvrir 1000 packs"},

/* PACKS ACHETÉS */

buy1:{name:"Premier pack acheté",badge:"🎁",title:"Client",reason:"Acheter 1 pack"},
buy10:{name:"10 packs achetés",badge:"🛒",title:"Acheteur",reason:"Acheter 10 packs"},
buy50:{name:"50 packs achetés",badge:"💰",title:"Investisseur",reason:"Acheter 50 packs"},
buy200:{name:"200 packs achetés",badge:"💎",title:"Magnat",reason:"Acheter 200 packs"},

/* SSR */

lucky:{name:"Chanceux",badge:"🍀",title:"Chanceux",reason:"Obtenir une SSR"},
doubleSSR:{name:"Double SSR !",badge:"🌈",title:"Double chance",reason:"Obtenir deux SSR dans un pack"},
ultraLucky:{name:"Ultra chanceux",badge:"🌟",title:"Élu du destin",reason:"Obtenir 10 SSR"},

/* SSR SHINY */

shinySSR:{name:"Miracle du Krosmoz",badge:"✨",title:"Élu du Krosmoz",secret:true,reason:"Obtenir une SSR shiny"},

/* FUSION */

fusion10:{name:"Apprenti alchimiste",badge:"⚗",title:"Apprenti alchimiste",reason:"Faire 10 fusions"},
fusion50:{name:"Alchimiste",badge:"🧪",title:"Alchimiste",reason:"Faire 50 fusions"},
fusion200:{name:"Grand alchimiste",badge:"🔮",title:"Grand alchimiste",reason:"Faire 200 fusions"},

/* FUSION CRITIQUE */

fusionCrit:{name:"Fusion critique",badge:"🔥",title:"Instable",reason:"Faire une fusion critique"},
fusionCrit10:{name:"10 fusions critiques",badge:"🔥",title:"Maître instable",reason:"Faire 10 fusions critiques"},
fusionCrit100:{name:"100 fusions critiques",badge:"🔥",title:"Dieu de la fusion",reason:"Faire 100 fusions critiques"},

/* FUSION DOUBLE */

fusionDouble:{name:"Fusion double",badge:"✨",title:"Duplication",reason:"Faire une fusion double"},
fusionDouble10:{name:"10 fusions doubles",badge:"✨",title:"Duplicateur",reason:"Faire 10 fusions doubles"},
fusionDouble100:{name:"100 fusions doubles",badge:"✨",title:"Roi de la duplication",reason:"Faire 100 fusions doubles"},

/* DAILY */

assidu:{name:"Assidu",badge:"🔥",title:"Assidu",reason:"Faire plusieurs daily consécutifs"},

daily30:{name:"Habitué du Daily",badge:"📅",title:"Habitué",reason:"30 daily claims"},
daily60:{name:"Régulier du Daily",badge:"🗓",title:"Régulier",reason:"60 daily claims"},
daily120:{name:"Dévoué au Daily",badge:"💠",title:"Dévoué",reason:"120 daily claims"},
daily200:{name:"Fidèle au Daily",badge:"🛡",title:"Fidèle",reason:"200 daily claims"},
daily300:{name:"Vétéran du Daily",badge:"🏆",title:"Vétéran du Daily",reason:"300 daily claims"},
daily365:{name:"Pilier du Daily",badge:"👑",title:"Pilier du Daily",reason:"365 daily claims"},
daily500:{name:"Légende du Daily",badge:"🌟",title:"Légende du Daily",reason:"500 daily claims"},

/* KAMAS */

kamas1000:{name:"Petit portefeuille",badge:"💰",title:"Économe",reason:"Posséder 1000 kamas"},
kamas10000:{name:"Marchand prospère",badge:"💰",title:"Marchand riche",reason:"Posséder 10 000 kamas"},
kamas100000:{name:"Millionnaire du Krosmoz",badge:"💎",title:"Millionnaire",reason:"Posséder 100 000 kamas"},
kamas500000:{name:"Magnat du marché",badge:"🏦",title:"Magnat",reason:"Posséder 500 000 kamas"},
kamas1000000:{name:"Roi des kamas",badge:"👑",title:"Roi des kamas",reason:"Posséder 1 000 000 kamas"},

/* BOT MENTIONS */

mention1:{name:"Tu voulais quelque chose ?",badge:"💬",title:"Bavard",reason:"Mentionner le bot"},
mention10:{name:"On discute ?",badge:"💬",title:"Habituel",reason:"Mentionner le bot 10 fois"},
mention100:{name:"On devient amis ?",badge:"💬",title:"Compagnon",reason:"Mentionner le bot 100 fois"},
mention500:{name:"Toujours là ?",badge:"💬",title:"Inséparable",reason:"Mentionner le bot 500 fois"},
mention1000:{name:"Je vis dans ta tête",badge:"💬",title:"Obsédé",reason:"Mentionner le bot 1000 fois"},

/* SECRETS */

packDivin:{name:"Pack Divin",badge:"🌈",title:"Béni du Krosmoz",secret:true,reason:"Ouvrir un pack exceptionnel"},
pileOuFace:{name:"Pile ou Face",badge:"🎲",title:"Joueur",secret:true,reason:"Résultat improbable"},
impossible:{name:"Impossible",badge:"💥",title:"Bug du destin",secret:true,reason:"Événement extrêmement rare"},
insomniaque:{name:"Insomniaque",badge:"🌙",title:"Nocturne",secret:true,reason:"Jouer très tard"},
matinal:{name:"Matinal",badge:"🌅",title:"Lève-tôt",secret:true,reason:"Jouer très tôt"},

mentionSpam:{name:"Tu te calmes ?",badge:"📢",title:"Spam master",secret:true,reason:"Mentionner le bot en boucle"},
nightPing:{name:"Noctambule",badge:"🌙",title:"Noctambule",secret:true,reason:"Mentionner le bot la nuit"},
devilPing:{name:"666",badge:"😈",title:"Marqué par le démon",secret:true,reason:"Mention spéciale"},
auraFarm:{name:"Aura Farming",badge:"✨",title:"Aura farmer",secret:true,reason:"Accumuler de l'aura"}

}

function giveAchievement(user,id){

 const ach=achievements[id]
 if(!ach) return false

 if(!user.achievements)
  user.achievements=[]

 if(user.achievements.includes(id))
  return false

 user.achievements.push(id)

 addXP(user,100)

 const title=ach.title

 if(title){

  if(!user.titles)
   user.titles=["Nouveau"]

  if(!user.titles.includes(title))
   user.titles.push(title)

 }

 return true
}

async function notifyAchievement(interaction,id){

 const ach=achievements[id]
 if(!ach) return

 const embed=new EmbedBuilder()

 .setTitle("🏆 Succès débloqué !")

 .setDescription(`${ach.badge} **${ach.name}**

📜 **Pourquoi ?**
${ach.reason || "Condition spéciale atteinte"}

🎖 **Titre débloqué :** ${ach.title}`)

 .setThumbnail(interaction.user.displayAvatarURL())

 .setColor("#f1c40f")

 .setFooter({
  text:interaction.user.username
 })

 await interaction.followUp({embeds:[embed]})

}

async function checkAchievements(interaction,user,totalCards,totalUnique,totalAll){

 const sold=user.stats?.cardsSold||0
 const ssr=user.stats?.ssrPulled||0
 const fusion=user.stats?.fusions||0
 const packsOpened=user.stats?.packsOpened||0
 const packsBought=user.stats?.packsBought||0
 const fusionCrit=user.stats?.fusionCrit||0
 const fusionDouble=user.stats?.fusionDouble||0
 const level=user.progression?.level||1
 const kamas=user.kamas||0
 const daily=user.stats?.dailyClaims||0
 const mentions=user.stats?.botMentions||0

 const checks=[

["cards10",totalAll>=10],
["cards50",totalAll>=50],
["cards100",totalAll>=100],
["cards500",totalAll>=500],
["cards1000",totalAll>=1000],

["level5",level>=5],
["level10",level>=10],
["level20",level>=20],
["level30",level>=30],
["level50",level>=50],

["sell1",sold>=1],
["sell50",sold>=50],
["sell100",sold>=100],
["sell500",sold>=500],
["sell1000",sold>=1000],

["packs1",packsOpened>=1],
["packs10",packsOpened>=10],
["packs50",packsOpened>=50],
["packs200",packsOpened>=200],
["packs500",packsOpened>=500],
["packs1000",packsOpened>=1000],

["buy1",packsBought>=1],
["buy10",packsBought>=10],
["buy50",packsBought>=50],
["buy200",packsBought>=200],

["lucky",ssr>=1],
["ultraLucky",ssr>=10],

["fusion10",fusion>=10],
["fusion50",fusion>=50],
["fusion200",fusion>=200],

["fusionCrit",fusionCrit>=1],
["fusionCrit10",fusionCrit>=10],
["fusionCrit100",fusionCrit>=100],

["fusionDouble",fusionDouble>=1],
["fusionDouble10",fusionDouble>=10],
["fusionDouble100",fusionDouble>=100],

["daily30",daily>=30],
["daily60",daily>=60],
["daily120",daily>=120],
["daily200",daily>=200],
["daily300",daily>=300],
["daily365",daily>=365],
["daily500",daily>=500],

["kamas1000",kamas>=1000],
["kamas10000",kamas>=10000],
["kamas100000",kamas>=100000],
["kamas500000",kamas>=500000],
["kamas1000000",kamas>=1000000],

["mention1",mentions>=1],
["mention10",mentions>=10],
["mention100",mentions>=100],
["mention500",mentions>=500],
["mention1000",mentions>=1000]

 ]

 for(const [id,condition] of checks){

  if(condition){

   const gained=giveAchievement(user,id)

   if(gained)
    await notifyAchievement(interaction,id)

  }

 }

}

module.exports={
 achievements,
 giveAchievement,
 checkAchievements,
 notifyAchievement
}