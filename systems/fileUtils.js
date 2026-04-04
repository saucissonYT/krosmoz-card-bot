/* ═══════════════════════════════════════════════════════════════
   FILE UTILS — systems/fileUtils.js

   Écriture atomique de fichiers JSON pour éviter la corruption
   en cas de crash, et lecture JSON avec fallback sécurisé.

   Usage :
     const { writeAtomic, readJsonSafe } = require("./fileUtils")
     writeAtomic("/data/guilds.json", guildsData)
     const data = readJsonSafe("/data/guilds.json", {})
═══════════════════════════════════════════════════════════════ */

const fs = require("fs")

/**
 * Écrit des données JSON dans un fichier de manière atomique.
 * Écrit d'abord dans un fichier .tmp puis renomme (rename est atomique sur la plupart des FS).
 * Cela évite la corruption si le process crash pendant l'écriture.
 *
 * @param {string} filePath - Chemin du fichier cible
 * @param {*} data - Données à sérialiser en JSON
 */
function writeAtomic(filePath, data) {

 const content = JSON.stringify(data, null, 2)
 const tmpPath = `${filePath}.tmp`

 fs.writeFileSync(tmpPath, content, "utf8")
 fs.renameSync(tmpPath, filePath)

}

/**
 * Lit un fichier JSON avec fallback en cas d'erreur ou de fichier absent.
 *
 * @param {string} filePath - Chemin du fichier
 * @param {*} fallback - Valeur par défaut si le fichier est absent, vide ou corrompu
 * @returns {*} Données parsées ou fallback
 */
function readJsonSafe(filePath, fallback) {

 if (!fs.existsSync(filePath)) {
  return JSON.parse(JSON.stringify(fallback))
 }

 try {

  const raw = fs.readFileSync(filePath, "utf8")

  if (!raw || raw.trim() === "") {
   return JSON.parse(JSON.stringify(fallback))
  }

  return JSON.parse(raw)

 } catch (err) {
  return JSON.parse(JSON.stringify(fallback))
 }

}

module.exports = { writeAtomic, readJsonSafe }