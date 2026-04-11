const fs = require("fs")
const path = require("path")
const { createCanvas, loadImage } = require("canvas")
const { SlashCommandBuilder } = require("discord.js")

const { isDev } = require("../../systems/devSystem")

const OUTPUT_DIR = path.join(__dirname, "../../generated")

module.exports = {

 data: new SlashCommandBuilder()
  .setName("generatecard")
  .setDescription("Générer une carte (dev)")
  .addAttachmentOption(o =>
   o.setName("image")
    .setDescription("Image de l'item")
    .setRequired(true)
  )
  .addAttachmentOption(o =>
   o.setName("frame")
    .setDescription("Cadre (UR etc)")
    .setRequired(true)
  ),

 async execute(interaction){

  if(!isDev(interaction.user.id))
   return interaction.reply({ content:"⛔ Commande dev.", ephemeral:true })

  await interaction.deferReply()

  const attachment = interaction.options.getAttachment("image")
  const frameAttachment = interaction.options.getAttachment("frame")

  if(!attachment || !frameAttachment)
   return interaction.editReply("❌ Image ou cadre manquant.")

  /* ───────────────────────────── */
  /* DOWNLOAD */
  /* ───────────────────────────── */

  const [itemRes, frameRes] = await Promise.all([
   fetch(attachment.url),
   fetch(frameAttachment.url)
  ])

  const itemBuffer = Buffer.from(await itemRes.arrayBuffer())
  const frameBuffer = Buffer.from(await frameRes.arrayBuffer())

  const itemImg = await loadImage(itemBuffer)
  const frameImg = await loadImage(frameBuffer)

  /* ───────────────────────────── */
  /* EXTRACT NAME */
  /* ───────────────────────────── */

  const base = attachment.name.replace(/\.[^/.]+$/, "")
  const parts = base.split("_")

  let name = parts.length >= 3
   ? parts.slice(0, -2).join(" ")
   : base.replace(/_/g, " ")

  name = name.replace(/\b\w/g, l => l.toUpperCase())

  /* ───────────────────────────── */
  /* CANVAS */
  /* ───────────────────────────── */

  const W = 1024
  const H = 1536

  const canvas = createCanvas(W, H)
  const ctx = canvas.getContext("2d")

  ctx.clearRect(0, 0, W, H) // TRANSPARENT

  /* ───────────────────────────── */
  /* FOND INTERIEUR */
  /* ───────────────────────────── */

  const ART_X = 140
  const ART_Y = 150
  const ART_W = 744
  const ART_H = 1020

  ctx.save()
  ctx.beginPath()
  ctx.roundRect(ART_X, ART_Y, ART_W, ART_H, 40)
  ctx.clip()

  const grad = ctx.createRadialGradient(
   W/2, ART_Y + ART_H/2, 50,
   W/2, ART_Y + ART_H/2, 600
  )

  grad.addColorStop(0, "#ffd86b")
  grad.addColorStop(0.2, "#ff9d1e")
  grad.addColorStop(0.5, "#8f3400")
  grad.addColorStop(1, "#2e1200")

  ctx.fillStyle = grad
  ctx.fillRect(ART_X, ART_Y, ART_W, ART_H)

  ctx.restore()

  /* ───────────────────────────── */
  /* ITEM (STRICT, PAS MODIFIÉ) */
  /* ───────────────────────────── */

  const maxW = 500
  const maxH = 500

  const ratio = Math.min(maxW/itemImg.width, maxH/itemImg.height)

  const w = itemImg.width * ratio
  const h = itemImg.height * ratio

  const x = W/2 - w/2
  const y = ART_Y + ART_H/2 - h/2

  ctx.drawImage(itemImg, x, y, w, h)

  /* ───────────────────────────── */
  /* CADRE */
  /* ───────────────────────────── */

  ctx.drawImage(frameImg, 0, 0, W, H)

  /* ───────────────────────────── */
  /* NOM */
  /* ───────────────────────────── */

  ctx.font = "bold 42px Georgia"
  ctx.textAlign = "center"
  ctx.fillStyle = "#3e2008"

  ctx.fillText(name, W/2, 1270)

  /* ───────────────────────────── */
  /* EXPORT */
  /* ───────────────────────────── */

  if(!fs.existsSync(OUTPUT_DIR))
   fs.mkdirSync(OUTPUT_DIR)

  const fileName = `${base}_generated.png`
  const outputPath = path.join(OUTPUT_DIR, fileName)

  fs.writeFileSync(outputPath, canvas.toBuffer("image/png"))

  await interaction.editReply({
   content: `✅ Carte générée : **${name}**`,
   files: [outputPath]
  })

 }

}