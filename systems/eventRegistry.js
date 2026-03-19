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
}

}


module.exports = EVENTS