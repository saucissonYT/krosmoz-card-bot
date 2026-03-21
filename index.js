const { bootstrap } = require("./app/bootstrap")

bootstrap().catch((error) => {
 console.error("Fatal bootstrap error:", error)
 process.exit(1)
})
