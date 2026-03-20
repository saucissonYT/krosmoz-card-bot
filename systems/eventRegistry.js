const EVENTS = {

iop:{
 name:"🔥 Iop",
 effect:"Boost HR & UR",
 type:"rarity_boost",
 allowMultiSSR:true,

 start:`🔥 **Iop entre en rage !**

Une aura destructrice envahit les packs...

💥 **Effet :** Les cartes **HR & UR deviennent dominantes**
⚔️ La puissance brute remplace la chance.`,

 mid:`🔥 **La rage continue...**

Chaque ouverture devient plus violente.
Les coups pleuvent sans retenue.`,

 end:`🔥 **Iop se calme...**

La fureur disparaît lentement...
Les packs retrouvent leur équilibre.`,

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

Un tir parfait se prépare dans l’ombre.

🎯 **Effet :** Une **carte S ciblée** peut apparaître
🏹 La précision remplace le hasard.`,

 mid:`🎯 **La chasse continue...**

Chaque pack est une trajectoire parfaite...
La cible n’échappera pas.`,

 end:`🎯 **Cra relâche son arc.**

Le silence revient...
La précision s’efface.`,

 rp:{ target:"🎯 Une cible précise a été touchée !" },

 voiceLines:{
 S:[
  "🎯 Une belle trajectoire...",
  "🏹 Belle balise !",
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

Le flux temporel se déforme autour des packs...

⏳ **Effet :** Des cartes peuvent être **retirées ou ajoutées**
⌛ Le passé et le futur se mélangent.`,

 mid:`⏳ **Le temps se fissure...**

Des anomalies apparaissent...
Rien n’est stable.`,

 end:`⏳ **Le temps reprend son cours.**

Les distorsions disparaissent...
Tout redevient normal.`,

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

 start:`🕶️ **Le Voile de l’Ombre tombe...**

Les packs disparaissent dans l’obscurité...

🕶️ **Effet :** Les cartes sont **cachées**
🔪 Impossible de voir ce que tu obtiens.`,

 mid:`🕶️ **Les ombres persistent...**

Tu avances à l’aveugle...
Chaque pack est un mystère.`,

 end:`🕶️ **La lumière revient.**

Les ombres se dissipent...
La vérité réapparaît.`,

 rp:{ hidden:"🕶️ Le pack est dissimulé..." },

 voiceLines:{
 S:[
  "🕶️ Tu aurais pu sauver Chad...",
  "🔪 Tu progresses dans l’ombre.",
  "🕶️ Je vois ce que tu fais..."
 ],
 SSR:[
  "🕶️💀 Une ombre parfaite.",
  "🔪 Invisible… mortel ! ",
  "🕶️ Personne ne t’a vu venir."
 ]
}

},

sacrieur:{
 name:"💀 Sacrieur",
 type:"mutation",

 start:`💀 **Le sang appelle le chaos...**

La douleur transforme les cartes...

💀 **Effet :** Des cartes peuvent être **mutées en raretés supérieures**
🩸 Le sacrifice apporte la puissance.`,

 mid:`💀 **La souffrance augmente...**

Chaque pack devient instable...
La mutation s’intensifie.`,

 end:`💀 **Le sacrifice prend fin.**

La douleur disparaît...
Les cartes cessent d’évoluer.`,

 rp:{ mutation:"💀 Mutation violente..." },

 voiceLines:{
 S:[
  "💀 La douleur forge ta force.",
  "🩸 Continue… souffre encore.",
  "💀 Presque une armure sanguine !"
 ],
 SSR:[
  "💀💥 Une transformation parfaite.",
  "🩸 TU EMBRASSES LA DOULEUR, PUNITION !!",
  "💀 AUSSI PUISSANT QUE KALI !!"
 ]
}
},

zobal:{
 name:"🎭 Zobal",
 type:"upgrade",

 start:`🎭 **Zobal change de masque...**

Les cartes évoluent sous différentes formes...

🎭 **Effet :** Certaines cartes sont **améliorées**
🎭 L’évolution est imprévisible.`,

 mid:`🎭 **Les masques s’enchaînent...**

Les transformations continuent...
Rien n’est stable.`,

 end:`🎭 **Zobal disparaît.**

Les masques tombent...
Les cartes se figent.`,

 rp:{ upgrade:"🎭 Évolution..." },

 voiceLines:{
 S:[
  "🎭 Un masque intéressant.",
  "🎭 Tu changes… comme moi.",
  "🎭 Petite danse macabre..."
 ],
 SSR:[
  "🎭💥 Ton double a eu la même chose !",
  "🎭 Tu maîtrises les masques parfaitement !",
  "🎭 Au bal masqué ohé ohé !"
 ]
}

},

huppermage:{
 name:"🧠 Huppermage",
 type:"volume",

 start:`🧠 **Les éléments s’alignent...**

Une énergie pure amplifie les packs...

🧠 **Effet :** Des cartes supplémentaires peuvent apparaître
✨ L’équilibre crée l’abondance.`,

 mid:`🧠 **L’équilibre persiste...**

Les éléments continuent de fusionner...
Le flux augmente.`,

 end:`🧠 **Les éléments se dispersent.**

L’énergie se dissipe...
Les packs redeviennent normaux.`,

 rp:{ added:"🧠 Création..." },

 voiceLines:{
 S:[
  "🧠 L'équilibre se forme.",
  "✨ Une harmonie naît.",
  "🧠 Les éléments répondent."
 ],
 SSR:[
  "🧠💥 Tu ferais un bon professeur dans notre école...",
  "✨ Convergence absolue des éléments !!",
  "🧠 La balance krosmique t'a béni !!"
 ]
}

},

pandawa:{
 name:"🍺 Pandawa",
 type:"duplication",

 start:`🍺 **Pandawa partage...**

Les cartes se multiplient dans la fête...

🍺 **Effet :** Certaines cartes sont **dupliquées**
🍻 Plus tu ouvres, plus ça se copie.`,

 mid:`🍺 **La fête continue...**

Les duplications s’enchaînent...
La réserve grandit.`,

 end:`🍺 **La fête est finie.**

Les copies cessent...
Le calme revient.`,

 rp:{ duplicate:"🍺 Duplication..." },

 voiceLines:{
 S:[
  "🍺 Petit coup de bambou...",
  "🍻 Ça devient intéressant !",
  "🍺 Je préfère le Tekilait..."
 ],
 SSR:[
  "🍺💥 TOURNÉE GÉNÉRALE, HAPPY HOUR !!",
  "🍻 Là on parle sérieusement !",
  "🍺 Aussi puissant que lucha l'ambrée !"
 ]
}

},

osamodas:{
 name:"🐉 Osamodas",
 type:"structure",

 start:`🐉 **Osamodas invoque ses créatures...**

Une force primitive façonne les packs...

🐉 **Effet :** Les cartes deviennent **plus homogènes**
🐾 Une structure dominante apparaît.`,

 mid:`🐉 **Les créatures répondent...**

Une même essence se répète...
Le pack s’unifie.`,

 end:`🐉 **Les invocations disparaissent.**

La structure se brise...
La diversité revient.`,

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
  "🐉 Forme dragon !! "
 ]
}

},

