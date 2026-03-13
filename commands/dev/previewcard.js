const { EmbedBuilder } = require("discord.js")
const { isDev } = require("../../systems/devSystem")

const rarityEmoji = {
 C:"⚪",
 U:"🟢",
 R:"🔵",
 SR:"🟣",
 HR:"🔴",
 UR:"🟡",
 S:"✨",
 SSR:"🌈"
}

module.exports = {

 name:"previewcard",
 description:"Prévisualiser une carte",

 options:[
  { name:"nom", type:3, required:true },
  { name:"rarete", type:3, required:true },
  { name:"set", type:3, required:false },
  { name:"image", type:11, required:true }
 ],

 async execute(interaction){

  if(!isDev(interaction.user.id))
   return interaction.reply({
    content:"Commande dev.",
    ephemeral:true
   })

  const name = interaction.options.getString("nom")
  const rarity = interaction.options.getString("rarete")
  const set = interaction.options.getString("set")
  const attachment = interaction.options.getAttachment("image")

  const embed = new EmbedBuilder()
   .setTitle(`${rarityEmoji[rarity]} ${name}`)
   .setDescription(
`Rareté : ${rarity}
Set : ${set || "Aucun"}`
   )
   .setImage(attachment.url)

  interaction.reply({
   embeds:[embed]
  })

 }

}