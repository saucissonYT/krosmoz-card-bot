const {
 EmbedBuilder
} = require("discord.js")

const { getUser, save } = require("../../systems/userSystem")
const { generateEventPack } = require("../../systems/eventPackEngine")
const {
 getEvent,
 initUserEvent,
 canUseEventPack,
 registerPackStats
} = require("../../systems/eventEngine")

const { rewardKamas } = require("../../systems/rewards")
const { addXP } = require("../../systems/progressionSystem")

function sleep(ms){
 return new Promise(r=>setTimeout(r,ms))
}

module.exports = {

 name:"eventpack",

 async execute(interaction){

  const event=getEvent()

  if(!event)
   return interaction.reply({content:"❌ Aucun event",ephemeral:true})

  const user=getUser(interaction.user.id)

  initUserEvent(user)

  const check=canUseEventPack(user)

  if(!check.ok)
   return interaction.reply({content:`❌ ${check.error}`,ephemeral:true})

  await interaction.deferReply()

  let pack=generateEventPack(user,event)

  /* XELOR MESSAGE */
  let xelorMsg=""
  if(event.id==="XELOR" && Math.random()<0.33){
   xelorMsg="⏳ Le temps s’est réécrit..."
  }

  let kamas=0

  for(const c of pack){
   user.cards[c.id]=(user.cards[c.id]||0)+1
   kamas+=rewardKamas(user,c.rarity)
  }

  /* ENUTROF JACKPOT */
  if(event.id==="ENUTROF"){
   if(Math.random()<0.001){
    kamas+=50000
   }else if(Math.random()<0.01){
    kamas+=10000
   }
  }

  /* FECA XP */
  let xp=25+pack.length*2

  if(event.id==="FECA"){
   if(Math.random()<0.001){
    xp*=10
   }else if(Math.random()<0.01){
    xp*=5
   }
  }

  addXP(user,xp)

  registerPackStats(pack)

  user.event.used++

  save()

  const embed=new EmbedBuilder()
   .setTitle(`🎁 ${event.name}`)
   .setDescription(pack.map(c=>`• ${c.name} (${c.rarity})`).join("\n"))
   .addFields(
    {name:"💰 Kamas",value:`+${kamas}`,inline:true},
    {name:"⭐ XP",value:`+${xp}`,inline:true},
    {name:"🎟️ Tickets",value:`${user.event.used}/${user.event.tickets}`,inline:true}
   )

  await interaction.editReply({
   content:xelorMsg || null,
   embeds:[embed]
  })

 }

}