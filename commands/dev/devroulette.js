// commands/dev/devroulette.js
// Commande dev — Roulette sans cooldown, avec option de forcer un lot
// Accès contrôlé via devSystem.js (isDev)

const { SlashCommandBuilder } = require('discord.js');
const { getUser, markDirty }  = require('../../systems/userSystem');
const { isDev }               = require('../../systems/devSystem');
const {
  LOTS,
  pickLot,
  applyReward,
  buildResultEmbed,
} = require('../joueur/roulette');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('devroulette')
    .setDescription('[DEV] Roulette sans cooldown')
    .addStringOption(opt =>
      opt
        .setName('lot')
        .setDescription('Forcer un lot précis (1-31)')
        .setRequired(false)
    ),

  async execute(interaction) {
    // ─── Vérification accès dev ───────────────────────────────────────────────
    if (!isDev(interaction.user.id)) {
      return interaction.reply({ content: '❌ Accès refusé.', flags: 64 });
    }

    // ─── Tirage (avec option de forcer un lot) ────────────────────────────────
    const forcedId = parseInt(interaction.options.getString('lot'));
    const lot      = (forcedId && !isNaN(forcedId))
      ? (LOTS.find(l => l.id === forcedId) || pickLot())
      : pickLot();

    const user = getUser(interaction.user.id);
    if (!user.stats) user.stats = {};

    // ─── Attribution récompense (cooldown ignoré, stats non mises à jour) ─────
    // On applique la récompense pour tester le système, mais on ne modifie pas
    // rouletteLastSpin afin de ne pas polluer les vraies stats dev.
    await applyReward(interaction, user, lot);

    // ─── Embed résultat ───────────────────────────────────────────────────────
    const embed = buildResultEmbed(interaction.user, lot, user);

    await interaction.reply({
      content: `🛠️ **[DEV]** Lot **${lot.id}** — ${lot.emoji} ${lot.name}`,
      embeds:  [embed],
      flags:   64,
    });

    markDirty(interaction.user.id);
  },
};