ecaflip:{
 name:"🎲 Ecaflip",
 type:"rng",

 start:`🎲 **Ecaflip joue avec le destin...**

Tout peut arriver... ou rien.

🎲 **Effet :** RNG extrême (**jackpot ou amélioration massive**)
😼 La chance décide de tout.`,

 mid:`🎲 **Le chaos s’installe...**

Chaque pack est un pari...
Tout peut basculer.`,

 end:`🎲 **Le jeu se termine.**

La chance disparaît...
Le hasard se stabilise.`,

 rp:{ luck:"🎲 Chance..." },

 voiceLines:{
 S:[
  "🎲 La chance sourit même au pounicheur...",
  "😏 T'aurais pas croisé Ush toi ?",
  "🎲 Le chaloeil serait fier de toi"
 ],
 SSR:[
  "🎲💥 JACKPOT !!",
  "😼 Aussi fort que les afk d'Ecaflipus ! ",
  "🎲 Chance maximale, tu serais pas kerubim ??"
 ]
}

},

ouginak:{
 name:"🐺 Ouginak",
 type:"rng_negative",

 start:`🐺 **Ouginak impose sa loi...**

La difficulté envahit les packs...

🐺 **Effet :** Les cartes peuvent être **dégradées**
⚔️ Seuls les plus forts résistent.`,

 mid:`🐺 **La pression augmente...**

Chaque pack devient plus dur...
La faiblesse est punie.`,

 end:`🐺 **La chasse s’arrête.**

La tension retombe...
L’équilibre revient.`,

 rp:{ bad:"🐺 Faiblesse..." },

 voiceLines:{
 S:[
  "🐺 Tu survies...",
  "⚔️ Faible... mais acceptable.",
  "🐺 Aussi appétissant qu'un tofu..."
 ],
 SSR:[
  "🐺 ...Impressionnant de malchance.",
  "⚔️ Tu tiens bon, c'est bien.",
  "🐺 Tu résistes comme un milkar."
 ]
}

},

