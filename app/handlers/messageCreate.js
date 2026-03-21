const { handleMessage } = require("../../systems/chatSystem")

function registerMessageCreateHandler(client) {
 client.on("messageCreate", async (message) => {
  try {
   await handleMessage(message, client)
  } catch (err) {
   console.error("Erreur chatSystem :", err)
  }
 })
}

module.exports = {
 registerMessageCreateHandler
}
