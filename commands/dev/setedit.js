const { isDev } = require("../../systems/devSystem")
const { editSetName, loadSets } = require("../../systems/setSystemFile")

const sets = loadSets()
const safeSets = Array.isArray(sets) ? sets : sets.sets

module.exports = {

 name:"setedit",
 description:"Modifier le nom d'un set",

 options:[
  {
   name:"set",
   description:"Set",
   type:3,
   required:true,
   choices: safeSets.map(s=>({
    name:s.name,
    value:s.id
   }))
  },
  {
   name:"name",
   description:"Nouveau nom",
   type:3,
   required:true
  }
 ],

 async execute(interaction){

  if(!isDev(interaction.user.id))
   return interaction.reply({
    content:"Commande dev.",
    ephemeral:true
   })

  const id = interaction.options.getString("set")
  const name = interaction.options.getString("name")

  const result = editSetName(id,name)

  if(result.error)
   return interaction.reply(result.error)

  interaction.reply(`✏️ Set renommé : ${result.name}`)

 }

}