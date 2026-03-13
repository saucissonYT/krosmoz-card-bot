const { EmbedBuilder } = require("discord.js")
const { addXP } = require("./progressionSystem")

const achievements={

/* COLLECTION */

cards10:{name:"Apprenti collectionneur",badge:"🃏",title:"Apprenti"},
cards50:{name:"Collectionneur",badge:"🎴",title:"Collectionneur"},
cards100:{name:"Grand collectionneur",badge:"📚",title:"Archiviste"},
cards500:{name:"Bibliothèque vivante",badge:"🏛",title:"Archiviste Suprême"},
cards1000:{name:"Maître du Krosmoz",badge:"👑",title:"Maître du Krosmoz"},

/* SET */

completeSet:{name:"Complétionniste",badge:"🏆",title:"Complétionniste"},

/* LEVEL */

level5:{name:"Premiers pas",badge:"⭐",title:"Aventurier"},
level10:{name:"Aventurier",badge:"⭐",title:"Explorateur"},
level20:{name:"Vétéran",badge:"🌟",title:"Vétéran"},
level30:{name:"Champion",badge:"🏅",title:"Champion"},
level50:{name:"Maître du Krosmoz",badge:"👑",title:"Maître du Krosmoz"},

/* VENTES */

sell1:{name:"Premier commerce",badge:"💰",title:"Marchand"},
sell50:{name:"Petit marchand",badge:"🪙",title:"Marchand"},
sell100:{name:"Grand marchand",badge:"💰",title:"Grand Marchand"},
sell500:{name:"Tycoon",badge:"💎",title:"Tycoon"},
sell1000:{name:"Empereur du commerce",badge:"🏦",title:"Empereur marchand"},

/* PACKS OUVERTS */

packs1:{name:"Premier pack ouvert",badge:"📦",title:"Curieux"},
packs10:{name:"10 packs ouverts",badge:"📦",title:"Explorateur"},
packs50:{name:"50 packs ouverts",badge:"📦",title:"Chasseur de cartes"},
packs200:{name:"200 packs ouverts",badge:"📦",title:"Collectionneur acharné"},
packs500:{name:"500 packs ouverts",badge:"📦",title:"Maître des packs"},
packs1000:{name:"1000 packs ouverts",badge:"📦",title:"Seigneur des packs"},

/* PACKS ACHETÉS */

buy1:{name:"Premier pack acheté",badge:"🎁",title:"Client"},
buy10:{name:"10 packs achetés",badge:"🛒",title:"Acheteur"},
buy50:{name:"50 packs achetés",badge:"💰",title:"Investisseur"},
buy200:{name:"200 packs achetés",badge:"💎",title:"Magnat"},

/* SSR */

lucky:{name:"Chanceux",badge:"🍀",title:"Chanceux"},
doubleSSR:{name:"Double SSR !",badge:"🌈",title:"Double chance"},
ultraLucky:{name:"Ultra chanceux",badge:"🌟",title:"Élu du destin"},

/* SSR SHINY */

shinySSR:{name:"Miracle du Krosmoz",badge:"✨",title:"Élu du Krosmoz"},

/* FUSION */

fusion10:{name:"Apprenti alchimiste",badge:"⚗",title:"Apprenti alchimiste"},
fusion50:{name:"Alchimiste",badge:"🧪",title:"Alchimiste"},
fusion200:{name:"Grand alchimiste",badge:"🔮",title:"Grand alchimiste"},

/* FUSION CRITIQUE */

fusionCrit:{name:"Fusion critique",badge:"🔥",title:"Instable"},
fusionCrit10:{name:"10 fusions critiques",badge:"🔥",title:"Maître instable"},
fusionCrit100:{name:"100 fusions critiques",badge:"🔥",title:"Dieu de la fusion"},

/* FUSION DOUBLE */

fusionDouble:{name:"Fusion double",badge:"✨",title:"Duplication"},
fusionDouble10:{name:"10 fusions doubles",badge:"✨",title:"Duplicateur"},
fusionDouble100:{name:"100 fusions doubles",badge:"✨",title:"Roi de la duplication"},

/* DAILY */

assidu:{name:"Assidu",badge:"🔥",title:"Assidu"},

daily30:{name:"Habitué du Daily",badge:"📅",title:"Habitué"},
daily60:{name:"Régulier du Daily",badge:"🗓",title:"Régulier"},
daily120:{name:"Dévoué au Daily",badge:"💠",title:"Dévoué"},
daily200:{name:"Fidèle au Daily",badge:"🛡",title:"Fidèle"},
daily300:{name:"Vétéran du Daily",badge:"🏆",title:"Vétéran du Daily"},
daily365:{name:"Pilier du Daily",badge:"👑",title:"Pilier du Daily"},
daily500:{name:"Légende du Daily",badge:"🌟",title:"Légende du Daily"}

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

Titre débloqué : **${ach.title}**`)

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
["fusionDouble100",fusionDouble>=100]

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