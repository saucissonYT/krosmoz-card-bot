const EVENTS = {

 iop:{
  name:"🔥 Iop",
  effect:"Boost UR & S",

  start:`🔥 **Iop entre en rage !**
La puissance brute envahit les packs !

💥 UR & S fortement augmentées`,

  mid:`🔥 **La rage continue !**
Les coups pleuvent encore !

💥 Toujours boost UR & S`,

  end:`🔥 **Iop se calme...**
La puissance redescend.`
 },

 cra:{
  name:"🎯 Cra",
  effect:"Carte S ciblée (20%)",

  start:`🎯 **Cra vise sa proie...**
Une carte rare est traquée !

🎯 20% de chance d'obtenir une S spécifique`,

  mid:`🎯 **La chasse continue...**
Les flèches ne ratent pas leur cible.`,

  end:`🎯 **Cra relâche son arc.**`
 },

 xelor:{
  name:"⏳ Xelor",
  effect:"Relance du pack",

  start:`⏳ **Xelor manipule le temps...**
Ton destin peut changer !

🔁 Pack relançable une fois`,

  mid:`⏳ **Le temps se fissure encore...**`,

  end:`⏳ **Le temps reprend son cours.**`
 },

 sram:{
  name:"🕶️ Sram",
  effect:"Pack caché + carte bonus",

  start:`🕶️ **Le Voile de l’Ombre tombe...**
Tu ne vois plus rien...

🎴 Pack caché + 1 carte bonus`,

  mid:`🕶️ **Les ombres persistent...**`,

  end:`🕶️ **La lumière revient.**`
 },

 sacrieur:{
  name:"💀 Sacrieur",
  effect:"Mutation cartes",

  start:`💀 **Le sang appelle le chaos...**
Les cartes mutent !

🧬 Chaque carte peut devenir une autre`,

  mid:`💀 **La douleur amplifie la mutation...**`,

  end:`💀 **Le sacrifice prend fin.**`
 },

 zobal:{
  name:"🎭 Zobal",
  effect:"+1 rareté",

  start:`🎭 **Zobal change de masque...**
La réalité se déforme !

⬆️ Une carte améliorée`,

  mid:`🎭 **Les masques se succèdent...**`,

  end:`🎭 **Zobal disparaît.**`
 },

 huppermage:{
  name:"🧠 Huppermage",
  effect:"Carte bonus (50%)",

  start:`🧠 **Les éléments s'alignent...**
Une carte peut apparaître !

✨ 50% chance carte bonus`,

  mid:`🧠 **L'équilibre persiste...**`,

  end:`🧠 **Les éléments se dispersent.**`
 },

 pandawa:{
  name:"🍺 Pandawa",
  effect:"Duplication",

  start:`🍺 **Pandawa partage...**
Les cartes se multiplient !

🔁 Duplication possible`,

  mid:`🍺 **La fête continue...**`,

  end:`🍺 **La fête est finie.**`
 },

 osamodas:{
  name:"🐉 Osamodas",
  effect:"Pack cohérent",

  start:`🐉 **Osamodas invoque un troupeau...**
Toutes les cartes se ressemblent !

📦 Pack homogène (7-10 cartes)`,

  mid:`🐉 **Les créatures répondent...**`,

  end:`🐉 **Les invocations disparaissent.**`
 },

 ecaflip:{
  name:"🎲 Ecaflip",
  effect:"RNG chance",

  start:`🎲 **Ecaflip lance les dés...**
Chance ou malchance ?

🍀 RNG extrême (bon)`,

  mid:`🎲 **Tout peut arriver...**`,

  end:`🎲 **La chance s'évapore.**`
 },

 ouginak:{
  name:"🐺 Ouginak",
  effect:"RNG malchance",

  start:`🐺 **Ouginak grogne...**
La malchance arrive !

💀 RNG extrême (mauvais)`,

  mid:`🐺 **La chasse est difficile...**`,

  end:`🐺 **Le calme revient.**`
 },

 feca:{
  name:"🛡️ Feca",
  effect:"No C/U + XP jackpot",

  start:`🛡️ **Feca protège les héros...**
Plus de faiblesse !

✨ Pas de C/U + XP boost + jackpot`,

  mid:`🛡️ **Le bouclier tient...**`,

  end:`🛡️ **La protection disparaît.**`
 },

 enutrof:{
  name:"💰 Enutrof",
  effect:"Kamas x5 + jackpot",

  start:`💰 **Enutrof est généreux !**
Les richesses affluent !

💸 Kamas x5 + jackpot`,

  mid:`💰 **L’or continue de tomber...**`,

  end:`💰 **Les richesses s'arrêtent.**`
 },

 roublard:{
  name:"💣 Roublard",
  effect:"+2 cartes",

  start:`💣 **Roublard prépare son coup...**
Plus de loot !

📦 Packs à 7 cartes`,

  mid:`💣 **Les bombes explosent...**`,

  end:`💣 **Silence...**`
 },

 steamer:{
  name:"⚙️ Steamer",
  effect:"RNG chaos",

  start:`⚙️ **La machine s'emballe...**
Tout devient instable !

🎲 RNG totalement modifiée`,

  mid:`⚙️ **Le chaos persiste...**`,

  end:`⚙️ **Le système se stabilise.**`
 },

 eliotrope:{
  name:"🌀 Eliotrope",
  effect:"2 packs → 1",

  start:`🌀 **Un portail s'ouvre...**
Deux réalités !

📦 Choix entre 2 packs`,

  mid:`🌀 **Les dimensions vibrent...**`,

  end:`🌀 **Le portail se ferme.**`
 },

 eniripsa:{
  name:"✨ Eniripsa",
  effect:"No C/U",

  start:`✨ **Eniripsa soigne le destin...**
Plus de cartes faibles !

🌟 Pas de C/U`,

  mid:`✨ **L'énergie persiste...**`,

  end:`✨ **La magie s'efface.**`
 },

 sadida:{
  name:"🌿 Sadida",
  effect:"Duplication 30%",

  start:`🌿 **La nature s’éveille...**
Les cartes poussent !

🌿 30% duplication (max 2)`,

  mid:`🌿 **La forêt s'étend...**`,

  end:`🌿 **La nature se calme.**`
 },

 forgelance:{
  name:"⚔️ Forgelance",
  effect:"+1 rareté globale",

  start:`⚔️ **Les armes s’embrasent...**
Tout devient plus fort !

⬆️ Toutes les cartes boostées`,

  mid:`⚔️ **Le feu persiste...**`,

  end:`⚔️ **La forge refroidit.**`
 }

}

module.exports = EVENTS