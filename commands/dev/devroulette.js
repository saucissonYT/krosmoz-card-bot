// commands/dev/devroulette.js
// Commande dev — Roulette sans cooldown, avec option de forcer un lot
// Accessible uniquement aux IDs listés dans data/devs.json

const { SlashCommandBuilder } = require('discord.js');
const { getUser, markDirty }  = require('../../systems/userSystem');
const {
  LOTS,
  pickLot,
  applyReward,
  buildResultEmbed,
  updateRouletteStats,
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
    let devs;
    try {
      devs = require('../../data/devs.json');
    } catch {
      return interaction.reply({ content: '❌ Impossible de charger data/devs.json.', flags: 64 });
    }

    if (!devs.includes(interaction.user.id)) {
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