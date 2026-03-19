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

  rp:{ bonus:"💥 Une puissance écrasante envahit le pack..." },

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

  mid:`🎯 **La chasse continue...**`,
  end:`🎯 **Cra relâche son arc.**`,

  rp:{ target:"🎯 Une cible précise a été touchée !" },

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

  start:`⏳ **Xelor manipule le temps...**`,
  mid:`⏳ **Le temps se fissure encore...**`,
  end:`⏳ **Le temps reprend son cours.**`,

  rp:{
   removed:"⏳ Le temps efface certaines cartes...",
   added:"⏳ De nouvelles cartes surgissent..."
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
  type:"hidden",

  start:`🕶️ **Le Voile de l’Ombre tombe...**`,
  mid:`🕶️ **Les ombres persistent...**`,
  end:`🕶️ **La lumière revient.**`,

  rp:{ hidden:"🕶️ Le pack est dissimulé..." },

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
  type:"mutation",

  start:`💀 **Le sang appelle le chaos...**`,
  mid:`💀 **La douleur amplifie...**`,
  end:`💀 **Le sacrifice prend fin.**`,

  rp:{ mutation:"💀 Mutation violente..." },

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
  type:"upgrade",

  start:`🎭 **Zobal change de masque...**`,
  mid:`🎭 **Les masques se succèdent...**`,
  end:`🎭 **Zobal disparaît.**`,

  rp:{ upgrade:"🎭 Évolution..." },

  voiceLines:{
   S:[
    "🎭 Un masque intéressant.",
    "🎭 Tu changes… comme moi.",
    "🎭 Une évolution subtile."
   ],
   SSR:[
    "🎭💥 Transformation parfaite.",
    "🎭 Tu maîtrises les masques.",
    "🎭 Une évolution totale."
   ]
  }
 },

 huppermage:{
  name:"🧠 Huppermage",
  type:"volume",

  start:`🧠 **Les éléments s'alignent...**`,
  mid:`🧠 **L'équilibre persiste...**`,
  end:`🧠 **Les éléments se dispersent.**`,

  rp:{ added:"🧠 Création..." },

  voiceLines:{
   S:[
    "🧠 L'équilibre se forme.",
    "✨ Une harmonie naît.",
    "🧠 Les éléments répondent."
   ],
   SSR:[
    "🧠💥 Parfait équilibre.",
    "✨ Convergence absolue.",
    "🧠 Les éléments s’inclinent."
   ]
  }
 },

 pandawa:{
  name:"🍺 Pandawa",
  type:"duplication",

  start:`🍺 **Pandawa partage...**`,
  mid:`🍺 **La fête continue...**`,
  end:`🍺 **La fête est finie.**`,

  rp:{ duplicate:"🍺 Duplication..." },

  voiceLines:{
   S:[
    "🍺 Pas mal ! Encore !",
    "🍻 Ça devient intéressant !",
    "🍺 Une petite de plus !"
   ],
   SSR:[
    "🍺💥 TOURNÉE GÉNÉRALE !!",
    "🍻 Là on parle sérieusement !",
    "🍺 Une vraie fête !"
   ]
  }
 },
 
 osamodas:{
  name:"🐉 Osamodas",
  type:"structure",

  start:`🐉 Invocation...`,
  mid:`🐉 Les créatures répondent...`,
  end:`🐉 Disparition.`,

  rp:{ structure:"🐉 Uniformité..." },

  voiceLines:{
   S:[
    "🐉 Une créature intéressante.",
    "🐉 Le lien se forme.",
    "🐉 Elles répondent à ton appel."
   ],
   SSR:[
    "🐉💥 Une invocation parfaite.",
    "🐉 Une armée t’obéit.",
    "🐉 Puissance sauvage."
   ]
  }
 },

 ecaflip:{
  name:"🎲 Ecaflip",
  type:"rng",

  start:`🎲 RNG...`,
  mid:`🎲 Chaos...`,
  end:`🎲 Fin.`,

  rp:{ luck:"🎲 Chance..." },

  voiceLines:{
   S:[
    "🎲 La chance sourit.",
    "😏 Intéressant...",
    "🎲 Continue à jouer..."
   ],
   SSR:[
    "🎲💥 JACKPOT !!",
    "😼 Tu défies le destin.",
    "🎲 Chance maximale."
   ]
  }
 },

 ouginak:{
  name:"🐺 Ouginak",
  type:"rng_negative",

  start:`🐺 Malchance...`,
  mid:`🐺 Difficulté...`,
  end:`🐺 Fin.`,

  rp:{ bad:"🐺 Faiblesse..." },

  voiceLines:{
   S:[
    "🐺 Tu survies...",
    "⚔️ Faible... mais acceptable.",
    "🐺 Continue."
   ],
   SSR:[
    "🐺 ...Impressionnant.",
    "⚔️ Tu tiens bon.",
    "🐺 Tu résistes."
   ]
  }
 },

 feca:{
  name:"🛡️ Feca",
  type:"reward",

  start:`🛡️ Protection...`,
  mid:`🛡️ Bouclier...`,
  end:`🛡️ Fin.`,

  rp:{ protection:"🛡️ Protection..." },

  voiceLines:{
   S:[
    "🛡️ Protégé.",
    "✨ Stable.",
    "🛡️ Contrôle."
   ],
   SSR:[
    "🛡️💥 Défense parfaite.",
    "✨ Protection absolue.",
    "🛡️ Rien ne passe."
   ]
  }
 },

 enutrof:{
  name:"💰 Enutrof",
  type:"reward",

  start:`💰 Richesse...`,
  mid:`💰 Gain...`,
  end:`💰 Fin.`,

  rp:{ kamas:"💰 Gain..." },

  voiceLines:{
   S:[
    "💰 Pas mal...",
    "💰 Ça rapporte.",
    "💰 Continue."
   ],
   SSR:[
    "💰💥 JACKPOT !!",
    "💰 Une fortune !",
    "💰 Incroyable richesse."
   ]
  }
 },

 roublard:{
  name:"💣 Roublard",
  type:"volume",

  start:`💣 Explosion...`,
  mid:`💣 Chaos...`,
  end:`💣 Silence.`,

  rp:{ added:"💣 Boom..." },

  voiceLines:{
   S:[
    "💣 Ça explose doucement.",
    "💣 Intéressant.",
    "💣 Ça monte..."
   ],
   SSR:[
    "💣💥 EXPLOSION !!",
    "💣 Tout saute !",
    "💣 Chaos total."
   ]
  }
 },

 steamer:{
  name:"⚙️ Steamer",
  type:"chaos",

  start:`⚙️ Chaos...`,
  mid:`⚙️ Instable...`,
  end:`⚙️ Stable.`,

  rp:{ chaos:"⚙️ Chaos..." },

  voiceLines:{
   S:[
    "⚙️ Instabilité détectée.",
    "⚙️ Variation acceptable.",
    "⚙️ Système fluctuant."
   ],
   SSR:[
    "⚙️💥 ANOMALIE MAX.",
    "⚙️ Chaos total.",
    "⚙️ Instabilité critique."
   ]
  }
 },

 eliotrope:{
  name:"🌀 Eliotrope",
  type:"special",

  start:`🌀 Portail...`,
  mid:`🌀 Vibrations...`,
  end:`🌀 Fermeture.`,

  rp:{ special:"🌀 Distorsion..." },

  voiceLines:{
   S:[
    "🌀 Une faille mineure.",
    "🌀 Étrange...",
    "🌀 Distorsion..."
   ],
   SSR:[
    "🌀💥 Une faille parfaite.",
    "🌀 Les dimensions cèdent.",
    "🌀 Réalité brisée."
   ]
  }
 },

 eniripsa:{
  name:"✨ Eniripsa",
  type:"filter",

  start:`✨ Purification...`,
  mid:`✨ Énergie...`,
  end:`✨ Fin.`,

  rp:{ filter:"✨ Purifié..." },

  voiceLines:{
   S:[
    "✨ Pur.",
    "✨ Stable.",
    "✨ Équilibré."
   ],
   SSR:[
    "✨💥 Parfait.",
    "✨ Pureté absolue.",
    "✨ Lumière totale."
   ]
  }
 },

 sadida:{
  name:"🌿 Sadida",
  type:"duplication",

  start:`🌿 Nature...`,
  mid:`🌿 Croissance...`,
  end:`🌿 Calme.`,

  rp:{ duplicate:"🌿 Duplication..." },

  voiceLines:{
   S:[
    "🌿 Ça pousse...",
    "🌱 Intéressant.",
    "🌿 Croissance."
   ],
   SSR:[
    "🌿💥 Explosion de vie !",
    "🌱 Multiplication totale.",
    "🌿 La nature domine."
   ]
  }
 },

 forgelance:{
  name:"⚔️ Forgelance",
  type:"upgrade_global",

  start:`⚔️ Forge...`,
  mid:`⚔️ Feu...`,
  end:`⚔️ Fin.`,

  rp:{ upgrade:"⚔️ Upgrade..." },

  voiceLines:{
   S:[
    "⚔️ Forgé.",
    "🔥 Chauffe...",
    "⚔️ Solide."
   ],
   SSR:[
    "⚔️💥 Parfaitement forgé.",
    "🔥 Arme ultime.",
    "⚔️ Puissance maximale."
   ]
  }
 }

}

module.exports = EVENTS