feca:{
 name:"🛡️ Feca",
 type:"reward",

 start:`🛡️ **Feca protège les packs...**

Une barrière magique filtre les résultats...

🛡️ **Effet :** Suppression des faibles cartes + **bonus XP**
✨ La stabilité est garantie.`,

 mid:`🛡️ **Le bouclier tient...**

Les packs restent contrôlés...
Rien ne déborde.`,

 end:`🛡️ **La protection disparaît.**

Le filtre se brise...
Le chaos revient.`,

 rp:{ protection:"🛡️ Protection..." },

 voiceLines:{
 S:[
  "🛡️ Immunité parfaite.",
  "✨ Trêve !",
  "🛡️ Plus utile que le gars aux slips..."
 ],
 SSR:[
  "🛡️💥 Coup de bâton et coup de cac !",
  "✨ Aussi puissant que 3 glyphes !",
  "🛡️ Qui veut la paix prépare la guerre !"
 ]
}

},

enutrof:{
 name:"💰 Enutrof",
 type:"reward",

 start:`💰 **Enutrof fouille les richesses...**

Une pluie de kamas s’annonce...

💰 **Effet :** **Kamas x5 + jackpot caché**
🪙 Chaque pack peut rapporter gros.`,

 mid:`💰 **La richesse augmente...**

Les gains s’accumulent...
L’or coule à flot.`,

 end:`💰 **Le trésor disparaît.**

Les gains ralentissent...
La fortune s’éteint.`,

 rp:{ kamas:"💰 Gain..." },

 voiceLines:{
 S:[
  "💰 Pas mal...c'est au moins 1000 kamas",
  "💰 presque 1/100 d'un porte-clef doré...",
  "💰 aussi riche que le Malléfisk !"
 ],
 SSR:[
  "💰💥 JACKPOT (ou pas) !!",
  "💰 Une fortune digne d'énutrosor !",
  "💰 aussi riche que Jamall'auneth !"
 ]
}

},

roublard:{
 name:"💣 Roublard",
 type:"volume",

 start:`💣 **Roublard prépare une explosion...**

Les packs deviennent instables...

💣 **Effet :** **+ cartes générées**
💥 Plus de volume, plus de chaos.`,

 mid:`💣 **Les bombes s’activent...**

Les packs débordent...
Tout explose.`,

 end:`💣 **Le silence retombe.**

Les explosions cessent...
Le flux se calme.`,

 rp:{ added:"💣 Boom..." },

 voiceLines:{
 S:[
  "💣 Pétard mouillé...",
  "💣 Intéressant comme explosif...",
  "💣 Petit roublabot..."
 ],
 SSR:[
  "💣💥 EXPLOSION !!",
  "💣 CE COMBO EST MORTEL !!",
  "💣 PULSAR !!"
 ]
}

},

steamer:{
 name:"⚙️ Steamer",
 type:"chaos",

 start:`⚙️ **Steamer libère le chaos mécanique...**

Les packs deviennent imprévisibles...

⚙️ **Effet :** RNG totalement **instable et dynamique**
🔧 Chaque pack est différent.`,

 mid:`⚙️ **Instabilité critique...**

Les variations augmentent...
Le système déraille.`,

 end:`⚙️ **Stabilisation du système.**

Les anomalies disparaissent...
Le contrôle revient.`,

 rp:{ chaos:"⚙️ Chaos..." },

 voiceLines:{
 S:[
  "⚙️ Instabilité détectée dans le stasis.",
  "⚙️ Surtension en cours...",
  "⚙️ ça irait mieux en steamerator... "
 ],
 SSR:[
  "⚙️💥 CHALEUR EXTREME, ALERTE !!",
  "⚙️ Disfonctionnement de la tourelle !!",
  "⚙️ Instabilité critique des microbots !!"
 ]
}

},

