const { isDev } = require("../../systems/devSystem")
const { deleteSet, loadSets } = require("../../systems/setSystemFile")

const rawSets = loadSets()
const sets = Array.isArray(rawSets) ? rawSets : rawSets?.sets || []

module.exports = {

 name:"setdelete",
 description:"Supprimer un set",

 options:[
  {
   name:"set",
   description:"Set",
   type:3,
   required:true,
   choices: sets.map(s => ({
    name:s.name,
    value:s.id
   }))
  }
 ],

 async execute(interaction){

  if(!isDev(interaction.user.id))
   return interaction.reply({
    content:"Commande dev.",
    ephemeral:true
   })

  const id = interaction.options.getString("set")

  const result = deleteSet(id)

  if(result?.error)
   return interaction.reply(result.error)

  interaction.reply(`🗑 Set supprimé : ${result.name}`)

 }

}