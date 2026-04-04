const fs   = require("fs")
const path = require("path")

/* ════════════════════════════════════════════════════════════
   MODIFICATIONS :
   1. Utilise paths.js au lieu du pattern basePath dupliqué
   2. Utilise logger.js au lieu de console.error
   3. Utilise fileUtils.js (writeAtomic) pour les écritures
════════════════════════════════════════════════════════════ */

const { getBasePath }    = require("./paths")
const { createLogger }   = require("./logger")
const { writeAtomic, readJsonSafe } = require("./fileUtils")

const log = createLogger("DEV")

/* TON ID DISCORD ROOT */
const ROOT_OWNER = "231419667179241472"

/* -------- PATH -------- */

const BASE = getBasePath()
const PATH = path.join(BASE, "devs.json")

/* -------- LOAD -------- */

let devs = readJsonSafe(PATH, {
 owners: [ROOT_OWNER],
 devs:   []
})

/* S'assurer que ROOT_OWNER est toujours dans owners */
if (!devs.owners) devs.owners = [ROOT_OWNER]
if (!devs.devs)   devs.devs   = []

if (!devs.owners.includes(ROOT_OWNER)) {
 devs.owners.push(ROOT_OWNER)
}

/* Sauvegarder si le fichier n'existait pas */
if (!fs.existsSync(PATH)) {
 writeAtomic(PATH, devs)
}

log.info("devs.json chargé", {
 owners: devs.owners.length,
 devs:   devs.devs.length
})

/* -------- SAVE -------- */

function save() {

 try {
  writeAtomic(PATH, devs)
 } catch (err) {
  log.error("Erreur sauvegarde devs.json", { err })
 }

}

/* -------- PERMISSIONS -------- */

function isOwner(id) {
 return id === ROOT_OWNER || devs.owners.includes(id)
}

function isDev(id) {
 return id === ROOT_OWNER || devs.devs.includes(id) || isOwner(id)
}

/* -------- TOGGLE DEV -------- */

function toggleDev(id) {

 if (devs.devs.includes(id)) {

  devs.devs = devs.devs.filter(d => d !== id)
  save()

  return false

 } else {

  devs.devs.push(id)
  save()

  return true

 }

}

module.exports = {
 isOwner,
 isDev,
 toggleDev
}