const {
 SlashCommandBuilder,
 ActionRowBuilder,
 StringSelectMenuBuilder,
 EmbedBuilder
} = require("discord.js")

const setsData = require("../../cards/sets.json")
const sets = Array.isArray(setsData) ? setsData : setsData.sets

const { openPack } = require("../../systems/packEngine")
const { getUser, save } = require("../../systems/userSystem")
const { achievementCheck } = require("../../systems/achievementCheck")
const cooldownDev = require("../dev/cooldown")

const rarityEmoji={
 C:"⚪",U:"🟢",R:"🔵",SR:"🟣",
 HR:"🔴",UR:"🟡",S:"✨",SSR:"🌈"
}

const rarityColor={
 C:"#95a5a6",U:"#2ecc71",R:"#3498db",
 SR:"#9b59b6",HR:"#e74c3c",
 UR:"#f1c40f",S:"#ecf0f1",SSR:"#ffcc00"
}

function sleep(ms){
 return new Promise(r=>setTimeout(r,ms))
}

function getCooldownText(user){

 const now=Date.now()

 if(!user.lastPack)
  return "🎁 Pack gratuit : **disponible**"

 const remain=3600000-(now-user.lastPack)

 if(remain<=0)
  return "🎁 Pack gratuit : **disponible**"

 const minutes=Math.ceil(remain/60000)

 return `⏳ Pack gratuit : **${minutes} min**`
}

module.exports={

 name:"krosmoz",

 data:new SlashCommandBuilder()
  .setName("krosmoz")
  .setDescription("Ouvrir un pack Krosmoz"),

 async execute(interaction){

  const user=getUser(interaction.user.id)

  if(!sets || sets.length===0){
   return interaction.reply({
    content:"❌ Aucun set disponible.",
    ephemeral:true
   })
  }

  /* ---------- INITIALISATION SAFE ---------- */

  if(!user.pity) user.pity={}
  if(!user.stats) user.stats={}

  /* ----------------------------------------- */

  const options = sets
   .slice(0,25)
   .map(set=>{

    const pity=user.pity[set.id] || {SSR:0,UR:0}

    return{
     label:set.name,
     value:set.id,
     description:`SSR ${pity.SSR}/50 • UR ${pity.UR}/10`
    }

   })

  const menu=new StringSelectMenuBuilder()
   .setCustomId("krosmoz_set")
   .setPlaceholder("Choisis un set")
   .addOptions(options)

  const row=new ActionRowBuilder().addComponents(menu)

  await interaction.reply({
   content:
`🎴 **Choisis un set**

📦 Packs achetés : **${user.packs || 0}**
${getCooldownText(user)}`,
   components:[row],
   ephemeral:true
  })

 },

 async select(interaction){

  await interaction.deferReply()

  const setId=interaction.values[0]
  const user=getUser(interaction.user.id)

  /* -------- FIX PITY INITIALISATION -------- */

  if(!user.pity)
   user.pity={}

  if(!user.pity[setId])
   user.pity[setId]={SSR:0,UR:0}

  if(!user.stats)
   user.stats={}

  /* ---------------------------------------- */

  const now=Date.now()

  let freePack=false

  if(!cooldownDev.cooldownDisabled()){
   if(!user.lastPack || now-user.lastPack>=3600000)
    freePack=true
  }else freePack=true

  if(!freePack && (!user.packs || user.packs<=0)){
   const remain=Math.ceil((3600000-(now-user.lastPack))/60000)

   return interaction.editReply(
`❌ Aucun pack disponible.
⏳ Prochain pack gratuit : **${remain} min**`
   )
  }

  if(freePack) user.lastPack=now
  else user.packs--

  user.stats.packsOpened=(user.stats.packsOpened||0)+1

  const result=openPack(user,setId)

  const pack=result.pack
  const luckyPack=result.luckyPack
  const discovered=result.discovered
  const kamasGain=result.kamasGain
  const xpGain=result.xpGain
  const best=result.best
  const dailyBonus=result.dailyBonus

  let revealed=[]

  await interaction.editReply("🎴 **Ouverture du pack...**")

  const message=await interaction.channel.send({
   embeds:[
    new EmbedBuilder()
     .setTitle("📦 Ouverture du pack...")
     .setDescription("✨ Les cartes apparaissent...")
     .setColor("#f1c40f")
   ]
  })

  await sleep(1000)

  for(const card of pack){

   const line=`${rarityEmoji[card.rarity]} **${card.name}${card.shiny?" ✨":""}** \`${card.rarity}\``

   revealed.push(line)

   const revealEmbed=new EmbedBuilder()
    .setTitle("🎴 Ouverture du pack")
    .setDescription(revealed.join("\n"))
    .setColor(rarityColor[card.rarity])

   await message.edit({embeds:[revealEmbed]})
   await sleep(800)
  }

  await achievementCheck(interaction,user)

  save()

  const pity=user.pity[setId]

  const finalEmbed=new EmbedBuilder()
   .setTitle("🎴 Pack ouvert !")
   .setDescription(revealed.join("\n"))
   .addFields(
    {name:"💰 Kamas gagnés",value:`+${kamasGain}`,inline:true},
    {name:"⭐ XP gagnée",value:`+${xpGain}`,inline:true},
    {name:"🌈 SSR Pity",value:`${pity.SSR}/50`,inline:true},
    {name:"🟡 UR Pity",value:`${pity.UR}/10`,inline:true}
   )
   .setColor(rarityColor[best.rarity])

  if(luckyPack){
   finalEmbed.addFields({
    name:"🎁 Lucky Pack",
    value:"Une carte bonus apparaît !",
    inline:false
   })
  }

  if(dailyBonus){
   finalEmbed.addFields({
    name:"✨ Bonus quotidien",
    value:"XP doublée sur ce pack",
    inline:false
   })
  }

  await message.edit({embeds:[finalEmbed]})

  if(discovered.length){

   const lines=discovered.map(c=>`🔎 **${c.name}**`)

   await interaction.followUp({
    content:`Nouvelle découverte !\n${lines.join("\n")}`,
    ephemeral:true
   })

  }

 }

}