/* ═══════════════════════════════════════════════════════════════
   PATHS — systems/paths.js

   Centralise la résolution du chemin de base.
   Remplace le pattern dupliqué dans dataManager, devSystem,
   guildSystem, seasonService, etc.

   Usage :
     const { getBasePath } = require("./paths")
     const BASE = getBasePath()
═══════════════════════════════════════════════════════════════ */

const fs   = require("fs")
const path = require("path")

let _base = null

function getBasePath() {

 if (_base) return _base

 /* Railway = /data (volume persistant) */
 _base = "/data"

 /* Local = ./data */
 if (!fs.existsSync(_base)) {
  _base = path.join(process.cwd(), "data")
 }

 /* Création si inexistant */
 if (!fs.existsSync(_base)) {
  fs.mkdirSync(_base, { recursive: true })
 }

 return _base

}

module.exports = { getBasePath }