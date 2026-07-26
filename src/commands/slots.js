const { SlashCommandBuilder } = require('discord.js');
const { playSlots } = require('../systems/casinoEngine');

module.exports = {
  name: 'slots',
  aliases: ['s', 'slot'],
  description: 'Play the casino slot machine with Cowoncy!',
  slashData: new SlashCommandBuilder()
    .setName('slots')
    .setDescription('Play the casino slot machine')
    .addIntegerOption(opt => opt.setName('amount').setDescription('Amount to bet').setRequired(false)),

  async executeMessage(message, args) {
    let bet = 100;
    if (args[0] && !isNaN(args[0])) {
      bet = Math.max(10, Math.min(100000, parseInt(args[0])));
    }

    const result = playSlots(message.author.id, message.author.username, bet);
    if (result.error) {
      return message.reply(`❌ ${result.error}`);
    }

    return message.reply({ embeds: [result.embed], components: result.components });
  },

  async executeSlash(interaction) {
    const bet = interaction.options.getInteger('amount') || 100;
    const result = playSlots(interaction.user.id, interaction.user.username, bet);

    if (result.error) {
      return interaction.reply({ content: `❌ ${result.error}`, ephemeral: true });
    }

    return interaction.reply({ embeds: [result.embed], components: result.components });
  }
};