eliotrope:{
 name:"🌀 Eliotrope",
 type:"special",

 start:`🌀 **Eliotrope ouvre un portail...**

Une faille dimensionnelle apparaît...

🌀 **Effet :** Pack **fixe spécial haute qualité**
🌌 Une autre réalité influence les cartes.`,

 mid:`🌀 **Les dimensions vibrent...**

Les flux s’entrelacent...
L’espace se plie.`,

 end:`🌀 **Le portail se referme.**

La réalité se stabilise...
Les failles disparaissent.`,

 rp:{ special:"🌀 Distorsion..." },

 voiceLines:{
 S:[
  "🌀 Un petit portail...",
  "🌀 ça ira dans la dimension blanche...",
  "🌀 Wakméha !!"
 ],
 SSR:[
  "🌀💥 Réminiscence !",
  "🌀 Résilience !",
  "🌀 Ton réseau de portails est parfait !"
 ]
}

},

eniripsa:{
 name:"✨ Eniripsa",
 type:"filter",

 start:`✨ **Eniripsa purifie les packs...**

Une lumière douce filtre les résultats...

✨ **Effet :** Suppression des cartes faibles
💫 Seules les plus propres restent.`,

 mid:`✨ **L’énergie circule...**

Les packs deviennent plus purs...
L’équilibre s’installe.`,

 end:`✨ **La lumière s’éteint.**

La purification cesse...
Le mélange revient.`,

 rp:{ filter:"✨ Purifié..." },

 voiceLines:{
 S:[
  "✨ Comme un petit lapino...",
  "✨ Prenez mes PA !",
  "✨ Mot Vampirique !"
 ],
 SSR:[
  "✨💥 Reconstitution !",
  "✨ A moi la marque itsade !",
  "✨ Lumière totale, soin pour tous !"
 ]
}

},

sadida:{
 name:"🌿 Sadida",
 type:"duplication",

 start:`🌿 **Sadida fait pousser les cartes...**

La nature se multiplie...

🌿 **Effet :** Duplication progressive des cartes
🌱 Plus tu avances, plus ça grandit.`,

 mid:`🌿 **La croissance s’accélère...**

Les duplications explosent...
La nature envahit tout.`,

 end:`🌿 **La nature se calme.**

La croissance s’arrête...
L’équilibre revient.`,

 rp:{ duplicate:"🌿 Duplication..." },

 voiceLines:{
 S:[
  "🌿 Ça pousse...",
  "🌱 C'est intéressant...",
  "🌿 Croissance en cours..."
 ],
 SSR:[
  "🌿💥 Parfait pour combattre Nox !",
  "🌱 Aussi puissant que la ronce multiple !",
  "🌿 Je vais en parler au roi Sadida."
 ]
}

},

forgelance:{
 name:"⚔️ Forgelance",
 type:"upgrade_global",

 start:`⚔️ **Forgelance forge les cartes...**

Une chaleur intense transforme tout...

⚔️ **Effet :** **Upgrade global du pack**
🔥 Toutes les cartes gagnent en puissance.`,

 mid:`⚔️ **La forge brûle encore...**

Les améliorations continuent...
Le métal s’affine.`,

 end:`⚔️ **La forge s’éteint.**

Les flammes disparaissent...
Les cartes se stabilisent.`,

 rp:{ upgrade:"⚔️ Upgrade..." },

 voiceLines:{
 S:[
  "⚔️ Tu es prêt au combat !",
  "🔥 pas mal, ça vient d'Albuera ?",
  "⚔️ Solide comme ma lance."
 ],
 SSR:[
  "⚔️💥 Parfaitement forgé.",
  "🔥 Lance-Dur serait fier de toi.",
  "⚔️ Celle-ci sera pour Agard !"
 ]
}

}

}


module.exports = EVENTS