const EVENTS = {

 iop:{
  name:"🔥 Iop",
  effect:"Boost HR & UR",
  type:"rarity_boost",

  allowMultiSSR:true, // ✅ important

  start:`🔥 **Iop entre en rage !**
La puissance brute explose !

💥 HR & UR dominent les packs`,

  mid:`🔥 **La rage continue !**
Les coups deviennent encore plus violents !`,

  end:`🔥 **Iop se calme...**
La puissance redescend.`
 },

 cra:{
  name:"🎯 Cra",
  effect:"Carte S ciblée (20%)",
  type:"target",

  needsTarget:true, // ✅ important

  start:`🎯 **Cra vise sa proie...**
Une cible rare est traquée !`,

  mid:`🎯 **La chasse continue...**
Impossible d’échapper aux flèches.`,

  end:`🎯 **Cra relâche son arc.**`
 },

 xelor:{
  name:"⏳ Xelor",
  effect:"Altération du pack",
  type:"manipulation",

  start:`⏳ **Xelor manipule le temps...**
Certaines cartes disparaissent, d'autres apparaissent.`,

  mid:`⏳ **Le temps se fissure encore...**`,

  end:`⏳ **Le temps reprend son cours.**`
 },

 sram:{
  name:"🕶️ Sram",
  effect:"Pack caché + carte bonus",
  type:"hidden",

  start:`🕶️ **Le Voile de l’Ombre tombe...**
Tu ne vois plus rien...`,

  mid:`🕶️ **Les ombres persistent...**`,

  end:`🕶️ **La lumière revient.**`
 },

 sacrieur:{
  name:"💀 Sacrieur",
  effect:"Mutation cartes",
  type:"mutation",

  start:`💀 **Le sang appelle le chaos...**
Les cartes mutent violemment !`,

  mid:`💀 **La douleur amplifie la mutation...**`,

  end:`💀 **Le sacrifice prend fin.**`
 },

 zobal:{
  name:"🎭 Zobal",
  effect:"+1 rareté",
  type:"upgrade",

  start:`🎭 **Zobal change de masque...**
Certaines cartes évoluent !`,

  mid:`🎭 **Les masques se succèdent...**`,

  end:`🎭 **Zobal disparaît.**`
 },

 huppermage:{
  name:"🧠 Huppermage",
  effect:"Cartes bonus",
  type:"volume",

  start:`🧠 **Les éléments s'alignent...**
Des cartes supplémentaires apparaissent !`,

  mid:`🧠 **L'équilibre persiste...**`,

  end:`🧠 **Les éléments se dispersent.**`
 },

 pandawa:{
  name:"🍺 Pandawa",
  effect:"Duplication",
  type:"duplication",

  start:`🍺 **Pandawa partage...**
Certaines cartes se dupliquent !`,

  mid:`🍺 **La fête continue...**`,

  end:`🍺 **La fête est finie.**`
 },

 osamodas:{
  name:"🐉 Osamodas",
  effect:"Pack homogène",
  type:"structure",

  start:`🐉 **Osamodas invoque un troupeau...**
Toutes les cartes seront similaires !`,

  mid:`🐉 **Les créatures répondent...**`,

  end:`🐉 **Les invocations disparaissent.**`
 },

 ecaflip:{
  name:"🎲 Ecaflip",
  effect:"RNG chance",
  type:"rng",

  start:`🎲 **Ecaflip lance les dés...**
La chance est avec toi !`,

  mid:`🎲 **Tout peut arriver...**`,

  end:`🎲 **La chance s'évapore.**`
 },

 ouginak:{
  name:"🐺 Ouginak",
  effect:"RNG malchance",
  type:"rng_negative",

  start:`🐺 **Ouginak grogne...**
La malchance s’abat !`,

  mid:`🐺 **La chasse est difficile...**`,

  end:`🐺 **Le calme revient.**`
 },

 feca:{
  name:"🛡️ Feca",
  effect:"No C/U + XP boost",
  type:"reward",

  start:`🛡️ **Feca protège les héros...**
Plus aucune carte faible !`,

  mid:`🛡️ **Le bouclier tient...**`,

  end:`🛡️ **La protection disparaît.**`
 },

 enutrof:{
  name:"💰 Enutrof",
  effect:"Kamas x5",
  type:"reward",

  start:`💰 **Enutrof est généreux !**
Les richesses affluent !`,

  mid:`💰 **L’or continue de tomber...**`,

  end:`💰 **Les richesses s'arrêtent.**`
 },

 roublard:{
  name:"💣 Roublard",
  effect:"+3 cartes",
  type:"volume",

  start:`💣 **Roublard prépare son coup...**
Plus de cartes dans les packs !`,

  mid:`💣 **Les bombes explosent...**`,

  end:`💣 **Silence...**`
 },

 steamer:{
  name:"⚙️ Steamer",
  effect:"RNG chaos",
  type:"chaos",

  start:`⚙️ **La machine s'emballe...**
Les probabilités deviennent instables !`,

  mid:`⚙️ **Le chaos persiste...**`,

  end:`⚙️ **Le système se stabilise.**`
 },

 eliotrope:{
  name:"🌀 Eliotrope",
  effect:"Pack spécial",
  type:"special",

  start:`🌀 **Un portail s'ouvre...**
Des cartes venues d'autres dimensions apparaissent !`,

  mid:`🌀 **Les dimensions vibrent...**`,

  end:`🌀 **Le portail se ferme.**`
 },

 eniripsa:{
  name:"✨ Eniripsa",
  effect:"No C/U/R",
  type:"filter",

  start:`✨ **Eniripsa purifie les packs...**
Plus aucune carte faible !`,

  mid:`✨ **L'énergie persiste...**`,

  end:`✨ **La magie s'efface.**`
 },

 sadida:{
  name:"🌿 Sadida",
  effect:"Duplication",
  type:"duplication",

  start:`🌿 **La nature s’éveille...**
Les cartes se multiplient !`,

  mid:`🌿 **La forêt s'étend...**`,

  end:`🌿 **La nature se calme.**`
 },

 forgelance:{
  name:"⚔️ Forgelance",
  effect:"+1 rareté globale",
  type:"upgrade_global",

  start:`⚔️ **Les armes s’embrasent...**
Toutes les cartes sont améliorées !`,

  mid:`⚔️ **Le feu persiste...**`,

  end:`⚔️ **La forge refroidit.**`
 }

}

module.exports = EVENTS