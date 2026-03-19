const EVENTS = {

 iop:{
  name:"🔥 Iop",
  effect:"Boost HR & UR",
  type:"rarity_boost",
  allowMultiSSR:true,

  start:`🔥 **Iop entre en rage !**
La puissance brute explose !

💥 HR & UR dominent les packs`,

  mid:`🔥 **La rage continue !**
Les coups deviennent encore plus violents !`,

  end:`🔥 **Iop se calme...**
La puissance redescend.`,

  rp:{
   bonus:"💥 Une puissance écrasante envahit le pack..."
  },

  voiceLines:{
   S:[
    "🔥 Ça chauffe… mais ce n’est que le début !",
    "💥 Plus fort ! Toujours plus fort !",
    "⚔️ Tu commences à me plaire..."
   ],
   SSR:[
    "🔥💀 OUI !!! C’EST ÇA LA PUISSANCE !!",
    "💥 TU ÉCRASES TOUT !! CONTINUE !!",
    "⚔️ UN VRAI GUERRIER !! ENCORE !!"
   ]
  }
 },

 cra:{
  name:"🎯 Cra",
  effect:"Carte S ciblée (20%)",
  type:"target",
  needsTarget:true,

  start:`🎯 **Cra vise sa proie...**
Une cible rare est traquée !`,

  mid:`🎯 **La chasse continue...**
Impossible d’échapper aux flèches.`,

  end:`🎯 **Cra relâche son arc.**`,

  rp:{
   target:"🎯 Une cible précise a été touchée !"
  },

  voiceLines:{
   S:[
    "🎯 Une belle trajectoire...",
    "🏹 Tu vises juste.",
    "🎯 Précis… très précis."
   ],
   SSR:[
    "🎯💥 Tir parfait.",
    "🏹 Aucune échappatoire.",
    "🎯 Une exécution impeccable."
   ]
  }
 },

 xelor:{
  name:"⏳ Xelor",
  effect:"Altération du pack",
  type:"manipulation",

  start:`⏳ **Xelor manipule le temps...**
Certaines cartes disparaissent, d'autres apparaissent.`,

  mid:`⏳ **Le temps se fissure encore...**`,

  end:`⏳ **Le temps reprend son cours.**`,

  rp:{
   removed:"⏳ Le temps efface certaines cartes...",
   added:"⏳ De nouvelles cartes surgissent d’un futur instable..."
  },

  voiceLines:{
   S:[
    "⏳ Le futur devient intéressant...",
    "⌛ Une variation temporelle mineure.",
    "⏳ Le flux change légèrement..."
   ],
   SSR:[
    "⏳💥 Le temps plie à ta volonté.",
    "⌛ Une anomalie majeure détectée.",
    "⏳ Le futur vient d’être réécrit."
   ]
  }
 },

 sram:{
  name:"🕶️ Sram",
  effect:"Pack caché + carte bonus",
  type:"hidden",

  start:`🕶️ **Le Voile de l’Ombre tombe...**
Tu ne vois plus rien...`,

  mid:`🕶️ **Les ombres persistent...**`,

  end:`🕶️ **La lumière revient.**`,

  rp:{
   hidden:"🕶️ Le pack est entièrement dissimulé..."
  },

  voiceLines:{
   S:[
    "🕶️ Intéressant...",
    "🔪 Tu progresses dans l’ombre.",
    "🕶️ Je vois ce que tu fais..."
   ],
   SSR:[
    "🕶️💀 Une ombre parfaite.",
    "🔪 Invisible… mortel.",
    "🕶️ Personne ne t’a vu venir."
   ]
  }
 },

 sacrieur:{
  name:"💀 Sacrieur",
  effect:"Mutation cartes",
  type:"mutation",

  start:`💀 **Le sang appelle le chaos...**
Les cartes mutent violemment !`,

  mid:`💀 **La douleur amplifie la mutation...**`,

  end:`💀 **Le sacrifice prend fin.**`,

  rp:{
   mutation:"💀 Les cartes subissent une transformation brutale..."
  },

  voiceLines:{
   S:[
    "💀 La douleur forge ta force.",
    "🩸 Continue… souffre encore.",
    "💀 Le sang répond."
   ],
   SSR:[
    "💀💥 Une transformation parfaite.",
    "🩸 TU EMBRASSES LA DOULEUR !!",
    "💀 La souffrance t’a transcendé."
   ]
  }
 },

 zobal:{
  name:"🎭 Zobal",
  effect:"+1 rareté",
  type:"upgrade",

  start:`🎭 **Zobal change de masque...**
Certaines cartes évoluent !`,

  mid:`🎭 **Les masques se succèdent...**`,

  end:`🎭 **Zobal disparaît.**`,

  rp:{
   upgrade:"🎭 Un masque révèle le potentiel caché des cartes..."
  },

  voiceLines:{
   S:[
    "🎭 Un masque… intéressant.",
    "🎭 Tu changes… comme moi.",
    "🎭 Une évolution subtile."
   ],
   SSR:[
    "🎭💥 Magnifique transformation.",
    "🎭 Tu maîtrises les masques.",
    "🎭 Une évolution parfaite."
   ]
  }
 },

 huppermage:{
  name:"🧠 Huppermage",
  effect:"Cartes bonus",
  type:"volume",

  start:`🧠 **Les éléments s'alignent...**
Des cartes supplémentaires apparaissent !`,

  mid:`🧠 **L'équilibre persiste...**`,

  end:`🧠 **Les éléments se dispersent.**`,

  rp:{
   added:"🧠 L'équilibre élémentaire génère de nouvelles cartes..."
  },

  voiceLines:{
   S:[
    "🧠 L'équilibre se forme.",
    "✨ Une harmonie naît.",
    "🧠 Les éléments répondent."
   ],
   SSR:[
    "🧠💥 Parfait équilibre.",
    "✨ Une convergence absolue.",
    "🧠 Les éléments s’inclinent."
   ]
  }
 },

 pandawa:{
  name:"🍺 Pandawa",
  effect:"Duplication",
  type:"duplication",

  start:`🍺 **Pandawa partage...**
Certaines cartes se dupliquent !`,

  mid:`🍺 **La fête continue...**`,

  end:`🍺 **La fête est finie.**`,

  rp:{
   duplicate:"🍺 Une tournée générale ! Certaines cartes se multiplient..."
  },

  voiceLines:{
   S:[
    "🍺 Pas mal ! On remet ça ?",
    "🍻 Ça commence à être sympa !",
    "🍺 Allez, encore une !"
   ],
   SSR:[
    "🍺💥 TOURNÉE GÉNÉRALE !!",
    "🍻 Là on parle sérieusement !",
    "🍺 Une vraie fête !"
   ]
  }
 },

 /* ================= SUITE IDENTIQUE POUR TOUTES LES CLASSES ================= */

 /* ⚠️ Je coupe ici sinon message trop long */
 /* MAIS : je peux te générer les 19 classes complètes */

}

module.exports = EVENTS